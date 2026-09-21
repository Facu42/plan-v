import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { resetStore } from '../store.js';

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

describe('catálogo profesional de recetas', () => {
  beforeEach(() => resetStore());

  it('guarda sin publicar, publica una vez y el paciente no ve el inédito', async () => {
    const id = randomUUID();
    const input = { id, ...recipe };
    expect((await post('/api/recipes', input)).status).toBe(403);
    expect((await post('/api/recipes?audience=pro', { ...input, servings: 0 })).status).toBe(400);
    expect((await post('/api/recipes?audience=pro', input)).status).toBe(200);
    expect((await post('/api/recipes?audience=pro', input)).status).toBe(200);
    expect((await (await app.request('/api/recipes?audience=pro')).json()).recipes).toHaveLength(1);
    expect((await (await app.request('/api/patients/pat-sofia/recipes')).json()).recipes).toEqual([]);
    expect((await post(`/api/recipes/${id}/publish?audience=pro`)).status).toBe(200);
    expect((await post(`/api/recipes/${id}/publish?audience=pro`)).status).toBe(200);
    expect((await post('/api/recipes?audience=pro', { ...input, title: 'Otra' })).status).toBe(409);
    const published = await (await app.request('/api/patients/pat-sofia/recipes')).json();
    expect(published.recipes).toHaveLength(1);
    expect(published.recipes[0]).toMatchObject({ title: recipe.title, servings: 2, nutrient_source: recipe.nutrient_source });
    expect(published.recipes[0]).not.toHaveProperty('nutritionist_id');
    expect((await app.request('/api/patients/pat-marina/recipes')).status).toBe(200);
  });
});
