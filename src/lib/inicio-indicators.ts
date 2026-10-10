import type { Patient } from '../types';
import type { BillingBoard } from '../types/fees';

/** Indicadores de Inicio: cada período se compara con el inmediato anterior, de la misma duración. */
export const PERIOD_OPTIONS = [7, 30, 90] as const;
export type PeriodDays = (typeof PERIOD_OPTIONS)[number];
export interface DateWindow { from: string; to: string }

const DAY = 86_400_000;
const toId = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const toMs = (dateId: string) => Date.parse(`${dateId}T12:00:00Z`);

export function periodWindows(todayId: string, days: PeriodDays): { current: DateWindow; previous: DateWindow } {
  const end = toMs(todayId);
  return {
    current: { from: toId(end - (days - 1) * DAY), to: todayId },
    previous: { from: toId(end - (2 * days - 1) * DAY), to: toId(end - days * DAY) },
  };
}
const inWindow = (dateId: string | null | undefined, window: DateWindow) => Boolean(dateId) && (dateId as string) >= window.from && (dateId as string) <= window.to;

export interface ConsultationCount { total: number; first: number; followUp: number }

/** Consultas cuyo horario ya pasó (historial de turnos). La primera de cada paciente es «primera consulta»; el resto, de seguimiento. */
export function countConsultations(patients: readonly Pick<Patient, 'appointment_history'>[], window: DateWindow): ConsultationCount {
  let first = 0;
  let followUp = 0;
  for (const patient of patients) {
    const dates = [...new Set((patient.appointment_history ?? []).filter((entry) => entry.action === 'elapsed' && entry.dateId).map((entry) => entry.dateId as string))].sort();
    for (const [index, dateId] of dates.entries()) {
      if (!inWindow(dateId, window)) continue;
      if (index === 0) first += 1; else followUp += 1;
    }
  }
  return { total: first + followUp, first, followUp };
}

export interface IncomeTotal { amount: number; payers: number }

/** Pagos confirmados con fecha de pago dentro del período. No cuenta pagos informados sin confirmar, rechazados ni anulados. */
export function incomeIn(board: Pick<BillingBoard, 'patients'>, window: DateWindow): IncomeTotal {
  let amount = 0;
  let payers = 0;
  for (const patient of board.patients) {
    const paid = patient.payments.filter((payment) => payment.status === 'confirmed' && inWindow(payment.paid_on, window));
    if (!paid.length) continue;
    payers += 1;
    amount += paid.reduce((sum, payment) => sum + payment.amount, 0);
  }
  return { amount, payers };
}

export type Variation = { kind: 'up' | 'down' | 'same'; delta: number } | { kind: 'no-baseline' };

export function variation(current: number, previous: number): Variation {
  if (previous === 0 && current > 0) return { kind: 'no-baseline' };
  const delta = current - previous;
  return { kind: delta > 0 ? 'up' : delta < 0 ? 'down' : 'same', delta };
}
