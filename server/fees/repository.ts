import { registerDemoState } from '../demo/state.js';
import { randomUUID } from 'node:crypto';
import { getRequestDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { getStore } from '../store.js';
import { localBillingDate } from '../../src/billing.js';
import type {
  BillingBoard,
  PatientCharge,
  PatientFee,
  PatientLedger,
  PatientLedgerView,
  PatientPayment,
  PaymentDecision,
  PaymentInput,
  PaymentSettings,
} from '../../src/types/fees.js';

export { CareError } from '../care/errors.js';

export function feesDbError(error: { code?: string; message?: string } | null): void {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '')) {
    throw new CareError(501, 'Las cobranzas requieren instalar la migración de este módulo.');
  }
  if (error.code === '42501') throw new CareError(403, 'No tenés permiso para esta acción.');
  if (error.code === 'PT409') throw new CareError(409,'Ese reintento contiene datos distintos. Recuperá el pago guardado.');
  if (error.message === 'billing_too_many_reports') throw new CareError(429, 'Ya avisaste varios pagos. Esperá a que tu nutricionista los confirme.');
  if (['22023', '23514', '22P02'].includes(error.code ?? '')) throw new CareError(400, 'Revisá el monto, la fecha y el medio de pago.');
  throw new CareError(503, 'No se pudo guardar. Reintentá en un momento.');
}

// ---------- Modo demo (memoria) ----------

type MemoryFee = PatientFee & { charges_from: string | null };

const settings: PaymentSettings = { default_fee: null, alias: '', payment_link: '', instructions: '' };
const fees = new Map<string, MemoryFee>();
const charges = new Map<string, PatientCharge[]>();
const payments = new Map<string, PatientPayment[]>();

/** Datos de ejemplo del modo demo: Sofía al día, Marina con una cuota vencida, Lucía sin cuota. */
function seedDemo(): void {
  const today = localBillingDate();
  Object.assign(settings, { default_fee: 30000, alias: 'vero.nutricion', payment_link: '', instructions: 'Transferí antes del día 10 y avisame con "Ya pagué".' });
  fees.set('pat-sofia', { amount: 30000, first_due_on: addMonths(today, -2), charges_from: null });
  fees.set('pat-marina', { amount: 28000, first_due_on: addMonths(today, -1), charges_from: null });
  syncMemory('pat-sofia');
  syncMemory('pat-marina');
  const sofia = charges.get('pat-sofia') ?? [];
  payments.set('pat-sofia', sofia.filter((charge) => charge.due_on <= today).map((charge) => ({
    id: randomUUID(), amount: charge.amount, paid_on: charge.due_on, method: 'transferencia', note: '',
    status: 'confirmed', reported_by_patient: false, created_at: `${charge.due_on}T15:00:00.000Z`,
  })));
  payments.set('pat-marina', [{
    id: randomUUID(), amount: 28000, paid_on: addMonths(today, -1), method: 'mercado_pago', note: '',
    status: 'confirmed', reported_by_patient: false, created_at: `${addMonths(today, -1)}T15:00:00.000Z`,
  }]);
}

export function resetFeesMemory(): void {
  Object.assign(settings, { default_fee: null, alias: '', payment_link: '', instructions: '' });
  fees.clear();
  charges.clear();
  payments.clear();
  paymentReceipts.clear();
  seedDemo();
}

function addMonths(date: string, months: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target.toISOString().slice(0, 10);
}

function syncMemory(patientId: string): void {
  const fee = fees.get(patientId);
  if (!fee) return;
  const today = localBillingDate();
  const list = charges.get(patientId) ?? [];
  for (let n = 0; n <= 600; n += 1) {
    const due = addMonths(fee.first_due_on, n);
    if ((!fee.charges_from || due > fee.charges_from) && !list.some((charge) => charge.due_on === due)) {
      list.push({ id: randomUUID(), due_on: due, amount: fee.amount, status: 'open' });
    }
    if (due > today) break;
  }
  list.sort((a, b) => a.due_on.localeCompare(b.due_on));
  charges.set(patientId, list);
}

function memoryLedger(patientId: string): PatientLedger {
  syncMemory(patientId);
  const fee = fees.get(patientId);
  return {
    patient_id: patientId,
    fee: fee ? { amount: fee.amount, first_due_on: fee.first_due_on } : null,
    charges: [...(charges.get(patientId) ?? [])],
    payments: [...(payments.get(patientId) ?? [])].sort((a, b) => b.paid_on.localeCompare(a.paid_on) || b.created_at.localeCompare(a.created_at)),
  };
}

