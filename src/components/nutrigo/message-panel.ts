// Datos del panel de perfil y de la lista de Mensajes (frame 84:2565), armados
// sólo con lo que la conversación tiene de verdad: adjuntos enviados, enlaces
// escritos en los mensajes y las marcas de tiempo reales. Nada inventado.
import type { MessageAttachment } from '../../types';

export type PanelMessage = {
  id: string;
  text: string;
  from: 'vero' | 'patient';
  sent_at: string;
  read_at?: string | null;
  attachment?: MessageAttachment;
};

export type SharedFile = { messageId: string; sentAt: string; attachment: MessageAttachment };
export type SharedLink = { href: string; label: string; messageId: string };

const LINK_RE = /\b(?:https?:\/\/|www\.)[^\s<>"']+/gi;
const TRAILING = /[.,;:!?)\]}»”’]+$/;

/** Enlaces http(s) escritos en los mensajes, sin repetir, del más nuevo al más viejo. */
export function extractLinks(messages: readonly PanelMessage[]): SharedLink[] {
  const seen = new Set<string>();
  const links: SharedLink[] = [];
  for (const message of [...messages].reverse()) {
    for (const raw of message.text?.match(LINK_RE) ?? []) {
      const label = raw.replace(TRAILING, '');
      const candidate = /^www\./i.test(label) ? `https://${label}` : label;
      let href: string;
      try {
        const parsed = new URL(candidate);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') continue;
        href = parsed.href;
      } catch { continue; }
      if (seen.has(href)) continue;
      seen.add(href);
      links.push({ href, label, messageId: message.id });
    }
  }
  return links;
}

/** Adjuntos enviados en la conversación, separados en imágenes y documentos (más nuevos primero). */
export function sharedFiles(messages: readonly PanelMessage[]) {
  const media: SharedFile[] = [];
  const documents: SharedFile[] = [];
  for (const message of [...messages].reverse()) {
    const attachment = message.attachment;
    if (!attachment || attachment.available === false) continue;
    const item = { messageId: message.id, sentAt: message.sent_at, attachment };
    if (attachment.kind === 'image') media.push(item); else documents.push(item);
  }
  return { media, documents };
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2).replace('.', ',')} MB`;
}

export function fileExtension(filename: string) {
  const match = /\.([a-z0-9]{1,5})$/i.exec(filename);
  return match ? match[1].toLowerCase() : '';
}

const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
const shortDate = (date: Date, now: Date) => date.toLocaleDateString('es-AR', {
  day: 'numeric', month: 'short', ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
}).replace('.', '');

export function messageTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
}

/** Separador de día del hilo: "Hoy, 8 sept", "Ayer, 7 sept", "Lunes, 1 sept". */
export function dayDividerLabel(iso: string, now = new Date()) {
  const date = new Date(iso);
  const text = shortDate(date, now);
  if (dayKey(date) === dayKey(now)) return `Hoy, ${text}`;
  if (dayKey(date) === dayKey(addDays(now, -1))) return `Ayer, ${text}`;
  const weekday = date.toLocaleDateString('es-AR', { weekday: 'long' });
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${text}`;
}

export function sameDay(a: string, b: string) {
  return dayKey(new Date(a)) === dayKey(new Date(b));
}

/** Hora del último mensaje en la lista: hora si es de hoy, "Ayer", o la fecha corta. */
export function listStamp(iso: string, now = new Date()) {
  const date = new Date(iso);
  if (dayKey(date) === dayKey(now)) return messageTime(iso);
  if (dayKey(date) === dayKey(addDays(now, -1))) return 'Ayer';
  return shortDate(date, now);
}

/** Última vez que la otra persona abrió el hilo: el read_at más reciente de mis mensajes. */
export function lastSeenAt(messages: readonly PanelMessage[], ownFrom: PanelMessage['from']) {
  let latest: string | null = null;
  for (const message of messages) {
    if (message.from !== ownFrom || !message.read_at) continue;
    if (!latest || Date.parse(message.read_at) > Date.parse(latest)) latest = message.read_at;
  }
  return latest;
}

export function lastSeenLabel(iso: string, now = new Date()) {
  const date = new Date(iso);
  if (dayKey(date) === dayKey(now)) return `Visto hoy a las ${messageTime(iso)}`;
  if (dayKey(date) === dayKey(addDays(now, -1))) return `Visto ayer a las ${messageTime(iso)}`;
  return `Visto el ${shortDate(date, now)}`;
}
