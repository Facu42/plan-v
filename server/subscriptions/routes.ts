import type { Context, Hono } from 'hono';
import { z } from 'zod';
import { CareError } from '../care/errors.js';
import { isSupabaseEnabled, getRequestDb } from '../db/supabase-client.js';
import { sbGetActor } from '../db/supabase-repo.js';
import { subscriptionsEnabled } from './flag.js';
import * as service from './service.js';

const uuid = z.uuid();
const amount = z.number().int().min(100_000).max(1_000_000_000).refine(value => value % 100 === 0);
const email = z.email().max(254);
const slugSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{2,59}$/);

function parsed<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new CareError(400, 'Revisá los datos.');
  return result.data;
}

async function body<T>(c: Context, schema: z.ZodType<T>) {
  const raw = await c.req.text();
  if (raw.length > 8_000) throw new CareError(413, 'Los datos son demasiado largos.');
  try {
    return parsed(schema, JSON.parse(raw));
  } catch (error) {
    if (error instanceof CareError) throw error;
    throw new CareError(400, 'Los datos no son válidos.');
  }
}

function enabled() {
  if (!subscriptionsEnabled()) throw new CareError(404, 'No encontrado.');
  if (!isSupabaseEnabled()) throw new CareError(501, 'Esto necesita la base del consultorio.');
}

async function owner(c: Context) {
  enabled();
  const auth = c.get('auth');
  if (!('userId' in auth)) throw new CareError(403, 'Solo la nutricionista puede hacer esto.');
  const actor = await sbGetActor(auth.userId);
  if (actor?.role !== 'nutri') throw new CareError(403, 'Solo la nutricionista puede hacer esto.');
  return actor.nutritionistId;
}

async function reader(c: Context, nutritionistId: string) {
  enabled();
  const auth = c.get('auth');
  if (!('userId' in auth)) throw new CareError(403, 'No tenés acceso a este consultorio.');
  const allowed = await getRequestDb().rpc('scheduling_can_manage', { nid: nutritionistId });
  if (allowed.error || !allowed.data) throw new CareError(403, 'No tenés acceso a este consultorio.');
}

async function patient(c: Context) {
  enabled();
  const auth = c.get('auth');
  if (!('userId' in auth)) throw new CareError(403, 'Iniciá sesión.');
  const actor = await sbGetActor(auth.userId);
  if (actor?.role !== 'paciente' || !actor.patientId) throw new CareError(403, 'Solo la paciente puede ver su débito.');
  return actor.patientId;
}

function notice(c: Context) {
  const queryId = c.req.query('data.id') ?? '';
  return {
    dataId: queryId,
    requestId: c.req.header('x-request-id') ?? '',
    signature: c.req.header('x-signature') ?? '',
    secret: process.env.MP_SCHEDULING_WEBHOOK_SECRET,
    now: Date.now(),
    topic: c.req.query('type') ?? '',
    action: c.req.query('topic') ?? null,
    notificationId: null as string | null,
    userId: null as string | null,
    liveMode: null as boolean | null,
  };
}

async function enrichNotice(c: Context) {
  const input = notice(c);
  const raw = await c.req.text();
  if (!raw) return input;
  try {
    const payload = JSON.parse(raw) as Record<string, unknown>;
    const data = payload.data as { id?: unknown } | undefined;
    return {
      ...input,
      dataId: input.dataId || (data?.id == null ? '' : String(data.id)),
      topic: input.topic || (typeof payload.type === 'string' ? payload.type : ''),
      action: typeof payload.action === 'string' ? payload.action : input.action,
      notificationId: payload.id == null ? null : String(payload.id),
      userId: payload.user_id == null ? null : String(payload.user_id),
      liveMode: typeof payload.live_mode === 'boolean' ? payload.live_mode : null,
    };
  } catch {
    return input;
  }
}

const planBody = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(280).nullable().optional(),
  amount_cents: amount,
  public_visible: z.boolean().optional(),
}).strict();

const planPatch = planBody.partial().extend({
  expected_revision: z.number().int().positive(),
  apply_to_active: z.boolean().optional(),
}).strict();

const createBody = z.object({
  plan_id: uuid,
  patient_id: uuid,
  payer_email: email,
  source: z.enum(['panel', 'chat', 'patient_app']),
  client_request_id: uuid,
  contact_phone: z.string().trim().max(40).optional(),
}).strict();

const revisionBody = z.object({ expected_revision: z.number().int().positive() }).strict();

