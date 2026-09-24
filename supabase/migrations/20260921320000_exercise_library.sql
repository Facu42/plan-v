-- PV-35: biblioteca de ejercicios, rutinas asignables sólo con habilitación
-- verificada en servidor, y activity_logs autodeclarados.
-- Fuera del piloto 016/016b. Solo Postgres vacío/descartable.
-- apply:disposable aborta si public.patients tiene filas.
-- No aplicar en un proyecto hospedado con pacientes.
-- Retención activity_logs: 5 años desde logged_at (diccionario). Purga operativa no corre acá.
-- El rol nutricionista no alcanza para asignar: hace falta professional_habilitations.

create table if not exists public.professional_habilitations (
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  kind text not null check (kind = 'exercise_prescription'),
  verified_at timestamptz not null,
  verified_by uuid not null references public.profiles(id),
  credential_ref text,
  created_at timestamptz not null default clock_timestamp(),
  primary key (nutritionist_id, kind)
);

create table if not exists public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(btrim(slug)) between 2 and 80),
  name text not null check (char_length(btrim(name)) between 2 and 80),
  description text not null check (char_length(btrim(description)) between 2 and 400),
  category text not null check (category in ('movilidad', 'fuerza', 'cardio', 'equilibrio', 'otro')),
  default_sets int not null check (default_sets between 1 and 20),
  default_reps int not null check (default_reps between 1 and 200),
  default_rest_seconds int not null check (default_rest_seconds between 0 and 600),
  published boolean not null default true,
  created_at timestamptz not null default clock_timestamp()
);

create table if not exists public.exercise_routines (
  id uuid primary key default gen_random_uuid(),
  nutritionist_id uuid not null references public.nutritionists(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 80),
  created_at timestamptz not null default clock_timestamp()
);

create table if not exists public.exercise_routine_versions (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.exercise_routines(id) on delete cascade,
  version int not null check (version >= 1),
  status text not null check (status in ('draft', 'published', 'retired')),
  published_at timestamptz,
  unique (routine_id, version)
);

create table if not exists public.exercise_routine_items (
  id uuid primary key default gen_random_uuid(),
  routine_version_id uuid not null references public.exercise_routine_versions(id) on delete cascade,
  exercise_id uuid not null references public.exercise_library(id),
  sort int not null check (sort >= 0),
  sets int not null check (sets between 1 and 20),
  reps int not null check (reps between 1 and 200),
  rest_seconds int not null check (rest_seconds between 0 and 600),
  note text check (note is null or char_length(note) <= 200)
);

create table if not exists public.routine_assignments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  routine_version_id uuid not null references public.exercise_routine_versions(id),
  assigned_by uuid not null references public.profiles(id),
  assigned_at timestamptz not null default clock_timestamp(),
  status text not null default 'active' check (status in ('active', 'paused', 'completed')),
  feedback_sets int check (feedback_sets is null or feedback_sets between 0 and 20),
  feedback_reps int check (feedback_reps is null or feedback_reps between 0 and 200),
  feedback_note text check (feedback_note is null or char_length(feedback_note) <= 500),
  feedback_at timestamptz,
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  activity text not null check (char_length(btrim(activity)) between 2 and 80),
  duration_minutes int not null check (duration_minutes between 1 and 600),
  intensity text not null check (intensity in ('suave', 'moderada', 'intensa')),
  note text check (note is null or char_length(note) <= 500),
  assignment_id uuid references public.routine_assignments(id) on delete set null,
  sets int check (sets is null or sets between 1 and 20),
  reps int check (reps is null or reps between 1 and 200),
  logged_at timestamptz not null default clock_timestamp(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade
);

create index if not exists activity_logs_patient_logged_idx
  on public.activity_logs (patient_id, logged_at desc);
create index if not exists routine_assignments_patient_idx
  on public.routine_assignments (patient_id, assigned_at desc);

