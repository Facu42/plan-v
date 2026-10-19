export const PATIENT_RECORD_SECTION_IDS = ['resumen', 'historia', 'evolucion', 'notas', 'plan', 'semanal', 'compras', 'alimentario', 'chat', 'archivos', 'laboratorio', 'planificacion', 'consultas', 'cobros'] as const;
export type PatientRecordSection = typeof PATIENT_RECORD_SECTION_IDS[number];
export type PatientPlanPreview = { status: 'none' | 'draft' | 'published' | 'scheduled'; period_start: string | null; period_end: string | null; has_draft: boolean };
export type PatientQuickPreview = {
  patient_id: string; generated_at: string; can_open: boolean; source: 'memory' | 'supabase';
  latest_weight: { value: number; unit: string; captured_on: string } | null;
  plan: PatientPlanPreview;
  last_consultation: { summary: string; date: string } | null;
  sections: Array<{ id: PatientRecordSection; summary: string }>;
};
export type PatientRowPreview = Pick<PatientQuickPreview, 'patient_id' | 'can_open' | 'latest_weight' | 'plan'>;
