import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../index.js';
import { getPatient, resetStore } from '../store.js';

function post(path: string, body: unknown, method = 'POST') {
  return app.request(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

describe('corregir una comida ya registrada', () => {
  beforeEach(() => {
    vi.stubEnv('AI_MODE', 'disabled');
    resetStore();
  });
  afterEach(() => { vi.unstubAllEnvs(); });

  it('corrige o borra mientras no está revisada y después sólo pide la corrección', async () => {
    const created = await post('/api/patients/pat-sofia/meals/analyze', {
      slot: 'Almuerzo',
      description: 'Milanesa sola',
      client_id: '11111111-1111-4111-8111-111111111111',
    });
    const meal = (await created.json()).log as { id: string; description: string; status: string };
    expect(meal.status).toBe('pending_review');

    const corrected = await post(`/api/patients/pat-sofia/meals/${meal.id}/correct`, {
      slot: 'Cena',
      description: 'Milanesa con ensalada',
    });
    const correctedBody = await corrected.json() as { log: { description: string; slot: string; status: string } };
    expect(corrected.status).toBe(200);
    expect(correctedBody.log).toMatchObject({ description: 'Milanesa con ensalada', slot: 'Cena', status: 'pending_review' });
    expect(correctedBody.log).not.toHaveProperty('note_for_nutri');
    expect(getPatient('pat-sofia')!.meal_logs.find((row) => row.id === meal.id)?.description).toBe('Milanesa con ensalada');

    const extra = await post('/api/patients/pat-sofia/meals/analyze', {
      slot: 'Desayuno',
      description: 'Café',
      client_id: '22222222-2222-4222-8222-222222222222',
    });
    const extraId = (await extra.json()).log.id as string;
    expect((await app.request(`/api/patients/pat-sofia/meals/${extraId}`, { method: 'DELETE' })).status).toBe(200);
    expect(getPatient('pat-sofia')!.meal_logs.some((row) => row.id === extraId)).toBe(false);

    const reviewed = await post(`/api/patients/pat-sofia/meals/${meal.id}`, { status: 'confirmed' }, 'PATCH');
    expect(reviewed.status).toBe(200);
    const before = getPatient('pat-sofia')!.meal_logs.find((row) => row.id === meal.id);
    expect((await post(`/api/patients/pat-sofia/meals/${meal.id}/correct`, { slot: 'Almuerzo', description: 'Otra cosa' })).status).toBe(409);
    expect((await app.request(`/api/patients/pat-sofia/meals/${meal.id}`, { method: 'DELETE' })).status).toBe(409);
    expect(getPatient('pat-sofia')!.meal_logs.find((row) => row.id === meal.id)).toMatchObject({
      description: before?.description,
      status: 'confirmed',
    });

    const clientId = '33333333-3333-4333-8333-333333333333';
    const asked = await post(`/api/patients/pat-sofia/meals/${meal.id}/correction-request`, {
      note: 'Faltó la ensalada',
      client_id: clientId,
    });
    expect(asked.status).toBe(200);
    const messages = getPatient('pat-sofia')!.messages.filter((row) => row.text.includes('Quiero corregir una comida ya revisada'));
    expect(messages).toHaveLength(1);
    expect(messages[0].text).toContain('Faltó la ensalada');
    expect(messages[0].from).toBe('patient');
    const again = await post(`/api/patients/pat-sofia/meals/${meal.id}/correction-request`, {
      note: 'Faltó la ensalada',
      client_id: clientId,
    });
    expect(again.status).toBe(200);
    expect(getPatient('pat-sofia')!.messages.filter((row) => row.text.includes('Quiero corregir una comida ya revisada'))).toHaveLength(1);
    expect(getPatient('pat-sofia')!.meal_logs.find((row) => row.id === meal.id)?.description).toBe(before?.description);
  });

  it('no deja corregir una comida que ya venía revisada', async () => {
    const response = await post('/api/patients/pat-sofia/meals/ml-s3/correct', { slot: 'Cena', description: 'Cambio' });
    expect(response.status).toBe(409);
    expect(getPatient('pat-sofia')!.meal_logs.find((row) => row.id === 'ml-s3')?.description).toBe('Wrap de pollo');
  });
});
