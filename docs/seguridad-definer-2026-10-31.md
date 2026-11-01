# Seguridad de funciones y políticas · 31/10/2026

Alcance: rama `work/seguridad-definer`, base `fb5cb9bb`. Solo archivos y PostgreSQL local en memoria (PGlite); ninguna consulta ni migración en producción.

## Método y decisiones

Se aplicó la cadena completa de `supabase/migrations` en orden con roles `anon`, `authenticated` y `service_role`, incluyendo los privilegios iniciales de Supabase. Se consultaron `pg_proc`, `has_function_privilege`, `pg_policies` y las definiciones finales. Se cruzaron nombres con `.rpc(`, los wrappers `call`/`rpc` de `src/` y `server/`, las políticas y las vistas invoker. Las referencias de la tabla son archivos de implementación, no pruebas.

Resultado previo: **403 SECURITY DEFINER**, **219 ejecutables por authenticated**, **0 por anon**. Las otras 184 ya estaban cerradas. **Ninguna carece de search_path fijo**: no hace falta modificarlo; el test ahora exige que exista en public y private.

Solo se revocan `public.set_recipe_cover(uuid,text,text,text)` y `public.scheduling_can_read_shared(uuid)`: no tienen llamadas de cliente ni aparecen en políticas/vistas. Sus llamadores internos son funciones definer (portada manual/reserva de portada; consultas compartidas), que conservan acceso como dueño. No se elimina ninguna función. No se cambia el contrato de los RPC usados por la app.

La allowlist pasa de nombres públicos a **firmas completas con esquema y tipos**, incluidos helpers privados de vistas/wrappers invoker. Una sobrecarga nueva, una función privada nueva o un grant nuevo hacen fallar el test hasta una revisión explícita. Se agrega únicamente `public.admin_record_audit(uuid,text,text,uuid)` para auditoría, con control admin y aal2 en SQL. Resultado final: **218 firmas ejecutables por authenticated**, ninguna por anon.

Las políticas permisivas múltiples se reúnen por tabla/comando con OR, conservando USING y WITH CHECK (incluido su fallback original). Las políticas restrictivas se mantienen. Las tablas afectadas quedan dirigidas a authenticated. Habit logs revoca expresamente INSERT a PUBLIC y anon; la paciente propia con acceso y la profesional asignada conservan acceso, otra profesional queda excluida. No había un INSERT anónimo permitido en el ensayo previo: se refuerza la garantía y se evita evaluar helpers para ese rol.

## Tabla de decisiones: ejecutables antes del cambio

Todas las filas tenían anon = no y authenticated = sí. «Servidor» incluye RPC literales y wrappers tipados/seleccionados en ese archivo. «RLS» señala la política que lo necesita. Las proyecciones y wrappers invoker privados necesitan EXECUTE del usuario para funcionar.