export function registerPatientSubscriptionRoutes(app: Hono) {
  const webhook = async (c: Context) => {
    if (!subscriptionsEnabled()) return c.json({ error: 'No encontrado' }, 404);
    if (!process.env.MP_SCHEDULING_WEBHOOK_SECRET || !isSupabaseEnabled()) throw new CareError(501, 'El proveedor de pagos todavía no está configurado.');
    const status = await service.receiveWebhook(await enrichNotice(c));
    if (status === 401) return c.json({ error: 'No se pudo verificar el aviso.' }, 401);
    return c.json({ received: true }, status);
  };
  app.post('/api/public/scheduling/mp/webhook', webhook);
  app.post('/api/public/scheduling/mp/webhook/', webhook);

  app.get('/api/scheduling/subscription-plans', async c => c.json({ plans: await listPlans(await owner(c)) }));
  app.post('/api/scheduling/subscription-plans', async c => {
    const nutritionistId = await owner(c);
    const input = await body(c, planBody);
    return c.json({ plan: await service.createPlan(nutritionistId, { name: input.name, description: input.description ?? null, amount_cents: input.amount_cents, public_visible: input.public_visible ?? false }) }, 201);
  });
  app.patch('/api/scheduling/subscription-plans/:id', async c => {
    const nutritionistId = await owner(c);
    const input = await body(c, planPatch);
    return c.json({ plan: await service.updatePlan(nutritionistId, parsed(uuid, c.req.param('id')), input) });
  });
  app.post('/api/scheduling/subscription-plans/:id/archive', async c => {
    const nutritionistId = await owner(c);
    const input = await body(c, revisionBody);
    return c.json({ plan: await service.archivePlan(nutritionistId, parsed(uuid, c.req.param('id')), input.expected_revision) });
  });
  app.get('/api/scheduling/subscriptions', async c => {
    const nutritionistId = await owner(c);
    const status = c.req.query('status');
    return c.json(await service.listForNutritionist(nutritionistId, status || undefined, true));
  });
  app.post('/api/scheduling/subscriptions', async c => {
    const nutritionistId = await owner(c);
    const input = await body(c, createBody);
    return c.json(await service.createSubscription(nutritionistId, { ...input, contact_name: null, contact_phone: input.contact_phone ?? null }), 201);
  });
  app.post('/api/scheduling/subscriptions/reconcile', async c => c.json(await service.reconcileNutritionist(await owner(c))));
  app.post('/api/scheduling/subscriptions/:id/pause', async c => change(c, 'pause'));
  app.post('/api/scheduling/subscriptions/:id/resume', async c => change(c, 'resume'));
  app.post('/api/scheduling/subscriptions/:id/cancel', async c => change(c, 'cancel'));
  app.post('/api/scheduling/subscriptions/:id/link-patient', async c => {
    const nutritionistId = await owner(c);
    const input = await body(c, z.object({ patient_id: uuid, expected_revision: z.number().int().positive() }).strict());
    return c.json(await service.linkPatient(nutritionistId, parsed(uuid, c.req.param('id')), input.patient_id, input.expected_revision));
  });
  app.post('/api/scheduling/subscriptions/:id/reconcile', async c => {
    const nutritionistId = await owner(c);
    return c.json(await service.reconcileNutritionist(nutritionistId, parsed(uuid, c.req.param('id'))));
  });
  app.post('/api/scheduling/subscriptions/:id/send-chat', async c => {
    const nutritionistId = await owner(c);
    const input = await body(c, revisionBody);
    return c.json(await service.sendChat(nutritionistId, parsed(uuid, c.req.param('id')), input.expected_revision));
  });

  app.get('/api/team/:nid/subscription-plans', async c => {
    const nutritionistId = parsed(uuid, c.req.param('nid'));
    await reader(c, nutritionistId);
    return c.json({ plans: await listPlans(nutritionistId) });
  });
  app.get('/api/team/:nid/subscriptions', async c => {
    const nutritionistId = parsed(uuid, c.req.param('nid'));
    await reader(c, nutritionistId);
    return c.json(await service.listForNutritionist(nutritionistId, c.req.query('status') || undefined, false));
  });

  app.get('/api/public/scheduling/:slug/subscription-plans', async c => {
    enabled();
    return c.json({ plans: await service.visiblePlans(parsed(slugSchema, c.req.param('slug'))) });
  });
  app.post('/api/public/scheduling/:slug/subscriptions', async c => {
    enabled();
    const input = await body(c, z.object({
      plan_id: uuid,
      payer_email: email,
      name: z.string().trim().min(2).max(120),
      phone: z.string().trim().max(40),
      contact_ok: z.literal(true),
      client_request_id: uuid,
    }).strict());
    return c.json(await service.createPublicSubscription(parsed(slugSchema, c.req.param('slug')), input), 201);
  });
  app.get('/api/public/scheduling/:slug/subscriptions/:id', async c => {
    enabled();
    return c.json(await service.publicStatus(parsed(slugSchema, c.req.param('slug')), parsed(uuid, c.req.param('id')), c.req.query('token') ?? ''));
  });

  app.get('/api/patient/subscriptions', async c => {
    const patientId = await patient(c);
    return c.json({ subscriptions: await service.patientSubscriptions(), patient_id: patientId });
  });
  app.post('/api/patient/subscriptions/:id/cancel', async c => {
    const patientId = await patient(c);
    const input = await body(c, revisionBody);
    return c.json(await service.cancelForPatient(patientId, parsed(uuid, c.req.param('id')), input.expected_revision));
  });
}

async function listPlans(nutritionistId: string) {
  return service.listPlans(nutritionistId);
}

async function change(c: Context, action: 'pause' | 'resume' | 'cancel') {
  const nutritionistId = await owner(c);
  const input = await body(c, revisionBody);
  return c.json(await service.changeSubscription(nutritionistId, parsed(uuid, c.req.param('id')), action, input.expected_revision, 'nutritionist'));
}
