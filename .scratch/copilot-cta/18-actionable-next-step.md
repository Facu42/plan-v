# Corte 18 — CTA del copiloto con destino real

Estado: **completado** (2026-09-06).

## Alcance

1. **Ajustar menú** abre la pestaña `Plan` y enfoca el input del slot más relevante disponible.
2. **Turno** abre la pestaña `Consultas` directamente en modo edición.
3. El botón global **Mensaje** vuelve a `Resumen` y enfoca el borrador del copiloto.
4. Al cambiar manualmente de pestaña se limpian los focos forzados para no reabrir formularios que la profesional ya cerró.

## Implementación

- `next-step-target.ts` resuelve el destino determinista del CTA:
  - `ajuste_menu` → `{ day, slot }`;
  - `turno` → preparación de consulta.
- `crm-interactions.ts` fija la acción local del botón `Mensaje`.
- `CrmMenuEditor` acepta `initialDay` e `initialSlot`.
- `CrmAppointmentsTab` acepta `startEditing`.
- `CrmDashboard` conecta los botones existentes; no se agregaron cards ni se alteró el modelo clínico.

## Tests

- `next-step-target.test.ts`: destino de menú, fallback y turno.
- `crm-interactions.test.ts`: edición directa de consulta y foco del borrador.
- Baseline completo posterior: **23 archivos / 100 tests**.

## QA en Chrome

- Marina · `ajuste_menu`:
  - pestaña activa `Plan`;
  - editor semanal visible;
  - input enfocado en `Miércoles · Almuerzo`.
- Sofía · `Mensaje`:
  - pestaña activa `Resumen`;
  - `TEXTAREA` enfocado;
  - borrador existente visible.
- Sofía · `turno` (brief inyectado sólo en el servidor QA):
  - pestaña activa `Consultas`;
  - formulario abierto;
  - encabezado `Reagendar consulta`.

## No incluido

- `Marcar luego` no persiste un dismiss porque v0 todavía no define el contrato de descarte del brief.
- `Abrir videollamada` sigue sin URL real porque el modelo v0 todavía no incorpora `meet_url` en esta app.
- No hubo cambios en API, Supabase, migraciones ni pagos.