function memoryPatient(patientId: string) {
  const patient = getStore().patients.find((row) => row.id === patientId);
  if (!patient) throw new CareError(404, 'Paciente no encontrado.');
  return patient;
}

function findPayment(paymentId: string): { patientId: string; payment: PatientPayment } {
  for (const [patientId, list] of payments) {
    const payment = list.find((row) => row.id === paymentId);
    if (payment) return { patientId, payment };
  }
  throw new CareError(404, 'Ese pago no existe.');
}

function findCharge(chargeId: string): { patientId: string; charge: PatientCharge } {
  for (const [patientId, list] of charges) {
    const charge = list.find((row) => row.id === chargeId);
    if (charge) return { patientId, charge };
  }
  throw new CareError(404, 'Esa cuota no existe.');
}

function addPayment(patientId: string, input: PaymentInput, reported: boolean): void {
  const list = payments.get(patientId) ?? [];
  if (reported && list.filter((row) => row.status === 'reported').length >= 5) {
    throw new CareError(429, 'Ya avisaste varios pagos. Esperá a que tu nutricionista los confirme.');
  }
  list.push({
    id: randomUUID(),
    amount: input.amount,
    paid_on: input.paid_on,
    method: input.method,
    note: (input.note ?? '').trim(),
    status: reported ? 'reported' : 'confirmed',
    reported_by_patient: reported,
    created_at: new Date().toISOString(),
  });
  payments.set(patientId, list);
}

// ---------- API común ----------

function asLedger(data: unknown): PatientLedger {
  const row = data as Record<string, unknown>;
  const fee = row.fee as Record<string, unknown> | null;
  return {
    patient_id: String(row.patient_id),
    fee: fee ? { amount: Number(fee.amount), first_due_on: String(fee.first_due_on) } : null,
    charges: ((row.charges as Record<string, unknown>[]) ?? []).map((charge) => ({
      id: String(charge.id),
      due_on: String(charge.due_on),
      amount: Number(charge.amount),
      status: charge.status === 'waived' ? 'waived' : 'open',
    })),
    payments: ((row.payments as Record<string, unknown>[]) ?? []).map((payment) => ({
      id: String(payment.id),
      amount: Number(payment.amount),
      paid_on: String(payment.paid_on),
      method: payment.method as PatientPayment['method'],
      note: String(payment.note ?? ''),
      status: payment.status as PatientPayment['status'],
      reported_by_patient: Boolean(payment.reported_by_patient),
      created_at: String(payment.created_at),
    })),
  };
}

function asSettings(data: unknown): PaymentSettings {
  const row = (data ?? {}) as Record<string, unknown>;
  return {
    default_fee: row.default_fee == null ? null : Number(row.default_fee),
    alias: String(row.alias ?? ''),
    payment_link: String(row.payment_link ?? ''),
    instructions: String(row.instructions ?? ''),
  };
}

async function call(name: string, args?: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await getRequestDb().rpc(name, args);
  feesDbError(error);
  return data;
}

export async function getBoard(persistent: boolean): Promise<BillingBoard> {
  if (persistent) {
    const data = await call('get_billing_board') as Record<string, unknown>;
    return {
      settings: asSettings(data.settings),
      patients: ((data.patients as unknown[]) ?? []).map((entry) => ({
        ...asLedger(entry),
        full_name: String((entry as Record<string, unknown>).full_name ?? ''),
      })),
    };
  }
  return {
    settings: { ...settings },
    patients: getStore().patients
      .filter((patient) => !patient.archived_at && !patient.deactivated_at && !patient.anonymized_at)
      .map((patient) => ({ ...memoryLedger(patient.id), full_name: patient.name }))
      .sort((a, b) => a.full_name.localeCompare(b.full_name, 'es')),
  };
}

export async function getLedger(patientId: string, persistent: boolean): Promise<PatientLedgerView> {
  if (persistent) {
    const data = await call('get_patient_ledger', { target: patientId }) as Record<string, unknown>;
    const info = data.payment_info as Record<string, unknown> | null;
    return {
      ...asLedger(data),
      payment_info: info ? {
        nutritionist_name: String(info.nutritionist_name ?? ''),
        alias: String(info.alias ?? ''),
        payment_link: String(info.payment_link ?? ''),
        instructions: String(info.instructions ?? ''),
      } : null,
    };
  }
  memoryPatient(patientId);
  return {
    ...memoryLedger(patientId),
    payment_info: { nutritionist_name: 'Verónica Trenti', alias: settings.alias, payment_link: settings.payment_link, instructions: settings.instructions },
  };
}

