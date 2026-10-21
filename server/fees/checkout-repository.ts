import { CareError } from '../care/errors.js';
import { privilegedDb } from '../db/supabase-client.js';
import { raiseDb } from '../subscriptions/repository.js';
import type { PatientCharge, PatientFee, PatientLedger, PatientPayment } from '../../src/types/fees.js';

function db() {
  return privilegedDb();
}

export type FeeCheckoutRow = {
  id: string;
  nutritionist_id: string;
  patient_id: string;
  charge_id: string | null;
  due_on: string;
  amount: number;
  status: 'creating' | 'ready' | 'paid' | 'expired';
  checkout_url: string | null;
  provider_preference_id: string | null;
  provider_payment_id: string | null;
  client_request_id: string;
  expires_at: string;
};

function day(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? '').slice(0, 10);
}

function asCheckout(row: Record<string, unknown> | null): FeeCheckoutRow | null {
  if (!row) return null;
  return {
    id: String(row.id),
    nutritionist_id: String(row.nutritionist_id),
    patient_id: String(row.patient_id),
    charge_id: row.charge_id == null ? null : String(row.charge_id),
    due_on: day(row.due_on),
    amount: Number(row.amount),
    status: row.status as FeeCheckoutRow['status'],
    checkout_url: row.checkout_url == null ? null : String(row.checkout_url),
    provider_preference_id: row.provider_preference_id == null ? null : String(row.provider_preference_id),
    provider_payment_id: row.provider_payment_id == null ? null : String(row.provider_payment_id),
    client_request_id: String(row.client_request_id),
    expires_at: String(row.expires_at),
  };
}

export async function patientRow(patientId: string) {
  const row = await db().from('patients').select('id,nutritionist_id,anonymized_at').eq('id', patientId).maybeSingle();
  raiseDb(row.error);
  const patient = row.data as { id: string; nutritionist_id: string; anonymized_at: string | null } | null;
  if (!patient || patient.anonymized_at) return null;
  return patient;
}

export async function liveDebit(patientId: string): Promise<boolean> {
  const row = await db().from('patient_subscriptions').select('id').eq('patient_id', patientId).in('status', ['authorized', 'paused']).limit(1);
  raiseDb(row.error);
  return (row.data ?? []).length > 0;
}

export async function loadLedger(patientId: string): Promise<PatientLedger> {
  const fee = await db().from('patient_fees').select('amount,first_due_on,program_name').eq('patient_id', patientId).maybeSingle();
  raiseDb(fee.error);
  const charges = await db().from('patient_charges').select('id,due_on,amount,status,kind,concept').eq('patient_id', patientId);
  raiseDb(charges.error);
  const payments = await db().from('patient_payments').select('id,amount,paid_on,method,note,status,reported_by_patient,created_at,source,covers_due_on').eq('patient_id', patientId);
  raiseDb(payments.error);
  const feeRow = fee.data as { amount: number; first_due_on: string; program_name: string | null } | null;
  const savedFee: PatientFee | null = feeRow
    ? { amount: Number(feeRow.amount), first_due_on: day(feeRow.first_due_on), program_name: feeRow.program_name ?? undefined }
    : null;
  return {
    patient_id: patientId,
    fee: savedFee,
    charges: ((charges.data ?? []) as Array<Record<string, unknown>>).map(charge => ({
      id: String(charge.id),
      due_on: day(charge.due_on),
      amount: Number(charge.amount),
      status: charge.status as PatientCharge['status'],
      kind: charge.kind == null ? undefined : charge.kind as PatientCharge['kind'],
      concept: charge.concept == null ? undefined : String(charge.concept),
    })),
    payments: ((payments.data ?? []) as Array<Record<string, unknown>>).map(payment => ({
      id: String(payment.id),
      amount: Number(payment.amount),
      paid_on: day(payment.paid_on),
      method: payment.method as PatientPayment['method'],
      note: String(payment.note ?? ''),
      status: payment.status as PatientPayment['status'],
      reported_by_patient: Boolean(payment.reported_by_patient),
      created_at: String(payment.created_at),
      source: payment.source as PatientPayment['source'],
      covers_due_on: payment.covers_due_on == null ? null : day(payment.covers_due_on),
    })),
  };
}

