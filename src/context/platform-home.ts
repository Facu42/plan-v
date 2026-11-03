import { isAdminPath } from '../components/nutrigo/app-location';
import { mfaEnforcedForPath } from './mfa';

export type AccountRole = 'nutri' | 'paciente' | null;

export type HomeScreen = 'admin' | 'unlinked' | 'panel' | 'patient';

/**
 * Después de entrar: el admin de plataforma que no tiene consultorio propio va a /admin.
 * La nutri se queda en su panel. La paciente sin ficha sigue en la pantalla de cuenta sin vincular.
 */
export function homeScreen(input: {
  pathname: string;
  platformAdmin: boolean;
  role: AccountRole;
  linkedPatient: boolean;
}): HomeScreen {
  if (shouldRedirectToAdmin(input)) return 'admin';
  if (input.role === 'nutri') return 'panel';
  if (isAdminPath(input.pathname)) return 'admin';
  if (input.role === 'paciente' && input.linkedPatient) return 'patient';
  return 'unlinked';
}

export function shouldRedirectToAdmin(input: {
  pathname: string;
  platformAdmin: boolean;
  role: AccountRole;
}): boolean {
  return input.platformAdmin && input.role !== 'nutri' && !isAdminPath(input.pathname);
}

/** La nutri que también administra ve el acceso, y sigue en su panel. */
export function showAdminAccess(input: { platformAdmin: boolean; role: AccountRole }): boolean {
  return input.platformAdmin && input.role === 'nutri';
}

/** /admin sigue pidiendo el código de la app, aunque el interruptor general esté apagado. */
export function adminStillRequiresCode(pathname: string): boolean {
  return mfaEnforcedForPath(pathname);
}

export async function readPlatformAdminFlag(call: () => PromiseLike<{ data: unknown; error: unknown }>): Promise<boolean> {
  try {
    const { data, error } = await call();
    return error == null && data === true;
  } catch {
    return false;
  }
}
