import { CareError } from '../care/errors.js';
import { isSupabaseEnabled, privilegedDb } from '../db/supabase-client.js';
import { writeOpsLog } from '../ops/log.js';

type Row = Record<string, unknown>;

function db() {
  if (!isSupabaseEnabled()) throw new CareError(501, 'Falta conectar la base.');
  return privilegedDb();
}

export function schemaMissing(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code ?? '';
  return code === '42P01' || code === '42883' || code === 'PGRST202' || code === 'PGRST205';
}

function raise(error: { code?: string; message?: string } | null): never {
  if (error && schemaMissing(error)) throw new CareError(501, 'Falta aplicar la migración de cobro de planes.');
  if (error?.code === '23505') throw new CareError(409, 'Ya tenés un plan en curso.');
  throw new CareError(503, 'No se pudo guardar el plan.');
}

export type SubscriptionRow = {
  id: string;
  nutritionist_id: string;
  organization_id: string | null;
  plan_code: string;
  billing_cycle: 'monthly' | 'annual';
  status: 'pending' | 'authorized' | 'paused' | 'past_due' | 'canceled';
  provider: string;
  provider_preapproval_id: string | null;
  founder: boolean;
  founder_until: string | null;
  current_amount_cents: number;
  current_period_end: string | null;
  past_due_since: string | null;
  canceled_at: string | null;
  cancel_reason: string | null;
  payer_email: string;
  client_request_id: string;
  create_idempotency_key: string;
  init_point: string | null;
  revision: number;
};

const SUB_COLUMNS = 'id,nutritionist_id,organization_id,plan_code,billing_cycle,status,provider,provider_preapproval_id,founder,founder_until,current_amount_cents,current_period_end,past_due_since,canceled_at,cancel_reason,payer_email,client_request_id,create_idempotency_key,init_point,revision';

function asSub(row: Row | null): SubscriptionRow | null {
  if (!row) return null;
  return row as unknown as SubscriptionRow;
}

export async function payerEmail(userId: string): Promise<string | null> {
  const { data, error } = await db().auth.admin.getUserById(userId);
  if (error || !data.user?.email) return null;
  return data.user.email;
}

export async function nutritionistIdForUser(userId: string): Promise<string | null> {
  const row = await db().from('nutritionists').select('id').eq('user_id', userId).maybeSingle();
  if (row.error) raise(row.error);
  return (row.data?.id as string | undefined) ?? null;
}

export async function findOpenSubscription(nutritionistId: string): Promise<SubscriptionRow | null> {
  const row = await db().from('platform_subscriptions').select(SUB_COLUMNS).eq('nutritionist_id', nutritionistId).in('status', ['pending', 'authorized', 'paused', 'past_due']).maybeSingle();
  if (row.error) raise(row.error);
  return asSub(row.data as Row | null);
}

export async function findSubscription(id: string): Promise<SubscriptionRow | null> {
  const row = await db().from('platform_subscriptions').select(SUB_COLUMNS).eq('id', id).maybeSingle();
  if (row.error) raise(row.error);
  return asSub(row.data as Row | null);
}

export async function findByClientRequest(nutritionistId: string, clientRequestId: string): Promise<SubscriptionRow | null> {
  const row = await db().from('platform_subscriptions').select(SUB_COLUMNS).eq('nutritionist_id', nutritionistId).eq('client_request_id', clientRequestId).maybeSingle();
  if (row.error) raise(row.error);
  return asSub(row.data as Row | null);
}

export async function findByPreapproval(preapprovalId: string): Promise<SubscriptionRow | null> {
  const row = await db().from('platform_subscriptions').select(SUB_COLUMNS).eq('provider_preapproval_id', preapprovalId).maybeSingle();
  if (row.error) raise(row.error);
  return asSub(row.data as Row | null);
}

export async function insertSubscription(input: Record<string, unknown>): Promise<SubscriptionRow> {
  const row = await db().from('platform_subscriptions').insert(input).select(SUB_COLUMNS).single();
  if (row.error) raise(row.error);
  return asSub(row.data as Row)!;
}

