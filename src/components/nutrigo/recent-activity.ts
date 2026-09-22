import type { IconName } from '../shared/Icon';
import type { ShowroomPatient } from './showroom-model';

export type RecentActivityItem = {
  id: string;
  icon: IconName;
  text: string;
  at: Date;
};

function parseStamp(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Actividad reciente real (mensajes, comidas y actividad registrados), no inventada. */
export function buildRecentActivity(patient: Pick<ShowroomPatient, 'logs' | 'activities' | 'messages' | 'name'>, now: Date): RecentActivityItem[] {
  const items: RecentActivityItem[] = [];
  for (const log of patient.logs ?? []) {
    const at = parseStamp(log.logged_at);
    if (!at) continue;
    items.push({ id: `meal:${log.id}`, icon: 'camera', text: `Registraste ${log.slot.toLowerCase()}${log.description ? `: ${log.description}` : ''}`, at });
  }
  for (const entry of patient.activities ?? []) {
    const at = parseStamp(entry.logged_at);
    if (!at) continue;
    items.push({ id: `activity:${entry.id}`, icon: 'heart', text: `Registraste ${entry.activity} · ${entry.duration_minutes} min`, at });
  }
  for (const message of patient.messages ?? []) {
    const at = parseStamp(message.sent_at);
    if (!at) continue;
    items.push({ id: `message:${message.id}`, icon: 'message', text: message.from === 'patient' ? 'Le escribiste a Verónica' : 'Verónica te escribió', at });
  }
  return items
    .filter((item) => item.at.getTime() <= now.getTime())
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 4);
}

export function activityWhen(at: Date, now: Date): string {
  const sameDay = at.toDateString() === now.toDateString();
  if (sameDay) return at.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return at.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}
