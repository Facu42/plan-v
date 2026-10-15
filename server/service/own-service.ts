import type { Context, Hono, Next } from 'hono';
import { isSupabaseEnabled, privilegedDb } from '../db/supabase-client.js';
import { summarizeService, type ServiceState } from '../../src/service.js';
import type { OwnService } from '../../src/types/service.js';
import { writeOpsLog } from '../ops/log.js';

/** Estados en los que la nutricionista ve todo pero no puede cargar ni cambiar nada. */
/** Solo lectura únicamente cuando el administrador la suspende desde su panel: vencer no corta nada solo. */
export const READ_ONLY_STATES: readonly ServiceState[] = ['suspendida'];
export const serviceIsReadOnly = (state: ServiceState) => READ_ONLY_STATES.includes(state);

/** Rutas que siguen abiertas en solo lectura: sesión, cuenta propia, panel del administrador y avisos. */
const ALWAYS_OPEN = ['/api/auth', '/api/me', '/api/admin', '/api/notices', '/api/notification-preferences'];
const CACHE_MS = 60_000;

type Lookup = (userId: string) => Promise<OwnService | null>;

/** Día de hoy en Argentina, como «AAAA-MM-DD». */
export const argentinaToday = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(now);

/**
 * El servicio de la nutricionista que inició sesión. Lee con el cliente del servidor porque las tablas del
 * servicio no tienen permisos para usuarias; solo devuelve estado, fechas y precio (nunca la nota interna).
 * `null` si quien llama no es nutricionista o la base no está conectada (modo demo).
 */
export async function loadOwnService(userId: string, now = new Date()): Promise<OwnService | null> {
  if (!isSupabaseEnabled()) return null;
  const db = privilegedDb();
  const nutri = await db.from('nutritionists').select('id').eq('user_id', userId).maybeSingle();
  if (nutri.error) throw nutri.error;
  if (!nutri.data?.id) return null;
  const [subscription, settings] = await Promise.all([
    db.from('nutritionist_subscriptions').select('trial_ends_on,paid_until,override').eq('nutritionist_id', nutri.data.id).maybeSingle(),
    db.from('platform_settings').select('monthly_price').maybeSingle(),
  ]);
  if (subscription.error) throw subscription.error;
  if (!subscription.data) return null;
  const summary = summarizeService({ ...subscription.data, note: '' } as Parameters<typeof summarizeService>[0], argentinaToday(now));
  return { ...summary, monthly_price: (settings.data?.monthly_price as number | null | undefined) ?? null, read_only: serviceIsReadOnly(summary.state) };
}

export function createOwnServiceCache(lookup: Lookup, clock = () => Date.now()) {
  const cache = new Map<string, { at: number; value: OwnService | null }>();
  return {
    async get(userId: string) {
      const hit = cache.get(userId);
      if (hit && clock() - hit.at < CACHE_MS) return hit.value;
      const value = await lookup(userId);
      cache.set(userId, { at: clock(), value });
      return value;
    },
    clear() { cache.clear(); },
  };
}

/**
 * Solo lectura al vencer: con el servicio cortado o suspendido, la nutricionista sigue viendo todo, pero
 * cualquier escritura responde 403 con un mensaje claro. Las pacientes nunca se frenan (no tienen servicio).
 * Si no se puede consultar el estado, deja pasar: nunca bloquear por una falla propia.
 */
export function createServiceReadOnlyGuard(get: (userId: string) => Promise<OwnService | null>, onAdminChange: () => void = () => undefined) {
  return async function guard(c: Context, next: Next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) return next();
    // Un pago o un cambio del administrador se nota enseguida, sin esperar que venza la memoria.
    if (c.req.path.startsWith('/api/admin/')) { await next(); onAdminChange(); return; }
    if (ALWAYS_OPEN.some(prefix => c.req.path === prefix || c.req.path.startsWith(`${prefix}/`))) return next();
    const auth = c.get('auth');
    if (!auth || !('userId' in auth)) return next();
    let service: OwnService | null = null;
    try { service = await get(auth.userId); } catch (error) {
      writeOpsLog('warn', 'service_status_unavailable', { message: error instanceof Error ? error.message : 'unknown' });
      return next();
    }
    if (!service?.read_only) return next();
    return c.json({ code: 'service_read_only', error: READ_ONLY_MESSAGE }, 403);
  };
}

export const READ_ONLY_MESSAGE = 'Tu cuenta de Plan V está suspendida: podés ver todo, pero no cargar ni cambiar nada. Escribile a Plan V para reactivarla.';

export function registerOwnServiceRoutes(app: Hono, get: (userId: string) => Promise<OwnService | null>) {
  app.get('/api/me/service', async (c) => {
    const auth = c.get('auth');
    if (!auth || !('userId' in auth)) return c.json({ service: null });
    return c.json({ service: await get(auth.userId) });
  });
}
