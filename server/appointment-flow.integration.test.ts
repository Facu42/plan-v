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

describe('appointment API flow in memory mode', () => {
  beforeEach(() => {
    resetStore();
  });

  it('schedules the next appointment and records a timeline event', async () => {
    const response = await app.request(
      '/api/patients/pat-sofia/appointment',
      jsonRequest('PUT', { appointment: { day: 'Martes', time: '15:00', duration: 30, channel: 'presencial' } }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.patient.appointment).toMatchObject({ when: 'Martes · 15:00', duration: 30, channel: 'presencial' });
    expect(body.patient.appointment.starts_at).toBeTruthy();
    expect(body.patient.timeline[0]).toMatchObject({
      kind: 'appointment',
      title: 'Consulta · reprogramada',
      body: 'Martes · 15:00 · 30 min · presencial',
    });
    expect(body.patient.appointment_history[0]).toMatchObject({
      action: 'rescheduled',
      actor: 'pro',
      when: 'Jueves · 14:30',
    });

    expect(getPatient('pat-sofia')!.appointment?.when).toBe('Martes · 15:00');
  });

  it('lets the patient reschedule day and time without changing duration or channel', async () => {
    const response = await app.request(
      '/api/patients/pat-sofia/appointment/reschedule',
      jsonRequest('POST', { day: 'Viernes', time: '10:00' }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.patient.appointment).toMatchObject({
      when: 'Viernes · 10:00',
      duration: 45,
      channel: 'video',
    });
    expect(body.patient.timeline[0].title).toBe('Consulta · reprogramada por la paciente');
    expect(body.patient.appointment_history[0]).toMatchObject({
      action: 'patient_rescheduled',
      actor: 'patient',
      when: 'Jueves · 14:30',
    });

    const notices = await app.request('/api/notices?patientId=pat-sofia');
    const noticeBody = await notices.json();
    expect(notices.status).toBe(200);
    expect(noticeBody.notices[0]).toMatchObject({
      channel: 'email',
      to: 'aviso.demo@plan-v.local',
      kind: 'appointment',
    });
    expect(noticeBody.notices[0].subject).toContain('reprogramada por la paciente');
  });

  it('rejects a patient reschedule when there is no published appointment', async () => {
    await app.request('/api/patients/pat-sofia/appointment', jsonRequest('PUT', { appointment: null }));
    const response = await app.request(
      '/api/patients/pat-sofia/appointment/reschedule',
      jsonRequest('POST', { day: 'Viernes', time: '10:00' }),
    );
    expect(response.status).toBe(409);
  });

  it('cancels the appointment with a null payload', async () => {
    const response = await app.request(
      '/api/patients/pat-sofia/appointment',
      jsonRequest('PUT', { appointment: null }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.patient.appointment).toBeNull();
    expect(body.patient.timeline[0]).toMatchObject({
      kind: 'appointment',
      title: 'Consulta · cancelada',
    });
  });

  it('stores a safe HTTPS meeting link and rejects unsafe URLs', async () => {
    const valid = await app.request(
      '/api/patients/pat-sofia/appointment',
      jsonRequest('PUT', {
        appointment: {
          day: 'Martes',
          time: '15:00',
          duration: 30,
          channel: 'video',
          meet_url: ' https://meet.example.com/consulta-sofia ',
        },
      }),
    );
    const validBody = await valid.json();

    expect(valid.status).toBe(200);
    expect(validBody.patient.appointment).toMatchObject({
      when: 'Martes · 15:00',
      duration: 30,
      channel: 'video',
      meet_url: 'https://meet.example.com/consulta-sofia',
    });

    for (const meet_url of ['http://inseguro.example.com', 'javascript:alert(1)', 'meet.google.com/abc']) {
      const response = await app.request(
        '/api/patients/pat-sofia/appointment',
        jsonRequest('PUT', { appointment: { day: 'Martes', time: '15:00', duration: 30, channel: 'video', meet_url } }),
      );
      expect(response.status).toBe(400);
    }
  });

  it('rejects invalid appointment payloads with 400', async () => {
    for (const payload of [
      { appointment: { day: 'Feriado', time: '15:00', duration: 30, channel: 'video' } },
      { appointment: { day: 'Martes', time: '25:00', duration: 30, channel: 'video' } },
      { appointment: { day: 'Martes', time: '15:00', duration: 5, channel: 'video' } },
      { appointment: { day: 'Martes', time: '15:00', duration: 30, channel: 'sms' } },
    ]) {
      const response = await app.request('/api/patients/pat-sofia/appointment', jsonRequest('PUT', payload));
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'Datos inválidos' });
    }
  });

  it('blocks overlapping appointments for the same nutritionist', async () => {
    const response = await app.request(
      '/api/patients/pat-sofia/appointment',
      jsonRequest('PUT', { appointment: { day: 'Viernes', time: '11:00', duration: 45, channel: 'video' } }),
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'Ese horario se solapa con otra consulta del consultorio.' });
  });

  it('persists patient confirmation and rejects a late patient reschedule', async () => {
    const confirmed = await app.request(
      '/api/patients/pat-sofia/appointment/confirm',
      jsonRequest('POST', { confirmation: 'attending' }),
    );
    const confirmedBody = await confirmed.json();
    expect(confirmed.status).toBe(200);
    expect(confirmedBody.patient.appointment.confirmation).toBe('attending');

    const current = getPatient('pat-sofia')!;
    current.appointment = {
      ...current.appointment!,
      starts_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    };
    const late = await app.request(
      '/api/patients/pat-sofia/appointment/reschedule',
      jsonRequest('POST', { day: 'Viernes', time: '10:00' }),
    );
    expect(late.status).toBe(409);
    expect(await late.json()).toEqual({ error: 'Las reprogramaciones de la paciente necesitan 12 horas de anticipación.' });
  });
});
