-- Calorías quemadas que la paciente carga a mano al registrar una actividad (opcional).
-- Solo agrega: una columna, una función nueva y la misma lectura con el dato sumado. No borra nada.

alter table public.activity_logs
  add column if not exists kcal integer
  constraint activity_logs_kcal_range check (kcal is null or kcal between 0 and 5000);

comment on column public.activity_logs.kcal is
  'Calorías quemadas que declaró la paciente (opcional). No es una medición.';

-- Misma lectura que antes, con «kcal» en cada actividad.
create or replace function public.get_patient_exercise(target_patient uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  snapshot jsonb;
begin
  perform public.intake_assert_access(target_patient);
  select jsonb_build_object(
    'patient_id', target_patient,
    'can_assign', public.exercise_can_prescribe() and public.is_assigned_patient(target_patient),
    'habilitation_verified', public.exercise_can_prescribe(),
    'library', public.exercise_library_json(),
    'assignments', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id,
        'patient_id', a.patient_id,
        'title', r.title,
        'status', a.status,
        'assigned_at', a.assigned_at,
        'items', (
          select coalesce(jsonb_agg(jsonb_build_object(
            'id', i.id,
            'exercise_id', i.exercise_id,
            'name', e.name,
            'category', e.category,
            'sets', i.sets,
            'reps', i.reps,
            'rest_seconds', i.rest_seconds,
            'note', i.note,
            'sort', i.sort
          ) order by i.sort, i.id), '[]'::jsonb)
          from public.exercise_routine_items i
          join public.exercise_library e on e.id = i.exercise_id
          where i.routine_version_id = a.routine_version_id
        ),
        'feedback', case when a.feedback_at is null then null else jsonb_build_object(
          'sets_completed', a.feedback_sets,
          'reps_completed', a.feedback_reps,
          'note', a.feedback_note,
          'recorded_at', a.feedback_at
        ) end
      ) order by a.assigned_at desc)
      from public.routine_assignments a
      join public.exercise_routine_versions v on v.id = a.routine_version_id
      join public.exercise_routines r on r.id = v.routine_id
      where a.patient_id = target_patient
    ), '[]'::jsonb),
    'activities', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', l.id,
        'patient_id', l.patient_id,
        'activity', l.activity,
        'duration_minutes', l.duration_minutes,
        'intensity', l.intensity,
        'note', l.note,
        'logged_at', l.logged_at,
        'assignment_id', l.assignment_id,
        'sets', l.sets,
        'reps', l.reps,
        'kcal', l.kcal
      ) order by l.logged_at desc)
      from public.activity_logs l
      where l.patient_id = target_patient
    ), '[]'::jsonb)
  ) into snapshot;
  return snapshot;
end;
$$;

-- Registrar una actividad con calorías: mismas reglas que log_patient_activity (solo la paciente,
-- con acceso completo, sin duplicar el mismo envío) y guarda el número declarado.
create or replace function public.log_patient_activity_with_kcal(
  target_patient uuid,
  input_activity text,
  input_duration int,
  input_intensity text,
  input_kcal int,
  input_note text default null,
  client_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  nid uuid;
  body jsonb;
begin
  if target_patient is distinct from public.my_patient_id() or not public.patient_has_full_access(target_patient) then
    raise exception using errcode = '42501', message = 'activity_patient_only';
  end if;
  if input_kcal is null or input_kcal < 0 or input_kcal > 5000 then
    raise exception using errcode = '22023', message = 'activity_kcal';
  end if;
  body := jsonb_build_object('activity', btrim(input_activity), 'duration', input_duration, 'intensity', input_intensity,
    'note', nullif(btrim(coalesce(input_note, '')), ''), 'kcal', input_kcal);
  if private.product_write_seen(target_patient, client_id, 'activity', body) then
    return public.get_patient_exercise(target_patient);
  end if;
  select nutritionist_id into nid from public.patients where id = target_patient;
  if nid is null then
    raise exception using errcode = 'P0002', message = 'patient_missing';
  end if;
  insert into public.activity_logs (patient_id, nutritionist_id, activity, duration_minutes, intensity, note, kcal)
  values (target_patient, nid, btrim(input_activity), input_duration, input_intensity,
    nullif(btrim(coalesce(input_note, '')), ''), input_kcal);
  insert into private.product_write_receipts(actor_id, client_id, patient_id, operation, payload)
  values (auth.uid(), client_id, target_patient, 'activity', body);
  return public.get_patient_exercise(target_patient);
end;
$$;

revoke all on function public.log_patient_activity_with_kcal(uuid, text, int, text, int, text, uuid) from public, anon;
grant execute on function public.log_patient_activity_with_kcal(uuid, text, int, text, int, text, uuid) to authenticated;