insert into public.exercise_library (
  id, slug, name, description, category, default_sets, default_reps, default_rest_seconds, published
) values
  ('11111111-1111-4111-a111-000000000001', 'movilidad-cadera', 'Movilidad de cadera',
   'Círculos lentos de cadera, sin forzar el rango.', 'movilidad', 2, 8, 30, true),
  ('11111111-1111-4111-a111-000000000002', 'sentadilla-aire', 'Sentadilla al aire',
   'Bajada controlada con talones apoyados. No es una orden médica.', 'fuerza', 3, 10, 60, true),
  ('11111111-1111-4111-a111-000000000003', 'puente-gluteos', 'Puente de glúteos',
   'Elevación de cadera con pausa breve arriba.', 'fuerza', 3, 8, 45, true),
  ('11111111-1111-4111-a111-000000000004', 'caminata', 'Caminata',
   'Caminata continua a ritmo cómodo. La duración la declara la paciente.', 'cardio', 1, 1, 0, true),
  ('11111111-1111-4111-a111-000000000005', 'equilibrio-unipodal', 'Equilibrio unipodal',
   'Apoyo en un pie junto a un apoyo estable.', 'equilibrio', 2, 6, 30, true),
  ('11111111-1111-4111-a111-000000000006', 'estiramiento-posterior', 'Estiramiento posterior',
   'Estiramiento suave de cadena posterior, sin rebotes.', 'movilidad', 2, 8, 20, true)
on conflict (id) do nothing;

alter table public.professional_habilitations enable row level security;
alter table public.exercise_library enable row level security;
alter table public.exercise_routines enable row level security;
alter table public.exercise_routine_versions enable row level security;
alter table public.exercise_routine_items enable row level security;
alter table public.routine_assignments enable row level security;
alter table public.activity_logs enable row level security;

revoke all on public.professional_habilitations, public.exercise_library, public.exercise_routines,
  public.exercise_routine_versions, public.exercise_routine_items, public.routine_assignments, public.activity_logs
  from public, anon, authenticated;
grant select on public.professional_habilitations, public.exercise_library, public.exercise_routines,
  public.exercise_routine_versions, public.exercise_routine_items, public.routine_assignments, public.activity_logs
  to authenticated;
grant insert, delete on public.activity_logs to authenticated;
grant update (feedback_sets, feedback_reps, feedback_note, feedback_at, status) on public.routine_assignments to authenticated;

drop policy if exists exercise_hab_self_select on public.professional_habilitations;
create policy exercise_hab_self_select on public.professional_habilitations
  for select to authenticated
  using (nutritionist_id is not distinct from public.my_nutritionist_id());

drop policy if exists exercise_library_published_select on public.exercise_library;
create policy exercise_library_published_select on public.exercise_library
  for select to authenticated
  using (published);

drop policy if exists exercise_routines_nutri_select on public.exercise_routines;
create policy exercise_routines_nutri_select on public.exercise_routines
  for select to authenticated
  using (nutritionist_id is not distinct from public.my_nutritionist_id());

drop policy if exists exercise_routine_versions_select on public.exercise_routine_versions;
create policy exercise_routine_versions_select on public.exercise_routine_versions
  for select to authenticated
  using (
    exists (
      select 1 from public.exercise_routines r
      where r.id = routine_id
        and (
          r.nutritionist_id is not distinct from public.my_nutritionist_id()
          or exists (
            select 1 from public.routine_assignments a
            where a.routine_version_id = public.exercise_routine_versions.id
              and a.patient_id is not distinct from public.my_patient_id()
          )
        )
    )
  );

drop policy if exists exercise_routine_items_select on public.exercise_routine_items;
create policy exercise_routine_items_select on public.exercise_routine_items
  for select to authenticated
  using (
    exists (
      select 1 from public.exercise_routine_versions v
      join public.exercise_routines r on r.id = v.routine_id
      where v.id = routine_version_id
        and (
          r.nutritionist_id is not distinct from public.my_nutritionist_id()
          or exists (
            select 1 from public.routine_assignments a
            where a.routine_version_id = v.id
              and a.patient_id is not distinct from public.my_patient_id()
          )
        )
    )
  );

drop policy if exists routine_assignments_patient_select on public.routine_assignments;
create policy routine_assignments_patient_select on public.routine_assignments
  for select to authenticated
  using (
    public.is_assigned_patient(patient_id)
    or patient_id is not distinct from public.my_patient_id()
  );

