# 05 · Esquema de backend — Plan V

> Generado leyendo las **77 migraciones** de `supabase/migrations/` en `main` (`ae3dc30`, 14/10/2026). Columnas = `create table` + `alter table … add column`. Las columnas renombradas o borradas en migraciones posteriores, checks e índices no están todos reflejados: ante la duda, mirá la migración citada o usá `list_tables` del MCP de Supabase (solo lectura).
> **Existe hoy vs planeado**: al 10/10 prod tenía 72 migraciones (última `invoker_patient_profile_projections`). Las posteriores (`body_metrics`, `archived_patient_cannot_message`, `charges_programs`, `fee_one_charge_per_month`, `meal_plan_effective_date`, `patient_goal_followup`, `resource_author_unpublish`, `plan_meal_times`, `patient_correct_own_record`, `meal_text_without_ai`, `plan_reads_can_promote`) están en el repo. **Comprobado el 14/10 con `list_migrations`: todas aplicadas en producción** (la última es `charges_programs`). Las 17 migraciones de Codex (desde `20261011140000_clinical_ai_budget` hasta `20261013123000_imported_clinical_export`, ramas `codex/nutridesk-*`) **no** están aplicadas ni en `main`.

## 1. Datos: proyecto
Supabase `plan-v-app`, región sa-east-1, ref `wvosvlxpfytokwfbcero`. Esquemas: `public` (tablas + funciones), `auth` (Supabase), `storage` (buckets privados de fotos/estudios/portadas).

## 2. Auth y roles
- `auth.users` → trigger `handle_new_user` → `profiles` (`role` enum `user_role`: `nutri` | `paciente`).
- Nutri: `nutritionists.user_id → profiles`. Paciente: `patients.user_id → profiles` (se completa al aceptar la invitación).
- Admin de plataforma: `platform_admins`. Organizaciones: `organization_members`, `teams`, `team_members`, `patient_care_links` (delegación de cuidado).
- Helpers usados en RLS: `my_nutritionist_id()`, `my_patient_id()`, `is_own_patient()`, `is_assigned_patient()`, `can_care_for_patient()`, `is_platform_admin()`, `is_org_member()`, `patient_has_full_access()`.

## 3. Mapa de relaciones (núcleo)
```
profiles 1─1 nutritionists 1─N patients N─1 profiles(paciente)
patients 1─N patient_invites, intake_sessions, consent_events, meal_logs, habit_logs, measurements,
             appointments, messages, patient_assets, meal_plans, nutrition_targets, patient_fees …
meal_plans 1─N meal_plan_versions 1─N meal_plan_items N─1 recipe_versions
recipes 1─N recipe_versions 1─N recipe_ingredients N─1 ingredients
meal_logs 1─N meal_analysis_runs, meal_reviews
messages 1─N message_receipts, message_attachments N─1 patient_assets
ai_jobs 1─N ai_artifacts
```

## 4. Enums
`user_role` (nutri, paciente) · `patient_stage` (ingreso, plan, seguimiento, alta) · `meal_slot_kind` (desayuno, colacion, almuerzo, merienda, cena, extra) · `meal_log_status` (pending_review, confirmed, adjusted) · `suggested_action` (mensaje, ajuste_menu, turno) · `billing_status` (waived, pending, active, past_due) · `payment_provider` (mercadopago, manual) · `payment_status` (pending, approved, refunded, rejected) · `brief_status` (pending_review, done, dismissed) · `appointment_channel` (video, presencial) · `appointment_status` (scheduled, done, cancelled; + "en curso" agregado en `appointment_in_progress`) · `reminder_kind` · `timeline_event_kind` · `timeline_visibility` (professional, patient) · `webhook_processing_status` · `ai_job_type` (recipe_draft, menu_draft) · `ai_job_status`.

## 5. RLS, funciones y vistas
- **RLS habilitado en las 92 tablas**; 122 `create policy` en total. Varias tablas internas tienen RLS **sin política** a propósito (solo accesibles por funciones) — los advisors lo marcan.
- **Escrituras**: por funciones SQL con guardas (~275 funciones; muchas `SECURITY DEFINER`), invocadas desde la API o por RPC. Ej.: `save_meal_log`, `review_meal_log`, `publish_meal_plan`, `create_patient_with_invite`, `accept_patient_invite`, `schedule_appointment`, `send_thread_message`, `record_patient_payment`, `save_nutrition_target`, `enqueue_ai_job`/`claim_ai_job`/`finish_ai_job`.
- Migración `revoke_default_public_writes` quitó privilegios por defecto; `close_internal_functions` cerró funciones internas.
- **Vistas para la paciente** (proyecciones, deben ser solo lectura):
  - `patients_patient_view`, `patient_access_view` (invoker, `invoker_patient_profile_projections`)
  - `meal_logs_patient_view` (solo lectura; conserva TRUNCATE/TRIGGER/REFERENCES)
  - `messages_patient_view`, `appointments_patient_view`, `intake_patient_view` — **comprobado el 14/10: siguen con INSERT/UPDATE/DELETE/TRUNCATE para `anon`/`authenticated`** (son vistas con `security_invoker`, así que la RLS de las tablas sigue mandando, pero deben quedar solo lectura). Arreglo en preparación por Claude, ver `../coordinacion-agentes.md`.
  - `patient_goal_patient_view`, `goal_updates_patient_view` (✅ `patient_goal_followup`, solo SELECT)
