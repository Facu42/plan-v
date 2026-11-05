-- Sedes del consultorio (2026-11-06): guarda en qué sede es cada turno que carga la nutricionista o la secretaria.
--
-- Solo agrega: una tabla nueva. No cambia ni borra nada existente.
-- - Las sedes ya existen: son las «agendas» de la configuración de turnos (scheduling_profiles.config.calendars).
-- - Los turnos de la página pública ya tienen su sede (scheduling_bookings.calendar_id); esta tabla es para los demás.
-- - location_id es el id de la sede dentro de esa configuración (no es una clave foránea: la sede vive en el json).
-- Lee y escribe la dueña del consultorio o su secretaria (scheduling_can_manage), nunca otra cuenta.
-- Para volver atrás: drop table public.appointment_locations (los turnos no se tocan).

create table if not exists public.appointment_locations (
  appointment_id uuid primary key references public.appointments(id) on delete cascade,
  nutritionist_id uuid not null references public.nutritionists(id),
  location_id uuid not null,
  updated_by uuid not null default auth.uid(),
  updated_at timestamptz not null default clock_timestamp()
);
create index if not exists appointment_locations_nutritionist_idx on public.appointment_locations (nutritionist_id);

alter table public.appointment_locations enable row level security;

create policy appointment_locations_select on public.appointment_locations
  for select to authenticated using ((select public.scheduling_can_manage(nutritionist_id)));
create policy appointment_locations_insert on public.appointment_locations
  for insert to authenticated with check (
    (select public.scheduling_can_manage(nutritionist_id))
    and exists (select 1 from public.appointments a where a.id = appointment_id and a.nutritionist_id = appointment_locations.nutritionist_id)
  );
create policy appointment_locations_update on public.appointment_locations
  for update to authenticated using ((select public.scheduling_can_manage(nutritionist_id)))
  with check (
    (select public.scheduling_can_manage(nutritionist_id))
    and exists (select 1 from public.appointments a where a.id = appointment_id and a.nutritionist_id = appointment_locations.nutritionist_id)
  );
create policy appointment_locations_delete on public.appointment_locations
  for delete to authenticated using ((select public.scheduling_can_manage(nutritionist_id)));

revoke all on public.appointment_locations from public, anon, authenticated;
grant select, insert, update, delete on public.appointment_locations to authenticated;
grant all on public.appointment_locations to service_role;
