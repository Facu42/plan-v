import { createOpenAI } from '@ai-sdk/openai';

export const OPENROUTER_TEXT_MODEL = 'openai/gpt-4o-mini';
export const OPENROUTER_IMAGE_MODEL = 'inclusionai/ming-image-0.1-design';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export function openRouterChatModel() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OpenRouter API key is not configured');
  return createOpenAI({
    name: 'openrouter',
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    headers: { 'X-Title': 'Plan V' },
  }).chat(OPENROUTER_TEXT_MODEL);
}
