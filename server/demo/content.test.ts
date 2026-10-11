import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { seedDemoContent } from './content.js';

describe('contenido demo', () => {
  beforeEach(() => resetStore());

  it('cada paso pasa por la API sin errores', async () => {
    const steps = await seedDemoContent((path, init) => app.request(path, init), new Date('2026-09-22T15:00:00Z'));
    expect(steps.filter((step) => !step.ok)).toEqual([]);
  });

  it('deja a Sofía con recetas, plan publicado, medidas y rutina', async () => {
    await seedDemoContent((path, init) => app.request(path, init), new Date('2026-09-22T15:00:00Z'));
    const recipes = await (await app.request('/api/patients/pat-sofia/recipes')).json();
    expect(recipes.recipes).toHaveLength(5);
    const plan = await (await app.request('/api/patients/pat-sofia/plans')).json();
    expect(plan.plan.period_start).toBe('2026-09-21');
    expect(plan.plan.items).toHaveLength(28);
    const care = await (await app.request('/api/patients/pat-sofia/care')).json();
    expect(care.measurements.length).toBeGreaterThanOrEqual(12);
    const exercise = await (await app.request('/api/patients/pat-sofia/exercise')).json();
    expect(exercise.exercise.assignments[0].title).toBe('Fuerza suave en casa');
  });
});
