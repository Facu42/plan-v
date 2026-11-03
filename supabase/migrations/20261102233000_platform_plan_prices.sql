-- Precios de los planes de Nutridash, editables desde /admin.
-- No aplicar en prod sin la frase de Facundo.
-- No toca platform_subscriptions: un cobro ya creado conserva su monto.
-- Reversión, solo si nadie contrató el plan prueba:
--   drop table public.platform_plan_testers, public.platform_plan_changes;
--   delete from public.platform_plans where code = 'prueba';
--   alter table public.platform_plans drop constraint platform_plans_code_check;
--   alter table public.platform_plans add constraint platform_plans_code_check check (code in ('arranque', 'pro', 'consultorio'));
--   alter table public.platform_plans drop constraint if exists platform_plans_founder_monthly_check;
--   alter table public.platform_plans drop constraint if exists platform_plans_founder_annual_check;
--   alter table public.platform_plans drop column if exists founder_monthly_amount_cents, drop column if exists founder_annual_amount_cents, drop column if exists listed;

alter table public.platform_plans
  add column if not exists founder_monthly_amount_cents bigint,
  add column if not exists founder_annual_amount_cents bigint,
  add column if not exists listed boolean not null default true;

update public.platform_plans
set founder_monthly_amount_cents = (monthly_amount_cents * 60) / 100,
    founder_annual_amount_cents = (monthly_amount_cents * 12 * 60) / 100
where founder_monthly_amount_cents is null
   or founder_annual_amount_cents is null;

alter table public.platform_plans
  alter column founder_monthly_amount_cents set not null,
  alter column founder_annual_amount_cents set not null;

alter table public.platform_plans drop constraint if exists platform_plans_founder_monthly_check;
alter table public.platform_plans
  add constraint platform_plans_founder_monthly_check
  check (founder_monthly_amount_cents > 0 and founder_monthly_amount_cents % 100 = 0);

alter table public.platform_plans drop constraint if exists platform_plans_founder_annual_check;
alter table public.platform_plans
  add constraint platform_plans_founder_annual_check
  check (founder_annual_amount_cents > 0 and founder_annual_amount_cents % 100 = 0);

alter table public.platform_plans drop constraint if exists platform_plans_code_check;
alter table public.platform_plans
  add constraint platform_plans_code_check
  check (code in ('arranque', 'pro', 'consultorio', 'prueba'));

insert into public.platform_plans (
  code, name, monthly_amount_cents, annual_amount_cents,
  founder_monthly_amount_cents, founder_annual_amount_cents,
  max_active_patients, max_nutritionists, max_ai_meal_photos_month, active, listed
) values (
  'prueba', 'Prueba', 10000, 96000, 10000, 96000, 25, 1, 150, true, false
) on conflict (code) do nothing;

create table if not exists public.platform_plan_changes (
  id uuid primary key default gen_random_uuid(),
  plan_code text not null references public.platform_plans(code),
  actor_user_id uuid,
  actor_email text not null check (position('@' in actor_email) > 1 and char_length(actor_email) <= 254),
  monthly_amount_cents bigint not null check (monthly_amount_cents > 0 and monthly_amount_cents % 100 = 0),
  annual_amount_cents bigint not null check (annual_amount_cents > 0 and annual_amount_cents % 100 = 0),
  founder_monthly_amount_cents bigint not null check (founder_monthly_amount_cents > 0 and founder_monthly_amount_cents % 100 = 0),
  founder_annual_amount_cents bigint not null check (founder_annual_amount_cents > 0 and founder_annual_amount_cents % 100 = 0),
  active boolean not null,
  listed boolean not null,
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists platform_plan_changes_plan_idx
  on public.platform_plan_changes (plan_code);
create index if not exists platform_plan_changes_created_idx
  on public.platform_plan_changes (created_at desc);

create table if not exists public.platform_plan_testers (
  email text primary key check (position('@' in email) > 1 and char_length(email) <= 254 and email = lower(email)),
  created_at timestamptz not null default clock_timestamp()
);

alter table public.platform_plan_changes enable row level security;
alter table public.platform_plan_testers enable row level security;

revoke all on public.platform_plan_changes, public.platform_plan_testers from public, anon, authenticated;
grant select, insert, update, delete on public.platform_plan_changes, public.platform_plan_testers to service_role;

drop policy if exists platform_plans_select on public.platform_plans;
create policy platform_plans_select on public.platform_plans
  for select to authenticated
  using (active and listed);
