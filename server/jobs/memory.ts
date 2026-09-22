import { randomUUID } from 'node:crypto';
import type { JobKind, JobStore, ProcessingJob } from './types.js';

const backoffMs = (attempts: number) => Math.min(60_000, 500 * 2 ** Math.max(0, attempts - 1));

export function createMemoryJobStore(now: () => Date = () => new Date()): JobStore {
  const jobs = new Map<string, ProcessingJob>();

  return {
    async enqueue(input) {
      const stamp = now().toISOString();
      const job: ProcessingJob = {
        id: randomUUID(),
        kind: input.kind,
        payload: input.payload ?? {},
        status: 'queued',
        attempts: 0,
        max_attempts: input.max_attempts ?? 5,
        lease_owner: null,
        lease_until: null,
        run_after: input.run_after ?? stamp,
        last_error: null,
        created_at: stamp,
        updated_at: stamp,
      };
      jobs.set(job.id, job);
      return { ...job, payload: { ...job.payload } };
    },
    async lease(owner, at = now(), leaseMs = 15_000) {
      const current = at.toISOString();
      const available = [...jobs.values()]
        .filter((job) => job.run_after <= current && (
          job.status === 'queued'
          || (job.status === 'leased' && Boolean(job.lease_until && job.lease_until <= current))
        ))
        .sort((a, b) => a.created_at.localeCompare(b.created_at));
      const job = available[0];
      if (!job) return null;
      job.status = 'leased';
      job.lease_owner = owner;
      job.lease_until = new Date(at.getTime() + leaseMs).toISOString();
      job.attempts += 1;
      job.updated_at = current;
      return { ...job, payload: { ...job.payload } };
    },
    async complete(id, error) {
      const job = jobs.get(id);
      if (!job) throw new Error('job_missing');
      const stamp = now().toISOString();
      const permanent = Boolean(error?.startsWith('permanent:'));
      const lastError = error ? error.replace(/^permanent:/, '') : null;
      if (!error) {
        job.status = 'succeeded';
        job.last_error = null;
        job.lease_owner = null;
        job.lease_until = null;
      } else if (permanent || job.attempts >= job.max_attempts) {
        job.status = 'dead';
        job.last_error = lastError;
        job.lease_owner = null;
        job.lease_until = null;
      } else {
        job.status = 'queued';
        job.last_error = lastError;
        job.lease_owner = null;
        job.lease_until = null;
        job.run_after = new Date(now().getTime() + backoffMs(job.attempts)).toISOString();
      }
      job.updated_at = stamp;
      return { ...job, payload: { ...job.payload } };
    },
    async get(id) {
      const job = jobs.get(id);
      return job ? { ...job, payload: { ...job.payload } } : null;
    },
    async counts() {
      const list = [...jobs.values()];
      return {
        queued: list.filter((job) => job.status === 'queued').length,
        leased: list.filter((job) => job.status === 'leased').length,
        dead: list.filter((job) => job.status === 'dead').length,
        succeeded: list.filter((job) => job.status === 'succeeded').length,
      };
    },
    async snapshot() {
      return [...jobs.values()].map((job) => ({ ...job, payload: { ...job.payload } }));
    },
    async replaceAll(next) {
      jobs.clear();
      for (const job of next) jobs.set(job.id, { ...job, payload: { ...job.payload } });
    },
  };
}

export function assertJobKind(value: string): JobKind {
  if (
    value === 'menu_draft'
    || value === 'recipe_draft'
    || value === 'purge_asset'
    || value === 'privacy_export'
    || value === 'privacy_delete'
    || value === 'fail'
  ) return value;
  throw new Error('job_kind');
}
