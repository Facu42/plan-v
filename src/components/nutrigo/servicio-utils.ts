import { ApiError } from '../../api/client';
import { SERVICE_STATE_LABELS, summarizeService, type ServiceState, type ServiceSummary } from '../../service';
import type { ServiceBoard, ServiceEvent, ServiceNutritionist } from '../../types/service';
import { feeErrorMessage } from './cobranzas-utils';

export const SERVICE_EVENT_LABELS: Record<string, string> = {
  'service.payment': 'Pago registrado',
  'service.payment_voided': 'Pago anulado',
  'service.trial_extended': 'Prueba extendida',
  'service.override': 'Excepción cambiada',
  'service.settings': 'Precio o prueba cambiados',
  'service.org_status': 'Estado de consultorio',
  'service.nutritionist_created': 'Alta de nutricionista',
  'service.access_sent': 'Acceso reenviado',
  'service.note': 'Nota interna editada',
  'service.test_accounts_created': 'Cuentas de prueba creadas',
};

export function serviceEventLabel(action: string): string {
  return SERVICE_EVENT_LABELS[action] ?? 'Cambio en el servicio';
}

export const SERVICE_STATE_TONE: Record<ServiceState, 'green' | 'gold' | 'coral'> = {
  activa: 'green', sin_cargo: 'green', prueba: 'gold', por_vencer: 'gold', vencida: 'coral', cortada: 'coral', suspendida: 'coral',
};

const STATE_ORDER: Record<ServiceState, number> = { cortada: 0, vencida: 1, suspendida: 2, por_vencer: 3, prueba: 4, activa: 5, sin_cargo: 6 };

export type ServiceRow = { nutritionist: ServiceNutritionist; summary: ServiceSummary };

/** Primero las que hay que atender (sin pagar, vencidas), después las al día. */
export function buildServiceRows(board: ServiceBoard, today: string): ServiceRow[] {
  return board.nutritionists
    .map((nutritionist) => ({ nutritionist, summary: summarizeService(nutritionist.subscription, today) }))
    .sort((a, b) => STATE_ORDER[a.summary.state] - STATE_ORDER[b.summary.state]
      || (a.summary.days_left ?? 9999) - (b.summary.days_left ?? 9999)
      || a.nutritionist.display_name.localeCompare(b.nutritionist.display_name, 'es'));
}

export function daysLeftText(summary: ServiceSummary): string {
  const left = summary.days_left;
  if (left === null) return '';
  if (left === 0) return 'Vence hoy';
  if (left === 1) return 'Falta 1 día';
  if (left > 1) return `Faltan ${left} días`;
  return left === -1 ? 'Venció hace 1 día' : `Venció hace ${-left} días`;
}

export function replaceNutritionist(board: ServiceBoard, nutritionist: ServiceNutritionist): ServiceBoard {
  return { ...board, nutritionists: board.nutritionists.map((item) => item.id === nutritionist.id ? nutritionist : item) };
}

/** Fecha y hora cortas (dd/mm/aaaa) de un instante ISO; vacío si no hay. */
export function shortDateTime(iso: string | null): string {
  if (!iso) return '';
  const date = iso.slice(0, 10);
  return date.split('-').reverse().join('/');
}

export const SERVICE_STATE_FILTERS: Array<{ id: ServiceState | 'todas' | 'cuentas_prueba'; label: string }> = [
  { id: 'todas', label: 'Todos los estados' },
  ...(['prueba', 'activa', 'por_vencer', 'vencida', 'cortada', 'sin_cargo', 'suspendida'] as ServiceState[]).map((id) => ({ id, label: SERVICE_STATE_LABELS[id] })),
  { id: 'cuentas_prueba', label: 'Cuentas de prueba' },
];

export type ServiceOrder = 'vencimiento' | 'ingreso' | 'nombre' | 'pacientes';
export const SERVICE_ORDERS: Array<{ id: ServiceOrder; label: string }> = [
  { id: 'vencimiento', label: 'Vencimiento más cercano' },
  { id: 'ingreso', label: 'Último ingreso' },
  { id: 'pacientes', label: 'Más pacientes' },
  { id: 'nombre', label: 'Nombre' },
];