| Función (firma) | Uso comprobado | Decisión |
|---|---|---|
| `private.list_patient_nutrition_exchanges(uuid)` | Servidor: `server/nutrition-capabilities/exchange-visibility.ts` | Mantener |
| `private.mfa_gate_ok()` | RLS: `consultation_sessions.mfa_aal2_gate` y otras | Mantener |
| `private.nutrition_exchange_visibility()` | Servidor: `server/nutrition-capabilities/exchange-visibility.ts` | Mantener |
| `private.nutrition_patient_is_active(uuid)` | RLS: `patient_body_data.body_data_read_pro` y otras | Mantener |
| `private.patient_access_projection()` | Vista invoker de paciente (ver migración de proyección) | Mantener |
| `private.patient_goal_projection()` | Vista invoker de paciente (ver migración de proyección) | Mantener |
| `private.patient_goal_updates()` | Vista invoker de paciente (ver migración de proyección) | Mantener |
| `private.patient_profile_projection()` | Vista invoker de paciente (ver migración de proyección) | Mantener |
| `private.patient_water_goal()` | Vista invoker de paciente (ver migración de proyección) | Mantener |
| `private.reopen_patient_intake(uuid,integer)` | Servidor: `server/intake/repository.ts` | Mantener |
| `private.save_manual_recipe_cover(uuid,integer,text,text)` | Servidor: `server/recipes/manual-cover.ts` | Mantener |
| `private.save_nutrition_exchange_visibility(bigint,boolean)` | Servidor: `server/nutrition-capabilities/exchange-visibility.ts` | Mantener |
| `private.save_nutrition_target_versioned(uuid,jsonb,jsonb,boolean,bigint)` | Servidor: `server/targets/repository.ts` | Mantener |
| `public.accept_org_invite(uuid)` | Servidor: `server/orgs/repository.ts` | Mantener |
| `public.accept_patient_invite(uuid)` | Servidor: `server/db/supabase-repo.ts` | Mantener |
| `public.ack_thread_delivery(uuid)` | Servidor: `server/messages/repository.ts` | Mantener |
| `public.act_professional_model(uuid,uuid,text)` | Servidor: `server/models/repository.ts` | Mantener |
| `public.add_patient_charge(uuid,integer,date,text)` | Servidor: `server/fees/repository.ts` | Mantener |
| `public.add_patient_clinical_note(uuid,text)` | Servidor: `server/intake/repository.ts` | Mantener |
| `public.add_shopping_manual(jsonb)` | Servidor: `server/shopping/repository.ts` | Mantener |
| `public.admin_extend_trial(uuid,integer)` | Servidor: `server/admin/repository.ts` | Mantener |
| `public.admin_get_service_board()` | Servidor: `server/admin/repository.ts` | Mantener |
| `public.admin_log_service_event(uuid,text,text)` | Servidor: `server/admin/accounts.ts` | Mantener |
| `public.admin_mark_test_account(uuid)` | Servidor: `server/admin/accounts.ts` | Mantener |
| `public.admin_record_service_payment(uuid,integer,integer,date,text,text)` | Servidor: `server/admin/repository.ts` | Mantener |
| `public.admin_set_service_note(uuid,text)` | Servidor: `server/admin/repository.ts` | Mantener |
| `public.admin_set_service_override(uuid,text,text)` | Servidor: `server/admin/repository.ts` | Mantener |
| `public.admin_set_service_settings(integer,integer)` | Servidor: `server/admin/repository.ts` | Mantener |
| `public.admin_void_service_payment(uuid)` | Servidor: `server/admin/repository.ts` | Mantener |
| `public.apply_ai_job(uuid)` | Servidor: `server/ai-jobs/repository.ts` | Mantener |
| `public.apply_patient_import_row(uuid,jsonb)` | Servidor: `server/patient-import/repository.ts` | Mantener |
| `public.apply_professional_model(uuid,jsonb)` | Servidor: `server/models/repository.ts` | Mantener |
| `public.approve_clinical_reference(jsonb)` | Servidor: `server/clinical-workspace/repository.ts` | Mantener |
| `public.assign_editorial_resource(text,uuid[])` | Servidor: `server/resources/repository.ts` | Mantener |
| `public.assign_exercise_routine(uuid,text,jsonb)` | Servidor: `server/exercise/repository.ts` | Mantener |
| `public.assign_patient_program(uuid,uuid,date)` | Servidor: `server/fees/repository.ts` | Mantener |
| `public.assign_recipe(uuid,uuid,integer)` | Servidor: `server/recipes/repository.ts` | Mantener |
| `public.assign_recipe_day(jsonb)` | Servidor: `server/recipes/day.ts` | Mantener |
| `public.audit_clinical_access(uuid,text)` | Servidor: `server/clinical-workspace/repository.ts` | Mantener |
| `public.care_can_read(uuid)` | RLS: `care_preferences.care_preferences_read` y otras | Mantener |
| `public.care_consent(uuid,text)` | RLS: `care_replacements.care_replacements_insert` y otras | Mantener |
| `public.care_meal_photo_allowed(text)` | RLS: `objects.meal_photo_consent_read` y otras | Mantener |
| `public.claim_ai_job(uuid)` | Servidor: `server/ai-jobs/repository.ts` | Mantener |
| `public.claim_meal_plan_email(uuid,integer)` | Servidor: `server/plans/email.ts` | Mantener |
| `public.claim_recipe_cover(uuid,boolean)` | Servidor: `server/recipes/repository.ts` | Mantener |
| `public.complete_privacy_delete(uuid)` | Servidor: `server/privacy/repository.ts` | Mantener |
| `public.complete_privacy_export(jsonb)` | Servidor: `server/privacy/repository.ts` | Mantener |
| `public.confirm_appointment(jsonb)` | Servidor: `server/appointments/repository.ts` | Mantener |
| `public.consultation_can_read(uuid)` | RLS: `consultation_sessions.consultation_sessions_pro` y otras | Mantener |
| `public.consultation_command(uuid,jsonb)` | Servidor: `server/consultations/repository.ts` | Mantener |
| `public.consultation_completion_command(uuid,jsonb)` | Servidor: `server/consultations/repository.ts` | Mantener |
| `public.consultation_completion_list(uuid,integer,integer)` | Servidor: `server/consultations/repository.ts` | Mantener |
| `public.consultation_enqueue_chunk(uuid,uuid,jsonb)` | Servidor: `server/consultations/repository.ts` | Mantener |
| `public.consultation_list_tasks(uuid)` | Servidor: `server/consultations/repository.ts` | Mantener |
| `public.correct_own_meal(jsonb)` | Servidor: `server/security/contracts.ts` | Mantener |
| `public.correct_own_measurement(jsonb)` | Servidor: `server/security/contracts.ts` | Mantener |
| `public.create_organization(text,text)` | Servidor: `server/orgs/repository.ts` | Mantener |
| `public.create_patient_with_invite(jsonb)` | Servidor: `server/db/supabase-repo.ts` | Mantener |
| `public.deactivate_clinical_reference(uuid)` | Servidor: `server/clinical-workspace/repository.ts` | Mantener |
| `public.delegate_patient_care(uuid,uuid,text,uuid)` | Servidor: `server/orgs/repository.ts` | Mantener |
| `public.delete_billing_program(uuid)` | Servidor: `server/fees/repository.ts` | Mantener |
| `public.delete_care_document(uuid,uuid)` | Servidor: `server/care/repository.ts` | Mantener |
| `public.delete_care_photo(uuid,uuid)` | Servidor: `server/care/repository.ts` | Mantener |
| `public.delete_own_meal(jsonb)` | Servidor: `server/diary/repository.ts` | Mantener |
| `public.delete_own_measurement(jsonb)` | Servidor: `server/care/repository.ts` | Mantener |
| `public.delete_patient_activity(uuid,uuid)` | Servidor: `server/exercise/repository.ts` | Mantener |
| `public.delete_shopping_manual(jsonb)` | Servidor: `server/shopping/repository.ts` | Mantener |
| `public.document_organizer_enqueue(uuid,uuid,text,jsonb)` | Servidor: `server/document-organizer/repository.ts` | Mantener |
| `public.document_organizer_list(uuid,text)` | Servidor: `server/document-organizer/repository.ts` | Mantener |
| `public.document_organizer_read(uuid)` | Servidor: `server/document-organizer/repository.ts` | Mantener |
| `public.document_organizer_review(uuid,integer,jsonb)` | Servidor: `server/document-organizer/repository.ts` | Mantener |
| `public.enqueue_ai_job(jsonb)` | Servidor: `server/ai-jobs/repository.ts` | Mantener |
| `public.enqueue_outbox_event(jsonb)` | Servidor: `server/outbox/repository.ts` | Mantener |
| `public.export_patient_imported_history(uuid)` | Servidor: `server/clinical-workspace/repository.ts` | Mantener |
| `public.finish_ai_job(jsonb)` | Servidor: `server/ai-jobs/repository.ts` | Mantener |
| `public.finish_recipe_cover(uuid,uuid,text,text,text)` | Servidor: `server/recipes/repository.ts` | Mantener |
| `public.get_ai_job(uuid)` | Servidor: `server/ai-jobs/repository.ts` | Mantener |
| `public.get_billing_board()` | Servidor: `server/fees/repository.ts` | Mantener |
| `public.get_my_subscriptions()` | Servidor: `server/subscriptions/repository.ts` | Mantener |
| `public.get_notification_preferences()` | Servidor: `server/outbox/repository.ts` | Mantener |
| `public.get_organization_subscription(uuid)` | Servidor: `server/orgs/repository.ts` | Mantener |
| `public.get_patient_appointment(uuid)` | Servidor: `server/appointments/repository.ts` | Mantener |
| `public.get_patient_exercise(uuid)` | Servidor: `server/exercise/repository.ts` | Mantener |
| `public.get_patient_intake(uuid)` | Servidor: `server/intake/repository.ts` | Mantener |
| `public.get_patient_ledger(uuid)` | Servidor: `server/fees/repository.ts` | Mantener |
| `public.get_patient_library(uuid,text)` | Servidor: `server/resources/repository.ts` | Mantener |
| `public.get_patient_meal_logs(uuid)` | Servidor: `server/db/supabase-repo.ts` | Mantener |
| `public.get_patient_progress(uuid,integer)` | Servidor: `server/progress/repository.ts` | Mantener |
| `public.get_privacy_package(uuid)` | Servidor: `server/privacy/repository.ts` | Mantener |
| `public.get_shopping_list(uuid)` | Servidor: `server/shopping/repository.ts` | Mantener |
| `public.get_weekly_registrations(uuid[])` | Servidor: `server/progress/weekly-repository.ts` | Mantener |
| `public.invite_org_member(uuid,uuid,text)` | Servidor: `server/orgs/repository.ts` | Mantener |
| `public.is_assigned_patient(uuid)` | RLS: `meal_slots.meal_slots_nutri_all` y otras | Mantener |
| `public.is_assigned_patient_path(text)` | RLS: `objects.meal_photos_nutri_select` y otras | Mantener |
| `public.is_org_member(uuid)` | RLS: `organizations.organizations_member_select` y otras | Mantener |
| `public.is_platform_admin()` | Servidor: `server/admin/repository.ts` | Mantener |
| `public.list_ai_jobs(uuid)` | Servidor: `server/ai-jobs/repository.ts` | Mantener |
| `public.list_assigned_recipes(uuid)` | Servidor: `server/recipes/repository.ts` | Mantener |
| `public.list_meal_plan_history(uuid)` | Servidor: `server/plans/repository.ts` | Mantener |
| `public.list_my_organizations()` | Servidor: `server/orgs/repository.ts` | Mantener |
| `public.list_outbox_mailbox(uuid)` | Servidor: `server/outbox/repository.ts` | Mantener |
| `public.list_outbox_snapshot(uuid)` | Servidor: `server/outbox/repository.ts` | Mantener |
| `public.list_patient_care_links(uuid)` | Servidor: `server/orgs/repository.ts` | Mantener |
| `public.list_patient_import_contacts(integer)` | Servidor: `server/patient-import/repository.ts` | Mantener |
| `public.list_privacy_requests(uuid)` | Servidor: `server/privacy/repository.ts` | Mantener |
| `public.list_professional_meal_plan(uuid)` | Servidor: `server/plans/repository.ts` | Mantener |
| `public.list_professional_recipe_favorites()` | Servidor: `server/recipes/repository.ts` | Mantener |
| `public.list_professional_recipes()` | Servidor: `server/recipes/repository.ts` | Mantener |
| `public.list_published_meal_plan(uuid)` | Servidor: `server/plans/repository.ts` | Mantener |
| `public.list_recipe_days(uuid,date)` | Servidor: `server/recipes/day.ts` | Mantener |
| `public.list_thread_messages(uuid,boolean)` | Servidor: `server/messages/repository.ts` | Mantener |
| `public.log_patient_activity(uuid,text,integer,text,text,uuid,integer,integer,uuid)` | Servidor: `server/exercise/repository.ts` | Mantener |
| `public.log_patient_activity_with_kcal(uuid,text,integer,text,integer,text,uuid)` | Servidor: `server/exercise/repository.ts` | Mantener |
| `public.mark_editorial_resource_read(uuid,text)` | Servidor: `server/resources/repository.ts` | Mantener |
| `public.mark_meal_plan_handover_seen(uuid)` | Servidor: `server/plans/repository.ts` | Mantener |
| `public.mark_thread_read(uuid)` | Servidor: `server/messages/repository.ts` | Mantener |
| `public.my_archived_at()` | Servidor: `server/db/supabase-repo.ts` | Mantener |
| `public.my_nutritionist_id()` | RLS: `patients.patients_nutri_all` y otras | Mantener |
| `public.my_patient_id()` | RLS: `meal_slots.meal_slots_patient_select` y otras | Mantener |
| `public.open_message_attachment(uuid,uuid)` | Servidor: `server/messages/repository.ts` | Mantener |
| `public.ops_can_read_clinic(uuid)` | RLS: `ops_broadcasts.ops_broadcasts_read` y otras | Mantener |
| `public.ops_can_read_patient(uuid)` | RLS: `ops_contact_preferences.ops_preferences_read` | Mantener |
| `public.ops_create_broadcast(uuid,text,text,uuid[],text)` | Servidor: `server/communications/routes.ts` | Mantener |
| `public.ops_create_email_broadcast(uuid,text,text,uuid[])` | Servidor: `server/communications/channel-routes.ts` | Mantener |
| `public.ops_review_reminder_template(uuid,text,text,text)` | Servidor: `server/communications/channel-routes.ts` | Mantener |
| `public.ops_set_preferences(uuid,text,boolean,boolean,text)` | Servidor: `server/communications/routes.ts` | Mantener |
| `public.patient_has_full_access(uuid)` | RLS: `meal_slots.meal_slots_patient_select` y otras | Mantener |
| `public.patient_import_authorization_state(uuid)` | Servidor: `server/patient-import/external-authorization.ts` | Mantener |
| `public.patient_import_external_allowed(uuid,text)` | Servidor: `server/patient-import/external-authorization.ts`; RLS: `patient_import_measurements.import_measurements_owner` y otras | Mantener |
| `public.prepare_imported_patient_invite(uuid)` | Servidor: `server/patient-import/repository.ts` | Mantener |
| `public.prepare_patient_import(uuid,jsonb)` | Servidor: `server/patient-import/repository.ts` | Mantener |
| `public.process_outbox_deliveries(jsonb)` | Servidor: `server/outbox/repository.ts` | Mantener |
| `public.publish_care_replacement(uuid,uuid,jsonb,jsonb)` | Servidor: `server/care/repository.ts` | Mantener |
| `public.publish_editorial_resource(uuid)` | Servidor: `server/resources/repository.ts` | Mantener |
| `public.publish_recipe(uuid,integer,uuid)` | Servidor: `server/recipes/repository.ts` | Mantener |
| `public.publish_reviewed_meal_plan(uuid,integer,jsonb)` | Servidor: `server/plans/repository.ts` | Mantener |
| `public.record_meal_analysis(jsonb)` | Servidor: `server/diary/repository.ts` | Mantener |
| `public.record_patient_consent(uuid,text,text,text,text)` | Servidor: `server/intake/repository.ts` | Mantener |
| `public.record_patient_import_authorization(uuid,uuid,integer,jsonb)` | Servidor: `server/patient-import/external-authorization.ts` | Mantener |
| `public.record_patient_payment(uuid,integer,date,text,text,uuid)` | Servidor: `server/fees/repository.ts` | Mantener |
| `public.record_privacy_access(jsonb)` | Servidor: `server/privacy/repository.ts` | Mantener |
| `public.register_recipe_day(jsonb)` | Servidor: `server/recipes/day.ts` | Mantener |
| `public.reject_ai_job(uuid)` | Servidor: `server/ai-jobs/repository.ts` | Mantener |
| `public.report_patient_payment(uuid,integer,date,text,text,uuid)` | Servidor: `server/fees/repository.ts` | Mantener |
| `public.request_body_data(uuid)` | Servidor: `server/targets/repository.ts` | Mantener |
| `public.request_meal_correction(jsonb)` | Servidor: `server/diary/repository.ts` | Mantener |
| `public.request_measurement_correction(jsonb)` | Servidor: `server/care/repository.ts` | Mantener |
| `public.request_privacy_action(jsonb)` | Servidor: `server/privacy/repository.ts` | Mantener |
| `public.reschedule_appointment(jsonb)` | Servidor: `server/appointments/repository.ts` | Mantener |
| `public.retry_menu_dish_covers(uuid,integer)` | Servidor: `server/plans/repository.ts` | Mantener |
| `public.review_care_record(uuid,uuid)` | Servidor: `server/care/repository.ts` | Mantener |
| `public.review_meal_log(jsonb)` | Servidor: `server/diary/repository.ts` | Mantener |
| `public.review_patient_intake(uuid,integer)` | Servidor: `server/intake/repository.ts` | Mantener |
| `public.review_patient_payment(uuid,text)` | Servidor: `server/fees/repository.ts` | Mantener |
| `public.revoke_patient_care(uuid)` | Servidor: `server/orgs/repository.ts` | Mantener |
| `public.revoke_patient_import_authorization(uuid,uuid,integer,text)` | Servidor: `server/patient-import/external-authorization.ts` | Mantener |
| `public.save_billing_program(text,integer)` | Servidor: `server/fees/repository.ts` | Mantener |
| `public.save_body_metrics(uuid,date,jsonb)` | Servidor: `server/care/repository.ts` | Mantener |
| `public.save_care_preferences(uuid,jsonb)` | Servidor: `server/care/repository.ts` | Mantener |
| `public.save_care_record(uuid,uuid,date,jsonb)` | Servidor: `server/care/repository.ts` | Mantener |
| `public.save_clinical_brand(jsonb)` | Servidor: `server/clinical-workspace/repository.ts` | Mantener |
| `public.save_clinical_source_document(uuid,jsonb)` | Servidor: `server/clinical-workspace/repository.ts` | Mantener |
| `public.save_clinical_workspace_record(uuid,jsonb)` | Servidor: `server/clinical-workspace/repository.ts` | Mantener |
| `public.save_editorial_resource(text,text,text,text,jsonb,text)` | Servidor: `server/resources/repository.ts` | Mantener |
| `public.save_meal_log(jsonb)` | Servidor: `server/diary/repository.ts` | Mantener |
| `public.save_meal_plan_draft(uuid,jsonb)` | Servidor: `server/plans/repository.ts` | Mantener |
| `public.save_my_body_data(jsonb)` | Servidor: `server/targets/repository.ts` | Mantener |
| `public.save_notification_preferences(jsonb)` | Servidor: `server/outbox/repository.ts` | Mantener |
| `public.save_nutrition_exchange(jsonb)` | Servidor: `server/nutrition-capabilities/repository.ts` | Mantener |
| `public.save_nutrition_settings(bigint,jsonb)` | Servidor: `server/nutrition-capabilities/repository.ts` | Mantener |
| `public.save_patient_intake(uuid,integer,text,jsonb)` | Servidor: `server/intake/repository.ts` | Mantener |
| `public.save_professional_model(jsonb)` | Servidor: `server/models/repository.ts` | Mantener |
| `public.save_recipe_draft(jsonb)` | Servidor: `server/recipes/repository.ts` | Mantener |
| `public.save_routine_feedback(uuid,uuid,integer,integer,text)` | Servidor: `server/exercise/repository.ts` | Mantener |
| `public.schedule_appointment(jsonb)` | Servidor: `server/appointments/repository.ts` | Mantener |
| `public.schedule_reviewed_meal_plan(uuid,integer,jsonb,timestamp with time zone)` | Servidor: `server/plans/repository.ts` | Mantener |
| `public.schedule_thread_messages(jsonb)` | Servidor: `server/messages/scheduled.ts` | Mantener |
| `public.scheduling_accept_staff(text)` | Servidor: `server/scheduling/team-routes.ts` | Mantener |
| `public.scheduling_add_existing_charge(uuid,uuid,uuid,integer,date,text)` | Servidor: `server/scheduling/team-routes.ts` | Mantener |
| `public.scheduling_add_shared_note(uuid,text)` | Servidor: `server/scheduling/team-routes.ts` | Mantener |
| `public.scheduling_can_manage(uuid)` | Servidor: `server/scheduling/team-routes.ts`; RLS: `scheduling_bookings.scheduling_booking_reception` y otras | Mantener |
| `public.scheduling_can_read_shared(uuid)` | Solo funciones internas definer | Revocar PUBLIC, anon, authenticated |
| `public.scheduling_change_booking(uuid,uuid,jsonb,text)` | Servidor: `server/scheduling/repository.ts` | Mantener |
| `public.scheduling_contact_belongs(uuid,uuid)` | Servidor: `server/scheduling/team-routes.ts` | Mantener |
| `public.scheduling_existing_operations(uuid,integer)` | Servidor: `server/scheduling/team-routes.ts` | Mantener |
| `public.scheduling_invite_professional_email(uuid,text)` | Servidor: `server/scheduling/team-routes.ts` | Mantener |
| `public.scheduling_invite_staff(uuid,text,text)` | Servidor: `server/scheduling/team-routes.ts` | Mantener |
| `public.scheduling_my_workplaces()` | Servidor: `server/scheduling/team-routes.ts` | Mantener |
| `public.scheduling_operational_snapshot(uuid,integer)` | Servidor: `server/scheduling/team-routes.ts` | Mantener |
| `public.scheduling_owns(uuid)` | RLS: `scheduling_bookings.scheduling_bookings_pro` y otras | Mantener |
| `public.scheduling_professional_directory(uuid)` | Servidor: `server/scheduling/team-routes.ts` | Mantener |
| `public.scheduling_requeue_appointment_sync(uuid,uuid)` | Servidor: `server/scheduling/team-routes.ts` | Mantener |
| `public.scheduling_requeue_sync_job(uuid,uuid)` | Servidor: `server/scheduling/routes.ts` | Mantener |
| `public.scheduling_review_existing_payment(uuid,uuid,text)` | Servidor: `server/scheduling/team-routes.ts` | Mantener |
| `public.scheduling_review_transfer(uuid,uuid,text)` | Servidor: `server/scheduling/team-routes.ts` | Mantener |
| `public.scheduling_revoke_staff(uuid,uuid)` | Servidor: `server/scheduling/team-routes.ts` | Mantener |
| `public.scheduling_save_config(uuid,integer,jsonb)` | Servidor: `server/scheduling/repository.ts` | Mantener |
| `public.scheduling_save_contact(uuid,uuid,jsonb)` | Servidor: `server/scheduling/team-routes.ts` | Mantener |
| `public.scheduling_shared_clinical_snapshot(uuid)` | Servidor: `server/scheduling/team-routes.ts` | Mantener |
| `public.scheduling_shared_notes(uuid,integer,integer)` | Servidor: `server/scheduling/team-routes.ts` | Mantener |
| `public.scheduling_shared_patients(integer)` | Servidor: `server/scheduling/team-routes.ts` | Mantener |
| `public.scheduling_staff_roster(uuid)` | Servidor: `server/scheduling/team-routes.ts` | Mantener |
| `public.search_food_catalog(jsonb,integer,integer)` | Servidor: `server/foods/repository.ts` | Mantener |
| `public.send_thread_attachment(jsonb)` | Servidor: `server/messages/repository.ts` | Mantener |
| `public.send_thread_message(jsonb)` | Servidor: `server/messages/repository.ts` | Mantener |
| `public.set_organization_subscription_status(uuid,text,text)` | Servidor: `server/orgs/repository.ts` | Mantener |
| `public.set_patient_archived(uuid,boolean)` | Servidor: `server/index.ts` | Mantener |
| `public.set_patient_billing(uuid,text,date)` | Servidor: `server/index.ts` | Mantener |
| `public.set_patient_charge_waived(uuid,boolean)` | Servidor: `server/fees/repository.ts` | Mantener |
| `public.set_patient_fee(uuid,integer,date)` | Servidor: `server/fees/repository.ts` | Mantener |
| `public.set_patient_goal(uuid,text,text,integer,text)` | Servidor: `server/db/supabase-repo.ts` | Mantener |
| `public.set_payment_settings(integer,text,text,text)` | Servidor: `server/fees/repository.ts` | Mantener |
| `public.set_professional_recipe_favorite(uuid,boolean)` | Servidor: `server/recipes/repository.ts` | Mantener |
| `public.set_recipe_cover(uuid,text,text,text)` | Solo funciones internas definer | Revocar PUBLIC, anon, authenticated |
| `public.set_shopping_checked(jsonb)` | Servidor: `server/shopping/repository.ts` | Mantener |
| `public.submit_patient_intake(uuid,integer)` | Servidor: `server/intake/repository.ts` | Mantener |
| `public.toggle_favorite(uuid,text,text)` | Servidor: `server/resources/repository.ts` | Mantener |
| `public.transfer_patient_ownership(uuid,uuid,text)` | Servidor: `server/orgs/repository.ts` | Mantener |
| `public.unpublish_editorial_resource(uuid)` | Servidor: `server/resources/repository.ts` | Mantener |

