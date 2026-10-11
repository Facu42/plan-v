export class CareError extends Error {
  constructor(public status: 400 | 403 | 404 | 409 | 413 | 415 | 422 | 429 | 501 | 503, message: string) { super(message); }
}