export interface ServiceRowFilter { query?: string; state?: ServiceState | 'todas' | 'cuentas_prueba'; order?: ServiceOrder }

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/** Filtra por texto (nombre o mail, sin tildes) y por estado, y ordena. No modifica la lista original. */
export function filterServiceRows(rows: ServiceRow[], { query = '', state = 'todas', order = 'vencimiento' }: ServiceRowFilter = {}): ServiceRow[] {
  const needle = normalize(query);
  const byName = (a: ServiceRow, b: ServiceRow) => a.nutritionist.display_name.localeCompare(b.nutritionist.display_name, 'es');
  return rows
    .filter((row) => (state === 'cuentas_prueba' ? row.nutritionist.is_test === true : row.nutritionist.is_test !== true && (state === 'todas' || row.summary.state === state))
      && (!needle || normalize(row.nutritionist.display_name).includes(needle) || normalize(row.nutritionist.email).includes(needle)))
    .sort((a, b) => {
      if (order === 'nombre') return byName(a, b);
      if (order === 'pacientes') return b.nutritionist.patients_active - a.nutritionist.patients_active || byName(a, b);
      if (order === 'ingreso') return (b.nutritionist.last_sign_in_at ?? '').localeCompare(a.nutritionist.last_sign_in_at ?? '') || byName(a, b);
      const au = a.summary.until ?? '9999-12-31';
      const bu = b.summary.until ?? '9999-12-31';
      return au.localeCompare(bu) || byName(a, b);
    });
}

export function emailsOf(rows: ServiceRow[]): string[] {
  return [...new Set(rows.map((row) => row.nutritionist.email.trim()).filter(Boolean))];
}

export type MailKind = 'bienvenida' | 'por_vencer' | 'vencida';

export function mailKindFor(state: ServiceState): MailKind {
  if (state === 'por_vencer') return 'por_vencer';
  if (state === 'vencida' || state === 'cortada') return 'vencida';
  return 'bienvenida';
}

export const MAIL_KIND_LABELS: Record<MailKind, string> = { bienvenida: 'Bienvenida', por_vencer: 'Por vencer', vencida: 'Vencida' };

export function mailTemplate(kind: MailKind, name = ''): { subject: string; body: string } {
  const first = name.trim().split(/\s+/)[0];
  const hello = first ? `Hola ${first},` : 'Hola,';
  if (kind === 'por_vencer') return {
    subject: 'Tu servicio de Nutridash está por vencer',
    body: `${hello}\n\nTe escribo para avisarte que tu servicio de Nutridash está por vencer. Si querés seguir usándolo sin cortes, contame y te paso los datos para renovarlo.\n\nCualquier duda, escribime por acá.\n\nUn abrazo,\nFacundo`,
  };
  if (kind === 'vencida') return {
    subject: 'Tu servicio de Nutridash está vencido',
    body: `${hello}\n\nTe escribo porque tu servicio de Nutridash figura vencido. Tus pacientes y tu información siguen guardados. Cuando regularices el pago vas a recuperar el acceso completo.\n\nSi ya pagaste o necesitás más tiempo, avisame y lo vemos.\n\nUn abrazo,\nFacundo`,
  };
  return {
    subject: 'Bienvenida a Nutridash',
    body: `${hello}\n\n¡Bienvenida a Nutridash! Ya podés entrar a https://plan-v-eight.vercel.app con tu mail para armar tu consultorio y sumar a tus pacientes.\n\nSi necesitás ayuda con algo, escribime por acá.\n\nUn abrazo,\nFacundo`,
  };
}

