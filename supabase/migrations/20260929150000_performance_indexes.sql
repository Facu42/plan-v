-- Base de datos (apartado E, 2026-09-29): mejoras de velocidad que marca el asesor
-- de rendimiento de Supabase. No cambia quién puede ver o hacer qué.
--
-- 1. Siete reglas de acceso llamaban a auth.uid() una vez por fila. Envolverlo en
--    (select auth.uid()) hace que se calcule una sola vez por consulta. El resultado
--    es el mismo. patients_self_select viene del contrato viejo y puede no existir
--    en una base nueva, por eso cada cambio se hace sólo si la regla existe.
-- 2. 63 claves que apuntan a otra tabla no tenían índice. Sin índice, borrar o
--    buscar por esas columnas recorre la tabla entera.

do $$
declare
  p record;
begin
  for p in
    select * from (values
      ('profiles', 'profiles_select_own', 'id = (select auth.uid())', null),
      ('profiles', 'profiles_update_own', 'id = (select auth.uid())', 'id = (select auth.uid())'),
      ('nutritionists', 'nutritionists_select_own', 'user_id = (select auth.uid())', null),
      ('patients', 'patients_self_select', 'user_id = (select auth.uid())', null),
      ('messages', 'messages_nutri_insert', null,
        'nutritionist_id = public.my_nutritionist_id() and author_id = (select auth.uid())'),
      ('messages', 'messages_patient_insert', null,
        'patient_id = public.my_patient_id() and author_id = (select auth.uid()) and suggested_by_ai = false and sent_at is not null'),
      ('meal_reviews', 'meal_reviews_nutri_insert', null,
        'reviewer_id = (select auth.uid()) and exists (select 1 from public.meal_logs l where l.id = meal_reviews.meal_log_id and public.is_assigned_patient(l.patient_id))')
    ) as v(tbl, pol, using_expr, check_expr)
  loop
    if exists (select 1 from pg_policies where schemaname = 'public' and tablename = p.tbl and policyname = p.pol) then
      if p.using_expr is not null then
        execute format('alter policy %I on public.%I using (%s)', p.pol, p.tbl, p.using_expr);
      end if;
      if p.check_expr is not null then
        execute format('alter policy %I on public.%I with check (%s)', p.pol, p.tbl, p.check_expr);
      end if;
    end if;
  end loop;
end $$;

