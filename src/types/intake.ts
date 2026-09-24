export type IntakeStatus = 'draft' | 'submitted' | 'reviewed';
export type IntakeHealthState = 'unknown' | 'none' | 'reported';

export type IntakeHealthFact = {
  state: IntakeHealthState;
  items: string[];
};

export type IntakePayload = {
  preferred_name?: string;
  patient_intent?: string;
  allergies?: IntakeHealthFact;
  restrictions?: IntakeHealthFact;
  hydration_glasses?: number | null;
  sleep_hours?: number | null;
  energy?: 'Baja' | 'Media' | 'Alta' | null;
};

export type PatientConsentStatus = {
  purpose: string;
  decision: string;
  text_version?: string;
  created_at?: string;
};

export type ClinicalNoteRecord = {
  id: string;
  patient_id: string;
  author_id: string;
  version: number;
  body: string;
  created_at: string;
};

export type PatientIntakeView = {
  intake: {
    id?: string;
    schema_version?: string;
    status: string;
    step?: string;
    revision: number;
    payload: IntakePayload;
    submitted_at?: string | null;
    updated_at?: string;
  };
  consents: PatientConsentStatus[];
  source?: string;
};

export type ProfessionalIntakeView = PatientIntakeView & {
  review: {
    reviewed_by: string | null;
    reviewed_at: string | null;
  };
  clinical_notes: ClinicalNoteRecord[];
};