- CI: `npm run check:views` falla si una vista pública puede escribir o saltear RLS; `check:migrations` revisa seguridad de migraciones; `test:auth-isolation` y `rls-ab.test.ts` prueban aislamiento entre nutris/pacientes.

## 6. Agrupación de tablas por dominio
| Dominio | Tablas |
|---|---|
| Identidad | profiles, nutritionists, patients, patient_invites, patient_invite_events, platform_admins, professional_habilitations |
| Organizaciones | organizations, organization_members, organization_subscriptions, teams, team_members, patient_care_links, ownership_transfer_events |
| Ingreso y consentimiento | intake_sessions, consent_catalog, consent_events, clinical_notes |
| Cuidado / registros | care_records, care_preferences, care_replacements, habit_logs, activity_logs, measurements, patient_body_data, patient_body_data_requests, reminders, timeline_events, goal_history |
| Archivos | patient_assets, asset_upload_intents |
| Recetas y alimentos | ingredients, recipes, recipe_versions, recipe_ingredients, recipe_assignments, recipe_covers, recipe_cover_requests, recipe_version_cards, recipe_day_assignments, professional_recipe_favorites, food_catalog, ingredient_covers, cover_daily_usage, favorites |
| Planes | meal_slots, meal_plans, meal_plan_versions, meal_plan_items, meal_plan_handovers, menu_dish_covers, nutrition_targets, nutrition_target_drafts, professional_models |
| Diario | meal_logs, meal_analysis_runs, meal_reviews |
| Compras | shopping_manual_items, shopping_checks |
| Mensajes y avisos | messages, message_receipts, message_attachments, notification_preferences, outbox_events, notification_deliveries |
| Turnos | appointments, appointment_events |
| Ejercicio y recursos | exercise_library, exercise_routines, exercise_routine_versions, exercise_routine_items, routine_assignments, resources, resource_assignments |
| Cobros paciente | patient_fees, patient_charges, patient_payments, nutritionist_payment_settings, nutritionist_programs, payments, payment_webhook_events |
| Servicio (Plan V ↔ nutri) | platform_settings, nutritionist_subscriptions, service_payments |
| IA | ai_jobs, ai_artifacts, ai_briefs, processing_jobs |
| Privacidad y auditoría | audit_events, privacy_requests, privacy_export_packages, privacy_access_events |

## 7. Tablas con columnas (extraído de las migraciones)
### `profiles`
Migración: `20260917190000_core.sql` · RLS habilitado: sí

- `id` uuid → users
- `role` public.user_role
- `full_name` text
- `avatar_url` text
- `created_at` timestamptz

### `nutritionists`
Migración: `20260917190000_core.sql` · RLS habilitado: sí

- `id` uuid
- `user_id` uuid → profiles
- `license` text
- `display_name` text
- `monthly_fee_ars` int
- `created_at` timestamptz

### `patients`
Migración: `20260917190000_core.sql` · RLS habilitado: sí

- `id` uuid
- `nutritionist_id` uuid → nutritionists
- `user_id` uuid → profiles
- `full_name` text
- `initials` text
- `tone` text
- `stage` public.patient_stage
- `status` text
- `goal` text
- `sensitive_hours` text
- `plan_b` text
- `next_focus` text
- `adherence_score` int
- `adherence_why` text
- `billing_status` public.billing_status
- `billing_until` date
- `deactivated_at` timestamptz
- `deletion_requested_at` timestamptz
- `anonymized_at` timestamptz
- `created_at` timestamptz
- `archived_at` timestamptz (agregada 20260928140000)
- `goal_status` text (agregada 20261010183000)

