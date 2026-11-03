import { localBillingDate } from '../../src/billing.js';
import { summarizeService } from '../../src/service.js';
import type { ServiceBoard, ServiceNutritionist } from '../../src/types/service.js';
import type {
  HubBandeja,
  HubCanal,
  HubConexiones,
  HubFacturacion,
  HubFicha,
  HubHilo,
  HubInicio,
  HubLead,
  HubLeadSource,
  HubLeadStage,
  HubMensaje,
  HubNota,
  HubNutri,
  HubPagoMp,
  HubSuscripcion,
  HubTarea,
} from '../../src/types/hub.js';
import { CareError } from '../care/errors.js';
import { getBoard } from './repository.js';
import { buildCobros, buildSalud, buildSeguridad } from './centro.js';
import * as db from './hub-db.js';
import * as memory from './hub-memory.js';
import {
  armarInicio,
  cobradoMpDelMes,
  crmEstado,
  healthScore,
  mrrDesdeSuscripciones,
  pesosDesdeCentavos,
  planNombre,
  timelineDeCuenta,
  type MpPagoLite,
  type MpSuscripcionLite,
} from './hub-score.js';

const PENDIENTE = 'La migración del centro comercial está escrita y todavía no está aplicada. No inventamos filas.';
const MP_AUSENTE = 'No se pudo leer Mercado Pago. No mostramos un cero en su lugar.';

const CONEXIONES: HubConexiones = {
  conectores: [
    { id: 'whatsapp', nombre: 'WhatsApp Business', detalle: 'Cloud API', estado: 'proximamente' },
    { id: 'instagram', nombre: 'Instagram', detalle: 'Graph API · mensajes directos y comentarios', estado: 'proximamente' },
    { id: 'email', nombre: 'Email', detalle: 'Bandeja de correo', estado: 'proximamente' },
  ],
  nota: 'Los tres canales figuran como Próximamente. La bandeja ya tiene un modelo único de conversación, ligado a un lead o a una nutri, en una migración que todavía no se aplicó.',
};

function ahora(): string {
  return new Date().toISOString();
}

function id(): string {
  return crypto.randomUUID();
}

function filaNutri(row: ServiceNutritionist, today: string, planCode: string | null): HubNutri {
  const summary = summarizeService(row.subscription, today);
  const crm = crmEstado(summary.state);
  const plan = planNombre(planCode, crm);
  return {
    id: row.id,
    display_name: row.display_name,
    email: row.email,
    created_at: row.created_at,
    last_sign_in_at: row.last_sign_in_at,
    is_test: row.is_test === true,
    patients_active: row.patients_active,
    patients_total: row.patients_total,
    state: summary.state,
    until: summary.until,
    days_left: summary.days_left,
    crm,
    plan: plan.plan,
    plan_code: plan.plan_code,
    health: healthScore({
      last_sign_in_at: row.last_sign_in_at,
      today,
      patients_active: row.patients_active,
      crm,
    }),
  };
}

async function planesPorNutri(persistent: boolean): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!persistent) return map;
  const read = await db.leerTabla<MpSuscripcionLite>(
    'platform_subscriptions',
    'nutritionist_id, plan_code, billing_cycle, status, current_amount_cents, canceled_at',
  );
  if (!read.ok) return map;
  const rank: Record<string, number> = { authorized: 4, past_due: 3, paused: 2, pending: 1, canceled: 0 };
  const best = new Map<string, number>();
  for (const row of read.rows) {
    const score = rank[row.status] ?? 0;
    if ((best.get(row.nutritionist_id) ?? -1) >= score) continue;
    best.set(row.nutritionist_id, score);
    map.set(row.nutritionist_id, row.plan_code);
  }
  return map;
}

async function mercadoPago(persistent: boolean): Promise<{
  disponible: boolean;
  suscripciones: MpSuscripcionLite[];
  pagos: MpPagoLite[];
  webhooksOk: number | null;
  webhooksFallidos: number | null;
}> {
  if (!persistent) {
    return { disponible: false, suscripciones: [], pagos: [], webhooksOk: null, webhooksFallidos: null };
  }
  const subs = await db.leerTabla<MpSuscripcionLite & { id: string; payer_email: string; current_period_end: string | null }>(
    'platform_subscriptions',
    'id, nutritionist_id, plan_code, billing_cycle, status, current_amount_cents, canceled_at, payer_email, current_period_end',
  );
  const pays = await db.leerTabla<MpPagoLite & { id: string }>('platform_payments', 'id, status, amount_cents, paid_at, created_at');
  const hooks = await db.leerTabla<{ status: string }>('platform_billing_events', 'status');
  const disponible = subs.ok && pays.ok;
  return {
    disponible,
    suscripciones: subs.ok ? subs.rows : [],
    pagos: pays.ok ? pays.rows : [],
    webhooksOk: hooks.ok ? hooks.rows.filter((row) => row.status === 'done').length : null,
    webhooksFallidos: hooks.ok ? hooks.rows.filter((row) => row.status === 'failed').length : null,
  };
}

