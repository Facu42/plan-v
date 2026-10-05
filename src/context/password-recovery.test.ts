import { expect, it } from 'vitest';
import { isPasswordRecovery, passwordResetError } from './password-recovery';

it('reconoce recuperación al abrir el enlace y después de recargar', () => {
  expect(isPasswordRecovery('#access_token=ficticio&type=recovery', null)).toBe(true);
  expect(isPasswordRecovery('', '1')).toBe(true);
  expect(isPasswordRecovery('#type=signup', null)).toBe(false);
  expect(isPasswordRecovery('', null)).toBe(false);
});
it('valida nueva contraseña y confirmación antes de pedir el cambio', () => {
  expect(passwordResetError('PlanV-nueva-2026', 'PlanV-nueva-2026')).toBeNull();
  expect(passwordResetError('1234567', '1234567')).toContain('8');
  expect(passwordResetError('PlanV-nueva-2026', 'Otra-clave-2026')).toContain('coinciden');
});
