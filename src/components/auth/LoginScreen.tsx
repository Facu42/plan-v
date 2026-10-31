import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { pendingInviteIdFromLocation } from '../../context/invite-link';
import { PRIVACY_URL, TERMS_URL } from '../../legal';
import nutridashMark from '../../assets/welcome/nutridash-mark-navy.png';
import panelMobile from '../../assets/welcome/panel-mobile.jpg';
import { Icon } from '../shared/Icon';
import { type EntryEntrada } from './entry-stage';
import './login-pin.css';

const ENTRADA_KEY = 'nutridash.entrada';

/** Apple no está en AuthContext. El botón queda listo en la UI, sin un método nuevo. */
const APPLE_SIGN_IN = false;

/** La entrada sale del enlace (?entrada=nutri), después de lo último que eligió en este navegador. */
function initialEntrada(): EntryEntrada {
  if (typeof window === 'undefined') return 'paciente';
  const fromLink = new URLSearchParams(window.location.search).get('entrada');
  if (fromLink === 'nutri' || fromLink === 'paciente') return fromLink;
  try {
    return window.localStorage.getItem(ENTRADA_KEY) === 'nutri' ? 'nutri' : 'paciente';
  } catch {
    return 'paciente';
  }
}

export function LoginScreen({
  darkMode,
  onToggleTheme,
  initialMode = 'login',
}: {
  darkMode: boolean;
  onToggleTheme: () => void;
  initialMode?: 'login' | 'signup';
}) {
  const { signIn, signUp, enterDemoMode, loading, demoAllowed, googleAvailable, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'recover'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [entrada, setEntrada] = useState<EntryEntrada>('paciente');
  const professional = entrada === 'nutri';
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signupOk, setSignupOk] = useState(false);
  const [recoverOk, setRecoverOk] = useState(false);
  const [invitePending, setInvitePending] = useState(false);
  const [appleNote, setAppleNote] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const invited = Boolean(pendingInviteIdFromLocation(window.location.search, window.sessionStorage.getItem('planv.pendingInvite')));
    setInvitePending(invited);
    setEntrada(invited ? 'paciente' : initialEntrada());
  }, []);

  const chooseEntrada = (next: EntryEntrada) => {
    setEntrada(next);
    setError(null);
    try { window.localStorage.setItem(ENTRADA_KEY, next); } catch { /* sin almacenamiento: la elección vale solo para esta visita */ }
  };

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
    if (res.error) {
      setError(res.error);
      setBusy(false);
    }
  };

  const backToLogin = () => { setSignupOk(false); setRecoverOk(false); setMode('login'); setError(null); };

  const goDisabled = busy || !email || (mode !== 'recover' && !password)
    || (mode === 'signup' && professional && fullName.trim().length < 2)
    || (mode === 'signup' && !acceptedLegal);

  const title = mode === 'signup'
    ? professional ? <>Creá tu <em>consultorio</em> hoy.</> : <>Creá tu <em>cuenta</em> hoy.</>
    : mode === 'recover'
      ? <>Recuperá tu <em>acceso</em>.</>
      : professional
        ? <>Tu consultorio,<br />más <em>ordenado</em><br />cada día.</>
        : <>Tu plan,<br />más <em>claro</em><br />cada día.</>;

  const lead = signupOk
    ? `Te enviamos un link de confirmación. Después de confirmarlo podés entrar${professional ? ' y tu consultorio queda listo para invitar pacientes' : invitePending ? ' y aceptar la invitación' : ''}.`
    : recoverOk
      ? 'Si hay una cuenta con ese email, vas a recibir un mensaje para recuperarla.'
      : mode === 'login'
        ? (invitePending
          ? 'Entrá con el email invitado. La cuenta tiene que estar verificada para vincularte.'
          : professional ? 'Entrá para ver pacientes, agenda y planes. Hecho para nutricionistas.' : 'Entrá a tu plan y a tu progreso.')
        : mode === 'signup'
          ? (professional
            ? 'Creás tu consultorio y después invitás a tus pacientes con un enlace.'
            : 'Si tu nutricionista te mandó un enlace, abrilo primero para quedar vinculada.')
          : 'Ingresá el email de la cuenta. No vamos a decir si el correo existe o no.';

  const cta = busy ? 'Un momento…' : mode === 'signup' ? 'Crear cuenta' : mode === 'recover' ? 'Enviar recuperación' : 'Entrar';

  return (
    <main className="login-pin">
      <div className="login-pin__wrap">
        <section className="login-pin__copy">
          <header className="login-pin__brand">
            <div className="login-pin__logo">
              <img src={nutridashMark} alt="" width={38} height={30} />
              <span>Nutridash</span>
            </div>
            <button type="button" className="login-pin__theme" aria-label={darkMode ? 'Usar tema claro' : 'Usar tema oscuro'} aria-pressed={darkMode} onClick={onToggleTheme}>
              <Icon name={darkMode ? 'sun' : 'moon'} size={16} />
            </button>
          </header>

          <h1 className="login-pin__title">{loading ? 'Cargando sesión…' : signupOk || recoverOk ? 'Revisá tu email' : title}</h1>
          <p className="login-pin__lead">{loading ? 'Estamos abriendo tu consultorio.' : lead}</p>

          {!loading && (signupOk || recoverOk) && (
            <div className="login-pin__form">
              <div className="entry-actions">
                <button type="button" className="login-pin__go" onClick={backToLogin}>
                  <span>Ir a iniciar sesión</span>
                  <span className="login-pin__chip" aria-hidden="true"><ArrowIcon /></span>
                </button>
              </div>
            </div>
          )}

          {!loading && !signupOk && !recoverOk && (
            <form className="login-pin__form" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
              <div className="login-pin__links" role="group" aria-label="¿Quién entra?">
                <button type="button" onClick={() => chooseEntrada('paciente')} aria-pressed={!professional}>Soy paciente</button>
                <button type="button" onClick={() => chooseEntrada('nutri')} aria-pressed={professional}>Soy nutricionista</button>
              </div>

              {mode === 'signup' && (
                <label className="login-pin__field">
                  <span>{professional ? 'Nombre profesional' : 'Nombre completo'}</span>
                  <input autoComplete="name" placeholder={professional ? 'Nombre profesional' : 'Nombre completo'} value={fullName} onChange={(event) => setFullName(event.target.value)} />
                </label>
              )}
              <label className="login-pin__field">
                <span>Correo electrónico</span>
                <input type="email" autoComplete="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
              </label>
              {mode !== 'recover' && (
                <label className="login-pin__field">
                  <span>Contraseña</span>
                  <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Contraseña" value={password} onChange={(event) => setPassword(event.target.value)} />
                </label>
              )}

              {mode === 'signup' && (
                <label className="login-pin__check">
                  <input type="checkbox" checked={acceptedLegal} onChange={(event) => setAcceptedLegal(event.target.checked)} />
                  <span>Leí y acepto los <a href={TERMS_URL} target="_blank" rel="noreferrer">términos y condiciones</a> y la <a href={PRIVACY_URL} target="_blank" rel="noreferrer">política de privacidad</a>, y doy mi consentimiento expreso para que se traten mis datos de salud, incluso en servidores fuera de Argentina, para los fines que ahí se explican.</span>
                </label>
              )}

              {error && <p className="login-pin__error" role="alert">{error}</p>}

              <div className="entry-actions">
                <button type="submit" className="login-pin__go" disabled={goDisabled}>
                  <span>{cta}</span>
                  <span className="login-pin__chip" aria-hidden="true"><ArrowIcon /></span>
                </button>
              </div>

              <div className="login-pin__alts">
                <button type="button" className="login-pin__social" disabled={busy || !googleAvailable || (mode === 'signup' && !acceptedLegal)} onClick={() => { void google(); }}>
                  <GoogleMark />
                  <span>Continuar con Google</span>
                </button>
                <button
                  type="button"
                  className="login-pin__social"
                  disabled={!APPLE_SIGN_IN || busy}
                  onClick={() => setAppleNote(true)}
                >
                  <AppleMark />
                  <span>Continuar con Apple</span>
                </button>
              </div>

              {appleNote && <p className="login-pin__note">Apple todavía no está en el ingreso. El botón ya está en la pantalla para cuando el auth lo tenga.</p>}
              {mode === 'signup' && !acceptedLegal && googleAvailable && <p className="login-pin__note">Para registrarte con Google, primero marcá la casilla de arriba.</p>}

              <div className="login-pin__links">
                {mode === 'login' && <button type="button" onClick={() => { setError(null); setMode('recover'); }}>Olvidé mi contraseña</button>}
                {mode === 'recover' && <button type="button" onClick={() => { setError(null); setMode('login'); }}>Volver a iniciar sesión</button>}
                {mode !== 'signup' && <button type="button" onClick={() => { setError(null); setMode('signup'); }}>Crear cuenta</button>}
                {mode === 'signup' && <button type="button" onClick={() => { setError(null); setMode('login'); }}>Ya tengo cuenta</button>}
              </div>

              {demoAllowed && (
                <button type="button" className="login-pin__social" onClick={enterDemoMode}>Continuar en modo demo</button>
              )}
              {demoAllowed && <p className="login-pin__note">Modo demo usa datos locales sin persistencia. No está disponible en un build de producción.</p>}

              <p className="login-pin__legal"><a href={PRIVACY_URL} target="_blank" rel="noreferrer">Privacidad</a> · <a href={TERMS_URL} target="_blank" rel="noreferrer">Términos</a></p>
            </form>
          )}
        </section>

        <aside className="login-pin__visual" aria-hidden={false}>
          <div className="login-pin__arc" aria-hidden="true" />
          <div className="login-pin__ring login-pin__ring--a" aria-hidden="true" />
          <div className="login-pin__ring login-pin__ring--b" aria-hidden="true" />
          <div className="login-pin__ring login-pin__ring--c" aria-hidden="true" />
          <div className="login-phone">
            <div className="login-phone__screen">
              <span className="login-phone__island" />
              <img src={panelMobile} alt="Panel de la nutricionista de Nutridash en el celular" />
            </div>
          </div>
          <div className="login-pin__shield" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M12 3 5 6v6c0 4.2 2.8 7.4 7 8.5 4.2-1.1 7-4.3 7-8.5V6l-7-3Z" />
              <path d="M12 8.2v7.2M8.4 11.8h7.2" />
            </svg>
          </div>
          <div className="login-pin__pedestal" aria-hidden="true" />
          <div className="login-pin__stat">
            <div>
              <strong>Agenda al día</strong>
              <span>Tus consultas de hoy, en un vistazo.</span>
            </div>
            <div className="login-pin__faces" aria-hidden="true">
              <i>V</i><i>S</i><i>M</i><b>+3</b>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

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

function AppleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2.1-1.2 2.8-2.3c.9-1.2 1.2-2.4 1.2-2.5-.1 0-2.3-.9-2.4-3.9zM14.7 6.3c.6-.8 1.1-1.9.9-3-1 .1-2.1.7-2.8 1.5-.6.7-1.1 1.8-.9 2.9 1.1.1 2.2-.5 2.8-1.4z" />
    </svg>
  );
}
