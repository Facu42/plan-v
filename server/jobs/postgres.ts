import { randomUUID } from 'node:crypto';
import type { JobKind, JobStore, ProcessingJob } from './types.js';

export type JobSqlClient = {
  query: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>;
};

const backoffMs = (attempts: number) => Math.min(60_000, 500 * 2 ** Math.max(0, attempts - 1));

function asIso(value: unknown, fallback: string) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value) return value;
  return fallback;
}

function asJson(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

function mapJob(row: Record<string, unknown>): ProcessingJob {
  return {
    id: String(row.id),
    kind: row.kind as JobKind,
    payload: asJson(row.payload),
    status: row.status as ProcessingJob['status'],
    attempts: Number(row.attempts ?? 0),
    max_attempts: Number(row.max_attempts ?? 5),
    lease_owner: row.lease_owner == null ? null : String(row.lease_owner),
    lease_until: row.lease_until == null ? null : asIso(row.lease_until, ''),
    run_after: asIso(row.run_after, new Date().toISOString()),
    last_error: row.last_error == null ? null : String(row.last_error),
    created_at: asIso(row.created_at, new Date().toISOString()),
    updated_at: asIso(row.updated_at, new Date().toISOString()),
  };
}

export function createPostgresJobStore(db: JobSqlClient, now: () => Date = () => new Date()): JobStore {
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
      await db.query(
        `insert into public.processing_jobs(
          id, kind, payload, status, attempts, max_attempts, lease_owner, lease_until, run_after, last_error, created_at, updated_at
        ) values ($1,$2,$3::jsonb,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [
          job.id, job.kind, JSON.stringify(job.payload), job.status, job.attempts, job.max_attempts,
          job.lease_owner, job.lease_until, job.run_after, job.last_error, job.created_at, job.updated_at,
        ],
      );
      return { ...job, payload: { ...job.payload } };
    },
    async lease(owner, at = now(), leaseMs = 15_000) {
      const current = at.toISOString();
      const until = new Date(at.getTime() + leaseMs).toISOString();
      const rows = await db.query<Record<string, unknown>>(
        `update public.processing_jobs set
           status = 'leased',
           lease_owner = $1,
           lease_until = $2,
           attempts = attempts + 1,
           updated_at = $3
         where id = (
           select id from public.processing_jobs
           where run_after <= $3
             and (status = 'queued' or (status = 'leased' and lease_until is not null and lease_until <= $3))
           order by created_at
           limit 1
         )
         returning *`,
        [owner, until, current],
      );
      const row = rows.rows[0];
      return row ? mapJob(row) : null;
    },
    async complete(id, error) {
      const current = await db.query<Record<string, unknown>>('select * from public.processing_jobs where id = $1', [id]);
      const job = current.rows[0];
      if (!job) throw new Error('job_missing');
      const mapped = mapJob(job);
      const stamp = now().toISOString();
      const permanent = Boolean(error?.startsWith('permanent:'));
      const lastError = error ? error.replace(/^permanent:/, '') : null;
      let status: ProcessingJob['status'] = 'succeeded';
      let runAfter = mapped.run_after;
      if (error) {
        if (permanent || mapped.attempts >= mapped.max_attempts) status = 'dead';
        else {
          status = 'queued';
          runAfter = new Date(now().getTime() + backoffMs(mapped.attempts)).toISOString();
        }
      }
      const updated = await db.query<Record<string, unknown>>(
        `update public.processing_jobs set
           status = $2,
           last_error = $3,
           lease_owner = null,
           lease_until = null,
           run_after = $4,
           updated_at = $5
         where id = $1
         returning *`,
        [id, status, error ? lastError : null, runAfter, stamp],
      );
      return mapJob(updated.rows[0]);
    },
    async get(id) {
      const rows = await db.query<Record<string, unknown>>('select * from public.processing_jobs where id = $1', [id]);
      return rows.rows[0] ? mapJob(rows.rows[0]) : null;
    },
    async counts() {
      const rows = await db.query<{ status: string; n: number }>(
        'select status, count(*)::int as n from public.processing_jobs group by status',
      );
      const tally = { queued: 0, leased: 0, dead: 0, succeeded: 0 };
      for (const row of rows.rows) {
        if (row.status === 'queued') tally.queued = Number(row.n);
        if (row.status === 'leased') tally.leased = Number(row.n);
        if (row.status === 'dead') tally.dead = Number(row.n);
        if (row.status === 'succeeded') tally.succeeded = Number(row.n);
      }
      return tally;
    },
    async snapshot() {
      const rows = await db.query<Record<string, unknown>>('select * from public.processing_jobs order by created_at');
      return rows.rows.map(mapJob);
    },
    async replaceAll(jobs) {
      await db.query('delete from public.processing_jobs');
      for (const job of jobs) {
        await db.query(
          `insert into public.processing_jobs(
            id, kind, payload, status, attempts, max_attempts, lease_owner, lease_until, run_after, last_error, created_at, updated_at
          ) values ($1,$2,$3::jsonb,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [
            job.id, job.kind, JSON.stringify(job.payload), job.status, job.attempts, job.max_attempts,
            job.lease_owner, job.lease_until, job.run_after, job.last_error, job.created_at, job.updated_at,
          ],
        );
      }
    },
  };
}
