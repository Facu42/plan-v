# Contrato ampliado — inventario de entidades y matriz de permisos (v1, 2026-09-16)

> PV-06: el núcleo sigue en `supabase/contracts/016_plan_v_contract_draft.sql`. La ampliación piloto (H1–H4) vive en `supabase/contracts/016b_piloto_ampliacion_draft.sql`. Diccionario y política: [`contrato-diccionario-piloto.md`](contrato-diccionario-piloto.md). Ambos SQL son DRAFT / NO CORRER.

Estado: **borrador documental para revisión, NO aprobado**. No habilita migraciones.

## 1. Inventario de nuevas entidades y eventos (paso 2.1)

Clasificación: **demo** = implementada sólo en memoria; **derivada** = se calcula
de entidades existentes, no debe persistirse; **futura** = sin implementación.

| Entidad / evento | Estado demo | Contrato piloto | Qué queda para persistir (PV-08+) |
| --- | --- | --- | --- |
| `resource_assignments` | demo (corte 60) | 016b: `resources` + `resource_assignments` (`first_read_at`) | RLS completa, seeds, 501 → escritura real |
| `resource_guides` | estático en cliente | 016b: `resources` con `published`/`reviewed_at` | Autoría/revisión clínica y catálogo no clínico (PV-36) |
| `activity_logs` | demo (corte 57) | 016b: actividad autodeclarada, sin calorías | RLS paciente-insert / nutri-select |
| `plan_b` | campo en `patients` | núcleo 016; fuera del DTO paciente (PV-03) | Confirmar si alguna vez se publica |
| Lista de compras | derivada | **fuera del piloto** | `shopping_lists` post-piloto (PV-21/39) |
| `recipes` / `recipe_ingredients` | demo + PGlite (PV-18) | 016b: recetas versionadas + ingredientes + asignaciones | Live schema en proyecto **vacío** (no el de `patients`) |
| `meal_plans` / versiones | demo + PGlite (PV-19/20); plantilla semanal 016 sigue aparte | 016b: plan fechado, una versión `published` | Live schema en proyecto **vacío**. Compras: PV-21 (P1) |
| `meal_logs` + `meal_analysis_runs` / `meal_reviews` | demo + PGlite (PV-22); save-first + `client_id` | 016b: análisis y revisión separados del registro | Live schema/buckets en proyecto **vacío**. Job IA asíncrono: PV-27 |
| `intake_sessions` / `consent_events` | onboarding React | 016b: intake versionado + consentimientos append-only | Pantallas y persistencia (PV-12/13) |
| `document_records` / `body_photo_entries` | — | 016b: estudios y fotos corporales; sin IA | Storage privado (PV-15/16) |
| `measurements` | demo + PGlite (PV-17) | 016b: peso/medidas con unidad y origen | Live schema en proyecto **vacío** (no el de `patients`) |
| `clinical_notes` | notas en ficha | 016b: sólo nutri; revoke paciente | Nunca en DTO paciente |
| `ai_jobs` / `ai_artifacts` | demo + PGlite (PV-27); prompt_version + context_hash; apply no publica | 016b: jobs privados del profesional | Live schema en proyecto **vacío**. Evaluación sintética: PV-28 |
| `outbox_events` | buzón demo | 016b: outbox + deliveries; sin policy authenticated | Proveedor real (PV-26) |
| `appointment_events` | demo + PGlite (PV-25); cancel+insert, timezone, confirmación, solapes 409 | 016b: historial append-only | Live schema en proyecto **vacío**. GET hospedado cae a turnos 016 sin historial |
| `message_receipts` | demo + PGlite (PV-23); entrega/lectura por persona, `client_id` | 016b: recibo por (mensaje, usuario) | Live schema en proyecto **vacío**. GET hospedado cae al hilo 016 sin recibos |
| `exercise_library` / rutinas | — | **fuera del piloto** (PV-35) | Habilitación profesional verificada |
| `organizations` / equipos | — | **fuera del piloto** (PV-38) | Ownership y delegación |

