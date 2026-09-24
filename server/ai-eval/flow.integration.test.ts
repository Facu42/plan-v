import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { CONSENT_CATALOG } from '../intake/consent.js';
import { declareKnownHealth } from '../test/declare-health.js';

const patient = 'pat-sofia';
const other = 'pat-marina';
const post = (path: string, body: unknown, method = 'POST') => app.request(path, {
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

async function consentAi() {
  const text = CONSENT_CATALOG.find((entry) => entry.purpose === 'ai_menu_draft')!;
  return post(`/api/patients/${patient}/consents`, {
    purpose: text.purpose,
    text_version: text.text_version,
    text_hash: text.text_hash,
    decision: 'granted',
  });
}

describe('PV-28 publicación con evaluación', () => {
  beforeEach(() => { resetStore(); });

  it('no publica un borrador de IA sin completar ni con alergia; apply no alcanza', async () => {
    await consentAi();
    await declareKnownHealth(patient, { state: 'reported', items: ['Maní'] });
    const created = await post('/api/ai/jobs', { patient_id: patient, job_type: 'recipe_draft', title_hint: 'Tortilla' });
    expect(created.status).toBe(202);
    const body = await created.json() as { job: { id: string } };
    expect((await post(`/api/ai/jobs/${body.job.id}/apply`, {})).status).toBe(200);
    const catalog = await (await app.request('/api/recipes')).json() as { recipes: Array<{ id: string; status: string; current: { version: number; published_at: string | null } }> };
    expect(catalog.recipes[0].status).toBe('draft');
    expect(catalog.recipes[0].current.published_at).toBeNull();
    const blocked = await post(`/api/recipes/${catalog.recipes[0].id}/publish`, { expected_version: 1 });
    expect(blocked.status).toBe(409);
    expect((await (await app.request(`/api/patients/${patient}/recipes`)).json()).recipes).toEqual([]);

    const menu = await post('/api/ai/jobs', {
      patient_id: patient,
      job_type: 'menu_draft',
      period_start: '2026-09-21',
      period_end: '2026-09-21',
      slots: ['Almuerzo'],
    });
    const menuBody = await menu.json() as { job: { id: string } };
    expect((await post(`/api/ai/jobs/${menuBody.job.id}/apply`, {})).status).toBe(200);
    const pro = await (await app.request(`/api/patients/${patient}/plans?audience=pro`)).json() as { plan: { id: string; current: { version: number; published_at: string | null } } };
    expect(pro.plan.current.published_at).toBeNull();
    expect((await post(`/api/plans/${pro.plan.id}/publish`, { expected_version: 1 })).status).toBe(409);
    expect((await (await app.request(`/api/patients/${patient}/plans`)).json()).plan).toBeNull();
  });

  it('bloquea alergias, faltantes y versión vieja; publica sólo tras revisión humana', async () => {
    await declareKnownHealth(patient, { state: 'reported', items: ['Maní'] });
    const recipeId = randomUUID();
    expect((await post('/api/recipes', {
      id: recipeId,
      title: 'Satay',
      yield_portions: 1,
      steps: ['Mezclar.'],
      items: [{ name: 'Salsa de maní', quantity: 30, unit: 'g' }],
    })).status).toBe(200);
    expect((await post(`/api/recipes/${recipeId}/publish`, { expected_version: 1 })).status).toBe(200);
    expect((await post(`/api/recipes/${recipeId}/assign`, { patient_id: patient, expected_version: 1 })).status).toBe(409);

    const safeId = randomUUID();
    expect((await post('/api/recipes', {
      id: safeId,
      title: 'Ensalada',
      yield_portions: 1,
      steps: ['Mezclar.'],
      items: [{ name: 'Lechuga', quantity: 80, unit: 'g' }],
    })).status).toBe(200);
    expect((await post(`/api/recipes/${safeId}/publish`, { expected_version: 99 })).status).toBe(400);
    expect((await post(`/api/recipes/${safeId}/publish`, { expected_version: 1 })).status).toBe(200);
    expect((await post(`/api/recipes/${safeId}/assign`, { patient_id: patient, expected_version: 1 })).status).toBe(200);

    const planId = randomUUID();
    expect((await post(`/api/patients/${patient}/plans`, {
      id: planId,
      period_start: '2026-09-21',
      period_end: '2026-09-27',
      items: [{ for_date: '2026-09-21', slot: 'Almuerzo', free_text: 'Tostada con maní', portions: 1 }],
    })).status).toBe(200);
    expect((await post(`/api/plans/${planId}/publish`, { expected_version: 1 })).status).toBe(409);

    expect((await post(`/api/patients/${patient}/plans`, {
      id: planId,
      period_start: '2026-09-21',
      period_end: '2026-09-27',
      items: [{ for_date: '2026-09-21', slot: 'Almuerzo', recipe_id: safeId, portions: 1 }],
    })).status).toBe(200);
    expect((await post(`/api/plans/${planId}/publish`, { expected_version: 1 })).status).toBe(200);
    expect((await post(`/api/patients/${patient}/plans`, {
      id: planId,
      period_start: '2026-09-21',
      period_end: '2026-09-27',
      items: [{ for_date: '2026-09-22', slot: 'Cena', free_text: 'Tortilla de verdura', portions: 1 }],
    })).status).toBe(200);
    expect((await post(`/api/plans/${planId}/publish`, { expected_version: 2 })).status).toBe(200);
    expect((await post(`/api/plans/${planId}/publish`, { expected_version: 1 })).status).toBe(409);
    expect((await (await app.request(`/api/patients/${patient}/plans`)).json()).plan.version).toBe(2);
    expect((await (await app.request(`/api/patients/${other}/plans`)).json()).plan).toBeNull();
  });

  it('revalida alergias si el ingreso cambia después del borrador', async () => {
    await declareKnownHealth(patient);
    const planId = randomUUID();
    expect((await post(`/api/patients/${patient}/plans`, {
      id: planId,
      period_start: '2026-09-21',
      period_end: '2026-09-21',
      items: [{ for_date: '2026-09-21', slot: 'Cena', free_text: 'Pollo con salsa de maní', portions: 1 }],
    })).status).toBe(200);
    const intake = await (await app.request(`/api/patients/${patient}/intake`)).json() as { intake: { revision: number } };
    await post(`/api/patients/${patient}/intake`, {
      expected_revision: intake.intake.revision,
      payload: { allergies: { state: 'reported', items: ['Maní'] } },
    }, 'PATCH');
    expect((await post(`/api/plans/${planId}/publish`, { expected_version: 1 })).status).toBe(409);
    expect((await (await app.request(`/api/patients/${patient}/plans`)).json()).plan).toBeNull();
  });
});