## Funciones ya cerradas

Sin EXECUTE para anon ni authenticated antes del cambio; se mantienen cerradas:

- `private.capture_recipe_version_title()`
- `private.product_write_seen(uuid,uuid,text,jsonb)`
- `private.save_nutrition_target_before_plan_sync(uuid,jsonb,jsonb,boolean,bigint)`
- `private.save_target_before_formula_selection(uuid,jsonb,jsonb,boolean,bigint)`
- `public.ai_job_json(uuid)`
- `public.apply_ai_job_base(uuid)`
- `public.apply_model_pre_meal_labels(uuid,jsonb)`
- `public.apply_model_pre_meal_times(uuid,jsonb)`
- `public.apply_patient_import_row_online(uuid,jsonb)`
- `public.apply_plan_model_pre_guidance(uuid,jsonb)`
- `public.appointment_assert_patient(uuid)`
- `public.appointment_assert_pro(uuid)`
- `public.assert_current_menu_target(uuid,jsonb)`
- `public.assert_health_publishable(uuid,text)`
- `public.assign_recipe_base(uuid,uuid,integer)`
- `public.assign_recipe_pre_product(uuid,uuid,integer)`
- `public.billing_apply_fee(uuid,uuid,integer,date,text)`
- `public.billing_assert_owner(uuid)`
- `public.billing_ledger_json(uuid)`
- `public.billing_programs_json(uuid)`
- `public.billing_sync_charges(uuid)`
- `public.cache_clinical_provider_result(text,bigint,uuid,uuid,integer,jsonb)`
- `public.can_care_for_patient(uuid)`
- `public.claim_patient_subscription_events(integer)`
- `public.claim_platform_founder_slot()`
- `public.consultation_auto_summary(uuid)`
- `public.consultation_begin_summary(uuid,uuid,text)`
- `public.consultation_claim_task()`
- `public.consultation_complete_task(uuid,uuid,text,text,jsonb)`
- `public.consultation_consent_active(uuid,text)`
- `public.consultation_renew_task(uuid,uuid)`
- `public.consultation_save_summary_step(uuid,uuid,text,jsonb)`
- `public.consultation_withdrawal()`
- `public.consultation_worker_allowed(uuid)`
- `public.deliver_due_scheduled_messages(integer)`
- `public.diary_assert_access(uuid,boolean)`
- `public.document_organizer_allowed(uuid,uuid)`
- `public.document_organizer_claim()`
- `public.document_organizer_consent(uuid,text)`
- `public.document_organizer_finish(uuid,uuid,text)`
- `public.document_organizer_generated(uuid,uuid,jsonb)`
- `public.document_organizer_issue(uuid,uuid)`
- `public.document_organizer_permission(uuid,uuid,uuid,bigint,bigint)`
- `public.document_organizer_renew(uuid,uuid)`
- `public.document_organizer_withdrawal()`
- `public.enqueue_ai_job_base(jsonb)`
- `public.enqueue_ai_job_pre_product(jsonb)`
- `public.enqueue_ingredient_covers(text[],boolean)`
- `public.enqueue_menu_covers_pre_components(uuid,boolean)`
- `public.enqueue_menu_dish_covers(uuid,boolean)`
- `public.exercise_assert_prescribe()`
- `public.exercise_can_prescribe()`
- `public.exercise_library_json()`
- `public.finish_ai_job_pre_product(jsonb)`
- `public.finish_ingredient_cover(text,uuid,text,text,integer,boolean)`
- `public.finish_meal_plan_email(uuid,text)`
- `public.finish_menu_dish_cover(uuid,uuid,text,text,integer)`
- `public.handle_new_user()`
- `public.intake_assert_access(uuid,boolean)`
- `public.intake_bundle(uuid)`
- `public.is_org_manager(uuid)`
- `public.is_own_patient(uuid)`
- `public.lease_ingredient_cover(integer,integer)`
- `public.lease_menu_dish_cover()`
- `public.list_assigned_recipes_base(uuid)`
- `public.list_published_meal_plan_base(uuid)`
- `public.list_published_meal_plan_before_delivery(uuid)`
- `public.list_published_meal_plan_before_vigencia(uuid)`
- `public.log_patient_activity_pre_product(uuid,text,integer,text,text,uuid,integer,integer)`
- `public.meal_log_json(uuid)`
- `public.meal_log_json_pre_product(uuid)`
- `public.meal_plan_change_summary(uuid,uuid)`
- `public.meal_plan_item_before_covers(uuid)`
- `public.meal_plan_item_json(uuid)`
- `public.meal_plan_item_json_base(uuid)`
- `public.meal_plan_item_pre_components(uuid)`
- `public.meal_plan_professional_json(uuid)`
- `public.meal_plan_professional_json_before_delivery(uuid)`
- `public.meal_plan_professional_json_before_vigencia(uuid)`
- `public.meal_plan_version_haystack(uuid)`
- `public.meal_plan_version_json(uuid)`
- `public.meal_plan_version_json_base(uuid)`
- `public.meal_plan_version_json_pre_product(uuid)`
- `public.meal_plan_version_pre_guidance(uuid)`
- `public.meal_plan_version_pre_meal_labels(uuid)`
- `public.meal_plan_version_pre_meal_times(uuid)`
- `public.ops_bind_email_unsubscribe(uuid,uuid,text)`
- `public.ops_cancel_email_optout()`
- `public.ops_cancel_old_reminders()`
- `public.ops_care_active(uuid,uuid)`
- `public.ops_check_delivery(uuid,uuid,uuid)`
- `public.ops_claim_delivery(uuid,uuid)`
- `public.ops_delivery_scope()`
- `public.ops_email_allowed(uuid,uuid)`
- `public.ops_email_eligible_patients(uuid)`
- `public.ops_enqueue_reminders(timestamp with time zone,timestamp with time zone,text)`
- `public.ops_expire_delivery_leases()`
- `public.ops_finish_delivery(uuid,uuid,text,text)`
- `public.ops_unsubscribe_email(text)`
- `public.ops_whatsapp_event(text,text,text)`
- `public.org_snapshot(uuid)`
- `public.org_subscription_allows_care(uuid)`
- `public.outbox_assert_access(uuid)`
- `public.outbox_event_json(outbox_events)`
- `public.outbox_mailbox_json(uuid)`
- `public.outbox_patient_skip(uuid)`
- `public.outbox_pref_on(uuid,text)`
- `public.patient_can_see_resource(resources,uuid)`
- `public.pause_manual_fee_for_debit(uuid)`
- `public.platform_active_patient_count(uuid)`
- `public.platform_nutritionist_seats(uuid)`
- `public.privacy_assert_patient(uuid)`
- `public.privacy_request_json(uuid)`
- `public.promote_due_meal_plan(uuid)`
- `public.provision_nutritionist(uuid,text,text,integer)`
- `public.publish_meal_plan(uuid,integer)`
- `public.publish_meal_plan_base(uuid,integer)`
- `public.publish_recipe_pre_product(uuid,integer)`
- `public.publish_reviewed_meal_plan_base(uuid,integer,jsonb)`
- `public.published_plan_pre_guidance(uuid)`
- `public.published_plan_pre_meal_labels(uuid)`
- `public.published_plan_pre_meal_times(uuid)`
- `public.queue_published_menu_covers()`
- `public.recipe_assert_nutri()`
- `public.recipe_card_json(uuid)`
- `public.recipe_catalog_nutrition_guard()`
- `public.recipe_day_json(uuid)`
- `public.recipe_professional_json(uuid)`
- `public.recipe_version_json(uuid)`
- `public.recipe_version_json_base(uuid)`
- `public.recipe_version_json_pre_catalog(uuid)`
- `public.recipe_version_json_pre_product(uuid)`
- `public.record_cover_attempt(text)`
- `public.record_meal_analysis_pre_product(jsonb)`
- `public.record_patient_payment_pre_product(uuid,integer,date,text,text)`
- `public.reject_archived_patient_message()`
- `public.release_platform_founder_slot()`
- `public.report_patient_payment_pre_product(uuid,integer,date,text,text)`
- `public.resource_row_json(resources)`
- `public.review_meal_log_pre_product(jsonb)`
- `public.save_meal_plan_draft_base(uuid,jsonb)`
- `public.save_meal_plan_draft_pre_product(uuid,jsonb)`
- `public.save_meal_plan_pre_components(uuid,jsonb)`
- `public.save_plan_before_target_sync(uuid,jsonb)`
- `public.save_plan_pre_guidance(uuid,jsonb)`
- `public.save_plan_pre_meal_labels(uuid,jsonb)`
- `public.save_plan_pre_meal_times(uuid,jsonb)`
- `public.save_recipe_draft_base(jsonb)`
- `public.save_recipe_draft_pre_catalog(jsonb)`
- `public.save_recipe_draft_pre_product(jsonb)`
- `public.scheduling_apply_payment(uuid,text,text,bigint,text,text,bigint)`
- `public.scheduling_assert_appointment_holds()`
- `public.scheduling_claim_appointment_sync()`
- `public.scheduling_claim_connection_refresh(uuid,text,uuid)`
- `public.scheduling_claim_sync_job()`
- `public.scheduling_complete_appointment_sync(uuid,uuid,integer,text,text)`
- `public.scheduling_complete_sync_job(uuid,uuid,text,text)`
- `public.scheduling_connection_epoch(uuid,text)`
- `public.scheduling_disconnect_connection(uuid,text)`
- `public.scheduling_google_review_context(uuid,text,uuid)`
- `public.scheduling_guard_google_write(text,uuid,uuid,integer,uuid,boolean,integer)`
- `public.scheduling_mark_google_uncertain(text,uuid,uuid)`
- `public.scheduling_mirror_appointment_cancel()`
- `public.scheduling_queue_manual_appointment()`
- `public.scheduling_release_connection_refresh(uuid,text,uuid,uuid)`
- `public.scheduling_request_booking(uuid,jsonb,text)`
- `public.scheduling_resolve_google_review(uuid,text,uuid,uuid,integer,integer,uuid,text,text,uuid)`
- `public.scheduling_slot_allowed(uuid,uuid,timestamp with time zone,uuid)`
- `public.scheduling_write_connection(uuid,text,uuid,text,text,uuid)`
- `public.service_assert_admin()`
- `public.service_audit(uuid,text,jsonb)`
- `public.service_nutritionist_json(uuid)`
- `public.service_recompute(uuid)`
- `public.service_start_trial()`
- `public.set_recipe_card(uuid,jsonb)`
- `public.shopping_assert_patient(uuid)`
- `public.shopping_list_json(uuid)`
- `public.shopping_list_json_before_vigencia(uuid)`
- `public.structured_nutrition_guard()`
- `public.thread_assert_access(uuid)`
- `public.thread_message_json(uuid,boolean)`
- `public.try_platform_ai_photo(uuid,text,integer)`
- `public.validate_meal_log_slot()`
- `public.validate_message_author()`

