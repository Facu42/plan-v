import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Icon, Mark } from '../shared/Icon';

export function LoginScreen({ darkMode, onToggleTheme }: { darkMode: boolean; onToggleTheme: () => void }) {
  const { signIn, signUp, enterDemoMode, loading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'nutri' | 'paciente'>('nutri');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [signupOk, setSignupOk] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        const res = await signIn(email, password);
        if (res.error) setError(res.error);
      } else {
        const res = await signUp(email, password, fullName, role);
        if (res.error) setError(res.error);
        else setSignupOk(true);
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
            <p>Te enviamos un link de confirmación. Después podés iniciar sesión.</p>
            <button type="button" className="primary-button wide" onClick={() => { setSignupOk(false); setMode('login'); }}>Ir a iniciar sesión</button>
          </>
        ) : (
          <>
            <h1>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
            <p className="auth-sub">{mode === 'login' ? 'Accedé a tu panel o app de paciente.' : 'Registrate como nutricionista o paciente.'}</p>

            <div className="auth-tabs">
              <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Entrar</button>
              <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Registro</button>
            </div>

            {mode === 'signup' && (
              <>
                <input className="text-input" placeholder="Nombre completo" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <div className="role-pills">
                  <button type="button" className={role === 'nutri' ? 'active' : ''} onClick={() => setRole('nutri')}>Nutricionista</button>
                  <button type="button" className={role === 'paciente' ? 'active' : ''} onClick={() => setRole('paciente')}>Paciente</button>
                </div>
              </>
            )}

            <input className="text-input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <input className="text-input" type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />

            {error && <p className="form-error">{error}</p>}

            <button type="button" className="primary-button wide" disabled={busy || !email || !password} onClick={submit}>
              {busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </>
        )}

        <div className="auth-divider"><span>o</span></div>
        <button type="button" className="soft-button wide" onClick={enterDemoMode}>Continuar en modo demo</button>
        <p className="auth-foot">Modo demo usa datos locales sin persistencia. Para producción, conectá Supabase únicamente con la migración 016 revisada y aprobada.</p>
      </div>
    </div>
  );
}
