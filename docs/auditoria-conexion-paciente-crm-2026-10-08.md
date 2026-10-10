# Auditoría: conexión entre la app de la paciente y el panel de la nutricionista (2026-10-08)

Cuatro revisiones de solo lectura (código, migraciones y pruebas; no se ejecutó nada contra producción),
más tres comprobaciones propias de los hallazgos más graves. Lo marcado **verificado** se leyó en el código;
**sospechado** depende del entorno o de una decisión de producto.

Dueños: **P** = hilo de la app de la paciente (`/app`, datos que ella carga), **C** = hilo del panel de la
nutricionista (`/crm`, recetas, planes, modelos), **S** = compartido (servidor `server/` y base `supabase/`).

## Lo que está bien

- Cobranzas: toda escritura revalida la dueña; sin fugas entre consultorios ni pacientes.
- Mensajes y adjuntos de chat, fotos y estudios privados, ficha inicial, invitaciones, sesiones y revocación.
- Plan: lo publicado llega a la paciente, el borrador no, la versión nueva conserva la publicada.
- Receta: título y kcal congelados por versión dentro del plan.
- Recurso editorial: asignar, leer y guardar; aislamiento entre consultorios.
- Meta nutricional: solo llega la publicada.
- Favoritos, compras, fotos de platos (con las dos limitaciones de abajo).

## Hallazgos (de mayor a menor)

_Estados actualizados el 2026-10-10 contra `main` y producción (migraciones aplicadas hasta `20261009164146`). Las decisiones D1–D7 están en [decisiones-producto-2026-10-10.md](decisiones-producto-2026-10-10.md)._

