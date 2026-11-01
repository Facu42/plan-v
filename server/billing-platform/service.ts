import { CareError } from '../care/errors.js';
import { siteUrl } from '../admin/accounts.js';
import { verifyMpSignature } from '../scheduling/logic.js';
import { MpCallError } from '../subscriptions/mp.js';
import { billingEnabled } from './flag.js';
import { noopInvoiceIssuer, type InvoiceIssuer } from './invoicing.js';
import { loadRemote, minimalRaw, platformMercadoPago, preapprovalBody } from './mp-platform.js';
import { cycleAmountCents, pesosFromCents, planByCode, catalog } from './pricing.js';
import * as repo from './repository.js';
import { accessMode, graceUntil, platformWriteAccess, reduceBilling, signupGraceDaysLeft, signupGraceUntil, type SubscriptionSnap } from './state.js';
import { argentinaMonth } from './limits.js';

export type Notice = { dataId: string; requestId: string; signature: string; topic: string; now: number };

function publicBase(): string {
  const base = siteUrl();
  if (!base) throw new CareError(501, 'Falta la dirección pública del sitio.');
  return base;
}

function snap(row: repo.SubscriptionRow, lastPaymentAt: string | null): SubscriptionSnap {
  return {
    status: row.status,
    billing_cycle: row.billing_cycle,
    founder: row.founder,
    founder_until: row.founder_until,
    current_amount_cents: row.current_amount_cents,
    current_period_end: row.current_period_end,
    past_due_since: row.past_due_since,
    canceled_at: row.canceled_at,
    last_payment_at: lastPaymentAt,
  };
}

async function lastPaidAt(subscriptionId: string): Promise<string | null> {
  const payments = await repo.listPayments(subscriptionId);
  const dates = payments.map((item) => item.paid_at).filter((value): value is string => Boolean(value)).sort();
  return dates.length ? dates[dates.length - 1] : null;
}

export async function planForNutritionist(nutritionistId: string) {
  const open = await repo.findOpenSubscription(nutritionistId);
  const plan = open ? planByCode(open.plan_code) : null;
  const usage = await repo.usageOf(nutritionistId, argentinaMonth());
  const payments = open ? await repo.listPayments(open.id) : [];
  const now = Date.now();
  const createdAt = await repo.nutritionistCreatedAt(nutritionistId);
  const paidMode = accessMode(open, now);
  const mode = platformWriteAccess(open, createdAt, now);
  return {
    enabled: true,
    founder_seats_left: await repo.founderSeatsLeft(),
    plans: catalog(),
    subscription: open ? {
      id: open.id,
      plan_code: open.plan_code,
      plan_name: plan?.name ?? open.plan_code,
      billing_cycle: open.billing_cycle,
      status: open.status,
      founder: open.founder && (!open.founder_until || Date.parse(open.founder_until) > Date.now()),
      founder_until: open.founder_until,
      current_amount_cents: open.current_amount_cents,
      current_period_end: open.current_period_end,
      past_due_since: open.past_due_since,
      read_only: mode === 'read_only',
      grace_until: graceUntil(open),
      init_point: open.status === 'pending' || open.status === 'past_due' ? open.init_point : null,
      attention: open.status === 'past_due' ? 'El último cobro fue rechazado. Actualizá el medio de pago para que Mercado Pago pueda reintentar.' : null,
    } : null,
    signup_grace: paidMode === 'full' || (open && open.status !== 'pending') || createdAt == null ? null : {
      days_left: signupGraceDaysLeft(createdAt, now) ?? 0,
      until: signupGraceUntil(createdAt),
      read_only: mode === 'read_only',
    },
    usage,
    payments,
  };
}

export function disabledPlan() {
  return { enabled: false, founder_seats_left: null, plans: [], subscription: null, signup_grace: null, usage: null, payments: [] };
}

