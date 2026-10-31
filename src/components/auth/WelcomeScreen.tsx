import { PENDING_INVITE_STORAGE_KEY, pendingInviteIdFromLocation } from '../../context/invite-link';
import { LoginScreen } from './LoginScreen';

export type AuthStartMode = 'login' | 'signup';

export function shouldSkipWelcome(search: string, stored?: string | null): boolean {
  return Boolean(pendingInviteIdFromLocation(search, stored));
}

export function inviteWaiting(): boolean {
  if (typeof window === 'undefined') return false;
  return shouldSkipWelcome(window.location.search, window.sessionStorage.getItem(PENDING_INVITE_STORAGE_KEY));
}

/** Ingreso único: formulario y visual en la misma pantalla. */
export function AuthEntry({ darkMode, onToggleTheme }: { darkMode: boolean; onToggleTheme: () => void }) {
  return <LoginScreen darkMode={darkMode} onToggleTheme={onToggleTheme} />;
}
