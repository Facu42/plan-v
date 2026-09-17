# Corte 07 — Tab "Consultas" (turnos)

Estado: **completado** (2026-09-05).

> Nota: este corte fue implementado en paralelo por otro agente del workspace (misma convención de cortes). Este asentimiento reconcilió una colisión de contratos, agregó la prueba de integración, la card de la paciente y la verificación de punta a punta.

## Qué quedó implementado

1. **Contrato y autorización**
   - Acción `edit_appointment` en `server/security/contracts.ts` (sólo nutricionista asignada).
   - `appointmentUpdateSchema`: `{ appointment: { day (semana), time HH:MM validada (rechaza 25:30 y 2:30), duration 10–180, channel video|presencial } | null }` — `null` cancela el turno.

2. **API** — `PUT /api/patients/:id/appointment`
   - Memoria: `setAppointment` mapea day+time → `when` plano del tipo `Patient`, evento de timeline `Consulta · agendada` / `Consulta · cancelada`.
   - Supabase activo: autoriza y responde `501 Turnos persistentes pendientes del schema 016`.

3. **UI**
   - `CrmAppointmentsTab.tsx`: turno actual, Reagendar (form día/hora/duración/canal), Cancelar con confirmación ("Sí, cancelar" / "No, volver"), errores en `role="alert"`.
   - `CrmDashboard`: las 4 tabs de la ficha quedan funcionales.
   - `PatientApp`: nueva card "Tu próxima consulta" en la home de la paciente (cuando hay turno).

4. **Reconciliación de edición concurrente**
   - Se revirtió una variante incompatible introducida en esta sesión (`schedule_appointment` + payload plano `when`); el contrato vigente es el estructurado (`day`/`time`, acción `edit_appointment`).

## Verificación

- Tests: `server/appointment-flow.integration.test.ts` (agendar + timeline, cancelar con null, 4 payloads inválidos → 400). Suite completa: 9 archivos / 46 tests.
- Navegador real: CRM → Consultas → Reagendar → Viernes 16:00 · 30 min · Videollamada → Guardar; la home de la paciente muestra la card con el turno nuevo.
- Hallazgo de verificación: un payload con `channel: ''` (estado no alcanzable desde la UI real) devuelve correctamente `400 Datos inválidos` y la app muestra el error sin romperse.

## No incluye

- Lista de consultas pasadas / historial de turnos.
- Videollamada real ni recordatorios del sistema.
- Persistencia Supabase (schema 016).
