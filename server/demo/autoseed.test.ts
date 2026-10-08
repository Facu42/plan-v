import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { seedDemoOnBoot } from './autoseed.js';

const request = (path: string, init?: RequestInit) => app.request(path, init);

describe('carga de la demo al iniciar', () => {
  beforeEach(() => resetStore());

  it('carga el contenido de ejemplo si la demo arranca vacía', async () => {
    const result = await seedDemoOnBoot(request, {});
    expect(result).toEqual({ seeded: true, failed: [] });
    const recipes = await (await request('/api/patients/pat-sofia/recipes')).json();
    expect(recipes.recipes.length).toBeGreaterThanOrEqual(5);
    const plan = await (await request('/api/patients/pat-sofia/plans')).json();
    expect(plan.plan.items).toHaveLength(28);
  });

  it('no duplica nada si ya hay un plan publicado', async () => {
    await seedDemoOnBoot(request, {});
    const before = (await (await request('/api/patients/pat-sofia/recipes')).json()).recipes.length;
    expect((await seedDemoOnBoot(request, {})).seeded).toBe(false);
    const after = (await (await request('/api/patients/pat-sofia/recipes')).json()).recipes.length;
    expect(after).toBe(before);
  });

  it('DEMO_SEED=0 lo apaga', async () => {
    expect(await seedDemoOnBoot(request, { DEMO_SEED: '0' })).toEqual({ seeded: false, failed: [] });
    const plan = await (await request('/api/patients/pat-sofia/plans')).json();
    expect(plan.plan).toBeFalsy();
  });
});
