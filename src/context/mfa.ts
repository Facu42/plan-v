export type MfaStep = 'checking' | 'verify' | 'enroll' | null;

export function mfaEnforcedInApp(env: Record<string, unknown> = import.meta.env): boolean {
  return env.VITE_MFA_ENFORCE === '1';
}

/**
 * Quién pasa por la verificación en dos pasos.
 * - Con un código ya dado de alta y la sesión sin verificar: siempre se pide (verify).
 * - Sin código dado de alta: solo se obliga a nutricionistas y a quien entra a /admin, y solo si el
 *   interruptor está prendido (enroll). A las pacientes no se les exige.
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
