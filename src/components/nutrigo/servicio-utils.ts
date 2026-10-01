import { summarizeService, type ServiceState, type ServiceSummary } from '../../service';
import type { ServiceBoard, ServiceNutritionist } from '../../types/service';

export const SERVICE_EVENT_LABELS: Record<string, string> = {
  'service.payment': 'Pago registrado',
  'service.payment_voided': 'Pago anulado',
  'service.trial_extended': 'Prueba extendida',
  'service.override': 'Excepción cambiada',
  'service.settings': 'Precio o prueba cambiados',
  'service.org_status': 'Estado de consultorio',
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
