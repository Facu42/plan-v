import { randomUUID } from 'node:crypto';
import { localBillingDate } from '../../src/billing.js';
import { feeBookResult, feeMonthTitle, monthIsCovered, payableFeeCharges } from '../../src/lib/fee-checkout.js';
import type { PatientLedger } from '../../src/types/fees.js';
import { CareError } from '../care/errors.js';
import { createFeePreference } from '../scheduling/providers.js';
import { mercadoPago, nutriToken } from '../subscriptions/mp.js';
import { argentinaDate, LINK_TTL_MS } from '../subscriptions/logic.js';
import { findLedger, nutritionistBySlug, nutritionistCard, patientOwned, voidLedger } from '../subscriptions/repository.js';
import { subscriptionsAllowed } from '../subscriptions/flag.js';
import * as repo from './checkout-repository.js';

const MISSING = 'Si tenés una cuota de este mes, revisá el correo o pedile el enlace a tu nutricionista.';
const DEBIT = 'Tu cuota se cobra sola con el débito automático.';

export type FeeLink = {
  id: string;
  status: string;
  init_point: string | null;
  due_on: string;
  amount: number;
  title: string;
  expires_at: string;
};

function view(row: repo.FeeCheckoutRow): FeeLink {
  const fresh = row.status === 'ready' && Date.parse(row.expires_at) > Date.now();
  return {
    id: row.id,
    status: fresh || row.status === 'paid' ? row.status : row.status === 'ready' ? 'expired' : row.status,
    init_point: fresh ? row.checkout_url : null,
    due_on: row.due_on,
    amount: row.amount,
    title: feeMonthTitle(row.due_on),
    expires_at: row.expires_at,
  };
}

async function assertNoDebit(patientId: string) {
  if (await repo.liveDebit(patientId)) throw new CareError(409, 'Esta paciente ya tiene débito automático. No hace falta un enlace de un solo mes.');
}

function openCharge(ledger: PatientLedger, dueOn: string, today: string) {
  return payableFeeCharges(ledger, today).find(charge => charge.due_on === dueOn) ?? null;
}

async function ensureLink(nutritionistId: string, patientId: string, dueOn: string, clientRequestId: string): Promise<FeeLink> {
  if (!subscriptionsAllowed(nutritionistId)) throw new CareError(404, 'No encontrado.');
  const replay = await repo.findByRequest(nutritionistId, clientRequestId);
  if (replay) {
    if (replay.patient_id !== patientId || replay.due_on !== dueOn) throw new CareError(409, 'Ese reintento contiene datos distintos.');
    if (replay.checkout_url && Date.parse(replay.expires_at) > Date.now() && replay.status !== 'paid' && replay.status !== 'expired') return view(replay);
  }
  await assertNoDebit(patientId);
  const ledger = await repo.loadLedger(patientId);
  if (!ledger.fee) throw new CareError(409, 'Esta paciente no tiene una cuota mensual.');
  const today = localBillingDate();
  const charge = openCharge(ledger, dueOn, today);
  if (!charge) throw new CareError(409, monthIsCovered(ledger, dueOn, today) ? 'Esa cuota ya está paga.' : 'Elegí un mes que tenga la cuota abierta.');
  const open = await repo.findOpen(patientId, dueOn);
  if (open?.checkout_url && Date.parse(open.expires_at) > Date.now()) return view(open);
  if (open && Date.parse(open.expires_at) <= Date.now()) await repo.patchCheckout(open.id, { status: 'expired' });
  const id = open && !open.checkout_url ? open.id : randomUUID();
  const expiresAt = new Date(Date.now() + LINK_TTL_MS).toISOString();
  if (!open || open.checkout_url) {
    const inserted = await repo.insertCheckout({
      id,
      nutritionist_id: nutritionistId,
      patient_id: patientId,
      charge_id: charge.id,
      due_on: dueOn,
      amount: charge.amount,
      status: 'creating',
      client_request_id: clientRequestId,
      expires_at: expiresAt,
    });
    if (!inserted) {
      const again = await repo.findOpen(patientId, dueOn);
      if (again?.checkout_url) return view(again);
      throw new CareError(409, 'Ya hay un enlace para ese mes. Recargá e intentá de nuevo.');
    }
  }
  const preference = await createFeePreference(nutritionistId, { id, amountPesos: charge.amount, title: charge.title, patientId });
  const ready = await repo.patchCheckout(id, {
    status: 'ready',
    checkout_url: preference.url,
    provider_preference_id: preference.id,
    expires_at: expiresAt,
    amount: charge.amount,
    charge_id: charge.id,
  });
  if (!ready) throw new CareError(503, 'No se pudo armar el enlace. Reintentá en un momento.');
  return view(ready);
}

export async function createForNutritionist(nutritionistId: string, input: { patient_id: string; due_on: string; client_request_id: string }) {
  const patient = await patientOwned(nutritionistId, input.patient_id);
  if (!patient) throw new CareError(404, 'No encontramos a esa paciente.');
  return ensureLink(nutritionistId, input.patient_id, input.due_on, input.client_request_id);
}

export async function offerForPatient(patientId: string) {
  const patient = await repo.patientRow(patientId);
  if (!patient || !subscriptionsAllowed(patient.nutritionist_id)) return null;
  if (await repo.liveDebit(patientId)) return { available: false as const, reason: 'debito' as const };
  const ledger = await repo.loadLedger(patientId);
  if (!ledger.fee) return { available: false as const, reason: 'sin_cuota' as const };
  const open = payableFeeCharges(ledger, localBillingDate());
  const current = open.find(charge => charge.due_on.startsWith(localBillingDate().slice(0, 7))) ?? open[0];
  if (!current) return { available: false as const, reason: 'al_dia' as const };
  return { available: true as const, due_on: current.due_on, amount: current.amount, title: current.title };
}