export async function casUpdate(id: string, revision: number, patch: Record<string, unknown>): Promise<SubscriptionRow | null> {
  const row = await db().from('platform_subscriptions').update({ ...patch, revision: revision + 1, updated_at: new Date().toISOString() }).eq('id', id).eq('revision', revision).select(SUB_COLUMNS).maybeSingle();
  if (row.error) raise(row.error);
  return asSub(row.data as Row | null);
}

export async function claimFounder(): Promise<boolean> {
  const row = await db().rpc('claim_platform_founder_slot');
  if (row.error) raise(row.error);
  return row.data === true;
}

export async function releaseFounder(): Promise<void> {
  const row = await db().rpc('release_platform_founder_slot');
  if (row.error) raise(row.error);
}

export async function founderSeatsLeft(): Promise<number> {
  const row = await db().from('platform_founder_slots').select('claimed').eq('id', 1).maybeSingle();
  if (row.error) raise(row.error);
  return Math.max(0, 30 - Number(row.data?.claimed ?? 0));
}

export async function usageOf(nutritionistId: string, month: string) {
  const [patients, seats, photos] = await Promise.all([
    db().rpc('platform_active_patient_count', { nid: nutritionistId }),
    db().rpc('platform_nutritionist_seats', { nid: nutritionistId }),
    db().from('platform_ai_photo_months').select('used').eq('nutritionist_id', nutritionistId).eq('month', month).maybeSingle(),
  ]);
  if (patients.error) raise(patients.error);
  if (seats.error) raise(seats.error);
  if (photos.error) raise(photos.error);
  return {
    active_patients: Number(patients.data ?? 0),
    nutritionists: Number(seats.data ?? 1),
    ai_photos: Number(photos.data?.used ?? 0),
  };
}

export async function tryAiPhoto(nutritionistId: string, month: string, cap: number | null): Promise<boolean> {
  const row = await db().rpc('try_platform_ai_photo', { nid: nutritionistId, month_key: month, cap });
  if (row.error) raise(row.error);
  return row.data === true;
}

export async function findEvent(requestId: string, dataId: string, topic: string): Promise<boolean> {
  const row = await db().from('platform_billing_events').select('id').eq('request_id', requestId).eq('data_id', dataId).eq('topic', topic).maybeSingle();
  if (row.error) raise(row.error);
  return Boolean(row.data);
}

export async function saveEvent(requestId: string, dataId: string, topic: string): Promise<'saved' | 'duplicate'> {
  const row = await db().from('platform_billing_events').insert({ request_id: requestId, data_id: dataId, topic, status: 'done' }).select('id').maybeSingle();
  if (row.error?.code === '23505') return 'duplicate';
  if (row.error) raise(row.error);
  return 'saved';
}

export async function upsertPayment(input: Record<string, unknown>): Promise<void> {
  const row = await db().from('platform_payments').upsert(input, { onConflict: 'provider,provider_payment_id' });
  if (row.error) raise(row.error);
}

export async function listPayments(subscriptionId: string) {
  const row = await db().from('platform_payments').select('id,amount_cents,status,paid_at').eq('subscription_id', subscriptionId).order('paid_at', { ascending: false }).limit(24);
  if (row.error) raise(row.error);
  return (row.data ?? []) as Array<{ id: string; amount_cents: number; status: string; paid_at: string | null }>;
}

export async function listFounderDue(nowIso: string): Promise<SubscriptionRow[]> {
  const row = await db().from('platform_subscriptions').select(SUB_COLUMNS).eq('founder', true).not('founder_until', 'is', null).lte('founder_until', nowIso).in('status', ['authorized', 'past_due']).limit(50);
  if (row.error) raise(row.error);
  return (row.data ?? []) as unknown as SubscriptionRow[];
}

export function logBilling(status: string) {
  writeOpsLog('info', 'platform_billing', { status });
}
