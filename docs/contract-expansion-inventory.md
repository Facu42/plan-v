# Contrato ampliado — inventario de entidades y matriz de permisos (v0, 2026-09-15)

> Ampliación solicitada el 2026-09-16: incorporar intake/consentimientos versionados, estudios, fotos corporales opcionales, recetas y planes versionados, AI jobs y publicación supervisada. Ver el [modelo propuesto](superpowers/specs/2026-09-16-plan-v-arquitectura-design.md). La matriz de abajo es el inventario histórico de demo; no describe todavía todos los permisos del piloto nuevo ni habilita migraciones.

Estado: **borrador documental para revisión, NO aprobado**. No contiene SQL ni
modifica `supabase/contracts/016_plan_v_contract_draft.sql`. Alimenta los pasos
2.1 y 2.2 del roadmap antes de tocar el borrador 016 o la matriz RLS.

## 1. Inventario de nuevas entidades y eventos (paso 2.1)

Clasificación: **demo** = implementada sólo en memoria; **derivada** = se calcula
de entidades existentes, no debe persistirse; **futura** = sin implementación.

| Entidad / evento | Estado demo | Campos actuales (memoria) | Qué exige antes de persistir |
| --- | --- | --- | --- |
| `resource_assignments` (guía ↔ paciente) | demo (corte 60) | `id`, `patient_id`, `resource_id`, `assigned_at`, `read_at` | Tabla con `unique(patient_id, resource_id)`, RLS nutri-insert/paciente-read-own, audit de asignación y de primer `read_at` inmutable |
| `resource_guides` (catálogo editorial) | estático en cliente (cortes 58–60) | seis IDs allowlist en Zod + catálogo TS | Tabla editorial con autoría profesional, estado de publicación y revisión clínica; el ID debe seguir siendo opaco, sin datos de paciente |
| `activity_logs` (actividad autodeclarada) | demo (corte 57) | `id`, `patient_id`, `activity`, `duration`, `intensity`, `note`, `logged_at` | Tabla con RLS paciente-insert-own/nutri-select, retención y prohibición de campos clínicos inferidos (sin calorías, series ni rutinas) |
| `plan_b` (alternativa personal) | campo existente en `patients` | texto libre por paciente | Ya cubierto por grants por columna de `patients`; confirmar que queda fuera de la vista paciente |
| Lista de compras | derivada (corte 50) | — | No persistir hasta existir `recipe_ingredients`; el check local sigue siendo preferencia de dispositivo |
| `recipes` / `recipe_ingredients` | futura | — | Modelo con porciones, unidades, instrucciones, fuente y revisión profesional; sin Health Score automático |
| `weight_measurements` / medidas corporales | futura (alcance aprobado) | — | Consentimiento explícito, retención, visibilidad paciente/nutri y exclusión de fotografías hasta decisión separada |
| Notificaciones | demo (corte 78) | campana in-app, preferencias de dispositivo, `Notification` del navegador, buzón `notices` en memoria | Proveedor, plantillas, RLS y prohibición de contenido clínico en push/mail reales; el buzón demo no sale a internet |
| `appointment_history` | demo (corte 78) | cambios de turno y fechas vencidas (`scheduled`/`rescheduled`/`patient_rescheduled`/`cancelled`/`elapsed`) | Tabla append-only; no es asistencia ni historia clínica |
| Eventos de lectura de guías | demo (`read_at`) | primera apertura | Append-only; la re-apertura no reescribe |
| Recibos de mensajes (`delivered_at`, `read_at`) | demo (corte 74) | entrega inmediata al enviar; leído al abrir el hilo | Ampliar `messages` + RLS; hoy `501` en Supabase. No son prueba clínica de adherencia |

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
| `meal_logs` | sí, revisa [`review_meal`] | confirma/ajusta | las propias (sin nota interna) | crea [`analyze_meal`] | Storage/IA |
| `meal_slots` (plan semanal) | sí | upsert/delete | plan publicado | — | — |
| `habit_logs` | sí | — | las propias | upsert propio [`update_habits`] | snapshot diario |
| `appointments` | sí | crea/reprograma/cancela [`edit_appointment`] | próxima + historial de cambios (sin notas clínicas) | reprograma día/hora del turno vigente [`reschedule_appointment`]; no cancela | — |
| Notificaciones (in-app, navegador, buzón demo) | sí, consultorio | — | propias | preferencias de dispositivo [`localStorage`]; buzón demo no envía mail real | proveedor/push/mail reales pendientes |
| `messages` | sí, hilo asignado | envía como autor; lectura demo reutiliza [`send_message`] | propias enviadas y recibos | envía; marca leído en demo | inmutable; `delivered_at`/`read_at` aún no están en 016 |
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
