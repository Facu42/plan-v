import type { Patient } from '../../types';
import { nextAppointmentDate, secureMeetUrl } from './ShowroomConsultations';
import { addDays, localDateId, sentenceCase } from './showroom-calendar';

export const CONSULT_ALERT_HORIZON_DAYS = 7;
const SOON_MS = 2 * 60 * 60 * 1000;
const GRACE_MS = 5 * 60 * 1000;

export type ConsultAlertAudience = 'patient' | 'pro';
export type ConsultAlertUrgency = 'soon' | 'today' | 'tomorrow' | 'week';

export type ConsultAlertPerson = Pick<Patient, 'id' | 'name' | 'appointment'>;

export type ConsultAlert = {
  id: string;
  patientId: string;
  patientName: string;
  dateId: string;
  at: Date;
  time: string;
  whenLabel: string;
  urgency: ConsultAlertUrgency;
  urgencyLabel: string;
  channel: string;
  channelLabel: string;
  duration: number;
  meetUrl: string | null;
};

const URGENCY_LABEL: Record<ConsultAlertUrgency, string> = {
  soon: 'En breve',
  today: 'Hoy',
  tomorrow: 'Mañana',
  week: 'Esta semana',
};

export function consultAlertKey(audience: ConsultAlertAudience, alertId: string) {
  return `plan-v:consult-alert:${audience}:${alertId}`;
}

export function isConsultAlertDismissed(storage: Pick<Storage, 'getItem'> | null, audience: ConsultAlertAudience, alertId: string) {
  return storage?.getItem(consultAlertKey(audience, alertId)) === 'dismissed';
}

export function dismissConsultAlert(storage: Pick<Storage, 'setItem'> | null, audience: ConsultAlertAudience, alertId: string) {
  storage?.setItem(consultAlertKey(audience, alertId), 'dismissed');
}

export function consultAlertUrgency(at: Date, now: Date): ConsultAlertUrgency {
  const delta = at.getTime() - now.getTime();
  if (delta <= SOON_MS) return 'soon';
  if (localDateId(at) === localDateId(now)) return 'today';
  if (localDateId(at) === localDateId(addDays(now, 1))) return 'tomorrow';
  return 'week';
}

function channelLabel(channel: string) {
  if (channel === 'video') return 'Videollamada';
  if (channel === 'presencial') return 'Presencial';
  return 'Modalidad por confirmar';
}

export function buildConsultAlerts(people: readonly ConsultAlertPerson[], now: Date): ConsultAlert[] {
  const horizon = now.getTime() + CONSULT_ALERT_HORIZON_DAYS * 24 * 60 * 60 * 1000;
  return people.flatMap((person) => {
    const appointment = person.appointment;
    const at = nextAppointmentDate(appointment, now);
    if (!appointment || !at) return [];
    if (at.getTime() < now.getTime() - GRACE_MS || at.getTime() > horizon) return [];
    const time = appointment.when.split(' · ')[1] ?? '';
    const urgency = consultAlertUrgency(at, now);
    const day = sentenceCase(at.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' }));
    const whenLabel = urgency === 'week' ? `${day} · ${time}` : `${URGENCY_LABEL[urgency]} · ${time}`;
    const dateId = localDateId(at);
    return [{
      id: `${person.id}:${dateId}`,
      patientId: person.id,
      patientName: person.name,
      dateId,
      at,
      time,
      whenLabel,
      urgency,
      urgencyLabel: URGENCY_LABEL[urgency],
      channel: appointment.channel,
      channelLabel: channelLabel(appointment.channel),
      duration: appointment.duration,
      meetUrl: appointment.channel === 'video' ? secureMeetUrl(appointment.meet_url) : null,
    }];
  }).sort((a, b) => a.at.getTime() - b.at.getTime() || a.patientName.localeCompare(b.patientName, 'es-AR'));
}

export function visibleConsultAlerts(alerts: readonly ConsultAlert[], audience: ConsultAlertAudience, storage: Pick<Storage, 'getItem'> | null) {
  return alerts.filter((alert) => !isConsultAlertDismissed(storage, audience, alert.id));
}

export function consultAlertBadgeCount(alerts: readonly ConsultAlert[], audience: ConsultAlertAudience, storage: Pick<Storage, 'getItem'> | null) {
  return visibleConsultAlerts(alerts, audience, storage).length;
}
