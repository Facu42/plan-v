export type AiFailureReason = 'invalid_period' | 'incomplete_menu' | 'missing_output' | 'ambiguous_recipe' | 'unknown_recipe';

export class AIUnavailableError extends Error {
  readonly code = 'AI_UNAVAILABLE';
  constructor(readonly reason?: AiFailureReason) {
    super('El análisis no está disponible. Podés volver a intentarlo.');
    this.name = 'AIUnavailableError';
  }
}
