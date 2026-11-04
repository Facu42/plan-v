import { registerCampaignRoutes } from './campaigns-routes.js';
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

async function completarBorrador(): Promise<((texto: string) => Promise<string>) | undefined> {
  try {
    const { resolveAiMode } = await import('../ai/mode.js');
    if (resolveAiMode() !== 'live') return undefined;
    const { generateText } = await import('ai');
    const { getAiModel } = await import('../ai/provider.js');
    return async (texto: string) => (await generateText({
      model: getAiModel(),
      prompt: `Proponé una respuesta corta en español rioplatense. No inventes precios ni datos que no estén en el mensaje. Mensaje: ${texto.slice(0, 500)}`,
      abortSignal: AbortSignal.timeout(12_000),
    })).text;
  } catch {
    return undefined;
  }
}

async function enviarCanal(channel: 'whatsapp' | 'instagram' | 'email', handle: string, texto: string): Promise<void> {
  if (channel === 'instagram') throw new repo.CareError(503, 'Instagram está preparado y todavía no envía.');
  if (channel === 'whatsapp') {
    const { whatsappConfig } = await import('../communications/provider.js');
    const config = whatsappConfig();
    if (!config?.enabled) throw new repo.CareError(503, 'WhatsApp está apagado. Faltan las credenciales o WHATSAPP_ENABLED no está en true.');
    const response = await fetch(`https://graph.facebook.com/${config.version}/${config.phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: handle.replace(/\D/g, ''), type: 'text', text: { preview_url: false, body: texto } }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) throw new repo.CareError(503, 'WhatsApp no aceptó el mensaje. No se reintentó.');
    return;
  }
  const { mailListo } = await import('./hub-ops.js');
  if (!mailListo()) throw new repo.CareError(503, 'El mail está apagado.');
  const asunto = 'Mensaje de Nutridash';
  const { brevoConfig, sendBrevoEmail } = await import('../mail/brevo.js');
  const brevo = brevoConfig();
  if (brevo) {
    await sendBrevoEmail(brevo, { to: { email: handle }, subject: asunto, text: texto, html: `<p>${texto}</p>` });
    return;
  }
  const { mailTransportConfig, sendOperationalMail } = await import('../mail/transport.js');
  const smtp = mailTransportConfig();
  if (!smtp) throw new repo.CareError(503, 'El mail está apagado.');
  await sendOperationalMail(smtp, { to: { email: handle }, subject: asunto, text: texto, html: `<p>${texto}</p>` }, async () => true);
}

export function registerAdminRoutes(app: Hono) {
  registerAdminAudit(app, requireAdmin);
  registerCampaignRoutes(app, requireAdmin);
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
  app.get('/api/admin/hub/riesgo', async (c) => {
    const persistent = await requireAdmin(c);
    const motivo = z.enum(['sin_login', 'pocos_pacientes', 'pago_rechazado']).optional().safeParse(c.req.query('motivo') || undefined);
    return c.json({ ...(await hub.loadRiesgos(persistent, motivo.success ? motivo.data : undefined)), source: source(persistent) });
  });
  app.get('/api/admin/hub/cobranza', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ cobranza: await hub.loadCobranza(persistent), source: source(persistent) });
  });
  app.post('/api/admin/hub/cobranza', async (c) => {
    const persistent = await requireAdmin(c);
    const input = await strictBody(c, z.object({ payment_id: z.string().trim().min(1).max(80), kind: z.enum(['aviso', 'releer']) }).strict());
    return c.json({ cobranza: await hub.registrarCobranza(persistent, input), source: source(persistent) });
  });
  app.get('/api/admin/hub/activacion', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ activacion: await hub.loadActivacion(persistent), source: source(persistent) });
  });
  app.post('/api/admin/hub/bandeja/:id/borrador', async (c) => {
    const persistent = await requireAdmin(c);
    return c.json({ bandeja: await hub.sugerirRespuesta(persistent, c.req.param('id'), await completarBorrador()), source: source(persistent) });
  });
  app.post('/api/admin/hub/bandeja/:id/enviar', async (c) => {
    const persistent = await requireAdmin(c);
    const input = await strictBody(c, z.object({ body: z.string().trim().min(1).max(500) }).strict());
    const bandeja = await hub.enviarRespuesta(persistent, c.req.param('id'), input.body, (hilo, texto) => enviarCanal(hilo.channel, hilo.contact_handle, texto));
    return c.json({ bandeja, source: source(persistent) });
  });
  app.post('/webhooks/hub/email', async (c) => {
    const secret = process.env.HUB_INBOX_EMAIL_SECRET?.trim();
    if (!secret) return c.text('Apagado', 503);
    if (c.req.header('x-hub-inbox-secret') !== secret) return c.text('Forbidden', 403);
    const parsed = z.object({
      from_email: z.string().trim().pipe(z.email()),
      from_name: z.string().trim().max(80).default(''),
      body: z.string().trim().min(1).max(2000),
    }).safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.text('Invalid', 400);
    await hub.anotarMailEntrante(parsed.data, isSupabaseEnabled());
    return c.text('OK');
  });
  app.get('/api/me/activacion', async (c) => {
    const auth = c.get('auth');
    if (!('userId' in auth) || !isSupabaseEnabled()) return c.json({ visible: false, nota: 'Sin cuenta vinculada no hay checklist.', trabada: false, pasos: [] });
    const { privilegedDb } = await import('../db/supabase-client.js');
    const nutri = await privilegedDb().from('nutritionists').select('id').eq('user_id', auth.userId).maybeSingle();
    if (nutri.error || !nutri.data?.id) return c.json({ visible: false, nota: 'Esta cuenta no es de una nutricionista.', trabada: false, pasos: [] });
    const ocultas = await privilegedDb().from('platform_onboarding_dismissals').select('nutritionist_id').eq('nutritionist_id', nutri.data.id).maybeSingle();
    const oculta = !ocultas.error && Boolean(ocultas.data);
    return c.json(await hub.activacionPropia(true, nutri.data.id as string, oculta));
  });
  app.post('/api/me/activacion/ocultar', async (c) => {
    const auth = c.get('auth');
    if (!('userId' in auth) || !isSupabaseEnabled()) return c.json({ visible: false });
    const { privilegedDb } = await import('../db/supabase-client.js');
    const nutri = await privilegedDb().from('nutritionists').select('id').eq('user_id', auth.userId).maybeSingle();
    if (nutri.error || !nutri.data?.id) return c.json({ visible: false }, 404);
    await hub.ocultarActivacion(true, nutri.data.id as string);
    return c.json({ visible: false });
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
