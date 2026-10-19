import { chargeTitle, formatFeeDate, formatPesos, summarizeLedger } from '../fees';
import { incomeIn } from './inicio-indicators';
import type { BillingBoard, BillingBoardPatient } from '../types/fees';

export type MovementKind = 'cobrado' | 'pendiente' | 'vencido';
export type BillingMovement = {
  id: string;
  date: string;
  patientId: string;
  patientName: string;
  concept: string;
  method: string;
  amount: number;
  status: string;
  kind: MovementKind;
};

const METHOD: Record<string, string> = { efectivo: 'Efectivo', transferencia: 'Transferencia', mercado_pago: 'Mercado Pago', otro: 'Otro' };

export function personInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = `${parts[0]?.[0] ?? ''}${parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''}`;
  return letters.toLocaleUpperCase('es-AR') || '·';
}

export function billingMovements(board: BillingBoard, today: string): BillingMovement[] {
  const rows: BillingMovement[] = [];
  for (const patient of board.patients) {
    for (const payment of patient.payments) {
      if (payment.status !== 'confirmed' && payment.status !== 'reported') continue;
      rows.push({
        id: `pay:${payment.id}`, date: payment.paid_on, patientId: patient.patient_id, patientName: patient.full_name,
        concept: payment.note.trim() || 'Pago registrado', method: METHOD[payment.method] ?? 'Otro', amount: payment.amount,
        status: payment.status === 'reported' ? 'A confirmar' : 'Cobrado', kind: payment.status === 'reported' ? 'pendiente' : 'cobrado',
      });
    }
    const summary = summarizeLedger(patient, today);
    for (const charge of summary.charges) {
      if (charge.status !== 'open' || charge.paid >= charge.amount) continue;
      const overdue = charge.due_on <= today;
      const soon = !overdue && charge.due_on <= shiftDate(today, 7);
      rows.push({
        id: `charge:${charge.id}`, date: charge.due_on, patientId: patient.patient_id, patientName: patient.full_name,
        concept: chargeTitle(charge), method: '—', amount: charge.amount - charge.paid,
        status: overdue ? 'Vencido' : soon ? `Vence en ${daysBetween(today, charge.due_on)} días` : 'Pendiente',
        kind: overdue ? 'vencido' : 'pendiente',
      });
    }
  }
  return rows.sort((a, b) => b.date.localeCompare(a.date) || a.patientName.localeCompare(b.patientName, 'es-AR'));
}

export function filterMovements(rows: readonly BillingMovement[], filter: 'todos' | MovementKind): BillingMovement[] {
  return filter === 'todos' ? [...rows] : rows.filter(row => row.kind === filter);
}

function shiftDate(day: string, delta: number): string {
  const date = new Date(`${day}T15:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.max(0, Math.round((Date.parse(`${to}T15:00:00Z`) - Date.parse(`${from}T15:00:00Z`)) / 86_400_000));
}

export type MonthBar = { key: string; label: string; amount: number; current: boolean };

export function incomeMonths(board: BillingBoard, today: string, count: 6 | 12): MonthBar[] {
  const [year, month] = today.split('-').map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - (count - 1 - index), 1));
    const key = date.toISOString().slice(0, 7);
    const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
    const from = `${key}-01`;
    const to = key === today.slice(0, 7) ? today : last;
    const label = date.toLocaleDateString('es-AR', { month: 'short', timeZone: 'UTC' }).replace('.', '');
    return { key, label: label.charAt(0).toLocaleUpperCase('es-AR') + label.slice(1), amount: incomeIn(board, { from, to }).amount, current: key === today.slice(0, 7) };
  });
}

export type BillingSnapshot = {
  collected: number;
  toCollect: number;
  toCollectCount: number;
  overdue: number;
  overduePatients: BillingBoardPatient[];
  expectedRatio: number | null;
  programs: { name: string; count: number }[];
  activePrograms: number;
};

export function billingSnapshot(board: BillingBoard, today: string): BillingSnapshot {
  const month = today.slice(0, 7);
  const collected = incomeIn(board, { from: `${month}-01`, to: today }).amount;
  let toCollect = 0;
  let toCollectCount = 0;
  const overduePatients: BillingBoardPatient[] = [];
  let overdue = 0;
  const programs = new Map<string, number>();
  for (const patient of board.patients) {
    const summary = summarizeLedger(patient, today);
    if (summary.owed > 0) { overdue += summary.owed; overduePatients.push(patient); }
    for (const charge of summary.charges) {
      if (charge.status === 'open' && charge.paid < charge.amount && charge.due_on >= today && charge.due_on.startsWith(month)) {
        toCollect += charge.amount - charge.paid;
        toCollectCount += 1;
      }
    }
    if (patient.fee) programs.set(patient.fee.program_name?.trim() || 'Cuota mensual', (programs.get(patient.fee.program_name?.trim() || 'Cuota mensual') ?? 0) + 1);
  }
  const expected = collected + toCollect;
  return {
    collected, toCollect, toCollectCount, overdue, overduePatients,
    expectedRatio: expected > 0 ? Math.round((collected / expected) * 100) : null,
    programs: [...programs.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'es-AR')),
    activePrograms: [...programs.values()].reduce((sum, count) => sum + count, 0),
  };
}

export function movementsCsv(rows: readonly BillingMovement[]): string {
  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
  const lines = ['Fecha,Paciente,Concepto,Medio,Monto,Estado', ...rows.map(row => [formatFeeDate(row.date), row.patientName, row.concept, row.method, String(row.amount), row.status].map(escape).join(','))];
  return lines.join('\n');
}

export function pesos(amount: number): string {
  return formatPesos(amount);
}

export function shortPesos(amount: number): string {
  if (amount >= 1000) return `$${Math.round(amount / 1000)}k`;
  return formatPesos(amount);
}
