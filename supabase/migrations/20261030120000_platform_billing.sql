-- Cobro de Nutridash a la nutricionista (Mercado Pago de la plataforma).
-- No reemplaza organization_subscriptions: esa tabla sigue siendo el permiso
-- viejo de atención en equipo (trialing/active/waived) y este módulo no la escribe.
-- La fuente de verdad del cobro B2B es platform_subscriptions.
-- No se llama payments ni subscriptions: public.payments ya es el cobro de la paciente.
-- Reversión: drop function public.try_platform_ai_photo(uuid, text, integer),
-- public.platform_nutritionist_seats(uuid), public.platform_active_patient_count(uuid),
-- public.release_platform_founder_slot(), public.claim_platform_founder_slot();
-- drop table public.platform_ai_photo_months, public.platform_billing_events,
-- public.platform_payments, public.platform_subscriptions, public.platform_founder_slots,
-- public.platform_plans;

create table if not exists public.platform_plans (
  code text primary key check (code in ('arranque', 'pro', 'consultorio')),
  name text not null check (char_length(btrim(name)) between 2 and 40),
  monthly_amount_cents bigint not null check (monthly_amount_cents > 0 and monthly_amount_cents % 100 = 0),
  annual_amount_cents bigint not null check (annual_amount_cents > 0 and annual_amount_cents % 100 = 0),
  max_active_patients integer check (max_active_patients is null or max_active_patients > 0),
  max_nutritionists integer not null check (max_nutritionists > 0),
  max_ai_meal_photos_month integer check (max_ai_meal_photos_month is null or max_ai_meal_photos_month > 0),
  active boolean not null default true,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

insert into public.platform_plans
  (code, name, monthly_amount_cents, annual_amount_cents, max_active_patients, max_nutritionists, max_ai_meal_photos_month)
values
  ('arranque', 'Arranque', 2490000, 23904000, 25, 1, 150),
  ('pro', 'Pro', 4990000, 47904000, 120, 1, 600),
  ('consultorio', 'Consultorio', 8990000, 86304000, null, 3, null)
on conflict (code) do nothing;

create table if not exists public.platform_founder_slots (
  id integer primary key check (id = 1),
  claimed integer not null default 0 check (claimed between 0 and 30)
);
insert into public.platform_founder_slots (id, claimed) values (1, 0) on conflict (id) do nothing;

create table if not exists public.platform_subscriptions (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.nutritionists(id),
  organization_id uuid references public.organizations(id),
  plan_code text not null references public.platform_plans(code),
  billing_cycle text not null check (billing_cycle in ('monthly', 'annual')),
  status text not null check (status in ('pending', 'authorized', 'paused', 'past_due', 'canceled')),
  provider text not null default 'mercadopago' check (provider = 'mercadopago'),
  provider_preapproval_id text,
  founder boolean not null default false,
  founder_until timestamptz,
  current_amount_cents bigint not null check (current_amount_cents > 0 and current_amount_cents % 100 = 0),
  current_period_end timestamptz,
  past_due_since timestamptz,
  canceled_at timestamptz,
  cancel_reason text check (cancel_reason is null or char_length(cancel_reason) <= 200),
  payer_email text not null check (position('@' in payer_email) > 1 and char_length(payer_email) <= 200),
  client_request_id text not null check (char_length(client_request_id) between 8 and 80),
  create_idempotency_key text not null check (char_length(create_idempotency_key) between 8 and 80),
  init_point text check (init_point is null or init_point ~ '^https://'),
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create unique index if not exists platform_subscriptions_preapproval_uidx
  on public.platform_subscriptions (provider, provider_preapproval_id)
  where provider_preapproval_id is not null;
create unique index if not exists platform_subscriptions_one_open
  on public.platform_subscriptions (nutritionist_id)
  where status in ('pending', 'authorized', 'paused', 'past_due');
create unique index if not exists platform_subscriptions_client_request_uidx
  on public.platform_subscriptions (nutritionist_id, client_request_id);
create index if not exists platform_subscriptions_nutritionist_idx
  on public.platform_subscriptions (nutritionist_id);
create index if not exists platform_subscriptions_organization_idx
  on public.platform_subscriptions (organization_id);
create index if not exists platform_subscriptions_plan_idx
  on public.platform_subscriptions (plan_code);

create table if not exists public.platform_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.platform_subscriptions(id),
  provider text not null default 'mercadopago' check (provider = 'mercadopago'),
  provider_payment_id text not null check (char_length(provider_payment_id) between 1 and 80),
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'ARS' check (currency = 'ARS'),
  status text not null check (status in ('approved', 'pending', 'rejected', 'refunded', 'charged_back')),
  status_detail text check (status_detail is null or char_length(status_detail) <= 80),
  paid_at timestamptz,
  invoice_status text not null default 'not_required' check (invoice_status in ('not_required', 'pending', 'issued')),
  raw jsonb not null default '{}'::jsonb check (jsonb_typeof(raw) = 'object'),
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  unique (provider, provider_payment_id)
);
create index if not exists platform_payments_subscription_idx
  on public.platform_payments (subscription_id);

create table if not exists public.platform_billing_events (
  id uuid primary key default gen_random_uuid(),
  request_id text not null check (char_length(request_id) between 1 and 200),
  data_id text not null check (char_length(data_id) between 1 and 100),
  topic text not null check (char_length(topic) between 1 and 80),
  status text not null check (status in ('done', 'failed')),
  created_at timestamptz not null default clock_timestamp(),
  unique (request_id, data_id, topic)
);

create table if not exists public.platform_ai_photo_months (
  nutritionist_id uuid not null references public.nutritionists(id),
  month text not null check (month ~ '^[0-9]{4}-[0-9]{2}$'),
  used integer not null default 0 check (used >= 0),
  primary key (nutritionist_id, month)
);

alter table public.platform_plans enable row level security;
alter table public.platform_founder_slots enable row level security;
alter table public.platform_subscriptions enable row level security;
alter table public.platform_payments enable row level security;
alter table public.platform_billing_events enable row level security;
alter table public.platform_ai_photo_months enable row level security;

revoke all on public.platform_plans, public.platform_founder_slots, public.platform_subscriptions,
  public.platform_payments, public.platform_billing_events, public.platform_ai_photo_months
  from public, anon, authenticated;
grant select on public.platform_plans, public.platform_subscriptions, public.platform_payments to authenticated;
grant select, insert, update, delete on public.platform_plans, public.platform_founder_slots, public.platform_subscriptions,
  public.platform_payments, public.platform_billing_events, public.platform_ai_photo_months to service_role;

drop policy if exists platform_plans_select on public.platform_plans;
create policy platform_plans_select on public.platform_plans
  for select to authenticated using (active);

drop policy if exists platform_subscriptions_select on public.platform_subscriptions;
create policy platform_subscriptions_select on public.platform_subscriptions
  for select to authenticated using (
    nutritionist_id = (select public.my_nutritionist_id())
    or (
      organization_id is not null
      and exists (
        select 1 from public.organization_members m
        where m.organization_id = platform_subscriptions.organization_id
          and m.nutritionist_id = (select public.my_nutritionist_id())
          and m.status = 'active'
      )
    )
  );

drop policy if exists platform_payments_select on public.platform_payments;
create policy platform_payments_select on public.platform_payments
  for select to authenticated using (
    exists (
      select 1 from public.platform_subscriptions s
      where s.id = subscription_id
        and (
          s.nutritionist_id = (select public.my_nutritionist_id())
          or (
            s.organization_id is not null
            and exists (
              select 1 from public.organization_members m
              where m.organization_id = s.organization_id
                and m.nutritionist_id = (select public.my_nutritionist_id())
                and m.status = 'active'
            )
          )
        )
    )
  );

create or replace function public.claim_platform_founder_slot()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare n integer;
begin
  insert into public.platform_founder_slots (id, claimed) values (1, 0) on conflict (id) do nothing;
  select claimed into n from public.platform_founder_slots where id = 1 for update;
  if n >= 30 then return false; end if;
  update public.platform_founder_slots set claimed = claimed + 1 where id = 1;
  return true;
end;
$$;

create or replace function public.release_platform_founder_slot()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.platform_founder_slots set claimed = claimed - 1 where id = 1 and claimed > 0;
end;
$$;

-- Paciente activo: no archivado y, en los últimos 30 días, tuvo una comida, un hábito,
-- un mensaje, un turno, o fue dado de alta. El alta ocupa un lugar; si no hay más movimiento, se libera.
create or replace function public.platform_active_patient_count(nid uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.patients p
  where p.nutritionist_id = nid
    and p.archived_at is null
    and p.deactivated_at is null
    and p.anonymized_at is null
    and (
      p.created_at > clock_timestamp() - interval '30 days'
      or exists (select 1 from public.meal_logs m where m.patient_id = p.id and m.logged_at > clock_timestamp() - interval '30 days')
      or exists (select 1 from public.habit_logs h where h.patient_id = p.id and h.logged_at > clock_timestamp() - interval '30 days')
      or exists (select 1 from public.messages g where g.patient_id = p.id and g.created_at > clock_timestamp() - interval '30 days')
      or exists (select 1 from public.appointments a where a.patient_id = p.id and a.starts_at > clock_timestamp() - interval '30 days')
    );
$$;

create or replace function public.platform_nutritionist_seats(nid uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select 1
    + coalesce((
      select count(*)::integer from public.organization_members m
      join public.organizations o on o.id = m.organization_id
      join public.nutritionists owner on owner.user_id = o.created_by
      where owner.id = nid
        and m.nutritionist_id <> nid
        and m.status in ('active', 'invited')
    ), 0)
    + coalesce((
      select count(*)::integer from public.scheduling_staff_members s
      where s.nutritionist_id = nid and s.revoked_at is null
    ), 0)
    + coalesce((
      select count(*)::integer from public.scheduling_staff_invites i
      where i.nutritionist_id = nid and i.consumed_at is null and i.expires_at > clock_timestamp()
    ), 0);
$$;

create or replace function public.try_platform_ai_photo(nid uuid, month_key text, cap integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare n integer;
begin
  if nid is null or month_key !~ '^[0-9]{4}-[0-9]{2}$' then return false; end if;
  insert into public.platform_ai_photo_months (nutritionist_id, month, used)
  values (nid, month_key, 0)
  on conflict (nutritionist_id, month) do nothing;
  select used into n from public.platform_ai_photo_months
  where nutritionist_id = nid and month = month_key
  for update;
  if cap is not null and n >= cap then return false; end if;
  update public.platform_ai_photo_months set used = used + 1
  where nutritionist_id = nid and month = month_key;
  return true;
end;
$$;

revoke all on function public.claim_platform_founder_slot(), public.release_platform_founder_slot(),
  public.platform_active_patient_count(uuid), public.platform_nutritionist_seats(uuid),
  public.try_platform_ai_photo(uuid, text, integer)
  from public, anon, authenticated;
grant execute on function public.claim_platform_founder_slot(), public.release_platform_founder_slot(),
  public.platform_active_patient_count(uuid), public.platform_nutritionist_seats(uuid),
  public.try_platform_ai_photo(uuid, text, integer)
  to service_role;
