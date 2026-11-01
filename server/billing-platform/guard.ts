import type { Context, Next } from 'hono';
import { billingEnabled } from './flag.js';
import { findOpenSubscription, nutritionistForUser } from './repository.js';
import { platformWriteAccess } from './state.js';

const OPEN = ['/api/billing', '/api/public/billing', '/api/auth', '/api/me', '/api/admin', '/api/notices', '/api/notification-preferences'];

export const PLATFORM_READ_ONLY_MESSAGE = 'Tu plan está en solo lectura. Podés ver a tus pacientes y exportar tus datos. Regularizá el pago para volver a cargar. Tus pacientes no pierden el acceso.';

/** Solo corta escrituras de la nutricionista. La paciente sigue entrando a sus datos y a Mensajes. */
export function createPlatformReadOnlyGuard() {
  return async function guard(c: Context, next: Next) {
    if (!billingEnabled()) return next();
    if (['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) return next();
    if (OPEN.some((prefix) => c.req.path === prefix || c.req.path.startsWith(`${prefix}/`))) return next();
    const auth = c.get('auth');
    if (!auth || !('userId' in auth)) return next();
    try {
      const nutri = await nutritionistForUser(auth.userId);
      if (!nutri) return next();
      const open = await findOpenSubscription(nutri.id);
      const createdAt = Date.parse(nutri.created_at);
      if (platformWriteAccess(open, Number.isFinite(createdAt) ? createdAt : null, Date.now()) === 'full') return next();
    } catch {
      return next();
    }
    return c.json({ code: 'platform_read_only', error: PLATFORM_READ_ONLY_MESSAGE }, 403);
  };
}