### `patient_invites`
Migración: `20260917190000_core.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid
- `nutritionist_id` uuid
- `email` text
- `status` text
- `invited_at` timestamptz
- `expires_at` timestamptz
- `accepted_at` timestamptz
- `accepted_by` uuid → profiles
- `revoked_at` timestamptz
- `created_at` timestamptz
- `updated_at` timestamptz

### `patient_invite_events`
Migración: `20260917190000_core.sql` · RLS habilitado: sí

- `id` uuid
- `invite_id` uuid → patient_invites
- `event` text
- `actor_id` uuid
- `detail` jsonb
- `created_at` timestamptz

### `meal_slots`
Migración: `20260917190000_core.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid → patients
- `weekday` smallint
- `slot` public.meal_slot_kind
- `title` text
- `detail` text
- `created_at` timestamptz

### `meal_logs`
Migración: `20260917190000_core.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid → patients
- `meal_slot_id` uuid → meal_slots
- `slot_label` text
- `photo_path` text
- `description` text
- `foods` jsonb
- `macros` jsonb
- `confidence` numeric
- `note_for_nutri` text
- `status` public.meal_log_status
- `logged_at` timestamptz
- `client_id` uuid (agregada 20260921220000)
- `nutrition_origin` text (agregada 20261005002314)

### `habit_logs`
Migración: `20260917190000_core.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid → patients
- `date` date
- `hydration` int
- `energy` text
- `sleep_minutes` int
- `logged_at` timestamptz
- `steps` int (agregada 20261007120000)
- `hydration_declared` boolean (agregada 20261009090000)

### `reminders`
Migración: `20260917190000_core.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid → patients
- `kind` public.reminder_kind
- `time_local` time
- `enabled` boolean
- `created_at` timestamptz

### `timeline_events`
Migración: `20260917190000_core.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid → patients
- `kind` public.timeline_event_kind
- `visibility` public.timeline_visibility
- `title` text
- `body` text
- `occurred_at` timestamptz
- `created_at` timestamptz

### `patient_assets`
Migración: `20260917190000_core.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid
- `nutritionist_id` uuid
- `bucket` text
- `object_path` text
- `uploaded_by` uuid → profiles
- `created_at` timestamptz
- `deleted_at` timestamptz
- `category` text (agregada 20260921190000)

### `appointments`
Migración: `20260917190000_core.sql` · RLS habilitado: sí

- `id` uuid
- `nutritionist_id` uuid
- `patient_id` uuid
- `starts_at` timestamptz
- `duration_min` int
- `channel` public.appointment_channel
- `status` public.appointment_status
- `prep_note` text
- `meet_url` text
- `created_at` timestamptz
- `timezone` text (agregada 20260921240000)

### `messages`
Migración: `20260917190000_core.sql` · RLS habilitado: sí

- `id` uuid
- `nutritionist_id` uuid
- `patient_id` uuid
- `author_id` uuid → profiles
- `body` text
- `suggested_by_ai` boolean
- `sent_at` timestamptz
- `created_at` timestamptz
- `client_id` uuid (agregada 20260921230000)

### `ai_briefs`
Migración: `20260917190000_core.sql` · RLS habilitado: sí

- `id` uuid
- `nutritionist_id` uuid
- `patient_id` uuid
- `suggested_action` public.suggested_action
- `up_next_title` text
- `up_next_body` text
- `draft_message` text
- `source_ids` text[]
- `adherence_why` text
- `status` public.brief_status
- `dismissed_at` timestamptz
- `dismissed_by` uuid → profiles
- `created_at` timestamptz

### `payments`
Migración: `20260917190000_core.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid
- `nutritionist_id` uuid
- `provider` public.payment_provider
- `amount_ars` int
- `currency` text
- `status` public.payment_status
- `period_start` date
- `period_end` date
- `mp_preference_id` text
- `mp_payment_id` text
- `created_at` timestamptz
- `approved_at` timestamptz

### `payment_webhook_events`
Migración: `20260917190000_core.sql` · RLS habilitado: sí

- `id` uuid
- `provider` public.payment_provider
- `external_event_id` text
- `event_type` text
- `processing_status` public.webhook_processing_status
- `payment_id` uuid → payments
- `received_at` timestamptz
- `processed_at` timestamptz
- `error_code` text

### `audit_events`
Migración: `20260917190000_core.sql` · RLS habilitado: sí

- `id` bigint
- `occurred_at` timestamptz
- `actor_id` uuid
- `actor_role` text
- `source` text
- `action` text
- `object_type` text
- `object_id` text
- `patient_id` uuid
- `nutritionist_id` uuid
- `metadata` jsonb

### `privacy_requests`
Migración: `20260917190000_core.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid → patients
- `kind` text
- `status` text
- `requested_at` timestamptz
- `due_at` timestamptz
- `completed_at` timestamptz
- `notes` text

### `consent_catalog`
Migración: `20260917190100_intake.sql` · RLS habilitado: sí

- `purpose` text
- `text_version` text
- `text_hash` text
- `body` text
- `required` boolean

### `intake_sessions`
Migración: `20260917190100_intake.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid → patients
- `schema_version` text
- `status` text
- `step` text
- `revision` integer
- `payload` jsonb
- `submitted_revision` integer
- `submitted_at` timestamptz
- `reviewed_by` uuid → profiles
- `reviewed_at` timestamptz
- `updated_at` timestamptz

