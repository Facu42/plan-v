-- Supabase entrega INSERT, UPDATE y DELETE a anon y authenticated en cada
-- tabla o vista nueva del esquema public. Así nació meal_logs_patient_view
-- con escritura y sin las reglas de la tabla.
-- Esto solo cambia el privilegio por defecto de lo que se cree después.
-- No saca permisos de las tablas que ya escriben bajo sus reglas.
-- service_role conserva el permiso completo. SELECT sigue para que una vista
-- de lectura no quede muda; el control de CI exige además security_invoker.

alter default privileges in schema public
  revoke insert, update, delete, truncate on tables from anon, authenticated;

do $defaults$
declare
  target text;
begin
  foreach target in array array['postgres', 'supabase_admin']
  loop
    if exists (select 1 from pg_roles where rolname = target) then
      begin
        execute format(
          'alter default privileges for role %I in schema public revoke insert, update, delete, truncate on tables from anon, authenticated',
          target
        );
      exception
        when insufficient_privilege then
          raise notice 'No se pudieron ajustar los privilegios por defecto de %.', target;
      end;
    end if;
  end loop;
end
$defaults$;
