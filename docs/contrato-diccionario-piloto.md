# Diccionario y política del contrato piloto — PV-06

Fecha: 16 de septiembre de 2026. Estado: **propuesta de revisión**. No autoriza migraciones, no es un dictamen legal y no se aplica SQL.

## Separación de schema

| Artefacto | Qué cubre | Qué no cubre |
| --- | --- | --- |
| `supabase/contracts/016_plan_v_contract_draft.sql` | Núcleo 016 v2: identidad, invitación, menú semanal, comidas, hábitos, turnos, mensajes, briefs, pagos, auditoría, Storage de fotos de comida | Recetas versionadas, intake, consentimientos, planes fechados, jobs de IA, recibos |
| `supabase/contracts/016b_piloto_ampliacion_draft.sql` | Ampliación del piloto (H1–H4): ingreso, archivos por categoría, recetas/planes, historial de turnos, recibos, recursos, outbox | `exercise_library`, organizaciones/equipos, listas de compra persistidas, presupuesto |
| `supabase/contracts/legacy/20260901000000_plan_v_v0.sql` | Legado inseguro | No se corre |

`npm run check:migrations` vigila sólo `supabase/migrations/`. Estos borradores viven en `contracts/` a propósito.

## Diccionario de datos (piloto)

Roles de acceso: **P** paciente titular, **N** nutricionista vinculada, **S** servicio/RPC.

| Tabla | Contenido esencial | P | N | S | Retención propuesta* |
| --- | --- | --- | --- | --- | --- |
| `profiles` / `nutritionists` / `patients` | Identidad y vínculo. Rol y billing no editables por el paciente | lectura acotada (vista) | ficha asignada | provisión, billing | cuenta: mientras exista el vínculo + guarda clínica |
| `patient_contacts` | Nombre preferido, teléfono, timezone | leer/editar propios | leer | — | con la ficha |
| `patient_invites` + `patient_invite_events` | Invitación de un uso + bitácora | aceptar vía RPC | crear/leer | transiciones | 2 años tras aceptación/revocación |
| `intake_sessions` | Borrador/envío versionado; un draft vigente | guardar/enviar propio | leer y marcar revisión | — | 10 años (ingreso clínico) |
| `patient_health_profiles` | Alergias/restricciones autodeclaradas (`unknown/none/reported`) | ver/actualizar propias | revisar | — | 10 años |
| `clinical_notes` | Notas profesionales. **Nunca en DTO paciente** | — | crear/leer propias | retención | 10 años |
| `consent_events` | Append-only: finalidad, hash del texto, decisión | otorgar/retirar | ver estado | evidencia | 10 años (prueba de consentimiento) |
| `patient_assets` / `asset_upload_intents` | Metadatos y path opaco; nunca base64 | subir/ver propios | ver con relación | escaneo/purga | fotos comida 3 años; estudios/fotos corporales 10 años o hasta retiro |
| `document_records` | Estudio + nota del paciente; revisión profesional aparte | ver propios | revisar | — | 10 años |
| `body_photo_entries` | Foto corporal opcional; sin IA | ver/retirar propias | ver con finalidad | purga | hasta retiro + 30 días de cola |
| `measurements` | Peso/medidas con fecha, unidad, origen | registrar propias | leer | — | 10 años |
| `ingredients` / `recipes` / `recipe_versions` | Catálogo profesional versionado | sólo publicadas/asignadas | biblioteca propia | borradores IA | mientras el consultorio exista |
| `meal_plans` / `meal_plan_versions` / `items` | Plan fechado; publicación inmutable | versiones publicadas | crear/publicar | snapshot | 10 años |
| `meal_logs` / `meal_analysis_runs` / `meal_reviews` | Registro ≠ análisis ≠ revisión | crear/ver propio sin nota interna | revisar | job IA | 10 años |
| `habit_logs` / `activity_logs` / `goals` | Autodeclarados | propios | leer | — | 5 años |
| `goal_history` | Historial profesional del objetivo | — | leer | — | 10 años |
| `messages` / `message_receipts` | Hilo inmutable; recibos por usuario | hilo propio | hilo vinculado | entrega | 5 años |
| `appointments` / `appointment_events` | Turno + historial append-only | leer/reprogramar según política | crear/cambiar | conflictos | 10 años |
| `resources` / `resource_assignments` | Guías editoriales | asignadas | publicar/asignar | — | mientras publicadas |
| `ai_jobs` / `ai_artifacts` | Borradores privados | — | solicitar/revisar | ejecutar | 1 año o hasta publicar el plan |
| `outbox_events` / `notification_deliveries` | Eventos de aviso; payload mínimo | — | — | worker | 90 días |
| `payments` / `payment_webhook_events` | Cobros; `on delete restrict` | resumen propio | leer | webhook | 10 años fiscales |
| `audit_events` / `privacy_requests` | Rastro opaco y pedidos ARCO | solicitar | vista acotada | ejecutar | 10 años |

