import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { getPatient, resetStore } from './store.js';

function jsonRequest(method: string, body: unknown) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

describe('patient profile API flow in memory mode', () => {
  beforeEach(() => {
    resetStore();
  });

  it('updates the editable patient profile and recalculates initials', async () => {
    const response = await app.request('/api/patients/pat-sofia/profile', jsonRequest('PATCH', {
      name: 'Ana López',
      status: 'En seguimiento',
      stage: 'seguimiento',
      sensitive_hours: 'Después de las 19:00',
      plan_b: 'Tostada integral con huevo',
      next_focus: 'Preparar cenas con anticipación',
    }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.patient).toMatchObject({
      name: 'Ana López',
      initials: 'AL',
      status: 'En seguimiento',
      stage: 'seguimiento',
      sensitive_hours: 'Después de las 19:00',
      plan_b: 'Tostada integral con huevo',
      next_focus: 'Preparar cenas con anticipación',
    });
    expect(body.patient.timeline[0]).toMatchObject({
      kind: 'profile',
      title: 'Paciente · ficha actualizada',
    });
    expect(getPatient('pat-sofia')!.name).toBe('Ana López');
  });

  it('archives and restores a patient without deleting the record', async () => {
    const archivedResponse = await app.request(
      '/api/patients/pat-sofia/archive',
      jsonRequest('PATCH', { archived: true }),
    );
    expect(archivedResponse.status).toBe(200);
    const archived = await archivedResponse.json();
    expect(archived.patient.archived_at).toEqual(expect.any(String));
    expect(archived.patient.timeline[0]).toMatchObject({ kind: 'profile', title: 'Paciente · archivado' });

    const restoredResponse = await app.request(
      '/api/patients/pat-sofia/archive',
      jsonRequest('PATCH', { archived: false }),
    );
    expect(restoredResponse.status).toBe(200);
    const restored = await restoredResponse.json();
    expect(restored.patient.archived_at).toBeNull();
    expect(restored.patient.timeline[0]).toMatchObject({ kind: 'profile', title: 'Paciente · restaurado' });
  });

  it('rejects empty or invalid profile and archive payloads', async () => {
    const requests: Array<[string, unknown]> = [
      ['/api/patients/pat-sofia/profile', {}],
      ['/api/patients/pat-sofia/profile', { name: 'A' }],
      ['/api/patients/pat-sofia/profile', { stage: 'borrado' }],
      ['/api/patients/pat-sofia/profile', { plan_b: 'x'.repeat(241) }],
      ['/api/patients/pat-sofia/archive', {}],
      ['/api/patients/pat-sofia/archive', { archived: 'sí' }],
    ];

    for (const [path, payload] of requests) {
      const response = await app.request(path, jsonRequest('PATCH', payload));
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Datos inválidos' });
    }
  });
});
