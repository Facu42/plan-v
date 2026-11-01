export type MfaStep = 'checking' | 'verify' | 'enroll' | null;

/** Alta de TOTP en Supabase Auth. El nombre es el que ve la persona en la app de códigos. */
export function totpEnrollParams() {
  return { factorType: 'totp' as const, friendlyName: 'Nutridash' };
}

export function mfaEnforcedInApp(env: Record<string, unknown> = import.meta.env): boolean {
  return env.VITE_MFA_ENFORCE === '1';
}

/**
 * Solo /admin obliga a dar de alta el código. La nutricionista lo activa en Ajustes si quiere.
 * El interruptor general ya no convierte el panel en obligatorio.
 */
export function mfaEnforcedForPath(pathname: string, _env: Record<string, unknown> = import.meta.env): boolean {
  return /^\/admin\/?$/.test(pathname);
}

/**
 * Quién pasa por la verificación en dos pasos.
 * - Con un código ya dado de alta y la sesión sin verificar: siempre se pide (verify).
 * - Sin código: solo se obliga a quien entra a /admin. La nutricionista y la paciente no.
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
