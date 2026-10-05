import { writeWasRejected } from '../../../api/write-outcome';
// Keep an unconfirmed write intact: a lost response must retry the same payload.
export function createPendingWrite<Input, Output>(execute: (input: Input) => Promise<Output>, retainOnError: (error: unknown, input: Input) => boolean = error => !writeWasRejected(error)) {
  let pending: { input: Input } | null = null;
  let active: Promise<Output> | null = null;
  return {
    get pending() { return pending !== null; },
    run(input: Input): Promise<Output> {
      if (active) return active;
      pending ??= { input };
      const attempt = pending;
      active = Promise.resolve().then(() => execute(attempt.input)).then(result => {
        pending = null;
        return result;
      }).catch(error => {
        if (!retainOnError(error, attempt.input)) pending = null;
        throw error;
      }).finally(() => { active = null; });
      return active;
    },
  };
}
