import { summarizeLedger, type FeeState, type FeeSummary } from '../../fees';
import type { BillingBoard, BillingBoardPatient, PatientLedger } from '../../types/fees';

/** Los errores de la API llegan como texto JSON `{"error":"..."}`; devuelve solo el mensaje. */
export function feeErrorMessage(reason: unknown, fallback = 'No pudimos completar la acción. Probá de nuevo.'): string {
  if (!(reason instanceof Error) || !reason.message) return fallback;
  const raw = reason.message.trim();
  try {
    const parsed = JSON.parse(raw) as { error?: unknown; message?: unknown };
    const text = typeof parsed.error === 'string' ? parsed.error : typeof parsed.message === 'string' ? parsed.message : '';
    if (text) return text;
  } catch { /* no era JSON */ }
  return raw.startsWith('{') ? fallback : raw;
}

export type BoardFilter = 'todas' | 'deben' | 'por_vencer' | 'al_dia';
export const BOARD_FILTERS: Array<{ id: BoardFilter; label: string }> = [
  { id: 'todas', label: 'Todas' }, { id: 'deben', label: 'Deben' }, { id: 'por_vencer', label: 'Por vencer' }, { id: 'al_dia', label: 'Al día' },
];

export type BoardRow = { patient: BillingBoardPatient; summary: FeeSummary };

const STATE_ORDER: Record<FeeState, number> = { debe: 0, por_vencer: 1, al_dia: 2, sin_cuota: 3 };

export function buildBoardRows(board: BillingBoard, today?: string): BoardRow[] {
  return board.patients
    .map((patient) => ({ patient, summary: summarizeLedger(patient, today) }))
    .sort((a, b) => STATE_ORDER[a.summary.state] - STATE_ORDER[b.summary.state]
      || (a.summary.debt_since ?? '9999').localeCompare(b.summary.debt_since ?? '9999')
      || a.patient.full_name.localeCompare(b.patient.full_name, 'es'));
}

const FILTER_STATE: Record<Exclude<BoardFilter, 'todas'>, FeeState> = { deben: 'debe', por_vencer: 'por_vencer', al_dia: 'al_dia' };

export function filterBoardRows(rows: BoardRow[], filter: BoardFilter): BoardRow[] {
  return filter === 'todas' ? rows : rows.filter((row) => row.summary.state === FILTER_STATE[filter]);
}

export function boardTotals(rows: BoardRow[]) {
  return {
    collected: rows.reduce((sum, row) => sum + row.summary.paid_this_month, 0),
    owed: rows.reduce((sum, row) => sum + row.summary.owed, 0),
    debtors: rows.filter((row) => row.summary.state === 'debe').length,
    pending: rows.reduce((sum, row) => sum + row.summary.pending_reports, 0),
  };
}

export function replaceLedger(board: BillingBoard, ledger: PatientLedger): BillingBoard {
  return { ...board, patients: board.patients.map((patient) => patient.patient_id === ledger.patient_id ? { ...ledger, full_name: patient.full_name } : patient) };
}

/** Monto sugerido para un pago nuevo: lo que debe, si no la próxima cuota, si no el valor de la cuota. */
export function suggestedPaymentAmount(summary: FeeSummary, fee: PatientLedger['fee']): number {
  return summary.owed || summary.next_due?.amount || fee?.amount || 0;
}

export function parsePesos(value: string): number | null {
  const amount = Number(value.replace(/\./g, '').replace(',', '.'));
  return Number.isInteger(amount) && amount > 0 ? amount : null;
}
