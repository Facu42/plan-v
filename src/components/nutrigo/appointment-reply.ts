export type AppointmentReply = 'pending' | 'attending' | 'needs_change';

export function appointmentReplyKey(patientId: string, when: string) {
  return `plan-v:appt-reply:${patientId}:${when}`;
}

export function readAppointmentReply(storage: Pick<Storage, 'getItem'> | null, patientId: string, when: string): AppointmentReply {
  const raw = storage?.getItem(appointmentReplyKey(patientId, when));
  return raw === 'attending' || raw === 'needs_change' ? raw : 'pending';
}

export function writeAppointmentReply(storage: Pick<Storage, 'setItem'> | null, patientId: string, when: string, reply: Exclude<AppointmentReply, 'pending'>) {
  storage?.setItem(appointmentReplyKey(patientId, when), reply);
}

export function appointmentReplyLabel(reply: AppointmentReply) {
  if (reply === 'attending') return 'Asistencia confirmada';
  if (reply === 'needs_change') return 'Pidió un cambio de horario';
  return 'Sin respuesta';
}
