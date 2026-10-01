import type { Context, Hono } from 'hono';
import { z } from 'zod';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import * as repo from './repository.js';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => !Number.isNaN(Date.parse(`${value}T12:00:00Z`)));
const settingsSchema = z.object({
  monthly_price: z.number().int().min(1).max(100_000_000).nullable(),
  trial_days: z.number().int().min(0).max(365),
});
const paymentSchema = z.object({
  amount: z.number().int().min(1).max(100_000_000),
  months: z.number().int().min(1).max(24),
  paid_on: dateSchema,
  method: z.enum(['transferencia', 'mercado_pago', 'efectivo', 'otro']),
  note: z.string().trim().max(280).optional(),
});
const trialSchema = z.object({ days: z.number().int().min(1).max(365) });
const overrideSchema = z.object({ override: z.enum(['none', 'waived', 'suspended']), note: z.string().trim().max(280).default('') });

async function body<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  const raw = await c.req.text();
  if (raw.length > 4_000) throw new repo.CareError(413, 'Los datos son demasiado largos.');
  try { return schema.parse(JSON.parse(raw)); } catch { throw new repo.CareError(400, 'Revisá los datos cargados.'); }
}

/**
 * Sólo el administrador del servicio. En la base lo decide platform_admins (cada función lo vuelve
 * a validar); en modo demo no hay sesión y el panel se ve con los ejemplos, salvo desde la vista de paciente.
 */
async function requireAdmin(c: Context): Promise<boolean> {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (c.req.query('audience') === 'patient') throw new repo.CareError(403, 'No tenés permiso para esta acción.');
    return false;
  }
  if (!await repo.isAdmin(true)) throw new repo.CareError(403, 'No tenés permiso para esta acción.');
  return true;
}

function source(persistent: boolean) {
  return persistent ? 'supabase' : 'memory';
}

export function registerAdminRoutes(app: Hono) {
  // Para mostrar el acceso al panel en el menú. En demo sólo con ?audience=admin.
  app.get('/api/admin/me', async (c) => {
    const auth = c.get('auth');
    const persistent = 'userId' in auth && isSupabaseEnabled();
    const admin = persistent ? await repo.isAdmin(true) : c.req.query('audience') === 'admin';
    return c.json({ admin });
  });

  app.get('/api/admin/service', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ board: await repo.getBoard(persistent), source: source(persistent) });
  });

  app.put('/api/admin/service/settings', async (c) => {
    const persistent = await requireAdmin(c);
    const input = await body(c, settingsSchema);
    return c.json({ settings: await repo.saveSettings(input, persistent), source: source(persistent) });
  });

  app.post('/api/admin/nutritionists/:id/payments', async (c) => {
    const persistent = await requireAdmin(c);
    const input = await body(c, paymentSchema);
    return c.json({ nutritionist: await repo.recordPayment(c.req.param('id'), input, persistent), source: source(persistent) }, 201);
  });

  app.delete('/api/admin/service-payments/:paymentId', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ nutritionist: await repo.voidPayment(c.req.param('paymentId'), persistent), source: source(persistent) });
  });

  app.post('/api/admin/nutritionists/:id/trial', async (c) => {
    const persistent = await requireAdmin(c);
    const input = await body(c, trialSchema);
    return c.json({ nutritionist: await repo.extendTrial(c.req.param('id'), input.days, persistent), source: source(persistent) });
  });

  app.put('/api/admin/nutritionists/:id/override', async (c) => {
    const persistent = await requireAdmin(c);
    const input = await body(c, overrideSchema);
    return c.json({ nutritionist: await repo.setOverride(c.req.param('id'), input.override, input.note, persistent), source: source(persistent) });
  });
}
