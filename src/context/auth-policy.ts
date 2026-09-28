export type FrontAuthEnv = {
  DEV: boolean;
  VITE_ALLOW_DEMO?: string;
};

export function isLocalDemoAllowed(env: FrontAuthEnv): boolean {
  return env.DEV && env.VITE_ALLOW_DEMO === 'true';
}

export const PUBLIC_SIGNUP_ROLE = 'paciente' as const;

// Alta propia de nutricionistas: la cuenta nace como paciente (el rol nunca viene
// del cliente) y guarda esta marca; al primer ingreso verificado, la app pide al
// servidor abrir el consultorio.
export const PROFESSIONAL_SIGNUP_FLAG = 'professional_signup' as const;

export function wantsProfessionalSignup(metadata: Record<string, unknown> | null | undefined): boolean {
  return metadata?.[PROFESSIONAL_SIGNUP_FLAG] === true;
}

export function professionalDisplayName(metadata: Record<string, unknown> | null | undefined, fallback: string): string {
  const fromSignup = typeof metadata?.full_name === 'string' ? metadata.full_name.trim() : '';
  return fromSignup || fallback.trim();
}
