import { jobErrorMessage } from './errors.js';
import type { JobStore, ProcessingJob } from './types.js';
import { createMemoryJobStore } from './memory.js';

export type JobHandler = (job: ProcessingJob) => Promise<void>;

export async function runOne(store: JobStore, owner: string, handler: JobHandler, now?: Date) {
  const job = await store.lease(owner, now);
  if (!job) return null;
  try {
    await handler(job);
    return await store.complete(job.id);
  } catch (error) {
    return await store.complete(job.id, jobErrorMessage(error));
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

export let processQueue = createMemoryJobStore();

export function resetProcessQueue() {
  processQueue = createMemoryJobStore();
}
