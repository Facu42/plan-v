import { handleProcessingJob } from './handlers.js';
import { drain, processQueue } from './queue.js';
import { runPersistentDishCover } from '../recipes/menu-covers.js';

let timer: ReturnType<typeof setInterval> | null = null;
let draining = false;

export function startJobWorker(owner = 'plan-v-worker', keepAlive = false) {
  if (process.env.VITEST === 'true') return;
  if (timer) return;
  timer = setInterval(() => {
    if (!draining) {
      draining = true;
      void drain(processQueue, owner, handleProcessingJob, 5).catch(() => undefined).finally(() => { draining = false; });
    }
    void runPersistentDishCover();
  }, 1_000);
  if (!keepAlive) timer.unref?.();
}

export function stopJobWorker() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
