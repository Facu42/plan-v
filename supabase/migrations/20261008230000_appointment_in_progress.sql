-- La consulta actual permanece accesible hasta el final de su duración.
-- Se conserva el modo invocador y los permisos internos existentes.
create or replace function public.appointment_current(pid uuid)
returns public.appointments language plpgsql stable set search_path='' as $$
declare current public.appointments;
begin
  select * into current from public.appointments
  where patient_id=pid and status='scheduled'
    and starts_at + pg_catalog.make_interval(mins => duration_min) > pg_catalog.clock_timestamp()
  order by starts_at limit 1;
  return current;
end; $$;
