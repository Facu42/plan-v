import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './index.js';
import { CONSENT_CATALOG } from './intake/consent.js';
import { resetIntakeMemory } from './intake/memory.js';
import { resetStore } from './store.js';

function json(path: string, body?: unknown, init?: RequestInit) {
  return app.request(path, {
    method: body === undefined && !init?.method ? 'GET' : init?.method ?? 'POST',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...init,
  });
}

describe('PV-12 intake and consents in memory', () => {
  beforeEach(() => {
    resetStore();
    resetIntakeMemory();
  });

  it('saves a self-reported draft, records consent, and submits without mixing clinical notes', async () => {
    const started = await json('/api/patients/pat-sofia/intake');
    expect(started.status).toBe(200);
    const first = await started.json() as { intake: { revision: number } };

    const saved = await json('/api/patients/pat-sofia/intake', {
      expected_revision: first.intake.revision,
      step: 'allergies',
      payload: {
        preferred_name: 'Sofi',
        allergies: { state: 'reported', items: ['mani'] },
        restrictions: { state: 'none', items: [] },
      },
    }, { method: 'PATCH' });
    expect(saved.status).toBe(200);
    const draft = await saved.json() as { intake: { revision: number; payload: { allergies: { state: string } } } };
    expect(draft.intake.payload.allergies.state).toBe('reported');

    const stale = await json('/api/patients/pat-sofia/intake', {
      expected_revision: first.intake.revision,
      payload: { preferred_name: 'Otra' },
    }, { method: 'PATCH' });
    expect(stale.status).toBe(409);

    const care = CONSENT_CATALOG.find((entry) => entry.purpose === 'care_relationship')!;
    const consented = await json('/api/patients/pat-sofia/consents', {
      purpose: care.purpose,
      text_version: care.text_version,
      text_hash: care.text_hash,
      decision: 'granted',
    });
    expect(consented.status).toBe(201);

    const submitted = await json('/api/patients/pat-sofia/intake/submit', {
      expected_revision: draft.intake.revision,
    });
    expect(submitted.status).toBe(200);
    const sent = await submitted.json() as { intake: { status: string } };
    expect(sent.intake.status).toBe('submitted');
    expect(sent).not.toHaveProperty('clinical_notes');

    const note = await json('/api/patients/pat-sofia/clinical-notes', { body: 'Confirmar alergia en consulta' });
    expect(note.status).toBe(201);

    const patientView = await json('/api/patients/pat-sofia/intake');
    expect(JSON.stringify(await patientView.json())).not.toContain('Confirmar alergia');
  });

  it('lets the professional review privately without rewriting the declaration', async () => {
    await json('/api/patients/pat-sofia/intake', {
      expected_revision: 1,
      payload: { preferred_name: 'Sofi' },
    }, { method: 'PATCH' });
    const care = CONSENT_CATALOG.find((entry) => entry.purpose === 'care_relationship')!;
    await json('/api/patients/pat-sofia/consents', {
      purpose: care.purpose,
      text_version: care.text_version,
      text_hash: care.text_hash,
      decision: 'granted',
    });
    const submitted = await json('/api/patients/pat-sofia/intake/submit', { expected_revision: 2 });
    expect(submitted.status).toBe(200);
    const reviewed = await json('/api/patients/pat-sofia/intake/review', { expected_revision: 3 });
    expect(reviewed.status).toBe(200);
    const body = await reviewed.json() as { intake: { status: string }; clinical_notes: unknown[] };
    expect(body.intake.status).toBe('reviewed');
    const patientView = await json('/api/patients/pat-sofia/intake');
    expect(JSON.stringify(await patientView.json())).not.toContain('reviewed_by');
  });

  it('rejects a consent hash that does not match the published text', async () => {
    const response = await json('/api/patients/pat-sofia/consents', {
      purpose: 'care_relationship',
      text_version: 'care_relationship.v1',
      text_hash: 'a'.repeat(64),
      decision: 'granted',
    });
    expect(response.status).toBe(409);
  });
});
