-- Consolidar OR permisivos sin alterar las restricciones ni ampliar el acceso.
-- Cada comando conserva USING y WITH CHECK anteriores (incluido su fallback).
-- Las reglas de estas tablas corresponden a personas autenticadas; anon no
-- recibe ninguna política nueva. Las políticas RESTRICTIVE se conservan intactas.
-- Reversión: restaurar únicamente las políticas originales desde las migraciones
-- previas, manteniendo REVOKE de anon. No se modifican ni eliminan datos.
begin;
set local search_path = pg_catalog, public, storage;
revoke all on public.habit_logs from public, anon;

-- public.habit_logs
drop policy habit_logs_nutri_all on public.habit_logs;
drop policy habit_logs_patient_select on public.habit_logs;
drop policy habit_logs_patient_insert on public.habit_logs;
drop policy habit_logs_patient_update on public.habit_logs;
-- habit_logs_nutri_all, habit_logs_patient_select
create policy habit_logs_select_authorized on public.habit_logs for select to authenticated
  using ((is_assigned_patient(patient_id))
    or (((patient_id = my_patient_id()) AND patient_has_full_access(patient_id))));

-- habit_logs_nutri_all, habit_logs_patient_insert
create policy habit_logs_insert_authorized on public.habit_logs for insert to authenticated
  with check ((is_assigned_patient(patient_id))
    or (((patient_id = my_patient_id()) AND patient_has_full_access(patient_id))));

-- habit_logs_nutri_all, habit_logs_patient_update
create policy habit_logs_update_authorized on public.habit_logs for update to authenticated
  using ((is_assigned_patient(patient_id))
    or (((patient_id = my_patient_id()) AND patient_has_full_access(patient_id))))
  with check ((is_assigned_patient(patient_id))
    or (((patient_id = my_patient_id()) AND patient_has_full_access(patient_id))));

-- habit_logs_nutri_all
create policy habit_logs_delete_authorized on public.habit_logs for delete to authenticated
  using ((is_assigned_patient(patient_id)));

-- public.meal_logs
drop policy meal_logs_nutri_all on public.meal_logs;
drop policy meal_logs_patient_insert on public.meal_logs;
-- meal_logs_nutri_all
create policy meal_logs_select_authorized on public.meal_logs for select to authenticated
  using ((is_assigned_patient(patient_id)));

-- meal_logs_nutri_all, meal_logs_patient_insert
create policy meal_logs_insert_authorized on public.meal_logs for insert to authenticated
  with check ((is_assigned_patient(patient_id))
    or (((patient_id = my_patient_id()) AND patient_has_full_access(patient_id) AND (status = 'pending_review'::meal_log_status) AND (note_for_nutri = ''::text) AND (analysis_status = 'pending'::text) AND ((photo_path IS NULL) OR (photo_path ~~ (('patients/'::text || (patient_id)::text) || '/%'::text))))));

-- meal_logs_nutri_all
create policy meal_logs_update_authorized on public.meal_logs for update to authenticated
  using ((is_assigned_patient(patient_id)))
  with check ((is_assigned_patient(patient_id)));

-- meal_logs_nutri_all
create policy meal_logs_delete_authorized on public.meal_logs for delete to authenticated
  using ((is_assigned_patient(patient_id)));

-- public.meal_slots
drop policy meal_slots_nutri_all on public.meal_slots;
drop policy meal_slots_patient_select on public.meal_slots;
-- meal_slots_nutri_all, meal_slots_patient_select
create policy meal_slots_select_authorized on public.meal_slots for select to authenticated
  using ((is_assigned_patient(patient_id))
    or (((patient_id = my_patient_id()) AND patient_has_full_access(patient_id))));

-- meal_slots_nutri_all
create policy meal_slots_insert_authorized on public.meal_slots for insert to authenticated
  with check ((is_assigned_patient(patient_id)));

-- meal_slots_nutri_all
create policy meal_slots_update_authorized on public.meal_slots for update to authenticated
  using ((is_assigned_patient(patient_id)))
  with check ((is_assigned_patient(patient_id)));

