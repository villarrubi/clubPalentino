import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { backup, DatabaseSync } from 'node:sqlite';
import sharp from 'sharp';
import { openStore } from '../store.mjs';
import { createApp } from '../app.mjs';
import { saveAccount, changeAccount, tokenHash } from '../auth.mjs';

const dir = mkdtempSync(join(tmpdir(), 'club-security-'));
const db = openStore(join(dir, 'test.sqlite'));
const origin = 'https://club.example.test';
const password = randomBytes(24).toString('base64url');
let server, base, time = Date.now();
const accounts = {};
async function request(path, { method = 'GET', cookie, json, form, headers = {} } = {}) {
  const response = await fetch(`${base}/api${path}`, {
    method, redirect: 'manual', headers: {
      Origin: origin, 'X-Requested-With': 'ClubPalentino', ...(cookie ? { Cookie: cookie } : {}),
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers,
    }, body: json !== undefined ? JSON.stringify(json) : form,
  });
  return response;
}
async function login(role, cookie) {
  const response = await request(role === 'student' ? '/session/student' : '/session', {
    method: 'POST', cookie, json: role === 'student' ? { password } : { email: `${role}@example.test`, password },
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).role, role);
  return response.headers.get('set-cookie').split(';')[0];
}
function material(name = 'clase.txt', bytes = 'Una partida de ajedrez') {
  const form = new FormData();
  for (const [key, value] of Object.entries({ title: 'Práctica', topic: 'Finales', course: 'iniciacion', section: 'exercises', block: 'Bloque 1' })) form.set(key, value);
  form.set('file', new Blob([bytes]), name);
  return form;
}
const tournament = { title: 'Torneo', date: '2026-10-02', time: '18:00', location: 'Palencia', description: '', url: 'https://example.test' };
function news(image) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ title: 'Noticia', date: '2026-10-02', summary: 'Resumen', content: '<script>alert(1)</script>', imageAlt: 'Foto', source: '', url: '' })) form.set(key, value);
  if (image) form.set('image', new Blob([image], { type: 'image/png' }), 'foto.png');
  return form;
}
before(async () => {
  for (const role of ['student', 'teacher', 'admin']) await saveAccount(db, { email: `${role}@example.test`, name: role, role, password });
  server = createApp({ db, origin, now: () => time }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
  for (const role of ['student', 'teacher', 'admin']) accounts[role] = await login(role);
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
  rmSync(dir, { recursive: true, force: true });
});

test('no default credentials; passwords and session tokens are hashed', async () => {
  const hashes = db.prepare('SELECT password_hash FROM users').all().map((u) => u.password_hash);
  assert.equal(new Set(hashes).size, 3);
  assert.ok(hashes.every((hash) => hash.startsWith('scrypt$') && !hash.includes(password)));
  const token = accounts.admin.split('=')[1];
  assert.ok(db.prepare('SELECT 1 FROM sessions WHERE token_hash = ?').get(tokenHash(token)));
  assert.equal(db.prepare('SELECT 1 FROM sessions WHERE token_hash = ?').get(token), undefined);
  assert.equal((await request('/session')).status, 200);
  assert.equal(await (await request('/session')).json(), null);
});
test('all three logins and secure cookie attributes, session fixation and logout revocation', async () => {
  const old = accounts.teacher;
  const response = await request('/session', { method: 'POST', cookie: old, json: { email: 'teacher@example.test', password } });
  const setCookie = response.headers.get('set-cookie');
  for (const part of ['__Host-club-session=', 'HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/']) assert.ok(setCookie.includes(part));
  accounts.teacher = setCookie.split(';')[0];
  assert.notEqual(accounts.teacher, old);
  assert.equal(await (await request('/session', { cookie: old })).json(), null);
  const disposable = await login('teacher');
  assert.equal((await request('/session', { method: 'DELETE', cookie: disposable })).status, 204);
  assert.equal((await request('/materials', { cookie: disposable })).status, 401);
});
test('client cannot choose a role or use class credentials for staff', async () => {
  assert.equal((await request('/session/student', { method: 'POST', json: { password, role: 'admin' } })).status, 400);
  assert.equal((await request('/session', { method: 'POST', json: { email: '@class', password } })).status, 401);
  for (const email of ['teacher@example.test', 'unknown@example.test']) {
    const response = await request('/session', { method: 'POST', json: { email, password: 'incorrect-password' } });
    assert.equal(response.status, 401);
    assert.deepEqual(await response.json(), { error: 'No se ha podido completar la solicitud.' });
  }
});
test('CSRF: reject hostile/null origins, missing custom header and cross-site reads', async () => {
  for (const headers of [{ Origin: 'https://evil.example' }, { Origin: 'null' }, { Origin: '' }, { 'X-Requested-With': '' }, { 'Sec-Fetch-Site': 'cross-site' }]) {
    assert.equal((await request('/session', { method: 'DELETE', cookie: accounts.admin, headers })).status, 403);
  }
  assert.equal((await request('/materials', { cookie: accounts.admin, headers: { Origin: 'https://evil.example' } })).status, 403);
});
test('authorization matrix is enforced on API directly, including file endpoints', async () => {
  for (const path of ['/materials', '/materials/anything/file']) assert.equal((await request(path)).status, 401);
  for (const role of [null, 'student', 'teacher']) {
    for (const resource of ['materials', 'news', 'tournaments']) {
      if (role === 'teacher' && resource === 'materials') continue;
      for (const method of ['POST', 'PATCH', 'DELETE']) {
        const path = `/${resource}${method === 'POST' ? '' : '/anything'}`;
        assert.equal((await request(path, { method, cookie: accounts[role] })).status, role ? 403 : 401, `${role} ${method} ${resource}`);
      }
    }
  }
  for (const path of ['/news', '/tournaments']) assert.equal((await request(path)).status, 200);
});
test('private materials can be uploaded, updated, downloaded and deleted without public links', async () => {
  assert.equal((await request('/materials', { method: 'POST', cookie: accounts.teacher, form: material() })).status, 204);
  const [item] = await (await request('/materials', { cookie: accounts.student })).json();
  assert.equal(item.filename, 'clase.txt');
  for (const role of ['student', 'teacher', 'admin']) {
    const response = await request(`/materials/${item.id}/file`, { cookie: accounts[role] });
    assert.equal(await response.text(), 'Una partida de ajedrez');
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.ok(response.headers.get('content-disposition').startsWith('attachment;'));
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  }
  assert.equal((await request(`/materials/${item.id}`, { method: 'PATCH', cookie: accounts.admin, form: material('otra.txt', 'Nuevo') })).status, 204);
  assert.equal(await (await request(`/materials/${item.id}/file`, { cookie: accounts.student })).text(), 'Nuevo');
  assert.equal((await request(`/materials/${item.id}`, { method: 'DELETE', cookie: accounts.teacher })).status, 204);
  assert.equal((await request(`/materials/${item.id}/file`, { cookie: accounts.admin })).status, 404);
});
test('reject fake file signatures, executable extensions, large files and invalid fields', async () => {
  for (const name of ['fake.pdf', 'virus.exe', 'photo.svg', 'fake.docx']) {
    assert.equal((await request('/materials', { method: 'POST', cookie: accounts.teacher, form: material(name) })).status, 415);
  }
  const invalid = material(); invalid.set('role', 'admin');
  assert.equal((await request('/materials', { method: 'POST', cookie: accounts.teacher, form: invalid })).status, 400);
  const large = material('large.txt', new Uint8Array(25 * 1024 * 1024 + 1));
  assert.equal((await request('/materials', { method: 'POST', cookie: accounts.teacher, form: large })).status, 413);
  const validPdf = material('clase.pdf', '%PDF-1.4\n1 0 obj\n<<>>\nendobj\n%%EOF');
  assert.equal((await request('/materials', { method: 'POST', cookie: accounts.teacher, form: validPdf })).status, 204);
});
test('admin publishes tournaments and news; validates dates/links and re-encodes pictures', async () => {
  for (const changes of [{ date: '2026-02-31' }, { time: '29:00' }, { url: 'javascript:alert(1)' }, { url: 'https://name:password@example.test' }])
    assert.equal((await request('/tournaments', { method: 'POST', cookie: accounts.admin, json: { ...tournament, ...changes } })).status, 400);
  assert.equal((await request('/tournaments', { method: 'POST', cookie: accounts.admin, json: tournament })).status, 204);
  const [item] = await (await request('/tournaments')).json();
  assert.equal((await request(`/tournaments/${item.id}`, { method: 'PATCH', cookie: accounts.admin, json: { ...tournament, title: 'Actualizado' } })).status, 204);
  assert.equal((await request(`/tournaments/${item.id}`, { method: 'DELETE', cookie: accounts.admin })).status, 204);
  const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: '#ffffff' } }).png().toBuffer();
  assert.equal((await request('/news', { method: 'POST', cookie: accounts.admin, form: news(png) })).status, 204);
  const [article] = await (await request('/news')).json();
  const image = await request(`/news/${article.id}/image`);
  assert.equal(image.headers.get('content-type'), 'image/webp');
  assert.equal((await sharp(Buffer.from(await image.arrayBuffer())).metadata()).format, 'webp');
  assert.equal((await request('/news', { method: 'POST', cookie: accounts.admin, form: news('<svg/>') })).status, 415);
  assert.equal((await request(`/news/${article.id}`, { method: 'DELETE', cookie: accounts.admin })).status, 204);
  assert.equal((await request(`/news/${article.id}/image`)).status, 404);
});
test('static service exposes neither source, credentials nor database; CSP is present', async () => {
  for (const path of ['/.env', '/server/auth.mjs', '/data/club.sqlite', '/src/repository.ts', '/.git/config']) {
    assert.equal((await fetch(`${base}${path}`)).status, 404);
  }
  const response = await fetch(`${base}/`);
  assert.equal(response.status, 200);
  assert.ok(response.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
  assert.ok(response.headers.get('strict-transport-security'));
  assert.deepEqual(await (await fetch(`${base}/config.json`)).json(), { apiBaseUrl: '/api' });
});
test('password rotation, role changes and disabling revoke existing sessions', async () => {
  await saveAccount(db, { email: 'teacher@example.test', role: 'teacher', name: 'Teacher', password });
  assert.equal((await request('/materials', { cookie: accounts.teacher })).status, 401);
  accounts.teacher = await login('teacher');
  changeAccount(db, 'teacher@example.test', 'admin');
  assert.equal((await request('/materials', { cookie: accounts.teacher })).status, 401);
  changeAccount(db, 'teacher@example.test', 'teacher');
  accounts.teacher = await login('teacher');
  changeAccount(db, 'teacher@example.test');
  assert.equal((await request('/materials', { cookie: accounts.teacher })).status, 401);
  await saveAccount(db, { role: 'student', name: 'Alumno', password });
  assert.equal((await request('/materials', { cookie: accounts.student })).status, 401);
  assert.throws(() => changeAccount(db, 'admin@example.test'), /último administrador/);
});
test('persistent account limiter rejects repeated attempts without leaking credentials', async () => {
  // Seed the durable counter to exercise the rejection without spending 10 expensive hashes.
  db.prepare('INSERT OR REPLACE INTO login_limits(key,attempts,reset_at) VALUES(?,?,?)')
    .run(tokenHash('admin@example.test'), 10, time + 60000);
  const response = await request('/session', { method: 'POST', json: { email: 'admin@example.test', password } });
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get('retry-after')) > 0);
});
test('consistent backup restores accounts and private files while database is open', async () => {
  const filename = join(dir, 'backup.sqlite');
  await backup(db, filename);
  const restored = new DatabaseSync(filename);
  try {
    assert.equal(restored.prepare('PRAGMA integrity_check').get().integrity_check, 'ok');
    assert.deepEqual(restored.prepare('SELECT email,role,password_hash FROM users ORDER BY email').all(),
      db.prepare('SELECT email,role,password_hash FROM users ORDER BY email').all());
    assert.deepEqual(restored.prepare('SELECT id,metadata,file FROM entries ORDER BY id').all(),
      db.prepare('SELECT id,metadata,file FROM entries ORDER BY id').all());
  } finally { restored.close(); }
});
test('idle expiry and absolute expiry are checked at every authenticated request', async () => {
  time += 31 * 60000;
  assert.equal((await request('/materials', { cookie: accounts.admin })).status, 401);
  accounts.admin = await login('admin');
  for (let i = 0; i < 24; i++) {
    time += 20 * 60000;
    assert.equal((await request('/materials', { cookie: accounts.admin })).status, i === 23 ? 401 : 200);
  }
});
