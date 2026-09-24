import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { DEMO_NUTRITIONIST_ID, getPatient, resetStore } from '../store.js';
import { declareKnownHealth } from '../test/declare-health.js';
import { evaluatePilotoActa, environmentLiveFlags } from './acta.js';

const sofia = 'pat-sofia';
const marina = 'pat-marina';
const RECIPE_TITLE = 'Ensalada PV-33 Sofía';
const MEAL = 'Tortilla PV-33';
const FAILED = 'Yogur PV-33 sin IA';
const MESSAGE = '¿Revisamos la merienda del circuito PV-33?';

function json(path: string, body?: unknown, init?: RequestInit) {
  return app.request(path, {
    method: body === undefined && !init?.method ? 'GET' : init?.method ?? 'POST',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...init,
  });
}

describe('PV-33 circuito E2E demo (Sofía / Marina)', () => {
  beforeEach(() => {
    resetStore();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('une receta, plan fechado, diario con IA caída, mensajes, turno, export y aislamiento; cobro MP ausente', async () => {
    expect(DEMO_NUTRITIONIST_ID).toBe('nutri-demo');
    expect(getPatient(sofia)?.id).toBe(sofia);
    expect(getPatient(marina)?.id).toBe(marina);

    await declareKnownHealth(sofia);
    await declareKnownHealth(marina, { state: 'none', items: [] });

    const recipeId = randomUUID();
    expect((await json('/api/recipes', {
      id: recipeId,
      title: RECIPE_TITLE,
      yield_portions: 2,
      steps: ['Lavar.', 'Mezclar.'],
      nutrient_source: 'Tabla del consultorio 2026',
      items: [{ name: 'Lechuga', quantity: 80, unit: 'g' }],
    })).status).toBe(200);
    expect((await json(`/api/recipes/${recipeId}/publish`, { expected_version: 99 })).status).toBe(400);
    expect((await json(`/api/recipes/${recipeId}/publish`, { expected_version: 1 })).status).toBe(200);
    expect((await json(`/api/recipes/${recipeId}/assign`, { patient_id: sofia, expected_version: 1 })).status).toBe(200);
    const sofiaRecipes = await (await json(`/api/patients/${sofia}/recipes`)).json() as { recipes: Array<{ title: string }> };
    expect(sofiaRecipes.recipes[0].title).toBe(RECIPE_TITLE);
    expect((await (await json(`/api/patients/${marina}/recipes`)).json()).recipes).toEqual([]);

    const planId = randomUUID();
    expect((await json(`/api/patients/${sofia}/plans`, {
      id: planId,
      period_start: '2026-09-21',
      period_end: '2026-09-27',
      items: [{ for_date: '2026-09-21', slot: 'Almuerzo', recipe_id: recipeId, portions: 1 }],
    })).status).toBe(200);
    expect((await json(`/api/plans/${planId}/publish`, { expected_version: 1 })).status).toBe(200);
    const published = await (await json(`/api/patients/${sofia}/plans`)).json() as { plan: { version: number } };
    expect(published.plan.version).toBe(1);
    expect((await (await json(`/api/patients/${marina}/plans`)).json()).plan).toBeNull();

    const logged = await json(`/api/patients/${sofia}/meals/analyze`, { slot: 'Almuerzo', description: MEAL });
    expect(logged.status).toBe(200);
    vi.stubEnv('AI_MODE', 'disabled');
    const failed = await json(`/api/patients/${sofia}/meals/analyze`, { slot: 'Merienda', description: FAILED });
    expect(failed.status).toBe(200);
    const failedBody = await failed.json() as { log: { foods: unknown[]; macros: null; description: string } };
    expect(failedBody.log).toMatchObject({ foods: [], macros: null, description: FAILED });
    expect(getPatient(sofia)?.meal_logs.some((log) => log.description === FAILED)).toBe(true);
    vi.stubEnv('AI_MODE', 'demo');

    expect((await json(`/api/patients/${sofia}/messages`, { text: MESSAGE, from: 'patient' })).status).toBe(200);
    expect((await json(`/api/patients/${sofia}/appointment`, {
      appointment: { day: 'Jueves', time: '14:30', duration: 45, channel: 'video' },
    }, { method: 'PUT' })).status).toBe(200);

    const exported = await json(`/api/patients/${sofia}/privacy/requests`, { kind: 'export' });
    expect(exported.status).toBe(201);
    const exportBody = await exported.json() as { request: { id: string } };
    expect((await json(`/api/patients/${marina}/privacy/requests/${exportBody.request.id}/package`)).status).toBe(404);
    expect((await json(`/api/patients/${sofia}/privacy/requests?audience=pro`, { kind: 'export' })).status).toBe(403);

    expect((await json('/api/webhooks/mercadopago', { type: 'payment' })).status).toBe(404);
    const waived = await json(`/api/patients/${sofia}/billing`, { status: 'waived' }, { method: 'PATCH' });
    expect(waived.status).toBe(200);

    const marinaPatient = await (await json(`/api/patients/${marina}`)).json() as {
      patient: { meal_logs: Array<{ description: string | null }>; messages: Array<{ text: string }> };
    };
    expect(marinaPatient.patient.meal_logs.some((log) => log.description === MEAL || log.description === FAILED)).toBe(false);
    expect(marinaPatient.patient.messages.some((message) => message.text === MESSAGE)).toBe(false);

    const acta = evaluatePilotoActa({
      demoCircuit: true,
      pgliteTwoNutritionists: true,
      viewportContracts: true,
      errorSimulation: true,
      ...environmentLiveFlags(),
    });
    expect(acta.verdict).toBe('go-synthetic-no-go-live');
  });
});