### `consent_events`
Migración: `20260917190100_intake.sql` · RLS habilitado: sí

- `id` uuid
- `sequence` bigint
- `patient_id` uuid → patients
- `purpose` text → consent_catalog
- `text_version` text
- `text_hash` text
- `decision` text
- `actor_id` uuid → profiles
- `created_at` timestamptz

### `clinical_notes`
Migración: `20260917190100_intake.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid → patients
- `author_id` uuid → profiles
- `version` integer
- `body` text
- `created_at` timestamptz

### `care_records`
Migración: `20260918010000_care.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid → patients
- `recorded_on` date
- `data` jsonb
- `created_at` timestamptz
- `reviewed_at` timestamptz

### `care_preferences`
Migración: `20260918010000_care.sql` · RLS habilitado: sí

- `patient_id` uuid → patients
- `settings` jsonb

### `care_replacements`
Migración: `20260918010000_care.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid → patients
- `request_id` uuid
- `recipe` jsonb
- `source` text
- `created_at` timestamptz
- `published_at` timestamptz

### `processing_jobs`
Migración: `20260920190000_jobs.sql` · RLS habilitado: sí

- `id` uuid
- `kind` text
- `payload` jsonb
- `status` text
- `attempts` int
- `max_attempts` int
- `lease_owner` text
- `lease_until` timestamptz
- `run_after` timestamptz
- `last_error` text
- `created_at` timestamptz
- `updated_at` timestamptz

### `asset_upload_intents`
Migración: `20260921190000_private_assets.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid
- `nutritionist_id` uuid
- `category` text
- `object_path` text
- `mime_declared` text
- `byte_limit` int
- `status` text
- `asset_id` uuid → patient_assets
- `created_at` timestamptz
- `expires_at` timestamptz

### `measurements`
Migración: `20260921193000_measurements.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid
- `nutritionist_id` uuid
- `kind` text
- `value_numeric` numeric
- `unit` text
- `source` text
- `captured_on` date
- `created_at` timestamptz

### `ingredients`
Migración: `20260921194500_recipes.sql` · RLS habilitado: sí

- `id` uuid
- `nutritionist_id` uuid → nutritionists
- `name` text
- `name_normalized` text
- `base_unit` text
- `created_at` timestamptz

### `recipes`
Migración: `20260921194500_recipes.sql` · RLS habilitado: sí

- `id` uuid
- `nutritionist_id` uuid → nutritionists
- `title` text
- `status` text
- `created_at` timestamptz

### `recipe_versions`
Migración: `20260921194500_recipes.sql` · RLS habilitado: sí

- `id` uuid
- `recipe_id` uuid → recipes
- `version` int
- `yield_portions` numeric
- `steps` jsonb
- `nutrient_source` text
- `reviewer_id` uuid → profiles
- `published_at` timestamptz
- `created_at` timestamptz
- `nutrition` jsonb (agregada 20261003172907)
- `revision` uuid (agregada 20261005002314)
- `title` text (agregada 20261005002314)
- `catalog_recipe` jsonb (agregada 20261007173000)
- `final_weight_g` numeric (agregada 20261007173000)
- `cooking_minutes` integer (agregada 20261007173000)

### `recipe_ingredients`
Migración: `20260921194500_recipes.sql` · RLS habilitado: sí

- `id` uuid
- `recipe_version_id` uuid → recipe_versions
- `ingredient_id` uuid → ingredients
- `quantity` numeric
- `unit` text

### `recipe_assignments`
Migración: `20260921194500_recipes.sql` · RLS habilitado: sí

- `recipe_id` uuid → recipes
- `patient_id` uuid
- `nutritionist_id` uuid
- `recipe_version_id` uuid → recipe_versions
- `assigned_at` timestamptz

### `meal_plans`
Migración: `20260921200000_meal_plans.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid
- `nutritionist_id` uuid
- `timezone` text
- `created_at` timestamptz

### `meal_plan_versions`
Migración: `20260921200000_meal_plans.sql` · RLS habilitado: sí

- `id` uuid
- `meal_plan_id` uuid → meal_plans
- `version` int
- `status` text
- `period_start` date
- `period_end` date
- `published_at` timestamptz
- `created_at` timestamptz
- `nutrition_target` jsonb (agregada 20261003172907)
- `revision` uuid (agregada 20261005002314)
- `guidance` jsonb (agregada 20261008131756)
- `meal_times` jsonb (agregada 20261010200000)

