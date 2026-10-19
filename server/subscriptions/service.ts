import { randomUUID } from 'node:crypto';
import { CareError } from '../care/errors.js';
import { siteUrl } from '../admin/accounts.js';
import { notifyPatientPush } from '../push/push.js';
import { sendThreadMessage } from '../messages/repository.js';
import { disconnect } from '../scheduling/repository.js';
import { applyVerifiedPayment } from '../scheduling/payments.js';
import { moneyMinor } from '../scheduling/logic.js';
import { writeOpsLog } from '../ops/log.js';
import { subscriptionsAllowed } from './flag.js';
import { commandForPayment, settlePayment } from './ledger.js';
import {
  LINK_TTL_MS,
  PRICE_NOTICE_MS,
  argentinaDate,
  buildPreapprovalBody,
  isStaleProviderUpdate,
  ledgerNote,
  mapInstallment,
  maskEmail,
  preapprovalStatus,
  reconcileAction,
  subscriptionGuestToken,
  guestTokenMatches,
  nextRetryDelay,
  pesosFromCents,
} from './logic.js';
import { MpCallError, mercadoPago, nutriToken } from './mp.js';
import { acceptNotice, type NoticeInput } from './notice.js';
import * as repo from './repository.js';
import type { PatientSubscription, SubscriptionList, SubscriptionPlan, SubscriptionSummary } from '../../src/types/subscriptions.js';

