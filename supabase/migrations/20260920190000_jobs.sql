-- Cola durable del piloto. Service role / worker. No aplica a un proyecto con pacientes:
-- npm run apply:disposable aborta si public.patients tiene filas.
create table if not exists public.processing_jobs (
  id uuid primary key,
  kind text not null check (kind in ('menu_draft', 'purge_asset', 'fail')),
  payload jsonb not null default '{}'::jsonb,
  status text not null check (status in ('queued', 'leased', 'succeeded', 'failed', 'dead')),
  attempts int not null default 0,
  max_attempts int not null default 5,
  lease_owner text,
  lease_until timestamptz,
  run_after timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists processing_jobs_lease on public.processing_jobs (status, run_after, created_at);
alter table public.processing_jobs enable row level security;
revoke all on public.processing_jobs from public, anon, authenticated;
