import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { declareKnownHealth } from '../test/declare-health.js';

const patient = 'pat-sofia';
const other = 'pat-marina';
const post = (path: string, body: unknown) => app.request(path, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

function planDraft(overrides: Record<string, unknown> = {}) {
  return {
    id: randomUUID(),
    period_start: '2026-09-21',
    period_end: '2026-09-27',
    timezone: 'America/Argentina/Buenos_Aires',
    items: [{ for_date: '2026-09-21', slot: 'Almuerzo', free_text: 'Pollo con vegetales', portions: 1, public_note: 'Sin fritura' }],
    ...overrides,
  };
}

describe('PV-19 planes fechados versionados', () => {
  beforeEach(async () => {
    resetStore();
    await declareKnownHealth(patient);
  });

  it('el paciente no ve el borrador; sí ve la copia publicada y un borrador posterior no la cambia', async () => {
    const input = planDraft();
    const saved = await post(`/api/patients/${patient}/plans`, input);
    expect(saved.status).toBe(200);
    const pro = await (await app.request(`/api/patients/${patient}/plans?audience=pro`)).json() as {
      plan: { id: string; current: { version: number; published_at: string | null; items: Array<{ free_text: string }> }; published: null };
    };
    expect(pro.plan.current.version).toBe(1);
    expect(pro.plan.current.published_at).toBeNull();
    expect(pro.plan.published).toBeNull();
    expect((await (await app.request(`/api/patients/${patient}/plans`)).json()).plan).toBeNull();
    expect((await (await app.request(`/api/patients/${other}/plans`)).json()).plan).toBeNull();

    const published = await post(`/api/plans/${input.id}/publish`, { expected_version: 1 });
    expect(published.status).toBe(200);
    const mine = await (await app.request(`/api/patients/${patient}/plans`)).json() as {
      plan: { version: number; items: Array<{ slot: string; free_text: string | null; portions: number | null }> };
    };
    expect(mine.plan.version).toBe(1);
    expect(mine.plan.items[0]).toMatchObject({ slot: 'Almuerzo', free_text: 'Pollo con vegetales', portions: 1 });
    expect((await (await app.request(`/api/patients/${other}/plans`)).json()).plan).toBeNull();

    const next = {
      ...input,
      items: [{ for_date: '2026-09-22', slot: 'Cena', free_text: 'Tortilla de verdura' }],
    };
    expect((await post(`/api/patients/${patient}/plans`, next)).status).toBe(200);
    const afterEdit = await (await app.request(`/api/patients/${patient}/plans?audience=pro`)).json() as {
      plan: { current: { version: number; published_at: string | null; items: Array<{ free_text: string }> }; published: { version: number; items: Array<{ free_text: string }> } };
    };
    expect(afterEdit.plan.current.version).toBe(2);
    expect(afterEdit.plan.current.published_at).toBeNull();
    expect(afterEdit.plan.current.items[0].free_text).toBe('Tortilla de verdura');
    expect(afterEdit.plan.published.version).toBe(1);
    expect(afterEdit.plan.published.items[0].free_text).toBe('Pollo con vegetales');

    const still = await (await app.request(`/api/patients/${patient}/plans`)).json() as { plan: { version: number; items: Array<{ free_text: string }> } };
    expect(still.plan.version).toBe(1);
    expect(still.plan.items[0].free_text).toBe('Pollo con vegetales');
  });

  it('publica con versión esperada: idempotente si ya está publicada, 409 si está archivada', async () => {
    const input = planDraft();
    expect((await post(`/api/patients/${patient}/plans`, input)).status).toBe(200);
    expect((await post(`/api/plans/${input.id}/publish`, { expected_version: 1 })).status).toBe(200);
    expect((await post(`/api/plans/${input.id}/publish`, { expected_version: 1 })).status).toBe(200);

    const next = { ...input, items: [{ for_date: '2026-09-23', slot: 'Desayuno', free_text: 'Yogur' }] };
    expect((await post(`/api/patients/${patient}/plans`, next)).status).toBe(200);
    expect((await post(`/api/plans/${input.id}/publish`, { expected_version: 2 })).status).toBe(200);
    expect((await post(`/api/plans/${input.id}/publish`, { expected_version: 1 })).status).toBe(409);

    const mine = await (await app.request(`/api/patients/${patient}/plans`)).json() as { plan: { version: number; items: Array<{ free_text: string }> } };
    expect(mine.plan.version).toBe(2);
    expect(mine.plan.items[0].free_text).toBe('Yogur');
  });

  it('rechaza receta y texto juntos, receta no publicada y no inventa macros', async () => {
    const recipeId = randomUUID();
    expect((await post('/api/recipes', {
      id: recipeId,
      title: 'Ensalada',
      yield_portions: 1,
      steps: ['Mezclar.'],
      items: [{ name: 'Lechuga', quantity: 80, unit: 'g' }],
    })).status).toBe(200);
    const unpublished = planDraft({ items: [{ for_date: '2026-09-21', slot: 'Almuerzo', recipe_id: recipeId }] });
    expect((await post(`/api/patients/${patient}/plans`, unpublished)).status).toBe(400);

    expect((await post(`/api/recipes/${recipeId}/publish`, { expected_version: 1 })).status).toBe(200);
    const both = planDraft({
      items: [{ for_date: '2026-09-21', slot: 'Almuerzo', recipe_id: recipeId, free_text: 'también texto' }],
    });
    expect((await post(`/api/patients/${patient}/plans`, both)).status).toBe(400);

    const linked = planDraft({ items: [{ for_date: '2026-09-21', slot: 'Colación', recipe_id: recipeId, portions: 1 }] });
    const saved = await post(`/api/patients/${patient}/plans`, linked);
    expect(saved.status).toBe(200);
    const body = await saved.json() as { plan: { current: { items: Array<{ slot: string; recipe_title: string | null; free_text: string | null }> } } };
    expect(body.plan.current.items[0]).toMatchObject({ slot: 'Colación', recipe_title: 'Ensalada', free_text: null });
    expect(JSON.stringify(body)).not.toMatch(/proteína|carbohidrato|kcal/i);
  });
});
