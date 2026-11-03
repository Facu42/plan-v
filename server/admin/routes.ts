import type { Context, Hono } from 'hono';
import { z } from 'zod';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import * as repo from './repository.js';
import * as accounts from './accounts.js';
import { demoAiCheck, runAiCheck } from './ai-check.js';
import { runFullAiCheck } from './ai-check-full.js';
import { MFA_REQUIRED_MESSAGE, tokenAal } from '../security/mfa.js';
import * as centro from './centro.js';
import { registerAdminAudit } from './audit.js';
import { adminPlanBoard, adminReplaceTesters, adminUpdatePlan } from '../billing-platform/plan-admin.js';
import { payerEmail } from '../billing-platform/repository.js';
import * as hub from './hub.js';

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

const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());
const passwordSchema = z.string().min(10).max(72);
const nutritionistCreateSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  mode: z.enum(['invite', 'password']),
  password: passwordSchema.optional(),
}).strict().refine((input) => input.mode === 'invite' ? input.password === undefined : input.password !== undefined);
const testAccountsSchema = z.object({ email_base: emailSchema, password: passwordSchema }).strict();
const noteSchema = z.object({ note: z.string().max(500) }).strict();
const pesosSchema = z.number().int().positive().max(100_000_000);
const planPriceSchema = z.object({
  monthly_pesos: pesosSchema,
  annual_pesos: pesosSchema,
  founder_monthly_pesos: pesosSchema,
  founder_annual_pesos: pesosSchema,
  active: z.boolean(),
}).strict();
const testersSchema = z.object({
  emails: z.array(z.string().trim().toLowerCase().max(254).pipe(z.email())).max(50),
}).strict();
const hubNotaSchema = z.object({ body: z.string().trim().min(1).max(500) }).strict();
const hubTareaSchema = z.object({
  title: z.string().trim().min(1).max(140),
  due_on: dateSchema.nullable().optional(),
}).strict();
const hubTareaHechaSchema = z.object({ done: z.boolean() }).strict();
const hubLeadSchema = z.object({
  name: z.string().trim().min(2).max(80),
  contact: z.string().trim().max(120).default(''),
  source: z.enum(['ig', 'wa', 'web', 'referido', 'email']),
  stage: z.enum(['lead', 'demo', 'trial', 'paga', 'baja']).default('lead'),
  next_step: z.string().trim().max(200).default(''),
  nutritionist_id: z.string().uuid().nullable().optional(),
}).strict();
const hubLeadPatchSchema = z.object({
  stage: z.enum(['lead', 'demo', 'trial', 'paga', 'baja']).optional(),
  next_step: z.string().trim().max(200).optional(),
  source: z.enum(['ig', 'wa', 'web', 'referido', 'email']).optional(),
  nutritionist_id: z.string().uuid().nullable().optional(),
}).strict();
const hubMensajeSchema = z.object({
  channel: z.enum(['whatsapp', 'instagram', 'email']),
  contact_name: z.string().trim().min(1).max(80),
  contact_handle: z.string().trim().max(120).default(''),
  body: z.string().trim().min(1).max(2000),
}).strict();

/** Para las altas: JSON roto es 400; datos que no cumplen, 422. */
async function strictBody<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  const raw = await c.req.text();
  if (raw.length > 4_000) throw new repo.CareError(413, 'Los datos son demasiado largos.');
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new repo.CareError(400, 'Revisá los datos cargados.'); }
  const result = schema.safeParse(parsed);
  if (!result.success) throw new repo.CareError(422, 'Revisá los datos cargados.');
  return result.data;
}

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
  // El centro de mando pide el segundo paso siempre, aunque MFA_ENFORCE esté apagado.
  if (tokenAal(c.req.header('Authorization')) !== 'aal2') throw new repo.CareError(403, MFA_REQUIRED_MESSAGE);
  return true;
}

function source(persistent: boolean) {
  return persistent ? 'supabase' : 'memory';
}

