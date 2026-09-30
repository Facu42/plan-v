import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { pendingInviteIdFromLocation } from '../../context/invite-link';
import { Icon, Mark } from '../shared/Icon';
import { PRIVACY_URL, TERMS_URL } from '../../legal';

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

  if (loading) {
    return (
      <div className="auth-screen">
        <div className="auth-card"><p>Cargando sesión…</p></div>
      </div>
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-head">
          <div className="auth-brand"><Mark /><div><strong>Plan V</strong><small>Centro profesional</small></div></div>
          <button className="round-button theme-toggle" type="button" aria-label={darkMode ? 'Usar tema claro' : 'Usar tema oscuro'} aria-pressed={darkMode} onClick={onToggleTheme}>
            <Icon name={darkMode ? 'sun' : 'moon'} size={18} />
          </button>
        </div>

        {signupOk ? (
          <>
            <h1>Revisá tu email</h1>
            <p>Te enviamos un link de confirmación. Después de confirmarlo podés iniciar sesión{professional ? ' y tu consultorio queda listo para invitar pacientes' : invitePending ? ' y aceptar la invitación' : ''}.</p>
            <button type="button" className="primary-button wide" onClick={() => { setSignupOk(false); setMode('login'); }}>Ir a iniciar sesión</button>
          </>
        ) : recoverOk ? (
          <>
            <h1>Revisá tu email</h1>
            <p>Si hay una cuenta con ese email, vas a recibir un mensaje para recuperarla.</p>
            <button type="button" className="primary-button wide" onClick={() => { setRecoverOk(false); setMode('login'); }}>Ir a iniciar sesión</button>
          </>
        ) : (
          <>
            <h1>{mode === 'login' ? 'Iniciar sesión' : mode === 'signup' ? 'Crear cuenta' : 'Recuperar cuenta'}</h1>
            <p className="auth-sub">
              {mode === 'login' && (invitePending
                ? 'Entrá con el email invitado. La cuenta tiene que estar verificada para vincularte.'
                : 'Accedé a tu panel o app de paciente.')}
              {mode === 'signup' && (professional
                ? 'Creás tu consultorio y después invitás a tus pacientes con un enlace.'
                : 'Si tu nutricionista te mandó un enlace, abrilo primero para quedar vinculada.')}
              {mode === 'recover' && 'Ingresá el email de la cuenta. No vamos a decir si el correo existe o no.'}
            </p>

            {mode !== 'recover' && (
              <div className="auth-tabs">
                <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Entrar</button>
                <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Registro</button>
              </div>
            )}

            {mode === 'signup' && (
              <>
                <div className="auth-tabs" role="group" aria-label="Tipo de cuenta">
                  <button type="button" className={professional ? '' : 'active'} aria-pressed={!professional} onClick={() => setProfessional(false)}>Soy paciente</button>
                  <button type="button" className={professional ? 'active' : ''} aria-pressed={professional} onClick={() => setProfessional(true)}>Soy nutricionista</button>
                </div>
                <input className="text-input" placeholder={professional ? 'Nombre profesional' : 'Nombre completo'} value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </>
            )}

            <input className="text-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            {mode !== 'recover' && (
              <input className="text-input" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            )}

            {mode === 'signup' && (
              <label className="auth-consent">
                <input type="checkbox" checked={acceptedLegal} onChange={(e) => setAcceptedLegal(e.target.checked)} />
                <span>Leí y acepto los <a href={TERMS_URL} target="_blank" rel="noreferrer">términos y condiciones</a> y la <a href={PRIVACY_URL} target="_blank" rel="noreferrer">política de privacidad</a>, y doy mi consentimiento expreso para que se traten mis datos de salud, incluso en servidores fuera de Argentina, para los fines que ahí se explican.</span>
              </label>
            )}

            {error && <p className="form-error">{error}</p>}

            <button type="button" className="primary-button wide" disabled={busy || !email || (mode !== 'recover' && !password) || (mode === 'signup' && professional && fullName.trim().length < 2) || (mode === 'signup' && !acceptedLegal)} onClick={submit}>
              {busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Crear cuenta' : 'Enviar recuperación'}
            </button>

            {googleAvailable && mode !== 'recover' && (
              <>
                <div className="auth-divider"><span>o</span></div>
                <button type="button" className="google-button wide" disabled={busy || (mode === 'signup' && !acceptedLegal)} onClick={google}>
                  <GoogleMark />
                  <span>{mode === 'signup' ? 'Registrarme con Google' : 'Continuar con Google'}</span>
                </button>
                {mode === 'signup' && !acceptedLegal && <p className="auth-foot">Para registrarte con Google, primero marcá la casilla de arriba.</p>}
              </>
            )}

            {mode === 'login' && (
              <button type="button" className="soft-button wide" onClick={() => { setError(null); setMode('recover'); }}>Olvidé mi contraseña</button>
            )}
            {mode === 'recover' && (
              <button type="button" className="soft-button wide" onClick={() => { setError(null); setMode('login'); }}>Volver a iniciar sesión</button>
            )}
          </>
        )}

        {demoAllowed && (
          <>
            <div className="auth-divider"><span>o</span></div>
            <button type="button" className="soft-button wide" onClick={enterDemoMode}>Continuar en modo demo</button>
            <p className="auth-foot">Modo demo usa datos locales sin persistencia. No está disponible en un build de producción.</p>
          </>
        )}
        {!demoAllowed && (
          <p className="auth-foot">El acceso demo no está habilitado en esta sesión.</p>
        )}
        <p className="auth-foot auth-legal"><a href={PRIVACY_URL} target="_blank" rel="noreferrer">Privacidad</a> · <a href={TERMS_URL} target="_blank" rel="noreferrer">Términos</a></p>
      </div>
    </div>
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
