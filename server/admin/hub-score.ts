import { summarizeService } from '../../src/service.js';
import type { ServiceBoard, ServiceNutritionist } from '../../src/types/service.js';
import type { CentroAlerta, CentroSeguridad } from '../../src/types/centro.js';
import type { HubCrmEstado, HubHealth, HubInicio, HubPlanCodigo, HubTimelineItem } from '../../src/types/hub.js';

const PLANES: Record<string, string> = {
  arranque: 'Arranque',
  pro: 'Pro',
  consultorio: 'Consultorio',
  prueba: 'Prueba',
};

export function crmEstado(state: ReturnType<typeof summarizeService>['state']): HubCrmEstado {
  if (state === 'prueba') return 'trial';
  if (state === 'vencida') return 'morosa';
  if (state === 'cortada' || state === 'suspendida') return 'baja';
  return 'activa';
}

export function planNombre(code: string | null | undefined, crm: HubCrmEstado): { plan: string; plan_code: HubPlanCodigo } {
  if (code && PLANES[code]) return { plan: PLANES[code], plan_code: code as HubPlanCodigo };
  if (crm === 'trial') return { plan: 'Prueba', plan_code: null };
  if (crm === 'baja') return { plan: 'Sin plan', plan_code: null };
  return { plan: 'Servicio', plan_code: null };
}

