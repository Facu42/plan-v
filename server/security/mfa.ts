/**
 * Verificación en dos pasos con TOTP de Supabase Auth.
 * /admin siempre exige aal2. La nutricionista lo activa en Ajustes: si ya tiene un código
 * verificado, la API exige aal2 aunque MFA_ENFORCE esté apagado. Sin alta, no se le exige.
 */
export const MFA_REQUIRED_MESSAGE = 'Falta la verificación en dos pasos.';

type FactorRow = { factor_type?: unknown; status?: unknown };

/** Lista que devuelve GoTrue en GET /auth/v1/factors. */
export function verifiedTotpCount(body: unknown): number {
  const rows = Array.isArray(body) ? body : [];
  return rows.filter((row): row is FactorRow => Boolean(row) && typeof row === 'object')
    .filter((row) => row.factor_type === 'totp' && row.status === 'verified').length;
}

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

/**
 * Rutas mínimas que una profesional puede necesitar antes de completar MFA.
 * El middleware confirma además el rol y, para la bandeja, que el consultorio
 * siga vacío; esta lista por sí sola nunca concede acceso.
 */
export function isPreMfaProfessionalPath(path: string): boolean {
  return path === '/api/nutritionist/setup' || path === '/api/crm/work-queue';
}

/**
 * True solo si la cuenta ya confirmó un TOTP. Si Auth no responde, no bloquea a quien
 * todavía no lo activó: /admin igual exige aal2 en sus rutas.
 */
export async function hasVerifiedTotp(
  authorization: string | undefined,
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<boolean> {
  const token = authorization?.replace(/^Bearer\s+/i, '').trim();
  const url = env.SUPABASE_URL?.replace(/\/$/, '');
  const anon = env.SUPABASE_ANON_KEY;
  if (!token || !url || !anon) return false;
  try {
    const response = await fetchImpl(`${url}/auth/v1/factors`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anon },
      signal: AbortSignal.timeout(4_000),
    });
    if (!response.ok) return false;
    return verifiedTotpCount(await response.json()) > 0;
  } catch {
    return false;
  }
}