### `meal_plan_items`
Migración: `20260921200000_meal_plans.sql` · RLS habilitado: sí

- `id` uuid
- `meal_plan_version_id` uuid → meal_plan_versions
- `for_date` date
- `slot` public.meal_slot_kind
- `recipe_version_id` uuid → recipe_versions
- `free_text` text
- `portions` numeric
- `public_note` text
- `recipe_proposal` jsonb (agregada 20261003172907)
- `components` jsonb (agregada 20261007230000)

### `meal_analysis_runs`
Migración: `20260921220000_meal_diary.sql` · RLS habilitado: sí

- `id` uuid
- `meal_log_id` uuid → meal_logs
- `status` text
- `foods` jsonb
- `macros` jsonb
- `confidence` numeric
- `error_code` text
- `created_at` timestamptz

### `meal_reviews`
Migración: `20260921220000_meal_diary.sql` · RLS habilitado: sí

- `id` uuid
- `meal_log_id` uuid → meal_logs
- `reviewer_id` uuid → profiles
- `status` public.meal_log_status
- `foods` jsonb
- `macros` jsonb
- `created_at` timestamptz

### `message_receipts`
Migración: `20260921230000_message_threads.sql` · RLS habilitado: sí

- `message_id` uuid → messages
- `user_id` uuid → profiles
- `delivered_at` timestamptz
- `read_at` timestamptz

### `appointment_events`
Migración: `20260921240000_appointments.sql` · RLS habilitado: sí

- `id` uuid
- `appointment_id` uuid → appointments
- `patient_id` uuid
- `nutritionist_id` uuid
- `action` public.appointment_event_action
- `actor_role` text
- `starts_at` timestamptz
- `duration_min` int
- `channel` public.appointment_channel
- `created_at` timestamptz

### `ai_jobs`
Migración: `20260921250000_ai_jobs.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid
- `nutritionist_id` uuid
- `requested_by` uuid → profiles
- `job_type` public.ai_job_type
- `status` public.ai_job_status
- `model` text
- `prompt_version` text
- `context_hash` text
- `request` jsonb
- `attempt` int
- `cost_tokens` int
- `error_code` text
- `warnings` jsonb
- `started_at` timestamptz
- `finished_at` timestamptz
- `applied_at` timestamptz
- `created_at` timestamptz
- `run_token` uuid (agregada 20261002165527)
- `run_expires_at` timestamptz (agregada 20261002165527)
- `intake_revision` integer (agregada 20261002165527)
- `ai_consent_sequence` bigint (agregada 20261002165527)

### `ai_artifacts`
Migración: `20260921250000_ai_jobs.sql` · RLS habilitado: sí

- `id` uuid
- `ai_job_id` uuid → ai_jobs
- `kind` text
- `payload` jsonb
- `created_at` timestamptz

### `privacy_export_packages`
Migración: `20260921270000_privacy_ops.sql` · RLS habilitado: sí

- `id` uuid
- `request_id` uuid → privacy_requests
- `patient_id` uuid
- `payload` jsonb
- `created_at` timestamptz
- `expires_at` timestamptz
- `downloaded_at` timestamptz

### `privacy_access_events`
Migración: `20260921270000_privacy_ops.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid
- `actor_role` text
- `action` text
- `object_type` text
- `object_id` text
- `category` text
- `metadata` jsonb
- `created_at` timestamptz

