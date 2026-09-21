# Integración del WIP local — 2026-09-21

Inventario de `cursor/professional-app-ai-ca47-local-wip-20260921` (`da11bab`) contra la punta de `cursor/disposable-postgres-3f32` (PR #4) y contra `origin/cursor/professional-app-ai-ca47` (`e4b5ffb`). Esta rama sale de PR #4. No se fusionó a `main`. No se aplicó SQL a ningún proyecto Supabase hospedado.

## Por qué esta base

`origin/cursor/professional-app-ai-ca47` es ancestro de `cursor/disposable-postgres-3f32`: el merge-base de ambas es `e4b5ffb`. PR #4 ya contiene los ~12 commits posteriores al desvío (estudios con retiro, diario sin IA, matriz RLS en PGlite, acompañamiento de demo) y sigue con PV-21…PV-39.

El desvío común con el WIP local es `e927634`. Encima de eso el WIP local tiene sólo tres commits:

- `7dc7f28` — nota de esquema vacío en el proyecto Plan V.
- `ffe0d80` — cuarentena de archivos privados y visor opcional de estudios.
- `da11bab` — medidas, recetas, planes, análisis de comidas, recibos, turnos y jobs/eval, más cableado del showroom.

El proyecto activo `plan-v-app` (`wvosvlxpfytokwfbcero`, creado el 2026-09-21) tiene el historial de migraciones de esta línea (`core` … `privacy_ops`, más `fix_security_invoker_patient_views` y `patients_self_select_rls`), no los nombres `20260918180000`…`20260918250000`. Por eso la base de la integración es PR #4.

## Recuperado

La nota de esquema que el árbol de `professional-app-ai-ca47` pisó al seguir de largo. El WIP local la dejó así, como registro del 2026-09-18, no como estado actual:

- El proyecto Supabase **Plan V** (`acevlqrkvdinelgxnaki`, org Facu42) se reactivó y, según ese WIP, recibió `core` / `intake` / `care` con **0 pacientes, 0 perfiles y 0 usuarios Auth**. No se ejecutó el draft 016/016b. No se aplicó SQL a **ruti-chat-crm**.
- El mismo WIP afirma después que también se aplicaron, todavía con 0 pacientes, `20260918180000_assets.sql`, `20260918190000_care_measurements.sql`, `20260918200000_recipes.sql` y `20260918210000_meal_plans.sql`, con buckets privados `meal-photos`, `care-photos`, `asset-quarantine` y `clinical-documents`.
- Para liberar el cupo Free se pausó `supabase-indigo-zebra` (`molizymlsilnciiilqqo`): test Vercel de Rumbotex de julio, no es Plan V ni la base viva de ruti. En el listado actual de proyectos no aparece.
- Auth, PostgREST y Storage reales contra esa instancia no quedaron verificados desde la app: faltaba el `.env` de staging. La matriz RLS live seguía abierta.

Esta integración **no releyó** `acevlqrkvdinelgxnaki`: está `INACTIVE` y la conexión cortó por timeout. No se reactivó. Esas afirmaciones quedan como registro del WIP, no como esquema verificado hoy.

## Ya presente en PR #4 (no se portó)

El código y el SQL del WIP repiten entregas que PR #4 reescribió con otro layout de archivos y migraciones posteriores. Copiarlos chocaría con tablas que ya existen (`recipes`, `meal_plans`, `ai_jobs`, `message_receipts`, `appointment_events`).

| WIP local | Equivalente en PR #4 | Qué se solapa |
| --- | --- | --- |
| `20260918180000_assets.sql`, `server/assets/*`, `StudiesPanel` | PV-15 `20260921190000_private_assets.sql` + PV-16 estudios en `CarePanel` y `20260919190000_clinical_documents.sql` | Reserva, cuarentena, magic bytes, recorte EXIF JPEG/PNG, URL 60 s, retiro, PDF/JPG/PNG sin IA. PR #4 suma WebP, PDF activo, checksum y buckets de producto. El visor está en Progreso y ficha. |
| `20260918190000_care_measurements.sql` | PV-17 `20260921193000_measurements.sql` | Unidad, origen paciente/profesional, historial. El RPC rechaza `care_source_mismatch` si el origen no coincide con el actor. |
| `20260918200000_recipes.sql`, `RecipeCatalog` | PV-18 `20260921194500_recipes.sql` | Catálogo profesional, publicación, el paciente no ve inéditos. PR #4 usa versiones e ingredientes inmutables y asignación, no JSON suelto. El catálogo está en Plan; el paciente ve asignadas en Menú. |
| `20260918210000_meal_plans.sql`, `usePublishedPlan` | PV-19/PV-20 `20260921200000_meal_plans.sql` y `20260921210000_meal_plan_patient_detail.sql` | Plan fechado, versión esperada, copia publicada inmutable, mismo snapshot en CRM y paciente. |
| `20260918220000_meal_log_analysis.sql` | PV-22 `20260921220000_meal_diary.sql` y el fix de diario sin IA en `professional-app` | Guardar antes de la IA, `client_id`, análisis `failed` sin borrar foto/texto. |
| `20260918230000_message_receipts.sql` | PV-23 `20260921230000_message_threads.sql` | Envío idempotente, entrega y lectura. PR #4 suma hilos 1:1; PV-24 suma adjuntos. |
| `20260918240000_appointment_events.sql` | PV-25 `20260921240000_appointments.sql` | Timezone `America/Argentina/Buenos_Aires`, confirmación, historial, solape 409. |
| `server/ai/*`, `20260918250000_ai_jobs.sql` | PV-27 `20260921250000_ai_jobs.sql` y PV-28 `20260921260000_ai_eval.sql` | Jobs versionados de receta/menú, borrador sin publicar, `eval.v1` de 30 escenarios, alergia explícita bloquea. |
| Showroom: pestaña pro Recetas, `StudiesPanel`, plan publicado en compras/menú | `NutrigoShowroom` + `RecipeCatalog` + `MealPlanVersions` + `CarePanel` | El cableado posterior cubre las mismas superficies y el contrato de layout PV-37. |

Avisos del evaluador viejo que no se copiaron, porque PV-28 ya es más estricto o el dato ya no es texto libre: `unit_mix` (g y ml en el mismo renglón), `time_unknown`, `sparse_menu` (menos de 3 slots), `allergen_free_claim` como código aparte (el token del alérgeno ya bloquea, incluso dentro de «libre de …»), `placeholder_content` como aviso (en PV-28 el borrador incompleto bloquea).

## Huecos manuales

- No reactivar ni migrar `acevlqrkvdinelgxnaki` desde este cambio. Si ese proyecto pausado conserva el SQL del WIP, su forma (recetas en JSON, migraciones `20260918…`) no es la de PR #4. Reconciliarlo es una decisión aparte, con el proyecto todavía sin pacientes o sobre una copia descartable.
- `plan-v-app` tiene **1 fila en `patients`**. Lectura del 2026-09-21: migraciones aplicadas hasta `privacy_ops` y dos ajustes de RLS. No están en ese historial las de PV-21 en adelante (compras, adjuntos, outbox, progreso, ejercicio, recursos, organizaciones). **No aplicarlas** mientras haya pacientes. Esta integración no escribió SQL.
- `ruti-chat-crm` no se tocó.
- Siguen abiertos, y ya estaban en esta rama: revisión clínica de `eval.v1`, Auth/RLS live, Railway en el binario de esta rama, PWA en un teléfono, retención legal, email/push `sent`.
- El backup `cursor/professional-app-ai-ca47-local-wip-20260921` queda en GitHub como archivo de los tres commits. No hace falta merge.
