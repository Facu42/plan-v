import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { getPatient, resetStore } from './store.js';

function postActivity(body: unknown, patientId = 'pat-sofia') {
  return app.request(`/api/patients/${patientId}/activities`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}

describe('patient activity API flow in memory mode', () => {
  beforeEach(() => resetStore());

  it('stores a self-reported activity and returns a patient-safe view', async () => {
    const beforeOther = getPatient('pat-marina')?.activity_logs?.length ?? 0;
    const response = await postActivity({ activity: '  Caminata al aire libre  ', duration_minutes: 35, intensity: 'moderada', note: '  Me sentí bien  ' });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.patient).not.toHaveProperty('adherence_why');
    expect(body.patient.activity_logs[0]).toMatchObject({
      patient_id: 'pat-sofia', activity: 'Caminata al aire libre', duration_minutes: 35,
      intensity: 'moderada', note: 'Me sentí bien',
    });
    expect(body.patient.activity_logs[0].logged_at).toBeTruthy();
    expect(getPatient('pat-sofia')?.activity_logs?.[0]).toEqual(body.patient.activity_logs[0]);
    expect(getPatient('pat-marina')?.activity_logs?.length ?? 0).toBe(beforeOther);
  });

  it('validates duration, intensity and text, and returns 404 for unknown patients', async () => {
    expect((await postActivity({ activity: '', duration_minutes: 30, intensity: 'moderada' })).status).toBe(400);
    expect((await postActivity({ activity: 'Caminata', duration_minutes: 0, intensity: 'moderada' })).status).toBe(400);
    expect((await postActivity({ activity: 'Caminata', duration_minutes: 30, intensity: 'extrema' })).status).toBe(400);
    expect((await postActivity({ activity: 'Caminata', duration_minutes: 30, intensity: 'suave' }, 'missing')).status).toBe(404);
  });

  it('deletes only the patient own activity and never touches another patient', async () => {
    await postActivity({ activity: 'Caminata', duration_minutes: 30, intensity: 'suave' });
    const created = getPatient('pat-sofia')?.activity_logs?.[0];
    expect(created).toBeTruthy();
    const otherBefore = getPatient('pat-marina')?.activity_logs?.length ?? 0;

    const wrongPatient = await app.request(`/api/patients/pat-marina/activities/${created!.id}`, { method: 'DELETE' });
    expect(wrongPatient.status).toBe(404);

    const response = await app.request(`/api/patients/pat-sofia/activities/${created!.id}`, { method: 'DELETE' });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.patient.activity_logs ?? []).toHaveLength(0);
    expect(body.patient).not.toHaveProperty('adherence_why');
    expect(getPatient('pat-sofia')?.activity_logs ?? []).toHaveLength(0);
    expect(getPatient('pat-marina')?.activity_logs?.length ?? 0).toBe(otherBefore);

    const repeated = await app.request(`/api/patients/pat-sofia/activities/${created!.id}`, { method: 'DELETE' });
    expect(repeated.status).toBe(404);
  });
});