export async function checkout(input: { nutritionistId: string; userId: string; planCode: string; cycle: 'monthly' | 'annual'; clientRequestId: string }) {
  const plan = planByCode(input.planCode);
  if (!plan) throw new CareError(400, 'Elegí Arranque, Pro o Consultorio.');
  const email = await repo.payerEmail(input.userId);
  if (!email) throw new CareError(409, 'Tu cuenta no tiene un mail para el cobro.');
  const existing = await repo.findByClientRequest(input.nutritionistId, input.clientRequestId);
  if (existing?.init_point) return { init_point: existing.init_point, subscription_id: existing.id };
  const open = existing ?? await repo.findOpenSubscription(input.nutritionistId);
  if (open && open.client_request_id !== input.clientRequestId) throw new CareError(409, 'Ya tenés un plan en curso. Cancelalo antes de elegir otro.');
  let founder = open?.founder ?? false;
  let claimed = false;
  if (!open) {
    founder = await repo.claimFounder();
    claimed = founder;
  }
  const amount = cycleAmountCents(plan.monthly_amount_cents, input.cycle, founder);
  const row = open ?? await repo.insertSubscription({
    nutritionist_id: input.nutritionistId,
    plan_code: plan.code,
    billing_cycle: input.cycle,
    status: 'pending',
    provider: 'mercadopago',
    founder,
    current_amount_cents: amount,
    payer_email: email,
    client_request_id: input.clientRequestId,
    create_idempotency_key: input.clientRequestId,
  });
  const base = publicBase();
  const notification = base.startsWith('https://') ? `${base}/api/public/billing/mp/webhook` : null;
  try {
    const created = await platformMercadoPago.createPreapproval(
      preapprovalBody({ id: row.id, planName: plan.name, payerEmail: email, amountCents: amount, cycle: input.cycle, backUrl: `${base}/crm/ajustes`, notificationUrl: notification }),
      row.create_idempotency_key,
    );
    const initPoint = typeof created.init_point === 'string' ? created.init_point : '';
    if (!initPoint.startsWith('https://')) throw new MpCallError(503);
    const saved = await repo.casUpdate(row.id, row.revision, { provider_preapproval_id: String(created.id ?? ''), init_point: initPoint });
    if (!saved) throw new CareError(409, 'Alguien cambió este plan. Volvé a intentar.');
    repo.logBilling('checkout_ready');
    return { init_point: initPoint, subscription_id: row.id };
  } catch (error) {
    if (error instanceof CareError) throw error;
    if (error instanceof MpCallError && error.httpStatus === 501) throw new CareError(501, 'Falta la configuración de Mercado Pago de la plataforma.');
    if (error instanceof MpCallError && (error.httpStatus === 400 || error.httpStatus === 422)) {
      await repo.casUpdate(row.id, row.revision, { status: 'canceled', canceled_at: new Date().toISOString(), cancel_reason: 'mp_rejected' });
      if (claimed) await repo.releaseFounder();
      throw new CareError(409, 'Mercado Pago no aceptó el alta. Revisá el mail de tu cuenta.');
    }
    throw new CareError(503, 'Mercado Pago no confirmó el alta. Podés reintentar.');
  }
}

export async function changePlan(input: { nutritionistId: string; planCode: string; cycle: 'monthly' | 'annual' }) {
  const open = await repo.findOpenSubscription(input.nutritionistId);
  if (!open || (open.status !== 'authorized' && open.status !== 'past_due')) throw new CareError(409, 'Todavía no hay un plan activo para cambiar.');
  const plan = planByCode(input.planCode);
  if (!plan) throw new CareError(400, 'Elegí Arranque, Pro o Consultorio.');
  const usage = await repo.usageOf(input.nutritionistId, argentinaMonth());
  if (plan.max_active_patients != null && usage.active_patients > plan.max_active_patients) throw new CareError(409, 'Llegaste al límite de tu plan. El plan nuevo no alcanza para tus pacientes activas.');
  if (usage.nutritionists > plan.max_nutritionists) throw new CareError(409, 'Llegaste al límite de tu plan. El plan nuevo no alcanza para tu equipo.');
  if (plan.max_ai_meal_photos_month != null && usage.ai_photos > plan.max_ai_meal_photos_month) throw new CareError(409, 'Llegaste al límite de tu plan. Este mes ya usaste más fotos de las que permite el plan nuevo.');
  const founderActive = open.founder && (!open.founder_until || Date.parse(open.founder_until) > Date.now());
  const amount = cycleAmountCents(plan.monthly_amount_cents, input.cycle, founderActive);
  if (!open.provider_preapproval_id) throw new CareError(409, 'Este plan todavía no está confirmado en Mercado Pago.');
  const pesos = pesosFromCents(amount);
  try {
    await platformMercadoPago.updatePreapproval(open.provider_preapproval_id, {
      auto_recurring: { frequency: input.cycle === 'annual' ? 12 : 1, frequency_type: 'months', transaction_amount: pesos, currency_id: 'ARS' },
    });
  } catch (error) {
    if (error instanceof MpCallError && error.httpStatus === 501) throw new CareError(501, 'Falta la configuración de Mercado Pago de la plataforma.');
    if (error instanceof MpCallError && error.httpStatus >= 500) throw new CareError(503, 'Mercado Pago no confirmó el cambio. Podés reintentar.');
    throw new CareError(409, 'Mercado Pago no aceptó el cambio de plan.');
  }
  const saved = await repo.casUpdate(open.id, open.revision, { plan_code: plan.code, billing_cycle: input.cycle, current_amount_cents: amount });
  if (!saved) throw new CareError(409, 'Alguien cambió este plan. Volvé a intentar.');
  repo.logBilling('plan_changed');
  return planForNutritionist(input.nutritionistId);
}

