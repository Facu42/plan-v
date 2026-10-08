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

| # | Hallazgo | Dueño | Estado |
|---|---|---|---|
| 1 | **Asignar una receta «a un día» salta el control de alergias y restricciones.** `assign_recipe_day` y `server/recipes/day.ts` no validan; es el único camino que usa `RecipeCatalog.tsx:165`. El camino que sí valida (`assign_recipe`) no lo usa ninguna pantalla. Sin prueba. **Verificado.** | C/S | Pendiente |
| 2 | **El «día» del servidor no usa hora de Argentina.** `localDateId` (`supabase-repo.ts:55`), `adherence.ts:10`, `store.ts:235`, `diary/routes.ts:30`. Railway no define `TZ`. Entre 21:00 y 23:59 el agua, descanso y pasos se guardan en el día siguiente. **Verificado.** | P/S | Arreglado en la rama (`localDateId`, `menuWeekdayIndex`, `timelineAtLabel` y la hora del diario usan Argentina; prueba con el servidor en UTC). Falta lo equivalente en modo demo (`store.ts`, `adherence.ts`, `appointment-ops.ts`), que corre en la zona de la máquina local |
| 3 | **El turno desaparece al empezar** (`appointment_current` y `supabase-repo.ts:272` filtran `starts_at >= now()`): la paciente pierde el enlace de videollamada en plena consulta. **Verificado.** | P/S | Pendiente (migración) |
| 4 | **Adherencia siempre 0% en producción.** Solo se calcula en memoria/demo; en Supabase nadie escribe `patients.adherence_score`. Toda paciente aparece en «Necesitan atención». | S | Pendiente |
| 5 | **Retirar el permiso de medidas no oculta el peso ya cargado**: `care_records_read` no mira el consentimiento. **Verificado.** | S | Pendiente (migración) |
| 6 | **La nutricionista puede insertar y borrar fichas en `patients` directo en la base** (grant `insert, delete` + política `patients_nutri_all`). Borrar arrastra cuotas y pagos. No cruza consultorios; la app no lo usa. **Verificado.** | S | Pendiente (migración) |
| 7 | **Plan trabado por meta vieja**: si la profesional cambia la meta después de generar un menú con IA, guardar y publicar dan 409 con un mensaje engañoso (`plans/repository.ts:83-96`). | C | Pendiente |
| 8 | **Mensajes no leídos del panel: solo cuenta la paciente abierta** (`GET /api/patients` devuelve `messages: []`). No coincide con la bandeja. En demo se ve bien. | C | Pendiente |
| 9 | **Nada se actualiza en vivo** (mensajes, turnos, plan, recursos): solo al recargar o navegar. | P/C | Pendiente |
| 10 | **La paciente real no tiene avisos ni recordatorios de consulta** (ni campana ni franja de próxima consulta). | P | Pendiente |
| 11 | **Objetivo, estado y avance de la meta que fija la profesional**: en producción solo se guarda el texto, y ninguna pantalla de la paciente lo muestra. | C/P | Decisión de producto |
| 12 | **Paciente archivada que escribe**: la API responde 200 y nadie ve el mensaje hasta restaurarla. | S | Decisión de producto |
| 13 | Cuota: cambiar el día de vencimiento crea una cuota extra del mismo mes; el aviso de cuota no aparece en celular. | P/S | Pendiente |
| 14 | Turno: editar duración o enlace borra la confirmación de la paciente; el aviso dice «Consulta confirmada» aunque ella pidió cambio. | C/S | Pendiente |
| 15 | La profesional no puede pedir que se reabra la ficha; hidratación, sueño y energía de la ficha se guardan y no se muestran. | C | Pendiente |
| 16 | La paciente no puede editar ni borrar una comida ni una medida; sin permiso de IA no puede cargar ni una comida de texto. | P/S | Decisión de producto |
| 17 | Publicar un plan nuevo archiva el anterior entero, sin aviso (si publica solo dos semanas, ella pierde la semana en curso). El Plan abre siempre en la semana 1. | C/P | Decisión de producto |
| 18 | Receta asignada v2 queda oculta por la v1 del plan (`plan-recipe.ts:30`). | P | Pendiente |
| 19 | Pasos del día: la profesional no los ve. «Calorías quemadas» y avance de rutina del Inicio quedan en 0 en producción; `activity_logs` no se carga en modo real. | P/C | Pendiente |
| 20 | Hilo de mensajes limitado a 50 sin paginar; «Entregado» nunca se marca. | P/C | Pendiente |
| 21 | Artículos propios salen firmados «Equipo editorial Plan V»; no se pueden despublicar; la paciente no recibe aviso al asignarse uno. | C | Pendiente |
| 22 | Fotos de ingredientes: se generan (consumen cupo) y ninguna pantalla las muestra. Fotos de platos ausentes en planes publicados antes del disparador. | P | Desarrollo futuro (decidido) |
| 23 | Cobertura: ningún recorrido en navegador prueba lo que arriba falla (alergias, retiro de permisos, 21–24 h, no leídos con 2 pacientes, banner móvil, turno en curso). | S | Pendiente |

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
