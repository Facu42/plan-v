import type { AppointmentHistoryEntry } from '../../types';

export interface LastVisit { dateId: string; daysAgo: number }

const DAY = 86_400_000;
const dayNumber = (dateId: string) => Math.floor(Date.parse(`${dateId}T12:00:00Z`) / DAY);

/** Última consulta cuyo horario ya pasó, según el historial de turnos. Sin ninguna, no hay dato (no se inventa). */
export function lastVisit(history: readonly Pick<AppointmentHistoryEntry, 'action' | 'dateId'>[] | undefined, todayId: string): LastVisit | null {
  const dates = (history ?? []).filter((entry) => entry.action === 'elapsed' && entry.dateId && entry.dateId <= todayId).map((entry) => entry.dateId as string).sort();
  const dateId = dates[dates.length - 1];
  return dateId ? { dateId, daysAgo: dayNumber(todayId) - dayNumber(dateId) } : null;
}

export function daysAgoText(daysAgo: number): string {
  if (daysAgo <= 0) return 'Hoy';
  if (daysAgo === 1) return 'Ayer';
  return `Hace ${daysAgo} días`;
}
