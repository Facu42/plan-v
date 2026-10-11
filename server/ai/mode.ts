import { readRuntimeConfig } from '../config/runtime.js';
import { AIUnavailableError } from './errors.js';

export function resolveAiMode() {
  try {
    return readRuntimeConfig({ ...process.env, APP_MODE: process.env.APP_MODE ?? 'test' }).aiMode;
  } catch {
    throw new AIUnavailableError();
  }
}

export function logProviderFailure(scope: string, error: unknown) {
  const name = error instanceof Error ? error.name : 'unknown';
  console.error(`[ai:${scope}] provider failed`, { name, code: 'AI_UNAVAILABLE',
    ...(error instanceof AIUnavailableError && error.reason ? { reason: error.reason } : {}) });
}
