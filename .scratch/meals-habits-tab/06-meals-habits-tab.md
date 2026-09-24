# Corte 06 — Tab "Comidas y hábitos" de la ficha CRM

Estado: **completado** (2026-09-05).

## Qué quedó implementado

1. **Helper puro** `src/components/crm/meal-history.ts` (`groupMealLogsForReview`): separa pendientes de revisadas, ordena por `logged_at` descendente sin mutar el input. Test en `meal-history.test.ts`.

2. **Componente** `src/components/crm/CrmMealsHabitsTab.tsx`:
   - Hábitos de hoy (sólo lectura, declarados por la paciente): hidratación con dots x/8 y energía.
   - Pendientes de revisión con badge de conteo y botón "Revisar" por comida → abre `MealReviewPanel` reutilizado.
   - Historial revisado con chip de estado (Confirmada/Ajustada), alimentos, macros y fecha formateada es-AR.
   - Estados vacíos explícitos en ambas listas.

3. **CrmDashboard**: tab "Comidas y hábitos" habilitada y conectada; queda sólo "Consultas" como próximo corte.

## Verificación en navegador real (demo memoria)

- La tab muestra hábitos (3/8 vasos, energía Baja), 2 pendientes (Almuerzo 62%, Cena 38%) e historial vacío.
- "Revisar" sobre Almuerzo → panel de revisión → "Confirmar sin cambios" → pendientes bajan a 1 y el historial muestra `Almuerzo Confirmada` con sus macros.

## No incluye

- Edición de hábitos desde el CRM (son check-ins de la paciente).
- Tab "Consultas" (turnos).
- Recalculo de adherencia con comidas revisadas.
