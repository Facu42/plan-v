# Corte 09 — Agregar/quitar slots en el editor de menú

Estado: **completado** (2026-09-05).

## Qué quedó implementado

1. **API**
   - `DELETE /api/patients/:id/menu/:day/:slot` — valida params con `menuSlotParamsSchema` (400), 404 si el slot no existe, autorización `edit_menu` y `501` en modo Supabase (misma convención que PATCH).
   - `store.removeMenuSlot`: quita el slot, timeline `Menú · quitado <día> <slot>` con el título removido, recalcula adherencia (cambia lo planificado).
   - Agregar usa el `PATCH /menu` existente (upsert con orden canónico).

2. **UI (`CrmMenuEditor`)**
   - Botón "×" por comida con confirmación inline ("Sí" / "×"), patrón consistente con Consultas.
   - "+ Agregar comida" por día: form con select de slots **disponibles** (`menu-editor-utils.availableSlotsForDay`, testeado) + título + Agregar/Cancelar.
   - Errores en `role="alert"`.

## Verificación

- Tests: 3 de integración nuevos (add a día existente con orden y recálculo; DELETE con timeline; 404/400) + 3 del helper. Suite: 11 archivos / 58 tests.
- Navegador real: Lunes + "Desayuno · Avena con yogur y fruta" → la paciente lo ve en **Mi plan → Lun 31** como paso 1 (08:00) → quitar con confirmación → Lunes vuelve a Almuerzo/Cena.

## No incluye

- Quitar un día completo (los días vacíos simplemente muestran "Sin comidas cargadas").
- Edición de `todayPlan` (el editor trabaja sobre la plantilla semanal).