\*Plazos de trabajo para el piloto, no plazos legales firmados. La historia clínica en Argentina suele requerir guarda prolongada; privacidad y la licenciada tienen que confirmarlos antes de PV-31.

`plan_b`, `next_focus` y `sensitive_hours` del núcleo 016 siguen siendo notas de ficha profesional. El DTO paciente de PV-03 las deja vacías hasta que exista un campo publicado explícito.

## Permisos por acción (aplicación)

La autorización de producto vive en `server/security/contracts.ts`. El SQL refuerza, no sustituye.

| Acción | Actor | Tablas | Resultado si falla |
| --- | --- | --- | --- |
| `read_self` / `read_patient` | P / N | vistas 016 / ficha | 403/404 sin revelar ajenos |
| enviar intake / consentir | P | `intake_sessions`, `consent_events` | 409 si hay otra revisión |
| `analyze_meal` | P | `meal_logs` insert + `ai_jobs` | 503 si IA caída; el log permanece |
| `review_meal` | N | `meal_reviews` | no publica macros al paciente hasta confirmar |
| `edit_menu` / publicar plan | N | `meal_plan_versions` | 409 si la versión publicada cambió |
| ver receta | P | `recipe_assignments` + versión publicada | 404 si no está asignada |
| `send_message` | P o N | `messages` insert como `auth.uid()` | nunca `author_id` de otro |
| marcar leído | receptor | `message_receipts` | primera lectura inmutable |
| `edit_appointment` | N | `appointments` + evento | no borra el turno anterior |
| `reschedule_appointment` | P | día/hora del vigente | no cambia canal ni cancela |
| `log_activity` / `update_habits` | P | propias | sin calorías inferidas |
| `assign_resource` / `read_resource` | N / P | asignación; `first_read_at` | reabrir no reescribe |
| `generate_copilot` / job IA | N | `ai_jobs` | paciente no lee artefactos |
| exportar / borrar | P solicita, S ejecuta | `privacy_requests` | no borra pagos ni auditoría |

## Archivo, exportación y borrado

1. **Pedido.** El paciente abre `privacy_requests` (`export` / `delete` / `correction`). Identidad verificada. No se pide un nuevo formulario clínico para ejercer el derecho.
2. **Exportación.** Job asíncrono. Paquete con ficha visible, intake, consentimientos, planes publicados, comidas propias, mensajes del hilo, mediciones y metadatos de archivos. Sin `clinical_notes`, `adherence_why`, `ai_artifacts` ni URLs firmadas vivas. Enlace temporal autenticado.
3. **Retiro de archivos.** `withdrawn` corta lecturas nuevas. La purga física (original, derivados, thumbnails) entra en cola. Un backup previo puede sobrevivir al RPO.
4. **Borrado de cuenta.** Acceso lógico inmediato (`deactivated_at`). No se hace `delete cascade` de `payments` (`restrict`). Anonimización posterior (`anonymized_at`) conserva agregados financieros y auditoría opaca.
5. **Lo que no se borra por un click.** Pagos, webhooks, `audit_events`, consentimientos usados como evidencia, planes ya publicados que la profesional deba conservar. Eso se documenta en el export y en el aviso de privacidad.

## Nunca

- Aplicar 016 ni 016b con `supabase db push`.
- Meter `exercise_library` u `organizations` en el schema del primer piloto.
- Mandar fotos corporales o estudios a un proveedor de IA.
- Tratar un `read_at` de guía o un recibo de mensaje como prueba de adherencia.
