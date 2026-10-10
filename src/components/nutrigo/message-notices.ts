import type { CrmWorkItem } from '../../types/crm-work';

export type UnreadMessageGroup = { patientId: string; patientName: string; count: number; latestAt: string; href: string };

/**
 * Agrupa los pendientes «mensaje sin leer» de la bandeja del servidor por paciente.
 * La bandeja ya viene acotada al consultorio de la sesión y no trae el texto de los mensajes.
 */
export function groupUnreadMessages(items: readonly CrmWorkItem[]): UnreadMessageGroup[] {
  const groups = new Map<string, UnreadMessageGroup>();
  for (const entry of items) {
    if (entry.kind !== 'message') continue;
    const current = groups.get(entry.patient_id);
    if (!current) {
      groups.set(entry.patient_id, { patientId: entry.patient_id, patientName: entry.patient_name, count: 1, latestAt: entry.updated_at, href: entry.href });
      continue;
    }
    current.count += 1;
    if (entry.updated_at > current.latestAt) current.latestAt = entry.updated_at;
  }
  return [...groups.values()].sort((a, b) => b.latestAt.localeCompare(a.latestAt) || a.patientName.localeCompare(b.patientName, 'es'));
}

export function relativeTimeLabel(iso: string, now: Date): string {
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return '';
  const minutes = Math.max(0, Math.floor((now.getTime() - time) / 60000));
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? 'hace 1 día' : `hace ${days} días`;
}
