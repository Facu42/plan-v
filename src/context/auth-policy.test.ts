import { describe, expect, it } from 'vitest';
import { isLocalDemoAllowed, PUBLIC_SIGNUP_ROLE } from './auth-policy';

describe('frontend auth policy', () => {
  it('offers demo only in development with an explicit flag', () => {
    expect(isLocalDemoAllowed({ DEV: true, VITE_ALLOW_DEMO: 'true' })).toBe(true);
    expect(isLocalDemoAllowed({ DEV: true, VITE_ALLOW_DEMO: 'false' })).toBe(false);
    expect(isLocalDemoAllowed({ DEV: false, VITE_ALLOW_DEMO: 'true' })).toBe(false);
    expect(isLocalDemoAllowed({ DEV: true })).toBe(false);
  });

  it('registers public accounts as patients', () => {
    expect(PUBLIC_SIGNUP_ROLE).toBe('paciente');
  });
});

describe('PV-47 registro "Soy nutricionista"', () => {
  it('sólo la marca explícita pide abrir consultorio y usa el nombre del registro', async () => {
    const { wantsProfessionalSignup, professionalDisplayName } = await import('./auth-policy');
    expect(wantsProfessionalSignup({ professional_signup: true })).toBe(true);
    expect(wantsProfessionalSignup({ professional_signup: 'true' })).toBe(false);
    expect(wantsProfessionalSignup({ role: 'nutri' })).toBe(false);
    expect(wantsProfessionalSignup(undefined)).toBe(false);
    expect(professionalDisplayName({ full_name: ' Lic. Ana ' }, 'ana')).toBe('Lic. Ana');
    expect(professionalDisplayName({}, ' ana ')).toBe('ana');
  });
});
