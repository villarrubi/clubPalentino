import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { transaction } from './store.mjs';

const derive = promisify(scrypt);
const parameters = { N: 131072, r: 8, p: 1, maxmem: 160 * 1024 * 1024 };
export const tokenHash = (value) => createHash('sha256').update(value).digest('hex');
export const studentEmail = '@class';

export function checkPassword(password) {
  if (typeof password !== 'string' || password.length < 15 || password.length > 128)
    throw new Error('Utiliza una contraseña de entre 15 y 128 caracteres.');
}
export async function hashPassword(password) {
  checkPassword(password);
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(password, salt, 64, parameters);
  return `scrypt$${salt}$${hash.toString('hex')}`;
}
export async function verifyPassword(password, encoded) {
  const [algorithm, salt, expected] = encoded.split('$');
  if (algorithm !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(expected)) return false;
  const actual = await derive(password, salt, 64, parameters);
  return timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}
// Same work for unknown/disabled accounts; never a usable account or credential.
export const dummyHash = `scrypt$${'0'.repeat(32)}$${'0'.repeat(128)}`;

export function accountEmail(email) {
  if (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
    throw new Error('Correo electrónico no válido.');
  return email.trim().toLowerCase();
}
export async function saveAccount(db, { email, name, role, password }) {
  if (!['teacher', 'admin', 'student'].includes(role)) throw new Error('Rol no válido.');
  email = role === 'student' ? studentEmail : accountEmail(email);
  if (typeof name !== 'string' || !name.trim() || name.length > 100) throw new Error('Nombre no válido.');
  const passwordHash = await hashPassword(password);
  transaction(db, () => {
    const existing = db.prepare('SELECT id, role, active FROM users WHERE email = ?').get(email);
    if (existing) {
      if (existing.active && existing.role === 'admin' && role !== 'admin' &&
          db.prepare("SELECT count(*) AS count FROM users WHERE role = 'admin' AND active = 1").get().count <= 1)
        throw new Error('No se puede degradar al último administrador.');
      // Updating a password also revokes every session of that account.
      db.prepare('UPDATE users SET name = ?, role = ?, password_hash = ?, active = 1 WHERE id = ?')
        .run(name.trim(), role, passwordHash, existing.id);
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(existing.id);
    } else db.prepare('INSERT INTO users(id,email,name,role,password_hash) VALUES(?,?,?,?,?)')
      .run(randomUUID(), email, name.trim(), role, passwordHash);
  });
}

export function changeAccount(db, email, role) {
  email = email === studentEmail ? email : accountEmail(email);
  if (role !== undefined && !['teacher', 'admin'].includes(role)) throw new Error('Rol no válido.');
  if (email === studentEmail && role !== undefined) throw new Error('Las clases solo pueden tener rol de alumno.');
  transaction(db, () => {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) throw new Error('Cuenta inexistente.');
    if (user.active && user.role === 'admin' && role !== 'admin' &&
        db.prepare("SELECT count(*) AS count FROM users WHERE role = 'admin' AND active = 1").get().count <= 1)
      throw new Error('No se puede desactivar o degradar al último administrador.');
    if (role === undefined) db.prepare('UPDATE users SET active = 0 WHERE id = ?').run(user.id);
    else db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, user.id);
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
  });
}
