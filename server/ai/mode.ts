import { readRuntimeConfig } from '../config/runtime.js';
import { AIUnavailableError } from './errors.js';

export function resolveAiMode() {
  try {
    return readRuntimeConfig({
      APP_MODE: process.env.APP_MODE ?? 'test',
      AI_MODE: process.env.AI_MODE ?? 'disabled',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      SUPABASE_URL: process.env.SUPABASE_URL,
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV,
    }).aiMode;
  } catch {
    throw new AIUnavailableError();
  }
}

export function logProviderFailure(scope: string, error: unknown) {
  const name = error instanceof Error ? error.name : 'unknown';
  console.error(`[ai:${scope}] provider failed`, { name, code: 'AI_UNAVAILABLE' });
}
