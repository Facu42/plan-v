-- PV-27: propuestas de receta y menu con job versionado. Solo el consultorio lee artefactos.
create table public.ai_jobs (
  id uuid primary key,
  patient_id uuid not null,
  nutritionist_id uuid not null,
  requested_by uuid,
  job_type text not null check (job_type in ('recipe', 'menu')),
  status text not null check (status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')),
  prompt_version text not null,
  context_hash text not null,
  attempt int not null default 0 check (attempt between 0 and 2),
  cost_tokens int,
  error_code text,
  created_at timestamptz not null default clock_timestamp(),
  started_at timestamptz,
  finished_at timestamptz,
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade,
  check ((status in ('queued', 'running')) = (finished_at is null)),
  check (cost_tokens is null or cost_tokens between 0 and 8000)
);
create unique index ai_jobs_one_open_per_type
  on public.ai_jobs (patient_id, job_type)
  where status in ('queued', 'running');
create index ai_jobs_owner_created on public.ai_jobs (nutritionist_id, created_at desc);

create table public.ai_artifacts (
  id uuid primary key default gen_random_uuid(),
  ai_job_id uuid not null references public.ai_jobs(id) on delete cascade,
  kind text not null check (kind in ('recipe', 'menu')),
  payload jsonb not null,
  created_at timestamptz not null default clock_timestamp(),
  unique (ai_job_id)
);

alter table public.ai_jobs enable row level security;
alter table public.ai_artifacts enable row level security;

create function public.ai_job_can_read(owner uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null and owner = public.my_nutritionist_id();
$$;

create policy ai_jobs_select on public.ai_jobs
  for select to authenticated
  using (public.ai_job_can_read(nutritionist_id));

create policy ai_artifacts_select on public.ai_artifacts
  for select to authenticated
  using (
    exists (
      select 1 from public.ai_jobs j
      where j.id = ai_job_id and public.ai_job_can_read(j.nutritionist_id)
    )
  );

revoke all on public.ai_jobs from public, anon, authenticated;
revoke all on public.ai_artifacts from public, anon, authenticated;
grant select on public.ai_jobs to authenticated;
grant select on public.ai_artifacts to authenticated;
revoke all on function public.ai_job_can_read(uuid) from public, anon;
grant execute on function public.ai_job_can_read(uuid) to authenticated;

create function public.ai_job_view(job public.ai_jobs)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare artifact public.ai_artifacts;
begin
  select * into artifact from public.ai_artifacts where ai_job_id = job.id;
  return jsonb_build_object(
    'id', job.id,
    'patient_id', job.patient_id,
    'nutritionist_id', job.nutritionist_id,
    'job_type', job.job_type,
    'status', job.status,
    'prompt_version', job.prompt_version,
    'context_hash', job.context_hash,
    'attempt', job.attempt,
    'cost_tokens', job.cost_tokens,
    'error_code', job.error_code,
    'created_at', job.created_at,
    'started_at', job.started_at,
    'finished_at', job.finished_at,
    'artifact', case when artifact.ai_job_id is null then null else jsonb_build_object('kind', artifact.kind, 'payload', artifact.payload) end
  );
end;
$$;

create function public.enqueue_ai_job(job_id uuid, patient_id uuid, job_type text, prompt_version text, context_hash text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare owner uuid := public.my_nutritionist_id();
declare existing public.ai_jobs;
declare result public.ai_jobs;
begin
  if owner is null then raise exception using errcode='42501', message='ai_job_pro_only'; end if;
  if job_type not in ('recipe', 'menu') then raise exception using errcode='22023', message='ai_job_type'; end if;
  if length(btrim(prompt_version)) not between 3 and 40 or length(btrim(context_hash)) not between 8 and 128 then
    raise exception using errcode='22023', message='ai_job_meta';
  end if;
  if not public.is_assigned_patient(patient_id) then raise exception using errcode='42501', message='ai_job_patient'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(patient_id::text), 27);
  select * into existing from public.ai_jobs where id = job_id;
  if found then
    if existing.nutritionist_id <> owner or existing.patient_id <> patient_id or existing.job_type <> job_type then
      raise exception using errcode='PT409', message='ai_job_mismatch';
    end if;
    return public.ai_job_view(existing);
  end if;
  if exists (
    select 1 from public.ai_jobs j
    where j.patient_id = enqueue_ai_job.patient_id and j.job_type = enqueue_ai_job.job_type and j.status in ('queued', 'running')
  ) then
    raise exception using errcode='PT409', message='ai_job_open';
  end if;
  insert into public.ai_jobs(id, patient_id, nutritionist_id, requested_by, job_type, status, prompt_version, context_hash)
    values (job_id, patient_id, owner, auth.uid(), job_type, 'queued', btrim(prompt_version), btrim(context_hash))
    returning * into result;
  return public.ai_job_view(result);
end;
$$;

create function public.start_ai_job(job_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare owner uuid := public.my_nutritionist_id();
declare result public.ai_jobs;
begin
  if owner is null then raise exception using errcode='42501', message='ai_job_pro_only'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(job_id::text), 27);
  select * into result from public.ai_jobs where id = job_id and nutritionist_id = owner for update;
  if not found then raise exception using errcode='PT404', message='ai_job_missing'; end if;
  if result.status = 'running' then return public.ai_job_view(result); end if;
  if result.status <> 'queued' then raise exception using errcode='PT409', message='ai_job_state'; end if;
  if result.attempt >= 2 then raise exception using errcode='PT409', message='ai_job_attempts'; end if;
  update public.ai_jobs
    set status = 'running', attempt = attempt + 1, started_at = clock_timestamp(), error_code = null
    where id = job_id
    returning * into result;
  return public.ai_job_view(result);
end;
$$;

create function public.complete_ai_job(job_id uuid, cost_tokens int, artifact_kind text, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare owner uuid := public.my_nutritionist_id();
declare result public.ai_jobs;
begin
  if owner is null then raise exception using errcode='42501', message='ai_job_pro_only'; end if;
  if artifact_kind not in ('recipe', 'menu') or jsonb_typeof(payload) is distinct from 'object' then
    raise exception using errcode='22023', message='ai_job_artifact';
  end if;
  if cost_tokens is null or cost_tokens < 0 or cost_tokens > 8000 then
    raise exception using errcode='22023', message='ai_job_cost';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(job_id::text), 27);
  select * into result from public.ai_jobs where id = job_id and nutritionist_id = owner for update;
  if not found then raise exception using errcode='PT404', message='ai_job_missing'; end if;
  if result.status = 'succeeded' then return public.ai_job_view(result); end if;
  if result.status <> 'running' then raise exception using errcode='PT409', message='ai_job_state'; end if;
  if result.job_type is distinct from artifact_kind then raise exception using errcode='22023', message='ai_job_artifact'; end if;
  insert into public.ai_artifacts(ai_job_id, kind, payload) values (job_id, artifact_kind, payload)
    on conflict (ai_job_id) do update set payload = excluded.payload, kind = excluded.kind;
  update public.ai_jobs
    set status = 'succeeded', cost_tokens = complete_ai_job.cost_tokens, error_code = null, finished_at = clock_timestamp()
    where id = job_id
    returning * into result;
  return public.ai_job_view(result);
end;
$$;

create function public.fail_ai_job(job_id uuid, error_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare owner uuid := public.my_nutritionist_id();
declare result public.ai_jobs;
begin
  if owner is null then raise exception using errcode='42501', message='ai_job_pro_only'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(job_id::text), 27);
  select * into result from public.ai_jobs where id = job_id and nutritionist_id = owner for update;
  if not found then raise exception using errcode='PT404', message='ai_job_missing'; end if;
  if result.status in ('succeeded', 'failed', 'cancelled') then return public.ai_job_view(result); end if;
  update public.ai_jobs
    set status = 'failed', error_code = left(coalesce(nullif(btrim(error_code), ''), 'AI_UNAVAILABLE'), 40), finished_at = clock_timestamp()
    where id = job_id
    returning * into result;
  return public.ai_job_view(result);
end;
$$;

create function public.cancel_ai_job(job_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare owner uuid := public.my_nutritionist_id();
declare result public.ai_jobs;
begin
  if owner is null then raise exception using errcode='42501', message='ai_job_pro_only'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(job_id::text), 27);
  select * into result from public.ai_jobs where id = job_id and nutritionist_id = owner for update;
  if not found then raise exception using errcode='PT404', message='ai_job_missing'; end if;
  if result.status in ('succeeded', 'failed', 'cancelled') then return public.ai_job_view(result); end if;
  update public.ai_jobs
    set status = 'cancelled', error_code = 'cancelled', finished_at = clock_timestamp()
    where id = job_id
    returning * into result;
  return public.ai_job_view(result);
end;
$$;

revoke all on function public.ai_job_view(public.ai_jobs),
  public.enqueue_ai_job(uuid, uuid, text, text, text),
  public.start_ai_job(uuid),
  public.complete_ai_job(uuid, int, text, jsonb),
  public.fail_ai_job(uuid, text),
  public.cancel_ai_job(uuid)
  from public, anon;
grant execute on function
  public.enqueue_ai_job(uuid, uuid, text, text, text),
  public.start_ai_job(uuid),
  public.complete_ai_job(uuid, int, text, jsonb),
  public.fail_ai_job(uuid, text),
  public.cancel_ai_job(uuid)
  to authenticated;
