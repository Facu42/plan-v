-- Seguimientos de leads, avisos de cobranza, borradores y checklist ocultable.
-- No se aplica sola. Hace falta la frase de Facundo.
-- Reversión, en este orden: drop table public.platform_daily_briefs, public.platform_onboarding_dismissals,
--   public.platform_inbox_drafts, public.platform_dunning_attempts, public.platform_lead_followups;

create table if not exists public.platform_lead_followups (
  id uuid primary key,
  lead_id uuid not null references public.platform_leads(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 140),
  due_on date not null,
  done boolean not null default false,
  created_at timestamptz not null default clock_timestamp()
);

create unique index if not exists platform_lead_followups_open_idx
  on public.platform_lead_followups (lead_id, title)
  where done = false;

create index if not exists platform_lead_followups_lead_idx
  on public.platform_lead_followups (lead_id, due_on);

create table if not exists public.platform_dunning_attempts (
  id uuid primary key,
  payment_id text not null check (char_length(payment_id) between 1 and 80),
  nutritionist_id uuid references public.nutritionists(id) on delete set null,
  kind text not null check (kind in ('aviso', 'releer')),
  estado text not null check (estado in ('enviado', 'apagado', 'fallido', 'leido')),
  detalle text not null default '' check (char_length(detalle) <= 280),
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists platform_dunning_attempts_payment_idx
  on public.platform_dunning_attempts (payment_id, created_at desc);

create index if not exists platform_dunning_attempts_nutritionist_idx
  on public.platform_dunning_attempts (nutritionist_id);

create table if not exists public.platform_inbox_drafts (
  id uuid primary key,
  thread_id uuid not null references public.platform_inbox_threads(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 500),
  origen text not null check (origen in ('ia', 'plantilla')),
  created_at timestamptz not null default clock_timestamp()
);

create index if not exists platform_inbox_drafts_thread_idx
  on public.platform_inbox_drafts (thread_id, created_at desc);

create table if not exists public.platform_onboarding_dismissals (
  nutritionist_id uuid primary key references public.nutritionists(id) on delete cascade,
  dismissed_at timestamptz not null default clock_timestamp()
);

create table if not exists public.platform_daily_briefs (
  day date primary key,
  body text not null check (char_length(body) between 1 and 600),
  origen text not null check (origen in ('numeros', 'ia')),
  created_at timestamptz not null default clock_timestamp()
);

alter table public.platform_lead_followups enable row level security;
alter table public.platform_dunning_attempts enable row level security;
alter table public.platform_inbox_drafts enable row level security;
alter table public.platform_onboarding_dismissals enable row level security;
alter table public.platform_daily_briefs enable row level security;

revoke all on public.platform_lead_followups, public.platform_dunning_attempts,
  public.platform_inbox_drafts, public.platform_onboarding_dismissals, public.platform_daily_briefs
  from public, anon, authenticated;

grant select, insert, update, delete on public.platform_lead_followups, public.platform_dunning_attempts,
  public.platform_inbox_drafts, public.platform_onboarding_dismissals, public.platform_daily_briefs
  to service_role;

grant select, insert, delete on public.platform_onboarding_dismissals to authenticated;

drop policy if exists platform_lead_followups_admin on public.platform_lead_followups;
create policy platform_lead_followups_admin on public.platform_lead_followups
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists platform_dunning_attempts_admin on public.platform_dunning_attempts;
create policy platform_dunning_attempts_admin on public.platform_dunning_attempts
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists platform_inbox_drafts_admin on public.platform_inbox_drafts;
create policy platform_inbox_drafts_admin on public.platform_inbox_drafts
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists platform_daily_briefs_admin on public.platform_daily_briefs;
create policy platform_daily_briefs_admin on public.platform_daily_briefs
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists platform_onboarding_dismissals_admin on public.platform_onboarding_dismissals;
drop policy if exists platform_onboarding_dismissals_own on public.platform_onboarding_dismissals;
drop policy if exists platform_onboarding_dismissals_access on public.platform_onboarding_dismissals;
create policy platform_onboarding_dismissals_access on public.platform_onboarding_dismissals
  for all to authenticated
  using (
    public.is_platform_admin()
    or nutritionist_id in (select id from public.nutritionists where user_id = (select auth.uid() as uid))
  )
  with check (
    public.is_platform_admin()
    or nutritionist_id in (select id from public.nutritionists where user_id = (select auth.uid() as uid))
  );
