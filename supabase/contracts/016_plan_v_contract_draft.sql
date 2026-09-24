-- ⛔ DRAFT v2 — REVIEW ONLY — DO NOT APPLY / NO CORRER
-- Propuesta de contrato 016 para Plan V, endurecida tras revisión de seguridad,
-- compatibilidad de dominio y privacidad/operación (2026-09-07).
-- Requiere revisión de seguridad/privacidad, responsables y pruebas RLS reales
-- antes de aplicar. Este archivo no habilita Supabase/Mercado Pago por sí solo.
--
-- Modelo de acceso (paciente y nutricionista comparten el rol SQL `authenticated`):
--   1. Tablas crudas: grants amplios + RLS por comando. Donde un comando aplica
--      a ambos roles pero algunas columnas son service-only, el grant es por
--      columna (profiles.role, patients.billing_*/user_id/lifecycle).
--   2. Lecturas de paciente sobre tablas con columnas profesionales
--      (patients, meal_logs, messages, appointments): SIN policy SELECT sobre la
--      tabla cruda. Se leen vistas `security definer` (owner postgres, RLS de la
--      tabla no aplica al owner) cuyo WHERE filtra por la identidad del caller.
--   3. Mensajes: inmutables para roles autenticados (sin grant UPDATE/DELETE).
--   4. Transiciones de invitaciones, cobranza y pagos: service role / RPCs.

create extension if not exists "pgcrypto";

