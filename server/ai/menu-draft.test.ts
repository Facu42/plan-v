import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('ai', () => ({ generateText: vi.fn(), Output: { object: vi.fn((input) => input) } }));
import { generateText } from 'ai';
import { demoMenuPlan, generateMenuDraft } from './menu-draft.js';
import { generateRecipeDraft } from './recipe-draft.js';
import { buildMenuJobContext, buildRecipeJobContext } from './context.js';
import { emptyIntakePayload } from '../intake/payload.js';

const intake = { ...emptyIntakePayload(), preferred_name: 'PRIVATE_NAME', allergies: { state: 'none' as const, items: [] }, restrictions: { state: 'none' as const, items: [] } };
const nutrition = { origin: 'declared', source: 'Inventada por proveedor', per_portion: { kcal: 500, protein_g: 20, carbs_g: 60, fat_g: 20 } };
const proposal = { title: 'Arroz con verduras', yield_portions: 2, steps: ['Cocinar y servir.'], ingredients: [{ name: 'Arroz', quantity: 100, unit: 'g' }], nutrition };
const context = () => ({ ...buildMenuJobContext({ intake, periodStart: '2026-10-03', periodEnd: '2026-10-03', slots: ['Almuerzo', 'Cena'], confirmedTarget: { kcal: 2000, protein_g: 100, carbs_g: 250, fat_g: 65, revision: '2026-10-03T12:00:00.000Z', published_at: '2026-10-03T12:00:00.000Z' } }), validity: { intake_revision: 1, consent_event_id: 'PRIVATE_CONSENT_ID' } });
const output = () => ({ items: ['Almuerzo', 'Cena'].map((slot) => ({ for_date: '2026-10-03', slot, recipe_id: null, recipe_proposal: proposal, portions: 1, public_note: '' })) });

beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('APP_MODE', 'test'); vi.stubEnv('AI_MODE', 'live'); vi.stubEnv('OPENROUTER_API_KEY', 'synthetic-only'); });
afterEach(() => vi.unstubAllEnvs());

describe('contrato del proveedor para propuestas estimadas', () => {
  it('la simulación cubre todas las fechas y momentos sin fingir una recomendación revisada', () => {
    const plan = demoMenuPlan({ ...context(), period_start: '2026-10-05', period_end: '2026-10-11', slots: [] });
    expect(plan.items).toHaveLength(28);
    expect(new Set(plan.items.map(item => item.for_date))).toHaveLength(7);
    expect(new Set(plan.items.map(item => `${item.for_date}|${item.slot}`))).toHaveLength(28);
    expect(plan.items.every(item => item.free_text?.includes('completar antes de publicar'))).toBe(true);
    expect(plan.items.every(item => !item.recipe_proposal)).toBe(true);
  });
  it('fuerza procedencia de IA, calcula porciones en servidor y no envía marcadores de permiso ni identidad', async () => {
    vi.mocked(generateText).mockResolvedValueOnce({ output: output() } as never);
    const result = await generateMenuDraft(context());
    expect(result.plan.items[0].recipe_proposal?.nutrition).toMatchObject({ origin: 'ai_estimate', source: 'estimacion_ia.v2' });
    expect(result.plan.items.map((item) => item.portions)).toEqual([2, 2]);
    expect(result.plan.nutrition?.days[0]).toMatchObject({ status: 'adjusted', estimated: true, totals: { kcal: 2000 } });
    expect(String(vi.mocked(generateText).mock.calls[0][0].prompt)).not.toContain('PRIVATE_');
  });
  it('rechaza una receta inexistente y una cobertura incompleta en lugar de inventar datos', async () => {
    vi.mocked(generateText).mockResolvedValueOnce({ output: { items: [{ ...output().items[0], recipe_id: 'inventado', recipe_proposal: null }, output().items[1]] } } as never);
    await expect(generateMenuDraft(context())).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
    vi.mocked(generateText).mockResolvedValueOnce({ output: { items: [output().items[0]] } } as never);
    await expect(generateMenuDraft(context())).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
  });
  it('no simula ajuste cuando el proveedor devuelve una receta sin nutrientes', async () => {
    vi.mocked(generateText).mockResolvedValueOnce({ output: { items: output().items.map((item) => ({ ...item, recipe_proposal: { ...proposal, nutrition: null } })) } } as never);
    const result = await generateMenuDraft(context());
    expect(result.plan.items[0].portions).toBe(1);
    expect(result.plan.nutrition?.days[0]).toMatchObject({ status: 'missing_nutrients', totals: null });
  });
  it('un fallo de proveedor nunca usa demostraciones o un segundo modelo pago', async () => {
    vi.mocked(generateText).mockRejectedValueOnce(new Error('synthetic quota exhausted'));
    await expect(generateMenuDraft(context())).rejects.toMatchObject({ code: 'AI_UNAVAILABLE' });
    expect(generateText).toHaveBeenCalledTimes(1);
  });
  it('la receta individual también marca nutrientes por porción como estimación', async () => {
    vi.mocked(generateText).mockResolvedValueOnce({ output: { title: proposal.title, yield_portions: 2, steps: proposal.steps, items: proposal.ingredients, nutrition } } as never);
    const result = await generateRecipeDraft(buildRecipeJobContext({ intake }));
    expect(result.recipe.nutrition?.origin).toBe('ai_estimate');
    expect(result.recipe.nutrient_source).toBe('estimacion_ia.v2');
  });
});