type Sub = {
  id: string;
  nutritionist_id: string;
  plan_id: string;
  patient_id: string | null;
  provider_account_id: string;
  provider_preapproval_id: string | null;
  payer_email: string;
  contact_name: string | null;
  contact_phone: string | null;
  source: PatientSubscription['source'];
  status: string;
  payment_state: PatientSubscription['payment_state'];
  cancelled_by: PatientSubscription['cancelled_by'];
  amount_cents: number;
  pending_amount_cents: number | null;
  pending_amount_on: string | null;
  init_point: string | null;
  next_payment_date: string | null;
  last_payment_at: string | null;
  provider_last_modified: string | null;
  create_idempotency_key: string;
  revision: number;
  review_required: boolean;
  account_mismatch: boolean;
  manual_fee_paused: boolean;
  expires_at: string | null;
  created_at: string;
  plan?: { name?: string } | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const asSub = (row: unknown) => row as Sub;

function planName(sub: Sub): string {
  return sub.plan?.name || 'Seguimiento mensual';
}

function toPlan(row: Record<string, unknown>): SubscriptionPlan {
  return {
    id: String(row.id),
    name: String(row.name),
    description: row.description == null ? null : String(row.description),
    amount_cents: Number(row.amount_cents),
    currency: 'ARS',
    frequency: 1,
    frequency_type: 'months',
    public_visible: Boolean(row.public_visible),
    status: row.status === 'archived' ? 'archived' : 'active',
    revision: Number(row.revision),
  };
}

function toView(sub: Sub, includeLink: boolean): PatientSubscription {
  return {
    id: sub.id,
    plan_id: sub.plan_id,
    plan_name: planName(sub),
    patient_id: sub.patient_id,
    contact_name: sub.contact_name,
    payer_email_masked: maskEmail(sub.payer_email),
    source: sub.source,
    status: sub.status as PatientSubscription['status'],
    payment_state: sub.payment_state,
    cancelled_by: sub.cancelled_by,
    amount_cents: sub.amount_cents,
    pending_amount_cents: sub.pending_amount_cents,
    pending_amount_on: sub.pending_amount_on,
    next_payment_date: sub.next_payment_date,
    init_point: includeLink ? sub.init_point : null,
    revision: sub.revision,
    review_required: sub.review_required,
    account_mismatch: sub.account_mismatch,
    expires_at: sub.expires_at,
    created_at: sub.created_at,
  };
}

function summarize(rows: Sub[]): SubscriptionSummary {
  return {
    active: rows.filter(row => row.status === 'authorized' && row.payment_state !== 'rejected' && row.payment_state !== 'retrying').length,
    pending: rows.filter(row => row.status === 'pending').length,
    problems: rows.filter(row => row.payment_state === 'rejected' || row.payment_state === 'retrying' || row.review_required || row.account_mismatch).length,
    unlinked: rows.filter(row => !row.patient_id && !['cancelled', 'expired', 'failed'].includes(row.status)).length,
  };
}

function backUrl(origin: string, slug: string | null, id: string) {
  return slug ? `${origin}/consultorio/${slug}/suscripcion/${id}` : `${origin}/app/pagos`;
}

async function owned(nutritionistId: string, id: string) {
  const sub = asSub(await repo.getSubscription(id));
  if (!sub || sub.nutritionist_id !== nutritionistId) throw new CareError(404, 'No encontramos ese débito.');
  return sub;
}

export async function listPlans(nutritionistId: string) {
  return (await repo.listPlans(nutritionistId)).map(row => toPlan(row as Record<string, unknown>));
}

export async function createPlan(nutritionistId: string, input: { name: string; description: string | null; amount_cents: number; public_visible: boolean }) {
  if (input.public_visible && !await repo.connectionAccount(nutritionistId)) {
    throw new CareError(409, 'Conectá Mercado Pago para mostrarlo en tu página.');
  }
  const pesos = pesosFromCents(input.amount_cents);
  if (!Number.isInteger(pesos)) throw new CareError(400, 'El precio tiene que ser un monto en pesos, sin centavos.');
  const programId = await repo.insertProgram(nutritionistId, input.name, pesos);
  try {
    return toPlan(await repo.insertPlan({
      nutritionist_id: nutritionistId,
      program_id: programId,
      name: input.name,
      description: input.description,
      amount_cents: input.amount_cents,
      public_visible: input.public_visible,
    }) as Record<string, unknown>);
  } catch (error) {
    await repo.deleteProgram(programId).catch(() => undefined);
    throw error;
  }
}

export async function updatePlan(nutritionistId: string, id: string, input: { expected_revision: number; name?: string; description?: string | null; amount_cents?: number; public_visible?: boolean; apply_to_active?: boolean }) {
  const current = await repo.getPlan(id, nutritionistId);
  if (!current) throw new CareError(404, 'No encontramos ese plan.');
  const visible = input.public_visible ?? Boolean(current.public_visible);
  if (visible && !await repo.connectionAccount(nutritionistId)) throw new CareError(409, 'Conectá Mercado Pago para mostrarlo en tu página.');
  const amount = input.amount_cents ?? Number(current.amount_cents);
  if (!Number.isInteger(pesosFromCents(amount))) throw new CareError(400, 'El precio tiene que ser un monto en pesos, sin centavos.');
  const saved = await repo.updatePlan(id, nutritionistId, input.expected_revision, {
    name: input.name ?? current.name,
    description: input.description === undefined ? current.description : input.description,
    amount_cents: amount,
    public_visible: visible,
  });
  if (current.program_id) {
    const program = await repo.updateProgram(String(current.program_id), nutritionistId, String(saved.name), pesosFromCents(amount));
    if (!program) writeOpsLog('warn', 'subscription_program_unchanged', { plan: id.slice(0, 8) });
  }
  if (input.apply_to_active && amount !== Number(current.amount_cents)) {
    const when = new Date(Date.now() + PRICE_NOTICE_MS).toISOString();
    for (const row of await repo.authorizedForPlan(id)) {
      await repo.patchSubscription(row.id, { pending_amount_cents: amount, pending_amount_on: when });
      if (row.patient_id) notifyPatientPush(row.patient_id, 'subscription');
    }
  }
  return toPlan(saved as Record<string, unknown>);
}

export async function archivePlan(nutritionistId: string, id: string, expected: number) {
  const current = await repo.getPlan(id, nutritionistId);
  if (!current) throw new CareError(404, 'No encontramos ese plan.');
  return toPlan(await repo.updatePlan(id, nutritionistId, expected, { status: 'archived', public_visible: false }) as Record<string, unknown>);
}

export async function listForNutritionist(nutritionistId: string, status: string | undefined, includeLink: boolean): Promise<SubscriptionList> {
  const rows = (await repo.listSubscriptions(nutritionistId, status)).map(asSub);
  return { subscriptions: rows.map(row => toView(row, includeLink)), summary: summarize(rows) };
}

export async function createSubscription(nutritionistId: string, input: {
  plan_id: string;
  patient_id: string | null;
  payer_email: string;
  source: Sub['source'];
  client_request_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
}) {
  if (!subscriptionsAllowed(nutritionistId)) throw new CareError(404, 'No encontrado.');
  const plan = await repo.getPlan(input.plan_id, nutritionistId);
  if (!plan || plan.status !== 'active') throw new CareError(404, 'No encontramos ese plan.');
  const account = await repo.connectionAccount(nutritionistId);
  if (!account) throw new CareError(501, 'Conectá Mercado Pago para cobrar con débito automático.');
  if (input.patient_id) {
    const patient = await repo.patientOwned(nutritionistId, input.patient_id);
    if (!patient) throw new CareError(403, 'Esa paciente no es de este consultorio.');
    if (await repo.findLive(input.plan_id, input.patient_id)) throw new CareError(409, 'Esa paciente ya tiene un débito abierto para este plan.');
  }
  if (input.client_request_id) {
    const previous = asSub(await repo.findByClientRequest(nutritionistId, input.client_request_id));
    if (previous) {
      if (previous.plan_id !== input.plan_id || previous.payer_email !== input.payer_email) throw new CareError(409, 'Ese reintento cambió los datos.');
      return { id: previous.id, status: previous.status, init_point: previous.init_point };
    }
  }
  const origin = siteUrl();
  if (!origin) throw new CareError(501, 'Falta la dirección pública del sitio.');
  const card = await repo.nutritionistCard(nutritionistId);
  if (!card) throw new CareError(403, 'No encontramos el consultorio.');
  const id = randomUUID();
  const created = asSub(await repo.insertSubscription({
    id,
    nutritionist_id: nutritionistId,
    plan_id: input.plan_id,
    patient_id: input.patient_id,
    provider_account_id: account,
    payer_email: input.payer_email,
    contact_name: input.contact_name,
    contact_phone: input.contact_phone,
    source: input.source,
    status: 'creating',
    amount_cents: plan.amount_cents,
    client_request_id: input.client_request_id,
    expires_at: new Date(Date.now() + LINK_TTL_MS).toISOString(),
  }));
  const slug = await repo.publicSlug(nutritionistId);
  const body = buildPreapprovalBody({
    id,
    planName: String(plan.name),
    nutritionistName: card.display_name || 'tu nutricionista',
    payerEmail: input.payer_email,
    amountCents: Number(plan.amount_cents),
    backUrl: backUrl(origin, slug, id),
  });
  try {
    const { token } = await nutriToken(nutritionistId);
    const remote = await mercadoPago.createPreapproval(token, created.create_idempotency_key, body);
    if (!preapprovalStatus(remote.status) && typeof remote.init_point === 'string') remote.status = 'pending';
    const saved = await applyPreapproval(created, remote);
    return { id, status: saved?.status ?? 'pending', init_point: saved?.init_point ?? null };
  } catch (error) {
    const rejected = error instanceof MpCallError && (error.httpStatus === 400 || error.httpStatus === 422);
    await repo.patchSubscription(id, { status: rejected ? 'failed' : 'uncertain', review_required: true });
    if (!rejected) throw new CareError(503, 'No se pudo confirmar el link. Quedó para conciliar y no se crea otro.');
    throw new CareError(503, 'Mercado Pago no aceptó el débito. Revisá la conexión.');
  }
}

async function applyPreapproval(sub: Sub, remote: Record<string, unknown>) {
  const modified = typeof remote.last_modified === 'string' ? remote.last_modified : null;
  if (isStaleProviderUpdate(modified, sub.provider_last_modified)) return sub;
  const status = preapprovalStatus(remote.status);
  if (!status) return sub;
  const recurring = remote.auto_recurring as { transaction_amount?: unknown } | undefined;
  const amount = recurring ? moneyMinor(recurring.transaction_amount) : null;
  const becameAuthorized = sub.status !== 'authorized' && status === 'authorized';
  const becameCancelled = sub.status !== 'cancelled' && status === 'cancelled';
  const initPoint = typeof remote.init_point === 'string' && remote.init_point.startsWith('https://') ? remote.init_point : sub.init_point;
  const patch: Record<string, unknown> = {
    status,
    provider_preapproval_id: remote.id == null ? sub.provider_preapproval_id : String(remote.id),
    provider_last_modified: modified,
    next_payment_date: typeof remote.next_payment_date === 'string' ? remote.next_payment_date : sub.next_payment_date,
    init_point: initPoint,
    review_required: false,
  };
  if (amount && amount > 0) patch.amount_cents = amount;
  if (status === 'cancelled' && !sub.cancelled_by) patch.cancelled_by = 'mercado_pago';
  if (becameAuthorized && sub.patient_id && !sub.manual_fee_paused) {
    await repo.pauseManualFee(sub.patient_id);
    patch.manual_fee_paused = true;
  }
  const saved = asSub(await repo.patchSubscription(sub.id, patch));
  if (saved?.patient_id && (becameAuthorized || becameCancelled)) notifyPatientPush(saved.patient_id, 'subscription');
  return saved ?? sub;
}

async function book(sub: Sub, payment: Record<string, unknown>) {
  if (payment.id == null) return;
  const note = ledgerNote(planName(sub), new Date(typeof payment.date_approved === 'string' ? payment.date_approved : Date.now()));
  const command = commandForPayment(payment, note);
  const installment = await repo.upsertInstallment({
    subscription_id: sub.id,
    nutritionist_id: sub.nutritionist_id,
    provider_payment_id: payment.id == null ? null : String(payment.id),
    amount_cents: command.kind === 'confirm' ? command.amountCents : sub.amount_cents,
    status: 'processed',
    payment_status: typeof payment.status === 'string' ? payment.status : null,
    paid_at: typeof payment.date_approved === 'string' ? payment.date_approved : null,
  });
  if (!sub.patient_id || command.kind === 'none') return;
  if (command.kind === 'confirm' && Math.round(command.amountCents / 100) < 1) return;
  const card = await repo.nutritionistCard(sub.nutritionist_id);
  if (!card) return;
  const result = await settlePayment({
    find: repo.findLedger,
    confirm: async (cmd) => (await repo.insertLedger({
      patient_id: sub.patient_id,
      nutritionist_id: sub.nutritionist_id,
      amount: Math.round(cmd.amountCents / 100),
      paid_on: argentinaDate(cmd.paidAt),
      method: 'mercado_pago',
      note: cmd.note,
      status: 'confirmed',
      created_by: card.user_id,
      reviewed_at: new Date().toISOString(),
      source: 'subscription',
      provider: 'mercado_pago',
      provider_payment_id: cmd.providerPaymentId,
    })).id,
    void: repo.voidLedger,
  }, command);
  if ((result === 'created' || result === 'duplicate') && command.kind === 'confirm') {
    const ledger = await repo.findLedger(command.providerPaymentId);
    if (ledger && !installment.ledger_payment_id) await repo.setInstallmentLedger(installment.id, ledger.id);
  }
  if (result === 'created' && payment.status === 'approved') {
    await repo.patchSubscription(sub.id, { payment_state: 'ok', last_payment_at: new Date().toISOString() });
  }
}

async function applyQuota(sub: Sub, quota: Record<string, unknown>) {
  const payment = quota.payment as Record<string, unknown> | undefined;
  const paymentStatus = typeof payment?.status === 'string' ? payment.status : null;
  const state = mapInstallment(String(quota.status ?? ''), paymentStatus);
  const previous = sub.payment_state;
  await repo.upsertInstallment({
    subscription_id: sub.id,
    nutritionist_id: sub.nutritionist_id,
    provider_authorized_payment_id: quota.id == null ? null : String(quota.id),
    provider_payment_id: payment?.id == null ? null : String(payment.id),
    amount_cents: moneyMinor(quota.transaction_amount) ?? sub.amount_cents,
    status: String(quota.status ?? 'scheduled'),
    payment_status: paymentStatus,
    retry_attempt: Number.isInteger(quota.retry_attempt) ? quota.retry_attempt : null,
    paid_at: typeof payment?.date_approved === 'string' ? payment.date_approved : null,
  });
  if (state && state !== previous) {
    await repo.patchSubscription(sub.id, { payment_state: state });
    if (state === 'rejected' && previous !== 'rejected' && sub.patient_id) notifyPatientPush(sub.patient_id, 'subscription');
  }
  if (payment?.id != null) await book({ ...sub, payment_state: state ?? sub.payment_state }, payment);
}

export async function changeSubscription(nutritionistId: string, id: string, action: 'pause' | 'resume' | 'cancel', expected: number, by: 'nutritionist' | 'patient') {
  const sub = await owned(nutritionistId, id);
  if (sub.revision !== expected) throw new CareError(409, 'Alguien cambió esto, recargá.');
  if (action === 'pause' && sub.status !== 'authorized') throw new CareError(409, 'Solo se puede pausar un débito activo.');
  if (action === 'resume' && sub.status !== 'paused') throw new CareError(409, 'Solo se puede reanudar un débito en pausa.');
  if (action === 'cancel' && !['pending', 'authorized', 'paused'].includes(sub.status)) throw new CareError(409, 'Ese débito ya no está activo.');
  const account = await repo.connectionAccount(nutritionistId);
  if (!account || account !== sub.provider_account_id) {
    await repo.patchSubscription(sub.id, { account_mismatch: true, review_required: true });
    throw new CareError(409, 'Se creó con otra cuenta de Mercado Pago.');
  }
  const mpStatus = action === 'pause' ? 'paused' : action === 'resume' ? 'authorized' : 'cancelled';
  if (sub.provider_preapproval_id) {
    try {
      const { token } = await nutriToken(nutritionistId);
      await mercadoPago.updatePreapproval(token, sub.provider_preapproval_id, { status: mpStatus });
    } catch {
      await repo.patchSubscription(sub.id, { review_required: true });
      throw new CareError(503, 'No se pudo confirmar el cambio. Usá Conciliar.');
    }
  }
  const saved = asSub(await repo.updateSubscription(sub.id, expected, {
    status: mpStatus,
    cancelled_by: mpStatus === 'cancelled' ? by : sub.cancelled_by,
    review_required: false,
  }));
  if (mpStatus === 'cancelled' && saved.patient_id) notifyPatientPush(saved.patient_id, 'subscription');
  return toView(saved, true);
}

export async function linkPatient(nutritionistId: string, id: string, patientId: string, expected: number) {
  const sub = await owned(nutritionistId, id);
  if (sub.patient_id) throw new CareError(409, 'Ese débito ya tiene ficha.');
  const patient = await repo.patientOwned(nutritionistId, patientId);
  if (!patient) throw new CareError(403, 'Esa paciente no es de este consultorio.');
  if (await repo.findLive(sub.plan_id, patientId)) throw new CareError(409, 'Esa paciente ya tiene un débito abierto para este plan.');
  const saved = asSub(await repo.updateSubscription(id, expected, { patient_id: patientId, contact_name: patient.full_name }));
  if (['authorized', 'paused'].includes(saved.status)) {
    await repo.pauseManualFee(patientId);
    await repo.patchSubscription(id, { manual_fee_paused: true });
  }
  for (const payment of await repo.unbookedApproved(id)) {
    if (payment.provider_payment_id) await book(saved, { id: payment.provider_payment_id, status: 'approved', transaction_amount: Number(payment.amount_cents) / 100, date_approved: payment.paid_at });
  }
  return toView({ ...saved, patient_id: patientId, contact_name: patient.full_name }, true);
}

export async function sendChat(nutritionistId: string, id: string, expected: number) {
  const sub = await owned(nutritionistId, id);
  if (sub.revision !== expected) throw new CareError(409, 'Alguien cambió esto, recargá.');
  if (!sub.patient_id || !sub.init_point) throw new CareError(409, 'Todavía no hay un link para enviar.');
  const pesos = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(sub.amount_cents / 100);
  const text = `Te dejo el link para activar el débito automático de tu ${planName(sub)} ($${pesos} por mes): ${sub.init_point}. Usá el correo ${sub.payer_email}.`;
  await sendThreadMessage(sub.patient_id, { text, from: 'vero', suggestedByAi: false, client_id: randomUUID() }, true);
  notifyPatientPush(sub.patient_id, 'message');
  return { sent: true };
}

export async function reconcileNutritionist(nutritionistId: string, id?: string) {
  const rows = id ? [await owned(nutritionistId, id)] : (await repo.listSubscriptions(nutritionistId)).map(asSub).filter(row => !['cancelled', 'expired', 'failed'].includes(row.status));
  const actions = [];
  for (const row of rows) actions.push(await reconcileOne(row));
  return { checked: rows.length, actions };
}

export async function reconcileOne(sub: Sub) {
  if (!subscriptionsAllowed(sub.nutritionist_id)) return 'none';
  const account = await repo.connectionAccount(sub.nutritionist_id);
  const action = reconcileAction({
    status: sub.status,
    createdAt: sub.created_at,
    expiresAt: sub.expires_at,
    nextPaymentDate: sub.next_payment_date,
    providerAccountId: sub.provider_account_id,
    connectedAccountId: account,
    pendingAmountOn: sub.pending_amount_on,
  }, Date.now());
  if (action.type === 'skip_other_account') {
    await repo.patchSubscription(sub.id, { account_mismatch: true, review_required: true });
    return action.type;
  }
  if (action.type === 'search_external_reference') await searchCreated(sub);
  if (action.type === 'expire_link') await expireLink(sub);
  if (action.type === 'apply_pending_price') await applyPendingPrice(sub);
  if (action.type === 'read_installments') await readInstallments(sub);
  return action.type;
}

async function searchCreated(sub: Sub) {
  const { token } = await nutriToken(sub.nutritionist_id);
  const found = await mercadoPago.searchPreapproval(token, sub.id);
  const matches = found.filter(item => item.external_reference === sub.id);
  if (matches.length > 1) {
    await repo.patchSubscription(sub.id, { status: 'uncertain', review_required: true });
    return;
  }
  if (matches.length === 1) {
    await applyPreapproval(sub, matches[0]);
    return;
  }
  const plan = await repo.getPlan(sub.plan_id, sub.nutritionist_id);
  const card = await repo.nutritionistCard(sub.nutritionist_id);
  const origin = siteUrl();
  if (!plan || !card || !origin) {
    await repo.patchSubscription(sub.id, { status: 'uncertain', review_required: true });
    return;
  }
  const slug = await repo.publicSlug(sub.nutritionist_id);
  try {
    const created = await mercadoPago.createPreapproval(token, sub.create_idempotency_key, buildPreapprovalBody({
      id: sub.id,
      planName: String(plan.name),
      nutritionistName: card.display_name || 'tu nutricionista',
      payerEmail: sub.payer_email,
      amountCents: sub.amount_cents,
      backUrl: backUrl(origin, slug, sub.id),
    }));
    await applyPreapproval(sub, created);
  } catch (error) {
    const rejected = error instanceof MpCallError && (error.httpStatus === 400 || error.httpStatus === 422);
    await repo.patchSubscription(sub.id, { status: rejected ? 'failed' : 'uncertain', review_required: true });
  }
}

async function expireLink(sub: Sub) {
  if (sub.provider_preapproval_id) {
    const { token } = await nutriToken(sub.nutritionist_id);
    await mercadoPago.updatePreapproval(token, sub.provider_preapproval_id, { status: 'cancelled' });
  }
  await repo.patchSubscription(sub.id, { status: 'expired', cancelled_by: 'system', review_required: false });
}

async function applyPendingPrice(sub: Sub) {
  if (!sub.pending_amount_cents || !sub.provider_preapproval_id) return;
  const { token } = await nutriToken(sub.nutritionist_id);
  await mercadoPago.updatePreapproval(token, sub.provider_preapproval_id, {
    auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: sub.pending_amount_cents / 100, currency_id: 'ARS' },
  });
  await repo.patchSubscription(sub.id, { amount_cents: sub.pending_amount_cents, pending_amount_cents: null, pending_amount_on: null });
}

