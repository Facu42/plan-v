import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { DEMO_NUTRITIONIST_ID, resetStore } from '../store.js';
import { CONSENT_CATALOG } from '../intake/consent.js';
import { getIntakeRecord, patchIntake } from '../intake/memory.js';
import { cancelAiJob, enqueueAiJob, failAiJob, startAiJob } from './repository.js';
import { mondayOf } from '../../src/types/plans.js';

const post = (path: string, body?: unknown, method = 'POST') => app.request(path, {
  method,
  headers: { 'Content-Type': 'application/json' },
  ...(body ? { body: JSON.stringify(body) } : {}),
});

async function consent() {
  const text = CONSENT_CATALOG.find((entry) => entry.purpose === 'ai_menu_draft')!;
  return post('/api/patients/pat-sofia/consents', {
    purpose: text.purpose,
    text_version: text.text_version,
    text_hash: text.text_hash,
    decision: 'granted',
  });
}

describe('evaluación al aplicar propuestas', () => {
  beforeEach(() => resetStore());

  it('eval.v1.16/20: un ingreso posterior deja la propuesta obsoleta', async () => {
    expect((await consent()).status).toBe(201);
    const jobId = randomUUID();
    expect((await post('/api/patients/pat-sofia/ai-jobs?audience=pro', { id: jobId, job_type: 'recipe' })).status).toBe(200);
    const current = getIntakeRecord('pat-sofia');
    patchIntake('pat-sofia', {
      expected_revision: current.revision,
      payload: { ...current.payload, allergies: { state: 'none', items: [] }, restrictions: { state: 'none', items: [] } },
    });
    const applied = await post(`/api/patients/pat-sofia/ai-jobs/${jobId}/apply?audience=pro`);
    expect(applied.status).toBe(409);
    expect(await applied.json()).toMatchObject({ error: expect.stringMatching(/cambió/i) });
  });

  it('eval.v1.17: no pisa una copia inédita ajena', async () => {
    expect((await consent()).status).toBe(201);
    const jobId = randomUUID();
    expect((await post('/api/patients/pat-sofia/ai-jobs?audience=pro', { id: jobId, job_type: 'menu' })).status).toBe(200);
    expect((await post('/api/patients/pat-sofia/plans?audience=pro', {
      id: randomUUID(),
      period_start: mondayOf(),
      slots: [{ day: 'Lunes', slot: 'Almuerzo', title: 'Wrap de pollo', recipe_id: null, servings: null }],
      expected_version: 0,
    }, 'PUT')).status).toBe(200);
    const applied = await post(`/api/patients/pat-sofia/ai-jobs/${jobId}/apply?audience=pro`);
    expect(applied.status).toBe(409);
    expect(await applied.json()).toMatchObject({ error: expect.stringMatching(/copia inédita/i) });
  });

  it('eval.v1.18: aplicar no publica y eval.v1.29/30 niegan al paciente', async () => {
    expect((await consent()).status).toBe(201);
    const jobId = randomUUID();
    const created = await post('/api/patients/pat-sofia/ai-jobs?audience=pro', { id: jobId, job_type: 'menu' });
    const body = await created.json();
    expect(body.job.evaluation.version).toBe('eval.v1');
    expect(body.job.evaluation.findings.some((item: { code: string }) => item.code === 'placeholder_content' || item.code === 'sparse_menu' || item.code === 'allergies_unknown')).toBe(true);
    expect((await post(`/api/patients/pat-sofia/ai-jobs/${jobId}/apply?audience=pro`)).status).toBe(200);
    expect((await (await app.request('/api/patients/pat-sofia/plans')).json()).published).toBeNull();
    expect((await app.request('/api/patients/pat-sofia/ai-jobs')).status).toBe(403);
    expect((await post(`/api/patients/pat-sofia/ai-jobs/${jobId}/apply`)).status).toBe(403);
  });

  it('eval.v1.19/22/23/24/25: un job abierto, fallido o cancelado no se aplica; el mismo id no duplica', async () => {
    const openId = randomUUID();
    await enqueueAiJob({
      id: openId, patientId: 'pat-sofia', jobType: 'recipe', promptVersion: 'recipe.v1',
      contextHash: 'a'.repeat(64), persistent: false, nutritionistId: DEMO_NUTRITIONIST_ID,
    });
    await expect(enqueueAiJob({
      id: randomUUID(), patientId: 'pat-sofia', jobType: 'recipe', promptVersion: 'recipe.v1',
      contextHash: 'b'.repeat(64), persistent: false, nutritionistId: DEMO_NUTRITIONIST_ID,
    })).rejects.toMatchObject({ status: 409 });

    const failId = randomUUID();
    await enqueueAiJob({
      id: failId, patientId: 'pat-sofia', jobType: 'menu', promptVersion: 'menu.v1',
      contextHash: 'c'.repeat(64), persistent: false, nutritionistId: DEMO_NUTRITIONIST_ID,
    });
    await startAiJob(failId, false, DEMO_NUTRITIONIST_ID);
    await failAiJob(failId, 'AI_UNAVAILABLE', false, DEMO_NUTRITIONIST_ID);
    expect((await post(`/api/patients/pat-sofia/ai-jobs/${failId}/apply?audience=pro`)).status).toBe(409);

    const cancelId = randomUUID();
    await enqueueAiJob({
      id: cancelId, patientId: 'pat-sofia', jobType: 'menu', promptVersion: 'menu.v1',
      contextHash: 'd'.repeat(64), persistent: false, nutritionistId: DEMO_NUTRITIONIST_ID,
    });
    await cancelAiJob(cancelId, false, DEMO_NUTRITIONIST_ID);
    expect((await post(`/api/patients/pat-sofia/ai-jobs/${cancelId}/apply?audience=pro`)).status).toBe(409);

    await cancelAiJob(openId, false, DEMO_NUTRITIONIST_ID);
    expect((await consent()).status).toBe(201);
    const sameId = randomUUID();
    expect((await post('/api/patients/pat-sofia/ai-jobs?audience=pro', { id: sameId, job_type: 'recipe' })).status).toBe(200);
    expect((await post('/api/patients/pat-sofia/ai-jobs?audience=pro', { id: sameId, job_type: 'recipe' })).status).toBe(200);
  });

  it('eval.v1.01 HTTP: una alergia explícita bloquea guardar', async () => {
    expect((await consent()).status).toBe(201);
    const current = getIntakeRecord('pat-sofia');
    patchIntake('pat-sofia', {
      expected_revision: current.revision,
      payload: { ...current.payload, allergies: { state: 'reported', items: ['lentejas'] }, restrictions: { state: 'none', items: [] } },
    });
    const jobId = randomUUID();
    const created = await post('/api/patients/pat-sofia/ai-jobs?audience=pro', { id: jobId, job_type: 'recipe' });
    expect(created.status).toBe(200);
    const body = await created.json();
    expect(body.job.evaluation.findings.some((item: { code: string; severity: string }) => item.code === 'allergy_hit' && item.severity === 'block')).toBe(true);
    const applied = await post(`/api/patients/pat-sofia/ai-jobs/${jobId}/apply?audience=pro`);
    expect(applied.status).toBe(409);
    expect((await (await app.request('/api/recipes?audience=pro')).json()).recipes).toEqual([]);
  });
});
