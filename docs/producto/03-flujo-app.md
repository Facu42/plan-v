# 03 · Flujo de la app — Plan V

> Fuentes: `src/components/nutrigo/showroom-nav.ts`, `vercel.json`, `docs/recorridos-y-contratos-plan-v-2026-10-05.md` (referencia), decisiones D1–D7, plan v2 §1/§9/§12.
> ✅ existe hoy · 🟡 parcial · 🔜 sin publicar · 🔶 hecho por Codex, sin juntar · ❌ planeado.
> **Corregido el 14/10/2026 (Claude):** estados comprobados contra `main` (ae3dc30), los PR abiertos, las ramas de Codex y las migraciones aplicadas en Supabase. 🔶 = hecho por Codex en código, **sin juntar a main ni aplicar** (PR o rama indicada): no rehacer. Reparto de trabajo entre agentes: [`../coordinacion-agentes.md`](../coordinacion-agentes.md).

## 1. Rutas de entrada (`vercel.json`)
| Ruta | Qué es |
|---|---|
| `/` , `/app/*` | SPA: login/registro y app (paciente o panel según rol) |
| `/crm/*` | Panel de la nutricionista |
| `/admin` | Panel del servicio (solo `platform_admins`) |
| `/pacientes` | Landing pública para pacientes (HTML estático) |
| `/api/*` | API en Railway |

## 2. Navegación (existe hoy, `showroom-nav.ts`)
**Paciente — barra inferior móvil (`PATIENT_TABS`)**: Inicio · Plan · Diario · Mensajes · "Más".
**Paciente — todos los destinos (`PATIENT_SURFACES`)**: Inicio, Agenda, Mensajes, Menú (recetas), Plan (submenú Plan semanal + Compras), Compras, Diario, Progreso, Ejercicio, Recursos, Pagos.

**Nutri — barra móvil (`PRO_TABS`)**: Inicio · Pacientes · Seguimiento · Agenda.
**Nutri — menú lateral (`PRO_SURFACES`)**: Inicio, Pacientes, Planes, Seguimiento, Progreso global, Agenda, Mensajes, Alimentos, Biblioteca, Modelos, Cobranzas (+ Panel del servicio si es admin).
**Nutri — solo por link directo (`PRO_HIDDEN_PAGES`)**: ficha, diario, progreso, compras, ejercicio, consultas, objetivos, recetas, recursos, reciente, guardado, paneles, videollamadas.

**Planeado (plan v2 §1)**: menú de 17 ítems en 5 grupos — Consultorio (Inicio, Agenda, Pacientes), Seguimiento (Asistente IA ❌, Seguimiento, Mensajes, Progreso), Plan de alimentación (Planes, Alimentos, Recetas, Equivalencias ❌, Modelos, Ejercicio), Negocio (Cobranzas, Página pública ❌), Recursos y ayuda (Biblioteca, Centro de ayuda ❌). Configuración en el menú de perfil.

## 3. Fases de la paciente (`patient_stage`)
`ingreso` → `plan` → `seguimiento` → `alta`. Además: archivada (`archived_at`, no puede mandar mensajes), baja/anonimización (privacidad).

