import { useRef, useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { passwordResetError } from '../../context/password-recovery';
import { Mark } from '../shared/Icon';

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
  return <div className="auth-screen"><div className="auth-card">
    <div className="auth-brand"><Mark /><strong>Plan V</strong></div>
    <h1>Elegí tu nueva contraseña</h1>
    {!session ? <><p>El enlace venció o todavía no pudimos verificarlo. Volvé al ingreso para solicitar otro.</p><button type="button" className="primary-button" onClick={() => void signOut()}>Volver al ingreso</button></> : <form onSubmit={event => void submit(event)} aria-busy={busy}>
      <fieldset disabled={busy} style={{ border: 0, padding: 0, display: 'grid', gap: 16 }}>
        <label>Nueva contraseña<input className="text-input" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={event => setPassword(event.target.value)} /></label>
        <label>Repetir contraseña<input className="text-input" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmation} onChange={event => setConfirmation(event.target.value)} /></label>
        {error && <p role="alert">{error}</p>}
        <button type="submit" className="primary-button">{busy ? 'Guardando…' : 'Guardar y volver al ingreso'}</button>
      </fieldset>
    </form>}
  </div></div>;
}
