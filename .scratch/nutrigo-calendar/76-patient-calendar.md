# Corte 76 — Calendario paciente mes/semana/día

**Fecha:** 2026-09-16  
**Alcance:** Agenda paciente con vistas mes/semana/día sobre eventos reales; eco en Agenda profesional de la paciente seleccionada.

## Qué se hizo

- Modelo `showroom-calendar.ts`: próxima consulta derivada, plan de la semana lunes–domingo actual, `meal_logs` y `activity_logs` con `logged_at` válido.
- No se inventan recordatorios, historial de consultas ni indicaciones de plan fuera de la semana vigente.
- `ShowroomPatientAgenda`: Mes / Semana / Día, filtros Todos / Consultas / Plan / Diario / Actividad, confirmación de asistencia y enlace HTTPS.
- `ShowroomAgenda`: conserva el calendario multipaciente de próximas consultas y agrega «Calendario de [paciente]» con las mismas fechas que ella ve.

## Verificación

- Suite: 68 archivos, 355 pruebas.
- `tsc` frontend y servidor.
- Navegador en `http://127.0.0.1:5180/`: paciente Más → Agenda (mes, semana, día, RSVP); nutricionista Agenda → consultas de Sofía/Marina/Lucía + eco «Calendario de Sofía R.».

## Sigue abierto

- Recordatorios, timezone y conflictos (4.2b).
- Recetas/detalle, plan fechado y grocery con unidades (siguientes cortes del orden recomendado).
