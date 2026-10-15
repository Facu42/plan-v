-- Las vistas *_patient_view son proyecciones de lectura para la paciente.
-- La app escribe por funciones con guardas, nunca por estas vistas.
-- En producción (comprobado el 14/10/2026) appointments_patient_view,
-- intake_patient_view y messages_patient_view seguían con permisos de
-- escritura para anon y authenticated (heredados), y meal_logs_patient_view
-- con permisos de más además de la lectura.
-- Son security_invoker, así que la RLS de las tablas seguía mandando; esto
-- cierra el permiso de más. Solo quita permisos: no cambia datos ni columnas.
do $$
declare v record;
begin
  for v in
    select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'v' and c.relname like '%\_patient\_view'
  loop
    execute format('revoke all on public.%I from public, anon, authenticated', v.relname);
    execute format('grant select on public.%I to authenticated', v.relname);
  end loop;
end $$;
