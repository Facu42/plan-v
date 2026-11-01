import { randomUUID } from 'node:crypto';
import type { Context, Hono } from 'hono';
import { z } from 'zod';
import { call } from './repository.js';
import { writeOpsLog } from '../ops/log.js';

const actions: Array<[string, RegExp, string]> = [
  ['POST', /^\/api\/admin\/nutritionists$/, 'nutritionist.create'],
  ['PUT', /^\/api\/admin\/nutritionists\/[^/]+\/override$/, 'nutritionist.override'],
  ['POST', /^\/api\/admin\/nutritionists\/[^/]+\/trial$/, 'nutritionist.trial'],
  ['POST', /^\/api\/admin\/nutritionists\/[^/]+\/payments$/, 'payment.create'],
  ['DELETE', /^\/api\/admin\/service-payments\/[^/]+$/, 'payment.void'],
  ['PUT', /^\/api\/admin\/service\/settings$/, 'service.settings'],
  ['POST', /^\/api\/admin\/nutritionists\/[^/]+\/send-access$/, 'nutritionist.send_access'],
  ['PUT', /^\/api\/admin\/nutritionists\/[^/]+\/note$/, 'nutritionist.note'],
  ['POST', /^\/api\/admin\/test-accounts$/, 'test_accounts.create'],
  ['POST', /^\/api\/admin\/ai-check(?:\/full)?$/, 'ai.check'],
];
const overrideAuditSchema = z.object({ override: z.enum(['none', 'waived', 'suspended']) });
const overrideActions = { none: 'nutritionist.restore', waived: 'nutritionist.waive', suspended: 'nutritionist.suspend' } as const;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Registro previo durable: si Auth o el proceso se corta, queda el intento sin resultado.
 * Nunca copia cuerpos, notas, claves, correos, enlaces ni mensajes de error.
 */
export function registerAdminAudit(app: Hono, requireAdmin: (c: Context) => Promise<boolean>): void {
  app.use('/api/admin/*', async (c, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(c.req.method)) return next();
    if (!await requireAdmin(c)) return next();
    let action = actions.find(([method, path]) => method === c.req.method && path.test(c.req.path))?.[2] ?? 'admin.other';
    if (action === 'nutritionist.override') {
      // La copia deja el cuerpo disponible para la validación propia de la ruta.
      // Sólo se extrae el enum; ninguna nota o campo libre llega al registro.
      const raw = await c.req.raw.clone().text();
      if (raw.length <= 4_000) {
        try {
          const parsed = overrideAuditSchema.safeParse(JSON.parse(raw));
          if (parsed.success) action = overrideActions[parsed.data.override];
        } catch { /* La ruta devolverá el error de validación correspondiente. */ }
      }
    }
    const rawTarget = c.req.path.match(/^\/api\/admin\/(?:nutritionists|service-payments)\/([^/]+)/)?.[1];
    const args = { request_id: randomUUID(), input_action: action, target: rawTarget && uuid.test(rawTarget) ? rawTarget : null };
    // Si esta escritura falla, la acción todavía no ocurrió: se bloquea antes de continuar.
    await call('admin_record_audit', { ...args, input_outcome: 'started' });
    try {
      await next();
    } finally {
      try {
        await call('admin_record_audit', { ...args, input_outcome: c.error || c.res.status >= 400 ? 'failed' : 'succeeded' });
      } catch {
        // La acción pudo ocurrir; no devolver un error que invite a repetirla. El inicio ya quedó.
        writeOpsLog('warn', 'admin_audit_incomplete', { action, request_id: args.request_id });
      }
    }
  });
}
