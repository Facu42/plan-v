# Corte 21 — contrato Supabase 016 v2 (post-revisión)

Estado: **borrador v2 completado, no aplicado** (2026-09-07).

Archivo contractual:

```text
supabase/contracts/016_plan_v_contract_draft.sql
```

Encabezado: **DRAFT v2 — REVIEW ONLY — DO NOT APPLY / NO CORRER**.
No se conectó Supabase ni servicios externos; no se usaron credenciales.

## Proceso

1. Tres revisiones independientes en paralelo (seguridad PostgreSQL/Supabase,
   compatibilidad de dominio, privacidad/operación) sobre la v1 endurecida.
2. Veredictos: *do not apply* / *request changes* / *not ready for activation*.
3. Reescritura completa del contrato como v2 incorporando todos los hallazgos.
4. Tests de contrato reescritos (17 estáticos) primero contra la v1 (RED),
   luego verdes contra v2.

## Decisiones estructurales de v2

- Paciente y nutricionista comparten el rol SQL `authenticated`; por eso:
  - RLS por comando decide; los grants sólo habilitan.
  - Columnas service-only fuera de grants por columna (`profiles.role`,
    `patients.billing_*`, `user_id`, lifecycle de privacidad).
  - Paciente sin policies SELECT sobre `patients`, `meal_logs`, `messages`,
    `appointments`: lee vistas **definer** (owner postgres) con WHERE por
    identidad del caller y `patient_has_full_access` donde aplica paywall.
- Mensajes inmutables para authenticated (sin UPDATE/DELETE ni grants);
  `messages_nutri_insert` exige `author_id = auth.uid()` y el trigger exige
  caller = autor + relación válida.
- Invitaciones: índices parciales (una activa por paciente; una activa por
  nutri+email), historial `patient_invite_events`, RPC de aceptación atómica
  (email confirmado + coincidente + no expirada + una sola vez).
- Nutricionistas: sin auto-alta; RPC `provision_nutritionist` sólo `service_role`.
- Menú semanal como plantilla `weekday 0-6` + `unique(patient_id, weekday, slot)`.
- `source_ids text[]`, `reminder_kind` incluye `appointment`.
- Pagos: `payments_nutri_select` únicamente; únicos parciales MP; ledger
  `payment_webhook_events (provider, external_event_id)`; FK `on delete restrict`.
- Storage: bucket `on conflict do update` (fuerza config segura); todas las
  policies exigen prefijo canónico `patients/<patient_id>/…`; manifiesto
  `patient_assets` para ciclo de vida y reconciliación.
- Auditoría: `audit_events` (sin FKs, service-only) y `privacy_requests` +
  columnas lifecycle en `patients`.

## Verificación

- `npm test -- server/contracts-016.test.ts` → 17/17.
- Suite completa: 25 archivos / 122 tests OK; `npm run check` OK.

## Límites

- Tests estáticos de estructura/decisiones; no ejecutan SQL ni RLS real.
- Pendiente instancia descartable para pruebas Nutri A/B y Paciente A/B.

## Próximos cortes que habilita

1. Repositorios Supabase sobre el contrato (menú, hábitos, consultas, timeline,
   invitaciones, cobranza, brief dismissal).
2. `sbAddMessage` con `sent_at`; `photo_path` ↔ URL firmada (upload previo).
3. Flujo Auth de aceptación de invitación; quitar selección pública de rol.
4. Appointments con fecha/timezone real.
