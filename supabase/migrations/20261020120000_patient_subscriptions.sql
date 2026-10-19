-- Suscripciones de pacientes (débito automático con la cuenta de Mercado Pago de la nutri).
-- Plan V no mueve plata ni cobra comisión. Esta migración no se aplica sola:
-- hace falta la frase escrita de Facundo.
--
-- Para volver atrás, si todavía no hay filas que conservar:
--   drop function if exists public.get_my_subscriptions();
--   drop function if exists public.claim_patient_subscription_events(integer);
--   drop function if exists public.pause_manual_fee_for_debit(uuid);
--   drop table if exists public.patient_subscription_events;
--   drop table if exists public.patient_subscription_payments;
--   drop table if exists public.patient_subscriptions;
--   drop table if exists public.patient_subscription_plans;
--   drop index if exists public.patient_payments_provider_payment_uidx;
--   alter table public.patient_payments
--     drop column if exists provider_payment_id,
--     drop column if exists provider,
--     drop column if exists source;

alter table public.patient_payments
  add column if not exists source text not null default 'manual'
    check (source in ('manual', 'checkout', 'subscription')),
  add column if not exists provider text,
  add column if not exists provider_payment_id text;

create unique index if not exists patient_payments_provider_payment_uidx
  on public.patient_payments (provider, provider_payment_id)
  where provider_payment_id is not null;

