-- PV-27: jobs de IA versionados para receta/menú, límites de costo/tiempo,
-- contexto mínimo y borradores profesionales. El worker no publica.
-- Solo Postgres vacío/descartable. apply:disposable aborta si public.patients tiene filas.
-- No aplicar en un proyecto hospedado con pacientes.

do $$ begin
  create type public.ai_job_type as enum ('recipe_draft', 'menu_draft');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ai_job_status as enum ('queued', 'running', 'succeeded', 'failed', 'cancelled', 'stale');
exception when duplicate_object then null; end $$;

alter table public.processing_jobs drop constraint if exists processing_jobs_kind_check;
alter table public.processing_jobs
  add constraint processing_jobs_kind_check
  check (kind in ('menu_draft', 'recipe_draft', 'purge_asset', 'fail'));

create table if not exists public.ai_jobs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  requested_by uuid not null references public.profiles(id),
  job_type public.ai_job_type not null,
  status public.ai_job_status not null default 'queued',
  model text not null default 'demo',
  prompt_version text not null,
  context_hash text not null check (char_length(context_hash) = 64),
  request jsonb not null default '{}'::jsonb,
  attempt int not null default 0 check (attempt >= 0),
  cost_tokens int,
  error_code text,
  warnings jsonb not null default '[]'::jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade,
  check (jsonb_typeof(request) = 'object'),
  check (jsonb_typeof(warnings) = 'array')
);

create table if not exists public.ai_artifacts (
  id uuid primary key default gen_random_uuid(),
  ai_job_id uuid not null unique references public.ai_jobs(id) on delete cascade,
  kind text not null check (kind in ('recipe_draft', 'menu_draft', 'replacement')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(payload) = 'object')
);

create index if not exists ai_jobs_nutri_created_idx
  on public.ai_jobs (nutritionist_id, created_at desc);
create index if not exists ai_jobs_patient_idx
  on public.ai_jobs (patient_id, created_at desc);
create index if not exists ai_jobs_status_idx
  on public.ai_jobs (nutritionist_id, status);

alter table public.ai_jobs enable row level security;
alter table public.ai_artifacts enable row level security;

revoke all on public.ai_jobs, public.ai_artifacts from public, anon, authenticated;
grant select on public.ai_jobs, public.ai_artifacts to authenticated;

drop policy if exists ai_jobs_nutri_select on public.ai_jobs;
create policy ai_jobs_nutri_select on public.ai_jobs
  for select to authenticated
  using (nutritionist_id = public.my_nutritionist_id());

drop policy if exists ai_artifacts_nutri_select on public.ai_artifacts;
create policy ai_artifacts_nutri_select on public.ai_artifacts
  for select to authenticated
  using (
    exists (
      select 1 from public.ai_jobs j
      where j.id = ai_job_id and j.nutritionist_id = public.my_nutritionist_id()
    )
  );

create or replace function public.ai_job_json(jid uuid)
returns jsonb language sql stable security definer set search_path='' as $$
  select jsonb_build_object(
    'id', j.id,
    'patient_id', j.patient_id,
    'job_type', j.job_type,
    'status', j.status,
    'model', j.model,
    'prompt_version', j.prompt_version,
    'context_hash', j.context_hash,
    'attempt', j.attempt,
    'cost_tokens', j.cost_tokens,
    'error_code', j.error_code,
    'warnings', j.warnings,
    'created_at', j.created_at,
    'started_at', j.started_at,
    'finished_at', j.finished_at,
    'applied_at', j.applied_at,
    'request', j.request,
    'artifact', (
      select jsonb_build_object(
        'id', a.id,
        'kind', a.kind,
        'payload', a.payload,
        'created_at', a.created_at
      )
      from public.ai_artifacts a
      where a.ai_job_id = j.id
    )
  )
  from public.ai_jobs j
  where j.id = jid;
$$;

