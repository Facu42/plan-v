# Corte 28 — emisión de timeline en las rutas Supabase cableadas

Estado: **completado** (2026-09-07). Sin Supabase real ni credenciales; test de
integración con `supabase-client` y `supabase-repo` mockeados sobre la app real.

## Alcance (paridad con el store en memoria)

El store emite timeline en: menú, consultas, cobranza, alta de comida y revisión.
Las rutas de menú/consultas/cobranza siguen 501 — nada que cablear ahí. Las dos
rutas **ya cableadas** que mutan (análisis y revisión de comidas) no emitían
nada en modo Supabase. Hábitos y mensajes no emiten en memoria → nada que
espejar.

## Cambios (`server/index.ts`, sólo ramas `isSupabaseEnabled()`)

1. `POST /api/patients/:id/meals/analyze`: tras `sbAddMealLog`, emite
   `meal_logged` — `${slot} · foto en revisión` con hora local + confianza
   (idéntico al store).
2. `PATCH /api/patients/:id/meals/:mealId`: tras `sbUpdateMealLog`, emite
   `meal_logged` — `${slot} · confirmado|ajustado` con alimentos + kcal
   (idéntico al store).

## Tests

`server/timeline-emission.integration.test.ts` (nuevo, 4 tests): app real con
`verifyAuthToken`/`isSupabaseEnabled` mockeados y el repo espiado:

- análisis → evento `foto en revisión` (actor paciente);
- revisión → `confirmado` con `pollo · 520 kcal` (actor nutri);
- revisión ajustada → `ajustado`;
- hábitos → **no** emite (paridad).

Aprendizaje aplicado: `analyze_meal`/`update_habits` son acciones de paciente en
`NUTRITIONIST_ACTIONS`/`PATIENT_ACTIONS` — los actores del mock deben respetarlo
(el primer RED fue 403 por actor nutri en ruta de paciente).

## Verificación

- RED: 3 fallos por `sbAddTimelineEvent` jamás llamado.
- Verde: `npm test` → 26 archivos / **160 tests** ✓ · `npm run check` ✓
- Modo memoria intacto (los cambios viven en ramas Supabase; `meal-flow` y demás
  integraciones de memoria pasan).

## Gates

`npm test` ✓ · `npm run check` ✓ · `npm run build` (111 módulos, 523.46 kB) ✓ ·
`npm audit` 0 ✓ · signatures 90 / attestations 45 ✓ · `git diff --check` ✓

## Próximo corte sugerido

Con el adapter completo y la emisión cableada, el trabajo restante exige
**decisiones**: aprobación del 016 (y pruebas RLS reales en instancia
descartable), proveedor de email para invitaciones, operación de Mercado Pago y
runbooks de Storage/privacidad. En código sólo queda la optimización del bundle
(523 kB) como tarea independiente.