export async function loadInicio(persistent: boolean): Promise<HubInicio> {
  const board = await getBoard(persistent);
  const today = localBillingDate();
  const [salud, seguridad, mp] = await Promise.all([
    buildSalud(),
    buildSeguridad(board, persistent),
    mercadoPago(persistent),
  ]);
  return armarInicio({
    board,
    today,
    mpDisponible: mp.disponible,
    suscripciones: mp.suscripciones,
    pagos: mp.pagos,
    webhooksFallidos: mp.webhooksFallidos,
    salud,
    seguridad,
  });
}

export async function loadNutrisHub(persistent: boolean): Promise<HubNutri[]> {
  const board = await getBoard(persistent);
  const today = localBillingDate();
  const planes = await planesPorNutri(persistent);
  return [...board.nutritionists]
    .map((row) => filaNutri(row, today, planes.get(row.id) ?? null))
    .sort((a, b) => a.display_name.localeCompare(b.display_name, 'es'));
}

async function notasDe(persistent: boolean, nutritionistId: string): Promise<{ rows: HubNota[]; ok: boolean }> {
  if (!persistent) return { rows: memory.memoryNotas(nutritionistId), ok: true };
  const read = await db.leerNotas();
  if (!read.ok) return { rows: [], ok: false };
  return { rows: read.rows.filter((row) => row.nutritionist_id === nutritionistId), ok: true };
}

async function tareasDe(persistent: boolean, nutritionistId: string): Promise<{ rows: HubTarea[]; ok: boolean }> {
  if (!persistent) return { rows: memory.memoryTareas(nutritionistId), ok: true };
  const read = await db.leerTareas();
  if (!read.ok) return { rows: [], ok: false };
  return { rows: read.rows.filter((row) => row.nutritionist_id === nutritionistId), ok: true };
}

export async function loadFicha(persistent: boolean, nutritionistId: string): Promise<HubFicha> {
  const board = await getBoard(persistent);
  const row = board.nutritionists.find((item) => item.id === nutritionistId);
  if (!row) throw new CareError(404, 'No encontramos esa cuenta.');
  const today = localBillingDate();
  const planes = await planesPorNutri(persistent);
  const [notas, tareas] = await Promise.all([notasDe(persistent, nutritionistId), tareasDe(persistent, nutritionistId)]);
  const ok = notas.ok && tareas.ok;
  return {
    nutri: filaNutri(row, today, planes.get(row.id) ?? null),
    timeline: timelineDeCuenta(row, notas.rows, tareas.rows),
    notas: notas.rows.sort((a, b) => b.created_at.localeCompare(a.created_at)),
    tareas: tareas.rows.sort((a, b) => Number(a.done) - Number(b.done) || b.created_at.localeCompare(a.created_at)),
    notas_disponibles: ok,
    nota_vacia: ok ? '' : PENDIENTE,
  };
}

function exigirTabla<T>(result: { ok: true; row: T } | { ok: false }): T {
  if (!result.ok) throw new CareError(503, PENDIENTE);
  return result.row;
}

export async function addNota(persistent: boolean, nutritionistId: string, body: string): Promise<HubFicha> {
  await loadFicha(persistent, nutritionistId);
  const row: HubNota = { id: id(), nutritionist_id: nutritionistId, body, created_at: ahora() };
  if (persistent) exigirTabla(await db.guardarNota(row));
  else memory.memoryAddNota(row);
  return loadFicha(persistent, nutritionistId);
}

export async function addTarea(persistent: boolean, nutritionistId: string, title: string, dueOn: string | null): Promise<HubFicha> {
  await loadFicha(persistent, nutritionistId);
  const row: HubTarea = { id: id(), nutritionist_id: nutritionistId, title, due_on: dueOn, done: false, created_at: ahora() };
  if (persistent) exigirTabla(await db.guardarTarea(row));
  else memory.memoryAddTarea(row);
  return loadFicha(persistent, nutritionistId);
}

