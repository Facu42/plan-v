import { describe, expect, it } from 'vitest';
import { PermanentJobError } from './errors.js';
import { createMemoryJobStore } from './memory.js';
import { drain, runOne } from './queue.js';

describe('cola durable en memoria', () => {
  it('un lease exclusivo impide que otro worker tome el mismo job', async () => {
    const store = createMemoryJobStore(() => new Date('2026-09-20T12:00:00.000Z'));
    const created = await store.enqueue({ kind: 'purge_asset', payload: { path: 'a/b' } });
    const first = await store.lease('worker-a', new Date('2026-09-20T12:00:00.000Z'), 30_000);
    const second = await store.lease('worker-b', new Date('2026-09-20T12:00:01.000Z'), 30_000);
    expect(first?.id).toBe(created.id);
    expect(first?.status).toBe('leased');
    expect(second).toBeNull();
  });

  it('reintenta con backoff y pasa a dead letter al agotar intentos', async () => {
    const store = createMemoryJobStore(() => new Date('2026-09-20T12:00:00.000Z'));
    await store.enqueue({ kind: 'fail', max_attempts: 2 });
    const first = await runOne(store, 'w1', async () => { throw new Error('boom'); }, new Date('2026-09-20T12:00:00.000Z'));
    expect(first?.status).toBe('queued');
    expect(first?.last_error).toBe('boom');
    const early = await store.lease('w1', new Date('2026-09-20T12:00:00.100Z'));
    expect(early).toBeNull();
    const dead = await runOne(store, 'w1', async () => { throw new Error('boom'); }, new Date('2026-09-20T12:01:00.000Z'));
    expect(dead?.status).toBe('dead');
    expect((await store.counts()).dead).toBe(1);
  });

  it('completa un job y deja el recuento en succeeded', async () => {
    const store = createMemoryJobStore();
    await store.enqueue({ kind: 'purge_asset', payload: { path: 'x' } });
    const done = await drain(store, 'w1', async () => undefined);
    expect(done[0].status).toBe('succeeded');
    expect((await store.counts()).succeeded).toBe(1);
  });

  it('un error permanente va a dead letter sin reintentos', async () => {
    const store = createMemoryJobStore();
    await store.enqueue({ kind: 'purge_asset', payload: {}, max_attempts: 5 });
    const done = await runOne(store, 'w1', async () => { throw new PermanentJobError('purge_path'); });
    expect(done?.status).toBe('dead');
    expect(done?.last_error).toBe('purge_path');
  });
});