create table if not exists public.patient_subscription_plans (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  program_id uuid references public.nutritionist_programs(id) on delete set null,
  name text not null check (char_length(name) between 2 and 60),
  description text check (description is null or char_length(description) <= 280),
  amount_cents bigint not null check (amount_cents between 100000 and 1000000000 and amount_cents % 100 = 0),
  currency text not null default 'ARS' check (currency = 'ARS'),
  frequency smallint not null default 1 check (frequency = 1),
  frequency_type text not null default 'months' check (frequency_type = 'months'),
  trial_days smallint check (trial_days is null),
  public_visible boolean not null default false,
  status text not null default 'active' check (status in ('active', 'archived')),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists patient_subscription_plans_nutritionist_idx
  on public.patient_subscription_plans (nutritionist_id, status);
create index if not exists patient_subscription_plans_program_idx
  on public.patient_subscription_plans (program_id);

create table if not exists public.patient_subscriptions (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  plan_id uuid not null references public.patient_subscription_plans(id) on delete restrict,
  patient_id uuid references public.patients(id) on delete set null,
  provider_account_id text not null,
  provider_preapproval_id text,
  payer_email text not null check (char_length(payer_email) between 3 and 254 and position('@' in payer_email) > 1),
  contact_name text check (contact_name is null or char_length(contact_name) <= 120),
  contact_phone text check (contact_phone is null or char_length(contact_phone) <= 40),
  source text not null check (source in ('panel', 'chat', 'public_page', 'patient_app')),
  status text not null default 'creating' check (status in
    ('creating', 'uncertain', 'pending', 'authorized', 'paused', 'cancelled', 'expired', 'failed')),
  payment_state text check (payment_state is null or payment_state in ('ok', 'retrying', 'rejected')),
  cancelled_by text check (cancelled_by is null or cancelled_by in ('nutritionist', 'patient', 'mercado_pago', 'system')),
  amount_cents bigint not null check (amount_cents between 100000 and 1000000000 and amount_cents % 100 = 0),
  pending_amount_cents bigint check (pending_amount_cents is null or (pending_amount_cents between 100000 and 1000000000 and pending_amount_cents % 100 = 0)),
  pending_amount_on timestamptz,
  init_point text check (init_point is null or init_point like 'https://%'),
  next_payment_date timestamptz,
  last_payment_at timestamptz,
  provider_last_modified timestamptz,
  create_idempotency_key uuid not null default gen_random_uuid(),
  client_request_id uuid,
  revision integer not null default 1 check (revision > 0),
  review_required boolean not null default false,
  account_mismatch boolean not null default false,
  manual_fee_paused boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists patient_subscriptions_provider_uidx
  on public.patient_subscriptions (provider_account_id, provider_preapproval_id)
  where provider_preapproval_id is not null;
create unique index if not exists patient_subscriptions_one_live_uidx
  on public.patient_subscriptions (plan_id, patient_id)
  where patient_id is not null and status in ('creating', 'uncertain', 'pending', 'authorized', 'paused');
create unique index if not exists patient_subscriptions_client_request_uidx
  on public.patient_subscriptions (nutritionist_id, client_request_id)
  where client_request_id is not null;
create index if not exists patient_subscriptions_nutritionist_idx
  on public.patient_subscriptions (nutritionist_id, status);
create index if not exists patient_subscriptions_plan_idx
  on public.patient_subscriptions (plan_id);
create index if not exists patient_subscriptions_patient_idx
  on public.patient_subscriptions (patient_id);

create table if not exists public.patient_subscription_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.patient_subscriptions(id) on delete cascade,
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  provider_authorized_payment_id text,
  provider_payment_id text,
  period_start date,
  amount_cents bigint not null,
  status text not null,
  payment_status text,
  retry_attempt smallint,
  ledger_payment_id uuid references public.patient_payments(id) on delete set null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists patient_subscription_payments_authorized_uidx
  on public.patient_subscription_payments (subscription_id, provider_authorized_payment_id)
  where provider_authorized_payment_id is not null;
create unique index if not exists patient_subscription_payments_payment_uidx
  on public.patient_subscription_payments (subscription_id, provider_payment_id)
  where provider_payment_id is not null;
create index if not exists patient_subscription_payments_subscription_idx
  on public.patient_subscription_payments (subscription_id);
create index if not exists patient_subscription_payments_nutritionist_idx
  on public.patient_subscription_payments (nutritionist_id, created_at desc);
create index if not exists patient_subscription_payments_ledger_idx
  on public.patient_subscription_payments (ledger_payment_id);

create table if not exists public.patient_subscription_events (
  id uuid primary key default gen_random_uuid(),
  provider_notification_id text,
  request_id text,
  topic text not null,
  action text,
  provider_user_id text,
  resource_id text,
  live_mode boolean,
  signature_valid boolean not null,
  status text not null default 'queued' check (status in
    ('queued', 'processing', 'processed', 'ignored', 'unroutable', 'failed')),
  attempts smallint not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  subscription_id uuid references public.patient_subscriptions(id) on delete set null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create unique index if not exists patient_subscription_events_notice_uidx
  on public.patient_subscription_events (topic, resource_id, provider_notification_id)
  where provider_notification_id is not null;
create index if not exists patient_subscription_events_queue_idx
  on public.patient_subscription_events (status, next_attempt_at);
create index if not exists patient_subscription_events_subscription_idx
  on public.patient_subscription_events (subscription_id);

alter table public.patient_subscription_plans enable row level security;
alter table public.patient_subscriptions enable row level security;
alter table public.patient_subscription_payments enable row level security;
alter table public.patient_subscription_events enable row level security;

drop policy if exists patient_subscription_plans_select on public.patient_subscription_plans;
create policy patient_subscription_plans_select on public.patient_subscription_plans
  for select to authenticated
  using ((select public.scheduling_can_manage(nutritionist_id)));

drop policy if exists patient_subscriptions_select on public.patient_subscriptions;
create policy patient_subscriptions_select on public.patient_subscriptions
  for select to authenticated
  using ((select public.scheduling_can_manage(nutritionist_id)));

drop policy if exists patient_subscription_payments_select on public.patient_subscription_payments;
create policy patient_subscription_payments_select on public.patient_subscription_payments
  for select to authenticated
  using ((select public.scheduling_can_manage(nutritionist_id)));

revoke all on public.patient_subscription_plans, public.patient_subscriptions,
  public.patient_subscription_payments, public.patient_subscription_events
  from public, anon, authenticated;
grant select on public.patient_subscription_plans, public.patient_subscriptions,
  public.patient_subscription_payments to authenticated;
grant all on public.patient_subscription_plans, public.patient_subscriptions,
  public.patient_subscription_payments, public.patient_subscription_events to service_role;

-- Apaga la cuota manual cuando el débito ya está activo, para no cobrar dos veces.
create or replace function public.pause_manual_fee_for_debit(target uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target is null then
    return;
  end if;
  delete from public.patient_charges as charge
   where charge.patient_id = target
     and charge.kind = 'fee'
     and charge.status = 'open'
     and charge.due_on > current_date;
  delete from public.patient_fees as fee
   where fee.patient_id = target;
end;
$$;

revoke all on function public.pause_manual_fee_for_debit(uuid) from public, anon, authenticated;
grant execute on function public.pause_manual_fee_for_debit(uuid) to service_role;

create or replace function public.claim_patient_subscription_events(batch integer)
returns setof public.patient_subscription_events
language plpgsql
security definer
set search_path = ''
as $$
declare
  n int := least(greatest(coalesce(batch, 10), 1), 20);
begin
  return query
  update public.patient_subscription_events as event
     set status = 'processing',
         attempts = event.attempts + 1
   where event.id in (
     select queued.id
       from public.patient_subscription_events as queued
      where queued.status = 'queued'
        and queued.next_attempt_at <= clock_timestamp()
      order by queued.received_at
      for update skip locked
      limit n
   )
  returning event.*;
end;
$$;

revoke all on function public.claim_patient_subscription_events(integer) from public, anon, authenticated;
grant execute on function public.claim_patient_subscription_events(integer) to service_role;

-- La paciente ve su débito, sin correo completo ni identificadores de Mercado Pago.
create or replace function public.get_my_subscriptions()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', sub.id,
    'status', sub.status,
    'payment_state', sub.payment_state,
    'cancelled_by', sub.cancelled_by,
    'amount_cents', sub.amount_cents,
    'currency', 'ARS',
    'next_payment_date', sub.next_payment_date,
    'pending_amount_cents', sub.pending_amount_cents,
    'pending_amount_on', sub.pending_amount_on,
    'plan_name', plan.name,
    'init_point', case when sub.status = 'pending' then sub.init_point else null end
  ) order by sub.created_at desc), '[]'::jsonb)
  from public.patient_subscriptions as sub
  join public.patient_subscription_plans as plan on plan.id = sub.plan_id
  where sub.patient_id = public.my_patient_id()
    and sub.status <> 'failed';
$$;

revoke all on function public.get_my_subscriptions() from public, anon, authenticated;
grant execute on function public.get_my_subscriptions() to authenticated, service_role;
