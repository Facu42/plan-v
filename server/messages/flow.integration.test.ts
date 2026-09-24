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

describe('PV-23 hilos: idempotencia, no leídos y recibos', () => {
  beforeEach(() => resetStore());

  it('no duplica con el mismo client_id y deja la entrega pendiente hasta el ack', async () => {
    const clientId = '11111111-1111-4111-8111-111111111111';
    const first = await app.request(
      '/api/patients/pat-sofia/messages',
      jsonRequest('POST', { text: '¿Revisamos la merienda?', from: 'patient', client_id: clientId }),
    );
    const created = await first.json();
    const stored = getPatient('pat-sofia')!.messages.filter((message) => message.text === '¿Revisamos la merienda?');
    expect(first.status).toBe(200);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ from: 'patient', delivered_at: null, read_at: null });
    expect(created.patient.messages.at(-1)).not.toHaveProperty('suggested_by_ai');
    expect(created.patient.messages.at(-1)).not.toHaveProperty('client_id');

    const replay = await app.request(
      '/api/patients/pat-sofia/messages',
      jsonRequest('POST', { text: 'otro texto que no debe crear otro mensaje', from: 'patient', client_id: clientId }),
    );
    const replayed = await replay.json();
    expect(replay.status).toBe(200);
    expect(getPatient('pat-sofia')!.messages.filter((message) => message.text === '¿Revisamos la merienda?')).toHaveLength(1);
    expect(getPatient('pat-sofia')!.messages.some((message) => message.text.includes('otro texto'))).toBe(false);
    expect(replayed.patient.messages.filter((message: { text: string }) => message.text === '¿Revisamos la merienda?')).toHaveLength(1);
  });

  it('marca entrega y lectura una sola vez; un segundo leído no cambia el instante', async () => {
    await app.request(
      '/api/patients/pat-sofia/messages',
      jsonRequest('POST', { text: '¿Confirmamos el jueves?', from: 'patient', client_id: '22222222-2222-4222-8222-222222222222' }),
    );
    const first = await app.request(
      '/api/patients/pat-sofia/messages/read',
      jsonRequest('POST', { reader: 'vero' }),
    );
    const firstBody = await first.json();
    const firstRead = firstBody.patient.messages.find((message: { text: string }) => message.text === '¿Confirmamos el jueves?');
    expect(first.status).toBe(200);
    expect(typeof firstRead.read_at).toBe('string');
    expect(typeof firstRead.delivered_at).toBe('string');

    const second = await app.request(
      '/api/patients/pat-sofia/messages/read',
      jsonRequest('POST', { reader: 'vero' }),
    );
    const secondBody = await second.json();
    const secondRead = secondBody.patient.messages.find((message: { text: string }) => message.text === '¿Confirmamos el jueves?');
    expect(secondRead.read_at).toBe(firstRead.read_at);
    expect(secondRead.delivered_at).toBe(firstRead.delivered_at);
    expect(getPatient('pat-sofia')?.messages.find((message) => message.text === '¿Confirmamos el jueves?')?.read_at).toBe(firstRead.read_at);
  });

  it('GET de ficha no marca leído; Marina no ve el hilo de Sofía', async () => {
    await app.request(
      '/api/patients/pat-sofia/messages',
      jsonRequest('POST', { text: 'Solo Sofía', from: 'patient', client_id: '33333333-3333-4333-8333-333333333333' }),
    );
    const ficha = await app.request('/api/patients/pat-sofia');
    const fichaBody = await ficha.json();
    const last = fichaBody.patient.messages.find((message: { text: string }) => message.text === 'Solo Sofía');
    expect(ficha.status).toBe(200);
    expect(last.read_at).toBeFalsy();
    expect(last.delivered_at).toBeFalsy();

    const marina = await app.request('/api/patients/pat-marina');
    const marinaBody = await marina.json();
    expect(marinaBody.patient.messages.some((message: { text: string }) => message.text === 'Solo Sofía')).toBe(false);
  });
});
