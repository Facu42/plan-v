/** Paid providers require an explicit server-side opt-in; missing/unknown values stay free. */
export function freeAiOnly(env: Record<string, string | undefined> = process.env): boolean {
  return env.AI_COST_MODE !== 'paid';
}

export function isFreeOpenRouterModel(model: unknown): model is string {
  return typeof model === 'string' && (model === 'openrouter/free'
    || /^[a-z0-9._-]+\/[a-z0-9._-]+:free$/.test(model));
}
