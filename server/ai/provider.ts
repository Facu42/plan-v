import { createOpenAI } from '@ai-sdk/openai';
import { AIUnavailableError } from './errors.js';

export const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
export const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-4o-mini';
export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

export type AiProvider = 'openrouter' | 'openai';

export type AiProviderConfig = {
  provider: AiProvider;
  apiKey: string;
  model: string;
};

export function resolveAiProvider(
  env: Record<string, string | undefined> = process.env,
): AiProviderConfig | null {
  if (env.OPENROUTER_API_KEY) {
    return {
      provider: 'openrouter',
      apiKey: env.OPENROUTER_API_KEY,
      model: env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL,
    };
  }

  if (env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL,
    };
  }

  return null;
}

/**
 * Returns a language model for live AI calls.
 * Prefer OpenRouter when OPENROUTER_API_KEY is set; otherwise OpenAI.
 * OpenRouter uses the Chat Completions path (OpenAI-compatible); direct OpenAI
 * keeps the default Responses model factory used previously.
 */
export function getAiModel() {
  const config = resolveAiProvider();
  if (!config) throw new AIUnavailableError();

  if (config.provider === 'openrouter') {
    const provider = createOpenAI({
      apiKey: config.apiKey,
      baseURL: OPENROUTER_BASE_URL,
      name: 'openrouter',
    });
    // OpenRouter exposes Chat Completions, not the OpenAI Responses API.
    return provider.chat(config.model);
  }

  const provider = createOpenAI({ apiKey: config.apiKey });
  return provider(config.model);
}

/** @deprecated Prefer getAiModel — kept as an alias for call sites already migrated. */
export const createAiModel = getAiModel;
