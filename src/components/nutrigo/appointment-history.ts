import type { AppointmentHistoryEntry } from '../../types';

export const HISTORY_ACTION_LABEL: Record<AppointmentHistoryEntry['action'], string> = {
  scheduled: 'Agendada',
  rescheduled: 'Reprogramada por el consultorio',
  patient_rescheduled: 'Reprogramada por la paciente',
  cancelled: 'Cancelada',
  elapsed: 'Fecha vencida',
  confirmed: 'Asistencia confirmada',
  needs_change: 'Pidió un cambio de horario',
};

export function historyActorLabel(actor: AppointmentHistoryEntry['actor']): string {
  if (actor === 'patient') return 'Paciente';
  if (actor === 'system') return 'Automático';
  return 'Consultorio';
}

export function channelLabel(channel: string): string {
  if (channel === 'video') return 'Videollamada';
  if (channel === 'presencial') return 'Presencial';
  return 'Modalidad por confirmar';
}
