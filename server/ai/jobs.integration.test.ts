import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { CONSENT_CATALOG } from '../intake/consent.js';

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

describe('propuestas de receta y menú', () => {
  beforeEach(() => resetStore());

  it('exige permiso, deja la propuesta inédita y no la muestra al paciente', async () => {
    const recipeId = randomUUID();
    expect((await post('/api/patients/pat-sofia/ai-jobs', { id: recipeId, job_type: 'recipe' })).status).toBe(403);
    expect((await post('/api/patients/pat-sofia/ai-jobs?audience=pro', { id: recipeId, job_type: 'recipe' })).status).toBe(403);
    expect((await consent()).status).toBe(201);
    const created = await post('/api/patients/pat-sofia/ai-jobs?audience=pro', { id: recipeId, job_type: 'recipe' });
    expect(created.status).toBe(200);
    const body = await created.json();
    expect(body.job).toMatchObject({ job_type: 'recipe', status: 'succeeded', prompt_version: 'recipe.v1' });
    expect(body.job.evaluation.version).toBe('eval.v1');
    expect(body.job.artifact.payload.title).toContain('Propuesta demo');
    expect(body.job).not.toHaveProperty('nutritionist_id');
    expect(JSON.stringify(body)).not.toContain('Sofía');
    expect((await post('/api/patients/pat-sofia/ai-jobs?audience=pro', { id: recipeId, job_type: 'recipe' })).status).toBe(200);
    expect((await post(`/api/patients/pat-sofia/ai-jobs/${recipeId}/apply?audience=pro`)).status).toBe(200);
    expect((await (await app.request('/api/patients/pat-sofia/recipes')).json()).recipes).toEqual([]);
    const catalog = await (await app.request('/api/recipes?audience=pro')).json();
    expect(catalog.recipes[0]).toMatchObject({ title: body.job.artifact.payload.title, published_at: null });

    const menuId = randomUUID();
    const menu = await post('/api/patients/pat-sofia/ai-jobs?audience=pro', { id: menuId, job_type: 'menu' });
    expect(menu.status).toBe(200);
    const menuBody = await menu.json();
    expect(menuBody.job.artifact.payload.slots.length).toBeGreaterThan(0);
    expect((await post(`/api/patients/pat-sofia/ai-jobs/${menuId}/apply?audience=pro`)).status).toBe(200);
    const patientPlan = await (await app.request('/api/patients/pat-sofia/plans')).json();
    expect(patientPlan.published).toBeNull();
    expect(patientPlan.open).toBeNull();
    const proPlan = await (await app.request('/api/patients/pat-sofia/plans?audience=pro')).json();
    expect(proPlan.open.slots[0].title).toContain('Propuesta demo');
    expect((await app.request('/api/patients/pat-sofia/ai-jobs')).status).toBe(403);
  });
});