-- meal_slots_nutri_all
create policy meal_slots_delete_authorized on public.meal_slots for delete to authenticated
  using ((is_assigned_patient(patient_id)));

-- public.messages
drop policy messages_nutri_select on public.messages;
drop policy messages_nutri_insert on public.messages;
drop policy messages_patient_insert on public.messages;
-- messages_nutri_select
create policy messages_select_authorized on public.messages for select to authenticated
  using (((nutritionist_id = my_nutritionist_id())));

-- messages_nutri_insert, messages_patient_insert
create policy messages_insert_authorized on public.messages for insert to authenticated
  with check ((((nutritionist_id = my_nutritionist_id()) AND (author_id = ( SELECT auth.uid() AS uid))))
    or (((patient_id = my_patient_id()) AND (author_id = ( SELECT auth.uid() AS uid)) AND (suggested_by_ai = false) AND (sent_at IS NOT NULL))));

-- public.nutrition_targets
drop policy nutrition_targets_read_pro on public.nutrition_targets;
drop policy nutrition_targets_read_patient on public.nutrition_targets;
-- nutrition_targets_read_pro, nutrition_targets_read_patient
create policy nutrition_targets_select_authorized on public.nutrition_targets for select to authenticated
  using (((is_assigned_patient(patient_id) AND private.nutrition_patient_is_active(patient_id)))
    or (((published_at IS NOT NULL) AND (patient_id = my_patient_id()) AND private.nutrition_patient_is_active(patient_id))));

-- public.patient_body_data
drop policy body_data_read_pro on public.patient_body_data;
drop policy body_data_read_self on public.patient_body_data;
-- body_data_read_pro, body_data_read_self
create policy patient_body_data_select_authorized on public.patient_body_data for select to authenticated
  using (((is_assigned_patient(patient_id) AND private.nutrition_patient_is_active(patient_id)))
    or (((patient_id = my_patient_id()) AND private.nutrition_patient_is_active(patient_id))));

-- public.patient_body_data_requests
drop policy body_requests_read_pro on public.patient_body_data_requests;
drop policy body_requests_read_self on public.patient_body_data_requests;
-- body_requests_read_pro, body_requests_read_self
create policy patient_body_data_requests_select_authorized on public.patient_body_data_requests for select to authenticated
  using (((is_assigned_patient(patient_id) AND private.nutrition_patient_is_active(patient_id)))
    or (((patient_id = my_patient_id()) AND private.nutrition_patient_is_active(patient_id))));

-- public.recipe_assignments
drop policy recipe_assignments_nutri_all on public.recipe_assignments;
drop policy recipe_assignments_patient_select on public.recipe_assignments;
-- recipe_assignments_nutri_all, recipe_assignments_patient_select
create policy recipe_assignments_select_authorized on public.recipe_assignments for select to authenticated
  using (((nutritionist_id = my_nutritionist_id()))
    or ((patient_id = my_patient_id())));

-- recipe_assignments_nutri_all
create policy recipe_assignments_insert_authorized on public.recipe_assignments for insert to authenticated
  with check ((((nutritionist_id = my_nutritionist_id()) AND is_assigned_patient(patient_id))));

-- recipe_assignments_nutri_all
create policy recipe_assignments_update_authorized on public.recipe_assignments for update to authenticated
  using (((nutritionist_id = my_nutritionist_id())))
  with check ((((nutritionist_id = my_nutritionist_id()) AND is_assigned_patient(patient_id))));

-- recipe_assignments_nutri_all
create policy recipe_assignments_delete_authorized on public.recipe_assignments for delete to authenticated
  using (((nutritionist_id = my_nutritionist_id())));

-- public.reminders
drop policy reminders_nutri_all on public.reminders;
drop policy reminders_patient_select on public.reminders;
-- reminders_nutri_all, reminders_patient_select
create policy reminders_select_authorized on public.reminders for select to authenticated
  using ((is_assigned_patient(patient_id))
    or (((patient_id = my_patient_id()) AND patient_has_full_access(patient_id))));

-- reminders_nutri_all
create policy reminders_insert_authorized on public.reminders for insert to authenticated
  with check ((is_assigned_patient(patient_id)));

