import { beforeEach, describe, expect, it, vi } from 'vitest';
import { calculateAdherence } from './adherence.js';
import { app } from './index.js';
import { getPatient, resetStore } from './store.js';

function jsonRequest(method: string, body: unknown) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

describe('meal review API flow in memory mode', () => {
  beforeEach(() => {
    vi.stubEnv('OPENAI_API_KEY', '');
    resetStore();
  });

  it('keeps a new meal pending until the professional adjusts it', async () => {
    const initial = getPatient('pat-sofia')!;
    const initialScore = initial.adherence_score;
    const initialPending = initial.meal_logs.filter((log) => log.status === 'pending_review').length;

    const createResponse = await app.request(
      '/api/patients/pat-sofia/meals/analyze',
      jsonRequest('POST', { slot: 'Almuerzo', description: 'pollo con arroz y ensalada' }),
    );
    const created = await createResponse.json();

    expect(createResponse.status).toBe(200);
    expect(created.log.status).toBe('pending_review');
    // La adherencia se recalcula en cada mutación; pendientes no suman.
    expect(created.patient.adherence_score).toBe(calculateAdherence(created.patient).score);
    expect(created.patient.meal_logs.filter((log: { status: string }) => log.status === 'pending_review')).toHaveLength(initialPending + 1);
    expect(created.patient.timeline[0].title).toContain('foto en revisión');

    const adjustedFoods = [{ name: 'pollo al horno', portion_est: 140, portion_unit: 'g', confidence: 0.9 }];
    const adjustedMacros = { kcal: 410, protein_g: 38, carbs_g: 35, fat_g: 12 };
    const reviewResponse = await app.request(
      `/api/patients/pat-sofia/meals/${created.log.id}`,
      jsonRequest('PATCH', { status: 'adjusted', foods: adjustedFoods, macros: adjustedMacros }),
    );
    const reviewed = await reviewResponse.json();

    expect(reviewResponse.status).toBe(200);
    expect(reviewed.log.status).toBe('adjusted');
    expect(reviewed.log.foods).toEqual(adjustedFoods);
    expect(reviewed.log.macros).toEqual(adjustedMacros);
    expect(reviewed.patient.adherence_score).toBe(calculateAdherence(reviewed.patient).score);
    expect(reviewed.patient.adherence_score).toBeGreaterThan(created.patient.adherence_score);
    expect(reviewed.patient.meal_logs.filter((log: { status: string }) => log.status === 'pending_review')).toHaveLength(initialPending);
    expect(reviewed.patient.timeline[0]).toMatchObject({
      title: 'Almuerzo · ajustado',
      body: 'pollo al horno · 410 kcal',
    });
  });

  it('never accepts pending_review as a professional review result', async () => {
    const response = await app.request(
      '/api/patients/pat-sofia/meals/ml-s1',
      jsonRequest('PATCH', { status: 'pending_review' }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Datos inválidos' });
  });
});
