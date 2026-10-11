-- Solo para el entorno efímero. Estado del catálogo publicado el 1/10/2026.
-- Esta política legacy existe en producción y NO está en la cadena de migraciones.
-- Se reproduce antes de una eventual migración correctiva para evitar un falso verde.
create policy patients_self_select on public.patients
  for select to authenticated using (user_id = auth.uid());

