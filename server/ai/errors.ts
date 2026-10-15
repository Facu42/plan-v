export class AIUnavailableError extends Error {
  readonly code = 'AI_UNAVAILABLE';
  constructor() {
    super('El análisis no está disponible. Podés volver a intentarlo.');
    this.name = 'AIUnavailableError';
  }
}
