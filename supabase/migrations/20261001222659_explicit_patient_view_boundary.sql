-- Las vistas son el límite de columnas de la paciente; la tabla cruda sigue
-- cerrada a ella. security_invoker=true las hacía heredar ese cierre y perder
-- también la ficha propia. El owner postgres lee la tabla, pero cada vista
-- limita filas por la identidad real del caller y expone columnas explícitas.
-- security_barrier impide adelantar filtros externos a ese límite.
-- No habilita patients_self_select ni modifica filas, cobros o cuentas.

create or replace view public.patients_patient_view
with (security_barrier = true, security_invoker = false) as
select p.id, p.user_id, p.full_name, p.initials, p.tone,
       p.billing_status, p.billing_until, p.status, p.stage, p.goal,
       p.adherence_score, p.created_at
from public.patients p
where auth.uid() is not null and p.user_id = auth.uid();

create or replace view public.patient_access_view
with (security_barrier = true, security_invoker = false) as
select p.id, p.nutritionist_id, p.billing_status, p.billing_until
from public.patients p
where auth.uid() is not null
  and p.deactivated_at is null and p.anonymized_at is null
  and (p.id = public.my_patient_id() or public.is_assigned_patient(p.id));

-- CREATE OR REPLACE conserva ACL previas, incluidas concesiones por columna.
-- El límite debe ser exclusivamente de lectura para cualquier caller público.
revoke all on public.patients_patient_view, public.patient_access_view from public, anon, authenticated;
do $$
declare
  relation regclass;
  columns text;
begin
  foreach relation in array array[
    'public.patients_patient_view'::regclass,
    'public.patient_access_view'::regclass
  ] loop
    select string_agg(format('%I', attname), ', ' order by attnum)
      into columns from pg_attribute
      where attrelid = relation and attnum > 0 and not attisdropped;
    execute format('revoke all privileges (%s) on table %s from public, anon, authenticated', columns, relation);
  end loop;
end $$;
grant select on public.patients_patient_view, public.patient_access_view to authenticated;
notify pgrst, 'reload schema';
