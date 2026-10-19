import { CareError } from '../care/errors.js';
import { getRequestDb, privilegedDb } from '../db/supabase-client.js';

type DbError = { code?: string; message?: string } | null;

export function raiseDb(error: DbError): void {
  if (!error) return;
  if (['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '')) {
    throw new CareError(501, 'Falta aplicar la migración de suscripciones.');
  }
  throw new CareError(503, 'No se pudo guardar. Reintentá.');
}

function db() {
  return privilegedDb();
}

export async function nutritionistCard(nutritionistId: string) {
  const row = await db().from('nutritionists').select('id,user_id,display_name').eq('id', nutritionistId).maybeSingle();
  raiseDb(row.error);
  return row.data as { id: string; user_id: string; display_name: string } | null;
}

export async function connectionAccount(nutritionistId: string) {
  const row = await db().from('scheduling_integrations').select('account_id').eq('nutritionist_id', nutritionistId).eq('provider', 'mercadopago').maybeSingle();
  raiseDb(row.error);
  return row.data ? String(row.data.account_id) : null;
}

export async function integrationsByAccount(accountId: string) {
  const row = await db().from('scheduling_integrations').select('nutritionist_id,account_id').eq('provider', 'mercadopago').eq('account_id', accountId);
  raiseDb(row.error);
  return (row.data ?? []) as Array<{ nutritionist_id: string; account_id: string }>;
}

export async function publicSlug(nutritionistId: string) {
  const row = await db().from('scheduling_profiles').select('slug,config').eq('nutritionist_id', nutritionistId).maybeSingle();
  raiseDb(row.error);
  const config = row.data?.config as { page?: { enabled?: boolean } } | undefined;
  if (!row.data?.slug || config?.page?.enabled === false) return null;
  return String(row.data.slug);
}

export async function nutritionistBySlug(slug: string) {
  const row = await db().from('scheduling_profiles').select('nutritionist_id,slug,config').eq('slug', slug).maybeSingle();
  raiseDb(row.error);
  const config = row.data?.config as { page?: { enabled?: boolean } } | undefined;
  if (!row.data || config?.page?.enabled === false) return null;
  return String(row.data.nutritionist_id);
}

export async function patientOwned(nutritionistId: string, patientId: string) {
  const row = await db().from('patients').select('id,nutritionist_id,full_name,anonymized_at').eq('id', patientId).maybeSingle();
  raiseDb(row.error);
  const patient = row.data as { id: string; nutritionist_id: string; full_name: string; anonymized_at: string | null } | null;
  if (!patient || patient.nutritionist_id !== nutritionistId || patient.anonymized_at) return null;
  return patient;
}

export async function listPlans(nutritionistId: string) {
  const row = await db().from('patient_subscription_plans').select('*').eq('nutritionist_id', nutritionistId).order('created_at');
  raiseDb(row.error);
  return row.data ?? [];
}

export async function visiblePlans(nutritionistId: string) {
  const row = await db().from('patient_subscription_plans').select('id,name,description,amount_cents,currency,public_visible,status,revision').eq('nutritionist_id', nutritionistId).eq('status', 'active').eq('public_visible', true);
  raiseDb(row.error);
  return row.data ?? [];
}

export async function getPlan(id: string, nutritionistId: string) {
  const row = await db().from('patient_subscription_plans').select('*').eq('id', id).eq('nutritionist_id', nutritionistId).maybeSingle();
  raiseDb(row.error);
  return row.data;
}

export async function insertProgram(nutritionistId: string, name: string, pesos: number) {
  const row = await db().from('nutritionist_programs').insert({ nutritionist_id: nutritionistId, name, amount: pesos }).select('id').single();
  if (row.error?.code === '23505') throw new CareError(409, 'Ya tenés un programa con ese nombre.');
  raiseDb(row.error);
  return String(row.data.id);
}

export async function deleteProgram(id: string) {
  const row = await db().from('nutritionist_programs').delete().eq('id', id);
  raiseDb(row.error);
}

export async function updateProgram(id: string, nutritionistId: string, name: string, pesos: number) {
  const row = await db().from('nutritionist_programs').update({ name, amount: pesos }).eq('id', id).eq('nutritionist_id', nutritionistId).select('id').maybeSingle();
  if (row.error?.code === '23505') throw new CareError(409, 'Ya tenés un programa con ese nombre.');
  raiseDb(row.error);
  return row.data as { id: string } | null;
}

export async function patientSelf() {
  const row = await getRequestDb().rpc('get_my_subscriptions');
  raiseDb(row.error);
  return row.data ?? [];
}

export async function insertPlan(values: Record<string, unknown>) {
  const row = await db().from('patient_subscription_plans').insert(values).select('*').single();
  raiseDb(row.error);
  return row.data;
}

export async function updatePlan(id: string, nutritionistId: string, expected: number, patch: Record<string, unknown>) {
  const row = await db().from('patient_subscription_plans').update({ ...patch, revision: expected + 1, updated_at: new Date().toISOString() }).eq('id', id).eq('nutritionist_id', nutritionistId).eq('revision', expected).select('*').maybeSingle();
  raiseDb(row.error);
  if (!row.data) throw new CareError(409, 'Alguien cambió esto, recargá.');
  return row.data;
}

export async function listSubscriptions(nutritionistId: string, status?: string) {
  let query = db().from('patient_subscriptions').select('*, plan:patient_subscription_plans(name)').eq('nutritionist_id', nutritionistId).order('created_at', { ascending: false }).limit(200);
  if (status) query = query.eq('status', status);
  const row = await query;
  raiseDb(row.error);
  return row.data ?? [];
}

export async function getSubscription(id: string) {
  const row = await db().from('patient_subscriptions').select('*, plan:patient_subscription_plans(name)').eq('id', id).maybeSingle();
  raiseDb(row.error);
  return row.data;
}

export async function findByClientRequest(nutritionistId: string, clientRequestId: string) {
  const row = await db().from('patient_subscriptions').select('*').eq('nutritionist_id', nutritionistId).eq('client_request_id', clientRequestId).maybeSingle();
  raiseDb(row.error);
  return row.data;
}

export async function findLive(planId: string, patientId: string) {
  const row = await db().from('patient_subscriptions').select('id,status').eq('plan_id', planId).eq('patient_id', patientId).in('status', ['creating', 'uncertain', 'pending', 'authorized', 'paused']).maybeSingle();
  raiseDb(row.error);
  return row.data as { id: string; status: string } | null;
}

export async function insertSubscription(values: Record<string, unknown>) {
  const row = await db().from('patient_subscriptions').insert(values).select('*').single();
  if (row.error?.code === '23505') throw new CareError(409, 'Esa paciente ya tiene un débito abierto para este plan.');
  raiseDb(row.error);
  return row.data;
}

export async function updateSubscription(id: string, expected: number, patch: Record<string, unknown>) {
  const row = await db().from('patient_subscriptions').update({ ...patch, revision: expected + 1, updated_at: new Date().toISOString() }).eq('id', id).eq('revision', expected).select('*').maybeSingle();
  raiseDb(row.error);
  if (!row.data) throw new CareError(409, 'Alguien cambió esto, recargá.');
  return row.data;
}

export async function patchSubscription(id: string, patch: Record<string, unknown>) {
  const row = await db().from('patient_subscriptions').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select('*').maybeSingle();
  raiseDb(row.error);
  return row.data;
}

export async function authorizedForPlan(planId: string) {
  const row = await db().from('patient_subscriptions').select('id,patient_id,revision,status').eq('plan_id', planId).eq('status', 'authorized');
  raiseDb(row.error);
  return (row.data ?? []) as Array<{ id: string; patient_id: string | null; revision: number; status: string }>;
}

export async function saveNotice(values: Record<string, unknown>): Promise<'saved' | 'duplicate'> {
  const row = await db().from('patient_subscription_events').insert(values);
  if (row.error?.code === '23505') return 'duplicate';
  raiseDb(row.error);
  return 'saved';
}

export async function claimNotices(batch: number) {
  const row = await db().rpc('claim_patient_subscription_events', { batch });
  raiseDb(row.error);
  return (row.data ?? []) as Array<Record<string, unknown>>;
}

export async function finishNotice(id: string, patch: Record<string, unknown>) {
  const row = await db().from('patient_subscription_events').update(patch).eq('id', id);
  raiseDb(row.error);
}

export async function findSubscriptionByProvider(accountId: string, preapprovalId: string) {
  const row = await db().from('patient_subscriptions').select('*').eq('provider_account_id', accountId).eq('provider_preapproval_id', preapprovalId).maybeSingle();
  raiseDb(row.error);
  return row.data;
}

export async function findSubscriptionById(id: string, nutritionistId: string) {
  const row = await db().from('patient_subscriptions').select('*').eq('id', id).eq('nutritionist_id', nutritionistId).maybeSingle();
  raiseDb(row.error);
  return row.data;
}

export async function livePage(after: string | null, limit = 50) {
  let query = db().from('patient_subscriptions').select('*').in('status', ['creating', 'uncertain', 'pending', 'authorized', 'paused']).order('id').limit(limit);
  if (after) query = query.gt('id', after);
  const row = await query;
  raiseDb(row.error);
  return row.data ?? [];
}

export async function upsertInstallment(values: Record<string, unknown>) {
  const subscriptionId = String(values.subscription_id);
  const paymentId = values.provider_payment_id ? String(values.provider_payment_id) : null;
  const authorizedId = values.provider_authorized_payment_id ? String(values.provider_authorized_payment_id) : null;
  let existing = db().from('patient_subscription_payments').select('id,ledger_payment_id').eq('subscription_id', subscriptionId);
  if (paymentId) existing = existing.eq('provider_payment_id', paymentId);
  else if (authorizedId) existing = existing.eq('provider_authorized_payment_id', authorizedId);
  const found = await existing.maybeSingle();
  raiseDb(found.error);
  if (found.data) {
    const row = await db().from('patient_subscription_payments').update({ ...values, updated_at: new Date().toISOString() }).eq('id', found.data.id).select('id,ledger_payment_id').single();
    raiseDb(row.error);
    return row.data as { id: string; ledger_payment_id: string | null };
  }
  const row = await db().from('patient_subscription_payments').insert(values).select('id,ledger_payment_id').single();
  if (row.error?.code === '23505') {
    const again = await db().from('patient_subscription_payments').select('id,ledger_payment_id').eq('subscription_id', subscriptionId).eq('provider_payment_id', paymentId ?? '').maybeSingle();
    raiseDb(again.error);
    if (again.data) return again.data as { id: string; ledger_payment_id: string | null };
  }
  raiseDb(row.error);
  return row.data as { id: string; ledger_payment_id: string | null };
}

export async function setInstallmentLedger(id: string, ledgerPaymentId: string) {
  const row = await db().from('patient_subscription_payments').update({ ledger_payment_id: ledgerPaymentId, updated_at: new Date().toISOString() }).eq('id', id);
  raiseDb(row.error);
}

export async function unbookedApproved(subscriptionId: string) {
  const row = await db().from('patient_subscription_payments').select('*').eq('subscription_id', subscriptionId).eq('payment_status', 'approved').is('ledger_payment_id', null);
  raiseDb(row.error);
  return row.data ?? [];
}

export async function findLedger(providerPaymentId: string) {
  const row = await db().from('patient_payments').select('id,status').eq('provider', 'mercado_pago').eq('provider_payment_id', providerPaymentId).maybeSingle();
  raiseDb(row.error);
  return row.data as { id: string; status: 'confirmed' | 'voided' } | null;
}

export async function insertLedger(values: Record<string, unknown>) {
  const row = await db().from('patient_payments').insert(values).select('id').single();
  if (row.error?.code === '23505') {
    const existing = await findLedger(String(values.provider_payment_id));
    if (!existing) throw new CareError(503, 'No se pudo guardar el cobro.');
    return { id: existing.id, created: false };
  }
  raiseDb(row.error);
  return { id: String(row.data.id), created: true };
}

export async function voidLedger(id: string, note: string) {
  const row = await db().from('patient_payments').update({ status: 'voided', note: note.slice(0, 280), reviewed_at: new Date().toISOString() }).eq('id', id).eq('status', 'confirmed');
  raiseDb(row.error);
}

export async function pauseManualFee(patientId: string) {
  const row = await db().rpc('pause_manual_fee_for_debit', { target: patientId });
  raiseDb(row.error);
}

export async function checkoutIntent(nutritionistId: string, id: string) {
  const row = await db().from('scheduling_checkout_intents').select('id').eq('id', id).eq('nutritionist_id', nutritionistId).maybeSingle();
  raiseDb(row.error);
  return row.data as { id: string } | null;
}
