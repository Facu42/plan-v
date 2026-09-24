-- PV-44: an AI menu proposal can be explicitly rejected before it is applied.
create or replace function public.reject_ai_job(target_job uuid)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  nid uuid;
  job public.ai_jobs;
begin
  nid := public.recipe_assert_nutri();
  select * into job from public.ai_jobs where id = target_job for update;
  if not found then
    raise exception using errcode='PT404', message='ai_job_missing';
  end if;
  if job.nutritionist_id is distinct from nid then
    raise exception using errcode='42501', message='ai_job_forbidden';
  end if;
  perform public.intake_assert_access(job.patient_id, true);
  if job.status = 'cancelled' then
    return public.ai_job_json(job.id);
  end if;
  if job.status is distinct from 'succeeded' or job.applied_at is not null then
    raise exception using errcode='PT409', message='ai_job_not_rejectable';
  end if;
  delete from public.ai_artifacts where ai_job_id = job.id;
  update public.ai_jobs set
    status = 'cancelled',
    error_code = 'rejected_by_nutritionist'
  where id = job.id;
  return public.ai_job_json(job.id);
end; $$;

revoke all on function public.reject_ai_job(uuid) from public, anon;
grant execute on function public.reject_ai_job(uuid) to authenticated;
