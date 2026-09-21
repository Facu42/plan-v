import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { toPublishedPatientPlan } from '../../src/types/plans.js';
import { declareKnownHealth } from '../test/declare-health.js';

const patient = 'pat-sofia';
const other = 'pat-marina';
const post = (path: string, body: unknown) => app.request(path, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

describe('PV-20 paciente ve el plan publicado', () => {
  beforeEach(async () => {
    resetStore();
    await declareKnownHealth(patient);
  });

  it('el paciente ve receta, porciones y el mismo contenido que el CRM; un borrador de receta no lo cambia', async () => {
    const recipeId = randomUUID();
    expect((await post('/api/recipes', {
      id: recipeId,
      title: 'Bowl de lentejas',
      yield_portions: 2,
      steps: ['Lavar las lentejas.', 'Cocinar 25 minutos.'],
      nutrient_source: 'Tabla del consultorio',
      items: [{ name: 'Lentejas secas', quantity: 80, unit: 'g' }],
    })).status).toBe(200);
    expect((await post(`/api/recipes/${recipeId}/publish`, { expected_version: 1 })).status).toBe(200);

    const planId = randomUUID();
    const saved = await post(`/api/patients/${patient}/plans`, {
      id: planId,
      period_start: '2026-09-21',
      period_end: '2026-09-27',
      items: [
        { for_date: '2026-09-21', slot: 'Almuerzo', recipe_id: recipeId, portions: 1, public_note: 'Sin fritura' },
        { for_date: '2026-09-23', slot: 'Cena', free_text: 'Tortilla de verdura' },
      ],
    });
    expect(saved.status).toBe(200);
    expect((await post(`/api/plans/${planId}/publish`, { expected_version: 1 })).status).toBe(200);

    const mine = await (await app.request(`/api/patients/${patient}/plans`)).json() as {
      plan: {
        version: number;
        period_start: string;
        period_end: string;
        items: Array<{
          for_date: string;
          slot: string;
          portions: number | null;
          free_text: string | null;
          recipe: { title: string; version: number; yield_portions: number; steps: string[]; nutrient_source: string; ingredients: Array<{ name: string; quantity: number; unit: string }> } | null;
        }>;
      };
    };
    const pro = await (await app.request(`/api/patients/${patient}/plans?audience=pro`)).json() as {
      plan: Parameters<typeof toPublishedPatientPlan>[0];
    };
    const crm = toPublishedPatientPlan(pro.plan);
    expect(mine.plan.items).toEqual(crm?.items);
    expect(mine.plan.version).toBe(crm?.version);
    expect(mine.plan.items).toHaveLength(2);
    expect(mine.plan.items[0]).toMatchObject({
      for_date: '2026-09-21',
      slot: 'Almuerzo',
      portions: 1,
      recipe: {
        title: 'Bowl de lentejas',
        version: 1,
        yield_portions: 2,
        nutrient_source: 'Tabla del consultorio',
      },
    });
    expect(mine.plan.items[0].recipe?.ingredients).toEqual([
      expect.objectContaining({ name: 'Lentejas secas', quantity: 80, unit: 'g' }),
    ]);
    expect(mine.plan.items[0].recipe?.steps).toEqual(['Lavar las lentejas.', 'Cocinar 25 minutos.']);
    expect(mine.plan.items[1]).toMatchObject({ for_date: '2026-09-23', free_text: 'Tortilla de verdura', recipe: null });
    expect((await (await app.request(`/api/patients/${other}/plans`)).json()).plan).toBeNull();
    expect(JSON.stringify(mine)).not.toMatch(/proteína|carbohidrato|kcal/i);

    expect((await post(`/api/recipes/${recipeId}/versions`, {
      id: recipeId,
      title: 'Bowl de lentejas nuevo',
      yield_portions: 4,
      steps: ['Remojar.'],
      items: [{ name: 'Lentejas secas', quantity: 120, unit: 'g' }],
    })).status).toBe(200);
    const still = await (await app.request(`/api/patients/${patient}/plans`)).json() as { plan: { items: Array<{ recipe: { version: number; yield_portions: number; ingredients: Array<{ quantity: number }> } }> } };
    expect(still.plan.items[0].recipe).toMatchObject({ version: 1, yield_portions: 2 });
    expect(still.plan.items[0].recipe.ingredients[0].quantity).toBe(80);
  });
});
