import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { ARCHIVED_ACCOUNT_NOTICE } from '../src/lib/account-archive.js';
import { getPatient, resetStore } from './store.js';

function postMessage(body: unknown, patientId = 'pat-sofia') {
  return app.request(`/api/patients/${patientId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('message API flow in memory mode', () => {
  beforeEach(() => resetStore());

  it('stores a patient message as human-authored and returns a patient-safe view', async () => {
    const response = await postMessage({
      text: '¿Podemos revisar la merienda?',
      from: 'patient',
      suggested_by_ai: true,
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.patient).not.toHaveProperty('brief');
    expect(body.patient).not.toHaveProperty('adherence_why');
    expect(body.patient.messages.at(-1)).toMatchObject({
      from: 'patient',
      text: '¿Podemos revisar la merienda?',
    });
    expect(body.patient.messages.at(-1)).not.toHaveProperty('suggested_by_ai');
    const storedMessages = getPatient('pat-sofia')?.messages ?? [];
    expect(storedMessages[storedMessages.length - 1]?.suggested_by_ai).toBe(false);
    expect(storedMessages[storedMessages.length - 1]?.delivered_at).toBeFalsy();
    expect(storedMessages[storedMessages.length - 1]?.read_at).toBeFalsy();
  });

  it('keeps the AI-origin flag only for a professional message', async () => {
    const response = await postMessage({
      text: 'Probemos una alternativa más simple.',
      from: 'vero',
      suggested_by_ai: true,
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.patient.messages.at(-1)).toMatchObject({
      from: 'vero',
      suggested_by_ai: true,
      text: 'Probemos una alternativa más simple.',
    });
  });

  it('rejects blank messages and returns 404 for an unknown patient', async () => {
    const blank = await postMessage({ text: '   ', from: 'patient' });
    const missing = await postMessage({ text: 'Hola', from: 'patient' }, 'missing');

    expect(blank.status).toBe(400);
    expect(missing.status).toBe(404);
  });

  it('una paciente archivada no deja un mensaje nuevo y la profesional sí puede escribir', async () => {
    const patient = getPatient('pat-sofia');
    expect(patient).toBeTruthy();
    patient!.archived_at = new Date().toISOString();
    const before = patient!.messages.length;

    const blocked = await postMessage({ text: '¿Me leés?', from: 'patient' });
    expect(blocked.status).toBe(403);
    expect(await blocked.json()).toEqual({ error: ARCHIVED_ACCOUNT_NOTICE });
    expect(getPatient('pat-sofia')?.messages).toHaveLength(before);

    const fromPro = await postMessage({ text: 'Cuando vuelvas, seguimos.', from: 'vero' });
    expect(fromPro.status).toBe(200);
    expect((await fromPro.json()).patient.messages.at(-1)).toMatchObject({
      from: 'vero',
      text: 'Cuando vuelvas, seguimos.',
    });

    patient!.archived_at = null;
    const restored = await postMessage({ text: 'Ya volví', from: 'patient' });
    expect(restored.status).toBe(200);
    expect((await restored.json()).patient.messages.at(-1).text).toBe('Ya volví');
  });

  it('marks incoming messages as read for the reader without changing authorship', async () => {
    await postMessage({ text: '¿Confirmamos el jueves?', from: 'patient' });
    const response = await app.request('/api/patients/pat-sofia/messages/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reader: 'vero' }),
    });
    const body = await response.json();
    const last = body.patient.messages[body.patient.messages.length - 1];

    expect(response.status).toBe(200);
    expect(last).toMatchObject({ from: 'patient', text: '¿Confirmamos el jueves?' });
    expect(typeof last.read_at).toBe('string');
    expect(getPatient('pat-sofia')?.messages.slice(-1)[0]?.read_at).toBe(last.read_at);
  });
});
