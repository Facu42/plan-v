type SummaryPatient = {
  id: string;
  archived_at?: string | null;
  adherence_score: number;
  appointment: unknown;
  meal_logs: { patient_id: string; status: string }[];
};

export function buildProfessionalSummary(patients: SummaryPatient[]) {
  const active = patients.filter((p) => !p.archived_at);
  return {
    active: active.length,
    pending: active.reduce((sum, p) => sum + p.meal_logs.filter((log) => log.patient_id === p.id && log.status === 'pending_review').length, 0),
    appointments: active.filter((p) => p.appointment).length,
    adherence: active.length ? Math.round(active.reduce((sum, p) => sum + p.adherence_score, 0) / active.length) : null,
  };
}