async function readInstallments(sub: Sub) {
  if (!sub.provider_preapproval_id) return;
  const { token } = await nutriToken(sub.nutritionist_id);
  const quotas = await mercadoPago.searchAuthorizedPayments(token, sub.provider_preapproval_id);
  if (quotas === null) {
    for (const payment of await mercadoPago.searchPayments(token, sub.id)) await book(sub, payment);
    return;
  }
  for (const quota of quotas) await applyQuota(sub, quota);
}

export async function visiblePlans(slug: string) {
  const nutritionistId = await repo.nutritionistBySlug(slug);
  if (!nutritionistId || !subscriptionsAllowed(nutritionistId)) throw new CareError(404, 'Esta página no está disponible.');
  return repo.visiblePlans(nutritionistId);
}

export async function createPublicSubscription(slug: string, input: { plan_id: string; payer_email: string; name: string; phone: string; client_request_id: string }) {
  const nutritionistId = await repo.nutritionistBySlug(slug);
  if (!nutritionistId) throw new CareError(404, 'Esta página no está disponible.');
  const created = await createSubscription(nutritionistId, {
    plan_id: input.plan_id,
    patient_id: null,
    payer_email: input.payer_email,
    source: 'public_page',
    client_request_id: input.client_request_id,
    contact_name: input.name,
    contact_phone: input.phone,
  });
  const secret = process.env.SCHEDULING_BOOKING_SECRET;
  if (!secret || secret.length < 32) throw new CareError(501, 'La página pública necesita completar su configuración segura.');
  return { ...created, guest_token: subscriptionGuestToken(nutritionistId, created.id, secret) };
}

