import { nextAppointmentDate } from './ShowroomConsultations';

type SummaryPatient = {
  id: string;
  archived_at?: string | null;
  adherence_score: number;
  appointment: { when: string; starts_at?: string } | null;
  meal_logs: { patient_id: string; status: string }[];
};

export function upcomingAppointmentDate(appointment: SummaryPatient['appointment'], now: Date): Date | null {
  if (!appointment) return null;
  if (appointment.starts_at) {
    const at = new Date(appointment.starts_at);
    return Number.isFinite(at.getTime()) && at.getTime() >= now.getTime() ? at : null;
  }
  return nextAppointmentDate(appointment, now);
}

export function buildProfessionalSummary(patients: SummaryPatient[], now = new Date()) {
  const active = patients.filter((p) => !p.archived_at);
  return {
    active: active.length,
    pending: active.reduce((sum, p) => sum + p.meal_logs.filter((log) => log.patient_id === p.id && log.status === 'pending_review').length, 0),
    appointments: active.filter((p) => upcomingAppointmentDate(p.appointment, now)).length,
    adherence: active.length ? Math.round(active.reduce((sum, p) => sum + p.adherence_score, 0) / active.length) : null,
  };
}
