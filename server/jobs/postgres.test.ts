import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { createPostgresJobStore } from './postgres.js';
import { drain } from './queue.js';

let db: PGlite;
let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-jobs-'));
  db = new PGlite(dir);
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
  `);
  await db.exec(await readFile(new URL('../../supabase/migrations/20260920190000_jobs.sql', import.meta.url), 'utf8'));
}, 60000);

afterAll(async () => {
  await db?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('cola durable en PGlite', () => {
  it('conserva un job queued al reabrir la base', async () => {
    const store = createPostgresJobStore(db);
    const created = await store.enqueue({ kind: 'purge_asset', payload: { path: 'meal-photos/demo.png' } });
    expect(created.status).toBe('queued');
    await db.close();
    db = new PGlite(dir);
    const reopened = createPostgresJobStore(db);
    const saved = await reopened.get(created.id);
    expect(saved).toMatchObject({ id: created.id, kind: 'purge_asset', status: 'queued' });
    const done = await drain(reopened, 'worker-1', async () => undefined);
    expect(done[0].status).toBe('succeeded');
  });

  it('un lease exclusivo y el dead letter siguen valiendo en SQL', async () => {
    const store = createPostgresJobStore(db, () => new Date('2026-09-20T15:00:00.000Z'));
    const created = await store.enqueue({ kind: 'fail', max_attempts: 1 });
    const first = await store.lease('a', new Date('2026-09-20T15:00:00.000Z'), 30_000);
    const second = await store.lease('b', new Date('2026-09-20T15:00:01.000Z'), 30_000);
    expect(first?.id).toBe(created.id);
    expect(second).toBeNull();
    const dead = await store.complete(created.id, 'boom');
    expect(dead.status).toBe('dead');
  });
});
