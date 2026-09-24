import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { resetStore } from '../store.js';
import { CONSENT_CATALOG } from '../intake/consent.js';

const patient = 'pat-sofia';
const other = 'pat-marina';
const post = (path: string, body: unknown, method = 'POST') => app.request(path, {
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

async function declareAllergies() {
  const started = await app.request(`/api/patients/${patient}/intake`);
  const first = await started.json() as { intake: { revision: number } };
  await post(`/api/patients/${patient}/intake`, {
    expected_revision: first.intake.revision,
    step: 'allergies',
    payload: {
      preferred_name: 'Sofi',
      allergies: { state: 'none', items: [] },
      restrictions: { state: 'none', items: [] },
    },
  }, 'PATCH');
}

async function consentAi() {
  const text = CONSENT_CATALOG.find((entry) => entry.purpose === 'ai_menu_draft')!;
  return post(`/api/patients/${patient}/consents`, {
    purpose: text.purpose,
    text_version: text.text_version,
    text_hash: text.text_hash,
    decision: 'granted',
  });
}

describe('PV-27 jobs de IA versionados', () => {
  beforeEach(() => { resetStore(); });

  it('exige consentimiento y alergias, deja un borrador profesional y no publica', async () => {
    expect((await post('/api/ai/jobs', { patient_id: patient, job_type: 'recipe_draft' })).status).toBe(403);
    await consentAi();
    expect((await post('/api/ai/jobs', { patient_id: patient, job_type: 'recipe_draft' })).status).toBe(409);
    await declareAllergies();

    const created = await post('/api/ai/jobs', { patient_id: patient, job_type: 'recipe_draft', title_hint: 'Tortilla de verdura' });
    expect(created.status).toBe(202);
    const body = await created.json() as {
      job: {
        id: string;
        status: string;
        prompt_version: string;
        context_hash: string;
        cost_tokens: number;
        artifact: { kind: string; payload: { title: string; nutrient_source: string } };
      };
    };
    expect(body.job.status).toBe('succeeded');
    expect(body.job.prompt_version).toBe('recipe_draft.v1');
    expect(body.job.context_hash).toHaveLength(64);
    expect(body.job.cost_tokens).toBeGreaterThan(0);
    expect(body.job.artifact.kind).toBe('recipe_draft');
    expect(body.job.artifact.payload.nutrient_source).toBe('propuesta_ia.v1');
    expect(JSON.stringify(body)).not.toContain('Sofi');

    const applied = await post(`/api/ai/jobs/${body.job.id}/apply`, {});
    expect(applied.status).toBe(200);
    const catalog = await (await app.request('/api/recipes')).json() as {
      recipes: Array<{ title: string; status: string; current: { published_at: string | null; nutrient_source: string } }>;
    };
    expect(catalog.recipes[0].status).toBe('draft');
    expect(catalog.recipes[0].current.published_at).toBeNull();
    expect(catalog.recipes[0].current.nutrient_source).toBe('propuesta_ia.v1');
    expect((await (await app.request(`/api/patients/${patient}/recipes`)).json()).recipes).toEqual([]);

    const listed = await (await app.request(`/api/patients/${patient}/ai/jobs`)).json() as { jobs: Array<{ id: string }> };
    expect(listed.jobs[0].id).toBe(body.job.id);
    expect((await app.request(`/api/patients/${other}/ai/jobs`)).status).toBe(200);
  });

  it('genera un plan fechado en borrador y no lo publica', async () => {
    await consentAi();
    await declareAllergies();
    const created = await post('/api/ai/jobs', {
      patient_id: patient,
      job_type: 'menu_draft',
      period_start: '2026-09-21',
      period_end: '2026-09-22',
      slots: ['Almuerzo', 'Cena'],
    });
    expect(created.status).toBe(202);
    const body = await created.json() as { job: { id: string; prompt_version: string; status: string } };
    expect(body.job.prompt_version).toBe('menu_draft.v1');
    expect((await post(`/api/ai/jobs/${body.job.id}/apply`, {})).status).toBe(200);
    const pro = await (await app.request(`/api/patients/${patient}/plans?audience=pro`)).json() as {
      plan: { current: { published_at: string | null; items: Array<{ slot: string }> }; published: null };
    };
    expect(pro.plan.current.published_at).toBeNull();
    expect(pro.plan.published).toBeNull();
    expect(pro.plan.current.items.map((item) => item.slot)).toEqual(['Almuerzo', 'Cena']);
    expect((await (await app.request(`/api/patients/${patient}/plans`)).json()).plan).toBeNull();
  });

  it('rechaza una propuesta de menú y no permite aplicarla después', async () => {
    await consentAi();
    await declareAllergies();
    const created = await post('/api/ai/jobs', {
      patient_id: patient,
      job_type: 'menu_draft',
      period_start: '2026-09-21',
      period_end: '2026-09-22',
      slots: ['Almuerzo'],
    });
    const { job } = await created.json() as { job: { id: string; status: string } };
    expect(job.status).toBe('succeeded');
    const rejected = await post(`/api/ai/jobs/${job.id}/reject`, {});
    expect(rejected.status).toBe(200);
    expect((await rejected.json() as { job: { status: string; artifact: unknown } }).job)
      .toMatchObject({ status: 'cancelled', artifact: null });
    expect((await post(`/api/ai/jobs/${job.id}/apply`, {})).status).toBe(409);
    expect((await (await app.request(`/api/patients/${patient}/plans`)).json()).plan).toBeNull();
  });

  it('genera la propuesta sobre el ID del plan existente', async () => {
    await consentAi();
    await declareAllergies();
    const planId = randomUUID();
    const saved = await post(`/api/patients/${patient}/plans`, {
      id: planId,
      period_start: '2026-09-21',
      period_end: '2026-09-22',
      timezone: 'America/Argentina/Buenos_Aires',
      items: [{ for_date: '2026-09-21', slot: 'Almuerzo', free_text: 'Arroz con verduras' }],
    });
    expect(saved.status).toBe(200);
    const created = await post('/api/ai/jobs', {
      patient_id: patient,
      job_type: 'menu_draft',
      period_start: '2026-09-21',
      period_end: '2026-09-22',
      slots: ['Almuerzo'],
    });
    expect(created.status).toBe(202);
    const { job } = await created.json() as { job: { id: string; artifact: { payload: { id: string } } } };
    expect(job.artifact.payload.id).toBe(planId);
    expect((await post(`/api/ai/jobs/${job.id}/apply`, {})).status).toBe(200);
  });

  it('marca stale si cambia el ingreso, respeta la cola y no aplica el borrador', async () => {
    await consentAi();
    await declareAllergies();
    const { enqueueAiJob, runAiJob } = await import('./repository.js');
    const { DEMO_NUTRITIONIST_ID } = await import('../store.js');
    const queued = await enqueueAiJob(DEMO_NUTRITIONIST_ID, 'demo-nutri', { patient_id: patient, job_type: 'recipe_draft' }, false);
    expect(queued.status).toBe('queued');

    const intake = await (await app.request(`/api/patients/${patient}/intake`)).json() as { intake: { revision: number } };
    await post(`/api/patients/${patient}/intake`, {
      expected_revision: intake.intake.revision,
      payload: { allergies: { state: 'reported', items: ['Maní'] } },
    }, 'PATCH');

    const stale = await runAiJob(DEMO_NUTRITIONIST_ID, queued.id, false);
    expect(stale.status).toBe('stale');
    expect((await post(`/api/ai/jobs/${queued.id}/apply`, {})).status).toBe(409);

    await enqueueAiJob(DEMO_NUTRITIONIST_ID, 'demo-nutri', { patient_id: patient, job_type: 'recipe_draft' }, false);
    await enqueueAiJob(DEMO_NUTRITIONIST_ID, 'demo-nutri', { patient_id: patient, job_type: 'recipe_draft' }, false);
    await enqueueAiJob(DEMO_NUTRITIONIST_ID, 'demo-nutri', { patient_id: patient, job_type: 'recipe_draft' }, false);
    await expect(enqueueAiJob(DEMO_NUTRITIONIST_ID, 'demo-nutri', { patient_id: patient, job_type: 'recipe_draft' }, false))
      .rejects.toMatchObject({ status: 429 });
    expect((await post(`/api/ai/jobs/${randomUUID()}/apply`, {})).status).toBe(404);
  });
});