export function registerAdminRoutes(app: Hono) {
  registerAdminAudit(app, requireAdmin);
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

  app.get('/api/admin/centro/resumen', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ resumen: await centro.loadResumen(persistent), source: source(persistent) });
  });
  app.get('/api/admin/centro/nutris', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ nutris: await centro.loadNutris(persistent), source: source(persistent) });
  });
  app.get('/api/admin/centro/pacientes', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ pacientes: await centro.loadPacientes(persistent), source: source(persistent) });
  });
  app.get('/api/admin/centro/cobros', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ cobros: await centro.loadCobros(persistent), source: source(persistent) });
  });
  app.get('/api/admin/centro/salud', async (c) => {
    await requireAdmin(c);
    return c.json({ salud: await centro.loadSalud(), source: source(isSupabaseEnabled()) });
  });
  app.get('/api/admin/centro/seguridad', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ seguridad: await centro.loadSeguridad(persistent), source: source(persistent) });
  });

  app.get('/api/admin/hub/inicio', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ inicio: await hub.loadInicio(persistent), source: source(persistent) });
  });
  app.get('/api/admin/hub/nutris', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ nutris: await hub.loadNutrisHub(persistent), source: source(persistent) });
  });
  app.get('/api/admin/hub/nutris/:id', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ ficha: await hub.loadFicha(persistent, c.req.param('id')), source: source(persistent) });
  });
  app.post('/api/admin/hub/nutris/:id/notas', async (c) => {
    const persistent = await requireAdmin(c);
    const input = await strictBody(c, hubNotaSchema);
    return c.json({ ficha: await hub.addNota(persistent, c.req.param('id'), input.body), source: source(persistent) }, 201);
  });
  app.post('/api/admin/hub/nutris/:id/tareas', async (c) => {
    const persistent = await requireAdmin(c);
    const input = await strictBody(c, hubTareaSchema);
    return c.json({ ficha: await hub.addTarea(persistent, c.req.param('id'), input.title, input.due_on ?? null), source: source(persistent) }, 201);
  });
  app.patch('/api/admin/hub/tareas/:id', async (c) => {
    const persistent = await requireAdmin(c);
    const input = await strictBody(c, hubTareaHechaSchema);
    return c.json({ tarea: await hub.toggleTarea(persistent, c.req.param('id'), input.done), source: source(persistent) });
  });
  app.get('/api/admin/hub/leads', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ ...(await hub.loadLeads(persistent)), source: source(persistent) });
  });
  app.post('/api/admin/hub/leads', async (c) => {
    const persistent = await requireAdmin(c);
    const input = await strictBody(c, hubLeadSchema);
    return c.json({
      lead: await hub.createLead(persistent, { ...input, nutritionist_id: input.nutritionist_id ?? null }),
      source: source(persistent),
    }, 201);
  });
  app.patch('/api/admin/hub/leads/:id', async (c) => {
    const persistent = await requireAdmin(c);
    const input = await strictBody(c, hubLeadPatchSchema);
    return c.json({ lead: await hub.updateLead(persistent, c.req.param('id'), input), source: source(persistent) });
  });
  app.get('/api/admin/hub/facturacion', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ facturacion: await hub.loadFacturacion(persistent), source: source(persistent) });
  });
  app.get('/api/admin/hub/bandeja', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ bandeja: await hub.loadBandeja(persistent), source: source(persistent) });
  });
  app.post('/api/admin/hub/bandeja', async (c) => {
    const persistent = await requireAdmin(c);
    const input = await strictBody(c, hubMensajeSchema);
    return c.json({ bandeja: await hub.anotarMensaje(persistent, input), source: source(persistent) }, 201);
  });
  app.post('/api/admin/hub/bandeja/:id/lead', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ ...(await hub.crearLeadDesdeHilo(persistent, c.req.param('id'))), source: source(persistent) }, 201);
  });
  app.get('/api/admin/hub/conexiones', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ conexiones: hub.loadConexiones(), source: source(persistent) });
  });

  app.get('/api/admin/planes', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ ...(await adminPlanBoard(persistent)), source: source(persistent) });
  });

  app.put('/api/admin/planes/:code', async (c) => {
    const persistent = await requireAdmin(c);
    const input = await body(c, planPriceSchema);
    const auth = c.get('auth');
    const userId = persistent && 'userId' in auth ? auth.userId : null;
    const email = userId ? await payerEmail(userId) : 'admin@local';
    if (!email) throw new repo.CareError(409, 'Tu cuenta no tiene un mail para anotar el cambio.');
    return c.json({ ...(await adminUpdatePlan(c.req.param('code'), input, { userId, email }, persistent)), source: source(persistent) });
  });

  app.put('/api/admin/planes-testers', async (c) => {
    const persistent = await requireAdmin(c);
    const input = await body(c, testersSchema);
    return c.json({ ...(await adminReplaceTesters(input.emails, persistent)), source: source(persistent) });
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

  // Altas. Nunca devuelven claves ni enlaces de acceso.
  app.post('/api/admin/nutritionists', async (c) => {
    const persistent = await requireAdmin(c);
    const input = await strictBody(c, nutritionistCreateSchema);
    return c.json({ nutritionist: await accounts.createNutritionist(input, persistent), source: source(persistent) }, 201);
  });

  app.post('/api/admin/nutritionists/:id/send-access', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ ...await accounts.sendAccess(c.req.param('id'), persistent), source: source(persistent) });
  });

  app.put('/api/admin/nutritionists/:id/note', async (c) => {
    const persistent = await requireAdmin(c);
    const input = await strictBody(c, noteSchema);
    return c.json({ nutritionist: await repo.setNote(c.req.param('id'), input.note, persistent), source: source(persistent) });
  });

  app.get('/api/admin/test-accounts', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ accounts: await accounts.listTestAccounts(persistent), source: source(persistent) });
  });

  app.post('/api/admin/test-accounts', async (c) => {
    const persistent = await requireAdmin(c);
    const input = await strictBody(c, testAccountsSchema);
    const result = await accounts.createTestAccounts(input, persistent, (path, init) => app.request(path, init));
    return c.json({ ...result, source: source(persistent) }, result.created ? 201 : 200);
  });
  // Prueba texto y una foto de ejemplo sin entrar a ninguna cuenta. No guarda nada.
  app.post('/api/admin/ai-check', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ check: persistent ? await runAiCheck() : demoAiCheck(), source: source(persistent) });
  });

  // Receta de ejemplo y cuatro fotos de ejemplo (platos e ingredientes). No guarda nada.
  app.post('/api/admin/ai-check/full', async (c) => {
    const persistent = await requireAdmin(c);
    if (!persistent) throw new repo.CareError(409, 'La prueba completa necesita el servicio real, no el modo demo.');
    return c.json({ check: await runFullAiCheck(), source: source(persistent) });
  });
}
