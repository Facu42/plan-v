import { describe, expect, it } from 'vitest';
import { decideMfaStep, mfaEnforcedForPath, mfaEnforcedInApp } from './mfa';

const base = { currentLevel: 'aal1', verifiedFactors: 0, requiredForAccount: true, enforced: true };

describe('decideMfaStep', () => {
  it('no pide nada si el segundo paso ya está hecho', () => {
    expect(decideMfaStep({ ...base, currentLevel: 'aal2', verifiedFactors: 1 })).toBeNull();
  });
  it('pide el código a quien ya lo dio de alta, aunque el interruptor esté apagado y sea paciente', () => {
    expect(decideMfaStep({ ...base, verifiedFactors: 1, enforced: false, requiredForAccount: false })).toBe('verify');
  });
  it('obliga a dar de alta el código a nutris y administradoras solo con el interruptor prendido', () => {
    expect(decideMfaStep(base)).toBe('enroll');
    expect(decideMfaStep({ ...base, enforced: false })).toBeNull();
  });
  it('a las pacientes sin código no se les exige', () => {
    expect(decideMfaStep({ ...base, requiredForAccount: false })).toBeNull();
  });
  it('el interruptor del frente es VITE_MFA_ENFORCE=1', () => {
    expect(mfaEnforcedInApp({})).toBe(false);
    expect(mfaEnforcedInApp({ VITE_MFA_ENFORCE: '1' })).toBe(true);
  });
  it('/admin pide el segundo paso aunque el interruptor esté apagado', () => {
    expect(mfaEnforcedForPath('/admin', {})).toBe(true);
    expect(mfaEnforcedForPath('/crm/inicio', {})).toBe(false);
    expect(mfaEnforcedForPath('/crm/inicio', { VITE_MFA_ENFORCE: '1' })).toBe(true);
  });
});
