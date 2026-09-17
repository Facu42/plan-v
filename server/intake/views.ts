import { consentTextByPurpose, type ConsentDecision, type ConsentPurpose } from './consent.js';
import type { IntakePayload, IntakeStatus, IntakeStep } from './payload.js';

export type IntakeRecord = {
  id: string;
  patient_id: string;
  schema_version: string;
  status: IntakeStatus;
  step: IntakeStep;
  revision: number;
  payload: IntakePayload;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  updated_at: string;
};

export type ConsentRecord = {
  id: string;
  patient_id: string;
  purpose: ConsentPurpose;
  text_version: string;
  text_hash: string;
  decision: ConsentDecision;
  actor_id: string;
  created_at: string;
};

export type ClinicalNoteRecord = {
  id: string;
  patient_id: string;
  author_id: string;
  version: number;
  body: string;
  created_at: string;
};

export type PatientConsentStatus = {
  purpose: ConsentPurpose;
  decision: ConsentDecision;
  text_version: string;
  created_at: string;
};

export type PatientIntakeView = {
  intake: {
    id: string;
    schema_version: string;
    status: IntakeStatus;
    step: IntakeStep;
    revision: number;
    payload: IntakePayload;
    submitted_at: string | null;
    updated_at: string;
  };
  consents: PatientConsentStatus[];
};

export type ProfessionalIntakeView = PatientIntakeView & {
  review: {
    reviewed_by: string | null;
    reviewed_at: string | null;
  };
  clinical_notes: ClinicalNoteRecord[];
};

function latestConsents(events: ConsentRecord[]): PatientConsentStatus[] {
  const latest = new Map<ConsentPurpose, ConsentRecord>();
  for (const event of events) {
    const current = latest.get(event.purpose);
    if (!current || current.created_at <= event.created_at) latest.set(event.purpose, event);
  }
  return [...latest.values()].map((event) => ({
    purpose: event.purpose,
    decision: event.decision,
    text_version: event.text_version,
    created_at: event.created_at,
  }));
}

export function toPatientIntakeView(record: IntakeRecord, events: ConsentRecord[]): PatientIntakeView {
  return {
    intake: {
      id: record.id,
      schema_version: record.schema_version,
      status: record.status,
      step: record.step,
      revision: record.revision,
      payload: record.payload,
      submitted_at: record.submitted_at,
      updated_at: record.updated_at,
    },
    consents: latestConsents(events),
  };
}

export function toProfessionalIntakeView(
  record: IntakeRecord,
  events: ConsentRecord[],
  notes: ClinicalNoteRecord[],
): ProfessionalIntakeView {
  return {
    ...toPatientIntakeView(record, events),
    review: {
      reviewed_by: record.reviewed_by,
      reviewed_at: record.reviewed_at,
    },
    clinical_notes: notes.map((note) => ({
      id: note.id,
      patient_id: note.patient_id,
      author_id: note.author_id,
      version: note.version,
      body: note.body,
      created_at: note.created_at,
    })),
  };
}

export function careRelationshipGranted(events: ConsentRecord[]): boolean {
  const latest = latestConsents(events).find((event) => event.purpose === 'care_relationship');
  return latest?.decision === 'granted' && latest.text_version === consentTextByPurpose('care_relationship').text_version;
}
