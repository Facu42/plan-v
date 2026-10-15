import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../index.js';
import { getPatient, getStore, resetStore } from '../store.js';
import { sendMemoryMessage } from '../messages/repository.js';
import type { AssistantAnswer } from '../../src/types/assistant.js';

const ask = (body: unknown) => app.request('/api/crm/assistant', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
});

describe('Asistente de cartera: API en modo demo', () => {
  beforeEach(() => resetStore());

  it('responde con tarjetas de pacientes del consultorio demo, enlaces a la ficha y sin caché', async () => {
    sendMemoryMessage('pat-sofia', { from: 'patient', text: 'Mensaje privado del asistente', suggestedByAi: false, client_id: 'assistant-demo' });
    const response = await ask({ question: '¿Qué pacientes necesitan atención hoy?' });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const body = await response.json() as AssistantAnswer;
    expect(body.source).toBe('memory');
    expect(body.intent).toBe('attention_today');
    const ids = new Set(getStore().patients.map(patient => patient.id));
    expect(body.cards.length).toBeGreaterThan(0);
    expect(body.cards.every(card => ids.has(card.patient_id) && card.action.href.startsWith('/crm/'))).toBe(true);
    expect(body.cards.find(card => card.patient_id === 'pat-sofia')?.reason).toMatch(/mensaje(s)? sin leer/);
    expect(JSON.stringify(body)).not.toContain('Mensaje privado del asistente');
  });

  it('una ficha archivada deja de aparecer al volver a preguntar', async () => {
    getPatient('pat-sofia')!.archived_at = new Date().toISOString();
    const body = await (await ask({ question: 'Resumime la adherencia de mi cartera' })).json() as AssistantAnswer;
    expect(JSON.stringify(body)).not.toContain('pat-sofia');
  });

  it('rechaza cuerpos inválidos y la audiencia paciente', async () => {
    expect((await ask({})).status).toBe(400);
    expect((await ask({ question: 'hola', extra: true })).status).toBe(400);
    const bad = await app.request('/api/crm/assistant', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{' });
    expect(bad.status).toBe(400);
    expect((await app.request('/api/crm/assistant?audience=patient', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: 'hola' }) })).status).toBe(403);
  });
});
