# Corte 10 — Historial de hábitos y adherencia semanal real

Estado: **completado** (2026-09-05).

## Qué quedó implementado

1. **Modelo**: `HabitLog { id, patient_id, date (YYYY-MM-DD local), hydration 0–8, energy }` y `Patient.habit_logs[]` (tipos compartidos y locales del store). Los snapshots `hydration`/`energy` siguen representando "hoy".

2. **API**: `PATCH /habits` ahora hace `upsertHabitLog` — una sola entrada por día (merge de hidratación + energía), actualiza snapshot y recalcula adherencia.

3. **Adherencia v2** (`server/adherence.ts`): el componente de agua es el **promedio de los últimos 7 días** (días sin registro = 0), no sólo el día actual. Why: `Agua X.X/8 promedio.`

4. **Bug encontrado en verificación de navegador**: las fechas de hábitos se generaban con fecha **UTC** (`toISOString().slice(0,10)`) pero la ventana de adherencia usa fechas **locales** — en UTC-3 después de las 21:00 el registro de "hoy" caía fuera de la ventana (mostraba `Agua 2.6/8` en vez de `3.1/8`). Fix: `localDateId` en store (seed + upsert) y en tests; caso de regresión agregado (`dates` contiene el id local de hoy).

5. **CRM**: la card de hábitos muestra barras de los últimos 7 días (hoy destacada) y energías recientes, con `aria-label` descriptivo.

6. **Seeds**: 7 días de hábitos por paciente coherentes con sus scores (Sofía 63, Marina 72, Lucía 89).

## Verificación

- 8 tests del calculador v2 (promedio semanal, días sin registro = 0, plan vacío, determinismo) + integración (`habit-history.integration.test.ts`: upsert diario sin duplicar, merge hidratación+energía, preservación de histórico).
- Navegador real: paciente +1 vaso → snapshot 4/8 y barra de hoy al 50% → gauge **63** con `Agua 3.1/8 promedio`.

## No incluye

- Edición de hábitos de días anteriores.
- Recordatorios de agua/energía.
- Persistencia Supabase (schema 016).