### `shopping_manual_items`
Migración: `20260921280000_shopping_lists.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid
- `nutritionist_id` uuid
- `name` text
- `quantity` numeric
- `unit` text
- `client_id` uuid
- `created_at` timestamptz

### `shopping_checks`
Migración: `20260921280000_shopping_lists.sql` · RLS habilitado: sí

- `patient_id` uuid → patients
- `source_key` text
- `checked` boolean
- `updated_at` timestamptz

### `message_attachments`
Migración: `20260921290000_message_attachments.sql` · RLS habilitado: sí

- `message_id` uuid → messages
- `asset_id` uuid → patient_assets
- `patient_id` uuid
- `filename` text
- `created_at` timestamptz

### `notification_preferences`
Migración: `20260921300000_notification_outbox.sql` · RLS habilitado: sí

- `user_id` uuid → users
- `in_app` boolean
- `email` boolean
- `push` boolean
- `updated_at` timestamptz

### `outbox_events`
Migración: `20260921300000_notification_outbox.sql` · RLS habilitado: sí

- `id` uuid
- `event_type` text
- `patient_id` uuid → patients
- `nutritionist_id` uuid → nutritionists
- `actor_id` uuid
- `client_id` uuid
- `dedupe_key` text
- `payload` jsonb
- `created_at` timestamptz

### `notification_deliveries`
Migración: `20260921300000_notification_outbox.sql` · RLS habilitado: sí

- `id` uuid
- `outbox_event_id` uuid → outbox_events
- `channel` text
- `recipient_user_id` uuid
- `status` text
- `attempt` int
- `max_attempts` int
- `last_error` text
- `skip_reason` text
- `next_attempt_at` timestamptz
- `sent_at` timestamptz
- `created_at` timestamptz

### `professional_habilitations`
Migración: `20260921320000_exercise_library.sql` · RLS habilitado: sí

- `nutritionist_id` uuid → nutritionists
- `kind` text
- `verified_at` timestamptz
- `verified_by` uuid → profiles
- `credential_ref` text
- `created_at` timestamptz

### `exercise_library`
Migración: `20260921320000_exercise_library.sql` · RLS habilitado: sí

- `id` uuid
- `slug` text
- `name` text
- `description` text
- `category` text
- `default_sets` int
- `default_reps` int
- `default_rest_seconds` int
- `published` boolean
- `created_at` timestamptz

### `exercise_routines`
Migración: `20260921320000_exercise_library.sql` · RLS habilitado: sí

- `id` uuid
- `nutritionist_id` uuid → nutritionists
- `title` text
- `created_at` timestamptz

### `exercise_routine_versions`
Migración: `20260921320000_exercise_library.sql` · RLS habilitado: sí

- `id` uuid
- `routine_id` uuid → exercise_routines
- `version` int
- `status` text
- `published_at` timestamptz

### `exercise_routine_items`
Migración: `20260921320000_exercise_library.sql` · RLS habilitado: sí

- `id` uuid
- `routine_version_id` uuid → exercise_routine_versions
- `exercise_id` uuid → exercise_library
- `sort` int
- `sets` int
- `reps` int
- `rest_seconds` int
- `note` text

### `routine_assignments`
Migración: `20260921320000_exercise_library.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid
- `nutritionist_id` uuid
- `routine_version_id` uuid → exercise_routine_versions
- `assigned_by` uuid → profiles
- `assigned_at` timestamptz
- `status` text
- `feedback_sets` int
- `feedback_reps` int
- `feedback_note` text
- `feedback_at` timestamptz

### `activity_logs`
Migración: `20260921320000_exercise_library.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid
- `nutritionist_id` uuid
- `activity` text
- `duration_minutes` int
- `intensity` text
- `note` text
- `assignment_id` uuid → routine_assignments
- `sets` int
- `reps` int
- `logged_at` timestamptz

### `resources`
Migración: `20260921330000_editorial_resources.sql` · RLS habilitado: sí

- `id` uuid
- `slug` text
- `kind` text
- `nutritionist_id` uuid → nutritionists
- `title` text
- `summary` text
- `category` text
- `eyebrow` text
- `minutes` int
- `icon` text
- `tags` text[]
- `sections` jsonb
- `related_slugs` text[]
- `action_label` text
- `action_page` text
- `author_name` text
- `author_id` uuid → profiles
- `reviewed_by` uuid → profiles
- `reviewed_at` timestamptz
- `published` boolean
- `license_kind` text
- `license_note` text
- `cover_url` text
- `created_at` timestamptz

### `resource_assignments`
Migración: `20260921330000_editorial_resources.sql` · RLS habilitado: sí

- `id` uuid
- `resource_id` uuid → resources
- `patient_id` uuid
- `nutritionist_id` uuid
- `assigned_by` uuid → profiles
- `assigned_at` timestamptz
- `first_read_at` timestamptz

### `favorites`
Migración: `20260921330000_editorial_resources.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid
- `nutritionist_id` uuid
- `item_kind` text
- `item_id` text
- `title` text
- `created_at` timestamptz

### `organizations`
Migración: `20260921340000_organizations.sql` · RLS habilitado: sí

- `id` uuid
- `name` text
- `slug` text
- `created_by` uuid → profiles
- `created_at` timestamptz

### `organization_members`
Migración: `20260921340000_organizations.sql` · RLS habilitado: sí

- `organization_id` uuid → organizations
- `nutritionist_id` uuid → nutritionists
- `role` text
- `status` text
- `invited_by` uuid → profiles
- `joined_at` timestamptz
- `created_at` timestamptz

### `organization_subscriptions`
Migración: `20260921340000_organizations.sql` · RLS habilitado: sí

- `organization_id` uuid → organizations
- `status` text
- `plan_code` text
- `valid_until` date
- `note` text
- `updated_at` timestamptz

### `teams`
Migración: `20260921340000_organizations.sql` · RLS habilitado: sí

- `id` uuid
- `organization_id` uuid → organizations
- `name` text
- `created_at` timestamptz

### `team_members`
Migración: `20260921340000_organizations.sql` · RLS habilitado: sí

