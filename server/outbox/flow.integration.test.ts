import { beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { app } from '../index.js';
import { resetStore, updatePatient } from '../store.js';
import { markMemoryUnlinked, memoryHasSentEmailOrPush } from './memory.js';
import { CareError, outboxDbError } from './repository.js';

const patient = 'pat-sofia';
const other = 'pat-marina';

function json(path: string, body?: unknown, init?: RequestInit) {
  return app.request(path, {
    method: body === undefined && !init?.method ? 'GET' : init?.method ?? 'POST',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...init,
  });
}

type Snapshot = {
  events: Array<{
    event: { id: string; event_type: string; client_id: string; payload: { subject: string } };
    deliveries: Array<{
      channel: string;
      status: string;
      skip_reason: string | null;
      last_error: string | null;
      sent_at: string | null;
      attempt: number;
    }>;
  }>;
  providers: { email: boolean; push: boolean };
};

beforeEach(() => {
  resetStore();
});

describe('PV-26 outbox en memoria', () => {
  it('encola email/push sin enviarlos, completa in-app y no duplica client_id', async () => {
    const clientId = randomUUID();
    const created = await json('/api/outbox', {
      patient_id: patient,
      event_type: 'appointment_scheduled',
      client_id: clientId,
      subject: 'Consulta el jueves',
      body: 'Turno publicado. Este aviso quedó en el buzón in-app.',
      kind: 'appointment',
    });
    expect(created.status).toBe(201);
    const body = await created.json() as { deliveries: Snapshot['events'][0]['deliveries']; providers: Snapshot['providers'] };
    expect(body.providers).toEqual({ email: false, push: false, reason: 'provider_unconfigured' });
    expect(body.deliveries.find((row) => row.channel === 'in_app')).toMatchObject({ status: 'sent', sent_at: expect.any(String) });
    expect(body.deliveries.find((row) => row.channel === 'email')).toMatchObject({ status: 'skipped', skip_reason: 'pref_off' });
    expect(body.deliveries.find((row) => row.channel === 'push')).toMatchObject({ status: 'skipped', skip_reason: 'pref_off' });

    const prefs = await json(`/api/notification-preferences?patientId=${patient}`, {
      in_app: true, email: true, push: true,
    }, { method: 'PUT' });
    expect(prefs.status).toBe(200);

    const opted = await json('/api/outbox', {
      patient_id: patient,
      event_type: 'reminder',
      client_id: randomUUID(),
      subject: 'Recordatorio de agua',
      body: 'Tomá agua. No se envió a internet.',
      kind: 'reminder',
    });
    const optedBody = await opted.json() as { deliveries: Snapshot['events'][0]['deliveries'] };
    expect(optedBody.deliveries.find((row) => row.channel === 'email')).toMatchObject({ status: 'queued', sent_at: null });
    expect(optedBody.deliveries.find((row) => row.channel === 'push')).toMatchObject({ status: 'queued', sent_at: null });

    const drained = await json('/api/outbox/drain', {});
    expect(drained.status).toBe(200);
    const drainBody = await drained.json() as { deliveries: Array<{ channel: string; status: string; last_error: string | null; sent_at: string | null; attempt: number }> };
    expect(drainBody.deliveries.every((row) => row.channel !== 'in_app' || row.status === 'sent')).toBe(true);
    expect(drainBody.deliveries.filter((row) => row.channel === 'email' || row.channel === 'push')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'queued', last_error: 'provider_unconfigured', sent_at: null, attempt: 0 }),
      ]),
    );

    const replay = await json('/api/outbox', {
      patient_id: patient,
      event_type: 'appointment_scheduled',
      client_id: clientId,
      subject: 'Consulta el jueves',
      body: 'Turno publicado. Este aviso quedó en el buzón in-app.',
      kind: 'appointment',
    });
    expect(replay.status).toBe(201);
    const mismatch = await json('/api/outbox', {
      patient_id: patient,
      event_type: 'appointment_scheduled',
      client_id: clientId,
      subject: 'Otro asunto',
      body: 'Turno publicado. Este aviso quedó en el buzón in-app.',
      kind: 'appointment',
    });
    expect(mismatch.status).toBe(409);

    const mailbox = await (await json(`/api/notices?patientId=${patient}`)).json() as { notices: Array<{ kind: string; channel: string; to: string }>; source: string };
    expect(mailbox.source).toBe('memory');
    expect(mailbox.notices[0]).toMatchObject({ channel: 'email', to: 'aviso.demo@plan-v.local' });
    expect(mailbox.notices.some((notice) => notice.kind === 'appointment')).toBe(true);
    expect((await (await json(`/api/notices?patientId=${other}`)).json()).notices).toEqual([]);
    expect(memoryHasSentEmailOrPush(patient)).toBe(false);
  });

  it('salta paciente desactivado o desvinculado y no marca email/push como enviados', async () => {
    updatePatient(patient, { deactivated_at: new Date().toISOString() });
    const deactivated = await json('/api/outbox', {
      patient_id: patient,
      event_type: 'reminder',
      client_id: randomUUID(),
      subject: 'No enviar',
      body: 'Paciente desactivado.',
      kind: 'reminder',
    });
    expect(deactivated.status).toBe(201);
    const skipped = await deactivated.json() as { deliveries: Array<{ status: string; skip_reason: string | null }> };
    expect(skipped.deliveries.every((row) => row.status === 'skipped' && row.skip_reason === 'deactivated')).toBe(true);

    resetStore();
    markMemoryUnlinked(patient);
    const unlinked = await json('/api/outbox', {
      patient_id: patient,
      event_type: 'invite_sent',
      client_id: randomUUID(),
      subject: 'Invitación',
      body: 'Paciente desvinculado.',
      kind: 'invite',
    });
    const unlinkedBody = await unlinked.json() as { deliveries: Array<{ status: string; skip_reason: string | null; sent_at: string | null }> };
    expect(unlinkedBody.deliveries.every((row) => row.status === 'skipped' && row.skip_reason === 'unlinked' && row.sent_at === null)).toBe(true);
    expect(memoryHasSentEmailOrPush()).toBe(false);
  });

  it('engancha turno, mensaje e invitación al buzón in-app', async () => {
    expect((await json(`/api/patients/${patient}/appointment`, {
      appointment: { day: 'Martes', time: '15:00', duration: 30, channel: 'presencial' },
    }, { method: 'PUT' })).status).toBe(200);
    expect((await json(`/api/patients/${patient}/messages`, {
      text: '¿Confirmamos el martes?',
      from: 'patient',
      client_id: randomUUID(),
    })).status).toBe(200);

    const created = await json('/api/patients', { name: 'Nueva', email: 'nueva@plan-v.test', goal: 'Seguimiento' });
    expect(created.status).toBe(201);
    const createdBody = await created.json() as { invite: { id: string; patient_id: string } };
    expect((await json(`/api/invites/${createdBody.invite.id}/send`, {})).status).toBe(200);

    const snapshot = await (await json(`/api/outbox?patientId=${patient}`)).json() as Snapshot;
    expect(snapshot.events.some((row) => row.event.event_type === 'appointment_rescheduled' || row.event.event_type === 'appointment_scheduled')).toBe(true);
    expect(snapshot.events.some((row) => row.event.event_type === 'thread_message')).toBe(true);
    const inviteSnap = await (await json(`/api/outbox?patientId=${createdBody.invite.patient_id}`)).json() as Snapshot;
    expect(inviteSnap.events.some((row) => row.event.event_type === 'invite_sent')).toBe(true);
    expect(snapshot.events.flatMap((row) => row.deliveries).some((row) => row.channel !== 'in_app' && row.status === 'sent')).toBe(false);
  });

  it('cierra en 501 si falta el schema persistente', () => {
    expect(() => outboxDbError({ code: '42P01' })).toThrow(CareError);
    for (const code of ['42883', 'PGRST202', 'PGRST205', '42703']) {
      try {
        outboxDbError({ code });
        throw new Error('expected CareError');
      } catch (error) {
        expect(error).toBeInstanceOf(CareError);
        expect((error as CareError).status).toBe(501);
      }
    }
  });
});
