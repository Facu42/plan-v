import { localBillingDate } from '../../src/billing.js';
import { summarizeService } from '../../src/service.js';
import type { ServiceBoard, ServiceNutritionist } from '../../src/types/service.js';
import type {
  HubActivacion,
  HubBandeja,
  HubBorrador,
  HubCanal,
  HubCobranza,
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
  HubRiesgoMotivo,
  HubSeguimiento,
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
import {
  borradorPlantilla,
  estadoInstagram,
  estadoMail,
  estadoWhatsApp,
  evaluarActivacion,
  ltvRealizado,
  mailListo,
  releerListo,
  resumenDeNumeros,
  riesgoDias,
  riesgosDe,
  seguimientoSiCambia,
  sumarDias,
} from './hub-ops.js';

const PENDIENTE = 'La migración del centro comercial está escrita y todavía no está aplicada. No inventamos filas.';
const MP_AUSENTE = 'No se pudo leer Mercado Pago. No mostramos un cero en su lugar.';

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
  const pays = await db.leerTabla<MpPagoLite & { id: string; subscription_id?: string; provider_payment_id?: string }>('platform_payments', 'id, subscription_id, provider_payment_id, status, amount_cents, paid_at, created_at');
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
  const inicio = armarInicio({
    board,
    today,
    mpDisponible: mp.disponible,
    suscripciones: mp.suscripciones,
    pagos: mp.pagos,
    webhooksFallidos: mp.webhooksFallidos,
    salud,
    seguridad,
  });
  const rechazados = new Set(nutrisDePagos(mp).filter((row) => row.estado === 'Rechazado' && row.nutritionist_id).map((row) => row.nutritionist_id as string));
  const cuentas = board.nutritionists.map((row) => ({
    id: row.id,
    nombre: row.display_name,
    last_sign_in_at: row.last_sign_in_at,
    created_at: row.created_at,
    patients_active: row.patients_active,
    is_test: row.is_test === true,
  }));
  const riesgos = riesgosDe({ cuentas, pagosRechazados: rechazados, today, diasSinLogin: riesgoDias() });
  const resumen = await resumirDia({
    altas: inicio.altas_nuevas,
    churn: inicio.churn_mes,
    trialsPorVencer: inicio.trials_por_vencer,
    riesgos: riesgos.length,
    pagosFallidos: mp.disponible ? rechazados.size : null,
    mrr: inicio.mrr_pesos,
    today,
    persistent,
  });
  return { ...inicio, riesgos, resumen };
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

export async function loadLeads(persistent: boolean): Promise<{ leads: HubLead[]; seguimientos: HubSeguimiento[]; disponible: boolean; nota: string }> {
  if (!persistent) return { leads: memory.memoryLeads(), seguimientos: memory.memorySeguimientos(), disponible: true, nota: '' };
  const read = await db.leerLeads();
  if (!read.ok) return { leads: [], seguimientos: [], disponible: false, nota: PENDIENTE };
  const seguimientos = await db.leerTabla<HubSeguimiento>('platform_lead_followups', 'id, lead_id, title, due_on, done, created_at');
  return {
    leads: [...read.rows].sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
    seguimientos: seguimientos.ok ? seguimientos.rows : [],
    disponible: true,
    nota: seguimientos.ok ? '' : 'Los seguimientos automáticos piden la migración nueva. Las etapas sí se guardan.',
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
  const previo = (await loadLeads(persistent)).leads.find((row) => row.id === leadId);
  const etapaPrevia = previo?.stage;
  if (!previo && !persistent) throw new CareError(404, 'No encontramos ese lead.');
  let row: HubLead;
  if (!persistent) {
    const saved = memory.memoryPatchLead(leadId, patch);
    if (!saved) throw new CareError(404, 'No encontramos ese lead.');
    row = saved;
  } else {
    const saved = await db.actualizarLead(leadId, { ...patch, updated_at: ahora() });
    if (!saved.ok) throw new CareError(503, PENDIENTE);
    row = saved.row;
  }
  if (patch.stage && patch.stage !== etapaPrevia) await asegurarSeguimiento(persistent, row.id, patch.stage);
  return row;
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
  const drafts = await db.leerTabla<{ thread_id: string; body: string; origen: 'ia' | 'plantilla'; created_at: string }>('platform_inbox_drafts', 'thread_id, body, origen, created_at');
  const borrador = new Map<string, { body: string; origen: 'ia' | 'plantilla'; created_at: string }>();
  if (drafts.ok) {
    for (const row of drafts.rows) {
      const previo = borrador.get(row.thread_id);
      if (!previo || previo.created_at < row.created_at) borrador.set(row.thread_id, row);
    }
  }
  return {
    ok: true,
    hilos: threads.rows
      .map((row) => ({ ...row, messages: (byThread.get(row.id) ?? []).sort((a, b) => a.sent_at.localeCompare(b.sent_at)), borrador: borrador.get(row.id) ?? null }))
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
        ? 'En local los mensajes quedan en memoria. WhatsApp y el mail se prenden con las credenciales.'
        : 'Todavía no hay mensajes. Si faltan credenciales, los canales quedan apagados y podés anotar uno a mano.',
    };
  }
  const read = await hilosPersistentes();
  if (!read.ok) return { hilos: [], disponible: false, nota: PENDIENTE };
  return {
    hilos: read.hilos,
    disponible: true,
    nota: read.hilos.length
      ? 'Conversaciones guardadas. Enviar responde solo si el canal está listo.'
      : 'La bandeja está vacía. Los canales apagados no inventan mensajes.',
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

export function loadConexiones(env: NodeJS.ProcessEnv = process.env): HubConexiones {
  const whatsapp = estadoWhatsApp(env);
  const email = estadoMail(env);
  const instagram = estadoInstagram();
  return {
    conectores: [
      { id: 'whatsapp', nombre: 'WhatsApp Business', detalle: whatsapp.detalle, estado: whatsapp.estado },
      { id: 'instagram', nombre: 'Instagram', detalle: instagram.detalle, estado: instagram.estado },
      { id: 'email', nombre: 'Email', detalle: email.detalle, estado: email.estado },
    ],
    nota: 'WhatsApp y el mail quedan apagados si faltan las credenciales. Instagram está preparado y todavía no conversa. Nada se envía solo.',
  };
}

type PagoConNutri = HubPagoMp & { nutritionist_id: string | null; mail: string; provider_payment_id: string };

function nutrisDePagos(mp: Awaited<ReturnType<typeof mercadoPago>>): PagoConNutri[] {
  if (!mp.disponible) return [];
  const porId = new Map<string, MpSuscripcionLite & { id?: string; payer_email?: string }>();
  for (const row of mp.suscripciones as Array<MpSuscripcionLite & { id?: string; payer_email?: string }>) {
    if (row.id) porId.set(row.id, row);
  }
  return (mp.pagos as Array<MpPagoLite & { id?: string; subscription_id?: string; provider_payment_id?: string }>).map((row, index) => {
    const sub = row.subscription_id ? porId.get(row.subscription_id) : undefined;
    const nutri = sub?.nutritionist_id ?? null;
    return {
      id: row.provider_payment_id || row.id || `pago-${index}`,
      nutritionist_id: nutri,
      mail: sub?.payer_email ?? '',
      monto_pesos: pesosDesdeCentavos(row.amount_cents),
      estado: ESTADO_MP[row.status] ?? row.status,
      cuando: row.paid_at || row.created_at,
      provider_payment_id: row.provider_payment_id || row.id || `pago-${index}`,
    };
  });
}

async function resumirDia(input: {
  altas: number;
  churn: number;
  trialsPorVencer: number;
  riesgos: number;
  pagosFallidos: number | null;
  mrr: number | null;
  today: string;
  persistent: boolean;
}): Promise<NonNullable<HubInicio['resumen']>> {
  const base = resumenDeNumeros(input);
  if (!input.persistent) return base;
  const guardado = await db.leerTabla<{ day: string; body: string; origen: 'numeros' | 'ia' }>('platform_daily_briefs', 'day, body, origen');
  const previo = guardado.ok ? guardado.rows.find((row) => String(row.day).slice(0, 10) === input.today && row.origen === 'ia') : undefined;
  if (previo?.body) return { origen: 'ia', texto: previo.body, acciones: base.acciones, nota: 'Resumen del día ya guardado. No se volvió a llamar a la IA.' };
  try {
    const { resolveAiMode } = await import('../ai/mode.js');
    if (resolveAiMode() !== 'live') return base;
    const { generateText } = await import('ai');
    const { getAiModel } = await import('../ai/provider.js');
    const respuesta = await generateText({
      model: getAiModel('admin_assistant'),
      prompt: `Reescribí en español rioplatense, en tres oraciones cortas y sin inventar cifras, este resumen de Nutridash: ${base.texto} Acciones: ${base.acciones.join(' ')}`,
      abortSignal: AbortSignal.timeout(12_000),
    });
    const texto = respuesta.text.replace(/\s+/g, ' ').trim().slice(0, 600);
    if (!texto) return base;
    if (guardado.ok) await db.guardarBrief({ day: input.today, body: texto, origen: 'ia' });
    return { origen: 'ia', texto, acciones: base.acciones, nota: 'Lo reescribió la IA a partir de los números. No se envió nada.' };
  } catch {
    return { ...base, nota: 'La IA no respondió. Quedó el resumen armado con los números.' };
  }
}

async function asegurarSeguimiento(persistent: boolean, leadId: string, stage: string): Promise<void> {
  const plan = seguimientoSiCambia(stage);
  if (!plan) return;
  const row: HubSeguimiento = {
    id: id(),
    lead_id: leadId,
    title: plan.title,
    due_on: sumarDias(localBillingDate(), plan.days),
    done: false,
    created_at: ahora(),
  };
  if (!persistent) {
    memory.memoryAddSeguimiento(row);
    return;
  }
  await db.guardarSeguimiento(row);
}

export async function loadRiesgos(persistent: boolean, motivo?: HubRiesgoMotivo) {
  const inicio = await loadInicio(persistent);
  const items = (inicio.riesgos ?? []).filter((row) => !motivo || row.motivo === motivo);
  return { items, dias: riesgoDias(), nota: 'Sale del último ingreso, de las pacientes activas y de los pagos rechazados que sí se pudieron leer.' };
}

export async function loadCobranza(persistent: boolean): Promise<HubCobranza> {
  const inicio = await loadInicio(persistent);
  const mp = await mercadoPago(persistent);
  const pagos = nutrisDePagos(mp);
  const dueno = new Map<string, string>();
  for (const row of mp.suscripciones as Array<MpSuscripcionLite & { id?: string }>) {
    if (row.id) dueno.set(row.id, row.nutritionist_id);
  }
  const ltv = ltvRealizado({
    disponible: mp.disponible,
    pagos: (mp.pagos as Array<MpPagoLite & { subscription_id?: string }>).map((row) => ({
      nutritionist_id: row.subscription_id ? dueno.get(row.subscription_id) ?? null : null,
      status: row.status,
      amount_cents: row.amount_cents,
    })),
  });
  const avisos = persistent
    ? await db.leerTabla<HubCobranza['avisos'][number]>('platform_dunning_attempts', 'id, payment_id, kind, estado, detalle, created_at')
    : { ok: true as const, rows: memory.memoryAvisos() };
  return {
    mrr_pesos: mp.disponible || !persistent ? inicio.mrr_pesos : inicio.mrr_pesos,
    mrr_nota: inicio.mrr_nota,
    churn_mes: inicio.churn_mes,
    churn_nota: 'Cuentas reales cortadas o suspendidas este mes, más las canceladas en Mercado Pago si esa tabla respondió.',
    ltv_pesos: ltv.pesos,
    ltv_nutris: ltv.nutris,
    ltv_nota: ltv.nota,
    pagos_fallidos: pagos.filter((row) => row.estado === 'Rechazado'),
    avisos: avisos.ok ? avisos.rows : [],
    mail: { listo: mailListo(), nota: mailListo() ? 'Se puede avisar por mail.' : 'El aviso está apagado: faltan Brevo o el mail operativo.' },
    releer: { listo: releerListo(), nota: releerListo() ? 'Se puede volver a leer el pago en Mercado Pago.' : 'Falta la clave de Mercado Pago de la plataforma, o no es la que corresponde a este modo.' },
  };
}

export async function registrarCobranza(persistent: boolean, input: { payment_id: string; kind: 'aviso' | 'releer' }): Promise<HubCobranza> {
  const actual = await loadCobranza(persistent);
  const pago = actual.pagos_fallidos.find((row) => row.id === input.payment_id);
  if (!pago) throw new CareError(404, 'No encontramos ese pago rechazado.');
  if (input.kind === 'aviso' && !actual.mail.listo) {
    await guardarAviso(persistent, { payment_id: input.payment_id, kind: 'aviso', estado: 'apagado', detalle: actual.mail.nota, nutritionist_id: pago?.nutritionist_id ?? null });
    return loadCobranza(persistent);
  }
  if (input.kind === 'releer' && !actual.releer.listo) {
    await guardarAviso(persistent, { payment_id: input.payment_id, kind: 'releer', estado: 'apagado', detalle: actual.releer.nota, nutritionist_id: pago?.nutritionist_id ?? null });
    return loadCobranza(persistent);
  }
  if (input.kind === 'releer') {
    const { platformMercadoPago } = await import('../billing-platform/mp-platform.js');
    try {
      const remoto = await platformMercadoPago.getPayment(input.payment_id);
      const estado = String(remoto.status ?? 'sin estado');
      await guardarAviso(persistent, { payment_id: input.payment_id, kind: 'releer', estado: 'leido', detalle: `Mercado Pago dice ${estado}. No se creó otro cobro.`, nutritionist_id: pago?.nutritionist_id ?? null });
    } catch {
      await guardarAviso(persistent, { payment_id: input.payment_id, kind: 'releer', estado: 'fallido', detalle: 'Mercado Pago no respondió. No reintentamos el cobro.', nutritionist_id: pago?.nutritionist_id ?? null });
    }
    return loadCobranza(persistent);
  }
  if (!pago?.mail) {
    await guardarAviso(persistent, { payment_id: input.payment_id, kind: 'aviso', estado: 'fallido', detalle: 'Ese pago no tiene un mail para avisar.', nutritionist_id: pago?.nutritionist_id ?? null });
    return loadCobranza(persistent);
  }
  try {
    await enviarAviso(pago.mail, pago.monto_pesos);
    await guardarAviso(persistent, { payment_id: input.payment_id, kind: 'aviso', estado: 'enviado', detalle: 'Se envió el aviso. No se creó otro cobro.', nutritionist_id: pago.nutritionist_id });
  } catch {
    await guardarAviso(persistent, { payment_id: input.payment_id, kind: 'aviso', estado: 'fallido', detalle: 'El mail no salió. No se reintentó solo.', nutritionist_id: pago.nutritionist_id });
  }
  return loadCobranza(persistent);
}

async function guardarAviso(persistent: boolean, input: { payment_id: string; kind: 'aviso' | 'releer'; estado: string; detalle: string; nutritionist_id: string | null }) {
  const row = { id: id(), ...input, created_at: ahora() };
  if (!persistent) {
    memory.memoryAddAviso(row);
    return;
  }
  await db.guardarAviso(row);
}

async function enviarAviso(mail: string, pesos: number) {
  const texto = `Hola. El cobro de Nutridash de ${pesos} pesos fue rechazado. Cuando puedas, revisá el medio de pago. No te debitamos de nuevo desde acá.`;
  const brevo = (await import('../mail/brevo.js')).brevoConfig();
  if (brevo) {
    await (await import('../mail/brevo.js')).sendBrevoEmail(brevo, {
      to: { email: mail },
      subject: 'Nutridash: el cobro no pasó',
      text: texto,
      html: `<p>${texto}</p>`,
      idempotencyKey: `dunning-${mail}-${pesos}`,
    });
    return;
  }
  const smtp = (await import('../mail/transport.js')).mailTransportConfig();
  if (!smtp) throw new CareError(503, 'El mail está apagado.');
  await (await import('../mail/transport.js')).sendOperationalMail(smtp, { to: { email: mail }, subject: 'Nutridash: el cobro no pasó', text: texto, html: `<p>${texto}</p>` }, async () => true);
}

export async function sugerirRespuesta(persistent: boolean, threadId: string, completar?: (texto: string) => Promise<string>): Promise<HubBandeja> {
  const bandeja = await loadBandeja(persistent);
  if (!bandeja.disponible) throw new CareError(503, PENDIENTE);
  const hilo = bandeja.hilos.find((row) => row.id === threadId);
  if (!hilo) throw new CareError(404, 'No encontramos esa conversación.');
  const ultimo = [...hilo.messages].reverse().find((row) => row.direction === 'in')?.body ?? '';
  let borrador: HubBorrador = { body: borradorPlantilla(ultimo), origen: 'plantilla' };
  if (completar) {
    try {
      const texto = (await completar(ultimo)).replace(/\s+/g, ' ').trim().slice(0, 500);
      if (texto) borrador = { body: texto, origen: 'ia' };
    } catch { /* queda la plantilla */ }
  }
  if (!persistent) memory.memoryBorrador(threadId, borrador);
  else {
    const saved = await db.guardarBorrador({ id: id(), thread_id: threadId, body: borrador.body, origen: borrador.origen });
    if (saved && !saved.ok) throw new CareError(503, PENDIENTE);
  }
  return loadBandeja(persistent);
}

export async function enviarRespuesta(persistent: boolean, threadId: string, body: string, enviar: (hilo: HubHilo, body: string) => Promise<void>): Promise<HubBandeja> {
  const bandeja = await loadBandeja(persistent);
  if (!bandeja.disponible) throw new CareError(503, PENDIENTE);
  const hilo = bandeja.hilos.find((row) => row.id === threadId);
  if (!hilo) throw new CareError(404, 'No encontramos esa conversación.');
  if (hilo.channel === 'instagram') throw new CareError(503, 'Instagram está preparado y todavía no envía.');
  await enviar(hilo, body);
  const message: HubMensaje = { id: id(), thread_id: threadId, direction: 'out', body, sent_at: ahora() };
  if (!persistent) {
    memory.memoryAddMensaje(threadId, message);
    memory.memoryBorrador(threadId, null);
  } else {
    exigirTabla(await db.guardarMensaje(message));
  }
  return loadBandeja(persistent);
}

export async function anotarWhatsAppEntrante(from: string, body: string): Promise<void> {
  const handle = from.startsWith('+') ? from : `+${from.replace(/\D/g, '')}`;
  const texto = body.trim().slice(0, 2000);
  if (!texto) return;
  try {
    await anotarEntrada(true, { channel: 'whatsapp', contact_name: handle, contact_handle: handle, body: texto });
  } catch { /* no frenar el webhook de la paciente */ }
}

export async function anotarMailEntrante(input: { from_email: string; from_name: string; body: string }, persistent: boolean): Promise<void> {
  await anotarEntrada(persistent, {
    channel: 'email',
    contact_name: input.from_name.trim().slice(0, 80) || input.from_email,
    contact_handle: input.from_email.trim().slice(0, 120),
    body: input.body.trim().slice(0, 2000),
  });
}

async function anotarEntrada(persistent: boolean, input: { channel: HubCanal; contact_name: string; contact_handle: string; body: string }) {
  const existente = persistent ? null : memory.memoryFindHilo(input.channel, input.contact_handle);
  if (existente) {
    memory.memoryAddMensaje(existente.id, { id: id(), thread_id: existente.id, direction: 'in', body: input.body, sent_at: ahora() });
    return;
  }
  if (persistent) {
    const hilos = await db.leerHilos();
    if (!hilos.ok) return;
    const previo = hilos.rows.find((row) => row.channel === input.channel && row.contact_handle === input.contact_handle);
    const threadId = previo?.id ?? id();
    if (!previo) {
      const guardado = await db.guardarHilo({
        id: threadId, channel: input.channel, contact_name: input.contact_name, contact_handle: input.contact_handle,
        status: 'abierto', lead_id: null, nutritionist_id: null, updated_at: ahora(),
      });
      if (!guardado.ok) return;
    }
    await db.guardarMensaje({ id: id(), thread_id: threadId, direction: 'in', body: input.body, sent_at: ahora() });
    return;
  }
  await anotarMensaje(false, input);
}

export async function loadActivacion(persistent: boolean): Promise<HubActivacion> {
  const nutris = await loadNutrisHub(persistent);
  const today = localBillingDate();
  const señales = await señalesActivacion(persistent);
  if (persistent && !señales.ok) {
    return { filas: [], disponible: false, nota: 'No se pudieron leer planes o la página pública. No marcamos esos pasos como pendientes.' };
  }
  const filas = nutris.filter((row) => !row.is_test).map((row) => {
    const extra = señales.map.get(row.id);
    const evaluada = evaluarActivacion({
      nombre: row.display_name,
      pacientes: row.patients_total,
      planes: señales.ok ? extra?.planes ?? false : null,
      cobro: señales.ok ? extra?.cobro ?? false : null,
      pagina: señales.ok ? extra?.pagina ?? false : null,
      creada: row.created_at,
      today,
    });
    return { nutritionist_id: row.id, nombre: row.display_name, creada: row.created_at, trabada: evaluada.trabada, pasos: evaluada.pasos };
  });
  return { filas, disponible: true, nota: señales.ok ? 'Perfil y pacientes salen de la cuenta. Plan, cobro y página pública salen de lo que se pudo leer.' : 'Sin la base, plan, cobro y página quedan sin dato.' };
}

async function señalesActivacion(persistent: boolean): Promise<{ ok: boolean; map: Map<string, { planes: boolean; cobro: boolean; pagina: boolean }> }> {
  if (!persistent) return { ok: false, map: new Map() };
  const [planes, paginas, subs] = await Promise.all([
    db.leerTabla<{ nutritionist_id: string }>('meal_plans', 'nutritionist_id'),
    db.leerTabla<{ nutritionist_id: string; config: { page?: { enabled?: boolean } } | null }>('scheduling_profiles', 'nutritionist_id, config'),
    db.leerTabla<{ nutritionist_id: string; status: string }>('platform_subscriptions', 'nutritionist_id, status'),
  ]);
  if (!planes.ok || !paginas.ok) return { ok: false, map: new Map() };
  const map = new Map<string, { planes: boolean; cobro: boolean; pagina: boolean }>();
  const touch = (id: string) => {
    const row = map.get(id) ?? { planes: false, cobro: false, pagina: false };
    map.set(id, row);
    return row;
  };
  for (const row of planes.rows) touch(row.nutritionist_id).planes = true;
  for (const row of paginas.rows) if (row.config?.page?.enabled) touch(row.nutritionist_id).pagina = true;
  if (subs.ok) for (const row of subs.rows) if (row.status === 'authorized') touch(row.nutritionist_id).cobro = true;
  return { ok: true, map };
}

export async function activacionPropia(persistent: boolean, nutritionistId: string, oculta: boolean): Promise<{ visible: boolean; nota: string; trabada: boolean; pasos: HubActivacion['filas'][number]['pasos'] }> {
  if (oculta) return { visible: false, nota: 'La ocultaste.', trabada: false, pasos: [] };
  const tablero = await loadActivacion(persistent);
  const fila = tablero.filas.find((row) => row.nutritionist_id === nutritionistId);
  if (!fila) return { visible: false, nota: tablero.nota, trabada: false, pasos: [] };
  const lista = fila.pasos.every((paso) => paso.estado === 'hecho');
  return { visible: !lista, nota: tablero.nota, trabada: fila.trabada, pasos: fila.pasos };
}

export async function ocultarActivacion(persistent: boolean, nutritionistId: string): Promise<void> {
  if (!persistent) {
    memory.memoryOcultar(nutritionistId);
    return;
  }
  const saved = await db.ocultarActivacion(nutritionistId);
  if (saved && !saved.ok) throw new CareError(503, PENDIENTE);
}
