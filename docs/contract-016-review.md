# Contrato 016 — revisión de la propuesta (v2, 2026-09-07)

Estado: **borrador v2 para revisión, NO aprobado**.

Archivo: `supabase/contracts/016_plan_v_contract_draft.sql`
El encabezado conserva `DRAFT v2 — REVIEW ONLY — DO NOT APPLY / NO CORRER`.

La v2 incorpora los hallazgos de tres revisiones independientes (seguridad
PostgreSQL/Supabase, compatibilidad de dominio y privacidad/operación).

## Hallazgos de la revisión y su resolución en v2

| Hallazgo | Severidad | Resolución v2 |
|---|---|---|
| `CHECK` con subquery en `messages` (SQL inválido) | Crítica | Trigger `validate_message_author` |
| Auto-promoción paciente→nutri (`profiles.role` editable + insert propio) | Crítica | Grant por columna `update(full_name, avatar_url)`; RPC `provision_nutritionist` sólo `service_role`; sin `nutritionists_insert_own` |
| Cobranza/pagos escribibles por nutri | Crítica | `patients` con UPDATE por columna sin `billing_*`; `payments_nutri_select` únicamente; transiciones por service role/webhook |
| Vistas `security_invoker` incompatibles con tablas revocadas; columnas nutri bloqueadas por grants | Crítica | Vistas **definer** (owner postgres) con WHERE por identidad del caller; RLS por comando sobre tablas crudas |
| Paywall sin efecto en fotos/logs | Alta | `patient_has_full_access` en vista de meal logs, appointments y storage select |
| `prep_note` expuesto a paciente | Alta | Sin policy SELECT paciente en `appointments`; vista sin `prep_note` |
| Pares `(patient_id, nutritionist_id)` sin restricción cruzada | Alta | `unique(id, nutritionist_id)` + FKs compuestas (6 relaciones) + trigger para `meal_slot_id` |
| Nutri podía escribir `author_id` ajeno | Alta | Policy `messages_nutri_insert` con `author_id = auth.uid()` + trigger caller-binding |
| `patients.user_id` no único/asignable por nutri | Alta | `user_id unique` + excluido del grant de columnas; lo fija `accept_patient_invite` |
| Funciones `SECURITY DEFINER` expuestas | Alta | `revoke all` + grants explícitos; `search_path = ''`; billing check scoped a `auth.uid()` |
| Bucket `on conflict do nothing` y paths sin prefijo | Alta | `do update` fuerza config; policies exigen `patients/<id>/…` |
| `meal_slots` con fecha/hora incompatible con menú semanal | Bloqueante dominio | Plantilla semanal `weekday 0-6` + `unique(patient_id, weekday, slot)` |
| `source_ids uuid[]` incompatible con ids del dominio | Bloqueante dominio | `source_ids text[]` |
| `reminder_kind` sin consultas | Bloqueante dominio | Enum incluye `appointment` |
| Mensajes enviados quedaban invisibles / `sent_at` ausente | Bloqueante dominio | Vista filtra `sent_at is not null`, sin filtrar `suggested_by_ai`; el flag no se expone |
| Invitación: una fila mutable sin historial | Bloqueante ops | Índices parciales (activa por paciente y por nutri+email) + `patient_invite_events` append-only |
| Pagos: sin idempotencia ni retención | Crítica ops | Únicos parciales MP + `payment_webhook_events` (provider, external_event_id) + FK `on delete restrict` |
| Sin auditoría ni lifecycle de privacidad | Bloqueante ops | `audit_events` (sin FKs, service-only), `privacy_requests`, columnas `deactivated_at/deletion_requested_at/anonymized_at` |
| Borrado Auth en cascada destructivo | Crítica ops | Pagos `restrict`; workflow de borrado/exportación queda en runbook externo |
| `handle_new_user` podía abortar signup sin email | Corrección | Fallback `''` y rol siempre `paciente` |
| Storage sin manifiesto ni ciclo de vida | Bloqueante ops | `patient_assets` (bucket/path/owner/deleted_at); purga física en runbook |

## Modelo de acceso v2 (mismo rol SQL `authenticated` para ambos)

1. **RLS por comando** decide filas y operaciones; los grants sólo habilitan.
2. **Columnas service-only** (`profiles.role`, `patients.billing_*`, `user_id`,
   lifecycle): fuera de los grants por columna — permission denied aunque la
   policy lo permitiera.
3. **Lecturas de paciente sobre tablas con campos profesionales**: sin policy
   sobre la tabla cruda; vistas definer con WHERE por identidad.
4. **Mensajes inmutables** para authenticated (sin UPDATE/DELETE ni grants).
5. **Invitaciones/cobranza/pagos**: transiciones sólo service role o RPCs.

## Pendiente antes de aprobación (no es código)

1. Responsables, privacidad y retención: Ley 25.326, plazos por tabla, purgas.
2. Revisar `accept_patient_invite` y `provision_nutritionist` con un DBA/Supabase.
3. Decidir proveedor de email, TTL de invitación y rate limiting.
4. Runbook de Storage: URLs firmadas, TTL, EXIF/magic bytes, purga y órfanos.
5. Runbook de Mercado Pago: firma, replay window, conciliación, sandbox/live.
6. Pruebas RLS reales Nutri A/B y Paciente A/B en instancia descartable.

La secuencia, responsables por asignar y matriz verificable de staging están en
[`016-approval-and-staging-checklist.md`](016-approval-and-staging-checklist.md).

## Trabajo de adaptación que habilita este contrato (cortes siguientes)

1. Repositorios: menú semanal, `habit_logs` (upsert + snapshot de hoy),
   consultas con fecha real, invitaciones, cobranza, timeline, brief dismissal.
2. `sbAddMessage` debe fijar `sent_at`; mapear `photo_path` ↔ URLs firmadas
   (hoy el endpoint recibe `photoPreview` como data URL — requiere upload previo).
3. Flujo de aceptación de invitación en Auth/UI.
4. Appointments: pasar de weekday+hora local a `starts_at` con timezone.
5. Retirar la selección pública de rol en el alta (Auth/UI).

## Nunca

- `supabase db push` con este archivo.
- Conectar datos reales, emails reales ni pagos reales.
- Service key en frontend, repo ni compartida por chat.
