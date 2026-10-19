import { formatFeeDate, formatPesos } from '../fees';
import type { PatientSubscription, SubscriptionPlan, SubscriptionSummary } from '../types/subscriptions';

export type DebitFilter = 'todas' | 'al_dia' | 'problemas' | 'sin_ficha';

export type PlanDraft = { name: string; pesos: string; description: string; visible: boolean };

const CLOSED = new Set(['cancelled', 'expired', 'failed']);

export function monthlyLabel(cents: number): string {
  return `${formatPesos(Math.round(cents / 100))} por mes`;
}

export function debitSummary(summary: SubscriptionSummary): string {
  const active = summary.active === 1 ? '1 activa' : `${summary.active} activas`;
  const pending = summary.pending === 1 ? '1 esperando el primer pago' : `${summary.pending} esperando el primer pago`;
  const problems = summary.problems === 1 ? '1 con pago rechazado' : `${summary.problems} con pago rechazado`;
  return `${active} · ${pending} · ${problems}`;
}

export function debitState(sub: PatientSubscription): string {
  if (sub.account_mismatch) return 'Creada con otra cuenta de Mercado Pago';
  if (sub.review_required || sub.status === 'uncertain' || sub.status === 'failed') return 'Revisar';
  if (sub.status === 'creating') return 'Preparando el enlace';
  if (sub.status === 'pending') return 'Esperando el primer pago';
  if (sub.status === 'paused') return 'En pausa';
  if (sub.status === 'expired') return 'Enlace vencido';
  if (sub.status === 'cancelled') {
    if (sub.cancelled_by === 'patient') return 'Cancelada por la paciente';
    if (sub.cancelled_by === 'mercado_pago') return 'Cancelada por Mercado Pago';
    if (sub.cancelled_by === 'nutritionist') return 'Cancelada por vos';
    return 'Cancelada';
  }
  if (sub.payment_state === 'retrying') return 'Pago rechazado · Mercado Pago reintenta';
  if (sub.payment_state === 'rejected') return 'Pago rechazado';
  if (sub.status === 'authorized') return 'Al día';
  return 'Revisar';
}

export function debitTone(sub: PatientSubscription): 'al-dia' | 'espera' | 'problema' | 'pausa' {
  if (sub.status === 'authorized' && sub.payment_state !== 'rejected' && sub.payment_state !== 'retrying' && !sub.review_required && !sub.account_mismatch) return 'al-dia';
  if (sub.payment_state === 'rejected' || sub.payment_state === 'retrying' || sub.review_required || sub.account_mismatch || sub.status === 'failed') return 'problema';
  if (sub.status === 'paused') return 'pausa';
  return 'espera';
}

export function filterDebits(rows: readonly PatientSubscription[], filter: DebitFilter): PatientSubscription[] {
  if (filter === 'al_dia') return rows.filter(row => debitTone(row) === 'al-dia');
  if (filter === 'problemas') return rows.filter(row => debitTone(row) === 'problema' || row.status === 'uncertain');
  if (filter === 'sin_ficha') return rows.filter(row => !row.patient_id && !CLOSED.has(row.status));
  return [...rows];
}

export function debitPerson(sub: PatientSubscription, patients: readonly { id: string; name: string }[]): string {
  if (sub.contact_name?.trim()) return sub.contact_name.trim();
  const known = patients.find(patient => patient.id === sub.patient_id);
  if (known?.name) return known.name;
  return sub.patient_id ? 'Paciente' : 'Sin ficha';
}

export function nextChargeLabel(value: string | null): string {
  if (!value) return 'Sin fecha de cobro';
  const day = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return 'Sin fecha de cobro';
  return `Próximo cobro ${formatFeeDate(day)}`;
}

export function planDraftError(input: PlanDraft): string {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 60) return 'El nombre tiene que tener entre 2 y 60 letras.';
  if (!/^\d+$/.test(input.pesos.trim())) return 'El precio tiene que ser un monto en pesos, sin centavos.';
  const pesos = Number(input.pesos);
  if (pesos < 1000 || pesos > 10_000_000) return 'El precio tiene que estar entre 1.000 y 10.000.000 pesos.';
  if (input.description.trim().length > 280) return 'Qué incluye es demasiado largo.';
  return '';
}

export function payerEmailError(value: string): string {
  const email = value.trim();
  if (email.length < 5 || email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return 'Revisá el correo de Mercado Pago.';
  return '';
}

export function subscriptionConcept(note: string, source?: string): string {
  const text = note.trim();
  if (source !== 'subscription') return text || 'Pago registrado';
  if (text.startsWith('Débito automático')) return text;
  return text ? `Débito automático · ${text}` : 'Débito automático';
}

export function extraProgramNames(current: readonly { name: string }[], plans: readonly Pick<SubscriptionPlan, 'name' | 'status'>[]): string[] {
  const known = new Set(current.map(item => item.name.trim().toLocaleLowerCase('es-AR')));
  return plans.filter(plan => plan.status === 'active' && !known.has(plan.name.trim().toLocaleLowerCase('es-AR'))).map(plan => plan.name);
}
