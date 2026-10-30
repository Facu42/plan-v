import type { Context, Hono } from 'hono';
import { z } from 'zod';
import { CareError } from '../care/errors.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { sbGetActor } from '../db/supabase-repo.js';
import { billingEnabled } from './flag.js';
import { cancelPlan, checkout, changePlan, disabledPlan, planForNutritionist, receiveWebhook } from './service.js';

const checkoutSchema = z.object({
  plan_code: z.enum(['arranque', 'pro', 'consultorio']),
  billing_cycle: z.enum(['monthly', 'annual']),
  client_request_id: z.string().trim().min(8).max(80),
}).strict();
const changeSchema = z.object({
  plan_code: z.enum(['arranque', 'pro', 'consultorio']),
  billing_cycle: z.enum(['monthly', 'annual']),
}).strict();
const cancelSchema = z.object({ reason: z.string().trim().min(2).max(200) }).strict();

async function nutri(c: Context) {
  const auth = c.get('auth');
  if (!isSupabaseEnabled() || !auth || !('userId' in auth)) throw new CareError(501, 'El cobro de planes necesita una sesión real.');
  const actor = await sbGetActor(auth.userId);
  if (actor?.role !== 'nutri') throw new CareError(403, 'Solo la nutricionista puede ver su plan.');
  return { userId: auth.userId, nutritionistId: actor.nutritionistId };
}

async function body<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  const parsed = schema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new CareError(400, 'Revisá el plan elegido.');
  return parsed.data;
}

function notice(c: Context) {
  const queryId = c.req.query('data.id') ?? c.req.query('id') ?? '';
  return c.req.json().catch(() => ({})).then((payload: { type?: string; action?: string; data?: { id?: string } }) => ({
    dataId: String(payload.data?.id ?? queryId),
    requestId: c.req.header('x-request-id') ?? '',
    signature: c.req.header('x-signature') ?? '',
    topic: String(payload.type ?? payload.action ?? 'payment'),
    now: Date.now(),
  }));
}

async function webhook(c: Context) {
  if (!billingEnabled()) return c.json({ error: 'No encontrado' }, 404);
  const status = await receiveWebhook(await notice(c));
  if (status === 401) return c.json({ error: 'Firma inválida' }, 401);
  if (status === 501) return c.json({ error: 'Falta el secreto del aviso de Mercado Pago.' }, 501);
  if (status === 503) return c.json({ error: 'Mercado Pago no respondió. Puede reintentar.' }, 503);
  return c.json({ ok: true }, 200);
}

export function registerPlatformBillingRoutes(app: Hono) {
  app.get('/api/billing/plan', async (c) => {
    if (!billingEnabled()) return c.json(disabledPlan());
    const actor = await nutri(c);
    return c.json(await planForNutritionist(actor.nutritionistId));
  });
  app.post('/api/billing/checkout', async (c) => {
    if (!billingEnabled()) return c.json({ error: 'El cobro de planes todavía no está activado.' }, 501);
    const actor = await nutri(c);
    const input = await body(c, checkoutSchema);
    return c.json(await checkout({ nutritionistId: actor.nutritionistId, userId: actor.userId, planCode: input.plan_code, cycle: input.billing_cycle, clientRequestId: input.client_request_id }), 201);
  });
  app.post('/api/billing/change-plan', async (c) => {
    if (!billingEnabled()) return c.json({ error: 'El cobro de planes todavía no está activado.' }, 501);
    const actor = await nutri(c);
    const input = await body(c, changeSchema);
    return c.json(await changePlan({ nutritionistId: actor.nutritionistId, planCode: input.plan_code, cycle: input.billing_cycle }));
  });
  app.post('/api/billing/cancel', async (c) => {
    if (!billingEnabled()) return c.json({ error: 'El cobro de planes todavía no está activado.' }, 501);
    const actor = await nutri(c);
    const input = await body(c, cancelSchema);
    return c.json(await cancelPlan({ nutritionistId: actor.nutritionistId, reason: input.reason }));
  });
  app.post('/api/public/billing/mp/webhook', webhook);
  app.post('/api/public/billing/mp/webhook/', webhook);
}
