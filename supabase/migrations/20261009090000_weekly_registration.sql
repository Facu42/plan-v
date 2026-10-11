-- Registro semanal: ausencia de datos no equivale a incumplimiento.
alter table public.habit_logs add column hydration_declared boolean not null default false;

create or replace function public.get_weekly_registrations(patient_ids uuid[])
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare
  target uuid;
  today date := (clock_timestamp() at time zone 'America/Argentina/Buenos_Aires')::date;
  first_day date := today-6;
  summary jsonb;
  result jsonb := '{}'::jsonb;
begin
  if patient_ids is null or cardinality(patient_ids)>100 then
    raise exception using errcode='22023',message='weekly_patient_limit';
  end if;
  foreach target in array patient_ids loop
    perform public.intake_assert_access(target,true);
  end loop;
  foreach target in array patient_ids loop
    with meals as (
      select (logged_at at time zone 'America/Argentina/Buenos_Aires')::date as d,status
      from public.meal_logs where patient_id=target
    ), habits as (
      select date as d,hydration,hydration_declared or hydration>0 as water,
        energy,sleep_minutes,steps
      from public.habit_logs where patient_id=target and date between first_day and today
    ), days as (
      select d from meals where d between first_day and today
      union select d from habits where water or energy is not null or sleep_minutes is not null or steps is not null
    ) select jsonb_build_object(
      'start',first_day,'end',today,'recorded_days',(select count(*) from days),
      'meals_logged',(select count(*) from meals where d between first_day and today),
      'meals_pending',(select count(*) from meals where d between first_day and today and status='pending_review'),
      'water_days',(select count(*) from habits where water),
      'water_average',(select round(avg(hydration)::numeric,1) from habits where water),
      'pending_review',(select count(*) from meals where status='pending_review') + (
        select count(*) from public.care_records where patient_id=target and reviewed_at is null
        and data->>'kind'<>'payment'
        and (data->>'kind' not in ('weight','waist','hip') or public.care_consent(target,'measurement'))
      )
    ) into summary;
    result:=result||jsonb_build_object(target::text,summary);
  end loop;
  return result;
end; $$;
revoke all on function public.get_weekly_registrations(uuid[]) from public,anon;
grant execute on function public.get_weekly_registrations(uuid[]) to authenticated;
