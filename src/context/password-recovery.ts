export const PASSWORD_RECOVERY_KEY = 'planv.passwordRecovery';

export function isPasswordRecovery(hash: string, pending: string | null) {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  return params.get('type') === 'recovery' || pending === '1';
}

export function passwordResetError(password: string, confirmation: string): string | null {
  if (password.length < 8 || password.length > 128) return 'Usá una contraseña de entre 8 y 128 caracteres.';
  if (password !== confirmation) return 'Las contraseñas no coinciden.';
  return null;
}