## Auditoría administrativa

Tabla `private.admin_audit_log` sin acceso directo para anon/authenticated/service_role; RLS habilitada. Registra actor de la sesión, fecha, acción de una lista cerrada, destino UUID cuando viene en la ruta e identificador del intento. No guarda cuerpos, notas, correos, contraseñas, enlaces ni datos clínicos. Suspensión, exención y restauración tienen acciones distintas, extraídas de un enum validado. Se cubren extensión de prueba (regalo de días), pagos/meses y alta de nutricionista, además del resto de operaciones mutantes del panel.

El servidor registra `started` antes de ejecutar y `succeeded`/`failed` después. Si falla el registro inicial, bloquea la operación. Si falla el final o se corta el proceso, conserva el intento y emite aviso operativo; **un intento sin resultado no prueba éxito ni fracaso**. Auth y las RPC administrativas son servicios/operaciones distintos: no hay una transacción distribuida. El alta no lleva destino porque el UUID aún no existe al comenzar. El registro acredita acciones de la API; la RPC de auditoría por sí misma no es prueba de que se ejecutó otra RPC y los RPC admin existentes siguen validando al actor por su cuenta.

## Aplicación y reversión

Antes de desplegar el servidor se necesitan las migraciones nuevas. Esta entrega **no las aplica** ni despliega. El ensayo local aplica toda la cadena desde cero; los tests de PostgreSQL comprueban permisos y RLS reales. La migración no borra filas ni columnas.

