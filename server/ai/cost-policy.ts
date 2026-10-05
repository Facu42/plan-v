/** The product only admits free providers, including legacy paid configuration. */
export function freeAiOnly(_env: Record<string, string | undefined> = process.env): boolean {
  return true;
}

export function isFreeOpenRouterModel(model: unknown): model is string {
  return typeof model === 'string' && (model === 'openrouter/free'
    || /^[a-z0-9._-]+\/[a-z0-9._-]+:free$/.test(model));
}