export async function publicStatus(slug: string, id: string, token: string) {
  const nutritionistId = await repo.nutritionistBySlug(slug);
  if (!nutritionistId) throw new CareError(404, 'Esta página no está disponible.');
  const secret = process.env.SCHEDULING_BOOKING_SECRET ?? '';
  const sub = asSub(await repo.getSubscription(id));
  if (!sub || sub.nutritionist_id !== nutritionistId || !guestTokenMatches(subscriptionGuestToken(nutritionistId, id, secret), token)) {
    throw new CareError(403, 'No se pudo verificar el acceso.');
  }
  const message = sub.status === 'authorized'
    ? 'Tu débito automático quedó activo.'
    : sub.status === 'cancelled' || sub.status === 'expired' || sub.status === 'failed'
      ? 'Mercado Pago no confirmó el pago. Podés intentar de nuevo.'
      : 'Estamos esperando la confirmación de Mercado Pago.';
  return { id: sub.id, status: sub.status, message };
}

export async function patientSubscriptions() {
  return repo.patientSelf();
}

export async function cancelForPatient(patientId: string, id: string, expected: number) {
  const sub = asSub(await repo.getSubscription(id));
  if (!sub || sub.patient_id !== patientId || !subscriptionsAllowed(sub.nutritionist_id)) throw new CareError(404, 'No encontramos ese débito.');
  return changeSubscription(sub.nutritionist_id, id, 'cancel', expected, 'patient');
}

