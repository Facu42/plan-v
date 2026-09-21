import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AIUnavailableError } from './ai/errors.js';
import { app } from './index.js';
import { getPatient, resetStore } from './store.js';

const analyzeMocks = vi.hoisted(() => ({ analyzeMeal: vi.fn() }));
vi.mock('./ai/meal-analyzer.js', () => analyzeMocks);

function jsonRequest(body: unknown) {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

describe('PV-22 persistencia del diario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('guarda la comida si la IA falla y no duplica el mismo id', async () => {
    analyzeMocks.analyzeMeal.mockRejectedValue(new AIUnavailableError());
    const payload = { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', slot: 'Cena', description: 'milanesa con ensalada' };
    const first = await app.request('/api/patients/pat-sofia/meals/analyze', jsonRequest(payload));
    const created = await first.json();
    expect(first.status).toBe(200);
    expect(created.log.analysis_status).toBe('failed');
    expect(created.log.foods).toEqual([]);
    expect(created.code).toBe('AI_UNAVAILABLE');
    expect(created.analysis).toBeNull();
    expect(getPatient('pat-sofia')?.meal_logs.filter((log) => log.id === payload.id)).toHaveLength(1);

    const retry = await app.request('/api/patients/pat-sofia/meals/analyze', jsonRequest(payload));
    const retried = await retry.json();
    expect(retry.status).toBe(200);
    expect(retried.log.id).toBe(payload.id);
    expect(getPatient('pat-sofia')?.meal_logs.filter((log) => log.id === payload.id)).toHaveLength(1);

    analyzeMocks.analyzeMeal.mockResolvedValue({
      foods: [{ name: 'milanesa de pollo', portion_est: 150, portion_unit: 'g', confidence: 0.7 }],
      macros: { kcal: 480, protein_g: 32, carbs_g: 28, fat_g: 22 },
      confidence: 0.7,
      note_for_nutri: 'Revisar pan rallado.',
    });
    const recovered = await app.request('/api/patients/pat-sofia/meals/analyze', jsonRequest(payload));
    const done = await recovered.json();
    expect(recovered.status).toBe(200);
    expect(done.log.analysis_status).toBe('succeeded');
    expect(done.log.foods[0].name).toBe('milanesa de pollo');
    expect(getPatient('pat-sofia')?.meal_logs.filter((log) => log.id === payload.id)).toHaveLength(1);

    const conflict = await app.request('/api/patients/pat-sofia/meals/analyze', jsonRequest({ ...payload, description: 'otra comida' }));
    expect(conflict.status).toBe(409);
  });

  it('exige un id de captura', async () => {
    const response = await app.request('/api/patients/pat-sofia/meals/analyze', jsonRequest({ slot: 'Almuerzo', description: 'pollo' }));
    expect(response.status).toBe(400);
    expect(analyzeMocks.analyzeMeal).not.toHaveBeenCalled();
  });
});
