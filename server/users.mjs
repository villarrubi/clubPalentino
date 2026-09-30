import express from 'express';
import { randomUUID } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';
import { accountEmail, checkPassword, hashPassword, studentEmail, verifyPassword } from './auth.mjs';
import { transaction } from './store.mjs';
import { HttpError } from './validation.mjs';

// Only deliberately authored account-management messages may be returned to the UI.
export class AccountError extends HttpError {}

export function userRoutes({ db, allowAdmin, runHash, now }) {
  const router = express.Router();
  router.use(allowAdmin);
  const publicUser = (row, actor) => ({ id: row.id, email: row.email, name: row.name,
    role: row.role, active: Boolean(row.active), isCurrent: row.id === actor });
  router.get('/', (req, res) => {
    const rows = db.prepare("SELECT id,email,name,role,active FROM users WHERE role IN ('teacher','admin') ORDER BY name,email").all();
    res.json(rows.map((row) => publicUser(row, req.account.id)));
  });
  router.use(rateLimit({ windowMs: 15 * 60000, limit: 30, keyGenerator: (req) => req.account.id,
    standardHeaders: 'draft-8', legacyHeaders: false, message: { error: 'Demasiados cambios. Espera unos minutos.' } }));
  router.use(express.json({ limit: '4kb' }));

  function actor(req) {
    const user = db.prepare(`SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id
      WHERE s.token_hash = ? AND s.expires > ? AND s.touched > ? AND u.active = 1`)
      .get(req.sessionHash, now(), now() - 30 * 60000);
    if (!user) throw new HttpError(401);
    if (user.role !== 'admin') throw new HttpError(403);
    return user;
  }
  function validate(body, creating, classes) {
    const keys = classes ? ['password', 'currentPassword'] : creating ? ['email', 'name', 'role', 'password', 'currentPassword'] : ['name', 'role', 'active', 'password', 'currentPassword'];
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some((key) => !keys.includes(key)))
      throw new AccountError(400, 'Los datos de la cuenta no son válidos.');
    if (typeof body.currentPassword !== 'string' || !body.currentPassword || body.currentPassword.length > 128)
      throw new AccountError(400, 'Introduce tu contraseña actual para confirmar el cambio.');
    if (!creating && !['name', 'role', 'active', 'password'].some((key) => Object.hasOwn(body, key)))
      throw new AccountError(400, 'No hay cambios que guardar.');
    const data = {};
    if (creating || Object.hasOwn(body, 'name')) {
      if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 100 || /[\x00-\x1f\x7f]/.test(body.name))
        throw new AccountError(400, 'Indica un nombre de hasta 100 caracteres.');
      data.name = body.name.trim();
    }
    if (creating || Object.hasOwn(body, 'role')) {
      if (!['teacher', 'admin'].includes(body.role)) throw new AccountError(400, 'Selecciona profesor o administrador.');
      data.role = body.role;
    }
    if (Object.hasOwn(body, 'active')) {
      if (typeof body.active !== 'boolean') throw new AccountError(400, 'Estado de cuenta no válido.');
      data.active = Number(body.active);
    }
    if (creating) {
      try { data.email = accountEmail(body.email); } catch { throw new AccountError(400, 'Correo electrónico no válido.'); }
    }
    if (creating || classes || Object.hasOwn(body, 'password')) {
      try { checkPassword(body.password); } catch { throw new AccountError(400, 'La nueva contraseña debe tener entre 15 y 128 caracteres.'); }
      data.password = body.password;
    }
    return data;
  }
  const save = (creating, classes = false) => async (req, res) => {
    const data = validate(req.body, creating, classes);
    const authenticated = actor(req);
    if (!await runHash(() => verifyPassword(req.body.currentPassword, authenticated.password_hash)))
      throw new AccountError(403, 'Tu contraseña actual no es correcta.');
    const newHash = data.password === undefined ? undefined : await runHash(() => hashPassword(data.password));
    transaction(db, () => {
      // Authorization and account state are checked again after expensive async work.
      const current = actor(req);
      if (current.password_hash !== authenticated.password_hash) throw new HttpError(401);
      if (classes) {
        const user = db.prepare("SELECT id FROM users WHERE email = ? AND role = 'student'").get(studentEmail);
        if (!user) throw new AccountError(409, 'El acceso del alumnado aún no está configurado.');
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
        db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
      } else if (creating) {
        if (db.prepare('SELECT id FROM users WHERE email = ?').get(data.email))
          throw new AccountError(409, 'Ya existe una cuenta con ese correo, aunque esté desactivada.');
        db.prepare('INSERT INTO users(id,email,name,role,password_hash) VALUES(?,?,?,?,?)')
          .run(randomUUID(), data.email, data.name, data.role, newHash);
      } else {
        const user = db.prepare("SELECT * FROM users WHERE id = ? AND role IN ('teacher','admin')").get(req.params.id);
        if (!user) throw new HttpError(404);
        const role = data.role ?? user.role;
        const active = data.active ?? user.active;
        if (user.active && user.role === 'admin' && (role !== 'admin' || !active) &&
            db.prepare("SELECT count(*) AS count FROM users WHERE role = 'admin' AND active = 1").get().count <= 1)
          throw new AccountError(409, 'Debe quedar al menos un administrador activo.');
        if (user.id === current.id && (role !== 'admin' || !active))
          throw new AccountError(409, 'No puedes desactivar tu propia cuenta ni quitarte el rol de administrador.');
        db.prepare('UPDATE users SET name = ?, role = ?, active = ?, password_hash = ? WHERE id = ?')
          .run(data.name ?? user.name, role, active, newHash ?? user.password_hash, user.id);
        db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
      }
    });
    res.status(204).end();
  };
  router.post('/', save(true));
  router.patch('/class-password', save(false, true));
  router.patch('/:id', save(false));
  return router;
}
