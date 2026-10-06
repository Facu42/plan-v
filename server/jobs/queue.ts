import { emitOpsAlert } from '../ops/alerts.js';
import { jobErrorMessage } from './errors.js';
import type { JobStore, ProcessingJob } from './types.js';
import { createMemoryJobStore } from './memory.js';
import { persistDemoState } from '../demo/state.js';
import { AI_JOB_TIMEOUT_MS } from '../../src/types/ai-jobs.js';

export type JobHandler = (job: ProcessingJob) => Promise<void>;

export async function runOne(store: JobStore, owner: string, handler: JobHandler, now?: Date) {
  // También las alternativas usan esta cola: no recuperar un intento durante su llamada.
  const job = await store.lease(owner, now, AI_JOB_TIMEOUT_MS + 30_000);
  if (!job) return null;
  try {
    await handler(job);
    return await store.complete(job.id);
  } catch (error) {
    const delay = job.kind === 'menu_cover' && error && typeof error === 'object' && 'retryAfterMs' in error ? Number(error.retryAfterMs) : undefined;
    const done = await store.complete(job.id, jobErrorMessage(error), delay);
    if (done.status === 'dead') emitOpsAlert({ kind: 'dead_letter', status: 500, detail: done.kind });
    return done;
  } finally {
    persistDemoState();
  }
}

export async function drain(store: JobStore, owner: string, handler: JobHandler, limit = 20) {
  const processed: ProcessingJob[] = [];
  for (let i = 0; i < limit; i += 1) {
    const job = await runOne(store, owner, handler);
    if (!job) break;
    processed.push(job);
  }
  return processed;
}

export let processQueue = createMemoryJobStore(undefined, 'processing-queue');

export function resetProcessQueue() {
  processQueue = createMemoryJobStore(undefined, 'processing-queue');
}
