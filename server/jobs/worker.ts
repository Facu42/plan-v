import { handleProcessingJob } from './handlers.js';
import { drain, processQueue } from './queue.js';

let timer: ReturnType<typeof setInterval> | null = null;

export function startJobWorker(owner = 'plan-v-worker') {
  if (process.env.VITEST === 'true') return;
  if (timer) return;
  timer = setInterval(() => {
    void drain(processQueue, owner, handleProcessingJob, 5).catch(() => undefined);
  }, 1_000);
  timer.unref?.();
}

export function stopJobWorker() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
