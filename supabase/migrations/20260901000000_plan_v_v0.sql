-- Plan V v0 schema + RLS
-- Apply in Supabase SQL Editor or: supabase db push

-- Extensions
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type user_role as enum ('nutri', 'paciente');
exception when duplicate_object then null; end $$;

do $$ begin
  create type patient_stage as enum ('ingreso', 'plan', 'seguimiento', 'alta');
exception when duplicate_object then null; end $$;

do $$ begin
  create type meal_slot_kind as enum ('desayuno', 'almuerzo', 'merienda', 'cena');
exception when duplicate_object then null; end $$;

do $$ begin
  create type meal_log_status as enum ('pending_review', 'confirmed', 'adjusted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type suggested_action as enum ('mensaje', 'ajuste_menu', 'turno');
exception when duplicate_object then null; end $$;

do $$ begin
  create type billing_status as enum ('waived', 'pending', 'active', 'past_due');
exception when duplicate_object then null; end $$;

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'paciente',
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Nutritionists
create table if not exists public.nutritionists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  license text,
  display_name text not null,
  created_at timestamptz not null default now()
);

-- Patients
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  initials text not null default '',
  tone text not null default 'mint',
  stage patient_stage not null default 'ingreso',
  status text not null default 'En ritmo',
  goal text not null default '',
  sensitive_hours text not null default '',
  plan_b text not null default '',
  next_focus text not null default '',
  adherence_score int not null default 0 check (adherence_score between 0 and 100),
  adherence_why text not null default '',
  hydration int not null default 0,
  energy text,
  billing_status billing_status not null default 'active',
  billing_until date,
  created_at timestamptz not null default now()
);

create table if not exists public.meal_slots (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  for_date date not null,
  slot meal_slot_kind not null,
  scheduled_time time not null,
  title text not null,
  detail text not null default ''
);

create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  meal_slot_id uuid references public.meal_slots(id) on delete set null,
  slot_label text not null default '',
  photo_url text,
  description text,
  foods jsonb not null default '[]'::jsonb,
  macros jsonb,
  confidence numeric not null default 0 check (confidence between 0 and 1),
  note_for_nutri text not null default '',
  status meal_log_status not null default 'pending_review',
  logged_at timestamptz not null default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  kind text not null check (kind in ('water', 'sleep', 'energy')),
  value text not null,
  logged_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  starts_at timestamptz not null,
  duration_min int not null default 45,
  channel text not null check (channel in ('video', 'presencial')),
  status text not null default 'scheduled',
  prep_note text
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  suggested_by_ai boolean not null default false,
  sent_at timestamptz not null default now()
);

create table if not exists public.ai_briefs (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  suggested_action suggested_action,
  up_next_title text,
  up_next_body text,
  draft_message text,
  source_ids uuid[] not null default '{}',
  adherence_why text not null default '',
  status text not null default 'pending_review' check (status in ('pending_review', 'done', 'dismissed')),
  created_at timestamptz not null default now()
);

create unique index if not exists ai_briefs_one_pending_per_patient
  on public.ai_briefs (patient_id)
  where (status = 'pending_review');

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  provider text not null check (provider in ('mercadopago', 'manual')),
  amount_ars int not null,
  currency text not null default 'ARS',
  status text not null check (status in ('pending', 'approved', 'refunded', 'rejected')),
  period_start date not null,
  period_end date not null,
  mp_preference_id text,
  mp_payment_id text,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'paciente'),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: nutritionist id for current user
create or replace function public.my_nutritionist_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select n.id from public.nutritionists n
  join public.profiles p on p.id = n.user_id
  where n.user_id = auth.uid() and p.role = 'nutri'
  limit 1;
$$;

create or replace function public.my_patient_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select pt.id from public.patients pt
  where pt.user_id = auth.uid()
  limit 1;
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.nutritionists enable row level security;
alter table public.patients enable row level security;
alter table public.meal_slots enable row level security;
alter table public.meal_logs enable row level security;
alter table public.habit_logs enable row level security;
alter table public.appointments enable row level security;
alter table public.messages enable row level security;
alter table public.ai_briefs enable row level security;
alter table public.payments enable row level security;

-- Profiles: own row
create policy profiles_select_own on public.profiles for select using (id = auth.uid());
create policy profiles_update_own on public.profiles for update using (id = auth.uid());

-- Nutritionists: own row
create policy nutritionists_select_own on public.nutritionists for select using (user_id = auth.uid());
create policy nutritionists_insert_own on public.nutritionists for insert with check (user_id = auth.uid());

-- Patients: nutri sees their patients; patient sees self
create policy patients_nutri_all on public.patients for all
  using (nutritionist_id = public.my_nutritionist_id())
  with check (nutritionist_id = public.my_nutritionist_id());

create policy patients_self_select on public.patients for select
  using (user_id = auth.uid());

create policy patients_self_update on public.patients for update
  using (user_id = auth.uid());

-- Meal logs: nutri full; patient insert/select without note_for_nutri via view
create policy meal_logs_nutri_all on public.meal_logs for all
  using (
    patient_id in (select id from public.patients where nutritionist_id = public.my_nutritionist_id())
  );

create policy meal_logs_patient_insert on public.meal_logs for insert
  with check (patient_id = public.my_patient_id());

create policy meal_logs_patient_select on public.meal_logs for select
  using (patient_id = public.my_patient_id());

-- Patient-safe view (hides note_for_nutri)
create or replace view public.meal_logs_patient with (security_invoker = true) as
  select
    id, patient_id, meal_slot_id, slot_label, photo_url, description,
    foods, macros, confidence, status, logged_at
  from public.meal_logs;

grant select on public.meal_logs_patient to authenticated;

-- Messages
create policy messages_nutri_all on public.messages for all
  using (nutritionist_id = public.my_nutritionist_id());

create policy messages_patient_select on public.messages for select
  using (patient_id = public.my_patient_id() and suggested_by_ai = false);

create policy messages_patient_insert on public.messages for insert
  with check (patient_id = public.my_patient_id() and author_id = auth.uid());

-- AI briefs: nutri only
create policy ai_briefs_nutri on public.ai_briefs for all
  using (nutritionist_id = public.my_nutritionist_id());

-- Meal slots, habits, appointments, payments: inherit patient access
create policy meal_slots_access on public.meal_slots for all
  using (
    patient_id in (select id from public.patients where nutritionist_id = public.my_nutritionist_id())
    or patient_id = public.my_patient_id()
  );

create policy habit_logs_access on public.habit_logs for all
  using (
    patient_id in (select id from public.patients where nutritionist_id = public.my_nutritionist_id())
    or patient_id = public.my_patient_id()
  );

create policy appointments_access on public.appointments for select
  using (
    nutritionist_id = public.my_nutritionist_id()
    or patient_id = public.my_patient_id()
  );

create policy payments_nutri on public.payments for all
  using (nutritionist_id = public.my_nutritionist_id());

create policy payments_patient_select on public.payments for select
  using (patient_id = public.my_patient_id());

-- Demo seed (run once after creating Verónica's auth user manually, or via service role)
-- See supabase/seed.sql
