# Corte 08 — Adherencia determinista

Estado: **completado** (2026-09-05).

## Regla vigente (v1 operativa, tunable por Vero)

`server/adherence.ts` — `calculateAdherence(patient, today)` puro y determinista:

- **Ventana**: últimos 7 días corridos incluyendo hoy.
- **Planificadas**: slots del `weekPlan` del día de semana correspondiente; hoy usa `todayPlan` si existe (misma regla que "Mi plan").
- **Suman**: comidas `confirmed` y `adjusted`. **No suman**: `pending_review` (se explicitan en el texto).
- **Score** = `round(100 × (0.75 × revisadas/planificadas + 0.25 × hidratación/8))`; plan vacío cuenta como cubierto (sin división por cero).
- **Why** generado: `N de M comidas revisadas esta semana. Agua hoy X/8. K en revisión (no suman).`
- Alinea con el copiloto, cuyo prompt ya decía "No recalcules el score".

## Recálculo enganchado en (modo memoria)

- `addMealLog` (nueva pendiente: actualiza conteo de "no suman").
- `updateMealLog` (confirmar/ajustar).
- `PATCH /habits` (hidratación/energía).
- `upsertMenuSlot` (cambia lo planificado).

## Seeds coherentes

Se agregó historial revisado para que el valor calculado coincida con el mostrado: Sofía 62→**63**, Marina 72→**72**, Lucía 88→**89**. Marina ganó un Jueves en su weekPlan; Lucía weekPlan completo L–D.

## Verificación

- 6 tests unitarios del calculador (pendientes no suman, ventana, fuera-de-ventana ignorado, hidratación 25%, plan vacío, determinismo).
- `meal-flow.integration.test.ts` actualizado: la adherencia se compara contra la salida del calculador y **sube** al ajustar una comida.
- Navegador real: gauge 62 → confirmar pendiente → **68** con explicación "11 de 14 comidas revisadas esta semana. Agua hoy 3/8. 1 en revisión (no suman)."

## No incluye

- Historial de hidratación/energía (la regla usa sólo el día actual; documentado como limitación v1).
- Persistencia Supabase del score (schema 016).
