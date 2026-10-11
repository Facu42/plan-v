import type { ShowroomPatient } from '../../../components/nutrigo/showroom-model';

export const AGENDA_TIMEZONE = 'America/Argentina/Buenos_Aires';
export const agendaWeekdays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export type AgendaEvent = { id: string; kind: 'consult'; day: string; title: string; detail: string; time: string };
export const agendaDateId = (value: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: AGENDA_TIMEZONE }).format(value);
export const agendaClock = (value: string) => Number.isNaN(Date.parse(value)) ? '' : new Date(value).toLocaleTimeString('es-AR', { timeZone: AGENDA_TIMEZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
// Calendar cells are wall dates, not instants in the device's timezone.
export const wallDate = (value: string) => new Date(`${value}T12:00:00Z`);
export const wallDateId = (value: Date) => value.toISOString().slice(0, 10);
export const agendaDateLabel = (value: string) => wallDate(value).toLocaleDateString('es-AR', { timeZone: 'UTC' });
export const monthAnchor = (value: Date) => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1, 12));

/** Compatibility for demo/legacy slots lacking starts_at. Saved instants never use this fallback. */
export function nextConsultation(when: string | undefined, now: Date) {
  const [day, clock] = (when ?? '').split(' · '); const target = agendaWeekdays.indexOf(day);
  if (target < 0 || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(clock ?? '')) return null;
  const [hours, minutes] = clock.split(':').map(Number); const today = wallDate(agendaDateId(now));
  const delta = (target - (today.getUTCDay() + 6) % 7 + 7) % 7;
  const at = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + delta, hours + 3, minutes));
  if (at.getTime() < now.getTime()) at.setUTCDate(at.getUTCDate() + 7);
  return at;
}

/** La agenda es solo de citas con la nutricionista; comidas, actividad y plan viven en sus propias pantallas. */
export function buildAgendaEvents(patient: ShowroomPatient, now: Date): AgendaEvent[] {
  const events: AgendaEvent[] = [];
  const slot = patient.appointment;
  const saved = slot?.starts_at ? new Date(slot.starts_at) : null;
  const appointment = saved && !Number.isNaN(saved.getTime()) ? saved : nextConsultation(slot?.when, now);
  if (appointment && slot) events.push({ id: 'consult', kind: 'consult', day: agendaDateId(appointment), title: slot.channel === 'video' ? 'Videollamada' : 'Consulta', detail: `${slot.duration} min · ${slot.patient_reply === 'attending' ? 'Asistencia confirmada' : slot.patient_reply === 'needs_change' ? 'Cambio solicitado' : 'Sin confirmar'}`, time: agendaClock(appointment.toISOString()) });
  return events;
}