Reversión operativa: retirar primero el middleware de auditoría, conservar su tabla como evidencia y revocar su RPC. Si se necesita revertir permisos/políticas, restaurar los grants de las dos firmas y las políticas exactas de las migraciones anteriores, bajo revisión; no reabrir funciones en bloque. Producción requiere autorización escrita específica y queda fuera de este PR.

## Informe Regression Guard · paso 10

- **Flujos críticos verificados:** ✅ grants de funciones públicas/privadas y search_path; ✅ hábitos propios, paciente sin acceso, rechazo anónimo aun con grant accidental y aislamiento entre consultorios; ✅ portadas por claim/finish y bloqueo del helper directo; ✅ acciones admin reales y auditoría; ✅ publicación de planes y presupuesto local. 115 pruebas puntuales aprobadas (102 en 10 archivos y 13 en 2 archivos).
- **Regresiones cubiertas:** helpers internos abiertos por grants heredados; sobrecargas o funciones nuevas fuera de allowlist; políticas permisivas superpuestas; anon con INSERT accidental; resultados duplicados de auditoría; filtrado de notas o claves al registro. Se adaptaron los tests históricos de portadas y la reparación de vencimientos a los contratos actuales sin quitar validaciones.
- **Contratos revisados:** firmas completas de RPC, wrappers invoker, predicados de políticas y vistas; enum de acciones y actor tomado de auth.uid(); MFA aal2 obligatorio en SQL. Revisión independiente sin P1/P2. Comparación de consolidación: 16 tablas, 44 políticas y 53 predicados conservados por OR.
- **Áreas frágiles:** permisos de helpers (podrían romper RPC indirectos), RLS y consentimientos (podrían mezclar consultorios), Auth/alta y auditoría (podría quedar intento sin resultado). Pruebas positivas/negativas y límites documentados.
- **Migraciones:** tres nuevas, sin datos eliminados; aplicadas solo en PGlite. Reversión acotada descrita arriba. Manifiesto actualizado con hashes, 34 pendientes y 8 de base; no implica estado remoto ni autorización de aplicar.
- **Fire test:** ✅ al quitar temporalmente el registro inicial fallaron cinco pruebas; restaurado y pruebas verdes. Las pruebas nuevas de cierre de helpers y duplicados RLS también fallaron antes de implementar las migraciones.
- **Automatizaciones nuevas:** allowlist por esquema y firma, ausencia de search_path, detección de superposiciones permisivas, RLS anónima y registro previo obligatorio. Migraciones deben preceder al servidor; autorización escrita y despliegue quedan pendientes, fuera de esta entrega.
- **Verificación:** npm run check verde (tres proyectos TypeScript); build verde; check:migrations, check:release-manifest, check:secrets y git diff --check verdes. El repo no tiene script lint. La ejecución completa previa tuvo una expectativa de manifiesto desactualizada y tres timeouts; corregida la expectativa, todos esos archivos pasaron por separado. Tras la reconexión, por pedido de Facundo, solo se ejecutaron pruebas puntuales y TypeScript; no se declara suite completa verde.
- **Veredicto:** apto para PR en borrador. **HOLD para merge/despliegue/producción**, por alcance explícito del pedido. Sin cambios en #244, #245 ni #253.

Referencias de las decisiones: [funciones y permisos de Supabase](https://supabase.com/docs/guides/database/functions) y [combinación de políticas en PostgreSQL](https://www.postgresql.org/docs/current/sql-createpolicy.html).
