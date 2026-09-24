import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { CONSENT_CATALOG } from './intake/consent.js';
import { resetIntakeMemory } from './intake/memory.js';
import { getPatient, resetStore } from './store.js';

const PRIVATE_NOTE = 'Nota profesional ficticia: confirmar maní en consulta.';
const PLAN_TITLE = 'Bowl de lentejas ficticio';

function json(path: string, body?: unknown, init?: RequestInit) {
  return app.request(path, {
    method: body === undefined && !init?.method ? 'GET' : init?.method ?? 'POST',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...init,
  });
}

describe('circuito invitación → ingreso → revisión → plan publicado (demo memoria)', () => {
  beforeEach(() => {
    resetStore();
    resetIntakeMemory();
  });

  it('alta con invitación de un uso, declaración, nota privada y menú publicado', async () => {
    const created = await json('/api/patients', {
      name: 'Ana Corte',
      email: 'ana.corte@example.test',
      goal: 'Regular horarios de comida',
    });
    expect(created.status).toBe(201);
    const payload = await created.json() as { patient: { id: string; weekPlan: unknown[] }; invite: { id: string; email: string; status: string } };
    expect(payload.invite.email).toBe('ana.corte@example.test');
    expect(payload.invite.status).toBe('not_sent');
    expect(payload.patient.weekPlan).toEqual([]);

    const sent = await json(`/api/invites/${payload.invite.id}/send`, {});
    expect(sent.status).toBe(200);
    expect((await sent.json() as { invite: { status: string; expires_at: string | null } }).invite.status).toBe('pending');
    expect((await json('/api/invites/accept', { invite_id: payload.invite.id })).status).toBe(401);

    const id = payload.patient.id;
    const started = await json(`/api/patients/${id}/intake`);
    expect(started.status).toBe(200);
    const first = await started.json() as { intake: { revision: number } };
    const saved = await json(`/api/patients/${id}/intake`, {
      expected_revision: first.intake.revision,
      step: 'allergies',
      payload: {
        preferred_name: 'Ana',
        patient_intent: 'Quiero regular horarios',
        allergies: { state: 'reported', items: ['Maní'] },
        restrictions: { state: 'none', items: [] },
      },
    }, { method: 'PATCH' });
    expect(saved.status).toBe(200);
    const draft = await saved.json() as { intake: { revision: number } };

    const care = CONSENT_CATALOG.find((entry) => entry.purpose === 'care_relationship')!;
    expect((await json(`/api/patients/${id}/consents`, {
      purpose: care.purpose,
      text_version: care.text_version,
      text_hash: care.text_hash,
      decision: 'granted',
    })).status).toBe(201);

    const submitted = await json(`/api/patients/${id}/intake/submit`, { expected_revision: draft.intake.revision });
    expect(submitted.status).toBe(200);
    const submittedBody = await submitted.json() as { intake: { status: string; revision: number } };
    expect(submittedBody.intake.status).toBe('submitted');

    expect((await json(`/api/patients/${id}/clinical-notes`, { body: PRIVATE_NOTE })).status).toBe(201);
    const reviewed = await json(`/api/patients/${id}/intake/review`, { expected_revision: submittedBody.intake.revision });
    expect(reviewed.status).toBe(200);
    expect((await reviewed.json() as { intake: { status: string } }).intake.status).toBe('reviewed');

    const patientIntake = JSON.stringify(await (await json(`/api/patients/${id}/intake`)).json());
    expect(patientIntake).not.toContain(PRIVATE_NOTE);
    expect(patientIntake).not.toContain('reviewed_by');

    const menu = await json(`/api/patients/${id}/menu`, { day: 'Lunes', slot: 'Almuerzo', title: PLAN_TITLE }, { method: 'PATCH' });
    expect(menu.status).toBe(200);
    const published = await menu.json() as { patient: { weekPlan: Array<{ day: string; meals: Array<{ slot: string; title: string }> }> } };
    const monday = published.patient.weekPlan.find((day) => day.day === 'Lunes');
    expect(monday?.meals).toEqual([{ slot: 'Almuerzo', title: PLAN_TITLE }]);
    expect(getPatient(id)?.weekPlan.find((day) => day.day === 'Lunes')?.meals).toEqual([{ slot: 'Almuerzo', title: PLAN_TITLE }]);

    const sofia = getPatient('pat-sofia')!;
    expect(sofia.weekPlan.some((day) => day.meals.some((meal) => meal.title === PLAN_TITLE))).toBe(false);
    const marina = getPatient('pat-marina');
    if (marina) {
      expect(marina.weekPlan.some((day) => day.meals.some((meal) => meal.title === PLAN_TITLE))).toBe(false);
    }
  });
});