export async function saveSettings(input: PaymentSettings, persistent: boolean): Promise<PaymentSettings> {
  if (persistent) {
    return asSettings(await call('set_payment_settings', {
      default_fee: input.default_fee,
      alias: input.alias,
      payment_link: input.payment_link,
      instructions: input.instructions,
    }));
  }
  Object.assign(settings, {
    default_fee: input.default_fee,
    alias: input.alias.trim(),
    payment_link: input.payment_link.trim(),
    instructions: input.instructions.trim(),
  });
  return { ...settings };
}

export async function setFee(patientId: string, input: PatientFee | null, persistent: boolean): Promise<PatientLedger> {
  if (persistent) {
    return asLedger(await call('set_patient_fee', {
      target: patientId,
      amount: input?.amount ?? null,
      first_due_on: input?.first_due_on ?? null,
    }));
  }
  memoryPatient(patientId);
  syncMemory(patientId);
  const today = localBillingDate();
  const kept = (charges.get(patientId) ?? []).filter((charge) => charge.due_on <= today);
  charges.set(patientId, kept);
  if (!input) fees.delete(patientId);
  else fees.set(patientId, { ...input, charges_from: kept[kept.length - 1]?.due_on ?? null });
  return memoryLedger(patientId);
}

export async function recordPayment(patientId: string, input: PaymentInput, persistent: boolean): Promise<PatientLedger> {
  if (persistent) {
    return asLedger(await call('record_patient_payment', {
      target: patientId, amount: input.amount, paid_on: input.paid_on, method: input.method, note: input.note ?? '', client_id: input.client_id,
    }));
  }
  memoryPatient(patientId);
  if (!paymentDuplicate(patientId, input, 'record')) addPayment(patientId, input, false);
  return memoryLedger(patientId);
}

export async function reportPayment(patientId: string, input: PaymentInput, persistent: boolean): Promise<PatientLedgerView> {
  if (persistent) {
    await call('report_patient_payment', {
      target: patientId, amount: input.amount, paid_on: input.paid_on, method: input.method, note: input.note ?? '', client_id: input.client_id,
    });
    return getLedger(patientId, true);
  }
  memoryPatient(patientId);
  if (!paymentDuplicate(patientId, input, 'report')) addPayment(patientId, input, true);
  return getLedger(patientId, false);
}

export async function reviewPayment(paymentId: string, decision: PaymentDecision, persistent: boolean): Promise<PatientLedger> {
  if (persistent) return asLedger(await call('review_patient_payment', { payment_id: paymentId, decision }));
  const { patientId, payment } = findPayment(paymentId);
  if (decision === 'confirm' && payment.status === 'reported') payment.status = 'confirmed';
  else if (decision === 'reject' && payment.status === 'reported') payment.status = 'rejected';
  else if (decision === 'void' && payment.status === 'confirmed') payment.status = 'voided';
  else throw new CareError(400, 'Ese pago ya fue revisado.');
  return memoryLedger(patientId);
}

export async function setChargeWaived(chargeId: string, waived: boolean, persistent: boolean): Promise<PatientLedger> {
  if (persistent) return asLedger(await call('set_patient_charge_waived', { charge_id: chargeId, waived }));
  const { patientId, charge } = findCharge(chargeId);
  charge.status = waived ? 'waived' : 'open';
  return memoryLedger(patientId);
}

// El modo demo arranca con los ejemplos (resetStore los vuelve a cargar en las pruebas).
seedDemo();

const paymentReceipts = new Map<string,string>();
function paymentDuplicate(patientId: string, input: PaymentInput, operation: string) {
  if (!input.client_id) return false;
  const body = JSON.stringify([patientId,operation,input.amount,input.paid_on,input.method,input.note?.trim() ?? '']);
  const prior = paymentReceipts.get(input.client_id);
  if (prior && prior !== body) throw new CareError(409,'Ese reintento contiene datos distintos. Recuperá el pago guardado.');
  if (prior) return true;
  paymentReceipts.set(input.client_id,body); return false;
}

registerDemoState('fees/repository', () => ({ settings, fees, charges, payments, paymentReceipts }));
