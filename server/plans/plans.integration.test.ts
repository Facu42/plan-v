import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { mondayOf } from '../../src/types/plans.js';

const recipe = {
  title: 'Bowl de quinoa y pollo',
  ingredients: ['1 taza de quinoa cocida', '120 g de pollo'],
  steps: ['Cocinar la quinoa', 'Sumar el pollo y las verduras'],
  explanation: 'Almuerzo completo, sin estimar macros.',
  servings: 2,
  nutrient_source: 'Revisión profesional · Tabla SARA',
};
const post = (path: string, body?: unknown, method = 'POST') => app.request(path, {
  method,
  headers: { 'Content-Type': 'application/json' },
  ...(body ? { body: JSON.stringify(body) } : {}),
});

describe('planes semanales versionados', () => {
  beforeEach(() => resetStore());

  it('calcula el lunes de la semana en calendario', () => {
    expect(mondayOf('2026-09-14')).toBe('2026-09-14');
    expect(mondayOf('2026-09-18')).toBe('2026-09-14');
    expect(mondayOf('2026-09-20')).toBe('2026-09-14');
  });

  it('guarda una copia inédita, publica con versión esperada y no muta la copia vigente', async () => {
    const recipeId = randomUUID();
    const planId = randomUUID();
    expect((await post('/api/recipes?audience=pro', { id: recipeId, ...recipe })).status).toBe(200);
    expect((await post(`/api/recipes/${recipeId}/publish?audience=pro`)).status).toBe(200);

    const slots = [{ day: 'Lunes', slot: 'Almuerzo', title: 'Título provisorio', recipe_id: recipeId, servings: null }];
    expect((await post('/api/patients/pat-sofia/plans', { id: planId, period_start: '2026-09-14', slots, expected_version: 0 }, 'PUT')).status).toBe(403);
    expect((await post('/api/patients/pat-sofia/plans?audience=pro', { id: planId, period_start: '2026-09-15', slots, expected_version: 0 }, 'PUT')).status).toBe(400);
    expect((await post('/api/patients/pat-sofia/plans?audience=pro', { id: planId, period_start: '2026-09-14', slots, expected_version: 0 }, 'PUT')).status).toBe(200);

    const unpublished = await (await app.request('/api/patients/pat-sofia/plans')).json();
    expect(unpublished.published).toBeNull();
    expect(unpublished.open).toBeNull();
    const board = await (await app.request('/api/patients/pat-sofia/plans?audience=pro')).json();
    expect(board.open.version).toBe(1);
    expect(board.open.slots[0]).toMatchObject({ title: recipe.title, recipe_id: recipeId, servings: 2 });
    expect(board.open).not.toHaveProperty('nutritionist_id');

    expect((await post(`/api/patients/pat-sofia/plans/${planId}/publish?audience=pro`, { expected_version: 2 })).status).toBe(409);
    expect((await post(`/api/patients/pat-sofia/plans/${planId}/publish?audience=pro`, { expected_version: 1 })).status).toBe(200);
    expect((await post(`/api/patients/pat-sofia/plans/${planId}/publish?audience=pro`, { expected_version: 1 })).status).toBe(200);

    const nextId = randomUUID();
    const nextSlots = [{ day: 'Martes', slot: 'Cena', title: 'Tortilla de verdura', recipe_id: null, servings: null }];
    expect((await post('/api/patients/pat-sofia/plans?audience=pro', { id: planId, period_start: '2026-09-14', slots: nextSlots, expected_version: 1 }, 'PUT')).status).toBe(409);
    expect((await post('/api/patients/pat-sofia/plans?audience=pro', { id: nextId, period_start: '2026-09-14', slots: nextSlots, expected_version: 0 }, 'PUT')).status).toBe(409);
    expect((await post('/api/patients/pat-sofia/plans?audience=pro', { id: nextId, period_start: '2026-09-14', slots: nextSlots, expected_version: 1 }, 'PUT')).status).toBe(200);

    const patientView = await (await app.request('/api/patients/pat-sofia/plans')).json();
    expect(patientView.published.version).toBe(1);
    expect(patientView.published.slots).toEqual([expect.objectContaining({ title: recipe.title, recipe_id: recipeId, servings: 2 })]);
    expect(patientView.open).toBeNull();
    const proView = await (await app.request('/api/patients/pat-sofia/plans?audience=pro')).json();
    expect(proView.open.version).toBe(2);
    expect(proView.open.slots[0].title).toBe('Tortilla de verdura');
    expect(proView.published.slots[0].title).toBe(recipe.title);
  });
});