function diasDesde(iso: string | null, today: string): number | null {
  if (!iso) return null;
  const then = Date.parse(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  const now = Date.parse(`${today}T12:00:00Z`);
  if (Number.isNaN(then) || Number.isNaN(now)) return null;
  return Math.floor((now - then) / 86_400_000);
}

/** Uso reciente, cantidad de pacientes y si el pago está al día. Cada parte tiene tope y la suma llega a 100. */
export function healthScore(input: {
  last_sign_in_at: string | null;
  today: string;
  patients_active: number;
  crm: HubCrmEstado;
}): HubHealth {
  const dias = diasDesde(input.last_sign_in_at, input.today);
  let uso = 0;
  if (dias != null) {
    if (dias <= 7) uso = 40;
    else if (dias <= 30) uso = 25;
    else if (dias <= 90) uso = 10;
  }
  const activos = Math.max(0, input.patients_active);
  const pacientes = activos === 0 ? 0 : Math.min(30, 10 + activos * 2);
  const pago = input.crm === 'activa' || input.crm === 'trial' ? 30 : input.crm === 'morosa' ? 8 : 0;
  return { uso, pacientes, pago, total: uso + pacientes + pago };
}

export type MpSuscripcionLite = {
  nutritionist_id: string;
  plan_code: string;
  billing_cycle: 'monthly' | 'annual';
  status: string;
  current_amount_cents: number;
  canceled_at: string | null;
};

export type MpPagoLite = {
  status: string;
  amount_cents: number;
  paid_at: string | null;
  created_at: string;
};

export function pesosDesdeCentavos(cents: number): number {
  return Math.round(cents / 100);
}

/** MRR en pesos: mensual tal cual, anual dividido en doce. Solo suscripciones autorizadas. */
export function mrrDesdeSuscripciones(rows: MpSuscripcionLite[]): number {
  let cents = 0;
  for (const row of rows) {
    if (row.status !== 'authorized') continue;
    cents += row.billing_cycle === 'annual' ? Math.round(row.current_amount_cents / 12) : row.current_amount_cents;
  }
  return pesosDesdeCentavos(cents);
}

export function cobradoMpDelMes(rows: MpPagoLite[], month: string): number {
  let cents = 0;
  for (const row of rows) {
    if (row.status !== 'approved') continue;
    const when = row.paid_at || row.created_at;
    if (when.startsWith(month)) cents += row.amount_cents;
  }
  return pesosDesdeCentavos(cents);
}

export function armarInicio(input: {
  board: ServiceBoard;
  today: string;
  mpDisponible: boolean;
  suscripciones: MpSuscripcionLite[];
  pagos: MpPagoLite[];
  webhooksFallidos: number | null;
  salud: { api: { status: string }; jobs: { dead: number } };
  seguridad: Pick<CentroSeguridad, 'advertencias' | 'mfa_enforce'>;
}): HubInicio {
  const month = input.today.slice(0, 7);
  const reales = input.board.nutritionists.filter((row) => row.is_test !== true);
  let trialsActivos = 0;
  let trialsPorVencer = 0;
  let altas = 0;
  const churn = new Set<string>();
  let cobradoManual = 0;
  let activas = 0;
  for (const row of reales) {
    const summary = summarizeService(row.subscription, input.today);
    const crm = crmEstado(summary.state);
    if (crm === 'trial') {
      trialsActivos += 1;
      if (summary.days_left != null && summary.days_left >= 0 && summary.days_left <= 7) trialsPorVencer += 1;
    }
    if ((summary.state === 'cortada' || summary.state === 'suspendida') && summary.until?.startsWith(month)) churn.add(row.id);
    if (row.created_at.startsWith(month)) altas += 1;
    if (summary.state === 'activa' || summary.state === 'por_vencer') activas += 1;
    for (const payment of row.payments) {
      if (payment.status === 'confirmed' && payment.paid_on.startsWith(month)) cobradoManual += payment.amount;
    }
  }
  for (const sub of input.suscripciones) {
    if (sub.canceled_at?.startsWith(month)) churn.add(sub.nutritionist_id);
  }

  const precio = input.board.settings.monthly_price ?? 0;
  let mrr = precio * activas;
  let mrrNota = 'Sale del precio del servicio por las cuentas activas. Todavía no se leen las suscripciones de Mercado Pago.';
  let cobrado = cobradoManual;
  let cobradoNota = 'Pagos manuales confirmados de este mes. Todavía no se leen los cobros de Mercado Pago.';
  if (input.mpDisponible) {
    mrr = mrrDesdeSuscripciones(input.suscripciones);
    mrrNota = mrr
      ? 'Sale de las suscripciones autorizadas de Mercado Pago. La anual se reparte en doce.'
      : 'Mercado Pago respondió y no hay suscripciones autorizadas.';
    cobrado = cobradoMpDelMes(input.pagos, month);
    cobradoNota = 'Cobros aprobados de Mercado Pago en este mes. Los pagos manuales se ven aparte, en Facturación.';
  }

  const alertas: CentroAlerta[] = [];
  if (input.mpDisponible) {
    const fallidos = input.pagos.filter((row) => row.status === 'rejected' && (row.paid_at || row.created_at).startsWith(month)).length;
    if (fallidos) {
      alertas.push({
        tone: 'coral',
        title: fallidos === 1 ? 'Hay un pago rechazado este mes' : `Hay ${fallidos} pagos rechazados este mes`,
        sub: 'Están en Facturación, en pagos fallidos.',
      });
    }
  } else {
    alertas.push({
      tone: 'gold',
      title: 'No se leen los pagos de Mercado Pago',
      sub: 'La tabla de cobros de la plataforma no respondió. No mostramos un cero inventado.',
    });
  }
  if (input.webhooksFallidos) {
    alertas.push({
      tone: 'coral',
      title: input.webhooksFallidos === 1 ? 'Falló un aviso de Mercado Pago' : `Fallaron ${input.webhooksFallidos} avisos de Mercado Pago`,
      sub: 'El estado de los webhooks está en Facturación.',
    });
  }
  if (input.salud.api.status !== 'ok' || input.salud.jobs.dead > 0) {
    alertas.push({
      tone: 'coral',
      title: 'La salud del sistema pide una mirada',
      sub: input.salud.jobs.dead
        ? `Hay ${input.salud.jobs.dead} ${input.salud.jobs.dead === 1 ? 'trabajo detenido' : 'trabajos detenidos'}.`
        : 'La API no está lista.',
    });
  }
  for (const aviso of input.seguridad.advertencias) {
    if (/mfa|segundo paso|dos pasos/i.test(`${aviso.title} ${aviso.sub}`)) alertas.push(aviso);
  }
  if (trialsPorVencer) {
    alertas.push({
      tone: 'sky',
      title: trialsPorVencer === 1 ? 'Una prueba vence en los próximos 7 días' : `${trialsPorVencer} pruebas vencen en los próximos 7 días`,
      sub: 'Conviene escribirles antes de que se corte el acceso.',
    });
  }
  if (!alertas.length) {
    alertas.push({ tone: 'green', title: 'Nada urgente', sub: 'No hay pagos fallidos ni avisos de salud o de verificación en dos pasos.' });
  }

  return {
    mrr_pesos: mrr,
    mrr_nota: mrrNota,
    cobrado_mes_pesos: cobrado,
    cobrado_nota: cobradoNota,
    trials_activos: trialsActivos,
    trials_por_vencer: trialsPorVencer,
    churn_mes: churn.size,
    altas_nuevas: altas,
    alertas,
  };
}

export function timelineDeCuenta(row: ServiceNutritionist, notas: { id: string; body: string; created_at: string }[], tareas: { id: string; title: string; created_at: string; done: boolean }[]): HubTimelineItem[] {
  const items: HubTimelineItem[] = [{
    id: `alta-${row.id}`,
    at: row.created_at,
    title: 'Alta de la cuenta',
    detail: row.email,
  }];
  if (row.last_sign_in_at) {
    items.push({ id: `login-${row.id}`, at: row.last_sign_in_at, title: 'Último ingreso', detail: 'Entró al panel.' });
  }
  for (const payment of row.payments) {
    items.push({
      id: `pago-${payment.id}`,
      at: payment.created_at || `${payment.paid_on}T12:00:00Z`,
      title: payment.status === 'voided' ? 'Pago anulado' : 'Pago registrado',
      detail: `${payment.method} · ${payment.paid_on}`,
    });
  }
  for (const nota of notas) items.push({ id: `nota-${nota.id}`, at: nota.created_at, title: 'Nota', detail: nota.body });
  for (const tarea of tareas) {
    items.push({
      id: `tarea-${tarea.id}`,
      at: tarea.created_at,
      title: tarea.done ? 'Tarea hecha' : 'Tarea',
      detail: tarea.title,
    });
  }
  return items.sort((a, b) => b.at.localeCompare(a.at));
}
