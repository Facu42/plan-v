import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('ai', () => ({ generateText: vi.fn(), Output: { object: vi.fn((input) => input) } }));
import { generateText } from 'ai';
import { demoMenuPlan, generateMenuDraft } from './menu-draft.js';
import { generateRecipeDraft } from './recipe-draft.js';
import { buildMenuJobContext, buildRecipeJobContext } from './context.js';
import { emptyIntakePayload } from '../intake/payload.js';

const intake = { ...emptyIntakePayload(), preferred_name: 'PRIVATE_NAME', allergies: { state: 'none' as const, items: [] }, restrictions: { state: 'none' as const, items: [] } };
const nutrition = { origin: 'declared', source: 'Inventada por proveedor', per_portion: { kcal: 500, protein_g: 20, carbs_g: 60, fat_g: 20 } };
const proposal = { title: 'Arroz con verduras', yield_portions: 2, steps: ['Cocinar y servir.'], ingredients: [{ name: 'Arroz', quantity: 100, unit: 'g' as const }], nutrition };
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
  it('descarta cifras sin referencias, conserva revisión y no envía permiso ni identidad', async () => {
    vi.mocked(generateText).mockResolvedValueOnce({ output: output() } as never);
    const result = await generateMenuDraft(context());
    expect(result.plan.items[0].recipe_proposal?.nutrition).toBeNull();
    expect(result.plan.items.map((item) => item.portions)).toEqual([1, 1]);
    expect(result.plan.nutrition?.days[0]).toMatchObject({ status: 'missing_nutrients', totals:null });
    expect(result.warnings.some(w=>w.includes('SARA 2'))).toBe(true);
    expect(String(vi.mocked(generateText).mock.calls[0][0].prompt)).not.toContain('PRIVATE_');
  });
  it('mantiene ajuste con versiones publicadas que tienen composición revisada',async()=>{
    const published={...proposal,id:'publicada-revisada',version:1,carbohydrates:'available' as const,nutrition:{...nutrition,origin:'declared' as const,source:'Composición revisada'}};
    vi.mocked(generateText).mockResolvedValueOnce({output:{items:output().items.map(item=>({...item,recipe_id:published.id,recipe_proposal:null}))}} as never);
    const result=await generateMenuDraft({...context(),catalog:[published]});
    expect(result.plan.items.map(item=>item.portions)).toEqual([2,2]);
    expect(result.nutrition.days[0]).toMatchObject({status:'adjusted',totals:{kcal:2000}});
    const prompt=JSON.parse(String(vi.mocked(generateText).mock.calls[0][0].prompt));
    expect(prompt.catalog[0]).not.toHaveProperty('carbohydrates');
    expect(prompt.catalog[0]).not.toHaveProperty('catalog_recipe');
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
    vi.mocked(generateText).mockResolvedValueOnce({ output: { title: proposal.title, yield_portions: 2, steps: proposal.steps, items: [{name:'Apio, hervido',quantity:100,unit:'g'}], nutrition } } as never);
    const result = await generateRecipeDraft(buildRecipeJobContext({ intake }));
    expect(result.recipe.nutrition?.origin).toBe('ai_estimate');
    expect(result.recipe.nutrient_source).toBe('estimacion_ia.v2');
    expect(result.recipe.items[0].catalog_ref?.revision).toBe(1);
    expect(result.recipe.nutrition?.per_portion.kcal).not.toBe(nutrition.per_portion.kcal);
  });
});

describe('asistente de planes: propuesta con referencias', () => {
  const assistant = { schema: 'plan_assistant.v1' as const, foods: [{ name: 'Achicoria, hervida', unit: 'g' as const, kcal: 12, protein_g: 1.6, carbs_g: 0.7, fat_g: 0.3 }], exchanges: [], models: [] };
  const withAssistant = () => ({ ...context(), assistant });

  it('manda las referencias al proveedor, avisa cuántos ingredientes coinciden y devuelve el uso real', async () => {
    const exact = { ...proposal, ingredients: [{ name: 'Achicoria, hervida', quantity: 100, unit: 'g' as const }, { name: 'Ingrediente inventado', quantity: 50, unit: 'g' as const }] };
    vi.mocked(generateText).mockResolvedValueOnce({
      output: { items: output().items.map((item) => ({ ...item, recipe_proposal: exact })) },
      usage: { inputTokens: 1200, outputTokens: 800 },
    } as never);
    const result = await generateMenuDraft(withAssistant());
    const call = vi.mocked(generateText).mock.calls[0][0];
    expect(String(call.prompt)).toContain('Achicoria, hervida');
    expect(String(call.system)).toContain('SARA 2');
    expect(result.usage).toEqual({ inputTokens: 1200, outputTokens: 800 });
    expect(result.warnings.some((w) => w.startsWith('2 de 4 ingredientes'))).toBe(true);
    expect(result.plan.items.every((item) => item.recipe_proposal?.nutrition === null)).toBe(true);
  });

  it('avisa cuando la propuesta nombra un alérgeno aunque el modelo lo haya colado', async () => {
    const risky = { ...proposal, title: 'Tostada con maní', ingredients: [{ name: 'Maní', quantity: 20, unit: 'g' as const }] };
    vi.mocked(generateText).mockResolvedValueOnce({ output: { items: output().items.map((item) => ({ ...item, recipe_proposal: risky })) } } as never);
    const ctx = withAssistant();
    const result = await generateMenuDraft({ ...ctx, allergies: { state: 'reported', items: ['maní'] } });
    expect(result.warnings.some((w) => w.includes('«maní»'))).toBe(true);
  });

  it('sin el asistente el prompt no cambia', async () => {
    vi.mocked(generateText).mockResolvedValueOnce({ output: output() } as never);
    await generateMenuDraft(context());
    expect(String(vi.mocked(generateText).mock.calls[0][0].system)).not.toContain('plan semanal completo');
  });
});

it('lleva las opciones del armado al prompt del proveedor sin cambiar el contrato de salida', async () => {
  vi.mocked(generateText).mockResolvedValueOnce({ output: output() } as never);
  const dietary = ['Formato: Lista por día', 'Medidas: Las dos', 'Incluir: Mi recetario; Lista de compras; Costo estimado'];
  await generateMenuDraft({ ...context(), preferences: { cooking_time_minutes: null, dietary } });
  const call = vi.mocked(generateText).mock.calls[0][0];
  expect(JSON.parse(String(call.prompt)).preferences.dietary).toEqual(dietary);
  expect(String(call.system)).toContain('No inventes precios');
});