drop policy if exists routine_assignments_patient_feedback on public.routine_assignments;
create policy routine_assignments_patient_feedback on public.routine_assignments
  for update to authenticated
  using (patient_id is not distinct from public.my_patient_id() and public.patient_has_full_access(patient_id))
  with check (patient_id is not distinct from public.my_patient_id() and public.patient_has_full_access(patient_id));

drop policy if exists activity_logs_patient_select on public.activity_logs;
create policy activity_logs_patient_select on public.activity_logs
  for select to authenticated
  using (
    public.is_assigned_patient(patient_id)
    or patient_id is not distinct from public.my_patient_id()
  );

drop policy if exists activity_logs_patient_insert on public.activity_logs;
create policy activity_logs_patient_insert on public.activity_logs
  for insert to authenticated
  with check (
    patient_id is not distinct from public.my_patient_id()
    and public.patient_has_full_access(patient_id)
  );

drop policy if exists activity_logs_patient_delete on public.activity_logs;
create policy activity_logs_patient_delete on public.activity_logs
  for delete to authenticated
  using (
    patient_id is not distinct from public.my_patient_id()
    and public.patient_has_full_access(patient_id)
  );

create or replace function public.exercise_can_prescribe()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.professional_habilitations h
    join public.nutritionists n on n.id = h.nutritionist_id
    join public.profiles p on p.id = n.user_id
    where n.user_id = auth.uid()
      and p.role = 'nutri'
      and h.kind = 'exercise_prescription'
      and h.verified_at is not null
  );
$$;

create or replace function public.exercise_assert_prescribe()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  nid uuid;
begin
  if not public.exercise_can_prescribe() then
    raise exception using errcode = '42501', message = 'exercise_habilitation';
  end if;
  nid := public.my_nutritionist_id();
  if nid is null then
    raise exception using errcode = '42501', message = 'exercise_habilitation';
  end if;
  return nid;
end;
$$;

revoke all on function public.exercise_can_prescribe() from public, anon;
revoke all on function public.exercise_assert_prescribe() from public, anon;
grant execute on function public.exercise_can_prescribe() to authenticated;
grant execute on function public.exercise_assert_prescribe() to authenticated;

create or replace function public.exercise_library_json()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', e.id,
    'slug', e.slug,
    'name', e.name,
    'description', e.description,
    'category', e.category,
    'default_sets', e.default_sets,
    'default_reps', e.default_reps,
    'default_rest_seconds', e.default_rest_seconds
  ) order by e.category, e.name), '[]'::jsonb)
  from public.exercise_library e
  where e.published;
$$;

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
        'reps', l.reps
      ) order by l.logged_at desc)
      from public.activity_logs l
      where l.patient_id = target_patient
    ), '[]'::jsonb)
  ) into snapshot;
  return snapshot;
end;
$$;

