import { beforeEach, describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { registerConsultationRoutes } from './routes.js';
import { resetConsultationMemory } from './memory.js';
import { getStore, resetStore } from '../store.js';
import { appendConsent } from '../intake/memory.js';
import { consentTextByPurpose } from '../intake/consent.js';
import { listPacks } from '../packs/repository.js';

// Consulta realizada ↔ paquete de consultas: marcarla descuenta una y desmarcarla la devuelve.
const app = new Hono();
app.use('*', async (c, next) => { c.set('auth', { demo: true }); await next(); });
app.onError((error, c) => c.json({ error: error.message }, 'status' in error ? error.status as 400 : 500));
registerConsultationRoutes(app);
const root = '/api/patients/pat-sofia/consultations', aid = '20000000-0000-4000-a000-000000000009';
const post = (url: string, data: unknown) => app.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

beforeEach(() => {
  resetStore(); resetConsultationMemory();
  const patient = getStore().patients.find(p => p.id === 'pat-sofia')!;
  patient.has_account = false;
  patient.appointment = { id: aid, when: 'Turno explícito', starts_at: new Date(Date.now() - 5 * 60000).toISOString(), duration: 45, channel: 'video', patient_reply: 'attending' };
  const c = consentTextByPurpose('care_relationship');
  appendConsent('pat-sofia', { purpose: c.purpose, text_version: c.text_version, text_hash: c.text_hash, decision: 'granted', actor_id: 'patient' });
});

describe('consulta realizada y paquete', () => {
  it('descuenta una sola vez al marcar y la devuelve al desmarcar', async () => {
    expect((await listPacks('pat-sofia', false))[0].uses).toHaveLength(1);
    expect((await post(`${root}/completions`, { appointment_id: aid, expected_revision: 0, completed: true, confirmed: true })).status).toBe(200);
    const after = (await listPacks('pat-sofia', false))[0];
    expect(after.uses).toHaveLength(2);
    expect(after.uses.some(use => use.appointment_id === aid)).toBe(true);
    expect((await post(`${root}/completions`, { appointment_id: aid, expected_revision: 1, completed: false, confirmed: true })).status).toBe(200);
    expect((await listPacks('pat-sofia', false))[0].uses).toHaveLength(1);
  });
});
