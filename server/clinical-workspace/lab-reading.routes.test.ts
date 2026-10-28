import { beforeEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { registerClinicalWorkspaceRoutes } from './routes.js';
import { resetClinicalWorkspaceMemory } from './repository.js';
import { resetStore } from '../store.js';
import { consentTextByPurpose, type ConsentPurpose } from '../intake/consent.js';
import { appendConsent } from '../intake/memory.js';

const app = new Hono();
app.use('*', async (c, next) => { c.set('auth', { demo: true }); await next(); });
app.onError((err, c) => c.json({ error: err.message }, 'status' in err ? err.status as 403 : 500));
registerClinicalWorkspaceRoutes(app);
const url = '/api/patients/pat-sofia/clinical-workspace/lab-reading';
const send = () => app.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request_id: crypto.randomUUID(), reading: { date: '2026-10-01', previous_date: null, rows: [{ name: 'Glucosa', value: '110', unit: 'mg/dL' }] } }) });
function grant(purpose: ConsentPurpose) { const t = consentTextByPurpose(purpose); appendConsent('pat-sofia', { purpose, text_version: t.text_version, text_hash: t.text_hash, decision: 'granted', actor_id: 'demo-patient' }); }

describe('lectura de laboratorio con IA (ruta)', () => {
  beforeEach(() => { resetStore(); resetClinicalWorkspaceMemory(); });
  it('sin el permiso de la paciente responde 403 y no llama a la IA', async () => {
    grant('care_relationship');
    expect((await send()).status).toBe(403);
  });
  it('con el permiso pero sin la IA encendida responde 503 y deja la lectura automática', async () => {
    grant('care_relationship'); grant('ai_lab_reading');
    const saved = { ...process.env }; delete process.env.GROQ_API_KEY;
    try { expect((await send()).status).toBe(503); } finally { process.env = saved; }
  });
});
