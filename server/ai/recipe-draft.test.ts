import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('ai', async (importOriginal) => ({ ...(await importOriginal<typeof import('ai')>()), generateText: vi.fn() }));
vi.mock('./provider.js', () => ({ getAiModel: () => 'modelo' }));
vi.mock('./mode.js', () => ({ resolveAiMode: () => 'live', logProviderFailure: vi.fn() }));

import { generateText } from 'ai';
import { generateRecipeDraft } from './recipe-draft.js';
import type { RecipeJobContext } from './context.js';

const context = { schema: 'v', allergies: { state: 'none', items: [] }, restrictions: { state: 'none', items: [] }, cooking_time_minutes: 30, title_hint: 'Ensalada' } as unknown as RecipeJobContext;
const recipe = (itemCount: number, stepCount = 3) => ({ output: {
  title: 'Ensalada de lentejas', yield_portions: 2, nutrition: null,
  steps: Array.from({ length: stepCount }, (_, i) => `Paso ${i + 1}`),
  items: Array.from({ length: itemCount }, (_, i) => ({ name: `ingrediente ${i + 1}`, quantity: 100, unit: 'g' })),
} });

describe('generateRecipeDraft', () => {
  beforeEach(() => vi.mocked(generateText).mockReset());

  it('reintenta una vez cuando el modelo devuelve un solo ingrediente', async () => {
    vi.mocked(generateText).mockResolvedValueOnce(recipe(1) as never).mockResolvedValueOnce(recipe(4) as never);
    const result = await generateRecipeDraft(context);
    expect(generateText).toHaveBeenCalledTimes(2);
    expect(result.recipe.items).toHaveLength(4);
  });

  it('no reintenta si la receta ya viene completa', async () => {
    vi.mocked(generateText).mockResolvedValueOnce(recipe(4) as never);
    await generateRecipeDraft(context);
    expect(generateText).toHaveBeenCalledTimes(1);
  });

  it('entrega el borrador corto si el segundo intento tampoco alcanza', async () => {
    vi.mocked(generateText).mockResolvedValue(recipe(1) as never);
    const result = await generateRecipeDraft(context);
    expect(generateText).toHaveBeenCalledTimes(2);
    expect(result.recipe.items).toHaveLength(1);
  });
});
