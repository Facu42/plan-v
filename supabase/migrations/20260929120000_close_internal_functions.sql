-- Seguridad (apartado A, 2026-09-29): cierra 34 funciones internas de la base.
--
-- Qué pasaba: las migraciones sacaban el permiso de ejecutar a "public" y "anon",
-- pero Supabase además le da permiso directo a "authenticated" sobre toda función
-- nueva del esquema public. Así, estas funciones de uso interno (arman la respuesta
-- o validan acceso dentro de otras funciones) quedaban llamables por cualquier
-- persona con sesión iniciada, salteando los controles de la función que las usa.
-- Ejemplo comprobado: thread_message_json(id) devolvía el texto de un mensaje de
-- otra paciente a una nutricionista ajena.
--
-- Ninguna de estas se llama desde la API, la web, reglas de acceso ni vistas: sólo
-- desde otras funciones que corren con permisos de dueño, así que no cambia nada
-- para la app. La prueba server/security/definer-grants.postgres.test.ts fija la
-- lista de funciones que sí pueden quedar abiertas.

revoke execute on function
  public.ai_job_json(uuid),
  public.appointment_assert_patient(uuid),
  public.appointment_assert_pro(uuid),
  public.can_care_for_patient(uuid),
  public.diary_assert_access(uuid, boolean),
  public.exercise_assert_prescribe(),
  public.exercise_can_prescribe(),
  public.exercise_library_json(),
  public.is_org_manager(uuid),
  public.is_own_patient(uuid),
  public.meal_log_json(uuid),
  public.meal_plan_item_json(uuid),
  public.meal_plan_professional_json(uuid),
  public.meal_plan_version_json(uuid),
  public.org_snapshot(uuid),
  public.org_subscription_allows_care(uuid),
  public.outbox_assert_access(uuid),
  public.outbox_event_json(public.outbox_events),
  public.outbox_mailbox_json(uuid),
  public.outbox_patient_skip(uuid),
  public.outbox_pref_on(uuid, text),
  public.patient_can_see_resource(public.resources, uuid),
  public.privacy_assert_patient(uuid),
  public.privacy_request_json(uuid),
  public.recipe_assert_nutri(),
  public.recipe_card_json(uuid),
  public.recipe_day_json(uuid),
  public.recipe_professional_json(uuid),
  public.recipe_version_json(uuid),
  public.resource_row_json(public.resources),
  public.shopping_assert_patient(uuid),
  public.shopping_list_json(uuid),
  public.thread_assert_access(uuid),
  public.thread_message_json(uuid, boolean)
from public, anon, authenticated;

-- De acá en adelante, una función nueva nace cerrada: cada migración da el permiso
-- a "authenticated" explícitamente sólo a las que la app llama.
alter default privileges revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon, authenticated;