/** Enlace mailto: con destinatarios en copia oculta si son varios. Vacío si no hay a quién escribir. */
export function buildMailto(emails: string[], subject: string, body: string): string {
  const list = emails.filter(Boolean);
  if (!list.length) return '';
  const query = `subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return list.length === 1 ? `mailto:${encodeURIComponent(list[0]).replace('%40', '@')}?${query}` : `mailto:?bcc=${list.map((email) => encodeURIComponent(email).replace('%40', '@')).join(',')}&${query}`;
}

export function filterServiceEvents(events: ServiceEvent[], { type = 'todos', query = '', names }: { type?: string; query?: string; names: Map<string, string> }): ServiceEvent[] {
  const needle = normalize(query);
  return events
    .filter((event) => type === 'todos' || event.action === type)
    .filter((event) => !needle || normalize(serviceEventLabel(event.action)).includes(needle) || normalize(event.nutritionist_id ? names.get(event.nutritionist_id) ?? '' : 'general').includes(needle))
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
}

/** Alias que se arman con el mail base: nombre+plan-v-nutri@dominio. */
export function testAliasEmails(emailBase: string): { nutritionist: string; patient: string } | null {
  const match = /^([^@\s+]+)(?:\+[^@\s]*)?@([^@\s]+\.[^@\s]+)$/.exec(emailBase.trim());
  if (!match) return null;
  return { nutritionist: `${match[1]}+plan-v-nutri@${match[2]}`, patient: `${match[1]}+plan-v-paciente@${match[2]}` };
}

export function isValidEmail(email: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
}

export const MIN_PASSWORD = 10;

/** Mensaje en español para un error de las rutas de gestión; 409 es mail repetido. */
export function adminErrorMessage(reason: unknown, fallback = 'No pudimos completar la acción. Probá de nuevo.'): string {
  if (reason instanceof ApiError) {
    if (reason.status === 409) return 'Ese mail ya tiene cuenta.';
    if (reason.status === 422) return 'Revisá los datos: el mail o la clave no son válidos.';
    if (reason.status === 404 || reason.status === 405) return 'El servidor todavía no tiene esta función. Probá de nuevo más tarde.';
  }
  return feeErrorMessage(reason, fallback);
}

/** Atajos de la lista: qué nutricionistas conviene mirar primero. No incluyen las cuentas de prueba. */
export type ServiceFocus = 'todas' | 'atender' | 'sin_ingreso' | 'sin_pacientes';
export const SERVICE_FOCUS: Array<{ id: ServiceFocus; label: string }> = [
  { id: 'todas', label: 'Todas' },
  { id: 'atender', label: 'Para atender' },
  { id: 'sin_ingreso', label: 'Nunca entraron' },
  { id: 'sin_pacientes', label: 'Sin pacientes' },
];

const NEEDS_ATTENTION: ServiceState[] = ['por_vencer', 'vencida', 'cortada', 'suspendida'];

export function matchesFocus(row: ServiceRow, focus: ServiceFocus): boolean {
  if (focus === 'atender') return NEEDS_ATTENTION.includes(row.summary.state);
  if (focus === 'sin_ingreso') return !row.nutritionist.last_sign_in_at;
  if (focus === 'sin_pacientes') return row.nutritionist.patients_active === 0;
  return true;
}

export function focusCounts(rows: ServiceRow[]): Record<ServiceFocus, number> {
  const real = rows.filter((row) => row.nutritionist.is_test !== true);
  return Object.fromEntries(SERVICE_FOCUS.map(({ id }) => [id, real.filter((row) => matchesFocus(row, id)).length])) as Record<ServiceFocus, number>;
}

const MONTH_NAMES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Pagos confirmados por mes (los últimos `months`, el actual incluido). Sin cuentas de prueba. */
export function monthlyCollections(nutritionists: ServiceNutritionist[], today: string, months = 6): Array<{ month: string; label: string; total: number }> {
  const [year, month] = today.slice(0, 7).split('-').map(Number);
  const list = Array.from({ length: months }, (_, index) => {
    const offset = month - 1 - (months - 1 - index);
    const y = year + Math.floor(offset / 12);
    const m = ((offset % 12) + 12) % 12;
    return { month: `${y}-${String(m + 1).padStart(2, '0')}`, label: MONTH_NAMES[m], total: 0 };
  });
  const byMonth = new Map(list.map((item) => [item.month, item]));
  for (const nutritionist of nutritionists) {
    if (nutritionist.is_test) continue;
    for (const payment of nutritionist.payments) {
      const slot = payment.status === 'confirmed' ? byMonth.get(payment.paid_on.slice(0, 7)) : undefined;
      if (slot) slot.total += payment.amount;
    }
  }
  return list;
}

function csvCell(value: string | number): string {
  const text = String(value);
  // Una celda que empieza con =, +, - o @ la planilla la toma como fórmula: se antepone una comilla.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Lista de nutricionistas para abrir en una planilla. Sin datos de salud: solo cantidades. */
export function serviceRowsCsv(rows: ServiceRow[]): string {
  const head = ['Nombre', 'Mail', 'Estado', 'Vigencia hasta', 'Pacientes activas', 'Pacientes en total', 'Último ingreso'];
  const lines = rows.map(({ nutritionist, summary }) => [
    nutritionist.display_name, nutritionist.email, SERVICE_STATE_LABELS[summary.state], summary.until ?? '',
    nutritionist.patients_active, nutritionist.patients_total, nutritionist.last_sign_in_at ? nutritionist.last_sign_in_at.slice(0, 10) : 'Nunca',
  ].map(csvCell).join(','));
  return [head.join(','), ...lines].join('\n');
}
