# Corte 04 — Foto/texto → pending_review → revisión profesional

Estado: **completado** (2026-09-05).

## Qué quedó implementado

1. **Arnés de integración de API**
   - `server/index.ts` exporta `app` (Hono) y sólo hace `serve()` cuando es el módulo principal (`isMainModule` con `pathToFileURL`).
   - `server/store.ts` expone `resetStore()` para aislar pruebas.

2. **Prueba de integración del flujo** (`server/meal-flow.integration.test.ts`)
   - Comida nueva nace `pending_review`, no altera `adherence_score` y encabeza el timeline como "foto en revisión".
   - `PATCH` con `adjusted` persiste alimentos y macros editados y actualiza timeline/pendientes.
   - `pending_review` nunca se acepta como resultado de revisión (400).

3. **Validación endurecida** (`server/schemas.ts`)
   - `foodItemSchema`: nombre trim 1–120, porción 0–10000, confianza 0–1.
   - `macrosSchema`: enteros con límites (kcal ≤ 10000, macros ≤ 1000).
   - `mealReviewInputSchema`: `adjusted` exige `foods` o `macros`; `foods` no puede ser vacío.

4. **Editor real en el panel profesional**
   - `src/components/crm/meal-review-draft.ts`: borrador aislado + `buildAdjustedMealPatch` (trim y validación antes del request). Tests en `meal-review-draft.test.ts`.
   - `src/components/crm/MealReviewPanel.tsx` (nuevo): "Confirmar sin cambios" y "Ajustar" abre editor de alimentos (nombre/porción/unidad) y macros; "Guardar ajuste" envía PATCH validado; error visible en `role="alert"`.
   - `CrmDashboard.tsx` consume el nuevo componente; CSS del editor en `plan-v.css` (responsive ≤600px).

## Verificación en navegador real (Chrome + CDP, demo en memoria)

- Paciente registró "ensalada de quinoa con atún y tomate" (texto) → API confirma `pending_review`.
- CRM: banner "3 comidas pendientes" → "Revisar ahora" → panel con nota IA privada → "Ajustar" → nombre `atún en aceite`, kcal `420` → "Guardar ajuste".
- Resultado: banner baja a 2 pendientes; timeline `Almuerzo · ajustado — atún en aceite… · 420 kcal`; API confirma `status: adjusted`.
- Vista paciente ("Mi camino"): la nota IA no se renderiza.
- Persistencia tras `location.reload()` (store memoria del proceso API).

## No incluye (siguientes cortes)

- Persistencia real Supabase (bloqueada hasta migración 016 + RLS).
- Storage de fotos; la foto sigue como preview local.
- Recalculo de adherencia con comidas revisadas.
