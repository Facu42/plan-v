export type FrontAuthEnv = {
  DEV: boolean;
  VITE_ALLOW_DEMO?: string;
};

export function isLocalDemoAllowed(env: FrontAuthEnv): boolean {
  return env.DEV && env.VITE_ALLOW_DEMO === 'true';
}

export const PUBLIC_SIGNUP_ROLE = 'paciente' as const;
