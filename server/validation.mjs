import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';

export class HttpError extends Error {
  constructor(status, message = 'Solicitud no válida.') { super(message); this.status = status; }
}
export function fields(input, limits, required = []) {
  if (!input || typeof input !== 'object' || Array.isArray(input) ||
      Object.keys(input).some((key) => !Object.hasOwn(limits, key))) throw new HttpError(400);
  const result = {};
  for (const [key, max] of Object.entries(limits)) {
    const value = input[key] ?? '';
    if (typeof value !== 'string' || value.length > max || value.includes('\0')) throw new HttpError(400);
    result[key] = value.trim();
    if (required.includes(key) && !result[key]) throw new HttpError(400);
  }
  return result;
}
function date(value) {
  const parsed = new Date(`${value}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value)
    throw new HttpError(400);
}
function link(value) {
  if (!value) return;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
  } catch { throw new HttpError(400); }
}
export function validateEntry(kind, input) {
  if (kind === 'materials') {
    const data = fields(input, { title: 160, topic: 80, course: 20, section: 20, block: 80 }, ['title', 'topic', 'course', 'section']);
    if (!['iniciacion', 'avanzado'].includes(data.course) || !['syllabus', 'exercises', 'resources'].includes(data.section) ||
        (data.section === 'exercises' && !data.block)) throw new HttpError(400);
    if (data.section !== 'exercises') data.block = '';
    return data;
  }
  const data = kind === 'news'
    ? fields(input, { title: 160, date: 10, summary: 300, content: 20000, imageAlt: 200, source: 100, url: 2048 }, ['title', 'date', 'summary', 'content'])
    : fields(input, { title: 160, date: 10, time: 5, location: 200, description: 3000, url: 2048 }, ['title', 'date', 'location']);
  date(data.date); link(data.url);
  if (kind === 'tournaments' && data.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time)) throw new HttpError(400);
  return data;
}

const mimeByExtension = {
  pdf: 'application/pdf', ppt: 'application/vnd.ms-powerpoint', doc: 'application/msword',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  odt: 'application/vnd.oasis.opendocument.text', odp: 'application/vnd.oasis.opendocument.presentation',
  zip: 'application/zip', txt: 'text/plain', pgn: 'application/x-chess-pgn',
};
export async function materialFile(file) {
  if (!file || !file.size || file.size > 25 * 1024 * 1024) throw new HttpError(400);
  const filename = file.originalname.replace(/.*[/\\]/, '').replace(/[\x00-\x1f\x7f"<>:|?*]/g, '_').slice(-180);
  const extension = filename.split('.').pop().toLowerCase();
  if (!Object.hasOwn(mimeByExtension, extension)) throw new HttpError(415);
  let detected;
  try { detected = await fileTypeFromBuffer(file.buffer); }
  catch { throw new HttpError(415); }
  if (extension === 'txt' || extension === 'pgn') {
    try { new TextDecoder('utf-8', { fatal: true }).decode(file.buffer); }
    catch { throw new HttpError(415); }
    if (file.buffer.includes(0)) throw new HttpError(415);
  } else if (['doc', 'ppt'].includes(extension)) {
    if (detected?.ext !== 'cfb') throw new HttpError(415);
  } else if (detected?.ext !== extension) throw new HttpError(415);
  // Browser MIME is advisory; the content signature determines the served type.
  return { filename, size: file.size, bytes: file.buffer, mime: mimeByExtension[extension] };
}
export async function newsImage(file) {
  if (!file.size || file.size > 5 * 1024 * 1024) throw new HttpError(413);
  let detected;
  try { detected = await fileTypeFromBuffer(file.buffer); }
  catch { throw new HttpError(415); }
  if (!['jpg', 'png', 'webp'].includes(detected?.ext)) throw new HttpError(415);
  try {
    // Decode and re-encode: strips EXIF, extra payloads and unsupported/animated formats.
    const bytes = await sharp(file.buffer, { limitInputPixels: 24000000, animated: false })
      .rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
    return { bytes, mime: 'image/webp' };
  } catch { throw new HttpError(415); }
}