export async function receiveWebhook(input: NoticeInput) {
  return acceptNotice(input, async (notice) => repo.saveNotice({
    provider_notification_id: notice.notificationId,
    request_id: notice.requestId,
    topic: notice.topic || 'unknown',
    action: notice.action,
    provider_user_id: notice.userId,
    resource_id: notice.dataId,
    live_mode: notice.liveMode,
    signature_valid: notice.signatureValid,
    status: notice.status,
  }));
}

export async function processQueued(limit = 10) {
  const events = await repo.claimNotices(limit);
  for (const event of events) {
    try {
      await processOne(event);
    } catch (error) {
      await failEvent(event, error);
    }
  }
  return events.length;
}

async function processOne(event: Record<string, unknown>) {
  const topic = String(event.topic ?? '');
  const userId = event.provider_user_id == null ? '' : String(event.provider_user_id);
  const resourceId = event.resource_id == null ? '' : String(event.resource_id);
  if (topic === 'mp-connect' && event.action === 'application.deauthorized') {
    const candidates = await repo.integrationsByAccount(userId);
    for (const candidate of candidates) await disconnect(candidate.nutritionist_id, 'mercadopago', true);
    await repo.finishNotice(String(event.id), { status: candidates.length ? 'processed' : 'unroutable', processed_at: new Date().toISOString() });
    return;
  }
  const candidates = await repo.integrationsByAccount(userId);
  for (const candidate of candidates) {
    const handled = await handleCandidate(
      candidate.nutritionist_id,
      candidate.account_id,
      topic,
      resourceId,
      subscriptionsAllowed(candidate.nutritionist_id),
    );
    if (!handled) continue;
    await repo.finishNotice(String(event.id), { status: 'processed', processed_at: new Date().toISOString(), subscription_id: handled === true ? null : handled });
    return;
  }
  await repo.finishNotice(String(event.id), {
    status: candidates.length ? 'ignored' : 'unroutable',
    processed_at: new Date().toISOString(),
  });
}