export async function createForPatient(patientId: string, input: { due_on?: string; client_request_id: string }) {
  const patient = await repo.patientRow(patientId);
  if (!patient || !subscriptionsAllowed(patient.nutritionist_id)) throw new CareError(404, 'No encontrado.');
  const offer = await offerForPatient(patientId);
  if (!offer || offer.available === false) {
    if (offer?.reason === 'debito') throw new CareError(409, 'Esta paciente ya tiene débito automático. No hace falta un enlace de un solo mes.');
    throw new CareError(409, offer?.reason === 'al_dia' ? 'Esa cuota ya está paga.' : 'Esta paciente no tiene una cuota mensual.');
  }
  return ensureLink(patient.nutritionist_id, patientId, input.due_on || offer.due_on, input.client_request_id);
}

export async function publicEnabled(slug: string) {
  const nutritionistId = await nutritionistBySlug(slug);
  if (!nutritionistId || !subscriptionsAllowed(nutritionistId)) return null;
  return { enabled: true as const };
}

export async function createForPublic(slug: string, input: { email: string; client_request_id: string }) {
  const nutritionistId = await nutritionistBySlug(slug);
  if (!nutritionistId || !subscriptionsAllowed(nutritionistId)) throw new CareError(404, 'No encontrado.');
  const ids = await repo.patientsByEmail(nutritionistId, input.email);
  if (!ids.length) return { found: false as const, message: MISSING };
  let chosen: { id: string; due_on: string } | null = null;
  let sawDebit = false;
  for (const id of ids) {
    if (await repo.liveDebit(id)) { sawDebit = true; continue; }
    const ledger = await repo.loadLedger(id);
    const open = payableFeeCharges(ledger, localBillingDate());
    const current = open.find(charge => charge.due_on.startsWith(localBillingDate().slice(0, 7))) ?? open[0];
    if (current) { chosen = { id, due_on: current.due_on }; break; }
  }
  if (!chosen) return { found: false as const, message: sawDebit ? DEBIT : 'No hay una cuota abierta para ese correo.' };
  const link = await ensureLink(nutritionistId, chosen.id, chosen.due_on, input.client_request_id);
  return { found: true as const, ...link };
}

function paymentAmount(payment: Record<string, unknown>) {
  const amount = Number(payment.transaction_amount);
  return Number.isFinite(amount) ? amount : NaN;
}

export async function bookMonthlyCheckout(nutritionistId: string, accountId: string, payment: Record<string, unknown>) {
  if (!subscriptionsAllowed(nutritionistId)) return false;
  const reference = typeof payment.external_reference === 'string' ? payment.external_reference : '';
  const checkout = reference ? await repo.findCheckout(nutritionistId, reference) : null;
  if (!checkout) return false;
  const ledger = await repo.loadLedger(checkout.patient_id);
  const existing = payment.id == null ? null : await findLedger(String(payment.id));
  const decision = feeBookResult({
    checkout,
    payment: {
      status: String(payment.status ?? ''),
      transaction_amount: paymentAmount(payment),
      currency_id: typeof payment.currency_id === 'string' ? payment.currency_id : undefined,
      collector_id: payment.collector_id == null ? undefined : String(payment.collector_id),
    },
    accountId,
    existing,
    monthPaid: checkout.status === 'paid' || monthIsCovered(ledger, checkout.due_on, localBillingDate()),
  });
  if (decision === 'ignore') return false;
  if (decision === 'void' && existing) {
    await voidLedger(existing.id, 'Anulado por devolución');
    return true;
  }
  if (decision !== 'confirm') {
    if (checkout.status !== 'paid' && (decision === 'duplicate' || existing)) await repo.patchCheckout(checkout.id, { status: 'paid', provider_payment_id: payment.id == null ? checkout.provider_payment_id : String(payment.id), paid_at: new Date().toISOString() });
    return true;
  }
  const card = await nutritionistCard(nutritionistId);
  if (!card) return true;
  const paidOn = argentinaDate(typeof payment.date_approved === 'string' ? payment.date_approved : new Date().toISOString());
  const saved = await repo.insertCheckoutPayment({
    patient_id: checkout.patient_id,
    nutritionist_id: nutritionistId,
    amount: checkout.amount,
    paid_on: paidOn,
    method: 'mercado_pago',
    note: feeMonthTitle(checkout.due_on),
    status: 'confirmed',
    created_by: card.user_id,
    reviewed_at: new Date().toISOString(),
    source: 'checkout',
    provider: 'mercado_pago',
    provider_payment_id: String(payment.id),
    covers_due_on: checkout.due_on,
  });
  if (saved.created) await repo.expireOthers(checkout.patient_id, checkout.due_on, checkout.id);
  await repo.patchCheckout(checkout.id, { status: 'paid', provider_payment_id: String(payment.id), paid_at: new Date().toISOString() });
  return true;
}

export async function reconcileMonthlyCheckouts(nutritionistId?: string) {
  await repo.expireStale(new Date().toISOString());
  const rows = await repo.listReady(nutritionistId);
  const actions: string[] = [];
  for (const row of rows) {
    if (!subscriptionsAllowed(row.nutritionist_id)) continue;
    try {
      const { token, accountId } = await nutriToken(row.nutritionist_id);
      const payments = await mercadoPago.searchPayments(token, row.id);
      let touched = false;
      for (const payment of payments) {
        if (await bookMonthlyCheckout(row.nutritionist_id, accountId, payment)) touched = true;
      }
      actions.push(touched ? 'fee_booked' : 'fee_checked');
    } catch {
      actions.push('fee_retry');
    }
  }
  return { checked: rows.length, actions };
}
