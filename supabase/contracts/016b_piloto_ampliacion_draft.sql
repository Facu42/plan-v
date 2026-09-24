-- ⛔ DRAFT 016b — REVIEW ONLY — DO NOT APPLY / NO CORRER
-- Ampliación del piloto sobre 016 v2. No es migración. No ejecutar ni concatenar
-- a supabase/migrations. Depende de helpers y tablas de
-- 016_plan_v_contract_draft.sql (my_patient_id, my_nutritionist_id,
-- patient_has_full_access, is_assigned_patient, unique (id, nutritionist_id)).
--
-- Alcance piloto (H1–H4): intake, consentimientos, archivos por categoría,
-- recetas/planes versionados, recibos, historial de turnos, jobs de IA,
-- outbox y recursos editoriales.
-- Fuera de este archivo (extensiones post-piloto): exercise_library,
-- organizations/equipos, shopping_lists persistidas, presupuesto de compras.

create extension if not exists "pgcrypto";

-- ============================================================
-- Enums del piloto ampliado
-- ============================================================
do $$ begin
  create type public.intake_status as enum ('draft', 'submitted', 'reviewed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.health_fact_state as enum ('unknown', 'none', 'reported');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.consent_purpose as enum (
    'care_relationship',
    'meal_photo',
    'clinical_document',
    'body_progress',
    'measurement',
    'ai_meal_analysis',
    'ai_menu_draft'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.consent_decision as enum ('granted', 'withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.asset_category as enum ('meal_photo', 'clinical_document', 'body_progress');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.asset_status as enum ('reserved', 'quarantine', 'ready', 'rejected', 'withdrawn');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.recipe_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.plan_status as enum ('draft', 'published', 'superseded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ai_job_type as enum ('meal_analysis', 'menu_draft', 'recipe_draft');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ai_job_status as enum ('queued', 'running', 'succeeded', 'failed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.appointment_event_action as enum (
    'scheduled', 'rescheduled', 'patient_rescheduled', 'cancelled', 'elapsed'
  );
exception when duplicate_object then null; end $$;

-- ============================================================
-- Identidad de contacto e ingreso
-- ============================================================
create table if not exists public.patient_contacts (
  patient_id uuid primary key references public.patients(id) on delete cascade,
  preferred_name text not null default '',
  phone text,
  timezone text not null default 'America/Argentina/Buenos_Aires',
  updated_at timestamptz not null default now()
);

create table if not exists public.intake_sessions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  schema_version text not null,
  status public.intake_status not null default 'draft',
  step text not null default 'start',
  revision int not null default 1 check (revision >= 1),
  payload jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade,
  check (status <> 'submitted' or submitted_at is not null),
  check (status <> 'reviewed' or reviewed_at is not null)
);

create unique index if not exists intake_sessions_one_draft_per_patient
  on public.intake_sessions (patient_id)
  where status = 'draft';

create table if not exists public.patient_health_profiles (
  patient_id uuid primary key,
  nutritionist_id uuid not null,
  allergies_state public.health_fact_state not null default 'unknown',
  allergies text[] not null default '{}',
  restrictions_state public.health_fact_state not null default 'unknown',
  restrictions text[] not null default '{}',
  origin text not null default 'self_reported',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create table if not exists public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  author_id uuid not null references public.profiles(id),
  version int not null default 1,
  body text not null,
  created_at timestamptz not null default now(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create table if not exists public.consent_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  purpose public.consent_purpose not null,
  text_version text not null,
  text_hash text not null,
  actor_id uuid not null references public.profiles(id),
  decision public.consent_decision not null,
  scope jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create index if not exists consent_events_patient_purpose_idx
  on public.consent_events (patient_id, purpose, created_at desc);

-- ============================================================
-- Archivos, estudios, fotos corporales y mediciones
-- ============================================================
create table if not exists public.asset_upload_intents (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  category public.asset_category not null,
  object_path text not null unique,
  mime_declared text not null,
  byte_limit int not null,
  status public.asset_status not null default 'reserved',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade,
  check (object_path like 'patients/' || patient_id::text || '/%')
);

create table if not exists public.document_records (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.patient_assets(id) on delete restrict,
  patient_id uuid not null,
  nutritionist_id uuid not null,
  document_kind text not null,
  captured_on date,
  patient_note text not null default '',
  professional_review text,
  created_at timestamptz not null default now(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create table if not exists public.body_photo_entries (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.patient_assets(id) on delete restrict,
  patient_id uuid not null,
  nutritionist_id uuid not null,
  view text check (view in ('front', 'side', 'back') or view is null),
  captured_on date not null,
  purpose_authorized boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  kind text not null check (kind in ('weight', 'waist', 'hip', 'other')),
  value_numeric numeric not null,
  unit text not null,
  source text not null check (source in ('patient', 'professional')),
  captured_on date not null,
  created_at timestamptz not null default now(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

-- ============================================================
-- Recetas y planes versionados
-- ============================================================
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  name_normalized text not null,
  base_unit text not null,
  created_at timestamptz not null default now(),
  unique (nutritionist_id, name_normalized)
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  title text not null,
  status public.recipe_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table if not exists public.recipe_versions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  version int not null check (version >= 1),
  yield_portions numeric not null check (yield_portions > 0),
  steps jsonb not null default '[]'::jsonb,
  nutrient_source text,
  reviewer_id uuid references public.profiles(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (recipe_id, version)
);

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_version_id uuid not null references public.recipe_versions(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id),
  quantity numeric not null check (quantity > 0),
  unit text not null
);

create table if not exists public.recipe_assignments (
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  patient_id uuid not null,
  nutritionist_id uuid not null,
  recipe_version_id uuid not null references public.recipe_versions(id),
  assigned_at timestamptz not null default now(),
  primary key (recipe_id, patient_id),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  timezone text not null default 'America/Argentina/Buenos_Aires',
  created_at timestamptz not null default now(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create table if not exists public.meal_plan_versions (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid not null references public.meal_plans(id) on delete cascade,
  version int not null check (version >= 1),
  status public.plan_status not null default 'draft',
  period_start date not null,
  period_end date not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique (meal_plan_id, version),
  check (period_end >= period_start),
  check (status <> 'published' or published_at is not null)
);

create unique index if not exists meal_plan_versions_one_published
  on public.meal_plan_versions (meal_plan_id)
  where status = 'published';

create table if not exists public.meal_plan_items (
  id uuid primary key default gen_random_uuid(),
  meal_plan_version_id uuid not null references public.meal_plan_versions(id) on delete cascade,
  for_date date not null,
  slot public.meal_slot_kind not null,
  recipe_version_id uuid references public.recipe_versions(id),
  free_text text,
  portions numeric,
  public_note text not null default '',
  check (recipe_version_id is not null or (free_text is not null and char_length(free_text) > 0))
);

-- ============================================================
-- Diario de comidas: análisis y revisión separados del registro
-- ============================================================
create table if not exists public.meal_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  meal_log_id uuid not null references public.meal_logs(id) on delete cascade,
  ai_job_id uuid,
  status text not null check (status in ('pending', 'succeeded', 'failed')),
  foods jsonb,
  macros jsonb,
  confidence numeric,
  error_code text,
  created_at timestamptz not null default now()
);

create table if not exists public.meal_reviews (
  id uuid primary key default gen_random_uuid(),
  meal_log_id uuid not null references public.meal_logs(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id),
  status public.meal_log_status not null,
  foods jsonb,
  macros jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Hábitos extendidos, objetivos, actividad
-- ============================================================
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  activity text not null,
  duration_minutes int not null check (duration_minutes between 1 and 600),
  intensity text not null check (intensity in ('suave', 'moderada', 'intensa')),
  note text,
  logged_at timestamptz not null default now(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  title text not null,
  status text not null check (status in ('active', 'paused', 'completed')),
  progress int not null default 0 check (progress between 0 and 100),
  updated_at timestamptz not null default now(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create table if not exists public.goal_history (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  status text not null,
  progress int not null,
  note text,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Mensajes: recibos; turnos: historial append-only
-- ============================================================
create table if not exists public.message_receipts (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  delivered_at timestamptz,
  read_at timestamptz,
  primary key (message_id, user_id)
);

create table if not exists public.appointment_events (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  patient_id uuid not null,
  nutritionist_id uuid not null,
  action public.appointment_event_action not null,
  actor_role text not null check (actor_role in ('pro', 'patient', 'system')),
  starts_at timestamptz,
  duration_min int,
  channel public.appointment_channel,
  created_at timestamptz not null default now(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

-- ============================================================
-- Recursos, jobs de IA, outbox
-- ============================================================
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  slug text not null,
  title text not null,
  body text not null,
  published boolean not null default false,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (nutritionist_id, slug)
);

create table if not exists public.resource_assignments (
  resource_id uuid not null references public.resources(id) on delete cascade,
  patient_id uuid not null,
  nutritionist_id uuid not null,
  assigned_at timestamptz not null default now(),
  first_read_at timestamptz,
  primary key (resource_id, patient_id),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create table if not exists public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  requested_by uuid not null references public.profiles(id),
  job_type public.ai_job_type not null,
  status public.ai_job_status not null default 'queued',
  model text,
  prompt_version text,
  context_hash text,
  attempt int not null default 0,
  cost_tokens int,
  error_code text,
  created_at timestamptz not null default now(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create table if not exists public.ai_artifacts (
  id uuid primary key default gen_random_uuid(),
  ai_job_id uuid not null references public.ai_jobs(id) on delete cascade,
  kind text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.outbox_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  patient_id uuid,
  nutritionist_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  outbox_event_id uuid not null references public.outbox_events(id) on delete cascade,
  channel text not null check (channel in ('email', 'push', 'in_app')),
  recipient_user_id uuid,
  status text not null check (status in ('queued', 'sent', 'failed', 'skipped')),
  attempt int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- RLS mínimo del piloto ampliado (fail-closed)
-- ============================================================
alter table public.patient_contacts enable row level security;
alter table public.intake_sessions enable row level security;
alter table public.patient_health_profiles enable row level security;
alter table public.clinical_notes enable row level security;
alter table public.consent_events enable row level security;
alter table public.asset_upload_intents enable row level security;
alter table public.document_records enable row level security;
alter table public.body_photo_entries enable row level security;
alter table public.measurements enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_versions enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_assignments enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_plan_versions enable row level security;
alter table public.meal_plan_items enable row level security;
alter table public.meal_analysis_runs enable row level security;
alter table public.meal_reviews enable row level security;
alter table public.activity_logs enable row level security;
alter table public.goals enable row level security;
alter table public.goal_history enable row level security;
alter table public.message_receipts enable row level security;
alter table public.appointment_events enable row level security;
alter table public.resources enable row level security;
alter table public.resource_assignments enable row level security;
alter table public.ai_jobs enable row level security;
alter table public.ai_artifacts enable row level security;
alter table public.outbox_events enable row level security;
alter table public.notification_deliveries enable row level security;

-- Notas clínicas: sólo profesional asignado. Sin policy paciente.
create policy clinical_notes_nutri_all on public.clinical_notes
  for all
  using (nutritionist_id = public.my_nutritionist_id())
  with check (nutritionist_id = public.my_nutritionist_id() and author_id = auth.uid());

-- Consentimientos: append-only. Paciente inserta los propios; nutri lee.
create policy consent_events_patient_insert on public.consent_events
  for insert
  with check (patient_id = public.my_patient_id() and actor_id = auth.uid());

create policy consent_events_patient_select on public.consent_events
  for select
  using (patient_id = public.my_patient_id());

create policy consent_events_nutri_select on public.consent_events
  for select
  using (nutritionist_id = public.my_nutritionist_id());

-- Fotos corporales: sin IA; lectura con relación y consentimiento vigente queda
-- en la API. RLS: titular y nutri asignada.
create policy body_photo_entries_patient_select on public.body_photo_entries
  for select using (patient_id = public.my_patient_id());

create policy body_photo_entries_nutri_select on public.body_photo_entries
  for select using (nutritionist_id = public.my_nutritionist_id());

-- Recetas: nutri gestiona las propias. Paciente no lee la tabla cruda.
create policy recipes_nutri_all on public.recipes
  for all
  using (nutritionist_id = public.my_nutritionist_id())
  with check (nutritionist_id = public.my_nutritionist_id());

-- Jobs de IA: sólo profesional solicitante/asignado. Paciente sin acceso.
create policy ai_jobs_nutri_all on public.ai_jobs
  for all
  using (nutritionist_id = public.my_nutritionist_id())
  with check (nutritionist_id = public.my_nutritionist_id());

create policy ai_artifacts_nutri_select on public.ai_artifacts
  for select
  using (
    exists (
      select 1 from public.ai_jobs j
      where j.id = ai_job_id and j.nutritionist_id = public.my_nutritionist_id()
    )
  );

-- Outbox y deliveries: service role (sin policies authenticated).

-- ============================================================
-- Grants: notas clínicas y jobs no son visibles al paciente
-- ============================================================
revoke all on public.clinical_notes from anon, authenticated;
revoke all on public.ai_jobs from anon, authenticated;
revoke all on public.ai_artifacts from anon, authenticated;
revoke all on public.outbox_events from anon, authenticated;
revoke all on public.notification_deliveries from anon, authenticated;
revoke all on public.consent_events from anon, authenticated;

grant select, insert on public.clinical_notes to authenticated;
grant select, insert, update, delete on public.ai_jobs to authenticated;
grant select, insert on public.ai_artifacts to authenticated;
grant select, insert on public.consent_events to authenticated;
grant select, insert on public.body_photo_entries to authenticated;
grant select, insert, update, delete on public.recipes to authenticated;
grant select, insert on public.activity_logs to authenticated;
grant select, insert on public.message_receipts to authenticated;
grant select, insert on public.appointment_events to authenticated;

-- Consentimientos y notas: authenticated no tiene UPDATE/DELETE (append-only / historial).
grant select, insert on public.goal_history to authenticated;
