-- Meta de agua de cada paciente (vasos por día), que elige la nutri.
-- Vacía significa la de siempre: 8 vasos. La paciente la lee por una vista propia, solo su fila.
-- También deja anotar hasta 16 vasos por día (antes el tope era 8 aunque la paciente tomara más).
-- No se aplica sola: espera la frase escrita de Facundo en la base en línea. Es repetible.
-- Retroceso, si hiciera falta: borrar la vista y la función nuevas, la columna water_goal_glasses
-- y volver la regla de habit_logs a 0..8 (antes, bajar a 8 los días anotados con más).

alter table public.patients add column if not exists water_goal_glasses smallint;

alter table public.patients drop constraint if exists patients_water_goal_glasses_check;
alter table public.patients
  add constraint patients_water_goal_glasses_check
  check (water_goal_glasses is null or water_goal_glasses between 4 and 16);

-- La profesional ya edita la ficha con permisos por columna: se suma esta.
grant update (water_goal_glasses) on public.patients to authenticated;

comment on column public.patients.water_goal_glasses is
  'Meta de agua en vasos por día que indica la profesional (4 a 16). Vacía: 8 vasos.';

alter table public.habit_logs drop constraint if exists habit_logs_hydration_check;
alter table public.habit_logs
  add constraint habit_logs_hydration_check check (hydration between 0 and 16);

create or replace function private.patient_water_goal()
returns table(id uuid, water_goal_glasses smallint)
language plpgsql
stable
security definer
set search_path = ''
rows 1
as $$
begin
  if auth.uid() is null then return; end if;
  return query
    select p.id, p.water_goal_glasses
    from public.patients p
    where p.user_id = auth.uid()
      and p.deactivated_at is null
      and p.anonymized_at is null;
end;
$$;

revoke all on function private.patient_water_goal() from public, anon, authenticated;
grant execute on function private.patient_water_goal() to authenticated;

create or replace view public.patient_water_goal_view
with (security_barrier = true, security_invoker = true) as
select id, water_goal_glasses
from private.patient_water_goal();

revoke all on public.patient_water_goal_view from public, anon, authenticated;
revoke all privileges (id, water_goal_glasses) on table public.patient_water_goal_view from public, anon, authenticated;
grant select on public.patient_water_goal_view to authenticated;

notify pgrst, 'reload schema';