export async function cancelPlan(input: { nutritionistId: string; reason: string }) {
  const open = await repo.findOpenSubscription(input.nutritionistId);
  if (!open) throw new CareError(404, 'No hay un plan para cancelar.');
  if (open.provider_preapproval_id) {
    try {
      await platformMercadoPago.updatePreapproval(open.provider_preapproval_id, { status: 'cancelled' });
    } catch (error) {
      if (error instanceof MpCallError && error.httpStatus === 501) throw new CareError(501, 'Falta la configuración de Mercado Pago de la plataforma.');
      if (error instanceof MpCallError && error.httpStatus >= 500) throw new CareError(503, 'Mercado Pago no confirmó la baja. Podés reintentar.');
      throw new CareError(409, 'Mercado Pago no aceptó la baja.');
    }
  }
  const saved = await repo.casUpdate(open.id, open.revision, {
    status: 'canceled',
    canceled_at: new Date().toISOString(),
    cancel_reason: input.reason.slice(0, 200),
  });
  if (!saved) throw new CareError(409, 'Alguien cambió este plan. Volvé a intentar.');
  repo.logBilling('canceled');
  return planForNutritionist(input.nutritionistId);
}

async function applyFact(row: repo.SubscriptionRow, fact: Awaited<ReturnType<typeof loadRemote>>, invoice: InvoiceIssuer) {
  if (!fact) return;
  if (fact.kind === 'payment' && fact.externalReference && fact.externalReference !== row.id) return;
  const reduced = reduceBilling(snap(row, await lastPaidAt(row.id)), fact, new Date().toISOString());
  if (reduced.payment && reduced.payment.amountCents > 0) {
    await repo.upsertPayment({
      subscription_id: row.id,
      provider: 'mercadopago',
      provider_payment_id: reduced.payment.id,
      amount_cents: reduced.payment.amountCents,
      currency: 'ARS',
      status: reduced.payment.status,
      status_detail: reduced.payment.statusDetail,
      paid_at: reduced.payment.paidAt,
      invoice_status: reduced.payment.status === 'approved' ? await invoice.onApproved({ paymentId: reduced.payment.id, amountCents: reduced.payment.amountCents }) : 'not_required',
      raw: minimalRaw({ id: reduced.payment.id, status: reduced.payment.status, status_detail: reduced.payment.statusDetail, transaction_amount: reduced.payment.amountCents / 100, date_approved: reduced.payment.paidAt, external_reference: row.id }),
    });
  }
  const patch = {
    status: reduced.sub.status,
    current_period_end: reduced.sub.current_period_end,
    past_due_since: reduced.sub.past_due_since,
    canceled_at: reduced.sub.canceled_at,
    founder_until: reduced.sub.founder_until,
  };
  const saved = await repo.casUpdate(row.id, row.revision, patch);
  if (!saved) throw new CareError(503, 'El plan cambió mientras llegaba el aviso. Mercado Pago puede reintentar.');
}

export async function receiveWebhook(notice: Notice, invoice: InvoiceIssuer = noopInvoiceIssuer): Promise<200 | 401 | 501 | 503> {
  const secret = process.env.MP_PLATFORM_WEBHOOK_SECRET?.trim();
  if (!secret) return 501;
  const valid = verifyMpSignature({ id: notice.dataId, requestId: notice.requestId, signature: notice.signature, secret, now: notice.now });
  if (!valid) return 401;
  if (await repo.findEvent(notice.requestId, notice.dataId, notice.topic)) return 200;
  let fact: Awaited<ReturnType<typeof loadRemote>>;
  try {
    fact = await loadRemote(notice.topic, notice.dataId);
  } catch (error) {
    if (error instanceof MpCallError && error.httpStatus === 501) return 501;
    return 503;
  }
  const reference = fact?.kind === 'payment' ? fact.externalReference : null;
  const row = reference ? await repo.findSubscription(reference) : await repo.findByPreapproval(notice.dataId);
  try {
    if (row && fact) await applyFact(row, fact, invoice);
  } catch {
    return 503;
  }
  await repo.saveEvent(notice.requestId, notice.dataId, notice.topic);
  repo.logBilling('webhook_done');
  return 200;
}

export async function raiseFounderPrices(now = Date.now()) {
  if (!billingEnabled()) return;
  const due = await repo.listFounderDue(new Date(now).toISOString());
  for (const row of due) {
    const plan = planByCode(row.plan_code);
    if (!plan || !row.provider_preapproval_id) continue;
    const list = cycleAmountCents(plan.monthly_amount_cents, row.billing_cycle, false);
    if (row.current_amount_cents === list) continue;
    const pesos = pesosFromCents(list);
    try {
      await platformMercadoPago.updatePreapproval(row.provider_preapproval_id, {
        auto_recurring: { frequency: row.billing_cycle === 'annual' ? 12 : 1, frequency_type: 'months', transaction_amount: pesos, currency_id: 'ARS' },
      });
      await repo.casUpdate(row.id, row.revision, { current_amount_cents: list });
      repo.logBilling('founder_price_raised');
    } catch (error) {
      if (error instanceof MpCallError) repo.logBilling('founder_price_retry');
    }
  }
}