export async function toggleTarea(persistent: boolean, taskId: string, done: boolean): Promise<HubTarea> {
  if (!persistent) {
    const row = memory.memoryToggleTarea(taskId, done);
    if (!row) throw new CareError(404, 'No encontramos esa tarea.');
    return row;
  }
  return exigirTabla(await db.marcarTarea(taskId, done));
}

export async function loadLeads(persistent: boolean): Promise<{ leads: HubLead[]; disponible: boolean; nota: string }> {
  if (!persistent) return { leads: memory.memoryLeads(), disponible: true, nota: '' };
  const read = await db.leerLeads();
  if (!read.ok) return { leads: [], disponible: false, nota: PENDIENTE };
  return {
    leads: [...read.rows].sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    disponible: true,
    nota: '',
  };
}

export async function createLead(persistent: boolean, input: {
  name: string;
  contact: string;
  source: HubLeadSource;
  stage: HubLeadStage;
  next_step: string;
  nutritionist_id: string | null;
}): Promise<HubLead> {
  const stamp = ahora();
  const row: HubLead = { id: id(), ...input, created_at: stamp, updated_at: stamp };
  if (persistent) return exigirTabla(await db.guardarLead(row));
  return memory.memoryAddLead(row);
}

export async function updateLead(persistent: boolean, leadId: string, patch: Partial<Pick<HubLead, 'stage' | 'next_step' | 'source' | 'nutritionist_id'>>): Promise<HubLead> {
  if (!persistent) {
    const row = memory.memoryPatchLead(leadId, patch);
    if (!row) throw new CareError(404, 'No encontramos ese lead.');
    return row;
  }
  const saved = await db.actualizarLead(leadId, { ...patch, updated_at: ahora() });
  if (!saved.ok) throw new CareError(503, PENDIENTE);
  return saved.row;
}

const ESTADO_MP: Record<string, string> = {
  pending: 'Pendiente',
  authorized: 'Autorizada',
  paused: 'Pausada',
  past_due: 'Morosa',
  canceled: 'Cancelada',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  refunded: 'Reembolsado',
  charged_back: 'Contracargo',
};

export async function loadFacturacion(persistent: boolean): Promise<HubFacturacion> {
  const board = await getBoard(persistent);
  const today = localBillingDate();
  const cobros = buildCobros(board, today);
  const mp = await mercadoPago(persistent);
  const suscripciones: HubSuscripcion[] = mp.disponible
    ? (mp.suscripciones as Array<MpSuscripcionLite & { id?: string; payer_email?: string; current_period_end?: string | null }>).map((row, index) => ({
      id: row.id || `sub-${index}`,
      nutritionist_id: row.nutritionist_id,
      plan: planNombre(row.plan_code, 'activa').plan,
      ciclo: row.billing_cycle === 'annual' ? 'anual' : 'mensual',
      estado: ESTADO_MP[row.status] ?? row.status,
      monto_pesos: pesosDesdeCentavos(row.current_amount_cents),
      vence: row.current_period_end ?? null,
      mail: row.payer_email ?? '',
    }))
    : [];
  const pagos: HubPagoMp[] = mp.disponible
    ? (mp.pagos as Array<MpPagoLite & { id?: string }>).map((row, index) => ({
      id: row.id || `pago-${index}`,
      monto_pesos: pesosDesdeCentavos(row.amount_cents),
      estado: ESTADO_MP[row.status] ?? row.status,
      cuando: row.paid_at || row.created_at,
    }))
    : [];
  return {
    suscripciones_disponibles: mp.disponible,
    suscripciones_nota: mp.disponible
      ? (suscripciones.length ? `${mrrDesdeSuscripciones(mp.suscripciones)} de ingreso recurrente autorizado.` : 'Mercado Pago respondió y no hay suscripciones.')
      : MP_AUSENTE,
    suscripciones,
    webhooks_disponibles: mp.webhooksOk != null,
    webhooks_ok: mp.webhooksOk,
    webhooks_fallidos: mp.webhooksFallidos,
    webhooks_nota: mp.webhooksOk == null ? 'No se pudo leer el historial de avisos de Mercado Pago.' : 'Avisos ya procesados. Un cero es un cero real, no un relleno.',
    pagos_fallidos: pagos.filter((row) => row.estado === 'Rechazado'),
    reembolsos: pagos.filter((row) => row.estado === 'Reembolsado' || row.estado === 'Contracargo'),
    pagos_nota: mp.disponible
      ? `Aprobados este mes: ${cobradoMpDelMes(mp.pagos, today.slice(0, 7))} pesos, aparte de los pagos manuales.`
      : MP_AUSENTE,
    afip: {
      estado: 'proximamente',
      texto: 'AFIP queda como placeholder. Todavía no hay facturación electrónica.',
    },
    cobros,
  };
}

