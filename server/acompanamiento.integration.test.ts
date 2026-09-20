import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from './index.js';
import { CONSENT_CATALOG, type ConsentPurpose } from './intake/consent.js';
import { resetIntakeMemory } from './intake/memory.js';
import { getPatient, resetStore } from './store.js';

const sofia = 'pat-sofia';
const marina = 'pat-marina';
const MEAL = 'Tortilla de calabaza corte 2';
const FAILED = 'Yogur natural corte 2';
const MESSAGE = '¿Podemos revisar la merienda esta semana?';
const REPLY = 'Sí, lo vemos en la consulta.';
const ALLERGEN = 'Maní';

function json(path: string, body?: unknown, init?: RequestInit) {
  return app.request(path, {
    method: body === undefined && !init?.method ? 'GET' : init?.method ?? 'POST',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...init,
  });
}

async function consent(patientId: string, purpose: ConsentPurpose, decision: 'granted' | 'withdrawn' = 'granted') {
  const entry = CONSENT_CATALOG.find((item) => item.purpose === purpose)!;
  return json(`/api/patients/${patientId}/consents`, {
    purpose,
    text_version: entry.text_version,
    text_hash: entry.text_hash,
    decision,
  });
}

describe('acompañamiento conectado (demo memoria)', () => {
  beforeEach(() => {
    resetStore();
    resetIntakeMemory();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('une diario, mensajes, agenda, reemplazo publicado y aislamiento', async () => {
    const started = await json(`/api/patients/${sofia}/intake`);
    expect(started.status).toBe(200);
    const first = await started.json() as { intake: { revision: number } };
    const saved = await json(`/api/patients/${sofia}/intake`, {
      expected_revision: first.intake.revision,
      step: 'allergies',
      payload: {
        preferred_name: 'Sofi',
        allergies: { state: 'reported', items: [ALLERGEN] },
        restrictions: { state: 'none', items: [] },
      },
    }, { method: 'PATCH' });
    expect(saved.status).toBe(200);

    const logged = await json(`/api/patients/${sofia}/meals/analyze`, { slot: 'Almuerzo', description: MEAL });
    expect(logged.status).toBe(200);
    const created = await logged.json() as { log: { id: string; status: string; foods: unknown[] }; analysis: { note_for_nutri?: string } };
    expect(created.log.status).toBe('pending_review');
    expect(created.log.foods.length).toBeGreaterThan(0);
    expect(created.analysis).not.toHaveProperty('note_for_nutri');

    const review = await json(`/api/patients/${sofia}/meals/${created.log.id}`, {
      status: 'adjusted',
      foods: [{ name: 'tortilla de calabaza', portion_est: 180, portion_unit: 'g', confidence: 0.9 }],
      macros: { kcal: 320, protein_g: 18, carbs_g: 28, fat_g: 14 },
    }, { method: 'PATCH' });
    expect(review.status).toBe(200);
    expect((await review.json() as { log: { status: string } }).log.status).toBe('adjusted');

    vi.stubEnv('AI_MODE', 'disabled');
    const failed = await json(`/api/patients/${sofia}/meals/analyze`, { slot: 'Merienda', description: FAILED });
    const failedBody = await failed.json() as { log: { id: string; foods: unknown[]; macros: null; confidence: number } };
    expect(failed.status).toBe(200);
    expect(failedBody.log).toMatchObject({ foods: [], macros: null, confidence: 0 });
    expect(getPatient(sofia)?.meal_logs.find((log) => log.description === FAILED)?.note_for_nutri).toMatch(/no está disponible/i);
    vi.stubEnv('AI_MODE', 'demo');

    const fromPatient = await json(`/api/patients/${sofia}/messages`, { text: MESSAGE, from: 'patient', suggested_by_ai: true });
    expect(fromPatient.status).toBe(200);
    const fromPro = await json(`/api/patients/${sofia}/messages`, { text: REPLY, from: 'vero', suggested_by_ai: true });
    expect(fromPro.status).toBe(200);
    const reread = await json(`/api/patients/${sofia}`);
    expect(reread.status).toBe(200);
    const rereadBody = await reread.json() as { patient: { messages: Array<{ from: string; text: string; suggested_by_ai?: boolean }> } };
    expect(rereadBody.patient.messages.map((message) => message.text)).toEqual(expect.arrayContaining([MESSAGE, REPLY]));
    const storedPatientMessage = getPatient(sofia)?.messages.find((message) => message.text === MESSAGE);
    expect(storedPatientMessage?.suggested_by_ai).toBe(false);
    const storedProMessage = getPatient(sofia)?.messages.find((message) => message.text === REPLY);
    expect(storedProMessage?.suggested_by_ai).toBe(true);

    const rescheduled = await json(`/api/patients/${sofia}/appointment/reschedule`, { day: 'Viernes', time: '11:00' });
    expect(rescheduled.status).toBe(200);
    expect((await rescheduled.json() as { patient: { appointment: { when: string; duration: number; channel: string } } }).patient.appointment).toMatchObject({
      when: 'Viernes · 11:00',
      duration: 45,
      channel: 'video',
    });

    expect((await consent(sofia, 'ai_menu_draft')).status).toBe(201);
    const requestId = randomUUID();
    const requested = await json(`/api/patients/${sofia}/care/records`, {
      id: requestId,
      recorded_on: '2026-09-10',
      data: { kind: 'menu_request', target: 'Almuerzo', reason: 'Quiero una alternativa sin maní', replacement: 'recipe' },
    });
    expect(requested.status).toBe(200);

    const generated = await json(`/api/patients/${sofia}/care/replacements/${requestId}/generate`, {});
    expect(generated.status).toBe(200);
    const proposal = await generated.json() as { replacement: { id: string; source: string; published_at: string | null; recipe: { title: string; ingredients: string[]; steps: string[] } }; job_id?: string };
    expect(proposal.job_id).toBeTruthy();
    expect(proposal.replacement.source).toBe('demo');
    expect(proposal.replacement.published_at).toBeNull();
    expect(JSON.stringify(proposal.replacement.recipe)).not.toMatch(new RegExp(ALLERGEN, 'i'));

    const patientCare = await (await json(`/api/patients/${sofia}/care`)).json() as { replacements: unknown[] };
    expect(patientCare.replacements).toEqual([]);
    const proCare = await (await json(`/api/patients/${sofia}/care?audience=pro`)).json() as { replacements: Array<{ id: string }> };
    expect(proCare.replacements).toHaveLength(1);

    const publishedTitle = 'Ensalada de lentejas revisada';
    const publish = {
      expected_recipe: proposal.replacement.recipe,
      recipe: { ...proposal.replacement.recipe, title: publishedTitle },
    };
    expect((await json(`/api/patients/${sofia}/care/replacements/${proposal.replacement.id}/publish`, publish)).status).toBe(200);
    const afterPublish = await (await json(`/api/patients/${sofia}/care`)).json() as { replacements: Array<{ recipe: { title: string }; published_at: string | null }> };
    expect(afterPublish.replacements).toHaveLength(1);
    expect(afterPublish.replacements[0].recipe.title).toBe(publishedTitle);
    expect(afterPublish.replacements[0].published_at).toBeTruthy();
    expect(JSON.stringify(afterPublish.replacements[0].recipe)).not.toMatch(new RegExp(ALLERGEN, 'i'));

    const marinaPatient = await (await json(`/api/patients/${marina}`)).json() as { patient: { meal_logs: Array<{ description: string | null }>; messages: Array<{ text: string }> } };
    expect(marinaPatient.patient.meal_logs.some((log) => log.description === MEAL || log.description === FAILED)).toBe(false);
    expect(marinaPatient.patient.messages.some((message) => message.text === MESSAGE || message.text === REPLY)).toBe(false);
    const marinaCare = await (await json(`/api/patients/${marina}/care`)).json() as { replacements: Array<{ recipe: { title: string } }> };
    expect(marinaCare.replacements.some((entry) => entry.recipe.title === publishedTitle)).toBe(false);
  });
});