create or replace function public.enqueue_ai_job(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  nid uuid;
  pid uuid;
  jtype public.ai_job_type;
  job public.ai_jobs;
  month_start timestamptz;
  used int;
  active int;
  allergy_state text;
  restriction_state text;
begin
  nid := public.recipe_assert_nutri();
  begin
    pid := (payload->>'patient_id')::uuid;
    jtype := (payload->>'job_type')::public.ai_job_type;
  exception when others then
    raise exception using errcode='22023', message='ai_job_payload';
  end;
  if pid is null or jtype is null then
    raise exception using errcode='22023', message='ai_job_payload';
  end if;
  perform public.intake_assert_access(pid, true);
  if not public.care_consent(pid, 'ai_menu_draft') then
    raise exception using errcode='42501', message='ai_job_consent';
  end if;
  select s.payload->'allergies'->>'state', s.payload->'restrictions'->>'state'
    into allergy_state, restriction_state
  from public.intake_sessions s
  where s.patient_id = pid;
  if coalesce(allergy_state, 'unknown') = 'unknown' or coalesce(restriction_state, 'unknown') = 'unknown' then
    raise exception using errcode='PT409', message='ai_job_allergies';
  end if;
  if payload->>'prompt_version' is null or char_length(coalesce(payload->>'context_hash','')) <> 64 then
    raise exception using errcode='22023', message='ai_job_version';
  end if;
  if (payload->>'job_type') = 'recipe_draft' and payload->>'prompt_version' is distinct from 'recipe_draft.v1' then
    raise exception using errcode='22023', message='ai_job_version';
  end if;
  if (payload->>'job_type') = 'menu_draft' and payload->>'prompt_version' is distinct from 'menu_draft.v1' then
    raise exception using errcode='22023', message='ai_job_version';
  end if;
  month_start := date_trunc('month', timezone('America/Argentina/Buenos_Aires', now()));
  select coalesce(sum(cost_tokens), 0)::int into used
  from public.ai_jobs
  where nutritionist_id = nid
    and timezone('America/Argentina/Buenos_Aires', created_at) >= month_start;
  if used + coalesce((payload->>'estimated_tokens')::int, 0) > 200000 then
    raise exception using errcode='PT429', message='ai_job_budget';
  end if;
  select count(*)::int into active
  from public.ai_jobs
  where nutritionist_id = nid and status in ('queued', 'running');
  if active >= 3 then
    raise exception using errcode='PT429', message='ai_job_queue';
  end if;
  insert into public.ai_jobs (
    patient_id, nutritionist_id, requested_by, job_type, status, model,
    prompt_version, context_hash, request
  ) values (
    pid,
    nid,
    auth.uid(),
    jtype,
    'queued',
    coalesce(nullif(payload->>'model', ''), 'demo'),
    payload->>'prompt_version',
    payload->>'context_hash',
    coalesce(payload->'request', '{}'::jsonb)
  ) returning * into job;
  return public.ai_job_json(job.id);
end; $$;

create or replace function public.get_ai_job(target_job uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  nid uuid;
  job public.ai_jobs;
begin
  nid := public.recipe_assert_nutri();
  select * into job from public.ai_jobs where id = target_job;
  if not found then
    raise exception using errcode='PT404', message='ai_job_missing';
  end if;
  if job.nutritionist_id is distinct from nid then
    raise exception using errcode='42501', message='ai_job_forbidden';
  end if;
  return public.ai_job_json(job.id);
end; $$;

create or replace function public.list_ai_jobs(target_patient uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  nid uuid;
begin
  nid := public.recipe_assert_nutri();
  perform public.intake_assert_access(target_patient, true);
  return coalesce((
    select jsonb_agg(public.ai_job_json(j.id) order by j.created_at desc)
    from public.ai_jobs j
    where j.patient_id = target_patient and j.nutritionist_id = nid
  ), '[]'::jsonb);
end; $$;

create or replace function public.finish_ai_job(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  nid uuid;
  jid uuid;
  job public.ai_jobs;
  next_status public.ai_job_status;
  artifact jsonb;
begin
  nid := public.recipe_assert_nutri();
  begin
    jid := (payload->>'id')::uuid;
  exception when others then
    raise exception using errcode='22023', message='ai_job_payload';
  end;
  select * into job from public.ai_jobs where id = jid for update;
  if not found then
    raise exception using errcode='PT404', message='ai_job_missing';
  end if;
  if job.nutritionist_id is distinct from nid then
    raise exception using errcode='42501', message='ai_job_forbidden';
  end if;
  if job.status in ('succeeded', 'stale', 'cancelled') then
    return public.ai_job_json(job.id);
  end if;
  next_status := coalesce(nullif(payload->>'status', ''), 'succeeded')::public.ai_job_status;
  if payload->>'current_context_hash' is not null
     and payload->>'current_context_hash' is distinct from job.context_hash
     and next_status = 'succeeded' then
    next_status := 'stale';
  end if;
  update public.ai_jobs set
    status = next_status,
    attempt = job.attempt + 1,
    cost_tokens = coalesce((payload->>'cost_tokens')::int, cost_tokens),
    error_code = nullif(payload->>'error_code', ''),
    warnings = coalesce(payload->'warnings', warnings),
    started_at = coalesce(started_at, now()),
    finished_at = now()
  where id = jid;
  artifact := payload->'artifact';
  if artifact is not null and jsonb_typeof(artifact) = 'object' then
    insert into public.ai_artifacts(ai_job_id, kind, payload)
    values (jid, artifact->>'kind', coalesce(artifact->'payload', '{}'::jsonb))
    on conflict (ai_job_id) do update set kind = excluded.kind, payload = excluded.payload;
  end if;
  return public.ai_job_json(jid);
end; $$;

create or replace function public.apply_ai_job(target_job uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  nid uuid;
  job public.ai_jobs;
  artifact public.ai_artifacts;
  draft jsonb;
begin
  nid := public.recipe_assert_nutri();
  select * into job from public.ai_jobs where id = target_job for update;
  if not found then
    raise exception using errcode='PT404', message='ai_job_missing';
  end if;
  if job.nutritionist_id is distinct from nid then
    raise exception using errcode='42501', message='ai_job_forbidden';
  end if;
  if job.status is distinct from 'succeeded' then
    raise exception using errcode='PT409', message='ai_job_not_ready';
  end if;
  select * into artifact from public.ai_artifacts where ai_job_id = job.id;
  if not found then
    raise exception using errcode='PT409', message='ai_job_not_ready';
  end if;
  if job.applied_at is not null then
    return public.ai_job_json(job.id);
  end if;
  if artifact.kind = 'recipe_draft' then
    draft := public.save_recipe_draft(artifact.payload);
  elsif artifact.kind = 'menu_draft' then
    draft := public.save_meal_plan_draft(job.patient_id, artifact.payload);
  end if;
  if draft is not null and (draft->'current'->>'published_at') is not null then
    raise exception using errcode='PT409', message='ai_job_published';
  end if;
  update public.ai_jobs set applied_at = now() where id = job.id;
  return public.ai_job_json(job.id);
end; $$;

revoke all on function
  public.ai_job_json(uuid),
  public.enqueue_ai_job(jsonb),
  public.get_ai_job(uuid),
  public.list_ai_jobs(uuid),
  public.finish_ai_job(jsonb),
  public.apply_ai_job(uuid)
from public, anon;

grant execute on function
  public.enqueue_ai_job(jsonb),
  public.get_ai_job(uuid),
  public.list_ai_jobs(uuid),
  public.finish_ai_job(jsonb),
  public.apply_ai_job(uuid)
to authenticated;
