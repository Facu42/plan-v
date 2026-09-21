import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { resetStore } from '../store.js';

const patient = 'pat-sofia';
const other = 'pat-marina';
const post = (path: string, body: unknown, method = 'POST') => app.request(path, {
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

function draft(overrides: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    title: 'Bowl de lentejas',
    yield_portions: 2,
    steps: ['Lavar las lentejas.', 'Cocinar 25 minutos.'],
    nutrient_source: 'Tabla del consultorio 2026',
    items: [{ name: 'Lentejas secas', quantity: 80, unit: 'g' }, { name: 'Aceite de oliva', quantity: 1, unit: 'cda' }],
    ...overrides,
  };
}

describe('PV-18 catálogo de recetas', () => {
  beforeEach(() => { resetStore(); });

  it('el paciente no ve borradores ni publicadas sin asignar; sí ve la revisión asignada', async () => {
    const input = draft();
    const saved = await post('/api/recipes', input);
    expect(saved.status).toBe(200);
    const catalog = await (await app.request('/api/recipes')).json() as { recipes: Array<{ id: string; status: string; current: { version: number; published_at: string | null } }> };
    expect(catalog.recipes).toHaveLength(1);
    expect(catalog.recipes[0].status).toBe('draft');
    expect(catalog.recipes[0].current.published_at).toBeNull();
    expect((await (await app.request(`/api/patients/${patient}/recipes`)).json()).recipes).toEqual([]);

    expect((await post(`/api/recipes/${input.id}/publish`, { expected_version: 1 })).status).toBe(200);
    expect((await (await app.request(`/api/patients/${patient}/recipes`)).json()).recipes).toEqual([]);

    const assigned = await post(`/api/recipes/${input.id}/assign`, { patient_id: patient, expected_version: 1 });
    expect(assigned.status).toBe(200);
    const mine = await (await app.request(`/api/patients/${patient}/recipes`)).json() as { recipes: Array<{ title: string; version: number; yield_portions: number; nutrient_source: string; ingredients: unknown[]; steps: string[] }> };
    expect(mine.recipes).toHaveLength(1);
    expect(mine.recipes[0]).toMatchObject({
      title: 'Bowl de lentejas',
      version: 1,
      yield_portions: 2,
      nutrient_source: 'Tabla del consultorio 2026',
    });
    expect(mine.recipes[0].ingredients).toHaveLength(2);
    expect(mine.recipes[0].steps).toEqual(['Lavar las lentejas.', 'Cocinar 25 minutos.']);
    expect((await (await app.request(`/api/patients/${other}/recipes`)).json()).recipes).toEqual([]);
  });

  it('una edición posterior crea la siguiente versión y no cambia lo asignado', async () => {
    const input = draft();
    expect((await post('/api/recipes', input)).status).toBe(200);
    expect((await post(`/api/recipes/${input.id}/publish`, { expected_version: 1 })).status).toBe(200);
    expect((await post(`/api/recipes/${input.id}/assign`, { patient_id: patient, expected_version: 1 })).status).toBe(200);

    const next = { ...input, title: 'Bowl de lentejas v2', yield_portions: 3, steps: ['Remojar.', 'Cocinar 20 minutos.'], items: [{ name: 'Lentejas secas', quantity: 100, unit: 'g' }] };
    expect((await post(`/api/recipes/${input.id}/versions`, next)).status).toBe(200);
    const catalog = await (await app.request('/api/recipes')).json() as { recipes: Array<{ current: { version: number; published_at: string | null; yield_portions: number }; published: { version: number } | null }> };
    expect(catalog.recipes[0].current.version).toBe(2);
    expect(catalog.recipes[0].current.published_at).toBeNull();
    expect(catalog.recipes[0].current.yield_portions).toBe(3);
    expect(catalog.recipes[0].published?.version).toBe(1);

    const mine = await (await app.request(`/api/patients/${patient}/recipes`)).json() as { recipes: Array<{ version: number; yield_portions: number; title: string }> };
    expect(mine.recipes[0]).toMatchObject({ version: 1, yield_portions: 2 });

    expect((await post(`/api/recipes/${input.id}/publish`, { expected_version: 2 })).status).toBe(200);
    expect((await (await app.request(`/api/patients/${patient}/recipes`)).json()).recipes[0].version).toBe(1);
    expect((await post(`/api/recipes/${input.id}/assign`, { patient_id: patient, expected_version: 2 })).status).toBe(200);
    expect((await (await app.request(`/api/patients/${patient}/recipes`)).json()).recipes[0].version).toBe(2);
  });

  it('rechaza unidades inválidas y no inventa macros', async () => {
    const bad = draft({ items: [{ name: 'Lentejas', quantity: 80, unit: 'kcal' }] });
    expect((await post('/api/recipes', bad)).status).toBe(400);
    const ok = draft({ nutrient_source: '' });
    const saved = await (await post('/api/recipes', ok)).json() as { recipe: { current: { nutrient_source: string; ingredients: Array<{ unit: string }> } } };
    expect(saved.recipe.current.nutrient_source).toBe('');
    expect(JSON.stringify(saved)).not.toMatch(/proteína|carbohidrato|kcal/i);
    expect((await post(`/api/recipes/${ok.id}/assign`, { patient_id: patient, expected_version: 1 })).status).toBe(400);
  });
});
