import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { resetTargetMemory } from './repository.js';
import { defaultsForGoal } from '../../src/lib/nutrition-target.js';

const patient = 'pat-sofia';
const inputs = { sex: 'femenino', age: 30, weight_kg: 65, height_cm: 165, activity: 'ligera', ...defaultsForGoal('bajar') };
const put = (body: unknown, audience = 'pro') => app.request(`/api/patients/${patient}/nutrition-target?audience=${audience}`, {
  method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
const get = async (audience?: string) => (await (await app.request(`/api/patients/${patient}/nutrition-target${audience ? `?audience=${audience}` : ''}`)).json()) as { target: { result: { kcal: number }; published_at: string | null } | null };

describe('meta de calorías y macros (Mifflin-St Jeor)', () => {
  beforeEach(() => { resetStore(); resetTargetMemory(); });

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
});
