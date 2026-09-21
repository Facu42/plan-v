import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { declareKnownHealth } from '../test/declare-health.js';
import { shoppingDbError, CareError } from './repository.js';

const patient = 'pat-sofia';
const other = 'pat-marina';
const post = (path: string, body: unknown) => app.request(path, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

type List = {
  list: {
    plan_version: number | null;
    items: Array<{
      id: string;
      kind: string;
      source_key: string;
      name: string;
      quantity: number | null;
      unit: string | null;
      occurrences: number;
      checked: boolean;
    }>;
  };
  source: string;
};

async function json(path: string) {
  return (await (await app.request(path)).json()) as List;
}

async function publishQuinoaPlan() {
  const recipeId = randomUUID();
  expect((await post('/api/recipes', {
    id: recipeId,
    title: 'Quinoa',
    yield_portions: 2,
    steps: ['Cocinar.'],
    nutrient_source: 'Tabla del consultorio',
    items: [
      { name: 'Quinoa', quantity: 60, unit: 'g' },
      { name: 'Tomate', quantity: 1, unit: 'u' },
    ],
  })).status).toBe(200);
  expect((await post(`/api/recipes/${recipeId}/publish`, { expected_version: 1 })).status).toBe(200);

  const extraId = randomUUID();
  expect((await post('/api/recipes', {
    id: extraId,
    title: 'Otra',
    yield_portions: 1,
    steps: ['Servir.'],
    items: [{ name: 'Quinoa', quantity: 1, unit: 'taza' }],
  })).status).toBe(200);
  expect((await post(`/api/recipes/${extraId}/publish`, { expected_version: 1 })).status).toBe(200);

  const planId = randomUUID();
  expect((await post(`/api/patients/${patient}/plans`, {
    id: planId,
    period_start: '2026-09-21',
    period_end: '2026-09-27',
    items: [
      { for_date: '2026-09-21', slot: 'Almuerzo', recipe_id: recipeId, portions: 2 },
      { for_date: '2026-09-22', slot: 'Cena', recipe_id: recipeId, portions: 1 },
      { for_date: '2026-09-23', slot: 'Merienda', recipe_id: extraId, portions: 1 },
      { for_date: '2026-09-24', slot: 'Cena', free_text: 'Pollo con vegetales', portions: 1 },
    ],
  })).status).toBe(200);
  expect((await post(`/api/plans/${planId}/publish`, { expected_version: 1 })).status).toBe(200);
  return planId;
}

describe('PV-21 lista de compras', () => {
  beforeEach(async () => {
    resetStore();
    await declareKnownHealth(patient);
  });

  it('escala porciones, no mezcla g con taza y no inventa cantidad en texto libre', async () => {
    expect((await json(`/api/patients/${patient}/shopping`)).list.items).toEqual([]);
    await publishQuinoaPlan();
    const body = await json(`/api/patients/${patient}/shopping`);
    expect(body.source).toBe('memory');
    expect(body.list.plan_version).toBe(1);
    const quinoa = body.list.items.filter((item) => item.name === 'Quinoa');
    expect(quinoa).toEqual([
      expect.objectContaining({ unit: 'g', quantity: 90, occurrences: 2, kind: 'derived', checked: false }),
      expect.objectContaining({ unit: 'taza', quantity: 1, occurrences: 1, kind: 'derived' }),
    ]);
    expect(body.list.items.find((item) => item.name === 'Tomate')).toMatchObject({ quantity: 1.5, unit: 'u', occurrences: 2 });
    expect(body.list.items.find((item) => item.name === 'Pollo con vegetales')).toMatchObject({
      kind: 'text', quantity: null, unit: null, source_key: 'text:pollo con vegetales',
    });
    expect((await json(`/api/patients/${other}/shopping`)).list.items).toEqual([]);
  });

  it('persiste agregados manuales y checks; el profesional no escribe; regenerar no borra el manual', async () => {
    const planId = await publishQuinoaPlan();
    const clientId = randomUUID();
    const added = await post(`/api/patients/${patient}/shopping/items`, {
      name: 'Aceite de oliva', quantity: 1, unit: 'cda', client_id: clientId,
    });
    expect(added.status).toBe(201);
    const withManual = await added.json() as List;
    const manual = withManual.list.items.find((item) => item.kind === 'manual');
    expect(manual).toMatchObject({ name: 'Aceite de oliva', quantity: 1, unit: 'cda', checked: false });

    expect((await post(`/api/patients/${patient}/shopping/items?audience=pro`, {
      name: 'Sal', quantity: 1, unit: 'g', client_id: randomUUID(),
    })).status).toBe(403);
    expect((await post(`/api/patients/${patient}/shopping/check?audience=pro`, {
      source_key: manual!.source_key, checked: true,
    })).status).toBe(403);

    const quinoaKey = withManual.list.items.find((item) => item.name === 'Quinoa' && item.unit === 'g')!.source_key;
    const checked = await post(`/api/patients/${patient}/shopping/check`, { source_key: quinoaKey, checked: true });
    expect(checked.status).toBe(200);
    const afterCheck = await checked.json() as List;
    expect(afterCheck.list.items.find((item) => item.source_key === quinoaKey)?.checked).toBe(true);

    expect((await post(`/api/patients/${patient}/plans`, {
      id: planId,
      period_start: '2026-09-21',
      period_end: '2026-09-27',
      items: [{ for_date: '2026-09-25', slot: 'Almuerzo', free_text: 'Ensalada', portions: 1 }],
    })).status).toBe(200);
    expect((await post(`/api/plans/${planId}/publish`, { expected_version: 2 })).status).toBe(200);

    const regenerated = await json(`/api/patients/${patient}/shopping`);
    expect(regenerated.list.plan_version).toBe(2);
    expect(regenerated.list.items.find((item) => item.name === 'Aceite de oliva')).toMatchObject({ kind: 'manual', quantity: 1, unit: 'cda' });
    expect(regenerated.list.items.some((item) => item.name === 'Quinoa')).toBe(false);
    expect(regenerated.list.items.find((item) => item.name === 'Ensalada')).toMatchObject({ kind: 'text', quantity: null });

    const removed = await app.request(`/api/patients/${patient}/shopping/items/${manual!.id}`, { method: 'DELETE' });
    expect(removed.status).toBe(200);
    expect((await removed.json() as List).list.items.some((item) => item.kind === 'manual')).toBe(false);
  });

  it('cierra en 501 si falta el schema persistente', () => {
    expect(() => shoppingDbError({ code: '42P01' })).toThrow(CareError);
    for (const code of ['42883', 'PGRST202', 'PGRST205']) {
      try {
        shoppingDbError({ code });
        throw new Error('expected CareError');
      } catch (error) {
        expect(error).toMatchObject({ status: 501 });
      }
    }
    try {
      shoppingDbError({ code: '42501' });
      throw new Error('expected CareError');
    } catch (error) {
      expect(error).toMatchObject({ status: 403 });
    }
  });
});
