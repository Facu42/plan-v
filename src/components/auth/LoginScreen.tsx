import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { pendingInviteIdFromLocation } from '../../context/invite-link';
import { Icon, Mark } from '../shared/Icon';

export function LoginScreen({ darkMode, onToggleTheme }: { darkMode: boolean; onToggleTheme: () => void }) {
  const { signIn, signUp, enterDemoMode, loading, demoAllowed } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'recover'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
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
        const res = await signUp(email, password, fullName);
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
            <p>Te enviamos un link de confirmación. Después de confirmarlo podés iniciar sesión{invitePending ? ' y aceptar la invitación' : ''}.</p>
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
              {mode === 'signup' && 'El registro público crea una cuenta de paciente. La nutricionista se provisiona por invitación.'}
              {mode === 'recover' && 'Ingresá el email de la cuenta. No vamos a decir si el correo existe o no.'}
            </p>

            {mode !== 'recover' && (
              <div className="auth-tabs">
                <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Entrar</button>
                <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Registro</button>
              </div>
            )}

            {mode === 'signup' && (
              <input className="text-input" placeholder="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            )}

            <input className="text-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            {mode !== 'recover' && (
              <input className="text-input" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            )}

            {error && <p className="form-error">{error}</p>}

            <button type="button" className="primary-button wide" disabled={busy || !email || (mode !== 'recover' && !password)} onClick={submit}>
              {busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Crear cuenta' : 'Enviar recuperación'}
            </button>

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
      </div>
    </div>
  );
}
