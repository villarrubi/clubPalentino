import express from 'express';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { randomBytes, randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { dummyHash, studentEmail, tokenHash, verifyPassword, accountEmail } from './auth.mjs';
import { HttpError, materialFile, newsImage, validateEntry } from './validation.mjs';

const hour = 60 * 60 * 1000;
const sessionLifetime = 8 * hour;
const idleLifetime = 30 * 60 * 1000;

export function createApp({ db, origin, production = true, trustProxy = false, dist = resolve('dist'), now = Date.now }) {
  const parsedOrigin = new URL(origin);
  if (parsedOrigin.origin !== origin || parsedOrigin.username || parsedOrigin.password ||
      (production ? parsedOrigin.protocol !== 'https:' :
        !['http:', 'https:'].includes(parsedOrigin.protocol) || !['localhost', '127.0.0.1'].includes(parsedOrigin.hostname)))
    throw new Error('APP_ORIGIN debe ser un origen HTTPS exacto; desarrollo solo admite localhost.');
  const cookieName = production ? '__Host-club-session' : 'club-session-dev';
  const cookieOptions = { httpOnly: true, secure: production, sameSite: 'strict', path: '/' };
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', trustProxy);
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer',
      'X-Frame-Options': 'DENY', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
    });
    if (production) res.set('Strict-Transport-Security', 'max-age=31536000');
    next();
  });
  app.get('/healthz', (_req, res) => { db.prepare('SELECT 1').get(); res.json({ ok: true }); });
  const api = express.Router();
  app.use('/api', api);
  api.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  // No CORS: the supported production deployment is strictly same-origin.
  api.use((req, _res, next) => {
    if ((req.get('origin') && req.get('origin') !== origin) || req.get('sec-fetch-site') === 'cross-site')
      throw new HttpError(403);
    if (!['GET', 'HEAD'].includes(req.method) &&
        (req.get('origin') !== origin || req.get('x-requested-with') !== 'ClubPalentino')) throw new HttpError(403);
    next();
  });
  api.use(rateLimit({ windowMs: 60000, limit: 300, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Demasiadas solicitudes. Espera un minuto.' } }));

  function readToken(req) {
    const values = (req.get('cookie') || '').split(';').map((part) => part.trim()).filter((part) => part.startsWith(`${cookieName}=`));
    if (values.length !== 1) return '';
    const value = values[0].slice(cookieName.length + 1);
    return /^[a-f0-9]{64}$/.test(value) ? value : '';
  }
  let lastCleanup = 0;
  api.use((req, _res, next) => {
    const time = now();
    if (time - lastCleanup > 60000) {
      db.prepare('DELETE FROM sessions WHERE expires <= ? OR touched <= ?').run(time, time - idleLifetime);
      db.prepare('DELETE FROM login_limits WHERE reset_at <= ?').run(time);
      lastCleanup = time;
    }
    req.sessionHash = tokenHash(readToken(req));
    req.account = db.prepare(`SELECT u.id, u.name, u.role FROM sessions s JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires > ? AND s.touched > ? AND u.active = 1`)
      .get(req.sessionHash, time, time - idleLifetime);
    if (req.account) db.prepare('UPDATE sessions SET touched = ? WHERE token_hash = ?').run(time, req.sessionHash);
    next();
  });
  const session = (user) => user ? { name: user.name, role: user.role } : null;
  const allow = (...roles) => (req, _res, next) => {
    if (!req.account) throw new HttpError(401);
    if (!roles.includes(req.account.role)) throw new HttpError(403);
    next();
  };
  api.get('/session', (req, res) => res.json(session(req.account)));
  api.delete('/session', (req, res) => {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(req.sessionHash);
    res.clearCookie(cookieName, cookieOptions).status(204).end();
  });
  const loginIpLimit = rateLimit({ windowMs: 15 * 60000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Demasiados intentos. Espera quince minutos.' } });
  let hashing = 0;
  const login = (student) => async (req, res) => {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).some((key) => !(student ? ['password'] : ['email', 'password']).includes(key)) ||
        typeof body.password !== 'string' || body.password.length > 128 || !body.password.length) throw new HttpError(400);
    let email = studentEmail;
    if (!student) { try { email = accountEmail(body.email); } catch { throw new HttpError(401); } }
    // Persistent counters survive restarts. Class counter includes IP to avoid locking out an entire class.
    const key = tokenHash(student ? `${studentEmail}:${req.ip}` : email);
    const time = now();
    const limit = db.prepare('SELECT * FROM login_limits WHERE key = ?').get(key);
    if (limit && limit.reset_at > time && limit.attempts >= (student ? 20 : 10)) {
      res.set('Retry-After', String(Math.ceil((limit.reset_at - time) / 1000)));
      throw new HttpError(429);
    }
    if (hashing >= 2) throw new HttpError(503);
    db.prepare(`INSERT INTO login_limits(key, attempts, reset_at) VALUES(?,1,?) ON CONFLICT(key)
      DO UPDATE SET attempts = CASE WHEN reset_at <= ? THEN 1 ELSE attempts + 1 END,
      reset_at = CASE WHEN reset_at <= ? THEN excluded.reset_at ELSE reset_at END`).run(key, time + 15 * 60000, time, time);
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    hashing++;
    let valid;
    try { valid = await verifyPassword(body.password, user?.active ? user.password_hash : dummyHash); }
    finally { hashing--; }
    if (!valid || !user?.active || (student ? user.role !== 'student' : !['teacher', 'admin'].includes(user.role)))
      throw new HttpError(401);
    // Recheck after async hashing so disable/password change cannot race login.
    const current = db.prepare('SELECT * FROM users WHERE id = ? AND active = 1').get(user.id);
    if (!current || current.password_hash !== user.password_hash || current.role !== user.role) throw new HttpError(401);
    db.prepare('DELETE FROM login_limits WHERE key = ?').run(key);
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(req.sessionHash);
    const token = randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions(token_hash,user_id,expires,touched) VALUES(?,?,?,?)')
      .run(tokenHash(token), user.id, now() + sessionLifetime, now());
    res.cookie(cookieName, token, { ...cookieOptions, maxAge: sessionLifetime }).json(session(user));
  };
  api.post('/session', loginIpLimit, express.json({ limit: '2kb', type: 'application/json' }), login(false));
  api.post('/session/student', loginIpLimit, express.json({ limit: '2kb', type: 'application/json' }), login(true));

  const allRoles = ['student', 'teacher', 'admin'];
  api.get('/materials', allow(...allRoles), (_req, res) => res.json(list('materials')));
  api.get('/tournaments', (_req, res) => res.json(list('tournaments')));
  api.get('/news', (_req, res) => res.json(list('news')));
  function list(kind) {
    return db.prepare('SELECT metadata FROM entries WHERE kind = ?').all(kind).map((row) => JSON.parse(row.metadata));
  }
  function entry(kind, id) {
    const row = db.prepare('SELECT * FROM entries WHERE kind = ? AND id = ?').get(kind, id);
    if (!row) throw new HttpError(404);
    return row;
  }
  api.get('/materials/:id/file', allow(...allRoles), (req, res) => {
    const row = entry('materials', req.params.id);
    const data = JSON.parse(row.metadata);
    res.set('Content-Disposition', `attachment; filename="material.${data.filename.split('.').pop()}"; filename*=UTF-8''${encodeURIComponent(data.filename).replace(/['()]/g, (c) => '%' + c.charCodeAt(0).toString(16))}`);
    res.type('application/octet-stream').send(Buffer.from(row.file));
  });
  api.get('/news/:id/image', (req, res) => {
    const row = entry('news', req.params.id);
    if (!row.file) throw new HttpError(404);
    res.type('image/webp').send(Buffer.from(row.file));
  });
  // Bound concurrent buffering/decoding before the multipart parser allocates memory.
  let uploads = 0;
  function uploadSlot(_req, res, next) {
    if (uploads >= 2) throw new HttpError(503);
    uploads++;
    res.once('close', () => { uploads--; });
    next();
  }
  for (const kind of ['materials', 'news', 'tournaments']) {
    const permission = allow(...(kind === 'materials' ? ['teacher', 'admin'] : ['admin']));
    const parse = kind === 'tournaments' ? express.json({ limit: '32kb' }) : multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: (kind === 'materials' ? 25 : 5) * 1024 * 1024, files: 1, fields: 10, parts: 11, fieldSize: 24000, fieldNameSize: 100 },
    }).single(kind === 'materials' ? 'file' : 'image');
    const save = async (req, res) => {
      const previous = req.params.id ? entry(kind, req.params.id) : null;
      const id = previous?.id || randomUUID();
      const old = previous ? JSON.parse(previous.metadata) : {};
      const input = validateEntry(kind, req.body);
      let file = previous?.file ?? null;
      let mime = previous?.mime ?? null;
      const data = { ...input, id, updatedAt: new Date(now()).toISOString() };
      if (kind === 'materials') {
        if (req.file) {
          const parsed = await materialFile(req.file);
          file = parsed.bytes; mime = parsed.mime;
          data.filename = parsed.filename; data.size = parsed.size;
        } else {
          if (!previous) throw new HttpError(400);
          data.filename = old.filename; data.size = old.size;
        }
      } else if (kind === 'news') {
        if (req.file) { const parsed = await newsImage(req.file); file = parsed.bytes; mime = parsed.mime; }
        if (file && !input.imageAlt) throw new HttpError(400);
        data.imageUrl = file ? `/api/news/${id}/image` : '';
      }
      // Recheck authorization after asynchronous file inspection.
      const current = db.prepare(`SELECT u.role FROM users u JOIN sessions s ON s.user_id = u.id
        WHERE s.token_hash = ? AND u.active = 1 AND s.expires > ? AND s.touched > ?`)
        .get(req.sessionHash, now(), now() - idleLifetime);
      if (!current) throw new HttpError(401);
      if (!(kind === 'materials' ? ['teacher', 'admin'] : ['admin']).includes(current.role)) throw new HttpError(403);
      // Metadata and binary commit together, so replacement/deletion cannot leave public or orphan files.
      if (previous) {
        const changed = db.prepare('UPDATE entries SET metadata = ?, file = ?, mime = ? WHERE id = ? AND kind = ?')
          .run(JSON.stringify(data), file, mime, id, kind);
        if (!changed.changes) throw new HttpError(404);
      } else db.prepare('INSERT INTO entries(id,kind,metadata,file,mime) VALUES(?,?,?,?,?)').run(id, kind, JSON.stringify(data), file, mime);
      res.status(204).end();
    };
    api.post(`/${kind}`, permission, uploadSlot, parse, save);
    api.patch(`/${kind}/:id`, permission, uploadSlot, parse, save);
    api.delete(`/${kind}/:id`, permission, (req, res) => {
      const result = db.prepare('DELETE FROM entries WHERE kind = ? AND id = ?').run(kind, req.params.id);
      if (!result.changes) throw new HttpError(404);
      res.status(204).end();
    });
  }
  api.use((_req, _res, next) => next(new HttpError(404)));
  app.get('/config.json', (_req, res) => res.set('Cache-Control', 'no-store').json({ apiBaseUrl: '/api' }));
  app.use(express.static(dist, { dotfiles: 'deny', index: 'index.html', setHeaders: (res) => res.set('Cache-Control', 'no-cache') }));
  app.use((_req, res) => res.status(404).json({ error: 'No encontrado.' }));
  app.use((error, _req, res, _next) => {
    const status = error instanceof HttpError ? error.status : error instanceof multer.MulterError
      ? (error.code === 'LIMIT_FILE_SIZE' ? 413 : 400) : [400, 413, 415].includes(error.status) ? error.status : 500;
    // Do not log bodies, credentials, cookies, uploaded names or raw exception messages.
    if (status === 500) console.error('Error interno del servicio.');
    res.status(status).json({ error: status === 500 ? 'Error interno.' : 'No se ha podido completar la solicitud.' });
  });
  return app;
}
