-- La lista de consultas de la profesional lee consultation_sessions.
-- La política llamaba a can_care_for_patient, cuyo EXECUTE se le sacó a
-- authenticated el 2026-09-29 porque es un helper interno. Postgres responde
-- 42501 (permission denied for function) y la API lo muestra como falta de
-- permisos de la paciente, aunque los tres consentimientos estén dados y el
-- worker siga procesando. El mismo chequeo queda dentro de una función con
-- permisos de dueño, ejecutable por la sesión.
-- Reversión: recrear la política anterior y borrar consultation_session_visible.
-- No borra filas. Sin aplicar en producción hasta la frase de Facundo.

begin;

create function public.consultation_session_visible(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.can_care_for_patient(target)
    and public.consultation_can_read(target);
$$;

revoke all on function public.consultation_session_visible(uuid) from public, anon;
grant execute on function public.consultation_session_visible(uuid) to authenticated;

drop policy consultation_sessions_pro on public.consultation_sessions;
create policy consultation_sessions_pro on public.consultation_sessions
  for select to authenticated
  using (public.consultation_session_visible(patient_id));

notify pgrst, 'reload schema';

commit;
