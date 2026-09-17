import { ApiError } from '../../api/client';

export function isIntakeConflict(error: unknown): boolean {
  if (error instanceof ApiError) return error.status === 409;
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('409') || message.includes('cambió') || message.includes('ya fue enviado');
}

export function createIntakeSaveQueue() {
  let ready = false;
  let stopped = false;
  let chain = Promise.resolve();
  let pending = 0;

  const enqueue = <T,>(task: () => Promise<T>): Promise<T | null> => {
    if (!ready || stopped) return Promise.resolve(null);
    pending += 1;
    const run = chain.then(async () => {
      if (stopped) return null;
      try {
        return await task();
      } catch (error) {
        if (isIntakeConflict(error)) stopped = true;
        throw error;
      }
    }).finally(() => {
      pending -= 1;
    });
    chain = run.then(() => undefined, () => undefined);
    return run;
  };

  return {
    markReady() {
      ready = true;
    },
    stop() {
      stopped = true;
    },
    reset() {
      ready = false;
      stopped = false;
      chain = Promise.resolve();
      pending = 0;
    },
    get pending() {
      return pending;
    },
    get blocked() {
      return stopped;
    },
    enqueue,
  };
}

export type IntakeSaveQueue = ReturnType<typeof createIntakeSaveQueue>;