-- ============================================================
-- Enums
-- ============================================================
do $$ begin
  create type public.user_role as enum ('nutri', 'paciente');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.patient_stage as enum ('ingreso', 'plan', 'seguimiento', 'alta');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.meal_slot_kind as enum ('desayuno', 'colacion', 'almuerzo', 'merienda', 'cena', 'extra');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.meal_log_status as enum ('pending_review', 'confirmed', 'adjusted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.suggested_action as enum ('mensaje', 'ajuste_menu', 'turno');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.billing_status as enum ('waived', 'pending', 'active', 'past_due');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_provider as enum ('mercadopago', 'manual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('pending', 'approved', 'refunded', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.brief_status as enum ('pending_review', 'done', 'dismissed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.appointment_channel as enum ('video', 'presencial');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.appointment_status as enum ('scheduled', 'done', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.reminder_kind as enum ('meal', 'water', 'sleep', 'appointment');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.timeline_event_kind as enum ('meal_logged', 'meal_missed', 'habit', 'reminder_fired', 'appointment', 'message', 'menu', 'billing');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.timeline_visibility as enum ('professional', 'patient');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.webhook_processing_status as enum ('received', 'processed', 'ignored', 'failed');
exception when duplicate_object then null; end $$;

-- ============================================================
-- Identidad y relación profesional-paciente
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'paciente',
  full_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.nutritionists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  license text,
  display_name text not null,
  monthly_fee_ars int check (monthly_fee_ars is null or monthly_fee_ars > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  -- Vínculo Auth: único y service-only. Lo fija accept_patient_invite, nunca el cliente.
  user_id uuid unique references public.profiles(id) on delete set null,
  full_name text not null,
  initials text not null default '',
  tone text not null default 'mint' check (tone in ('peach', 'lilac', 'mint')),
  stage public.patient_stage not null default 'ingreso',
  status text not null default 'En ritmo',
  goal text not null default '',
  sensitive_hours text not null default '',
  plan_b text not null default '',
  next_focus text not null default '',
  adherence_score int not null default 0 check (adherence_score between 0 and 100),
  adherence_why text not null default '',
  billing_status public.billing_status not null default 'pending',
  billing_until date,
  -- Lifecycle de privacidad (service-only; el workflow de borrado es externo).
  deactivated_at timestamptz,
  deletion_requested_at timestamptz,
  anonymized_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, nutritionist_id),
  check (billing_status <> 'active' or billing_until is not null)
);

create table if not exists public.patient_invites (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  email text not null,
  status text not null default 'not_sent' check (status in ('not_sent', 'pending', 'accepted', 'expired', 'revoked')),
  invited_at timestamptz,
  expires_at timestamptz,
  accepted_at timestamptz,
  accepted_by uuid references public.profiles(id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade,
  check (email = lower(btrim(email))),
  check (status <> 'pending' or (invited_at is not null and expires_at is not null)),
  check (status <> 'accepted' or accepted_at is not null),
  check (status <> 'revoked' or revoked_at is not null)
);

-- Historial permitido: una sola invitación activa por paciente y por (nutri, email).
create unique index if not exists patient_invites_one_active_per_patient
  on public.patient_invites (patient_id)
  where status in ('not_sent', 'pending');

create unique index if not exists patient_invites_pending_email_unique
  on public.patient_invites (nutritionist_id, email)
  where status in ('not_sent', 'pending');

-- Bitácora append-only del ciclo de invitación (service role escribe; nutri lee vía API).
create table if not exists public.patient_invite_events (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references public.patient_invites(id) on delete cascade,
  event text not null check (event in ('created', 'sent', 'resent', 'accepted', 'expired', 'revoked', 'failed')),
  actor_id uuid,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists patient_invite_events_invite_idx
  on public.patient_invite_events (invite_id, created_at desc);

-- ============================================================
-- Plan semanal, registros y recordatorios
-- ============================================================
-- El menú es una plantilla semanal recurrente {weekday, slot, title}: sin fecha
-- ni hora, como el comportamiento actual de la app.
-- weekday: 0 = Lunes … 6 = Domingo (orden de WEEK_DAYS en server/schemas.ts).
create table if not exists public.meal_slots (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  slot public.meal_slot_kind not null,
  title text not null,
  detail text not null default '',
  created_at timestamptz not null default now(),
  unique (patient_id, weekday, slot),
  unique (id, patient_id)
);

create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  meal_slot_id uuid references public.meal_slots(id) on delete set null,
  slot_label text not null default '',
  photo_path text,
  description text,
  foods jsonb not null default '[]'::jsonb,
  macros jsonb,
  confidence numeric not null default 0 check (confidence between 0 and 1),
  note_for_nutri text not null default '',
  status public.meal_log_status not null default 'pending_review',
  logged_at timestamptz not null default now(),
  check (photo_path is null or photo_path like 'patients/' || patient_id::text || '/%')
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  date date not null,
  hydration int not null default 0 check (hydration between 0 and 8),
  energy text,
  sleep_minutes int check (sleep_minutes between 0 and 1440),
  logged_at timestamptz not null default now(),
  unique (patient_id, date)
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  kind public.reminder_kind not null,
  time_local time not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (patient_id, kind, time_local)
);

create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  kind public.timeline_event_kind not null,
  visibility public.timeline_visibility not null default 'professional',
  title text not null check (char_length(title) between 1 and 200),
  body text not null default '' check (char_length(body) <= 1000),
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists timeline_events_patient_occurred_idx
  on public.timeline_events (patient_id, occurred_at desc);

-- Manifiesto de archivos clínicos: la fila DB y el objeto Storage se reconcilian
-- por object_path. El borrado físico es un job externo (ver runbook).
create table if not exists public.patient_assets (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  bucket text not null default 'meal-photos',
  object_path text not null unique,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade,
  check (bucket = 'meal-photos'),
  check (object_path like 'patients/' || patient_id::text || '/%')
);

-- ============================================================
-- Consultas, mensajes y copiloto
-- ============================================================
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null,
  patient_id uuid not null,
  starts_at timestamptz not null,
  duration_min int not null default 45 check (duration_min between 10 and 180),
  channel public.appointment_channel not null,
  status public.appointment_status not null default 'scheduled',
  prep_note text,
  meet_url text check (meet_url is null or (length(meet_url) <= 500 and meet_url ~ '^https://')),
  created_at timestamptz not null default now(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null,
  patient_id uuid not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  suggested_by_ai boolean not null default false,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create table if not exists public.ai_briefs (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null,
  patient_id uuid not null,
  suggested_action public.suggested_action,
  up_next_title text,
  up_next_body text,
  draft_message text,
  -- El dominio actual usa ids arbitrarios ('meal-1', 'slot-3'): texto, no uuid[].
  source_ids text[] not null default '{}',
  adherence_why text not null default '',
  status public.brief_status not null default 'pending_review',
  dismissed_at timestamptz,
  dismissed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade,
  check (status <> 'dismissed' or (dismissed_at is not null and dismissed_by is not null))
);

create unique index if not exists ai_briefs_one_pending_per_patient
  on public.ai_briefs (patient_id)
  where status = 'pending_review';

-- ============================================================
-- Cobranza: estado operativo y pagos reales
-- ============================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  provider public.payment_provider not null,
  amount_ars int not null check (amount_ars > 0),
  currency text not null default 'ARS' check (currency = 'ARS'),
  status public.payment_status not null default 'pending',
  period_start date not null,
  period_end date not null,
  mp_preference_id text,
  mp_payment_id text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  -- Retención financiera: borrar el paciente NO borra sus pagos.
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete restrict,
  check (period_end >= period_start),
  check (status <> 'approved' or approved_at is not null),
  check (provider <> 'manual' or (mp_preference_id is null and mp_payment_id is null))
);

create index if not exists payments_patient_created_idx
  on public.payments (patient_id, created_at desc);

create unique index if not exists payments_mp_payment_unique
  on public.payments (mp_payment_id)
  where mp_payment_id is not null;

create unique index if not exists payments_mp_preference_unique
  on public.payments (mp_preference_id)
  where mp_preference_id is not null;

-- Ledger append-only de webhooks para idempotencia (service role únicamente).
create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider public.payment_provider not null default 'mercadopago',
  external_event_id text not null,
  event_type text not null,
  processing_status public.webhook_processing_status not null default 'received',
  payment_id uuid references public.payments(id) on delete set null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error_code text,
  unique (provider, external_event_id),
  check (provider = 'mercadopago'),
  check (processing_status <> 'processed' or processed_at is not null)
);

-- ============================================================
-- Auditoría y privacidad
-- ============================================================
-- Sin FKs: el rastro sobrevive a borrados. Append-only para service role.
create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid,
  actor_role text,
  source text not null check (source in ('user', 'service', 'webhook', 'job')),
  action text not null,
  object_type text not null,
  object_id text,
  patient_id uuid,
  nutritionist_id uuid,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists audit_events_patient_idx
  on public.audit_events (patient_id, occurred_at desc);

create table if not exists public.privacy_requests (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete set null,
  kind text not null check (kind in ('export', 'delete', 'correction')),
  status text not null default 'requested' check (status in ('requested', 'in_progress', 'completed', 'rejected')),
  requested_at timestamptz not null default now(),
  due_at timestamptz,
  completed_at timestamptz,
  notes text not null default ''
);

-- ============================================================
-- Helpers de rol/relación (SECURITY DEFINER, search_path vacío)
-- ============================================================
create or replace function public.my_nutritionist_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select n.id
  from public.nutritionists n
  join public.profiles p on p.id = n.user_id
  where n.user_id = auth.uid()
    and p.role = 'nutri'
  limit 1;
$$;

create or replace function public.my_patient_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select pt.id
  from public.patients pt
  join public.profiles p on p.id = pt.user_id
  where pt.user_id = auth.uid()
    and p.role = 'paciente'
  limit 1;
$$;

-- Autoridad de acceso completo del caller (waived o active vigente).
create or replace function public.patient_has_full_access(patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select
        p.billing_status = 'waived'
        or (p.billing_status = 'active' and p.billing_until >= current_date)
      from public.patients p
      where p.id = patient_id
        and p.user_id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.is_assigned_patient(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.patients p
    join public.nutritionists n on n.id = p.nutritionist_id
    join public.profiles pr on pr.id = n.user_id
    where p.id = target_patient_id
      and n.user_id = auth.uid()
      and pr.role = 'nutri'
  );
$$;

create or replace function public.is_assigned_patient_path(target_patient_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.patients p
    join public.nutritionists n on n.id = p.nutritionist_id
    join public.profiles pr on pr.id = n.user_id
    where p.id::text = target_patient_id
      and n.user_id = auth.uid()
      and pr.role = 'nutri'
  );
$$;

create or replace function public.is_own_patient(patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select patient_id = public.my_patient_id();
$$;

-- ============================================================
-- Triggers y RPCs transaccionales
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- El rol NUNCA viene del cliente: todo signup nace como paciente.
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    'paciente',
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Autor de mensaje: identidad + relación. Con usuario presente, el autor debe ser
-- el caller; service role (auth.uid() null) puede escribir borradores/sistema.
create or replace function public.validate_message_author()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  patient_user_id uuid;
  nutritionist_user_id uuid;
begin
  if auth.uid() is not null and new.author_id is distinct from auth.uid() then
    raise exception 'message author must be the caller';
  end if;

  select p.user_id, n.user_id
    into patient_user_id, nutritionist_user_id
  from public.patients p
  join public.nutritionists n on n.id = p.nutritionist_id
  where p.id = new.patient_id
    and p.nutritionist_id = new.nutritionist_id;

  if new.author_id = patient_user_id then
    if new.suggested_by_ai or new.sent_at is null then
      raise exception 'patient messages must be sent and cannot be AI-authored';
    end if;
  elsif new.author_id is distinct from nutritionist_user_id then
    raise exception 'message author is outside the patient relationship';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_message_author_before_write on public.messages;
create trigger validate_message_author_before_write
  before insert or update of patient_id, nutritionist_id, author_id, suggested_by_ai, sent_at
  on public.messages
  for each row execute function public.validate_message_author();

-- Un meal_log sólo puede apuntar a un slot del mismo paciente.
create or replace function public.validate_meal_log_slot()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.meal_slot_id is not null and not exists (
    select 1
    from public.meal_slots s
    where s.id = new.meal_slot_id
      and s.patient_id = new.patient_id
  ) then
    raise exception 'meal slot belongs to another patient';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_meal_log_slot_before_write on public.meal_logs;
create trigger validate_meal_log_slot_before_write
  before insert or update of meal_slot_id, patient_id
  on public.meal_logs
  for each row execute function public.validate_meal_log_slot();

-- Aceptación atómica de invitación: una vez, con email Auth confirmado y coincidente.
create or replace function public.accept_patient_invite(invite_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  linked_patient_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  select i.patient_id
    into linked_patient_id
  from public.patient_invites i
  join auth.users u on u.id = auth.uid()
  join public.profiles p on p.id = u.id and p.role = 'paciente'
  where i.id = invite_id
    and i.status = 'pending'
    and i.expires_at > now()
    and u.email_confirmed_at is not null
    and lower(u.email) = i.email
  for update of i;

  if linked_patient_id is null then
    raise exception 'invite unavailable';
  end if;

  update public.patients
  set user_id = auth.uid()
  where id = linked_patient_id
    and (user_id is null or user_id = auth.uid());

  if not found then
    raise exception 'patient already linked';
  end if;

  update public.patient_invites
  set status = 'accepted',
      accepted_at = now(),
      accepted_by = auth.uid(),
      updated_at = now()
  where id = invite_id;

  insert into public.patient_invite_events (invite_id, event, actor_id)
  values (invite_id, 'accepted', auth.uid());

  return linked_patient_id;
end;
$$;

-- Provisión profesional: sólo service role. Nada de auto-promoción.
create or replace function public.provision_nutritionist(
  target_user_id uuid,
  display_name text,
  license_value text default null,
  monthly_fee_value int default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_nutritionist_id uuid;
begin
  if nullif(btrim(display_name), '') is null then
    raise exception 'display name required';
  end if;
  if monthly_fee_value is not null and monthly_fee_value <= 0 then
    raise exception 'monthly fee must be positive';
  end if;

  update public.profiles
  set role = 'nutri', full_name = btrim(display_name)
  where id = target_user_id;
  if not found then
    raise exception 'profile unavailable';
  end if;

  insert into public.nutritionists (user_id, display_name, license, monthly_fee_ars)
  values (target_user_id, btrim(display_name), nullif(btrim(license_value), ''), monthly_fee_value)
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        license = excluded.license,
        monthly_fee_ars = excluded.monthly_fee_ars
  returning id into new_nutritionist_id;

  return new_nutritionist_id;
end;
$$;

-- Permisos de funciones: nada público por defecto.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.validate_message_author() from public, anon, authenticated;
revoke all on function public.validate_meal_log_slot() from public, anon, authenticated;
revoke all on function public.accept_patient_invite(uuid) from public, anon;
revoke all on function public.provision_nutritionist(uuid, text, text, int) from public, anon, authenticated;
revoke all on function public.my_patient_id() from public, anon;
revoke all on function public.my_nutritionist_id() from public, anon;
revoke all on function public.patient_has_full_access(uuid) from public, anon;
revoke all on function public.is_assigned_patient(uuid) from public, anon;
revoke all on function public.is_assigned_patient_path(text) from public, anon;
revoke all on function public.is_own_patient(uuid) from public, anon;
grant execute on function public.accept_patient_invite(uuid) to authenticated;
grant execute on function public.provision_nutritionist(uuid, text, text, int) to service_role;
grant execute on function public.my_patient_id() to authenticated;
grant execute on function public.my_nutritionist_id() to authenticated;
grant execute on function public.patient_has_full_access(uuid) to authenticated;
grant execute on function public.is_assigned_patient(uuid) to authenticated;
grant execute on function public.is_assigned_patient_path(text) to authenticated;
grant execute on function public.is_own_patient(uuid) to authenticated;

-- ============================================================
-- RLS: fail-closed, nutri por tenant y paciente por relación
-- ============================================================
alter table public.profiles enable row level security;
alter table public.nutritionists enable row level security;
alter table public.patients enable row level security;
alter table public.patient_invites enable row level security;
alter table public.patient_invite_events enable row level security;
alter table public.meal_slots enable row level security;
alter table public.meal_logs enable row level security;
alter table public.habit_logs enable row level security;
alter table public.reminders enable row level security;
alter table public.timeline_events enable row level security;
alter table public.patient_assets enable row level security;
alter table public.appointments enable row level security;
alter table public.messages enable row level security;
alter table public.ai_briefs enable row level security;
alter table public.payments enable row level security;
alter table public.payment_webhook_events enable row level security;
alter table public.audit_events enable row level security;
alter table public.privacy_requests enable row level security;

-- Profiles: cada usuario ve/edita la suya; columnas sensibles limitadas por GRANT.
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Nutritionists: lectura propia. La fila se crea sólo vía provision_nutritionist.
create policy nutritionists_select_own on public.nutritionists
  for select using (user_id = auth.uid());

-- Patients: la nutricionista gestiona sus filas. La paciente NO tiene policy
-- sobre la tabla cruda: lee patients_patient_view.
create policy patients_nutri_all on public.patients
  for all
  using (nutritionist_id = public.my_nutritionist_id())
  with check (nutritionist_id = public.my_nutritionist_id());

-- Invites: nutri crea y lee; transiciones vía RPC/service role (sin UPDATE/DELETE).
create policy patient_invites_nutri_select on public.patient_invites
  for select
  using (nutritionist_id = public.my_nutritionist_id());

create policy patient_invites_nutri_insert on public.patient_invites
  for insert
  with check (nutritionist_id = public.my_nutritionist_id());

-- Meal slots (plantilla semanal): nutri completo; paciente sólo lectura con acceso.
create policy meal_slots_nutri_all on public.meal_slots
  for all
  using (public.is_assigned_patient(patient_id))
  with check (public.is_assigned_patient(patient_id));

create policy meal_slots_patient_select on public.meal_slots
  for select
  using (patient_id = public.my_patient_id() and public.patient_has_full_access(patient_id));

-- Meal logs: nutri completo. Paciente inserta pendiente; lee meal_logs_patient_view.
create policy meal_logs_nutri_all on public.meal_logs
  for all
  using (public.is_assigned_patient(patient_id))
  with check (public.is_assigned_patient(patient_id));

create policy meal_logs_patient_insert on public.meal_logs
  for insert
  with check (
    patient_id = public.my_patient_id()
    and public.patient_has_full_access(patient_id)
    and status = 'pending_review'
    and note_for_nutri = ''
    and (photo_path is null or photo_path like 'patients/' || patient_id::text || '/%')
  );

-- Habit logs: nutri completo; paciente registra y lee sus días si tiene acceso.
create policy habit_logs_nutri_all on public.habit_logs
  for all
  using (public.is_assigned_patient(patient_id))
  with check (public.is_assigned_patient(patient_id));

create policy habit_logs_patient_select on public.habit_logs
  for select using (patient_id = public.my_patient_id() and public.patient_has_full_access(patient_id));

create policy habit_logs_patient_insert on public.habit_logs
  for insert
  with check (patient_id = public.my_patient_id() and public.patient_has_full_access(patient_id));

create policy habit_logs_patient_update on public.habit_logs
  for update
  using (patient_id = public.my_patient_id() and public.patient_has_full_access(patient_id))
  with check (patient_id = public.my_patient_id() and public.patient_has_full_access(patient_id));

-- Reminders: lectura paciente si tiene acceso; gestión profesional.
create policy reminders_nutri_all on public.reminders
  for all
  using (public.is_assigned_patient(patient_id))
  with check (public.is_assigned_patient(patient_id));

create policy reminders_patient_select on public.reminders
  for select
  using (patient_id = public.my_patient_id() and public.patient_has_full_access(patient_id));

-- Timeline: la nutricionista ve todo; la paciente sólo eventos marcados para ella.
create policy timeline_events_nutri_all on public.timeline_events
  for all
  using (public.is_assigned_patient(patient_id))
  with check (public.is_assigned_patient(patient_id));

create policy timeline_events_patient_select on public.timeline_events
  for select
  using (
    patient_id = public.my_patient_id()
    and visibility = 'patient'
    and public.patient_has_full_access(patient_id)
  );

-- Patient assets: manifiesto service-managed; nutri puede leer el inventario.
create policy patient_assets_nutri_select on public.patient_assets
  for select
  using (nutritionist_id = public.my_nutritionist_id());

-- Appointments: nutri gestiona. Paciente lee appointments_patient_view (sin prep_note).
create policy appointments_nutri_all on public.appointments
  for all
  using (nutritionist_id = public.my_nutritionist_id())
  with check (nutritionist_id = public.my_nutritionist_id());

-- Messages: inmutables para authenticated (sin policies UPDATE/DELETE ni grants).
-- Nutri lee/inserta como sí misma; paciente inserta como sí mismo y lee la vista.
create policy messages_nutri_select on public.messages
  for select
  using (nutritionist_id = public.my_nutritionist_id());

create policy messages_nutri_insert on public.messages
  for insert
  with check (
    nutritionist_id = public.my_nutritionist_id()
    and author_id = auth.uid()
  );

create policy messages_patient_insert on public.messages
  for insert
  with check (
    patient_id = public.my_patient_id()
    and author_id = auth.uid()
    and suggested_by_ai = false
    and sent_at is not null
  );

-- AI briefs: exclusivamente profesional.
create policy ai_briefs_nutri_all on public.ai_briefs
  for all
  using (nutritionist_id = public.my_nutritionist_id())
  with check (nutritionist_id = public.my_nutritionist_id());

-- Payments: nutri sólo lectura. Altas/cambios vía service role/webhook verificado.
create policy payments_nutri_select on public.payments
  for select
  using (nutritionist_id = public.my_nutritionist_id());

-- payment_webhook_events, audit_events, privacy_requests, patient_invite_events:
-- sin policies para authenticated → service role únicamente.

-- ============================================================
-- Vistas de paciente (security definer: el owner postgres no pasa RLS;
-- el WHERE filtra por la identidad del caller en cada request)
-- ============================================================
create or replace view public.patients_patient_view
as
  select
    id,
    user_id,
    full_name,
    initials,
    tone,
    billing_status,
    billing_until,
    created_at
  from public.patients
  where user_id = auth.uid();

create or replace view public.meal_logs_patient_view
as
  select
    id,
    patient_id,
    meal_slot_id,
    slot_label,
    photo_path,
    description,
    foods,
    macros,
    confidence,
    status,
    logged_at
  from public.meal_logs
  where patient_id = public.my_patient_id()
    and public.patient_has_full_access(public.my_patient_id());

-- Mensajes enviados, incluidos los nacidos de borrador IA: se oculta el flag,
-- no el mensaje. Borradores (sent_at null) nunca salen.
create or replace view public.messages_patient_view
as
  select
    id,
    patient_id,
    author_id,
    body,
    sent_at,
    created_at
  from public.messages
  where patient_id = public.my_patient_id()
    and sent_at is not null;

-- Sin prep_note ni campos internos; sólo con acceso de cobranza vigente.
create or replace view public.appointments_patient_view
as
  select
    id,
    patient_id,
    starts_at,
    duration_min,
    channel,
    status,
    meet_url,
    created_at
  from public.appointments
  where patient_id = public.my_patient_id()
    and public.patient_has_full_access(public.my_patient_id());

grant select on public.patients_patient_view to authenticated;
grant select on public.meal_logs_patient_view to authenticated;
grant select on public.messages_patient_view to authenticated;
grant select on public.appointments_patient_view to authenticated;

-- ============================================================
-- Storage: bucket privado para fotos de comidas
-- ============================================================
-- DO UPDATE fuerza la configuración segura aunque el bucket ya exista.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meal-photos',
  'meal-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Todas las policies exigen la forma canónica patients/<patient_id>/<archivo>.
create policy meal_photos_nutri_select on storage.objects
  for select
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = 'patients'
    and public.is_assigned_patient_path((storage.foldername(name))[2])
  );

create policy meal_photos_patient_select on storage.objects
  for select
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = 'patients'
    and (storage.foldername(name))[2] = public.my_patient_id()::text
    and public.patient_has_full_access(public.my_patient_id())
  );

create policy meal_photos_patient_insert on storage.objects
  for insert
  with check (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = 'patients'
    and (storage.foldername(name))[2] = public.my_patient_id()::text
    and public.patient_has_full_access(public.my_patient_id())
  );

create policy meal_photos_nutri_update on storage.objects
  for update
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = 'patients'
    and public.is_assigned_patient_path((storage.foldername(name))[2])
  );

create policy meal_photos_nutri_delete on storage.objects
  for delete
  using (
    bucket_id = 'meal-photos'
    and (storage.foldername(name))[1] = 'patients'
    and public.is_assigned_patient_path((storage.foldername(name))[2])
  );

-- ============================================================
-- Grants: matriz explícita (RLS es la compuerta; los grants habilitan comandos)
-- ============================================================
revoke all on public.profiles from anon, authenticated;
revoke all on public.nutritionists from anon, authenticated;
revoke all on public.patients from anon, authenticated;
revoke all on public.patient_invites from anon, authenticated;
revoke all on public.patient_invite_events from anon, authenticated;
revoke all on public.meal_slots from anon, authenticated;
revoke all on public.meal_logs from anon, authenticated;
revoke all on public.habit_logs from anon, authenticated;
revoke all on public.reminders from anon, authenticated;
revoke all on public.timeline_events from anon, authenticated;
revoke all on public.patient_assets from anon, authenticated;
revoke all on public.appointments from anon, authenticated;
revoke all on public.messages from anon, authenticated;
revoke all on public.ai_briefs from anon, authenticated;
revoke all on public.payments from anon, authenticated;
revoke all on public.payment_webhook_events from anon, authenticated;
revoke all on public.audit_events from anon, authenticated;
revoke all on public.privacy_requests from anon, authenticated;

-- Profiles: role NUNCA es autogestionable (grant por columna, no de tabla).
grant select (id, role, full_name, avatar_url, created_at) on public.profiles to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- Nutritionists: lectura propia; escritura sólo vía RPC service_role.
grant select on public.nutritionists to authenticated;

-- Patients: RLS nutri filtra filas; el UPDATE por columna excluye id,
-- nutritionist_id, user_id, billing_status, billing_until y lifecycle
-- (esos los mueve service role / accept_patient_invite / webhooks).
grant select on public.patients to authenticated;
grant insert, delete on public.patients to authenticated;
grant update (
  full_name, initials, tone, stage, status, goal, sensitive_hours, plan_b,
  next_focus, adherence_score, adherence_why
) on public.patients to authenticated;

-- Invites: nutri crea y lee; no edita ni borra (RPCs/service role).
grant select, insert on public.patient_invites to authenticated;

-- Plan/registros con RLS por rol; grants amplios porque RLS decide por comando.
grant select, insert, update, delete on public.meal_slots to authenticated;
grant select, insert, update, delete on public.habit_logs to authenticated;
grant select, insert, update, delete on public.reminders to authenticated;
grant select, insert, update, delete on public.timeline_events to authenticated;

-- Meal logs: nutri all por RLS; paciente sólo INSERT por RLS (sin SELECT/UPDATE).
grant select, insert, update, delete on public.meal_logs to authenticated;

-- Appointments: nutri all por RLS; paciente sin policy (usa la vista).
grant select, insert, update, delete on public.appointments to authenticated;

-- Messages: inmutables — sólo SELECT/INSERT, sin UPDATE/DELETE para authenticated.
grant select, insert on public.messages to authenticated;

-- AI briefs: profesional (RLS), sin acceso paciente.
grant select, insert, update, delete on public.ai_briefs to authenticated;

-- Payments: nutri sólo lectura; webhooks/service role escriben.
grant select on public.payments to authenticated;

-- Patient assets: inventario visible para la nutri (RLS); escritura service role.
grant select on public.patient_assets to authenticated;

-- ============================================================
-- Checklist de validación manual posterior a aprobación
-- ============================================================
-- 1. Nutri A no puede leer/escribir pacientes, mensajes, briefs, pagos ni fotos de Nutri B.
-- 2. Paciente no tiene policy SELECT sobre patients/meal_logs/messages/appointments:
--    sólo las vistas definer, sin note_for_nutri/adherence_why/suggested_by_ai/prep_note.
-- 3. Paciente no puede cambiar profiles.role ni patients.billing_*/user_id
--    (permission denied por grant de columna, aunque la policy lo permitiera).
-- 4. Paciente con billing pending/past_due no lee fotos, meal logs ni appointments.
-- 5. Nutri no puede insertar mensajes con author_id ajeno ni editar/borrar mensajes.
-- 6. Nutri no puede marcar payments approved ni tocar billing: sólo service role.
-- 7. accept_patient_invite: una sola vez, email confirmado y coincidente, expira.
-- 8. payment_webhook_events acepta cada (provider, external_event_id) una sola vez.
-- 9. Borrar un paciente con pagos falla (restrict) hasta resolver retención/anonomización.
-- 10. meal_logs.meal_slot_id de otro paciente es rechazado por trigger.
