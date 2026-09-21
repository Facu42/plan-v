import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { getPatient, resetStore } from './store.js';

const messageId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

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
      id: messageId,
      text: '¿Podemos revisar la merienda?',
      from: 'patient',
      suggested_by_ai: true,
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.patient).not.toHaveProperty('brief');
    expect(body.patient).not.toHaveProperty('adherence_why');
    expect(body.patient.messages.at(-1)).toMatchObject({
      id: messageId,
      from: 'patient',
      text: '¿Podemos revisar la merienda?',
    });
    expect(body.patient.messages.at(-1)).not.toHaveProperty('suggested_by_ai');
    const storedMessages = getPatient('pat-sofia')?.messages ?? [];
    expect(storedMessages[storedMessages.length - 1]?.suggested_by_ai).toBe(false);
    expect(storedMessages[storedMessages.length - 1]?.delivered_at).toBeTruthy();
    expect(storedMessages[storedMessages.length - 1]?.read_at).toBeFalsy();
  });

  it('keeps the AI-origin flag only for a professional message', async () => {
    const response = await postMessage({
      id: messageId,
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

  it('rejects blank messages, missing ids and unknown patients', async () => {
    const blank = await postMessage({ id: messageId, text: '   ', from: 'patient' });
    const missingId = await postMessage({ text: 'Hola', from: 'patient' });
    const missing = await postMessage({ id: messageId, text: 'Hola', from: 'patient' }, 'missing');

    expect(blank.status).toBe(400);
    expect(missingId.status).toBe(400);
    expect(missing.status).toBe(404);
  });

  it('retries the same client id without duplicating and conflicts on a different payload', async () => {
    const payload = { id: messageId, text: '¿Confirmamos el jueves?', from: 'patient' };
    const first = await postMessage(payload);
    const retry = await postMessage(payload);
    const conflict = await postMessage({ ...payload, text: 'Otro texto' });
    const stored = (getPatient('pat-sofia')?.messages ?? []).filter((message) => message.id === messageId);

    expect(first.status).toBe(200);
    expect(retry.status).toBe(200);
    expect((await retry.json()).patient.messages.at(-1).id).toBe(messageId);
    expect(conflict.status).toBe(409);
    expect(stored).toHaveLength(1);
  });

  it('marks incoming messages as read for the reader without changing authorship', async () => {
    await postMessage({ id: messageId, text: '¿Confirmamos el jueves?', from: 'patient' });
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
