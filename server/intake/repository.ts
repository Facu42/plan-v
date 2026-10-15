import { getRequestDb } from '../db/supabase-client.js';
import type { ClinicalNoteRecord, ConsentRecord, IntakeRecord } from './views.js';
import type { IntakePayload, IntakeStep } from './payload.js';
import type { ConsentDecision, ConsentPurpose } from './consent.js';

export type IntakeBundle = { intake: IntakeRecord; consents: ConsentRecord[]; clinical_notes?: ClinicalNoteRecord[] };
export class IntakeRepositoryError extends Error {
  constructor(public status: 400 | 403 | 409 | 501 | 503, message: string) { super(message); }
}

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await getRequestDb().rpc(name, args);
  if (error) {
    if (['42883', '42P01', 'PGRST202', 'PGRST205'].includes(error.code)) throw new IntakeRepositoryError(501, 'El ingreso todavía no está habilitado en este entorno.');
    if (error.code === '42501') throw new IntakeRepositoryError(403, 'No tenés permiso para acceder a este ingreso.');
    if (error.code === 'PT409' || error.code === '40001') {
      const messages: Record<string, string> = {
        intake_consent_required: 'Registrá el consentimiento de atención vigente antes de enviar.',
        consent_version_changed: 'El texto de consentimiento cambió. Recargá el ingreso para revisarlo.',
        intake_name_required: 'Completá cómo te llamamos antes de enviar.',
        intake_not_submitted: 'El paciente todavía no envió su ingreso.',
      };
      throw new IntakeRepositoryError(409, messages[error.message] ?? 'El ingreso cambió en otra sesión. Recargá para revisar la versión actual.');
    }
    if (['22023', '22P02', '23514'].includes(error.code)) throw new IntakeRepositoryError(400, 'Revisá los datos del ingreso.');
    throw new IntakeRepositoryError(503, 'No se pudo confirmar el guardado. Conservá tus datos y reintentá.');
  }
  if (data == null) throw new IntakeRepositoryError(503, 'No se pudo recuperar el ingreso guardado.');
  return data as T;
}

export const readIntakeBundle = (patientId: string) => rpc<IntakeBundle>('get_patient_intake', { target: patientId });
export const saveIntake = (patientId: string, input: { expected_revision: number; step?: IntakeStep; payload?: Partial<IntakePayload> }) =>
  rpc<IntakeBundle>('save_patient_intake', { target: patientId, expected_revision: input.expected_revision, next_step: input.step ?? null, patch: input.payload ?? {} });
export const sendIntake = (patientId: string, expectedRevision: number) =>
  rpc<IntakeBundle>('submit_patient_intake', { target: patientId, expected_revision: expectedRevision });
export const markIntakeReviewed = (patientId: string, expectedRevision: number) =>
  rpc<IntakeBundle>('review_patient_intake', { target: patientId, expected_revision: expectedRevision });
export const recordConsent = (patientId: string, input: { purpose: ConsentPurpose; text_version: string; text_hash: string; decision: ConsentDecision }) =>
  rpc<ConsentRecord>('record_patient_consent', { target: patientId, purpose_value: input.purpose, version_value: input.text_version, hash_value: input.text_hash, decision_value: input.decision });
export const writeClinicalNote = (patientId: string, body: string) => rpc<ClinicalNoteRecord>('add_patient_clinical_note', { target: patientId, note_body: body });
