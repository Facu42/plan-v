import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { getPatient, resetStore } from '../store.js';

function jsonRequest(method: string, body: unknown) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

describe('PV-25 turnos: timezone, confirmación y política', () => {
  beforeEach(() => resetStore());

  it('conserva duración y canal al reprogramar y no borra el historial previo', async () => {
    const scheduled = await app.request(
      '/api/patients/pat-sofia/appointment',
      jsonRequest('PUT', { appointment: { day: 'Martes', time: '15:00', duration: 30, channel: 'presencial' } }),
    );
    expect(scheduled.status).toBe(200);
    const moved = await app.request(
      '/api/patients/pat-sofia/appointment/reschedule',
      jsonRequest('POST', { day: 'Miércoles', time: '09:30' }),
    );
    const body = await moved.json();
    expect(moved.status).toBe(200);
    expect(body.patient.appointment).toMatchObject({
      when: 'Miércoles · 09:30',
      duration: 30,
      channel: 'presencial',
      timezone: 'America/Argentina/Buenos_Aires',
    });
    expect(body.patient.appointment_history.some((entry: { action: string; when: string }) => entry.action === 'patient_rescheduled' && entry.when === 'Martes · 15:00')).toBe(true);
    expect(body.patient.appointment_history.some((entry: { action: string }) => entry.action === 'rescheduled')).toBe(true);
  });

  it('no permite confirmar si no hay turno publicado', async () => {
    await app.request('/api/patients/pat-sofia/appointment', jsonRequest('PUT', { appointment: null }));
    const response = await app.request(
      '/api/patients/pat-sofia/appointment/confirm',
      jsonRequest('POST', { reply: 'attending' }),
    );
    expect(response.status).toBe(409);
  });
});