export async function findCheckout(nutritionistId: string, id: string) {
  const row = await db().from('patient_fee_checkouts').select('*').eq('id', id).eq('nutritionist_id', nutritionistId).maybeSingle();
  raiseDb(row.error);
  return asCheckout(row.data as Record<string, unknown> | null);
}

export async function findOpen(patientId: string, dueOn: string) {
  const row = await db().from('patient_fee_checkouts').select('*').eq('patient_id', patientId).eq('due_on', dueOn).in('status', ['creating', 'ready']).maybeSingle();
  raiseDb(row.error);
  return asCheckout(row.data as Record<string, unknown> | null);
}

export async function findByRequest(nutritionistId: string, clientRequestId: string) {
  const row = await db().from('patient_fee_checkouts').select('*').eq('nutritionist_id', nutritionistId).eq('client_request_id', clientRequestId).maybeSingle();
  raiseDb(row.error);
  return asCheckout(row.data as Record<string, unknown> | null);
}

export async function insertCheckout(values: Record<string, unknown>) {
  const row = await db().from('patient_fee_checkouts').insert(values).select('*').single();
  if (row.error?.code === '23505') return null;
  raiseDb(row.error);
  return asCheckout(row.data as Record<string, unknown>);
}

export async function patchCheckout(id: string, patch: Record<string, unknown>) {
  const row = await db().from('patient_fee_checkouts').update(patch).eq('id', id).select('*').single();
  raiseDb(row.error);
  return asCheckout(row.data as Record<string, unknown>);
}

export async function expireStale(nowIso: string) {
  const row = await db().from('patient_fee_checkouts').update({ status: 'expired' }).eq('status', 'ready').lt('expires_at', nowIso);
  raiseDb(row.error);
}

export async function expireOthers(patientId: string, dueOn: string, keepId: string) {
  const row = await db().from('patient_fee_checkouts').update({ status: 'expired' }).eq('patient_id', patientId).eq('due_on', dueOn).in('status', ['creating', 'ready']).neq('id', keepId);
  raiseDb(row.error);
}

export async function listReady(nutritionistId?: string) {
  let query = db().from('patient_fee_checkouts').select('*').in('status', ['creating', 'ready']).order('id').limit(100);
  if (nutritionistId) query = query.eq('nutritionist_id', nutritionistId);
  const row = await query;
  raiseDb(row.error);
  return ((row.data ?? []) as Array<Record<string, unknown>>).map(item => asCheckout(item)).filter((item): item is FeeCheckoutRow => Boolean(item));
}

export async function patientsByEmail(nutritionistId: string, email: string): Promise<string[]> {
  const normalized = email.trim().toLowerCase();
  const ids = new Set<string>();
  const invites = await db().from('patient_invites').select('patient_id,email').eq('nutritionist_id', nutritionistId).limit(200);
  raiseDb(invites.error);
  for (const invite of invites.data ?? []) {
    if (String(invite.email ?? '').trim().toLowerCase() === normalized) ids.add(String(invite.patient_id));
  }
  const users = await db().schema('auth').from('users').select('id,email').ilike('email', normalized).limit(5);
  if (!users.error) {
    const userIds = (users.data ?? []).map(user => String(user.id)).filter(Boolean);
    if (userIds.length) {
      const patients = await db().from('patients').select('id').eq('nutritionist_id', nutritionistId).in('user_id', userIds).is('anonymized_at', null);
      raiseDb(patients.error);
      for (const patient of patients.data ?? []) ids.add(String(patient.id));
    }
  }
  if (!ids.size) return [];
  const owned = await db().from('patients').select('id').eq('nutritionist_id', nutritionistId).in('id', [...ids]).is('anonymized_at', null);
  raiseDb(owned.error);
  return (owned.data ?? []).map(patient => String(patient.id));
}

export async function insertCheckoutPayment(values: Record<string, unknown>) {
  const row = await db().from('patient_payments').insert(values).select('id').single();
  if (row.error?.code === '23505') return { created: false as const };
  raiseDb(row.error);
  if (!row.data?.id) throw new CareError(503, 'No se pudo guardar el cobro.');
  return { created: true as const, id: String(row.data.id) };
}
