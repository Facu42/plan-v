-- PV-34: progreso longitudinal del mismo paciente (períodos 7/30/90).
-- Solo Postgres vacío/descartable. apply:disposable aborta si public.patients tiene filas.
-- No aplicar en un proyecto hospedado con pacientes. No ranking ni relleno de períodos vacíos.

create or replace function public.get_patient_progress(target_patient uuid, period_days integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  tz constant text := 'America/Argentina/Buenos_Aires';
  today date;
  this_start date;
  this_end date;
  prev_start date;
  prev_end date;
  include_m boolean;
  meals jsonb;
  series jsonb := '[]'::jsonb;
begin
  if period_days is distinct from 7 and period_days is distinct from 30 and period_days is distinct from 90 then
    raise exception using errcode = '22023', message = 'progress_period';
  end if;
  perform public.intake_assert_access(target_patient);
  today := (clock_timestamp() at time zone tz)::date;
  this_end := today;
  this_start := today - (period_days - 1);
  prev_end := this_start - 1;
  prev_start := this_start - period_days;
  include_m := public.care_consent(target_patient, 'measurement');

  select jsonb_build_object(
    'current', jsonb_build_object(
      'logged', count(*) filter (where d between this_start and this_end),
      'reviewed', count(*) filter (where d between this_start and this_end and status is distinct from 'pending_review'),
      'pending', count(*) filter (where d between this_start and this_end and status = 'pending_review')
    ),
    'previous', jsonb_build_object(
      'logged', count(*) filter (where d between prev_start and prev_end),
      'reviewed', count(*) filter (where d between prev_start and prev_end and status is distinct from 'pending_review'),
      'pending', count(*) filter (where d between prev_start and prev_end and status = 'pending_review')
    )
  ) into meals
  from (
    select (m.logged_at at time zone tz)::date as d, m.status::text as status
    from public.meal_logs m
    where m.patient_id = target_patient
  ) rows;

  if include_m then
    with pts as (
      select
        m.id,
        m.kind,
        m.unit,
        m.value_numeric::float8 as value,
        m.source,
        m.captured_on,
        m.created_at,
        case
          when m.captured_on between this_start and this_end then 'current'
          when m.captured_on between prev_start and prev_end then 'previous'
        end as bucket
      from public.measurements m
      where m.patient_id = target_patient
        and m.kind in ('weight', 'waist', 'hip')
        and m.captured_on between prev_start and this_end
    ),
    grouped as (
      select kind, unit from pts where bucket is not null group by kind, unit
    )
    select coalesce(jsonb_agg(item order by
      case item->>'kind' when 'weight' then 1 when 'waist' then 2 else 3 end,
      item->>'unit'
    ), '[]'::jsonb)
    into series
    from (
      select jsonb_build_object(
        'kind', g.kind,
        'unit', g.unit,
        'current', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', p.id,
            'value', p.value,
            'source', p.source,
            'captured_on', p.captured_on,
            'created_at', p.created_at
          ) order by p.captured_on, p.created_at, p.id)
          from pts p where p.kind = g.kind and p.unit = g.unit and p.bucket = 'current'
        ), '[]'::jsonb),
        'previous', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', p.id,
            'value', p.value,
            'source', p.source,
            'captured_on', p.captured_on,
            'created_at', p.created_at
          ) order by p.captured_on, p.created_at, p.id)
          from pts p where p.kind = g.kind and p.unit = g.unit and p.bucket = 'previous'
        ), '[]'::jsonb)
      ) as item
      from grouped g
    ) built;
  end if;

  return jsonb_build_object(
    'patient_id', target_patient,
    'timezone', tz,
    'period_days', period_days,
    'current', jsonb_build_object('start', this_start, 'end', this_end),
    'previous', jsonb_build_object('start', prev_start, 'end', prev_end),
    'measurements_included', include_m,
    'series', series,
    'meals', meals
  );
end;
$$;

revoke all on function public.get_patient_progress(uuid, integer) from public, anon;
grant execute on function public.get_patient_progress(uuid, integer) to authenticated;