create index if not exists activity_logs_assignment_id_fk_idx on public.activity_logs (assignment_id);
create index if not exists activity_logs_patient_id_nutritionist_id_fk_idx on public.activity_logs (patient_id, nutritionist_id);
create index if not exists ai_briefs_dismissed_by_fk_idx on public.ai_briefs (dismissed_by);
create index if not exists ai_briefs_patient_id_nutritionist_id_fk_idx on public.ai_briefs (patient_id, nutritionist_id);
create index if not exists ai_jobs_patient_id_nutritionist_id_fk_idx on public.ai_jobs (patient_id, nutritionist_id);
create index if not exists ai_jobs_requested_by_fk_idx on public.ai_jobs (requested_by);
create index if not exists appointment_events_appointment_id_fk_idx on public.appointment_events (appointment_id);
create index if not exists appointment_events_patient_id_nutritionist_id_fk_idx on public.appointment_events (patient_id, nutritionist_id);
create index if not exists appointments_patient_id_nutritionist_id_fk_idx on public.appointments (patient_id, nutritionist_id);
create index if not exists asset_upload_intents_asset_id_fk_idx on public.asset_upload_intents (asset_id);
create index if not exists asset_upload_intents_patient_id_nutritionist_id_fk_idx on public.asset_upload_intents (patient_id, nutritionist_id);
create index if not exists care_replacements_patient_id_fk_idx on public.care_replacements (patient_id);
create index if not exists care_replacements_request_id_patient_id_fk_idx on public.care_replacements (request_id, patient_id);
create index if not exists clinical_notes_author_id_fk_idx on public.clinical_notes (author_id);
create index if not exists consent_events_actor_id_fk_idx on public.consent_events (actor_id);
create index if not exists consent_events_purpose_fk_idx on public.consent_events (purpose);
create index if not exists exercise_routine_items_exercise_id_fk_idx on public.exercise_routine_items (exercise_id);
create index if not exists exercise_routine_items_routine_version_id_fk_idx on public.exercise_routine_items (routine_version_id);
create index if not exists exercise_routines_nutritionist_id_fk_idx on public.exercise_routines (nutritionist_id);
create index if not exists favorites_patient_id_nutritionist_id_fk_idx on public.favorites (patient_id, nutritionist_id);
create index if not exists intake_sessions_reviewed_by_fk_idx on public.intake_sessions (reviewed_by);
create index if not exists meal_logs_meal_slot_id_fk_idx on public.meal_logs (meal_slot_id);
create index if not exists meal_plan_items_recipe_version_id_fk_idx on public.meal_plan_items (recipe_version_id);
create index if not exists meal_reviews_reviewer_id_fk_idx on public.meal_reviews (reviewer_id);
create index if not exists measurements_patient_id_nutritionist_id_fk_idx on public.measurements (patient_id, nutritionist_id);
create index if not exists messages_author_id_fk_idx on public.messages (author_id);
create index if not exists messages_patient_id_nutritionist_id_fk_idx on public.messages (patient_id, nutritionist_id);
create index if not exists organization_members_invited_by_fk_idx on public.organization_members (invited_by);
create index if not exists organizations_created_by_fk_idx on public.organizations (created_by);
create index if not exists outbox_events_nutritionist_id_fk_idx on public.outbox_events (nutritionist_id);
create index if not exists ownership_transfer_events_actor_id_fk_idx on public.ownership_transfer_events (actor_id);
create index if not exists ownership_transfer_events_from_nutritionist_id_fk_idx on public.ownership_transfer_events (from_nutritionist_id);
create index if not exists ownership_transfer_events_organization_id_fk_idx on public.ownership_transfer_events (organization_id);
create index if not exists ownership_transfer_events_to_nutritionist_id_fk_idx on public.ownership_transfer_events (to_nutritionist_id);
create index if not exists patient_assets_patient_id_nutritionist_id_fk_idx on public.patient_assets (patient_id, nutritionist_id);
create index if not exists patient_assets_uploaded_by_fk_idx on public.patient_assets (uploaded_by);
create index if not exists patient_care_links_granted_by_fk_idx on public.patient_care_links (granted_by);
create index if not exists patient_care_links_nutritionist_id_fk_idx on public.patient_care_links (nutritionist_id);
create index if not exists patient_care_links_organization_id_fk_idx on public.patient_care_links (organization_id);
create index if not exists patient_invites_accepted_by_fk_idx on public.patient_invites (accepted_by);
create index if not exists patient_invites_patient_id_nutritionist_id_fk_idx on public.patient_invites (patient_id, nutritionist_id);
create index if not exists patients_nutritionist_id_fk_idx on public.patients (nutritionist_id);
create index if not exists payment_webhook_events_payment_id_fk_idx on public.payment_webhook_events (payment_id);
create index if not exists payments_patient_id_nutritionist_id_fk_idx on public.payments (patient_id, nutritionist_id);
create index if not exists professional_habilitations_verified_by_fk_idx on public.professional_habilitations (verified_by);
create index if not exists recipe_assignments_patient_id_nutritionist_id_fk_idx on public.recipe_assignments (patient_id, nutritionist_id);
create index if not exists recipe_assignments_recipe_version_id_fk_idx on public.recipe_assignments (recipe_version_id);
create index if not exists recipe_day_assignments_patient_id_nutritionist_id_fk_idx on public.recipe_day_assignments (patient_id, nutritionist_id);
create index if not exists recipe_day_assignments_recipe_id_fk_idx on public.recipe_day_assignments (recipe_id);
create index if not exists recipe_day_assignments_recipe_version_id_fk_idx on public.recipe_day_assignments (recipe_version_id);
create index if not exists recipe_day_assignments_registered_meal_id_fk_idx on public.recipe_day_assignments (registered_meal_id);
create index if not exists recipe_ingredients_ingredient_id_fk_idx on public.recipe_ingredients (ingredient_id);
create index if not exists recipe_versions_reviewer_id_fk_idx on public.recipe_versions (reviewer_id);
create index if not exists resource_assignments_assigned_by_fk_idx on public.resource_assignments (assigned_by);
create index if not exists resource_assignments_patient_id_nutritionist_id_fk_idx on public.resource_assignments (patient_id, nutritionist_id);
create index if not exists resources_author_id_fk_idx on public.resources (author_id);
create index if not exists resources_nutritionist_id_fk_idx on public.resources (nutritionist_id);
create index if not exists resources_reviewed_by_fk_idx on public.resources (reviewed_by);
create index if not exists routine_assignments_assigned_by_fk_idx on public.routine_assignments (assigned_by);
create index if not exists routine_assignments_patient_id_nutritionist_id_fk_idx on public.routine_assignments (patient_id, nutritionist_id);
create index if not exists routine_assignments_routine_version_id_fk_idx on public.routine_assignments (routine_version_id);
create index if not exists shopping_manual_items_patient_id_nutritionist_id_fk_idx on public.shopping_manual_items (patient_id, nutritionist_id);
create index if not exists team_members_nutritionist_id_fk_idx on public.team_members (nutritionist_id);
