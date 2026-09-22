import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { getPatient, resetStore } from '../store.js';
import { declareKnownHealth } from '../test/declare-health.js';

const patient = 'pat-sofia';
const post = (path: string, body: unknown) => app.request(path, {
  method: 'POST',
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
    category: 'Almuerzo',
    prep_minutes: 25,
    protein_g: 18,
    carbs_g: 40,
    fat_g: 9,
    items: [
      { name: 'Lentejas secas', quantity: 80, unit: 'g', line_kcal: 280 },
      { name: 'Aceite de oliva', quantity: 1, unit: 'cda', line_kcal: 90 },
    ],
    ...overrides,
  };
}

describe('PV-40 asignar al día y registrar', () => {
  beforeEach(async () => {
    resetStore();
    await declareKnownHealth(patient);
  });

  it('guarda macros declarados, asigna el día y no duplica el registro', async () => {
    const input = draft();
    const saved = await post('/api/recipes', input);
    expect(saved.status).toBe(200);
    const created = await saved.json() as { recipe: { current: { card: { macro_status: string; macros: { kcal: number; protein_g: number }; cover_status: string }; version: number } } };
    expect(created.recipe.current.card.macro_status).toBe('declared');
    expect(created.recipe.current.card.macros.kcal).toBe(185);
    expect(created.recipe.current.card.macros.protein_g).toBe(18);
    expect(created.recipe.current.card.cover_status).toBe('none');
    expect(JSON.stringify(created)).not.toMatch(/https?:\/\//);

    expect((await post(`/api/recipes/${input.id}/publish`, { expected_version: 1 })).status).toBe(200);
    const assigned = await post(`/api/recipes/${input.id}/day`, {
      patient_id: patient,
      expected_version: 1,
      for_date: '2026-09-22',
      slot: 'Almuerzo',
    });
    expect(assigned.status).toBe(200);
    const day = await assigned.json() as { assignment: { id: string; title: string; slot: string; card: { macros: { kcal: number } } } };
    expect(day.assignment.slot).toBe('Almuerzo');
    expect(day.assignment.card.macros.kcal).toBe(185);

    const clientId = randomUUID();
    const first = await post(`/api/patients/${patient}/recipe-days/${day.assignment.id}/register`, { client_id: clientId });
    expect(first.status).toBe(200);
    const registered = await first.json() as { duplicate: boolean; assignment: { registered_meal_id: string } };
    expect(registered.duplicate).toBe(false);
    expect(registered.assignment.registered_meal_id).toBeTruthy();

    const again = await post(`/api/patients/${patient}/recipe-days/${day.assignment.id}/register`, { client_id: randomUUID() });
    expect(again.status).toBe(200);
    expect((await again.json() as { duplicate: boolean }).duplicate).toBe(true);
    const logs = getPatient(patient)!.meal_logs.filter((log) => log.description === 'Bowl de lentejas');
    expect(logs).toHaveLength(1);
    expect(logs[0].photo_url).toBeNull();
    expect(logs[0].macros).toEqual({ kcal: 185, protein_g: 18, carbs_g: 40, fat_g: 9 });
    expect((await post(`/api/recipes/${input.id}/day?audience=patient`, {
      patient_id: patient,
      expected_version: 1,
      for_date: '2026-09-23',
      slot: 'Cena',
    })).status).toBe(403);
  });

  it('no inventa macros si falta la fuente y no asigna un borrador', async () => {
    const missing = draft({ nutrient_source: '', protein_g: 10, items: [{ name: 'Lentejas', quantity: 80, unit: 'g' }] });
    expect((await post('/api/recipes', missing)).status).toBe(400);
    const bare = draft({ nutrient_source: '', protein_g: null, carbs_g: null, fat_g: null, items: [{ name: 'Lentejas', quantity: 80, unit: 'g' }] });
    const saved = await post('/api/recipes', bare);
    expect(saved.status).toBe(200);
    const body = await saved.json() as { recipe: { id: string; current: { card: { macro_status: string; macros: null } } } };
    expect(body.recipe.current.card.macro_status).toBe('unavailable');
    expect(body.recipe.current.card.macros).toBeNull();
    expect((await post(`/api/recipes/${bare.id}/day`, {
      patient_id: patient,
      expected_version: 1,
      for_date: '2026-09-22',
      slot: 'Almuerzo',
    })).status).toBe(400);
  });
});