| # | Hallazgo | Dueño | Estado |
|---|---|---|---|
| 1 | **Asignar una receta «a un día» salta el control de alergias y restricciones.** `assign_recipe_day` y `server/recipes/day.ts` no validan; es el único camino que usa `RecipeCatalog.tsx:165`. El camino que sí valida (`assign_recipe`) no lo usa ninguna pantalla. Sin prueba. **Verificado.** | C/S | **Resuelto** (2026-10-09): PR #79 y migración `20261008220000_recipe_day_health_check`, aplicada en producción por el hilo del panel. |
| 2 | **El «día» del servidor no usa hora de Argentina.** `localDateId` (`supabase-repo.ts:55`), `adherence.ts:10`, `store.ts:235`, `diary/routes.ts:30`. Railway no define `TZ`. Entre 21:00 y 23:59 el agua, descanso y pasos se guardan en el día siguiente. **Verificado.** | P/S | **Resuelto en el servidor**: los hábitos usan `argentinaToday` (hilo del panel) y `localDateId`, `menuWeekdayIndex`, `timelineAtLabel` y la hora del diario usan Argentina (PR #94, con prueba en UTC). Falta el modo demo (`store.ts`, `adherence.ts`, `appointment-ops.ts`). |
| 3 | **El turno desaparece al empezar** (`appointment_current` y `supabase-repo.ts:272` filtran `starts_at >= now()`): la paciente pierde el enlace de videollamada en plena consulta. **Verificado.** | P/S | **Resuelto** (2026-10-09): migración `20261008230000_appointment_in_progress`, aplicada en producción. |
| 4 | **Adherencia siempre 0% en producción.** Solo se calcula en memoria/demo; en Supabase nadie escribe `patients.adherence_score`. Toda paciente aparece en «Necesitan atención». | S | **Abierto**: figura en el backlog del panel («adherencia real»). Falta definir el cálculo y escribirlo en producción. |
| 5 | **Retirar el permiso de medidas no oculta el peso ya cargado**: `care_records_read` no mira el consentimiento. **Verificado.** | S | **Resuelto** (2026-10-09): migración `20261008223000_measurement_consent_reads`, aplicada en producción; el historial no se borra y se recupera al renovar el permiso. |
| 6 | **La nutricionista puede insertar y borrar fichas en `patients` directo en la base** (grant `insert, delete` + política `patients_nutri_all`). Borrar arrastra cuotas y pagos. No cruza consultorios; la app no lo usa. **Verificado.** | S | **Abierto**: ninguna migración quita `insert, delete` sobre `patients` a `authenticated` (la `20261009183000` cubre tablas y vistas nuevas). |
| 7 | **Plan trabado por meta vieja**: si la profesional cambia la meta después de generar un menú con IA, guardar y publicar dan 409 con un mensaje engañoso (`plans/repository.ts:83-96`). | C | **Resuelto en gran parte**: `20261008180000_sync_confirmed_plan_target` actualiza el objetivo del borrador al confirmar la meta. Falta revisar el caso de una propuesta de IA con la meta cambiada y el mensaje de error. |
| 8 | **Mensajes no leídos del panel: solo cuenta la paciente abierta** (`GET /api/patients` devuelve `messages: []`). No coincide con la bandeja. En demo se ve bien. | C | **Abierto**: el panel lo tiene en su orden 4 (mensajes y no leídos con más de un paciente). |
| 9 | **Nada se actualiza en vivo** (mensajes, turnos, plan, recursos): solo al recargar o navegar. | P/C | **Abierto**: sin actualización en vivo; el panel lo tiene en su orden 4. |
| 10 | **La paciente real no tiene avisos ni recordatorios de consulta** (ni campana ni franja de próxima consulta). | P | **Parcial**: campana real en la app (PR #88) con mensajes sin leer, consulta por confirmar y cuota. Faltan recurso asignado, plan nuevo y correo (D3). |
| 11 | **Objetivo, estado y avance de la meta que fija la profesional**: en producción solo se guarda el texto, y ninguna pantalla de la paciente lo muestra. | C/P | **Decidido (D1)**, falta implementar: guardar estado, avance e historial y mostrarlos a la paciente. |
| 12 | **Paciente archivada que escribe**: la API responde 200 y nadie ve el mensaje hasta restaurarla. | S | **Decidido (D6)**, falta implementar. |
| 13 | Cuota: cambiar el día de vencimiento crea una cuota extra del mismo mes; el aviso de cuota no aparece en celular. | P/S | **Abierto**: cuota extra al cambiar el vencimiento y banner de cuota en celular. |
| 14 | Turno: editar duración o enlace borra la confirmación de la paciente; el aviso dice «Consulta confirmada» aunque ella pidió cambio. | C/S | **Abierto**: el panel lo tiene en su orden 4 (la edición conserva la confirmación cuando corresponda). |
| 15 | La profesional no puede pedir que se reabra la ficha; hidratación, sueño y energía de la ficha se guardan y no se muestran. | C | **Abierto**: en el backlog del panel (reapertura solicitada por la profesional y campos de ingreso no visibles). |
| 16 | La paciente no puede editar ni borrar una comida ni una medida; sin permiso de IA no puede cargar ni una comida de texto. | P/S | **Decidido (D4 y D5)**, falta implementar. |
| 17 | Publicar un plan nuevo archiva el anterior entero, sin aviso (si publica solo dos semanas, ella pierde la semana en curso). El Plan abre siempre en la semana 1. | C/P | **Decidido (D7)**, falta implementar. |
| 18 | Receta asignada v2 queda oculta por la v1 del plan (`plan-recipe.ts:30`). | P | **Abierto**. |
| 19 | Pasos del día: la profesional no los ve. «Calorías quemadas» y avance de rutina del Inicio quedan en 0 en producción; `activity_logs` no se carga en modo real. | P/C | **Parcial**: el registro semanal distingue agua desconocida de cero (hilo del panel) y el Inicio muestra actividades propias (PR #88). Siguen abiertos pasos en el panel, calorías quemadas, avance de rutina y la carga de `activity_logs` en modo real. |
| 20 | Hilo de mensajes limitado a 50 sin paginar; «Entregado» nunca se marca. | P/C | **Abierto**: el panel lo lista como «paginación» en comunicación. |
| 21 | Artículos propios salen firmados «Equipo editorial Plan V»; no se pueden despublicar; la paciente no recibe aviso al asignarse uno. | C | **Abierto**: en el hilo del panel. |
| 22 | Fotos de ingredientes: se generan (consumen cupo) y ninguna pantalla las muestra. Fotos de platos ausentes en planes publicados antes del disparador. | P | **Decidido**: desarrollo futuro. |
| 23 | Cobertura: ningún recorrido en navegador prueba lo que arriba falla (alergias, retiro de permisos, 21–24 h, no leídos con 2 pacientes, banner móvil, turno en curso). | S | **Parcial**: el hilo del panel amplió los recorridos firmados (alergias, medidas, consulta en curso, registro semanal). Faltan banner móvil, no leídos con 2 pacientes y avisos. |

## Sospechado (sin confirmar)

- Cobro no activo: la paciente ve el plan completo (contradice `docs/cobros-y-panel.md`).
- Las funciones de hilos y turnos no revisan `deactivated_at`/`anonymized_at` (la API sí).
- `/api/assets/:id/access` firma sin mirar el consentimiento vigente.
- `TRUST_PROXY` no definido en Railway: todas las usuarias compartirían el límite de pedidos por IP.
- `/api/me/professional` no revisa correo confirmado.
- Plan tras traspaso de paciente: las recetas del consultorio anterior impiden editar.

## Cobertura de pruebas hoy

Cubre: alta e invitación, ficha, permiso de IA, mensaje y adjunto, medidas, fotos y estudios, plan publicado, receta
congelada, turno creado y confirmado, cuota y pago, archivar y restaurar. No cubre lo de la fila 23.
