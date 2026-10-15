import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { getPatientInvite, resetStore } from './store.js';

function createPatient(body: unknown) {
  return app.request('/api/patients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('patient onboarding in memory mode', () => {
  beforeEach(() => resetStore());

  it('creates a pending patient and a separate unsent invitation', async () => {
    const response = await createPatient({
      name: '  Ana Pérez  ',
      email: '  ANA.PEREZ@EXAMPLE.COM ',
      goal: '  Organizar sus comidas de la semana  ',
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.patient).toMatchObject({
      name: 'Ana Pérez',
      initials: 'AP',
      status: 'Ingreso',
      stage: 'ingreso',
      billing_status: 'pending',
      billing_until: null,
      goal: 'Organizar sus comidas de la semana',
      adherence_score: 0,
      todayPlan: [],
      weekPlan: [],
      meal_logs: [],
      habit_logs: [],
      messages: [],
    });
    expect(payload.patient).not.toHaveProperty('email');
    expect(payload.invite).toMatchObject({
      patient_id: payload.patient.id,
      email: 'ana.perez@example.com',
      status: 'not_sent',
    });
    expect(getPatientInvite(payload.patient.id)).toEqual(payload.invite);

    const listPayload = await (await app.request('/api/patients')).json();
    expect(listPayload.patients.some((patient: { id: string }) => patient.id === payload.patient.id)).toBe(true);
  });

  it('rejects malformed fields and duplicate pending invitation emails', async () => {
    expect((await createPatient({ name: 'A', email: 'no-es-email', goal: '' })).status).toBe(400);

    const input = { name: 'Ana Pérez', email: 'ana@example.com', goal: 'Ordenar horarios' };
    expect((await createPatient(input)).status).toBe(201);
    const duplicate = await createPatient({ ...input, name: 'Ana P.' });

    expect(duplicate.status).toBe(409);
    expect(await duplicate.json()).toEqual({ error: 'Ya existe una invitación para ese email' });
  });
});
