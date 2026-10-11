import { createOpenAI } from '@ai-sdk/openai';
import { AIUnavailableError } from './errors.js';
import { isFreeOpenRouterModel } from './cost-policy.js';

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
export const DEFAULT_OPENROUTER_MODEL = 'openrouter/free';

export type AiProvider = 'openrouter';

export type AiProviderConfig = {
  provider: AiProvider;
  apiKey: string;
  model: string;
};

export function resolveAiProvider(
  env: Record<string, string | undefined> = process.env,
): AiProviderConfig | null {
  if (env.OPENROUTER_API_KEY) {
    const model = env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;
    if (!isFreeOpenRouterModel(model)) return null;
    return {
      provider: 'openrouter',
      apiKey: env.OPENROUTER_API_KEY,
      model,
    };
  }

  return null;
}

/** Apply the price ceiling at the HTTP boundary, including SDK retries. No paid add-ons. */
export function createFreeOpenRouterFetch(fetchImpl: typeof globalThis.fetch = globalThis.fetch): typeof globalThis.fetch {
  return async (input, init) => {
    const url = input instanceof Request ? input.url : String(input);
    if (url !== `${OPENROUTER_BASE_URL}/chat/completions` || init?.method !== 'POST' || typeof init.body !== 'string') {
      throw new AIUnavailableError();
    }
    const body = JSON.parse(init.body);
    if (!isFreeOpenRouterModel(body.model) || body.models || body.plugins || body.tools || body.web_search_options
      || body.preset || body.route || body.service_tier) {
      throw new AIUnavailableError();
    }
    return fetchImpl(input, {
      ...init,
      body: JSON.stringify({
        ...body,
        // Replace preferences rather than inheriting an external preset or price override.
        provider: { max_price: { prompt: 0, completion: 0, request: 0, image: 0 }, require_parameters: true },
      }),
      redirect: 'error',
    });
  };
}

/**
 * Returns a language model for live AI calls.
 * Only free OpenRouter models. Its Chat Completions path is OpenAI-compatible.
 */
export function getAiModel() {
  const config = resolveAiProvider();
  if (!config) throw new AIUnavailableError();

  const provider = createOpenAI({
    apiKey: config.apiKey,
    baseURL: OPENROUTER_BASE_URL,
    name: 'openrouter',
    fetch: createFreeOpenRouterFetch(),
  });
  return provider.chat(config.model);
}

/** @deprecated Prefer getAiModel — kept as an alias for call sites already migrated. */
export const createAiModel = getAiModel;
