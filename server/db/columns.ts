export type QueryAudience = 'professional' | 'patient';

export const PRIVATE_PATIENT_COLUMNS = ['plan_b', 'next_focus', 'sensitive_hours', 'adherence_why'] as const;
export const PRIVATE_MEAL_COLUMNS = ['note_for_nutri'] as const;
export const PRIVATE_MESSAGE_COLUMNS = ['suggested_by_ai'] as const;
export const PRIVATE_APPOINTMENT_COLUMNS = ['prep_note'] as const;

export const patientTableColumns: Record<QueryAudience, string> = {
  professional: 'id,full_name,initials,tone,status,billing_status,billing_until,stage,goal,adherence_score,user_id,nutritionist_id,plan_b,next_focus,sensitive_hours,adherence_why',
  patient: 'id,full_name,initials,tone,status,billing_status,billing_until,stage,goal,adherence_score,user_id',
};

export const mealLogColumns: Record<QueryAudience, string> = {
  professional: 'id,patient_id,slot,slot_label,photo_path,description,foods,macros,confidence,status,logged_at,note_for_nutri',
  patient: 'id,patient_id,slot,slot_label,photo_path,description,foods,macros,confidence,status,logged_at',
};

export const messageColumns: Record<QueryAudience, string> = {
  professional: 'id,patient_id,author_id,body,sent_at,suggested_by_ai',
  patient: 'id,patient_id,author_id,body,sent_at',
};

export const appointmentColumns: Record<QueryAudience, string> = {
  professional: 'id,patient_id,starts_at,duration_min,channel,meet_url,status,prep_note',
  patient: 'id,patient_id,starts_at,duration_min,channel,meet_url,status',
};

export function assertPublicSelectList(select: string, forbidden: readonly string[]): void {
  for (const column of forbidden) {
    if (select.split(',').includes(column) || select.trim() === '*') {
      throw new Error(`Patient query must not select ${column}`);
    }
  }
}