-- reminders_nutri_all
create policy reminders_update_authorized on public.reminders for update to authenticated
  using ((is_assigned_patient(patient_id)))
  with check ((is_assigned_patient(patient_id)));

-- reminders_nutri_all
create policy reminders_delete_authorized on public.reminders for delete to authenticated
  using ((is_assigned_patient(patient_id)));

-- public.scheduling_bookings
drop policy scheduling_bookings_pro on public.scheduling_bookings;
drop policy scheduling_booking_reception on public.scheduling_bookings;
-- scheduling_bookings_pro, scheduling_booking_reception
create policy scheduling_bookings_select_authorized on public.scheduling_bookings for select to authenticated
  using ((scheduling_owns(nutritionist_id))
    or (scheduling_can_manage(nutritionist_id)));

-- public.scheduling_profiles
drop policy scheduling_profile_pro on public.scheduling_profiles;
drop policy scheduling_profile_reception on public.scheduling_profiles;
-- scheduling_profile_pro, scheduling_profile_reception
create policy scheduling_profiles_select_authorized on public.scheduling_profiles for select to authenticated
  using ((scheduling_owns(nutritionist_id))
    or (scheduling_can_manage(nutritionist_id)));

-- public.scheduling_transfer_reports
drop policy scheduling_transfers_pro on public.scheduling_transfer_reports;
drop policy scheduling_transfer_reception on public.scheduling_transfer_reports;
-- scheduling_transfers_pro, scheduling_transfer_reception
create policy scheduling_transfer_reports_select_authorized on public.scheduling_transfer_reports for select to authenticated
  using (((EXISTS ( SELECT 1
   FROM scheduling_bookings b
  WHERE ((b.id = scheduling_transfer_reports.booking_id) AND scheduling_owns(b.nutritionist_id)))))
    or ((EXISTS ( SELECT 1
   FROM scheduling_bookings b
  WHERE ((b.id = scheduling_transfer_reports.booking_id) AND scheduling_can_manage(b.nutritionist_id))))));

-- public.shopping_checks
drop policy shopping_checks_patient_all on public.shopping_checks;
drop policy shopping_checks_nutri_select on public.shopping_checks;
-- shopping_checks_patient_all, shopping_checks_nutri_select
create policy shopping_checks_select_authorized on public.shopping_checks for select to authenticated
  using ((((patient_id = my_patient_id()) AND patient_has_full_access(patient_id)))
    or (is_assigned_patient(patient_id)));

-- shopping_checks_patient_all
create policy shopping_checks_insert_authorized on public.shopping_checks for insert to authenticated
  with check ((((patient_id = my_patient_id()) AND patient_has_full_access(patient_id))));

-- shopping_checks_patient_all
create policy shopping_checks_update_authorized on public.shopping_checks for update to authenticated
  using ((((patient_id = my_patient_id()) AND patient_has_full_access(patient_id))))
  with check ((((patient_id = my_patient_id()) AND patient_has_full_access(patient_id))));

-- shopping_checks_patient_all
create policy shopping_checks_delete_authorized on public.shopping_checks for delete to authenticated
  using ((((patient_id = my_patient_id()) AND patient_has_full_access(patient_id))));

-- public.shopping_manual_items
drop policy shopping_manual_patient_all on public.shopping_manual_items;
drop policy shopping_manual_nutri_select on public.shopping_manual_items;
-- shopping_manual_patient_all, shopping_manual_nutri_select
create policy shopping_manual_items_select_authorized on public.shopping_manual_items for select to authenticated
  using ((((patient_id = my_patient_id()) AND patient_has_full_access(patient_id)))
    or (is_assigned_patient(patient_id)));

-- shopping_manual_patient_all
create policy shopping_manual_items_insert_authorized on public.shopping_manual_items for insert to authenticated
  with check ((((patient_id = my_patient_id()) AND patient_has_full_access(patient_id))));

-- shopping_manual_patient_all
create policy shopping_manual_items_update_authorized on public.shopping_manual_items for update to authenticated
  using ((((patient_id = my_patient_id()) AND patient_has_full_access(patient_id))))
  with check ((((patient_id = my_patient_id()) AND patient_has_full_access(patient_id))));

