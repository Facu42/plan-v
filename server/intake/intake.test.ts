import { describe, expect, it } from 'vitest';
import { CONSENT_CATALOG, hashConsentText, matchConsentVersion } from './consent.js';
import { emptyIntakePayload, parseIntakePayload } from './payload.js';
import { toPatientIntakeView, toProfessionalIntakeView } from './views.js';
import type { ClinicalNoteRecord, ConsentRecord, IntakeRecord } from './views.js';

describe('PV-12 consent catalog', () => {
  it('hashes the current text and rejects a stale version', () => {
    const care = CONSENT_CATALOG.find((entry) => entry.purpose === 'care_relationship')!;
    expect(care.text_hash).toBe(hashConsentText(care.text));
    expect(matchConsentVersion({
      purpose: 'care_relationship',
      text_version: care.text_version,
      text_hash: care.text_hash,
    })).not.toBeNull();
    expect(matchConsentVersion({
      purpose: 'care_relationship',
      text_version: care.text_version,
      text_hash: '0'.repeat(64),
    })).toBeNull();
  });
});

describe('PV-12 intake payload', () => {
  it('keeps unknown distinct from an empty reported list', () => {
    expect(emptyIntakePayload().allergies).toEqual({ state: 'unknown', items: [] });
    expect(parseIntakePayload({ allergies: { state: 'reported', items: [] } }).success).toBe(false);
    expect(parseIntakePayload({ allergies: { state: 'none', items: ['mani'] } }).success).toBe(false);
    expect(parseIntakePayload({ allergies: { state: 'reported', items: ['mani'] } }).success).toBe(true);
  });

  it('rejects professional observations inside the self-reported payload', () => {
    const parsed = parseIntakePayload({
      preferred_name: 'Sofía',
      professional_note: 'Sospecho celiaquía',
      clinical_impression: 'revisar',
    });
    expect(parsed.success).toBe(false);
  });
});

describe('PV-12 intake views', () => {
  const record: IntakeRecord = {
    id: 'intake-1',
    patient_id: 'pat-1',
    schema_version: 'intake.v1',
    status: 'submitted',
    step: 'review',
    revision: 3,
    payload: emptyIntakePayload(),
    submitted_at: '2026-09-17T12:00:00.000Z',
    reviewed_by: 'user-nutri',
    reviewed_at: '2026-09-17T13:00:00.000Z',
    updated_at: '2026-09-17T13:00:00.000Z',
  };
  const events: ConsentRecord[] = [{
    id: 'c1',
    patient_id: 'pat-1',
    purpose: 'care_relationship',
    text_version: 'care_relationship.v1',
    text_hash: 'abc',
    decision: 'granted',
    actor_id: 'user-patient',
    created_at: '2026-09-17T11:00:00.000Z',
  }];
  const notes: ClinicalNoteRecord[] = [{
    id: 'n1',
    patient_id: 'pat-1',
    author_id: 'user-nutri',
    version: 1,
    body: 'Validar alergia en consulta. No reescribir el intake.',
    created_at: '2026-09-17T13:00:00.000Z',
  }];

  it('hides clinical notes from the patient view', () => {
    const view = toPatientIntakeView(record, events);
    expect(JSON.stringify(view)).not.toContain('Validar alergia');
    expect(JSON.stringify(view)).not.toContain('reviewed_by');
    expect(view.intake.payload).toEqual(record.payload);
    expect(view.consents[0]?.decision).toBe('granted');
  });

  it('keeps professional notes on a separate review surface', () => {
    const view = toProfessionalIntakeView(record, events, notes);
    expect(view.clinical_notes[0]?.body).toContain('Validar alergia');
    expect(view.review.reviewed_by).toBe('user-nutri');
    expect(view.intake.payload).toEqual(record.payload);
  });
});
