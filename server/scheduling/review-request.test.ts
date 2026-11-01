import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { describe, expect, it, afterEach } from 'vitest';
import { schedulingDefaultSettings } from '../../src/types/scheduling.js';
import { CareError } from '../care/errors.js';
import { DEMO_NUTRITIONIST_ID, createPatient, getPatient } from '../store.js';
import { registerSchedulingRoutes } from './routes.js';
import { profiles } from './repository.js';
import { deliverReviewRequest, resetMemoryReviewAudience, setMemoryReviewAudience } from './review-request.js';

const LINK = 'https://g.page/ana-nutri';

function withProfile() {
  profiles.set(DEMO_NUTRITIONIST_ID, {
    nutritionist_id: DEMO_NUTRITIONIST_ID,
    slug: 'mi-consultorio',
    revision: 1,
    config: { ...schedulingDefaultSettings(), page_extras: { google_business_url: LINK } },
  });
}

function app() {
  const hono = new Hono();
  hono.onError((error, c) => {
    if (error instanceof CareError) return c.json({ error: error.message }, error.status);
    return c.json({ error: 'No se pudo pedir la reseña.' }, 500);
  });
  hono.use('*', async (c, next) => { c.set('auth', { demo: true }); return next(); });
  registerSchedulingRoutes(hono);
  return hono;
}

describe('pedido de reseña', () => {
  afterEach(() => {
    resetMemoryReviewAudience();
    profiles.delete(DEMO_NUTRITIONIST_ID);
  });

  it('manda el link por el chat si no hay baja y no lo manda si la paciente se dio de baja', async () => {
    withProfile();
    const created = createPatient({ name: 'Ana', email: `resena-${randomUUID()}@example.test`, goal: '' });
    expect(created).not.toBeNull();
    const patientId = randomUUID();
    created!.patient.id = patientId;
    setMemoryReviewAudience(patientId, { campaignOptOut: true, inApp: true, email: true, broadcasts: true });
    const blocked = await deliverReviewRequest(DEMO_NUTRITIONIST_ID, patientId, false);
    expect(blocked.delivered).toBe('none');
    expect(getPatient(patientId)?.messages ?? []).toHaveLength(0);
    setMemoryReviewAudience(patientId, { campaignOptOut: false, inApp: true, email: false, broadcasts: false });
    const sent = await deliverReviewRequest(DEMO_NUTRITIONIST_ID, patientId, false);
    expect(sent.delivered).toBe('chat');
    expect(sent.text).toContain('https://g.page/ana-nutri/review');
    const messages = getPatient(patientId)?.messages ?? [];
    expect(messages).toHaveLength(1);
    expect(messages[0]?.text).toBe(sent.text);
    expect(messages[0]?.text).not.toMatch(/glucemia|peso|diagnóstico/i);
  });

  it('la ruta no envía si la paciente no está y exige un link de Google', async () => {
    withProfile();
    const missing = await app().request('/api/scheduling/review-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ patient_id: randomUUID() }),
    });
    expect(missing.status).toBe(404);
    profiles.set(DEMO_NUTRITIONIST_ID, {
      nutritionist_id: DEMO_NUTRITIONIST_ID, slug: 'mi-consultorio', revision: 1,
      config: schedulingDefaultSettings(),
    });
    const created = createPatient({ name: 'Ana', email: `resena-${randomUUID()}@example.test`, goal: '' });
    const patientId = randomUUID();
    created!.patient.id = patientId;
    const sinLink = await app().request('/api/scheduling/review-requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ patient_id: patientId }),
    });
    expect(sinLink.status).toBe(400);
  });
});