Reglas transversales ya vigentes: ninguna entidad nueva puede exponer
`note_for_nutri`, `goal_history` profesional, `adherence_why`, `brief` ni
`suggested_by_ai` al paciente; los IDs editoriales no llevan contexto clínico; la
autorización se agrega primero en `server/security/contracts.ts`.

## 2. Matriz de permisos por rol (paso 2.2)

Roles: **N** = nutricionista asignada, **P** = paciente titular, **S** = servicio
(service role / RPC). «—» = sin acceso. Acciones demo entre corchetes corresponden
a `PatientAction` actuales.

| Entidad | N lee | N escribe | P lee | P escribe | S |
| --- | --- | --- | --- | --- | --- |
| `resource_guides` publicadas | sí | (futuro: crear/editar con revisión) | sí (catálogo) | — | migración/seed |
| `resource_assignments` | sí, sus pacientes | asigna 1..N [`assign_resource`] | sólo las propias | marca `read_at` propio [`read_resource`] | auditoría |
| `activity_logs` | sí, sus pacientes | — (lectura solamente) | las propias | inserta propia [`log_activity`] | retención/purga |
| `meal_logs` | sí, revisa [`review_meal`] | confirma/ajusta vía `review_meal_log` | las propias (sin nota interna ni `client_id`) | crea [`analyze_meal`] save-first | Storage/IA; RPC `save_meal_log` / `record_meal_analysis` |
| `meal_analysis_runs` / `meal_reviews` (PV-22) | sí (nutri asignada) | append análisis/revisión | — (sin SELECT crudo) | no escribe tablas crudas | fail closed 501 sin schema |
| `meal_slots` (plan semanal) | sí | upsert/delete | plan publicado | — | — |
| `meal_plans` / versiones / ítems (PV-19/20) | sí (profesional: borrador + publicada) | guarda borrador; publica con `expected_version` [`edit_menu`] | snapshot `published` vía RPC: receta, porciones, días vacíos | — | transacción de publicación; no SQL live |
| `habit_logs` | sí | — | las propias | upsert propio [`update_habits`] | snapshot diario |
| `appointments` | sí | crea/reprograma/cancela [`edit_appointment`] | próxima + historial de cambios (sin notas clínicas) | reprograma día/hora del turno vigente [`reschedule_appointment`]; no cancela | — |
| Notificaciones (in-app, navegador, buzón demo) | sí, consultorio | — | propias | preferencias de dispositivo [`localStorage`]; buzón demo no envía mail real | proveedor/push/mail reales pendientes |
| `messages` | sí, hilo asignado | envía como autor vía `send_thread_message`; JWT = autor | propias enviadas + recibo de la contraparte | envía; marca leído/entrega vía RPC | inmutable; `client_id` único; fail closed 501 sin schema |
| `goals` + `goal_history` | sí | actualiza [`set_goal`] | objetivo vigente | — | historial inmutable |
| `patients` ficha | sí | perfil/archivo | vista segura propia | perfil limitado | lifecycle/billing |
| `plan_b` | sí | edita en ficha | — (pendiente confirmar) | — | — |
| `resource favorites` | — | — | propias, dispositivo | propias, dispositivo | nunca servidor (hoy) |
| Favoritos/guardado unificado | — | — | — | — | entidad futura sin permisos definidos |

Observaciones para la revisión:

1. `plan_b` hoy se muestra sólo en superficies profesionales; decidir en la
   revisión si el paciente puede ver la suya propia antes de incluirla en la
   vista paciente.
2. `read_resource` nunca debe convertirse en evidencia clínica de adherencia;
   es una marca de conveniencia editorial.
3. Toda escritura nueva llega primero como `501` autorizada en modo Supabase
   hasta que exista tabla + RLS + audit aprobados.
4. Las acciones `assign_resource`/`read_resource`/`log_activity`/`reschedule_appointment`
   ya viven en `server/security/contracts.ts`; cualquier permiso nuevo sigue ese
   camino y nunca un chequeo ad-hoc en el handler.

## Nunca

- Convertir este documento en migración ni aplicar SQL.
- Declarar operativas las entidades **futuras**.
- Persistir favoritos locales, checks de compra ni recencia `atLabel` como si
  fueran historia clínica.