-- shopping_manual_patient_all
create policy shopping_manual_items_delete_authorized on public.shopping_manual_items for delete to authenticated
  using ((((patient_id = my_patient_id()) AND patient_has_full_access(patient_id))));

-- public.timeline_events
drop policy timeline_events_nutri_all on public.timeline_events;
drop policy timeline_events_patient_select on public.timeline_events;
-- timeline_events_nutri_all, timeline_events_patient_select
create policy timeline_events_select_authorized on public.timeline_events for select to authenticated
  using ((is_assigned_patient(patient_id))
    or (((patient_id = my_patient_id()) AND (visibility = 'patient'::timeline_visibility) AND patient_has_full_access(patient_id))));

-- timeline_events_nutri_all
create policy timeline_events_insert_authorized on public.timeline_events for insert to authenticated
  with check ((is_assigned_patient(patient_id)));

-- timeline_events_nutri_all
create policy timeline_events_update_authorized on public.timeline_events for update to authenticated
  using ((is_assigned_patient(patient_id)))
  with check ((is_assigned_patient(patient_id)));

-- timeline_events_nutri_all
create policy timeline_events_delete_authorized on public.timeline_events for delete to authenticated
  using ((is_assigned_patient(patient_id)));

-- storage.objects
drop policy meal_photos_nutri_select on storage.objects;
drop policy meal_photos_patient_select on storage.objects;
drop policy meal_photos_patient_insert on storage.objects;
drop policy meal_photos_nutri_update on storage.objects;
drop policy meal_photos_nutri_delete on storage.objects;
drop policy care_photo_delete on storage.objects;
drop policy care_document_delete on storage.objects;
drop policy care_quarantine_patient_insert on storage.objects;
drop policy care_quarantine_patient_select on storage.objects;
drop policy care_quarantine_patient_delete on storage.objects;
drop policy care_photo_insert on storage.objects;
drop policy care_document_insert on storage.objects;
drop policy care_photo_read on storage.objects;
drop policy care_document_read on storage.objects;
drop policy recipe_covers_storage_insert on storage.objects;
drop policy recipe_covers_storage_owner_select on storage.objects;
-- meal_photos_nutri_select, meal_photos_patient_select, care_quarantine_patient_select, care_photo_read, care_document_read, recipe_covers_storage_owner_select
create policy objects_select_authorized on storage.objects for select to authenticated
  using ((((bucket_id = 'meal-photos'::text) AND ((storage.foldername(name))[1] = 'patients'::text) AND is_assigned_patient_path((storage.foldername(name))[2])))
    or (((bucket_id = 'meal-photos'::text) AND ((storage.foldername(name))[1] = 'patients'::text) AND ((storage.foldername(name))[2] = (my_patient_id())::text) AND patient_has_full_access(my_patient_id())))
    or (((bucket_id = 'care-quarantine'::text) AND (storage_object_patient_id(name) = my_patient_id()) AND patient_has_full_access(my_patient_id())))
    or (((bucket_id = 'care-photos'::text) AND (((storage_object_patient_id(name) = my_patient_id()) AND care_consent(my_patient_id(), 'body_progress'::text)) OR (EXISTS ( SELECT 1
   FROM care_records r
  WHERE (((r.data ->> 'path'::text) = objects.name) AND ((r.data ->> 'kind'::text) = 'body_photo'::text) AND care_can_read(r.patient_id) AND care_consent(r.patient_id, 'body_progress'::text)))) OR (is_assigned_patient(storage_object_patient_id(name)) AND care_consent(storage_object_patient_id(name), 'body_progress'::text)))))
    or (((bucket_id = 'care-documents'::text) AND (((storage_object_patient_id(name) = my_patient_id()) AND care_consent(my_patient_id(), 'clinical_document'::text)) OR (EXISTS ( SELECT 1
   FROM care_records r
  WHERE (((r.data ->> 'path'::text) = objects.name) AND ((r.data ->> 'kind'::text) = 'clinical_document'::text) AND care_can_read(r.patient_id) AND care_consent(r.patient_id, 'clinical_document'::text)))) OR (is_assigned_patient(storage_object_patient_id(name)) AND care_consent(storage_object_patient_id(name), 'clinical_document'::text)))))
    or (((bucket_id = 'recipe-covers'::text) AND (EXISTS ( SELECT 1
   FROM (recipe_versions v
     JOIN recipes r ON ((r.id = v.recipe_id)))
  WHERE (((v.id)::text = split_part(objects.name, '/'::text, 2)) AND (r.nutritionist_id = my_nutritionist_id()) AND ((r.nutritionist_id)::text = split_part(objects.name, '/'::text, 1))))))));