create or replace function public.log_patient_activity(
  target_patient uuid,
  input_activity text,
  input_duration int,
  input_intensity text,
  input_note text default null,
  input_assignment uuid default null,
  input_sets int default null,
  input_reps int default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  nid uuid;
begin
  if target_patient is distinct from public.my_patient_id() or not public.patient_has_full_access(target_patient) then
    raise exception using errcode = '42501', message = 'activity_patient_only';
  end if;
  select nutritionist_id into nid from public.patients where id = target_patient;
  if nid is null then
    raise exception using errcode = 'P0002', message = 'patient_missing';
  end if;
  if input_assignment is not null and not exists (
    select 1 from public.routine_assignments a
    where a.id = input_assignment and a.patient_id = target_patient
  ) then
    raise exception using errcode = '22023', message = 'activity_assignment';
  end if;
  insert into public.activity_logs (
    patient_id, nutritionist_id, activity, duration_minutes, intensity, note, assignment_id, sets, reps
  ) values (
    target_patient, nid, btrim(input_activity), input_duration, input_intensity,
    nullif(btrim(coalesce(input_note, '')), ''), input_assignment, input_sets, input_reps
  );
  return public.get_patient_exercise(target_patient);
end;
$$;

create or replace function public.delete_patient_activity(target_patient uuid, activity_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_patient is distinct from public.my_patient_id() or not public.patient_has_full_access(target_patient) then
    raise exception using errcode = '42501', message = 'activity_patient_only';
  end if;
  delete from public.activity_logs
  where id = activity_id and patient_id = target_patient;
  if not found then
    raise exception using errcode = 'P0002', message = 'activity_missing';
  end if;
  return public.get_patient_exercise(target_patient);
end;
$$;

create or replace function public.assign_exercise_routine(
  target_patient uuid,
  input_title text,
  input_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  nid uuid;
  rid uuid;
  vid uuid;
  item jsonb;
  pos int := 0;
begin
  nid := public.exercise_assert_prescribe();
  if not public.is_assigned_patient(target_patient) then
    raise exception using errcode = '42501', message = 'exercise_not_assigned';
  end if;
  if jsonb_typeof(input_items) is distinct from 'array'
    or jsonb_array_length(input_items) < 1
    or jsonb_array_length(input_items) > 12 then
    raise exception using errcode = '22023', message = 'exercise_items';
  end if;
  insert into public.exercise_routines (nutritionist_id, title)
  values (nid, btrim(input_title))
  returning id into rid;
  insert into public.exercise_routine_versions (routine_id, version, status, published_at)
  values (rid, 1, 'published', clock_timestamp())
  returning id into vid;
  for item in select value from jsonb_array_elements(input_items)
  loop
    if not exists (select 1 from public.exercise_library e where e.id = (item->>'exercise_id')::uuid and e.published) then
      raise exception using errcode = '22023', message = 'exercise_unknown';
    end if;
    insert into public.exercise_routine_items (
      routine_version_id, exercise_id, sort, sets, reps, rest_seconds, note
    ) values (
      vid,
      (item->>'exercise_id')::uuid,
      coalesce((item->>'sort')::int, pos),
      (item->>'sets')::int,
      (item->>'reps')::int,
      coalesce((item->>'rest_seconds')::int, 0),
      nullif(btrim(coalesce(item->>'note', '')), '')
    );
    pos := pos + 1;
  end loop;
  insert into public.routine_assignments (
    patient_id, nutritionist_id, routine_version_id, assigned_by
  ) values (
    target_patient, nid, vid, auth.uid()
  );
  return public.get_patient_exercise(target_patient);
end;
$$;

create or replace function public.save_routine_feedback(
  target_patient uuid,
  assignment_id uuid,
  input_sets int,
  input_reps int,
  input_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if target_patient is distinct from public.my_patient_id() or not public.patient_has_full_access(target_patient) then
    raise exception using errcode = '42501', message = 'activity_patient_only';
  end if;
  update public.routine_assignments
  set feedback_sets = input_sets,
      feedback_reps = input_reps,
      feedback_note = nullif(btrim(coalesce(input_note, '')), ''),
      feedback_at = clock_timestamp()
  where id = assignment_id and patient_id = target_patient;
  if not found then
    raise exception using errcode = 'P0002', message = 'assignment_missing';
  end if;
  return public.get_patient_exercise(target_patient);
end;
$$;

revoke all on function public.exercise_library_json() from public, anon;
revoke all on function public.get_patient_exercise(uuid) from public, anon;
revoke all on function public.log_patient_activity(uuid, text, int, text, text, uuid, int, int) from public, anon;
revoke all on function public.delete_patient_activity(uuid, uuid) from public, anon;
revoke all on function public.assign_exercise_routine(uuid, text, jsonb) from public, anon;
revoke all on function public.save_routine_feedback(uuid, uuid, int, int, text) from public, anon;

grant execute on function public.exercise_library_json() to authenticated;
grant execute on function public.get_patient_exercise(uuid) to authenticated;
grant execute on function public.log_patient_activity(uuid, text, int, text, text, uuid, int, int) to authenticated;
grant execute on function public.delete_patient_activity(uuid, uuid) to authenticated;
grant execute on function public.assign_exercise_routine(uuid, text, jsonb) to authenticated;
grant execute on function public.save_routine_feedback(uuid, uuid, int, int, text) to authenticated;
