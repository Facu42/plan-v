import type { Context, Hono } from 'hono';
import { z } from 'zod';
import { authorizePatientAction } from '../security/authorization.js';
import type { PatientAction } from '../security/contracts.js';
import * as sb from '../db/supabase-repo.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import * as repo from './repository.js';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => !Number.isNaN(Date.parse(`${value}T12:00:00Z`)));
const amountSchema = z.number().int().min(1).max(100_000_000);

const settingsSchema = z.object({
  default_fee: amountSchema.nullable(),
  alias: z.string().trim().max(60),
  payment_link: z.string().trim().max(300).refine((value) => value === '' || value.startsWith('https://')),
  instructions: z.string().trim().max(500),
});
const feeSchema = z.object({
  fee: z.object({ amount: amountSchema, first_due_on: dateSchema }).nullable(),
});
const paymentSchema = z.object({
  client_id: z.uuid().optional(),
  amount: amountSchema,
  paid_on: dateSchema,
  method: z.enum(['efectivo', 'transferencia', 'mercado_pago', 'otro']),
  note: z.string().trim().max(280).optional(),
});
const reviewSchema = z.object({ decision: z.enum(['confirm', 'reject', 'void']) });
const waiveSchema = z.object({ waived: z.boolean() });
const idSchema = z.uuid();

async function body<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  const raw = await c.req.text();
  if (raw.length > 4_000) throw new repo.CareError(413, 'Los datos son demasiado largos.');
  try { return schema.parse(JSON.parse(raw)); } catch { throw new repo.CareError(400, 'Revisá el monto, la fecha y el medio de pago.'); }
}

function isPersistent(c: Context): boolean {
  const auth = c.get('auth');
  return 'userId' in auth && isSupabaseEnabled();
}

/** En modo demo no hay sesión: la vista de paciente se marca con ?audience=patient. */
async function requireNutri(c: Context): Promise<boolean> {
  if (!isPersistent(c)) {
    if (c.req.query('audience') === 'patient') throw new repo.CareError(403, 'No tenés permiso para esta acción.');
    return false;
  }
  const auth = c.get('auth') as { userId: string };
  if (await sb.sbGetProfileRole(auth.userId) !== 'nutri') throw new repo.CareError(403, 'No tenés permiso para esta acción.');
  return true;
}

async function patientActor(c: Context, patientId: string, action: PatientAction) {
  if (!isPersistent(c)) return { persistent: false, role: c.req.query('audience') === 'patient' ? 'paciente' as const : 'nutri' as const };
  const auth = c.get('auth') as { userId: string };
  const actor = await authorizePatientAction(auth.userId, patientId, action, {
    getActor: sb.sbGetActor,
    getPatientResource: sb.sbGetPatientResource,
  });
  if (!actor) throw new repo.CareError(403, 'No tenés permiso para esta acción.');
  return { persistent: true, role: actor.role };
}

function source(persistent: boolean) {
  return persistent ? 'supabase' : 'memory';
}

export function registerFeeRoutes(app: Hono) {
  app.get('/api/billing', async (c) => {
    const persistent = await requireNutri(c);
    return c.json({ board: await repo.getBoard(persistent), source: source(persistent) });
  });

  app.put('/api/billing/settings', async (c) => {
    const persistent = await requireNutri(c);
    const input = await body(c, settingsSchema);
    return c.json({ settings: await repo.saveSettings(input, persistent), source: source(persistent) });
  });

  app.get('/api/patients/:id/ledger', async (c) => {
    const id = c.req.param('id');
    const { persistent } = await patientActor(c, id, 'read_patient');
    return c.json({ ledger: await repo.getLedger(id, persistent), source: source(persistent) });
  });

  app.put('/api/patients/:id/fee', async (c) => {
    const id = c.req.param('id');
    const { persistent, role } = await patientActor(c, id, 'edit_billing');
    if (role !== 'nutri') throw new repo.CareError(403, 'No tenés permiso para esta acción.');
    const input = await body(c, feeSchema);
    return c.json({ ledger: await repo.setFee(id, input.fee, persistent), source: source(persistent) });
  });

  // La nutricionista registra un pago; la paciente avisa "Ya pagué" (queda a confirmar).
  app.post('/api/patients/:id/payments', async (c) => {
    const id = c.req.param('id');
    const { persistent, role } = await patientActor(c, id, 'read_patient');
    const input = await body(c, paymentSchema);
    if (role === 'paciente') {
      return c.json({ ledger: await repo.reportPayment(id, input, persistent), source: source(persistent) }, 201);
    }
    if (persistent) await patientActor(c, id, 'edit_billing');
    return c.json({ ledger: await repo.recordPayment(id, input, persistent), source: source(persistent) }, 201);
  });

  app.patch('/api/payments/:paymentId', async (c) => {
    const parsed = idSchema.safeParse(c.req.param('paymentId'));
    if (!parsed.success) throw new repo.CareError(404, 'Ese pago no existe.');
    const persistent = await requireNutri(c);
    const input = await body(c, reviewSchema);
    return c.json({ ledger: await repo.reviewPayment(parsed.data, input.decision, persistent), source: source(persistent) });
  });

  app.patch('/api/charges/:chargeId', async (c) => {
    const parsed = idSchema.safeParse(c.req.param('chargeId'));
    if (!parsed.success) throw new repo.CareError(404, 'Esa cuota no existe.');
    const persistent = await requireNutri(c);
    const input = await body(c, waiveSchema);
    return c.json({ ledger: await repo.setChargeWaived(parsed.data, input.waived, persistent), source: source(persistent) });
  });
}
