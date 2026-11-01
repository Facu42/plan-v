/**
 * Verificación en dos pasos (issue #132, tarea 1). El token ya lo verificó Supabase (getUser):
 * acá solo se lee su nivel de seguridad (aal1 = solo clave o Google, aal2 = con el segundo paso).
 * Apagado de fábrica: se prende con MFA_ENFORCE=1 una vez que Facundo y Verónica den de alta su código.
 */
export const MFA_REQUIRED_MESSAGE = 'Falta la verificación en dos pasos.';

export function mfaEnforced(env: Record<string, string | undefined> = process.env): boolean {
  return env.MFA_ENFORCE === '1';
}

export function tokenAal(authorization: string | undefined): 'aal1' | 'aal2' {
  const token = authorization?.replace(/^Bearer\s+/i, '');
  const payload = token?.split('.')[1];
  if (!payload) return 'aal1';
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { aal?: unknown };
    return claims.aal === 'aal2' ? 'aal2' : 'aal1';
  } catch { return 'aal1'; }
}

/** Rutas que tienen que seguir andando sin el segundo paso: ingreso, recuperación y aviso del menú. */
export function isMfaExemptPath(path: string): boolean {
  return path.startsWith('/api/auth/') || path === '/api/admin/me';
}

/** /api/admin exige aal2 siempre, salvo /api/admin/me (para mostrar el aviso del menú). */
export function isAdminProtectedPath(path: string): boolean {
  return (path === '/api/admin' || path.startsWith('/api/admin/')) && path !== '/api/admin/me';
}

/**
 * Rutas mínimas que una profesional puede necesitar antes de completar MFA.
 * El middleware confirma además el rol y, para la bandeja, que el consultorio
 * siga vacío; esta lista por sí sola nunca concede acceso.
 */
export function isPreMfaProfessionalPath(path: string): boolean {
  return path === '/api/nutritionist/setup' || path === '/api/crm/work-queue';
}
