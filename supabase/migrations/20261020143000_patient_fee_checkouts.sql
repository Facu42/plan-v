-- Pago único de la cuota mensual (Checkout Pro), sin suscripción.
-- Plan V no cobra comisión. Esta migración no se aplica sola:
-- hace falta la frase escrita de Facundo.
-- Depende de 20261020120000_patient_subscriptions.sql (source y provider_payment_id).
--
-- Para volver atrás, si todavía no hay filas que conservar:
--   drop index if exists public.patient_payments_checkout_month_uidx;
--   drop table if exists public.patient_fee_checkouts;
--   alter table public.patient_payments drop column if exists covers_due_on;
--   Volvé public.billing_ledger_json a la versión de 20261020120000 (sin covers_due_on).

alter table public.patient_payments
  add column if not exists covers_due_on date;

create unique index if not exists patient_payments_checkout_month_uidx
  on public.patient_payments (patient_id, covers_due_on)
  where source = 'checkout' and status = 'confirmed' and covers_due_on is not null;

create table if not exists public.patient_fee_checkouts (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  charge_id uuid references public.patient_charges(id) on delete set null,
  due_on date not null,
  amount int not null check (amount between 1 and 100000000),
  currency text not null default 'ARS' check (currency = 'ARS'),
  status text not null default 'creating' check (status in ('creating', 'ready', 'paid', 'expired')),
  checkout_url text,
  provider_preference_id text,
  provider_payment_id text,
  client_request_id uuid not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create unique index if not exists patient_fee_checkouts_open_uidx
  on public.patient_fee_checkouts (patient_id, due_on)
  where status in ('creating', 'ready');

create unique index if not exists patient_fee_checkouts_request_uidx
  on public.patient_fee_checkouts (nutritionist_id, client_request_id);

create index if not exists patient_fee_checkouts_nutritionist_idx
  on public.patient_fee_checkouts (nutritionist_id, status);

create index if not exists patient_fee_checkouts_patient_idx
  on public.patient_fee_checkouts (patient_id);

create index if not exists patient_fee_checkouts_charge_idx
  on public.patient_fee_checkouts (charge_id);

alter table public.patient_fee_checkouts enable row level security;
revoke all on public.patient_fee_checkouts from public, anon, authenticated;
grant all on public.patient_fee_checkouts to service_role;

create or replace function public.billing_ledger_json(target uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'patient_id', target,
    'fee', (
      select jsonb_build_object('amount', f.amount, 'first_due_on', f.first_due_on, 'program_name', f.program_name)
      from public.patient_fees f where f.patient_id = target
    ),
    'charges', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', c.id, 'due_on', c.due_on, 'amount', c.amount, 'status', c.status, 'kind', c.kind, 'concept', c.concept
      ) order by c.due_on, c.created_at)
      from public.patient_charges c where c.patient_id = target
    ), '[]'::jsonb),
    'payments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id, 'amount', p.amount, 'paid_on', p.paid_on, 'method', p.method, 'note', p.note,
        'status', p.status, 'reported_by_patient', p.reported_by_patient, 'created_at', p.created_at,
        'source', p.source, 'covers_due_on', p.covers_due_on
      ) order by p.paid_on desc, p.created_at desc)
      from public.patient_payments p where p.patient_id = target
    ), '[]'::jsonb)
  );
$$;