async function handleCandidate(nutritionistId: string, accountId: string, topic: string, resourceId: string, allowSubscriptions: boolean): Promise<string | true | null> {
  if ((topic === 'subscription_preapproval' || topic === 'subscription_authorized_payment') && !allowSubscriptions) return null;
  const { token } = await nutriToken(nutritionistId);
  if (topic === 'subscription_preapproval') {
    const remote = await readOrNull(() => mercadoPago.getPreapproval(token, resourceId));
    if (!remote) return null;
    const sub = await locate(nutritionistId, accountId, remote);
    if (!sub) return null;
    await applyPreapproval(sub, remote);
    return sub.id;
  }
  if (topic === 'subscription_authorized_payment') {
    const quota = await readOrNull(() => mercadoPago.getAuthorizedPayment(token, resourceId));
    if (!quota) return null;
    const sub = await repo.findSubscriptionByProvider(accountId, String(quota.preapproval_id ?? ''));
    if (!sub || asSub(sub).nutritionist_id !== nutritionistId) return null;
    await applyQuota(asSub(sub), quota);
    return asSub(sub).id;
  }
  if (topic === 'payment') {
    const payment = await readOrNull(() => mercadoPago.getPayment(token, resourceId));
    if (!payment || (payment.collector_id != null && String(payment.collector_id) !== accountId)) return null;
    const reference = typeof payment.external_reference === 'string' ? payment.external_reference : '';
    if (allowSubscriptions && UUID.test(reference)) {
      const sub = asSub(await repo.findSubscriptionById(reference, nutritionistId));
      if (sub) {
        await book(sub, payment);
        return sub.id;
      }
    }
    if (UUID.test(reference) && await repo.checkoutIntent(nutritionistId, reference)) {
      await applyVerifiedPayment(nutritionistId, resourceId);
      return true;
    }
    return null;
  }
  return null;
}

