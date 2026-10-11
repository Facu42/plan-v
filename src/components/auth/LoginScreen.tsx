import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { pendingInviteIdFromLocation } from '../../context/invite-link';
import { PRIVACY_URL, TERMS_URL } from '../../legal';
import { EntryButton, EntryChrome, EntryField, EntrySegments } from './entry-shell';

export function LoginScreen({ darkMode, onToggleTheme }: { darkMode: boolean; onToggleTheme: () => void }) {
  const { signIn, signUp, enterDemoMode, loading, demoAllowed, googleAvailable, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'recover'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [professional, setProfessional] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signupOk, setSignupOk] = useState(false);
  const [recoverOk, setRecoverOk] = useState(false);
  const [invitePending, setInvitePending] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setInvitePending(Boolean(pendingInviteIdFromLocation(window.location.search, window.sessionStorage.getItem('planv.pendingInvite'))));
  }, []);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        const res = await signIn(email, password);
        if (res.error) setError(res.error);
      } else if (mode === 'signup') {
        const res = await signUp(email, password, fullName, professional);
        if (res.error) setError(res.error);
        else setSignupOk(true);
      } else {
        try {
          await api.recoverAccount(email);
        } catch {
          // Same generic acknowledgement whether the mailbox exists or the provider is down.
        }
        setRecoverOk(true);
      }
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(null);
    setBusy(true);
    const res = await signInWithGoogle({ professional: mode === 'signup' && professional, acceptedLegal: mode === 'signup' && acceptedLegal });
    // Si sale bien, el navegador ya se está yendo a Google.
    if (res.error) {
      setError(res.error);
      setBusy(false);
    }
  };

  const backToLogin = () => { setSignupOk(false); setRecoverOk(false); setMode('login'); };

  if (loading) {
    return <EntryChrome title="Cargando sesión…" role="status" />;
  }

  if (signupOk || recoverOk) {
    return (
      <EntryChrome
        title="Revisá tu email"
        subtitle={signupOk
          ? `Te enviamos un link de confirmación. Después de confirmarlo podés iniciar sesión${professional ? ' y tu consultorio queda listo para invitar pacientes' : invitePending ? ' y aceptar la invitación' : ''}.`
          : 'Si hay una cuenta con ese email, vas a recibir un mensaje para recuperarla.'}
        darkMode={darkMode}
        onToggleTheme={onToggleTheme}
      >
        <div className="entry-actions">
          <EntryButton label="Ir a iniciar sesión" onClick={backToLogin} />
        </div>
      </EntryChrome>
    );
  }

  const title = mode === 'login' ? 'Iniciar sesión' : mode === 'signup' ? 'Crear cuenta' : 'Recuperar cuenta';
  const subtitle = mode === 'login'
    ? (invitePending
      ? 'Entrá con el email invitado. La cuenta tiene que estar verificada para vincularte.'
      : 'Accedé a tu panel o app de paciente.')
    : mode === 'signup'
      ? (professional
        ? 'Creás tu consultorio y después invitás a tus pacientes con un enlace.'
        : 'Si tu nutricionista te mandó un enlace, abrilo primero para quedar vinculada.')
      : 'Ingresá el email de la cuenta. No vamos a decir si el correo existe o no.';

  return (
    <EntryChrome title={title} subtitle={subtitle} darkMode={darkMode} onToggleTheme={onToggleTheme}>
      {mode !== 'recover' && (
        <EntrySegments label="Entrar o crear cuenta" options={[
          { id: 'login', label: 'Entrar', active: mode === 'login', onClick: () => setMode('login') },
          { id: 'signup', label: 'Registro', active: mode === 'signup', onClick: () => setMode('signup') },
        ]} />
      )}

      {mode === 'signup' && (
        <EntrySegments label="Tipo de cuenta" options={[
          { id: 'patient', label: 'Soy paciente', active: !professional, onClick: () => setProfessional(false) },
          { id: 'pro', label: 'Soy nutricionista', active: professional, onClick: () => setProfessional(true) },
        ]} />
      )}

      <div className="entry-fields">
        {mode === 'signup' && (
          <EntryField label={professional ? 'Nombre profesional' : 'Nombre completo'} autoComplete="name" placeholder={professional ? 'Nombre profesional' : 'Nombre completo'} value={fullName} onChange={(event) => setFullName(event.target.value)} />
        )}
        <EntryField label="Correo electrónico" type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" />
        {mode !== 'recover' && (
          <EntryField label="Contraseña" type="password" placeholder="Contraseña" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        )}
      </div>

      {mode === 'signup' && (
        <label className="entry-check">
          <input type="checkbox" checked={acceptedLegal} onChange={(event) => setAcceptedLegal(event.target.checked)} />
          <span>Leí y acepto los <a href={TERMS_URL} target="_blank" rel="noreferrer">términos y condiciones</a> y la <a href={PRIVACY_URL} target="_blank" rel="noreferrer">política de privacidad</a>, y doy mi consentimiento expreso para que se traten mis datos de salud, incluso en servidores fuera de Argentina, para los fines que ahí se explican.</span>
        </label>
      )}

      {error && <p className="entry-error" role="alert">{error}</p>}

      <div className="entry-actions">
        <EntryButton
          label={busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Crear cuenta' : 'Enviar recuperación'}
          disabled={busy || !email || (mode !== 'recover' && !password) || (mode === 'signup' && professional && fullName.trim().length < 2) || (mode === 'signup' && !acceptedLegal)}
          onClick={() => { void submit(); }}
        />
        {mode === 'login' && (
          <EntryButton tone="secondary" label="Olvidé mi contraseña" onClick={() => { setError(null); setMode('recover'); }} />
        )}
        {mode === 'recover' && (
          <EntryButton tone="secondary" label="Volver a iniciar sesión" onClick={() => { setError(null); setMode('login'); }} />
        )}
      </div>

      {googleAvailable && mode !== 'recover' && (
        <>
          <div className="entry-divider"><span>o</span></div>
          <button type="button" className="entry-google" disabled={busy || (mode === 'signup' && !acceptedLegal)} onClick={() => { void google(); }}>
            <GoogleMark />
            <span>{mode === 'signup' ? 'Registrarme con Google' : 'Continuar con Google'}</span>
          </button>
          {mode === 'signup' && !acceptedLegal && <p className="entry-note">Para registrarte con Google, primero marcá la casilla de arriba.</p>}
        </>
      )}

      {demoAllowed && (
        <>
          <div className="entry-divider"><span>o</span></div>
          <EntryButton tone="secondary" label="Continuar en modo demo" onClick={enterDemoMode} />
          <p className="entry-note">Modo demo usa datos locales sin persistencia. No está disponible en un build de producción.</p>
        </>
      )}
      <p className="entry-legal"><a href={PRIVACY_URL} target="_blank" rel="noreferrer">Privacidad</a> · <a href={TERMS_URL} target="_blank" rel="noreferrer">Términos</a></p>
    </EntryChrome>
  );
}

// Logo oficial de Google (las reglas de Google piden usarlo sin cambios en el botón).
function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
