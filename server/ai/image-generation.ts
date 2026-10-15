import type { RecipeProposal } from '../../src/types/ai-jobs.js';
import { AIUnavailableError } from './errors.js';
import { OPENROUTER_IMAGE_MODEL } from './openrouter.js';

const IMAGE_TIMEOUT_MS = 60_000;
const MAX_IMAGE_BASE64_CHARS = 16_000_000;
const ALLOWED_MEDIA_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

type OpenRouterImageResponse = {
  data?: Array<{ b64_json?: unknown; media_type?: unknown }>;
};

export async function generateRecipeImage(recipe: Pick<RecipeProposal, 'title' | 'ingredients'>): Promise<{ image: string; model: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new AIUnavailableError();
  const prompt = [
    'Generá una fotografía culinaria realista y apetitosa para ilustrar esta receta.',
    `Plato: ${recipe.title}.`,
    `Ingredientes visibles: ${recipe.ingredients.slice(0, 12).join(', ')}.`,
    'Composición editorial limpia, luz natural suave, porción servida en vajilla sencilla.',
    'No agregues texto, etiquetas, logos, valores nutricionales ni ingredientes que contradigan la lista.',
  ].join('\n');

  try {
    const response = await fetch('https://openrouter.ai/api/v1/images', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-Title': 'Plan V',
      },
      body: JSON.stringify({ model: OPENROUTER_IMAGE_MODEL, prompt, output_format: 'webp' }),
      signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`OpenRouter returned ${response.status}`);
    const payload = await response.json() as OpenRouterImageResponse;
    const first = payload.data?.[0];
    if (typeof first?.b64_json !== 'string' || first.b64_json.length === 0 || first.b64_json.length > MAX_IMAGE_BASE64_CHARS || !/^[A-Za-z0-9+/]+={0,2}$/.test(first.b64_json)) {
      throw new Error('OpenRouter returned an invalid image payload');
    }
    const mediaType = typeof first.media_type === 'string' && ALLOWED_MEDIA_TYPES.has(first.media_type) ? first.media_type : 'image/webp';
    return { image: `data:${mediaType};base64,${first.b64_json}`, model: OPENROUTER_IMAGE_MODEL };
  } catch (error) {
    const name = error instanceof Error ? error.name : 'unknown';
    console.error('[ai:recipe-image] provider failed', { name, code: 'AI_UNAVAILABLE' });
    throw new AIUnavailableError();
  }
}
