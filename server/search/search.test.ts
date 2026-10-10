import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { getPatient, resetStore } from '../store.js';
import { resetFoodsMemory } from '../foods/repository.js';
import type { WorkspaceSearchResponse } from '../../src/types/search.js';

const find = async (q: string) => app.request(`/api/search?q=${encodeURIComponent(q)}`);
const saveFood = (name: string) => app.request('/api/foods', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: randomUUID(), expected_revision: 0, name, brand: '', category: 'Cereales', kind: 'food', source: 'Etiqueta', reference: '', nutrients: { kcal: 380, fat: 0 }, portions: [] }),
});

describe('Buscador global del consultorio (modo demo)', () => {
  beforeEach(() => { resetStore(); resetFoodsMemory(); });

  it('agrupa pacientes y alimentos, sin distinguir tildes ni mayúsculas', async () => {
    await saveFood('Avena arrollada');
    const patients = await (await find('LUCIA')).json() as WorkspaceSearchResponse;
    expect(patients.patients.map(p => p.name)).toContain('Lucía F.');
    expect(patients.patients[0].href).toMatch(/^\/crm\/ficha\?paciente=/);
    const foods = await (await find('avena')).json() as WorkspaceSearchResponse;
    expect(foods.foods.map(f => f.name)).toEqual(['Avena arrollada']);
    expect(foods.patients).toEqual([]);
  });

  it('no incluye fichas archivadas ni datos clínicos en la respuesta', async () => {
    getPatient('pat-sofia')!.archived_at = new Date().toISOString();
    const body = await (await find('Sofía')).json() as WorkspaceSearchResponse;
    expect(body.patients).toEqual([]);
    const lucia = await find('Lucía');
    const text = await lucia.text();
    expect(Object.keys(JSON.parse(text).patients[0]).sort()).toEqual(['href', 'id', 'name']);
    expect(lucia.headers.get('cache-control')).toBe('no-store');
  });

  it('exige al menos dos caracteres y rechaza parámetros desconocidos', async () => {
    expect((await find('a')).status).toBe(400);
    expect((await find('')).status).toBe(400);
    expect((await app.request('/api/search?q=ab&nutritionist_id=otra')).status).toBe(400);
    expect((await find('x'.repeat(81))).status).toBe(400);
  });
});
