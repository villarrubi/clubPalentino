import { emitKeypressEvents } from 'node:readline';
import { backup } from 'node:sqlite';
import { resolve } from 'node:path';
import { openStore } from './store.mjs';
import { saveAccount, changeAccount, studentEmail, accountEmail } from './auth.mjs';

function hiddenPassword(label) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Usa una terminal interactiva; no se aceptan contraseñas por argumentos ni tuberías.');
  return new Promise((resolve, reject) => {
    let value = '';
    process.stdout.write(label);
    emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    const finish = (error) => {
      process.stdin.off('keypress', keypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write('\n');
      if (error) reject(error); else resolve(value);
    };
    const keypress = (text, key) => {
      if (key?.ctrl && key.name === 'c') return finish(new Error('Cancelado.'));
      if (key?.name === 'return') return finish();
      if (key?.name === 'backspace') value = [...value].slice(0, -1).join('');
      else if (text && !key?.ctrl && !/[\x00-\x1f\x7f]/.test(text) && value.length < 128) value += text;
    };
    process.stdin.on('keypress', keypress);
  });
}

process.umask(0o077);
let db;
try {
  const [command, email, role, ...names] = process.argv.slice(2);
  db = openStore();
  if (command === 'list' && !email) {
    console.table(db.prepare('SELECT email, name, role, active FROM users ORDER BY role,email').all());
  } else if (command === 'disable' && email && !role) {
    changeAccount(db, email);
    console.log('Cuenta desactivada y sesiones revocadas.');
  } else if (command === 'role' && email && role && !names.length) {
    changeAccount(db, email, role);
    console.log('Permisos actualizados y sesiones revocadas.');
  } else if (command === 'backup' && email && !role) {
    await backup(db, resolve(email));
    console.log('Copia consistente creada. Guarda este archivo cifrado fuera del servidor.');
  } else if (command === 'revoke' && email && !role) {
    if (email === 'all') db.prepare('DELETE FROM sessions').run();
    else db.prepare('DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = ?)')
      .run(email === studentEmail ? email : accountEmail(email));
    console.log('Sesiones revocadas.');
  } else if ((command === 'create' && email && ['teacher', 'admin'].includes(role) && names.length) ||
      (command === 'password' && email && !role) || (command === 'student-password' && !email)) {
    let account;
    if (command === 'student-password') account = { email: studentEmail, role: 'student', name: 'Alumno' };
    else {
      const normalized = accountEmail(email);
      const existing = db.prepare('SELECT email, role, name FROM users WHERE email = ?').get(normalized);
      if (command === 'create' && existing) throw new Error('La cuenta ya existe. Utiliza password o role.');
      if (command === 'password' && !existing) throw new Error('La cuenta no existe.');
      account = existing || { email: normalized, role, name: names.join(' ') };
    }
    const password = await hiddenPassword('Nueva contraseña (15–128 caracteres; no se muestra): ');
    if (password !== await hiddenPassword('Repite la contraseña: ')) throw new Error('Las contraseñas no coinciden.');
    await saveAccount(db, { ...account, password });
    console.log('Credencial guardada con hash; sesiones anteriores revocadas.');
  } else throw new Error(`Uso:
  npm run accounts -- create correo teacher|admin "Nombre"
  npm run accounts -- password correo
  npm run accounts -- student-password
  npm run accounts -- disable correo|@class
  npm run accounts -- role correo teacher|admin
  npm run accounts -- list
  npm run accounts -- revoke correo|@class|all
  npm run accounts -- backup /ruta/privada/copia.sqlite`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally { db?.close(); }
