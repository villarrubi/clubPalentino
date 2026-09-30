import { useEffect, useState, type FormEvent } from 'react';
import { Plus, MagnifyingGlass } from '@phosphor-icons/react';
import { useClub } from './context';
import { ErrorMessage, Loading, Modal } from './components';
import { roleNames, type StaffUser, type StaffUserChanges } from './types';
import { sessionExpiredEvent } from './security';

type Editor = { mode: 'create' } | { mode: 'edit' | 'password' | 'status'; user: StaffUser };

function UserForm({ editor, done, pending }: { editor: Editor; done: () => void; pending: (busy: boolean) => void }) {
  const { repository, notify } = useClub();
  const user = editor.mode === 'create' ? undefined : editor.user;
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'teacher' | 'admin'>(user?.role ?? 'teacher');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const needsPassword = editor.mode === 'create' || editor.mode === 'password';
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    if (needsPassword && password !== repeat) { setError('Las nuevas contraseñas no coinciden.'); return; }
    setBusy(true); pending(true);
    try {
      if (editor.mode === 'create') await repository.createUser({ name, email, role, password, currentPassword });
      else {
        const changes: StaffUserChanges = editor.mode === 'edit' ? { name, role, currentPassword }
          : editor.mode === 'password' ? { password, currentPassword } : { active: !editor.user.active, currentPassword };
        await repository.updateUser(editor.user.id, changes);
      }
      if (user?.isCurrent) {
        window.dispatchEvent(new Event(sessionExpiredEvent));
        location.hash = '/acceso-equipo';
        notify('Cuenta actualizada. Vuelve a entrar con tus credenciales.');
      } else notify(editor.mode === 'create' ? 'Cuenta creada. Facilita las credenciales a su titular por un canal privado.' : 'Cuenta actualizada y sesiones anteriores cerradas.');
      done();
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); pending(false); setPassword(''); setRepeat(''); setCurrentPassword(''); }
  }
  return <form className="editor-form" onSubmit={submit}>
    {(editor.mode === 'create' || editor.mode === 'edit') && <>
      <label>Nombre<input required autoFocus maxLength={100} autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} disabled={busy} /></label>
      {editor.mode === 'create' ? <label>Correo electrónico<input required type="email" maxLength={254} autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} /></label>
        : <p className="field-help">Correo de acceso: {user?.email}</p>}
      <label>Rol<select value={role} onChange={(e) => setRole(e.target.value as 'teacher' | 'admin')} disabled={busy || user?.isCurrent}>
        <option value="teacher">Profesor</option><option value="admin">Administrador</option>
      </select></label>
      <p className="field-help">El profesor gestiona materiales. El administrador también gestiona noticias, torneos y usuarios.</p>
    </>}
    {editor.mode === 'status' && <p>{user?.active
      ? <>Se desactivará la cuenta de <strong>{user.name}</strong> y se cerrarán sus sesiones. Sus materiales seguirán disponibles.</>
      : <>Se reactivará la cuenta de <strong>{user?.name}</strong>. Podrá entrar con su contraseña existente; puedes restablecerla desde la lista.</>}</p>}
    {needsPassword && <>
      <label>Nueva contraseña<input required type="password" minLength={15} maxLength={128} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy} aria-describedby="new-password-help" /></label>
      <p className="field-help" id="new-password-help">Entre 15 y 128 caracteres. No se envía ningún correo automático ni se podrá consultar la contraseña después.</p>
      <label>Repite la nueva contraseña<input required type="password" minLength={15} maxLength={128} autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} disabled={busy} /></label>
    </>}
    {user?.isCurrent && <p className="field-help">Estás modificando tu cuenta. Al guardar, tendrás que volver a iniciar sesión.</p>}
    <label>Tu contraseña actual de administrador<input required type="password" maxLength={128} autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} disabled={busy} aria-describedby="confirm-user-help" /></label>
    <p className="field-help" id="confirm-user-help">Confirma tu identidad para cambiar los accesos del club.</p>
    <ErrorMessage>{error}</ErrorMessage>
    <div className="form-actions">
      <button type="button" className="button button-secondary" onClick={done} disabled={busy}>Cancelar</button>
      <button className={`button ${editor.mode === 'status' && user?.active ? 'button-danger' : ''}`} disabled={busy}>
        {busy ? 'Guardando…' : editor.mode === 'create' ? 'Crear cuenta' : editor.mode === 'status' ? user?.active ? 'Desactivar cuenta' : 'Reactivar cuenta' : 'Guardar cambios'}
      </button>
    </div>
  </form>;
}

export function UsersPanel() {
  const { repository } = useClub();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [revision, setRevision] = useState(0);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    repository.users().then((items) => { if (active) setUsers(items); })
      .catch((error) => { if (active) setError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [repository, revision]);
  function done() { setEditor(null); setRevision((value) => value + 1); }
  const filtered = users.filter((user) => `${user.name} ${user.email}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')));
  return <section aria-labelledby="users-title" className="users-panel">
    <div className="users-heading"><div><h2 id="users-title">Usuarios del equipo</h2>
      <p>Crea cuentas personales y decide quién puede gestionar el club.</p></div>
      <button className="button" onClick={() => setEditor({ mode: 'create' })}><Plus aria-hidden="true" />Nuevo usuario</button>
    </div>
    <p className="field-help">Los alumnos siguen entrando con la contraseña compartida de las clases. No necesitan una cuenta en esta lista.</p>
    <label className="search-field"><MagnifyingGlass aria-hidden="true" /><span className="sr-only">Buscar usuarios</span>
      <input type="search" placeholder="Buscar por nombre o correo…" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
    {loading ? <Loading /> : error ? <><ErrorMessage>{error}</ErrorMessage><button className="button button-secondary" onClick={() => setRevision((n) => n + 1)}>Reintentar</button></>
      : !filtered.length ? <p>No se encontraron usuarios.</p> : <div className="users-list">{filtered.map((user) => <article className="user-card" key={user.id} aria-label={user.name}>
        <div className="user-info"><h3>{user.name}{user.isCurrent && <span className="tag">Tu cuenta</span>}</h3><p>{user.email}</p>
          <p><strong>{roleNames[user.role]}</strong> · {user.active ? 'Activa' : 'Desactivada'}</p></div>
        <div className="user-actions">
          <button className="button button-secondary" aria-label={`Editar ${user.name}`} onClick={() => setEditor({ mode: 'edit', user })}>Editar</button>
          <button className="button button-secondary" aria-label={`Cambiar contraseña de ${user.name}`} onClick={() => setEditor({ mode: 'password', user })}>Contraseña</button>
          {!user.isCurrent && <button className="button button-secondary" aria-label={`${user.active ? 'Desactivar' : 'Reactivar'} ${user.name}`} onClick={() => setEditor({ mode: 'status', user })}>{user.active ? 'Desactivar' : 'Reactivar'}</button>}
        </div>
      </article>)}</div>}
    {editor && <Modal title={editor.mode === 'create' ? 'Nuevo usuario' : editor.mode === 'edit' ? 'Editar usuario' : editor.mode === 'password' ? 'Cambiar contraseña' : editor.user.active ? 'Desactivar usuario' : 'Reactivar usuario'}
      close={() => { if (!busy) setEditor(null); }}><UserForm editor={editor} done={done} pending={setBusy} /></Modal>}
  </section>;
}
