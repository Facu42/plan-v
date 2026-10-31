import { useState } from 'react';
import { PENDING_INVITE_STORAGE_KEY, pendingInviteIdFromLocation } from '../../context/invite-link';
import welcomePhoto from '../../assets/welcome/welcome-bg.jpg';
import nutridashMark from '../../assets/welcome/nutridash-mark.png';
import { LoginScreen } from './LoginScreen';
import './welcome-screen.css';

export type AuthStartMode = 'login' | 'signup';

export function shouldSkipWelcome(search: string, stored?: string | null): boolean {
  return Boolean(pendingInviteIdFromLocation(search, stored));
}

function inviteWaiting(): boolean {
  if (typeof window === 'undefined') return false;
  return shouldSkipWelcome(window.location.search, window.sessionStorage.getItem(PENDING_INVITE_STORAGE_KEY));
}

export function WelcomeScreen({
  onStart,
  onSignIn,
}: {
  onStart: () => void;
  onSignIn: () => void;
}) {
  return (
    <main className="welcome">
      <img className="welcome__photo" src={welcomePhoto} alt="" />
      <div className="welcome__scrim" aria-hidden="true" />
      <div className="welcome__brand">
        <img className="welcome__logo" src={nutridashMark} alt="" width={188} height={149} />
        <h1 className="welcome__name">Nutridash</h1>
        <p className="welcome__tagline">Mejores hábitos.<br />Una vos más sana.</p>
      </div>
      <div className="welcome__actions">
        <button type="button" className="welcome__start" onClick={onStart}>
          <span>Empezar</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
          </svg>
        </button>
        <button type="button" className="welcome__signin" onClick={onSignIn}>
          Iniciar sesión
        </button>
      </div>
    </main>
  );
}

/** Bienvenida delante del ingreso. Una invitación pendiente salta directo al formulario. */
export function AuthEntry({ darkMode, onToggleTheme }: { darkMode: boolean; onToggleTheme: () => void }) {
  const [gate, setGate] = useState<'welcome' | 'auth'>(() => (inviteWaiting() ? 'auth' : 'welcome'));
  const [startMode, setStartMode] = useState<AuthStartMode>('login');

  if (gate === 'welcome') {
    return (
      <WelcomeScreen
        onStart={() => { setStartMode('signup'); setGate('auth'); }}
        onSignIn={() => { setStartMode('login'); setGate('auth'); }}
      />
    );
  }

  return <LoginScreen darkMode={darkMode} onToggleTheme={onToggleTheme} initialMode={startMode} />;
}
