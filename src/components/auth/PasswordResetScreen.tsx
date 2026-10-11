import { useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { passwordResetError } from '../../context/password-recovery';
import { EntryButton, EntryChrome, EntryField } from './entry-shell';

export function PasswordResetScreen() {
  const { session, updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    const invalid = passwordResetError(password, confirmation);
    if (invalid) { setError(invalid); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      const result = await updatePassword(password);
      if (result.error) setError(result.error);
    } catch { setError('No pudimos cambiar la contraseña. Conservamos el formulario para que puedas reintentar.'); }
    finally { lock.current = false; setBusy(false); }
  }
  if (!session) {
    return (
      <EntryChrome title="Elegí tu nueva contraseña" subtitle="El enlace venció o todavía no pudimos verificarlo. Volvé al ingreso para solicitar otro." role="alert">
        <div className="entry-actions">
          <EntryButton label="Volver al ingreso" onClick={() => { void signOut(); }} />
        </div>
      </EntryChrome>
    );
  }
  return (
    <EntryChrome title="Elegí tu nueva contraseña">
      <form onSubmit={(event) => { void submit(event); }} aria-busy={busy}>
        <fieldset disabled={busy} style={{ border: 0, padding: 0, display: 'grid', gap: 16 }}>
          <label className="entry-label">Nueva contraseña
            <EntryField label="Nueva contraseña" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <label className="entry-label">Repetir contraseña
            <EntryField label="Repetir contraseña" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </label>
          {error && <p className="entry-error" role="alert">{error}</p>}
          <div className="entry-actions">
            <EntryButton type="submit" label={busy ? 'Guardando…' : 'Guardar y volver al ingreso'} />
          </div>
        </fieldset>
      </form>
    </EntryChrome>
  );
}
