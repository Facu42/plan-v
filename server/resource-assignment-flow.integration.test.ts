import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { getPatient, resetStore } from './store.js';

const postJson = (path: string, body?: unknown) => app.request(path, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

describe('resource assignment API flow in memory mode', () => {
  beforeEach(() => resetStore());

  it('assigns one editorial guide to one or many patients without duplicates', async () => {
    const path = '/api/resources/assign';
    const payload = { resource_id: 'leer-plan-semanal', patient_ids: ['pat-sofia', 'pat-marina'] };
    const response = await postJson(path, payload);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ assigned_count: 2, existing_count: 0, source: 'memory' });
    expect(body.patients.map((patient: { id: string }) => patient.id)).toEqual(['pat-sofia', 'pat-marina']);
    expect(getPatient('pat-sofia')?.resource_assignments).toHaveLength(1);
    expect(getPatient('pat-marina')?.resource_assignments).toHaveLength(1);

    const repeated = await postJson(path, payload);
    expect(repeated.status).toBe(200);
    expect(await repeated.json()).toMatchObject({ assigned_count: 0, existing_count: 2 });
    expect(getPatient('pat-sofia')?.resource_assignments).toHaveLength(1);
  });

  it('marks only an assigned guide as read and returns a patient-safe view', async () => {
    await postJson('/api/resources/assign', { resource_id: 'leer-plan-semanal', patient_ids: ['pat-sofia'] });
    const response = await postJson('/api/patients/pat-sofia/resources/leer-plan-semanal/read');
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.patient).not.toHaveProperty('adherence_why');
    expect(body.patient).not.toHaveProperty('goal_history');
    expect(body.patient.resource_assignments[0]).toMatchObject({
      patient_id: 'pat-sofia', resource_id: 'leer-plan-semanal',
    });
    expect(body.patient.resource_assignments[0].read_at).toBeTruthy();
    expect(getPatient('pat-sofia')?.resource_assignments?.[0].read_at).toBeTruthy();
    expect(getPatient('pat-marina')?.resource_assignments ?? []).toEqual([]);
  });

  it('rejects unknown guides, duplicate patient ids and partial bulk writes', async () => {
    expect((await postJson('/api/resources/assign', { resource_id: 'no-existe', patient_ids: ['pat-sofia'] })).status).toBe(400);
    expect((await postJson('/api/resources/assign', { resource_id: 'leer-plan-semanal', patient_ids: ['pat-sofia', 'pat-sofia'] })).status).toBe(400);

    const response = await postJson('/api/resources/assign', {
      resource_id: 'leer-plan-semanal', patient_ids: ['pat-sofia', 'missing'],
    });
    expect(response.status).toBe(404);
    expect(getPatient('pat-sofia')?.resource_assignments ?? []).toEqual([]);
    expect((await postJson('/api/patients/pat-sofia/resources/leer-plan-semanal/read')).status).toBe(404);
  });
});
