-- Verificación en dos pasos (MFA) para administradoras y nutricionistas. Ver issue #132, tarea 1.
-- Todo aditivo y APAGADO de fábrica: sin borrar nada ni tocar las reglas actuales. Se suma una regla
-- «restrictiva» por tabla sensible que exige un token aal2 (con el segundo paso hecho), pero solo a
-- las nutricionistas y a las administradoras, y solo cuando private.mfa_enforcement.enabled = true.
-- Orden para prenderlo (cada paso lo confirma Facundo por escrito):
--   1) aplicar esta migración (no cambia nada mientras enabled = false);
--   2) que Facundo y Verónica den de alta su aplicación de códigos y entren una vez;
--   3) update private.mfa_enforcement set enabled = true;
-- Para apagarlo de nuevo: update private.mfa_enforcement set enabled = false;

create schema if not exists private;
revoke all on schema private from public,anon;
grant usage on schema private to authenticated,service_role;

create table if not exists private.mfa_enforcement (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  updated_at timestamptz not null default clock_timestamp()
);
insert into private.mfa_enforcement (id) values (true) on conflict (id) do nothing;
revoke all on private.mfa_enforcement from public,anon,authenticated;

create or replace function private.mfa_gate_ok()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'aal', 'aal1') = 'aal2'
    or auth.uid() is null
    or not coalesce((select e.enabled from private.mfa_enforcement e where e.id), false)
    or not (
      exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'nutri')
      or exists (select 1 from public.platform_admins a where a.user_id = auth.uid())
    );
$$;
revoke all on function private.mfa_gate_ok() from public,anon;
grant execute on function private.mfa_gate_ok() to authenticated,service_role;

-- Las tablas del panel de administración (platform_admins y compañía) no llevan regla: no tienen
-- políticas y solo se leen por funciones; ahí el segundo paso lo exige el servidor (requireAdmin).
do $$
declare
  t text;
begin
  foreach t in array array[
    'patients','measurements','clinical_notes','care_records','patient_body_data',
    'consultation_sessions','meal_plans'
  ] loop
    if to_regclass('public.' || t) is not null
       and not exists (select 1 from pg_policies where schemaname = 'public' and tablename = t and policyname = 'mfa_aal2_gate') then
      execute format('create policy mfa_aal2_gate on public.%I as restrictive for all to authenticated using (private.mfa_gate_ok()) with check (private.mfa_gate_ok())', t);
    end if;
  end loop;
end $$;