async function hilosPersistentes(): Promise<{ ok: true; hilos: HubHilo[] } | { ok: false }> {
  const threads = await db.leerHilos();
  const messages = await db.leerMensajes();
  if (!threads.ok || !messages.ok) return { ok: false };
  const byThread = new Map<string, HubMensaje[]>();
  for (const message of messages.rows) {
    const list = byThread.get(message.thread_id) ?? [];
    list.push(message);
    byThread.set(message.thread_id, list);
  }
  return {
    ok: true,
    hilos: threads.rows
      .map((row) => ({ ...row, messages: (byThread.get(row.id) ?? []).sort((a, b) => a.sent_at.localeCompare(b.sent_at)) }))
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
  };
}

export async function loadBandeja(persistent: boolean): Promise<HubBandeja> {
  if (!persistent) {
    const hilos = memory.memoryHilos();
    return {
      hilos,
      disponible: true,
      nota: hilos.length
        ? 'Mensajes anotados a mano. WhatsApp, Instagram y el mail siguen en Próximamente.'
        : 'Todavía no hay mensajes. Los conectores están en Próximamente: podés anotar uno que te llegó y crear el lead desde ahí.',
    };
  }
  const read = await hilosPersistentes();
  if (!read.ok) return { hilos: [], disponible: false, nota: PENDIENTE };
  return {
    hilos: read.hilos,
    disponible: true,
    nota: read.hilos.length
      ? 'Conversaciones guardadas. Los conectores automáticos siguen en Próximamente.'
      : 'La bandeja está vacía. Los conectores siguen en Próximamente.',
  };
}

const CANAL_ORIGEN: Record<HubCanal, HubLeadSource> = {
  whatsapp: 'wa',
  instagram: 'ig',
  email: 'email',
};

export async function anotarMensaje(persistent: boolean, input: {
  channel: HubCanal;
  contact_name: string;
  contact_handle: string;
  body: string;
}): Promise<HubBandeja> {
  const stamp = ahora();
  const threadId = id();
  const message: HubMensaje = { id: id(), thread_id: threadId, direction: 'in', body: input.body, sent_at: stamp };
  const hilo: HubHilo = {
    id: threadId,
    channel: input.channel,
    contact_name: input.contact_name,
    contact_handle: input.contact_handle,
    status: 'abierto',
    lead_id: null,
    nutritionist_id: null,
    updated_at: stamp,
    messages: [message],
  };
  if (!persistent) {
    memory.memoryAddHilo(hilo);
    return loadBandeja(false);
  }
  const { messages, ...thread } = hilo;
  exigirTabla(await db.guardarHilo(thread));
  exigirTabla(await db.guardarMensaje(messages[0]));
  return loadBandeja(true);
}

export async function crearLeadDesdeHilo(persistent: boolean, threadId: string): Promise<{ lead: HubLead; bandeja: HubBandeja }> {
  const bandeja = await loadBandeja(persistent);
  if (!bandeja.disponible) throw new CareError(503, PENDIENTE);
  const hilo = bandeja.hilos.find((row) => row.id === threadId);
  if (!hilo) throw new CareError(404, 'No encontramos ese mensaje.');
  if (hilo.lead_id) {
    const leads = await loadLeads(persistent);
    const existente = leads.leads.find((row) => row.id === hilo.lead_id);
    if (!existente) throw new CareError(404, 'El lead de este mensaje no está.');
    return { lead: existente, bandeja };
  }
  const primero = hilo.messages[0]?.body ?? '';
  const lead = await createLead(persistent, {
    name: hilo.contact_name,
    contact: hilo.contact_handle,
    source: CANAL_ORIGEN[hilo.channel],
    stage: 'lead',
    next_step: primero.slice(0, 200),
    nutritionist_id: hilo.nutritionist_id,
  });
  if (!persistent) memory.memoryLinkLead(threadId, lead.id);
  else {
    const linked = await db.actualizarHilo(threadId, { lead_id: lead.id, updated_at: ahora() });
    if (!linked.ok) throw new CareError(503, PENDIENTE);
  }
  return { lead, bandeja: await loadBandeja(persistent) };
}

export function loadConexiones(): HubConexiones {
  return CONEXIONES;
}