- `team_id` uuid → teams
- `nutritionist_id` uuid → nutritionists

### `patient_care_links`
Migración: `20260921340000_organizations.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid → patients
- `nutritionist_id` uuid → nutritionists
- `organization_id` uuid → organizations
- `link_role` text
- `granted_by` uuid → profiles
- `granted_at` timestamptz
- `revoked_at` timestamptz

### `ownership_transfer_events`
Migración: `20260921340000_organizations.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid → patients
- `from_nutritionist_id` uuid → nutritionists
- `to_nutritionist_id` uuid → nutritionists
- `organization_id` uuid → organizations
- `actor_id` uuid → profiles
- `reason` text
- `occurred_at` timestamptz
- `detail` jsonb

### `recipe_covers`
Migración: `20260924120000_recipe_cover.sql` · RLS habilitado: sí

- `recipe_version_id` uuid → recipe_versions
- `status` text
- `url` text
- `alt` text
- `updated_at` timestamptz

### `recipe_version_cards`
Migración: `20260928120000_recipe_cards_days.sql` · RLS habilitado: sí

- `recipe_version_id` uuid → recipe_versions
- `card` jsonb
- `updated_at` timestamptz

### `recipe_day_assignments`
Migración: `20260928120000_recipe_cards_days.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid
- `nutritionist_id` uuid
- `recipe_id` uuid → recipes
- `recipe_version_id` uuid → recipe_versions
- `for_date` date
- `slot` text
- `registered_meal_id` uuid → meal_logs
- `client_id` uuid
- `created_at` timestamptz

### `nutritionist_payment_settings`
Migración: `20260930120000_patient_fees.sql` · RLS habilitado: sí

- `nutritionist_id` uuid → nutritionists
- `alias` text
- `payment_link` text
- `instructions` text
- `updated_at` timestamptz

### `patient_fees`
Migración: `20260930120000_patient_fees.sql` · RLS habilitado: sí

- `patient_id` uuid → patients
- `nutritionist_id` uuid → nutritionists
- `amount` int
- `first_due_on` date
- `charges_from` date
- `updated_at` timestamptz
- `program_name` text (agregada 20261010150000)

### `patient_charges`
Migración: `20260930120000_patient_fees.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid → patients
- `nutritionist_id` uuid → nutritionists
- `due_on` date
- `amount` int
- `status` text
- `created_at` timestamptz
- `kind` text (agregada 20261010150000)

