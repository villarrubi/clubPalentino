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

const dir = mkdtempSync(join(tmpdir(), 'club-class-password-'));
const db = openStore(join(dir, 'club.sqlite'));
const origin = 'https://club.example.test';
const password = randomBytes(24).toString('base64url');
const replacement = randomBytes(24).toString('base64url');
let server, base;
const cookies = {};
async function request(path, method = 'GET', cookie, body, headers = {}) {
  return fetch(`${base}/api${path}`, { method, headers: {
    Origin: origin, 'X-Requested-With': 'ClubPalentino',
    ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers,
  }, body: body ? JSON.stringify(body) : undefined });
}
const change = (body, cookie = cookies.admin, headers) => request('/users/class-password', 'PATCH', cookie, body, headers);
const studentLogin = (secret) => request('/session/student', 'POST', undefined, { password: secret });
before(async () => {
  for (const role of ['student', 'teacher', 'admin']) await saveAccount(db, { email: `${role}@example.test`, role, name: role, password });
  server = createApp({ db, origin }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
  for (const role of ['student', 'teacher', 'admin']) {
    const response = role === 'student' ? await studentLogin(password)
      : await request('/session', 'POST', undefined, { email: `${role}@example.test`, password });
    assert.equal(response.status, 200);
    cookies[role] = response.headers.get('set-cookie').split(';')[0];
  }
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close(); rmSync(dir, { recursive: true, force: true });
});

test('class password requires admin authorization, CSRF and current credentials', async () => {
  const body = { password: replacement, currentPassword: password };
  for (const role of [undefined, 'student', 'teacher']) {
    assert.equal((await request('/users/class-password', 'PATCH', cookies[role], body)).status, role ? 403 : 401);
  }
  assert.equal((await change(body, cookies.admin, { Origin: 'https://evil.test' })).status, 403);
  assert.equal((await change(body, cookies.admin, { 'X-Requested-With': '' })).status, 403);
  assert.equal((await change({ ...body, currentPassword: 'wrong' })).status, 403);
  for (const invalid of [{ password: 'short' }, { password: 'a'.repeat(129) }, { password: null }, { password: undefined },
    { currentPassword: '' }, { role: 'admin' }, { active: true }, { email: 'other@example.test' }]) {
    assert.equal((await change({ ...body, ...invalid })).status, 400);
  }
  assert.equal((await request('/materials', 'GET', cookies.student)).status, 200);
});

test('class password reset revokes student sessions and old credentials but preserves staff sessions', async () => {
  const secondStudent = (await studentLogin(password)).headers.get('set-cookie').split(';')[0];
  const old = db.prepare("SELECT * FROM users WHERE email = '@class'").get();
  assert.equal((await change({ password: replacement, currentPassword: password })).status, 204);
  for (const cookie of [cookies.student, secondStudent])
    assert.equal((await request('/materials', 'GET', cookie)).status, 401);
  assert.equal((await studentLogin(password)).status, 401);
  const login = await studentLogin(replacement);
  assert.equal(login.status, 200);
  assert.equal((await login.json()).role, 'student');
  assert.equal((await request('/users', 'GET', cookies.admin)).status, 200);
  assert.equal((await request('/materials', 'GET', cookies.teacher)).status, 200);
  const updated = db.prepare("SELECT * FROM users WHERE email = '@class'").get();
  assert.equal(updated.id, old.id);
  assert.equal(updated.role, 'student');
  assert.equal(updated.active, old.active);
  assert.notEqual(updated.password_hash, old.password_hash);
  assert.notEqual(updated.password_hash, replacement);
});

test('reset cannot reactivate disabled class access or create missing access silently', async () => {
  db.prepare("UPDATE users SET active = 0 WHERE email = '@class'").run();
  assert.equal((await change({ password, currentPassword: password })).status, 204);
  assert.equal((await studentLogin(password)).status, 401);
  db.prepare("DELETE FROM users WHERE email = '@class'").run();
  assert.equal((await change({ password, currentPassword: password })).status, 409);
});
