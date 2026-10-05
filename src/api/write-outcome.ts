import { ApiError } from './client';

/** A rejected transaction is safe to correct; an absent acknowledgement keeps its UUID. */
export function writeWasRejected(error: unknown): boolean {
  return error instanceof ApiError && [400, 401, 403, 404, 409, 413, 422, 429].includes(error.status);
}
