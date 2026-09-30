import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { openStore } from '../store.mjs';
import { createApp } from '../app.mjs';
import { saveAccount } from '../auth.mjs';

const dir = mkdtempSync(join(tmpdir(), 'club-users-'));
const db = openStore(join(dir, 'club.sqlite'));
const origin = 'https://club.example.test';
const password = randomBytes(24).toString('base64url');
const newPassword = randomBytes(24).toString('base64url');
let server, base;
const cookies = {};
async function request(path, method = 'GET', cookie, body, headers = {}) {
  return fetch(`${base}/api${path}`, { method, headers: { Origin: origin, 'X-Requested-With': 'ClubPalentino',
    ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined });
}
async function login(email, secret = password) {
  return request(email === 'student' ? '/session/student' : '/session', 'POST', undefined,
    email === 'student' ? { password: secret } : { email, password: secret });
}
const cookieOf = (response) => response.headers.get('set-cookie').split(';')[0];
const idOf = (email) => db.prepare('SELECT id FROM users WHERE email = ?').get(email).id;
const createBody = (email) => ({ email, name: 'Nueva cuenta', role: 'teacher', password: newPassword, currentPassword: password });
before(async () => {
  for (const role of ['student', 'teacher', 'admin']) await saveAccount(db, { email: `${role}@example.test`, role, name: role, password });
  server = createApp({ db, origin }).listen(0, '127.0.0.1');
  await once(server, 'listening'); base = `http://127.0.0.1:${server.address().port}`;
  for (const role of ['student', 'teacher', 'admin']) cookies[role] = cookieOf(await login(role === 'student' ? role : `${role}@example.test`));
});
after(async () => { await new Promise((resolve) => server.close(resolve)); db.close(); rmSync(dir, { recursive: true, force: true }); });

test('only administrators may list, create or modify accounts, with CSRF enforced', async () => {
  for (const role of [undefined, 'student', 'teacher']) {
    for (const [method, path] of [['GET', '/users'], ['POST', '/users'], ['PATCH', `/users/${idOf('admin@example.test')}`]])
      assert.equal((await request(path, method, cookies[role], method === 'GET' ? undefined : {})).status, role ? 403 : 401);
  }
  assert.equal((await request('/users', 'POST', cookies.admin, createBody('csrf@example.test'), { Origin: 'https://evil.test' })).status, 403);
  assert.equal((await request('/users', 'POST', cookies.admin, createBody('csrf@example.test'), { 'X-Requested-With': '' })).status, 403);
});
test('listing excludes class access, hashes, secrets and session tokens', async () => {
  const response = await request('/users', 'GET', cookies.admin);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const rows = await response.json();
  assert.equal(rows.length, 2);
  for (const row of rows) {
    assert.deepEqual(Object.keys(row).sort(), ['active', 'email', 'id', 'isCurrent', 'name', 'role']);
    assert.equal(row.isCurrent, row.role === 'admin');
  }
});
test('create validates fields, requires admin password and never upserts duplicates', async () => {
  for (const changes of [{ role: 'student' }, { role: 'owner' }, { active: true }, { id: 'chosen' }, { password: 'short' }, { name: [] }, { currentPassword: '' }])
    assert.equal((await request('/users', 'POST', cookies.admin, { ...createBody('new@example.test'), ...changes })).status, 400);
  assert.equal((await request('/users', 'POST', cookies.admin, { ...createBody('new@example.test'), currentPassword: 'wrong' })).status, 403);
  assert.equal((await request('/users', 'POST', cookies.admin, createBody(' NEW@EXAMPLE.TEST '))).status, 204);
  assert.equal((await login('new@example.test', newPassword)).status, 200);
  const oldHash = db.prepare('SELECT password_hash FROM users WHERE email = ?').get('new@example.test').password_hash;
  assert.equal((await request('/users', 'POST', cookies.admin, createBody('new@example.test'))).status, 409);
  assert.equal(db.prepare('SELECT password_hash FROM users WHERE email = ?').get('new@example.test').password_hash, oldHash);
});
test('updates revoke sessions; disabling blocks login; reset does not silently reactivate', async () => {
  const id = idOf('new@example.test');
  const first = cookieOf(await login('new@example.test', newPassword));
  assert.equal((await request(`/users/${id}`, 'PATCH', cookies.admin, { role: 'admin', name: 'Nuevo admin', currentPassword: password })).status, 204);
  assert.equal(await (await request('/session', 'GET', first)).json(), null);
  const secondResponse = await login('new@example.test', newPassword);
  assert.equal((await secondResponse.json()).role, 'admin');
  const second = cookieOf(secondResponse);
  assert.equal((await request(`/users/${id}`, 'PATCH', cookies.admin, { active: false, currentPassword: password })).status, 204);
  assert.equal((await request('/users', 'GET', second)).status, 401);
  assert.equal((await login('new@example.test', newPassword)).status, 401);
  assert.equal((await request(`/users/${id}`, 'PATCH', cookies.admin, { password, currentPassword: password })).status, 204);
  assert.equal((await login('new@example.test', password)).status, 401);
  assert.equal((await request(`/users/${id}`, 'PATCH', cookies.admin, { active: true, role: 'teacher', currentPassword: password })).status, 204);
  assert.equal((await login('new@example.test', password)).status, 200);
  assert.equal((await login('new@example.test', newPassword)).status, 401);
});
test('protects last administrator, self permissions and class account from manipulation', async () => {
  const id = idOf('admin@example.test');
  for (const changes of [{ role: 'teacher' }, { active: false }]) {
    const response = await request(`/users/${id}`, 'PATCH', cookies.admin, { ...changes, currentPassword: password });
    assert.equal(response.status, 409);
    assert.match((await response.json()).error, /administrador activo/);
  }
  assert.equal((await request(`/users/${idOf('@class')}`, 'PATCH', cookies.admin, { role: 'admin', currentPassword: password })).status, 404);
  assert.equal((await request(`/users/${id}`, 'PATCH', cookies.admin, { email: 'changed@example.test', currentPassword: password })).status, 400);
  assert.equal((await request(`/users/${id}`, 'PATCH', cookies.admin, { active: 'false', currentPassword: password })).status, 400);
});
test('concurrent demotions cannot be performed by a revoked administrator session', async () => {
  for (const email of ['a@example.test', 'b@example.test']) await saveAccount(db, { email, name: email, role: 'admin', password });
  const a = cookieOf(await login('a@example.test')), b = cookieOf(await login('b@example.test'));
  const responses = await Promise.all([
    request(`/users/${idOf('b@example.test')}`, 'PATCH', a, { role: 'teacher', currentPassword: password }),
    request(`/users/${idOf('a@example.test')}`, 'PATCH', b, { role: 'teacher', currentPassword: password }),
  ]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [204, 401]);
});
test('changing own password invalidates current session and old credentials', async () => {
  // Another admin now exists, but self demotion remains forbidden.
  const id = idOf('admin@example.test');
  assert.equal((await request(`/users/${id}`, 'PATCH', cookies.admin, { role: 'teacher', currentPassword: password })).status, 409);
  assert.equal((await request(`/users/${id}`, 'PATCH', cookies.admin, { password: newPassword, currentPassword: password })).status, 204);
  assert.equal((await request('/users', 'GET', cookies.admin)).status, 401);
  assert.equal((await login('admin@example.test', password)).status, 401);
  assert.equal((await login('admin@example.test', newPassword)).status, 200);
});
