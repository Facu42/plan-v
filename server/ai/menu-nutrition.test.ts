import { describe, expect, it } from 'vitest';
import { adjustMenuPortions, summarizeMenuNutrition } from './menu-nutrition.js';
import { buildMenuJobContext, hashAiContext } from './context.js';
import { emptyIntakePayload } from '../intake/payload.js';
import type { MealPlanDraftInput } from '../../src/types/plans.js';
import type { ProposedRecipe } from '../../src/types/ai-nutrition.js';

const nutrition = { origin: 'ai_estimate' as const, source: 'estimacion_ia.v2', per_portion: { kcal: 500, protein_g: 20, carbs_g: 60, fat_g: 20 } };
const proposal: ProposedRecipe = { title: 'Arroz con verduras', yield_portions: 2, steps: ['Cocinar y servir.'], ingredients: [{ name: 'Arroz', quantity: 100, unit: 'g' }], nutrition };
const target = { kcal: 2000, protein_g: 100, carbs_g: 250, fat_g: 65, revision: '2026-10-03T12:00:00.000Z', published_at: '2026-10-03T12:00:00.000Z' };
const plan: MealPlanDraftInput = { id: '30000000-0000-4000-a000-000000000001', period_start: '2026-10-03', period_end: '2026-10-03', timezone: 'America/Argentina/Buenos_Aires', items: [
  { for_date: '2026-10-03', slot: 'Almuerzo', free_text: proposal.title, portions: 1, public_note: '', recipe_proposal: proposal },
  { for_date: '2026-10-03', slot: 'Cena', free_text: proposal.title, portions: 1, public_note: '', recipe_proposal: proposal },
] };

describe('totales y ajuste calórico de menús revisables', () => {
  it('ajusta proporcionalmente las porciones y conserva ingredientes, fuente y diferencias de macros', () => {
    const result = adjustMenuPortions(plan, target);
    expect(result.plan.items.map((item) => item.portions)).toEqual([2, 2]);
    expect(result.nutrition.days[0]).toMatchObject({ status: 'adjusted', estimated: true, totals: { kcal: 2000, protein_g: 80 }, difference: { kcal: 0, protein_g: -20 } });
    expect(result.plan.items[0].recipe_proposal).toEqual(proposal);
    expect(plan.items[0].portions).toBe(1);
  });
  it('no simula ajuste con ingredientes sin nutrientes o días vacíos', () => {
    const incomplete = { ...plan, period_end: '2026-10-04', items: [{ ...plan.items[0], recipe_proposal: { ...proposal, nutrition: null } }] };
    const result = adjustMenuPortions(incomplete, target);
    expect(result.plan.items[0].portions).toBe(1);
    expect(result.nutrition.days.map((day) => day.status)).toEqual(['missing_nutrients', 'missing_nutrients']);
    expect(result.nutrition.days[0].totals).toBeNull();
  });
  it('deja las porciones si falta meta o si el multiplicador supera 50', () => {
    expect(adjustMenuPortions(plan, null).nutrition.days[0].status).toBe('no_target');
    const tiny = { ...plan, items: [{ ...plan.items[0], recipe_proposal: { ...proposal, nutrition: { ...nutrition, per_portion: { ...nutrition.per_portion, kcal: 1 } } } }] };
    const result = adjustMenuPortions(tiny, target);
    expect(result.plan.items[0].portions).toBe(1);
    expect(result.nutrition.days[0].status).toBe('portion_limit');
  });
  it('usa los valores de la versión publicada del catálogo y no inventa valores faltantes', () => {
    const item = { for_date: '2026-10-03', recipe_id: 'recipe-1', recipe_version: 2, portions: 2 };
    expect(summarizeMenuNutrition([item], target, [{ id: 'recipe-1', version: 2, nutrition }]).days[0].totals?.kcal).toBe(1000);
    expect(summarizeMenuNutrition([item], target, [{ id: 'recipe-1', version: 1, nutrition }]).days[0].status).toBe('missing_nutrients');
  });
  it('cambios en meta, catálogo o preferencias invalidan el hash sin enviar identidad ni datos corporales', () => {
    const intake = { ...emptyIntakePayload(), preferred_name: 'PRIVATE_NAME', conditions_note: 'PRIVATE_NOTE', cooking_time_minutes: 20, allergies: { state: 'none' as const, items: [] }, restrictions: { state: 'none' as const, items: [] } };
    const catalog = [{ ...proposal, id: 'recipe-1', version: 1 }];
    const context = buildMenuJobContext({ intake, catalog, confirmedTarget: target });
    const original = hashAiContext(context);
    expect(hashAiContext(buildMenuJobContext({ intake, catalog, confirmedTarget: { ...target, kcal: 2100 } }))).not.toBe(original);
    expect(hashAiContext(buildMenuJobContext({ intake, catalog: [{ ...catalog[0], version: 2 }], confirmedTarget: target }))).not.toBe(original);
    expect(hashAiContext(buildMenuJobContext({ intake: { ...intake, cooking_time_minutes: 30 }, catalog, confirmedTarget: target }))).not.toBe(original);
    expect(JSON.stringify(context)).not.toContain('PRIVATE_');
    expect(JSON.stringify(context)).not.toMatch(/weight_kg|sex|height_cm|birth_date/);
  });
});
