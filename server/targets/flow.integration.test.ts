import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { resetBodyMemory, resetTargetMemory } from './repository.js';
import { defaultsForGoal } from '../../src/lib/nutrition-target.js';

const patient = 'pat-sofia';
const inputs = { sex: 'femenino', age: 30, weight_kg: 65, height_cm: 165, activity: 'ligera', ...defaultsForGoal('bajar') };
const put = async (body: Record<string, unknown>, audience = 'pro') => {
  const workspace = await get('pro');
  return app.request(`/api/patients/${patient}/nutrition-target?audience=${audience}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expected_revision: workspace.revision, ...body }),
  });
};
type Target = { inputs: typeof inputs; result: { kcal: number }; published_at: string | null; updated_at: string };
const get = async (audience?: string) => (await (await app.request(`/api/patients/${patient}/nutrition-target${audience ? `?audience=${audience}` : ''}`)).json()) as { target: Target | null; draft?: Target | null; published?: Target | null; revision?: number };

describe('meta de calorías y macros (Mifflin-St Jeor)', () => {
  beforeEach(() => { resetStore(); resetTargetMemory(); resetBodyMemory(); });

  it('el borrador lo ve sólo la nutricionista; la paciente ve la meta al confirmarla', async () => {
    expect((await put({ inputs, publish: false })).status).toBe(200);
    expect((await get('pro')).target?.published_at).toBeNull();
    expect((await get()).target).toBeNull();
    expect((await put({ inputs, publish: true })).status).toBe(200);
    expect((await get()).target?.result.kcal).toBe(Math.round(1370.25 * 1.375 * 0.85));
  });

  it('recalcula en el servidor e ignora cifras enviadas', async () => {
    const res = await put({ inputs, publish: true, result: { kcal: 9999 } });
    expect(res.status).toBe(400);
    const ok = await (await put({ inputs, publish: true })).json() as { target: { result: { kcal: number } } };
    expect(ok.target.result.kcal).toBeLessThan(3000);
  });

  it('la paciente no puede definir la meta y los datos absurdos se rechazan', async () => {
    expect((await put({ inputs, publish: true }, 'patient')).status).toBe(403);
    expect((await put({ inputs: { ...inputs, weight_kg: 5 }, publish: false })).status).toBe(400);
  });

  it('guardar un nuevo borrador conserva intacta la meta confirmada de la paciente', async () => {
    await put({ inputs, publish: true });
    const confirmed = (await get()).target;
    const changed = { ...inputs, weight_kg: 80 };
    const saved = await (await put({ inputs: changed, publish: false })).json() as Awaited<ReturnType<typeof get>>;
    expect(saved.draft?.inputs.weight_kg).toBe(80);
    expect(saved.published).toEqual(confirmed);
    expect(await get()).toEqual({ target: confirmed });
    const reloaded = await get('pro');
    expect(reloaded.draft).toEqual(saved.draft);
    expect(reloaded.revision).toBe(2);
    await put({ inputs: changed, publish: true });
    expect((await get('pro')).draft).toBeNull();
    expect((await get()).target?.inputs.weight_kg).toBe(80);
  });

  it('rechaza revisión ausente o antigua y no cambia la meta ni el borrador', async () => {
    const path = `/api/patients/${patient}/nutrition-target?audience=pro`;
    expect((await app.request(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inputs, publish: true }) })).status).toBe(400);
    await put({ inputs, publish: true });
    const before = await get('pro');
    expect((await put({ inputs: { ...inputs, weight_kg: 85 }, publish: false, expected_revision: 0 })).status).toBe(409);
    expect(await get('pro')).toEqual(before);
  });

  it('dos guardados simultáneos de la misma revisión sólo confirman uno', async () => {
    const statuses = await Promise.all([
      put({ inputs, publish: true, expected_revision: 0 }),
      put({ inputs: { ...inputs, weight_kg: 85 }, publish: false, expected_revision: 0 }),
    ]);
    expect(statuses.map((r) => r.status).sort()).toEqual([200, 409]);
    expect((await get('pro')).revision).toBe(1);
  });

  describe('datos corporales que carga la paciente', () => {
    const body = { sex: 'femenino', birth_date: '1990-05-10', height_cm: 165, weight_kg: 64 };
    const bodyPath = `/api/patients/${patient}/body-data`;
    const send = (method: string, path: string, audience: string, data?: unknown) => app.request(`${path}?audience=${audience}`, { method, headers: { 'Content-Type': 'application/json' }, body: data ? JSON.stringify(data) : undefined });

    it('la paciente los carga, la nutricionista los ve y el pedido se limpia al guardar', async () => {
      expect((await send('POST', `${bodyPath}/request`, 'pro')).status).toBe(200);
      const asked = await (await send('GET', bodyPath, 'patient')).json() as { data: unknown; requested_at: string | null };
      expect(asked.data).toBeNull();
      expect(asked.requested_at).not.toBeNull();
      expect((await send('PUT', bodyPath, 'patient', body)).status).toBe(200);
      const after = await (await send('GET', bodyPath, 'pro')).json() as { data: { weight_kg: number } | null; requested_at: string | null };
      expect(after.data?.weight_kg).toBe(64);
      expect(after.requested_at).toBeNull();
    });

    it('cada rol hace sólo lo suyo y se rechazan datos absurdos', async () => {
      expect((await send('PUT', bodyPath, 'pro', body)).status).toBe(403);
      expect((await send('POST', `${bodyPath}/request`, 'patient')).status).toBe(403);
      expect((await send('PUT', bodyPath, 'patient', { ...body, height_cm: 20 })).status).toBe(400);
      expect((await send('PUT', bodyPath, 'patient', { ...body, birth_date: '2030-01-01' })).status).toBe(400);
    });
  });
});
