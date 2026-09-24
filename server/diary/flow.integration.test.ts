import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../index.js';
import { getPatient, resetStore } from '../store.js';
import { listMealAnalysisRuns, listMealReviews } from './repository.js';

function jsonRequest(method: string, body: unknown) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

describe('PV-22 diario: guardar antes de la IA', () => {
  beforeEach(() => {
    vi.stubEnv('OPENAI_API_KEY', '');
    resetStore();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('crea el registro antes de analizar y no duplica con el mismo client_id', async () => {
    const clientId = '11111111-1111-4111-8111-111111111111';
    const first = await app.request(
      '/api/patients/pat-sofia/meals/analyze',
      jsonRequest('POST', { slot: 'Almuerzo', description: 'pollo con arroz y ensalada', client_id: clientId }),
    );
    const created = await first.json();
    expect(first.status).toBe(200);
    expect(created.log.status).toBe('pending_review');
    expect(created.log.analysis_status).toBe('succeeded');
    expect(created.log.foods.length).toBeGreaterThan(0);
    expect(created.log).not.toHaveProperty('client_id');
    expect(created.log).not.toHaveProperty('note_for_nutri');
    expect(listMealAnalysisRuns(created.log.id)).toHaveLength(1);

    const second = await app.request(
      '/api/patients/pat-sofia/meals/analyze',
      jsonRequest('POST', { slot: 'Almuerzo', description: 'otra descripción que no debe crear otra comida', client_id: clientId }),
    );
    const replayed = await second.json();
    expect(second.status).toBe(200);
    expect(replayed.log.id).toBe(created.log.id);
    expect(replayed.log.description).toBe('pollo con arroz y ensalada');
    expect(getPatient('pat-sofia')!.meal_logs.filter((log) => log.id === created.log.id)).toHaveLength(1);
    expect(listMealAnalysisRuns(created.log.id)).toHaveLength(1);
  });

  it('conserva foto/texto si la IA falla y deja el análisis en failed', async () => {
    vi.stubEnv('AI_MODE', 'disabled');
    const description = 'Yogur con fruta sin estimación';
    const response = await app.request(
      '/api/patients/pat-sofia/meals/analyze',
      jsonRequest('POST', {
        slot: 'Merienda',
        description,
        client_id: '22222222-2222-4222-8222-222222222222',
      }),
    );
    const body = await response.json();
    const stored = getPatient('pat-sofia')!.meal_logs.find((log) => log.description === description);

    expect(response.status).toBe(200);
    expect(body.log).toMatchObject({
      slot: 'Merienda',
      status: 'pending_review',
      foods: [],
      macros: null,
      confidence: 0,
      description,
      analysis_status: 'failed',
    });
    expect(stored).toMatchObject({ analysis_status: 'failed', foods: [], macros: null, description });
    expect(stored?.note_for_nutri).toMatch(/no está disponible/i);
    expect(listMealAnalysisRuns(body.log.id)[0]).toMatchObject({ status: 'failed', error_code: 'AI_UNAVAILABLE' });
    expect(getPatient('pat-sofia')!.timeline[0].body).toContain('estimación no disponible');
  });

  it('reintenta la IA sobre la misma comida si el análisis anterior falló', async () => {
    const clientId = '33333333-3333-4333-8333-333333333333';
    vi.stubEnv('AI_MODE', 'disabled');
    const failed = await app.request(
      '/api/patients/pat-sofia/meals/analyze',
      jsonRequest('POST', { slot: 'Cena', description: 'Tortilla de verdura', client_id: clientId }),
    );
    const first = await failed.json();
    expect(first.log.analysis_status).toBe('failed');

    vi.stubEnv('AI_MODE', 'demo');
    const retried = await app.request(
      '/api/patients/pat-sofia/meals/analyze',
      jsonRequest('POST', { slot: 'Cena', description: 'Tortilla de verdura', client_id: clientId }),
    );
    const second = await retried.json();
    expect(retried.status).toBe(200);
    expect(second.log.id).toBe(first.log.id);
    expect(second.log.analysis_status).toBe('succeeded');
    expect(second.log.foods.length).toBeGreaterThan(0);
    expect(listMealAnalysisRuns(first.log.id)).toHaveLength(2);
  });

  it('guarda la revisión profesional en meal_reviews y la copia al registro', async () => {
    const createdResponse = await app.request(
      '/api/patients/pat-sofia/meals/analyze',
      jsonRequest('POST', { slot: 'Almuerzo', description: 'pollo con arroz y ensalada' }),
    );
    const created = await createdResponse.json();
    const foods = [{ name: 'pollo al horno', portion_est: 140, portion_unit: 'g', confidence: 0.9 }];
    const macros = { kcal: 410, protein_g: 38, carbs_g: 35, fat_g: 12 };
    const reviewResponse = await app.request(
      `/api/patients/pat-sofia/meals/${created.log.id}`,
      jsonRequest('PATCH', { status: 'adjusted', foods, macros }),
    );
    const reviewed = await reviewResponse.json();
    expect(reviewResponse.status).toBe(200);
    expect(reviewed.log).toMatchObject({ status: 'adjusted', foods, macros });
    expect(listMealReviews(created.log.id)).toHaveLength(1);
    expect(listMealReviews(created.log.id)[0]).toMatchObject({ status: 'adjusted', foods });
  });
});
