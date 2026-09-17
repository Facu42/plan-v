# Corte 78 — Historial, reprogramación, recordatorios y avisos

**Fecha:** 2026-09-16

## Qué se hizo

- Historial de turnos: cambios publicados y fechas vencidas. No registra asistencia ni notas clínicas. No se inventan consultas pasadas.
- La paciente reprograma día y hora del turno vigente. Conserva duración y modalidad. No cancela.
- Eco en Consultas profesionales.
- Recordatorios de comidas y hábitos en la campana, derivados del plan de hoy, agua y descanso.
- Avisos al teléfono: Notification del navegador en este dispositivo, con permiso.
- Mail: buzón demo en memoria. No hay proveedor; no sale a internet.

## Verificación

- Suite: 73 archivos, 370 pruebas.
- `tsc` frontend y servidor.
- Navegador: agenda paciente (historial + reprogramar), campana con hábitos, buzón demo, consultas profesionales.

## Sigue abierto

- Timezone y conflictos.
- Push remoto y mail transaccional real (P0).