### `patient_payments`
Migración: `20260930120000_patient_fees.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid → patients
- `nutritionist_id` uuid → nutritionists
- `amount` int
- `paid_on` date
- `method` text
- `note` text
- `status` text
- `reported_by_patient` boolean
- `created_by` uuid → profiles
- `created_at` timestamptz
- `reviewed_at` timestamptz

### `platform_admins`
Migración: `20260930180000_service_admin.sql` · RLS habilitado: sí

- `user_id` uuid → profiles
- `created_at` timestamptz

### `platform_settings`
Migración: `20260930180000_service_admin.sql` · RLS habilitado: sí

- `id` boolean
- `monthly_price` int
- `trial_days` int
- `updated_at` timestamptz

### `nutritionist_subscriptions`
Migración: `20260930180000_service_admin.sql` · RLS habilitado: sí

- `nutritionist_id` uuid → nutritionists
- `trial_ends_on` date
- `paid_until` date
- `override` text
- `note` text
- `updated_at` timestamptz
- `is_test` boolean (agregada 20261001120000)

### `service_payments`
Migración: `20260930180000_service_admin.sql` · RLS habilitado: sí

- `id` uuid
- `nutritionist_id` uuid → nutritionists
- `amount` int
- `months` int
- `paid_on` date
- `method` text
- `note` text
- `status` text
- `created_by` uuid → profiles
- `created_at` timestamptz

### `nutrition_targets`
Migración: `20260930190000_nutrition_targets.sql` · RLS habilitado: sí

- `patient_id` uuid → patients
- `inputs` jsonb
- `result` jsonb
- `published_at` timestamptz
- `updated_at` timestamptz

### `patient_body_data`
Migración: `20260930190000_nutrition_targets.sql` · RLS habilitado: sí

- `patient_id` uuid → patients
- `sex` text
- `birth_date` date
- `height_cm` numeric
- `weight_kg` numeric
- `updated_at` timestamptz

### `patient_body_data_requests`
Migración: `20260930190000_nutrition_targets.sql` · RLS habilitado: sí

- `patient_id` uuid → patients
- `requested_at` timestamptz

### `recipe_cover_requests`
Migración: `20261002165327_ai_cover_reservations.sql` · RLS habilitado: sí

- `recipe_version_id` uuid → recipe_versions
- `token` uuid
- `claimed_at` timestamptz
- `finished_at` timestamptz

### `nutrition_target_drafts`
Migración: `20261003172112_separate_nutrition_target_drafts.sql` · RLS habilitado: sí

- `patient_id` uuid → patients
- `inputs` jsonb
- `result` jsonb
- `revision` bigint
- `updated_at` timestamptz

### `menu_dish_covers`
Migración: `20261006120000_menu_dish_covers.sql` · RLS habilitado: sí

- `id` uuid
- `nutritionist_id` uuid → nutritionists
- `dish_key` text
- `recipe_version_id` uuid → recipe_versions
- `context` jsonb
- `status` text
- `attempts` int
- `run_token` uuid
- `lease_until` timestamptz
- `run_after` timestamptz
- `url` text
- `alt` text
- `created_at` timestamptz

### `food_catalog`
Migración: `20261007160000_food_catalog.sql` · RLS habilitado: sí

- `id` uuid
- `owner_id` uuid → nutritionists
- `revision` bigint
- `payload` jsonb
- `updated_at` timestamptz

### `professional_recipe_favorites`
Migración: `20261007190000_professional_recipe_favorites.sql` · RLS habilitado: sí

- `nutritionist_id` uuid → nutritionists
- `recipe_id` uuid → recipes
- `created_at` timestamptz

### `professional_models`
Migración: `20261008013013_professional_models.sql` · RLS habilitado: sí

- `id` uuid → nutritionists
- `kind` text
- `revision` uuid
- `published` jsonb

### `ingredient_covers`
Migración: `20261008120000_ingredient_covers.sql` · RLS habilitado: sí

- `key` text
- `status` text
- `attempts` int
- `run_token` uuid
- `lease_until` timestamptz
- `run_after` timestamptz
- `last_attempt_at` timestamptz
- `storage_path` text
- `url` text
- `alt` text
- `ready_at` timestamptz
- `created_at` timestamptz
- `updated_at` timestamptz

### `cover_daily_usage`
Migración: `20261008120000_ingredient_covers.sql` · RLS habilitado: sí

- `day` date
- `kind` text
- `attempts` int

### `nutritionist_programs`
Migración: `20261010150000_charges_programs.sql` · RLS habilitado: sí

- `id` uuid
- `nutritionist_id` uuid → nutritionists
- `name` text
- `amount` int
- `created_at` timestamptz

### `meal_plan_handovers`
Migración: `20261010180000_meal_plan_effective_date.sql` · RLS habilitado: sí

- `meal_plan_version_id` uuid → meal_plan_versions
- `meal_plan_id` uuid → meal_plans
- `previous_version_id` uuid → meal_plan_versions
- `starts_on` date
- `changes` jsonb
- `created_at` timestamptz
- `seen_at` timestamptz

### `goal_history`
Migración: `20261010183000_patient_goal_followup.sql` · RLS habilitado: sí

- `id` uuid
- `patient_id` uuid
- `nutritionist_id` uuid
- `goal` text
- `status` text
- `progress` integer
- `note` text
- `updated_at` timestamptz

## 8. Vistas (con migración de origen)

- `patients_patient_view` — `20261009154511_invoker_patient_profile_projections.sql`
- `patient_access_view` — `20261009154511_invoker_patient_profile_projections.sql`
- `meal_logs_patient_view` — `20261005002314_harden_product_writes.sql`
- `messages_patient_view` — `20260917190000_core.sql`
- `appointments_patient_view` — `20260921240000_appointments.sql`
- `intake_patient_view` — `20260917190100_intake.sql`
- `patient_goal_patient_view` — `20261010183000_patient_goal_followup.sql`
- `goal_updates_patient_view` — `20261010183000_patient_goal_followup.sql`

Tablas: 92

## 9. Planeado (plan v2 §11, no existe)
Ánimo/síntomas diarios, señales del motor de seguimiento, equivalencias, página pública y paquetes, conexión Mercado Pago por nutri, denuncias/bloqueos de chat, push tokens. Ninguna de estas tablas existe todavía: diseñarlas en su fase, con migración aprobada.

## 10. Decisiones abiertas para Facu
1. Aprobar la migración que deja **solo SELECT** en las 4 vistas `*_patient_view` con permisos de más.
2. ¿Se aplican en prod las migraciones del repo posteriores al 10/10? (requieren tu frase escrita).
3. Las ~22 tablas con RLS sin política: ¿se dejan así (acceso solo por funciones) y se documenta, o se agregan políticas explícitas de denegación?
4. `payments`/`payment_webhook_events` (Mercado Pago) existen sin uso: ¿se mantienen para la fase 4 o se reemplazan por `patient_payments`?