## 4. Recorrido de la nutricionista
1. **Registro** como nutri ("Soy nutricionista") → `provision_nutritionist` → prueba del servicio (`service_start_trial`).
2. **Alta de paciente**: Pacientes → "+" → `create_patient_with_invite` → copia el link de invitación (WhatsApp manual) ✅.
3. **Revisar ingreso**: ficha → ingreso enviado → `review_patient_intake` (puede `reopen_patient_intake`) ✅.
4. **Planificación**: datos corporales (`save_my_body_data` lo carga la paciente o `request_body_data`) → IMC/meta → **Confirmar meta** (`save_nutrition_target`) ✅.
5. **Armar plan**: editor semanal (manual, desde Modelos `apply_professional_model` → crea **borrador** conservando el anterior, o "pedir borrador a la IA" → `enqueue_ai_job` → worker → `apply_ai_job` / `reject_ai_job`) → **Publicar** (`publish_meal_plan` / `publish_reviewed_meal_plan`). Al publicar se encolan portadas de platos ✅. Fecha de vigencia (D7, `meal_plan_effective_date`) ✅ (#103).
6. **Seguimiento diario**: Seguimiento / ficha → comidas "pendiente de revisión" → **Confirmar** o **Ajustar** (`review_meal_log`) ✅; registros de cuidado (`review_care_record`).
7. **Turnos**: Consultas → `schedule_appointment` / `reschedule_appointment`; estado "en curso" ✅ 🟡.
8. **Mensajes**: `send_thread_message` / adjuntos ✅ 🟡 (sin tiempo real).
9. **Objetivo**: estado, avance y nota (`set_patient_goal`, D1) ✅ (#98).
10. **Cobros**: Cobranzas → cuota mensual (`set_patient_fee`), registrar pago (`record_patient_payment`), revisar "avisé que pagué" (`review_patient_payment`) ✅; nuevo cobro / programas (`add_patient_charge`, `save_billing_program`) ✅ (#92).
11. **Archivar** paciente (`set_patient_archived`) ✅.

## 5. Recorrido de la paciente
1. Abre el **link de invitación** → crea cuenta (mail o Google cuando esté prendido) → "Antes de seguir" (términos) → `accept_patient_invite` ✅.
2. **Ingreso** paso a paso (`save_patient_intake` → `submit_patient_intake`) + consentimientos (`record_patient_consent`, incluido permiso de IA y de medidas) ✅.
3. Espera el plan → **Inicio** muestra plan del día, meta, avisos, cuota (tarjeta amarilla si debe; no bloquea, D2) ✅.
4. **Plan**: menú semanal, receta al tocar cada comida; **Compras** generada del plan, tildar (`set_shopping_checked`), agregar a mano ✅/🟡.
5. **Diario**: registrar comida con foto o texto (`save_meal_log`); si dio permiso de IA, estimación de macros (`record_meal_analysis`) → queda "pendiente de revisión". Corregir/borrar mientras no esté revisada (D4) ✅ (#100); después, "pedir corrección" (`request_meal_correction`) ✅.
6. **Hábitos**: agua, sueño, pasos (`log_patient_activity`, `save_body_metrics`) 🟡.
7. **Agenda**: ve la consulta → **Confirmar** (`confirm_appointment`) o pedir cambio 🟡.
8. **Mensajes** con la nutri 🟡. **Campana**: no leídos, consulta por confirmar, cuota ✅; recurso asignado y plan nuevo ❌.
9. **Pagos**: ve cuota y "Avisé que pagué" (`report_patient_payment`) ✅.
10. **Privacidad**: pedir exportación o borrado (`request_privacy_action`) ✅.

## 6. Botones clave
| Botón | Dónde | Qué pasa |
|---|---|---|
| Invitar / "+" paciente | Panel › Pacientes | Crea `patients` + `patient_invites` (expira), audita evento |
| Confirmar meta | Ficha › Planificación | Pasa `nutrition_target_drafts` → `nutrition_targets` publicado; sincroniza el borrador del plan |
| Aplicar modelo | Editor de plan | Crea borrador nuevo; recomendaciones se agregan sin duplicados |
| Pedir borrador IA | Editor de plan | `ai_jobs` en cola → worker → artefacto para revisar; nunca publica solo |
| Publicar plan | Editor de plan | Versión inmutable `published`; la paciente la ve; encola portadas; handover con cambios ✅ (#103) |
| Confirmar / Ajustar comida | Seguimiento | `meal_reviews`; la comida deja de ser editable por la paciente |
| Registrar comida | App › Diario | `meal_logs` (+ `meal_analysis_runs` si hay permiso IA) |
| Confirmar consulta | App › Agenda | `appointment_events` |
| Avisé que pagué | App › Pagos | `patient_payments` pendiente de revisión |
| Archivar | Ficha | `archived_at`; bloquea mensajes de la paciente |

## 7. Decisiones abiertas para Facu
1. Cuando existan las 6 páginas nuevas, ¿el menú pasa al de 17 ítems de una vez o de a una?
2. ¿Diario, Consultas, Objetivos y Compras de un paciente quedan **solo dentro de la ficha** (como propone el plan v2)?
3. Invitación: hoy se copia el link a mano; ¿se manda también por mail desde Plan V?
4. Pedido de cambio de turno de la paciente: ¿lo resuelve la nutri a mano o se arma agenda con reserva (fase 4)?
5. ¿Qué pasa con la app de la paciente en `alta`: solo lectura, o sigue todo activo?
