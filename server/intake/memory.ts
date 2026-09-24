import { randomUUID } from 'node:crypto';
import type { ConsentDecision, ConsentPurpose } from './consent.js';
import {
  INTAKE_SCHEMA_VERSION,
  canSubmitIntakePayload,
  emptyIntakePayload,
  type IntakePayload,
  type IntakeStep,
} from './payload.js';
import {
  careRelationshipGranted,
  type ClinicalNoteRecord,
  type ConsentRecord,
  type IntakeRecord,
} from './views.js';

let intakes = new Map<string, IntakeRecord>();
let consents = new Map<string, ConsentRecord[]>();
let notes = new Map<string, ClinicalNoteRecord[]>();
let submittedRevisions = new Map<string, number>();

export class IntakeConflictError extends Error {
  constructor(message = 'La revisión del ingreso cambió') {
    super(message);
    this.name = 'IntakeConflictError';
  }
}

export class IntakeNotReadyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntakeNotReadyError';
  }
}

export function resetIntakeMemory(): void {
  intakes = new Map();
  consents = new Map();
  notes = new Map();
  submittedRevisions = new Map();
}

function nowIso() {
  return new Date().toISOString();
}

export function getIntakeRecord(patientId: string): IntakeRecord {
  const existing = intakes.get(patientId);
  if (existing) return existing;
  const created: IntakeRecord = {
    id: randomUUID(),
    patient_id: patientId,
    schema_version: INTAKE_SCHEMA_VERSION,
    status: 'draft',
    step: 'start',
    revision: 1,
    payload: emptyIntakePayload(),
    submitted_at: null,
    reviewed_by: null,
    reviewed_at: null,
    updated_at: nowIso(),
  };
  intakes.set(patientId, created);
  return created;
}

export function listConsentEvents(patientId: string): ConsentRecord[] {
  return [...(consents.get(patientId) ?? [])];
}

export function listClinicalNotes(patientId: string): ClinicalNoteRecord[] {
  return [...(notes.get(patientId) ?? [])];
}

export function patchIntake(patientId: string, input: {
  expected_revision: number;
  step?: IntakeStep;
  payload?: IntakePayload;
}): IntakeRecord {
  const current = getIntakeRecord(patientId);
  if (current.revision !== input.expected_revision) throw new IntakeConflictError();
  if (current.status !== 'draft') throw new IntakeConflictError('El ingreso ya fue enviado');
  const next: IntakeRecord = {
    ...current,
    step: input.step ?? current.step,
    payload: input.payload ?? current.payload,
    revision: current.revision + 1,
    updated_at: nowIso(),
  };
  intakes.set(patientId, next);
  return next;
}

export function submitIntake(patientId: string, expectedRevision: number): IntakeRecord {
  const current = getIntakeRecord(patientId);
  if (current.status === 'submitted' || current.status === 'reviewed') {
    const submitted = submittedRevisions.get(patientId);
    if (current.revision === expectedRevision || submitted === expectedRevision || (submitted != null && submitted + 1 === expectedRevision)) return current;
    throw new IntakeConflictError('El ingreso ya fue enviado');
  }
  if (current.revision !== expectedRevision) throw new IntakeConflictError();
  if (!canSubmitIntakePayload(current.payload)) {
    throw new IntakeNotReadyError('Completá cómo te llamamos para enviar el ingreso');
  }
  if (!careRelationshipGranted(listConsentEvents(patientId))) {
    throw new IntakeNotReadyError('Hace falta el consentimiento de atención para enviar el ingreso');
  }
  const submitted: IntakeRecord = {
    ...current,
    status: 'submitted',
    step: 'review',
    submitted_at: nowIso(),
    revision: current.revision + 1,
    updated_at: nowIso(),
  };
  intakes.set(patientId, submitted);
  submittedRevisions.set(patientId, expectedRevision);
  return submitted;
}

export function reviewIntake(patientId: string, reviewerId: string, expectedRevision?: number): IntakeRecord {
  const current = getIntakeRecord(patientId);
  if (current.status === 'draft') throw new IntakeNotReadyError('El paciente todavía no envió el ingreso');
  if (current.status === 'reviewed' && (expectedRevision === undefined || expectedRevision === current.revision || expectedRevision === current.revision - 1)) return current;
  if (expectedRevision !== undefined && current.revision !== expectedRevision) throw new IntakeConflictError();
  const reviewed: IntakeRecord = {
    ...current,
    status: 'reviewed',
    reviewed_by: reviewerId,
    reviewed_at: nowIso(),
    revision: current.revision + 1,
    updated_at: nowIso(),
  };
  intakes.set(patientId, reviewed);
  return reviewed;
}

export function appendConsent(patientId: string, input: {
  purpose: ConsentPurpose;
  text_version: string;
  text_hash: string;
  decision: ConsentDecision;
  actor_id: string;
}): ConsentRecord {
  const last = listConsentEvents(patientId).filter(event => event.purpose === input.purpose).slice(-1)[0];
  if (last?.decision === input.decision && last.text_hash === input.text_hash && last.text_version === input.text_version) return last;
  const event: ConsentRecord = {
    id: randomUUID(),
    patient_id: patientId,
    purpose: input.purpose,
    text_version: input.text_version,
    text_hash: input.text_hash,
    decision: input.decision,
    actor_id: input.actor_id,
    created_at: nowIso(),
  };
  consents.set(patientId, [...listConsentEvents(patientId), event]);
  return event;
}

export function addClinicalNote(patientId: string, authorId: string, body: string): ClinicalNoteRecord {
  const existing = listClinicalNotes(patientId);
  const note: ClinicalNoteRecord = {
    id: randomUUID(),
    patient_id: patientId,
    author_id: authorId,
    version: existing.length + 1,
    body,
    created_at: nowIso(),
  };
  notes.set(patientId, [...existing, note]);
  return note;
}
