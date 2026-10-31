import { useEffect, useRef, useState, type CSSProperties } from 'react';
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
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const items = Array.from(node.querySelectorAll('.welcome-in'));
    const finish = (item: Element) => item.classList.add('is-in');
    const onEnd = (event: Event) => finish(event.currentTarget as Element);
    items.forEach((item) => item.addEventListener('animationend', onEnd));
    const fallback = window.setTimeout(() => items.forEach(finish), 2000);
    return () => {
      items.forEach((item) => item.removeEventListener('animationend', onEnd));
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <main ref={root} className="welcome">
      <img className="welcome__photo welcome-in welcome-in--photo" src={welcomePhoto} alt="" />
      <div className="welcome__scrim" aria-hidden="true" />
      <div className="welcome__grain" aria-hidden="true" />
      <div className="welcome__brand">
        <img className="welcome__logo welcome-in welcome-in--scale" src={nutridashMark} alt="" width={168} height={133} style={{ '--d': '80ms' } as CSSProperties} />
        <h1 className="welcome__name welcome-in welcome-in--soft" style={{ '--d': '220ms' } as CSSProperties}>Nutridash</h1>
        <p className="welcome__tagline welcome-in welcome-in--soft" style={{ '--d': '380ms' } as CSSProperties}>
          <span>Mejores hábitos.</span>
          <span>Una vida más sana.</span>
        </p>
      </div>
      <div className="welcome__actions welcome-in welcome-in--btn" style={{ '--d': '560ms' } as CSSProperties}>
        <button type="button" className="welcome__start" onClick={onStart}>
          <span>Empezar</span>
          <span className="welcome__chip" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          </span>
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
