export type MfaStep = 'checking' | 'verify' | 'enroll' | null;

export function mfaEnforcedInApp(env: Record<string, unknown> = import.meta.env): boolean {
  return env.VITE_MFA_ENFORCE === '1';
}

/** /admin pide el segundo paso aunque el interruptor general esté apagado. */
export function mfaEnforcedForPath(pathname: string, env: Record<string, unknown> = import.meta.env): boolean {
  return mfaEnforcedInApp(env) || /^\/admin\/?$/.test(pathname);
}

/**
 * Quién pasa por la verificación en dos pasos.
 * - Con un código ya dado de alta y la sesión sin verificar: siempre se pide (verify).
 * - Sin código dado de alta: se obliga a nutricionistas si el interruptor está prendido, y a quien
 *   entra a /admin siempre. A las pacientes no se les exige.
 */
export function decideMfaStep(input: {
  currentLevel: string | null;
  verifiedFactors: number;
  requiredForAccount: boolean;
  enforced: boolean;
}): MfaStep {
  if (input.currentLevel === 'aal2') return null;
  if (input.verifiedFactors > 0) return 'verify';
  return input.enforced && input.requiredForAccount ? 'enroll' : null;
}

/** Si Supabase no responde: /admin no deja pasar; una nutri con MFA opcional sí. */
export function decideMfaStepOnLookupError(input: { requiredForAccount: boolean; enforced: boolean }): MfaStep {
  return input.enforced && input.requiredForAccount ? 'verify' : null;
}
