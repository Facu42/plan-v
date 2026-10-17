-- Objetivo de seguimiento de la paciente (D1).
-- No es la meta de calorías del plan: es el objetivo que la profesional carga a mano,
-- con estado, avance y una nota. La nota queda solo para el consultorio.
-- La paciente ve el texto, el estado, el avance y los cambios, sin esa nota.
-- No se aplica solo: espera la frase escrita de Facundo en la base en línea.
-- Retroceso, si hiciera falta: borrar las dos vistas nuevas, las dos funciones privadas,
-- set_patient_goal y goal_history, y las tres columnas nuevas. No se toca patients.goal.

alter table public.patients
  add column if not exists goal_status text,
  add column if not exists goal_progress integer,
  add column if not exists goal_updated_at timestamptz;

alter table public.patients drop constraint if exists patients_goal_status_check;
alter table public.patients
  add constraint patients_goal_status_check
  check (goal_status is null or goal_status in ('active', 'paused', 'completed'));

alter table public.patients drop constraint if exists patients_goal_progress_check;
alter table public.patients
  add constraint patients_goal_progress_check
  check (goal_progress is null or goal_progress between 0 and 100);

comment on column public.patients.goal_status is
  'Estado del objetivo de seguimiento: active, paused o completed. Vacío si la profesional todavía no lo cargó.';
comment on column public.patients.goal_progress is
  'Avance manual del objetivo, de 0 a 100. Vacío si todavía no se cargó. No se calcula solo.';
comment on column public.patients.goal_updated_at is
  'Cuándo la profesional guardó por última vez el objetivo de seguimiento.';

create table if not exists public.goal_history (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null,
  nutritionist_id uuid not null,
  goal text not null,
  status text not null check (status in ('active', 'paused', 'completed')),
  progress integer not null check (progress between 0 and 100),
  note text,
  updated_at timestamptz not null default now(),
  foreign key (patient_id, nutritionist_id) references public.patients (id, nutritionist_id) on delete cascade,
  check (char_length(btrim(goal)) between 2 and 240),
  check (note is null or char_length(note) <= 500)
);

create index if not exists goal_history_patient_updated_idx
  on public.goal_history (patient_id, updated_at desc);

comment on table public.goal_history is
  'Cada guardado del objetivo de seguimiento. La nota es de la profesional y no sale a la paciente.';

alter table public.goal_history enable row level security;

revoke all on public.goal_history from public, anon, authenticated;
grant select on public.goal_history to service_role;

drop policy if exists goal_history_nutri_select on public.goal_history;
create policy goal_history_nutri_select on public.goal_history
  for select
  using (nutritionist_id = public.my_nutritionist_id());

grant select on public.goal_history to authenticated;

-- La paciente no lee esta tabla: la nota vive acá. Ve sus cambios por la función de abajo, sin nota.

create or replace function public.set_patient_goal(
  target uuid,
  next_goal text,
  next_status text,
  next_progress integer,
  next_note text
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  nid uuid;
  owner uuid;
  clean_goal text;
  clean_note text;
begin
  nid := public.my_nutritionist_id();
  if auth.uid() is null or nid is null then
    raise exception using errcode = '42501', message = 'goal_pro_only';
  end if;

  select p.nutritionist_id into owner
    from public.patients p
    where p.id = target
      and p.deactivated_at is null
      and p.anonymized_at is null;
  if owner is null or owner is distinct from nid then
    raise exception using errcode = '42501', message = 'goal_forbidden';
  end if;

  clean_goal := btrim(coalesce(next_goal, ''));
  if char_length(clean_goal) < 2 or char_length(clean_goal) > 240 then
    raise exception using errcode = '22023', message = 'goal_text';
  end if;
  if next_status not in ('active', 'paused', 'completed') then
    raise exception using errcode = '22023', message = 'goal_status';
  end if;
  if next_progress is null or next_progress < 0 or next_progress > 100 then
    raise exception using errcode = '22023', message = 'goal_progress';
  end if;
  clean_note := nullif(btrim(coalesce(next_note, '')), '');
  if clean_note is not null and char_length(clean_note) > 500 then
    raise exception using errcode = '22023', message = 'goal_note';
  end if;

  update public.patients
    set goal = clean_goal,
        goal_status = next_status,
        goal_progress = next_progress,
        goal_updated_at = now()
    where id = target;

  insert into public.goal_history (patient_id, nutritionist_id, goal, status, progress, note)
  values (target, nid, clean_goal, next_status, next_progress, clean_note);
end;
$$;

revoke all on function public.set_patient_goal(uuid, text, text, integer, text) from public, anon;
grant execute on function public.set_patient_goal(uuid, text, text, integer, text) to authenticated;

create or replace function private.patient_goal_projection()
returns table(
  id uuid,
  goal_status text,
  goal_progress integer,
  goal_updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
rows 1
as $$
begin
  if auth.uid() is null then return; end if;
  return query
    select p.id, p.goal_status, p.goal_progress, p.goal_updated_at
    from public.patients p
    where p.user_id = auth.uid()
      and p.deactivated_at is null
      and p.anonymized_at is null;
end;
$$;

create or replace function private.patient_goal_updates()
returns table(
  id uuid,
  patient_id uuid,
  goal text,
  status text,
  progress integer,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then return; end if;
  return query
    select h.id, h.patient_id, h.goal, h.status, h.progress, h.updated_at
    from public.goal_history h
    join public.patients p on p.id = h.patient_id
    where p.user_id = auth.uid()
      and p.deactivated_at is null
      and p.anonymized_at is null
    order by h.updated_at desc
    limit 20;
end;
$$;

revoke all on function private.patient_goal_projection() from public, anon, authenticated;
revoke all on function private.patient_goal_updates() from public, anon, authenticated;
grant execute on function private.patient_goal_projection() to authenticated;
grant execute on function private.patient_goal_updates() to authenticated;

create or replace view public.patient_goal_patient_view
with (security_barrier = true, security_invoker = true) as
select id, goal_status, goal_progress, goal_updated_at
from private.patient_goal_projection();

create or replace view public.goal_updates_patient_view
with (security_barrier = true, security_invoker = true) as
select id, patient_id, goal, status, progress, updated_at
from private.patient_goal_updates();

revoke all on public.patient_goal_patient_view, public.goal_updates_patient_view from public, anon, authenticated;

do $$
declare relation regclass;
declare columns text;
begin
  foreach relation in array array[
    'public.patient_goal_patient_view'::regclass,
    'public.goal_updates_patient_view'::regclass
  ]
  loop
    select string_agg(format('%I', attname), ', ' order by attnum) into columns
      from pg_attribute
      where attrelid = relation and attnum > 0 and not attisdropped;
    execute format(
      'revoke all privileges (%s) on table %s from public, anon, authenticated',
      columns,
      relation
    );
  end loop;
end $$;

grant select on public.patient_goal_patient_view, public.goal_updates_patient_view to authenticated;

notify pgrst, 'reload schema';
