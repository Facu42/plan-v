-- Centro comercial de /admin: leads, notas, tareas y bandeja.
-- No se aplica sola. Hace falta la frase de Facundo.
-- Reversión: drop table public.platform_inbox_messages, public.platform_inbox_threads,
--   public.platform_nutri_tasks, public.platform_nutri_notes, public.platform_leads;

create table if not exists public.platform_leads (
  id uuid primary key,
  name text not null check (char_length(btrim(name)) between 2 and 80),
  contact text not null default '' check (char_length(contact) <= 120),
  source text not null check (source in ('ig', 'wa', 'web', 'referido', 'email')),
  stage text not null check (stage in ('lead', 'demo', 'trial', 'paga', 'baja')),
  next_step text not null default '' check (char_length(next_step) <= 200),
  nutritionist_id uuid references public.nutritionists(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create index if not exists platform_leads_nutritionist_idx on public.platform_leads (nutritionist_id);
create index if not exists platform_leads_stage_idx on public.platform_leads (stage);

create table if not exists public.platform_nutri_notes (
  id uuid primary key,
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists platform_nutri_notes_nutritionist_idx
  on public.platform_nutri_notes (nutritionist_id, created_at desc);

create table if not exists public.platform_nutri_tasks (
  id uuid primary key,
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 140),
  due_on date,
  done boolean not null default false,
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists platform_nutri_tasks_nutritionist_idx
  on public.platform_nutri_tasks (nutritionist_id, done, created_at desc);

create table if not exists public.platform_inbox_threads (
  id uuid primary key,
  channel text not null check (channel in ('whatsapp', 'instagram', 'email')),
  contact_name text not null check (char_length(btrim(contact_name)) between 1 and 80),
  contact_handle text not null default '' check (char_length(contact_handle) <= 120),
  status text not null default 'abierto' check (status in ('abierto', 'esperando', 'cerrado')),
  lead_id uuid references public.platform_leads(id) on delete set null,
  nutritionist_id uuid references public.nutritionists(id) on delete set null,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp()
);

create index if not exists platform_inbox_threads_lead_idx on public.platform_inbox_threads (lead_id);
create index if not exists platform_inbox_threads_nutritionist_idx on public.platform_inbox_threads (nutritionist_id);
create index if not exists platform_inbox_threads_updated_idx on public.platform_inbox_threads (updated_at desc);

create table if not exists public.platform_inbox_messages (
  id uuid primary key,
  thread_id uuid not null references public.platform_inbox_threads(id) on delete cascade,
  direction text not null check (direction in ('in', 'out')),
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  sent_at timestamptz not null default clock_timestamp()
);

create index if not exists platform_inbox_messages_thread_idx
  on public.platform_inbox_messages (thread_id, sent_at);

alter table public.platform_leads enable row level security;
alter table public.platform_nutri_notes enable row level security;
alter table public.platform_nutri_tasks enable row level security;
alter table public.platform_inbox_threads enable row level security;
alter table public.platform_inbox_messages enable row level security;

revoke all on public.platform_leads, public.platform_nutri_notes, public.platform_nutri_tasks,
  public.platform_inbox_threads, public.platform_inbox_messages
  from public, anon, authenticated;

grant select, insert, update, delete on public.platform_leads, public.platform_nutri_notes,
  public.platform_nutri_tasks, public.platform_inbox_threads, public.platform_inbox_messages
  to service_role;

drop policy if exists platform_leads_admin on public.platform_leads;
create policy platform_leads_admin on public.platform_leads
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists platform_nutri_notes_admin on public.platform_nutri_notes;
create policy platform_nutri_notes_admin on public.platform_nutri_notes
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists platform_nutri_tasks_admin on public.platform_nutri_tasks;
create policy platform_nutri_tasks_admin on public.platform_nutri_tasks
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists platform_inbox_threads_admin on public.platform_inbox_threads;
create policy platform_inbox_threads_admin on public.platform_inbox_threads
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists platform_inbox_messages_admin on public.platform_inbox_messages;
create policy platform_inbox_messages_admin on public.platform_inbox_messages
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());