async function readOrNull(load: () => Promise<Record<string, unknown>>) {
  try {
    return await load();
  } catch (error) {
    if (error instanceof MpCallError && error.httpStatus === 404) return null;
    throw error;
  }
}

async function locate(nutritionistId: string, accountId: string, remote: Record<string, unknown>) {
  const providerId = remote.id == null ? '' : String(remote.id);
  const byProvider = providerId ? asSub(await repo.findSubscriptionByProvider(accountId, providerId)) : null;
  if (byProvider?.nutritionist_id === nutritionistId) return byProvider;
  const reference = typeof remote.external_reference === 'string' ? remote.external_reference : '';
  if (!UUID.test(reference)) return null;
  const byId = asSub(await repo.findSubscriptionById(reference, nutritionistId));
  return byId?.nutritionist_id === nutritionistId ? byId : null;
}

async function failEvent(event: Record<string, unknown>, error: unknown) {
  const attempts = Number(event.attempts ?? 1);
  const reconnect = error instanceof MpCallError && (error.httpStatus === 401 || error.httpStatus === 403);
  const delay = reconnect ? null : nextRetryDelay(attempts);
  writeOpsLog('warn', 'subscription_event_failed', { attempts, status: reconnect ? 'reconnect' : 'retry' });
  await repo.finishNotice(String(event.id), delay == null
    ? { status: 'failed', last_error: reconnect ? 'reconnect' : 'retry', processed_at: new Date().toISOString() }
    : { status: 'queued', last_error: 'retry', next_attempt_at: new Date(Date.now() + delay).toISOString() });
}

export async function reconcileLive() {
  let after: string | null = null;
  let checked = 0;
  for (;;) {
    const page: Sub[] = (await repo.livePage(after)).map(asSub);
    for (const sub of page) {
      try {
        await reconcileOne(sub);
      } catch (error) {
        writeOpsLog('warn', 'subscription_reconcile_failed', { status: error instanceof MpCallError ? error.httpStatus : 'retry' });
      }
      checked += 1;
    }
    if (page.length < 50) break;
    after = page[page.length - 1]?.id ?? null;
  }
  return checked;
}

