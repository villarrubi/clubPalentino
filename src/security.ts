export const sessionExpiredEvent = 'palentino-session-expired';

export function publicLink(value: string): string {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

export function publicImage(value: string): string {
  if (!value) return '';
  // Preserve old local raster photos, never SVG/HTML data URLs.
  if (/^data:image\/(?:jpeg|png|webp);base64,[a-z\d+/=]+$/i.test(value)) return value;
  try {
    const url = new URL(value, location.origin);
    if (url.username || url.password) return '';
    return url.protocol === 'https:' || (url.origin === location.origin && url.protocol === 'http:') ? url.href : '';
  } catch { return ''; }
}
