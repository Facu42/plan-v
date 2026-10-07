import { argentinaDay, argentinaTime, ARGENTINA_ZONE, previousDay } from './ar-time';

/** Del más viejo al más nuevo según el instante real (no el texto de la hora); los de fecha inválida van al final, en su orden. */
export function orderedMessages<T extends { sent_at: string }>(messages: readonly T[]): T[] {
  const stamped = messages.map((message, index) => ({ message, index, time: Date.parse(message.sent_at) }));
  const dated = stamped.filter(entry => Number.isFinite(entry.time)).sort((a, b) => a.time - b.time || a.index - b.index);
  return [...dated, ...stamped.filter(entry => !Number.isFinite(entry.time))].map(entry => entry.message);
}

/** ¿Tiene fecha válida? */
export const hasDate = (message: { sent_at: string }) => Number.isFinite(Date.parse(message.sent_at));

/** Tamaño de un adjunto; vacío si el dato falta o es imposible. */
export function fileSize(bytes: number | null | undefined): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes >= 1048576) return `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(bytes / 1048576)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Dirección para abrir un adjunto: https firmado o una ruta propia; cualquier otra cosa no se abre. */
export function attachmentHref(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  if (!text) return null;
  if (/^\/(?![/\\])/.test(text)) return text;
  try { return new URL(text).protocol === 'https:' ? text : null; } catch { return null; }
}

const SHORT_DATE = new Intl.DateTimeFormat('es-AR', { timeZone: ARGENTINA_ZONE, day: 'numeric', month: 'short' });
const WEEKDAY = new Intl.DateTimeFormat('es-AR', { timeZone: ARGENTINA_ZONE, weekday: 'long' });
const shortDate = (when: Date) => SHORT_DATE.format(when);
const upperFirst = (text: string) => text.replace(/^./, letter => letter.toLocaleUpperCase('es'));
const relativeDay = (when: Date, now: Date) => { const day = argentinaDay(when); const today = argentinaDay(now); return day === today ? 'today' : day === previousDay(today) ? 'yesterday' : 'other'; };

/** Separador de día del chat: «Hoy, 3 oct», «Ayer, 2 oct», «Sábado, 26 sept». */
export function dayLabel(sentAt: string, now: Date): string {
  const when = new Date(sentAt); if (Number.isNaN(when.getTime())) return '';
  const kind = relativeDay(when, now);
  if (kind === 'today') return `Hoy, ${shortDate(when)}`;
  if (kind === 'yesterday') return `Ayer, ${shortDate(when)}`;
  return `${upperFirst(WEEKDAY.format(when))}, ${shortDate(when)}`;
}

/** Hora o fecha corta del último mensaje en la lista: «10:30 p. m.», «Ayer», «26 sept». */
export function listTime(sentAt: string, now: Date): string {
  const when = new Date(sentAt); if (Number.isNaN(when.getTime())) return '';
  const kind = relativeDay(when, now);
  return kind === 'today' ? argentinaTime(sentAt) : kind === 'yesterday' ? 'Ayer' : shortDate(when);
}
