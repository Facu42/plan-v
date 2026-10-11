-- Jobs de IA: reserva única, recuperación sin generación tardía y contexto vigente.
-- Las funciones conservan autorización por dueña y la privacidad del borrador.
alter table public.ai_jobs add column run_token uuid;
alter table public.ai_jobs add column run_expires_at timestamptz not null default (clock_timestamp()+interval '120 seconds');
alter table public.ai_jobs add column intake_revision integer;
alter table public.ai_jobs add column ai_consent_sequence bigint;
-- Los intentos anteriores no tienen prueba de ejecución ni contexto: no retomarlos.
update public.ai_jobs set status='failed', error_code='job_expired', finished_at=clock_timestamp()
where status in ('queued','running');

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
  intake_revision integer;
  consent_sequence bigint;
  allergy_state text;
  restriction_state text;
begin
  nid := public.recipe_assert_nutri();
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(nid::text, 27));
  update public.ai_jobs set status='failed', error_code='job_expired', finished_at=clock_timestamp(), run_token=null
  where nutritionist_id=nid and status in ('queued','running') and run_expires_at <= clock_timestamp();
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
  select revision into intake_revision from public.intake_sessions where patient_id=pid for update;
  select max(sequence) into consent_sequence from public.consent_events where patient_id=pid and purpose='ai_menu_draft';
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
    prompt_version, context_hash, request, run_expires_at, intake_revision, ai_consent_sequence
  ) values (
    pid,
    nid,
    auth.uid(),
    jtype,
    'queued',
    coalesce(nullif(payload->>'model', ''), 'demo'),
    payload->>'prompt_version',
    payload->>'context_hash',
    coalesce(payload->'request', '{}'::jsonb), clock_timestamp()+interval '120 seconds', intake_revision, consent_sequence
  ) returning * into job;
  return public.ai_job_json(job.id);
end; $$;

create or replace function public.claim_ai_job(target_job uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare nid uuid; job public.ai_jobs;
begin
  nid := public.recipe_assert_nutri();
  select * into job from public.ai_jobs where id=target_job for update;
  if not found then raise exception using errcode='PT404', message='ai_job_missing'; end if;
  if job.nutritionist_id is distinct from nid then raise exception using errcode='42501', message='ai_job_forbidden'; end if;
  if job.status <> 'queued' then raise exception using errcode='PT409', message='ai_job_attempt'; end if;
  if job.run_expires_at <= clock_timestamp() then
    update public.ai_jobs set status='failed', error_code='job_expired', finished_at=clock_timestamp() where id=target_job;
    return public.ai_job_json(target_job);
  end if;
  update public.ai_jobs set status='running', run_token=gen_random_uuid(), run_expires_at=clock_timestamp()+interval '120 seconds',
    started_at=clock_timestamp(), attempt=attempt+1 where id=target_job returning * into job;
  return public.ai_job_json(target_job) || jsonb_build_object('run_token',job.run_token);
end; $$;
revoke all on function public.claim_ai_job(uuid) from public, anon;
grant execute on function public.claim_ai_job(uuid) to authenticated;

create or replace function public.finish_ai_job(payload jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  nid uuid;
  jid uuid;
  job public.ai_jobs;
  next_status public.ai_job_status;
  artifact jsonb;
  current_revision integer;
  consent_sequence bigint;
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
  if job.status not in ('queued', 'running') then
    return public.ai_job_json(job.id);
  end if;
  if job.run_expires_at <= clock_timestamp() then
    update public.ai_jobs set status='failed', error_code='job_expired', finished_at=clock_timestamp(), run_token=null where id=jid;
    return public.ai_job_json(jid);
  end if;
  if job.status <> 'running' or job.run_token is null or (payload->>'run_token') is distinct from job.run_token::text then
    raise exception using errcode='PT409', message='ai_job_attempt';
  end if;
  next_status := coalesce(nullif(payload->>'status', ''), 'succeeded')::public.ai_job_status;
  if payload->>'current_context_hash' is not null
     and payload->>'current_context_hash' is distinct from job.context_hash
     and next_status = 'succeeded' then
    next_status := 'stale';
  end if;
  if next_status not in ('succeeded','failed','stale') then
    raise exception using errcode='22023', message='ai_job_status';
  end if;
  if next_status='succeeded' then
    perform public.intake_assert_access(job.patient_id, true);
    select revision into current_revision from public.intake_sessions where patient_id=job.patient_id for update;
    select max(sequence) into consent_sequence from public.consent_events where patient_id=job.patient_id and purpose='ai_menu_draft';
    if not public.care_consent(job.patient_id,'ai_menu_draft') or current_revision is distinct from job.intake_revision
       or consent_sequence is distinct from job.ai_consent_sequence then
      next_status := 'stale';
    end if;
  end if;
  -- Recheck after acquiring the intake lock: waiting can consume the lease.
  if job.run_expires_at <= clock_timestamp() then next_status := 'failed'; end if;
  update public.ai_jobs set
    status = next_status,
    run_token = null,
    cost_tokens = coalesce((payload->>'cost_tokens')::int, cost_tokens),
    error_code = case when job.run_expires_at <= clock_timestamp() then 'job_expired'
      when next_status='stale' then 'stale_context' else nullif(payload->>'error_code', '') end,
    warnings = coalesce(payload->'warnings', warnings),
    started_at = coalesce(started_at, now()),
    finished_at = clock_timestamp()
  where id = jid;
  artifact := payload->'artifact';
  if next_status='succeeded' and artifact is not null and jsonb_typeof(artifact) = 'object' then
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
  current_revision integer;
  consent_sequence bigint;
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
  perform public.intake_assert_access(job.patient_id, true);
  select revision into current_revision from public.intake_sessions where patient_id=job.patient_id for update;
  select max(sequence) into consent_sequence from public.consent_events where patient_id=job.patient_id and purpose='ai_menu_draft';
  if not public.care_consent(job.patient_id,'ai_menu_draft') or current_revision is distinct from job.intake_revision
     or consent_sequence is distinct from job.ai_consent_sequence then
    raise exception using errcode='PT409', message='ai_job_context_changed';
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
