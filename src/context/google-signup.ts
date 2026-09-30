import { LEGAL_VERSION } from '../legal';
import { PROFESSIONAL_SIGNUP_FLAG } from './auth-policy';

// Entrar con Google saca a la persona de la app y la trae de vuelta. Lo que eligió
// antes de irse (registrarse como nutricionista, la casilla de términos) se guarda
// acá y se pasa a la cuenta al volver.
export const PENDING_GOOGLE_SIGNUP_KEY = 'planv.pendingGoogleSignup';
const MAX_AGE_MS = 30 * 60 * 1000;

export type PendingGoogleSignup = {
  professional: boolean;
  legalAcceptedAt: string | null;
  savedAt: string;
};

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function rememberGoogleSignup(store: KeyValueStore, choice: { professional: boolean; acceptedLegal: boolean }, now = new Date()) {
  const pending: PendingGoogleSignup = {
    professional: choice.professional,
    legalAcceptedAt: choice.acceptedLegal ? now.toISOString() : null,
    savedAt: now.toISOString(),
  };
  store.setItem(PENDING_GOOGLE_SIGNUP_KEY, JSON.stringify(pending));
}

/** Lee y borra lo guardado. Descarta lo viejo o mal formado. */
export function takeGoogleSignup(store: KeyValueStore, now = new Date()): PendingGoogleSignup | null {
  const raw = store.getItem(PENDING_GOOGLE_SIGNUP_KEY);
  store.removeItem(PENDING_GOOGLE_SIGNUP_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingGoogleSignup>;
    const savedAt = typeof parsed.savedAt === 'string' ? Date.parse(parsed.savedAt) : NaN;
    if (!Number.isFinite(savedAt) || now.getTime() - savedAt > MAX_AGE_MS || savedAt - now.getTime() > 60_000) return null;
    return {
      professional: parsed.professional === true,
      legalAcceptedAt: typeof parsed.legalAcceptedAt === 'string' ? parsed.legalAcceptedAt : null,
      savedAt: parsed.savedAt as string,
    };
  } catch {
    return null;
  }
}

/**
 * Datos a sumar a la cuenta al volver de Google. La marca de nutricionista sólo se
 * pone en cuentas recién creadas: una cuenta que ya existía no cambia de tipo por
 * haber tocado un botón.
 */
export function googleSignupMetadata(
  pending: PendingGoogleSignup,
  user: { created_at?: string; user_metadata?: Record<string, unknown> | null },
  now = new Date(),
): Record<string, unknown> | null {
  const data: Record<string, unknown> = {};
  const created = user.created_at ? Date.parse(user.created_at) : NaN;
  const isNewAccount = Number.isFinite(created) && now.getTime() - created <= MAX_AGE_MS;
  if (pending.professional && isNewAccount) data[PROFESSIONAL_SIGNUP_FLAG] = true;
  if (pending.legalAcceptedAt && user.user_metadata?.legal_version !== LEGAL_VERSION) {
    data.legal_version = LEGAL_VERSION;
    data.legal_accepted_at = pending.legalAcceptedAt;
  }
  return Object.keys(data).length ? data : null;
}
