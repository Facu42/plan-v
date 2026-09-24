# Corte 05 — CRUD del menú semanal desde el CRM

Estado: **completado** (2026-09-05).

## Qué quedó implementado

1. **Contrato y autorización**
   - Acción `edit_menu` en `server/security/contracts.ts`: sólo rol nutricionista asignado (nunca la paciente).
   - Schema `menuSlotUpdateSchema` + `WEEK_DAYS` en `server/schemas.ts` (día válido, slot válido, título trim 1–200).

2. **API** — `PATCH /api/patients/:id/menu`
   - Memoria: upsert del slot en `weekPlan` con orden canónico (Lun→Dom, Desayuno→Extra) + evento de timeline `Menú · <día> <slot>` (`kind: 'menu'` nuevo en tipos compartidos y locales del store).
   - Supabase activo: autoriza con `edit_menu` y responde `501 Menú persistente pendiente del schema 016` (sin escritura silenciosa).

3. **UI**
   - `src/components/crm/CrmMenuEditor.tsx`: editor semanal por día/slot con guardado por fila, feedback "Listo", error en `role="alert"`, días vacíos como "Sin comidas cargadas".
   - `CrmDashboard.tsx`: tabs de ficha funcionales — Resumen (grilla actual) y Plan (editor); "Comidas y hábitos" y "Consultas" quedan deshabilitadas con `title="Próximo corte"`.
   - `src/api/client.ts`: `updateMenuSlot`. Estilos en `plan-v.css`.

## Verificación

- Tests: schema (6 casos), contratos (`edit_menu` nutri-only) e integración (`server/menu-flow.integration.test.ts`: update, creación de día faltante con orden canónico, 400 por payloads inválidos).
- Navegador real (demo memoria): Vero editó `Lunes · Almuerzo` → `Bowl de lentejas y arroz` → Guardar; API confirma cambio + timeline; la paciente en **Mi plan → Lun 31** ve el nuevo título.

## No incluye

- Agregar/eliminar slots o días desde la UI (la API ya hace upsert).
- Persistencia Supabase del menú (bloqueada hasta schema 016).
- Tabs "Comidas y hábitos" y "Consultas".
