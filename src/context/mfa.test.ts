import { describe, expect, it } from 'vitest';
import { decideMfaStep, mfaEnforcedForPath, mfaEnforcedInApp, totpEnrollParams } from './mfa';

const base = { currentLevel: 'aal1', verifiedFactors: 0, requiredForAccount: true, enforced: true };

describe('decideMfaStep', () => {
  it('no pide nada si el segundo paso ya está hecho', () => {
    expect(decideMfaStep({ ...base, currentLevel: 'aal2', verifiedFactors: 1 })).toBeNull();
  });
  it('pide el código a quien ya lo dio de alta, aunque no sea obligatorio y sea paciente', () => {
    expect(decideMfaStep({ ...base, verifiedFactors: 1, enforced: false, requiredForAccount: false })).toBe('verify');
  });
  it('obliga a dar de alta el código solo en /admin', () => {
    expect(decideMfaStep(base)).toBe('enroll');
    expect(decideMfaStep({ ...base, enforced: false })).toBeNull();
  });
  it('a la nutricionista y a la paciente sin código no se les exige', () => {
    expect(decideMfaStep({ ...base, requiredForAccount: false, enforced: true })).toBeNull();
    expect(decideMfaStep({ ...base, requiredForAccount: false, enforced: false })).toBeNull();
  });
  it('el alta usa TOTP de Supabase con el nombre Nutridash', () => {
    expect(totpEnrollParams()).toEqual({ factorType: 'totp', friendlyName: 'Nutridash' });
  });
  it('el interruptor viejo del frente ya no obliga al panel', () => {
    expect(mfaEnforcedInApp({})).toBe(false);
    expect(mfaEnforcedInApp({ VITE_MFA_ENFORCE: '1' })).toBe(true);
    expect(mfaEnforcedForPath('/admin', {})).toBe(true);
    expect(mfaEnforcedForPath('/admin/', { VITE_MFA_ENFORCE: '0' })).toBe(true);
    expect(mfaEnforcedForPath('/crm/inicio', {})).toBe(false);
    expect(mfaEnforcedForPath('/crm/inicio', { VITE_MFA_ENFORCE: '1' })).toBe(false);
    expect(mfaEnforcedForPath('/crm/ajustes', { VITE_MFA_ENFORCE: '1' })).toBe(false);
  });
});