-- meal_photos_patient_insert, care_quarantine_patient_insert, care_photo_insert, care_document_insert, recipe_covers_storage_insert
create policy objects_insert_authorized on storage.objects for insert to authenticated
  with check ((((bucket_id = 'meal-photos'::text) AND ((storage.foldername(name))[1] = 'patients'::text) AND ((storage.foldername(name))[2] = (my_patient_id())::text) AND patient_has_full_access(my_patient_id())))
    or (((bucket_id = 'care-quarantine'::text) AND (storage_object_patient_id(name) = my_patient_id()) AND patient_has_full_access(my_patient_id()) AND (name ~ '^patients/[0-9a-f-]{36}/q/[0-9a-f-]{36}$'::text)))
    or (((bucket_id = 'care-photos'::text) AND care_can_read(my_patient_id()) AND patient_has_full_access(my_patient_id()) AND care_consent(my_patient_id(), 'body_progress'::text) AND (((name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}$'::text) AND (split_part(name, '/'::text, 1) = (my_patient_id())::text)) OR ((name ~ '^patients/[0-9a-f-]{36}/[0-9a-f-]{36}$'::text) AND (split_part(name, '/'::text, 2) = (my_patient_id())::text)))))
    or (((bucket_id = 'care-documents'::text) AND care_can_read(my_patient_id()) AND patient_has_full_access(my_patient_id()) AND care_consent(my_patient_id(), 'clinical_document'::text) AND (((name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}$'::text) AND (split_part(name, '/'::text, 1) = (my_patient_id())::text)) OR ((name ~ '^patients/[0-9a-f-]{36}/[0-9a-f-]{36}$'::text) AND (split_part(name, '/'::text, 2) = (my_patient_id())::text)))))
    or (((bucket_id = 'recipe-covers'::text) AND (name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}[.](png|jpg|webp)$'::text) AND (EXISTS ( SELECT 1
   FROM (recipe_versions v
     JOIN recipes r ON ((r.id = v.recipe_id)))
  WHERE (((v.id)::text = split_part(objects.name, '/'::text, 2)) AND (r.nutritionist_id = my_nutritionist_id()) AND ((r.nutritionist_id)::text = split_part(objects.name, '/'::text, 1)) AND (v.published_at IS NOT NULL)))))));

-- meal_photos_nutri_update
create policy objects_update_authorized on storage.objects for update to authenticated
  using ((((bucket_id = 'meal-photos'::text) AND ((storage.foldername(name))[1] = 'patients'::text) AND is_assigned_patient_path((storage.foldername(name))[2]))))
  with check ((((bucket_id = 'meal-photos'::text) AND ((storage.foldername(name))[1] = 'patients'::text) AND is_assigned_patient_path((storage.foldername(name))[2]))));

-- meal_photos_nutri_delete, care_photo_delete, care_document_delete, care_quarantine_patient_delete
create policy objects_delete_authorized on storage.objects for delete to authenticated
  using ((((bucket_id = 'meal-photos'::text) AND ((storage.foldername(name))[1] = 'patients'::text) AND is_assigned_patient_path((storage.foldername(name))[2])))
    or (((bucket_id = 'care-photos'::text) AND (split_part(name, '/'::text, 1) = (my_patient_id())::text) AND care_can_read(my_patient_id())))
    or (((bucket_id = 'care-documents'::text) AND (split_part(name, '/'::text, 1) = (my_patient_id())::text) AND care_can_read(my_patient_id())))
    or (((bucket_id = 'care-quarantine'::text) AND (storage_object_patient_id(name) = my_patient_id()))));

commit;
