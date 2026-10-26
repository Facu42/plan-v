import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { declareKnownHealth } from '../test/declare-health.js';
import { planReviewSnapshot } from '../../src/types/plans.js';
const post = (path: string, data: unknown) => app.request(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
beforeEach(async () => { resetStore(); await declareKnownHealth('pat-sofia'); });
afterEach(() => vi.useRealTimers());
async function draft() {
  const r = await post('/api/patients/pat-sofia/plans', { id: randomUUID(), period_start: '2026-10-26', period_end: '2026-11-01', items: [{ for_date: '2026-10-26', slot: 'Almuerzo', free_text: 'Verduras' }] });
  expect(r.status).toBe(200); return (await r.json()).plan;
}
it('programa una primera entrega a la hora argentina, conserva el borrador revisado y activa al consultar', async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-26T10:00:00Z'));
  const p = await draft();
  const input = { expected_version: p.current.version, expected_snapshot: planReviewSnapshot(p.current), scheduled_at: '2026-10-26T15:00:00Z' };
  const r = await post(`/api/plans/${p.id}/schedule`, input); expect(r.status).toBe(200);
  expect((await r.json()).plan.delivery_schedule.scheduled_at).toBe('2026-10-26T15:00:00.000Z');
  expect((await (await app.request('/api/patients/pat-sofia/plans')).json()).plan).toBeNull();
  expect((await post(`/api/plans/${p.id}/schedule`, input)).status).toBe(200);
  vi.setSystemTime(new Date('2026-10-26T14:59:59Z'));
  expect((await (await app.request('/api/patients/pat-sofia/plans')).json()).plan).toBeNull();
  vi.setSystemTime(new Date('2026-10-26T15:00:00Z'));
  expect((await (await app.request('/api/patients/pat-sofia/plans')).json()).plan.version).toBe(p.current.version);
});
it('rechaza fecha pasada, fuera de período y copia sin revisar sin publicar', async () => {
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-26T10:00:00Z'));
  const p = await draft(); const base = { expected_version: p.current.version, expected_snapshot: planReviewSnapshot(p.current) };
  for (const scheduled_at of ['2026-10-26T09:00:00Z', '2026-11-02T15:00:00Z', 'ayer']) expect((await post(`/api/plans/${p.id}/schedule`, { ...base, scheduled_at })).status).toBe(400);
  expect((await post(`/api/plans/${p.id}/schedule`, { ...base, expected_snapshot: {}, scheduled_at: '2026-10-26T15:00:00Z' })).status).toBe(409);
  expect((await (await app.request('/api/patients/pat-sofia/plans')).json()).plan).toBeNull();
});
it('mail en demo explica que no envía y no publica', async () => {
  const p = await draft();
  const r = await post(`/api/plans/${p.id}/email`, { patient_id: 'pat-sofia', expected_version: p.current.version });
  expect(r.status).toBe(503); expect((await r.json()).error).toMatch(/demo|correo/i);
  expect((await (await app.request('/api/patients/pat-sofia/plans')).json()).plan).toBeNull();
});
