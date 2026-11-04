import { z } from 'zod';
import { CareError } from '../care/errors.js';
import { ResendClient } from '../mail/resend.js';
import type { CampaignBroadcast, CampaignContact, CampaignDraft, CampaignImport, ResendPage, TransactionalMail } from '../../src/types/admin-campaigns.js';

export const UNSUBSCRIBE = '{{{RESEND_UNSUBSCRIBE_URL}}}';
export const contactSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  first_name: z.string().trim().max(100).default(''),
  last_name: z.string().trim().max(100).default(''),
}).strict();
export const draftSchema = z.object({ name: z.string().trim().min(1).max(100), subject: z.string().trim().min(1).max(200), html: z.string().min(1).max(100_000) }).strict();

/** Lee etiquetas y atributos completos: un href dentro de title/data-href no cuenta. */
export function validateUnsubscribe(html: string) {
  const visible = html.replace(/<!--[\s\S]*?(?:-->|$)/g, '').replace(/<(script|style|template|textarea|title|xmp|iframe|noembed|noframes|noscript|select)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, '');
  const tags = /<([a-z][a-z0-9]*)\b((?:"[^"]*"|'[^']*'|[^'">])*)>/gi;
  for (const tag of visible.matchAll(tags)) {
    if (tag[1].toLowerCase() !== 'a') continue;
    let remaining = tag[2];
    const attributes = new Map<string, string>();
    // Consumir cada atributo desde el principio impide saltar comillas inválidas.
    while (remaining.trim()) {
      const attribute = /^\s+([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/.exec(remaining);
      if (!attribute) break;
      const name = attribute[1].toLowerCase();
      if (!attributes.has(name)) attributes.set(name, attribute[2] ?? attribute[3] ?? attribute[4] ?? '');
      remaining = remaining.slice(attribute[0].length);
    }
    const content = visible.slice(tag.index! + tag[0].length).match(/^([\s\S]*?)<\/a\s*>/i)?.[1];
    if (!remaining.trim() && attributes.get('href') === UNSUBSCRIBE && content?.replace(/<[^>]*>/g, '').trim()) return;
  }
  throw new CareError(400, 'Agregá un enlace de baja con {{{RESEND_UNSUBSCRIBE_URL}}} antes de enviar.');
}

/** CSV acotado, con comillas RFC 4180. Valida el archivo completo antes de escribir. */
export function parseLeadsCsv(input: string): z.infer<typeof contactSchema>[] {
  if (input.length > 100_000) throw new CareError(413, 'El CSV supera los 100 KB.');
  const text = input.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [], field = '', quoted = false, closed = false;
  const invalid = () => { throw new CareError(400, 'Revisá el formato CSV y sus comillas.'); };
  const endField = () => { row.push(field); field = ''; closed = false; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else field += ch;
    } else if (ch === '"') {
      if (field || closed) invalid();
      quoted = true;
    } else if (ch === ',') endField();
    else if (ch === '\n' || ch === '\r') {
      endField();
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      if (ch === '\r' && text[i + 1] === '\n') i++;
    } else {
      if (closed) invalid();
      field += ch;
    }
  }
  if (quoted) invalid();
  endField();
  if (row.some((value) => value.trim())) rows.push(row);
  const headers = rows.shift()?.map((value) => value.trim());
  if (!headers || headers.length !== 3 || new Set(headers).size !== 3 || !['email', 'first_name', 'last_name'].every((name) => headers.includes(name))) {
    throw new CareError(400, 'El CSV necesita las columnas email, first_name y last_name.');
  }
  if (!rows.length || rows.length > 100) throw new CareError(400, 'Importá entre 1 y 100 filas por archivo.');
  const contacts = new Map<string, z.infer<typeof contactSchema>>();
  rows.forEach((values, index) => {
    const parsed = contactSchema.safeParse(Object.fromEntries(headers.map((name, n) => [name, values[n]])));
    if (values.length !== 3 || !parsed.success) throw new CareError(400, `Revisá los datos de la fila ${index + 2}. No se importó ningún contacto.`);
    contacts.set(parsed.data.email, parsed.data);
  });
  return [...contacts.values()];
}

export function campaignConfig() {
  const key = process.env.RESEND_API_KEY?.trim();
  const audience = process.env.RESEND_AUDIENCE_ID?.trim();
  return {
    key, audience,
    from: process.env.RESEND_CAMPAIGN_FROM?.trim() || 'Nutridash <novedades@news.nutridash.net>',
    reply_to: 'contacto@nutridash.net',
  };
}
export function campaignService(client?: ResendClient) {
  const config = campaignConfig();
  if (!config.key) throw new CareError(503, 'El correo de Resend está apagado. Falta configurar la clave en el servidor.');
  const resend = client ?? new ResendClient(config.key);
  const audience = () => {
    if (!config.audience || !z.uuid().safeParse(config.audience).success) throw new CareError(503, 'Falta configurar una audiencia válida de leads en el servidor.');
    return config.audience;
  };
  const page = async <T extends { id: string }>(path: string, after?: string, filter: (row: T) => boolean = () => true): Promise<ResendPage<T>> => {
    const query = new URLSearchParams({ limit: '100' });
    if (after) query.set('after', after);
    const result = await resend.call<{ data: T[]; has_more: boolean }>(`${path}?${query}`);
    return { data: result.data.filter(filter), has_more: result.has_more, next: result.has_more ? result.data[result.data.length - 1]?.id ?? null : null };
  };
  const isOurs = (broadcast: CampaignBroadcast) => (broadcast.segment_id ?? broadcast.audience_id) === audience();
  const broadcast = async (id: string) => {
    const row = await resend.call<CampaignBroadcast>(`/broadcasts/${id}`);
    if (!isOurs(row)) throw new CareError(403, 'Esta campaña no pertenece a la audiencia de leads.');
    return row;
  };
  const addContact = async (contact: z.infer<typeof contactSchema>) => {
    const segment = audience();
    const existing = await resend.call<CampaignContact | null>(`/contacts/${encodeURIComponent(contact.email)}`, 'GET', undefined, true);
    if (existing) {
      // Nunca escribir unsubscribed:false: una importación no revierte una baja.
      await resend.call(`/contacts/${encodeURIComponent(existing.id)}/segments/${segment}`, 'POST');
      return { id: existing.id };
    }
    return resend.call<{ id: string }>('/contacts', 'POST', { ...contact, segments: [{ id: segment }] });
  };
  return {
    contacts: (after?: string) => page<CampaignContact>(`/segments/${audience()}/contacts`, after),
    addContact,
    async importContacts(contacts: z.infer<typeof contactSchema>[]): Promise<CampaignImport> {
      let imported = 0;
      for (const contact of contacts) {
        try { await addContact(contact); imported++; }
        catch { return { imported, failed_row: imported + 1, message: 'La importación se detuvo. Las filas anteriores quedaron guardadas; podés volver a importar sin revertir bajas.' }; }
      }
      return { imported, failed_row: null };
    },
    broadcasts: (after?: string) => { audience(); return page<CampaignBroadcast>('/broadcasts', after, isOurs); },
    broadcast,
    createDraft: (draft: CampaignDraft) => resend.call<{ id: string }>('/broadcasts', 'POST', {
      ...draft, segment_id: audience(), from: config.from, reply_to: [config.reply_to], send: false,
    }),
    async send(id: string) {
      const row = await broadcast(id);
      if (row.status !== 'draft') throw new CareError(409, 'Solo se puede enviar un borrador. Actualizá el estado.');
      if (row.from !== config.from || row.reply_to?.length !== 1 || row.reply_to[0] !== config.reply_to) throw new CareError(400, 'El remitente o la dirección de respuesta no coinciden con la configuración de campañas.');
      validateUnsubscribe(row.html ?? '');
      if (row.text && !row.text.includes(UNSUBSCRIBE)) throw new CareError(400, 'La versión de texto también necesita el enlace de baja.');
      return resend.call<{ id: string }>(`/broadcasts/${id}/send`, 'POST', {});
    },
    async opened(id: string) {
      await broadcast(id);
      // Una página, sin inventar totales ni exponer destinatarios.
      try {
        const result = await resend.call<{ data: unknown[]; has_more: boolean }>(`/broadcasts/${id}/recipients?type=opened&limit=100`);
        return { count: result.data.length, has_more: result.has_more };
      } catch { return null; } // Tracking/plan/permisos pueden no ofrecer aperturas.
    },
    async emails(after?: string) {
      const result = await page<TransactionalMail>('/emails', after, isTransactional);
      return { ...result, data: result.data.map(mailMetadata) };
    },
    async email(id: string) {
      const row = await resend.call<TransactionalMail>(`/emails/${id}`);
      if (!isTransactional(row)) throw new CareError(404, 'Ese correo no es un aviso transaccional.');
      return mailMetadata(row);
    },
  };
}
function isTransactional(row: TransactionalMail) {
  return /^(?:[^<>]*<)?avisos@nutridash\.net>?$/i.test(row.from.trim());
}
function mailMetadata(row: TransactionalMail): TransactionalMail {
  return { id: row.id, from: row.from, created_at: row.created_at, last_event: row.last_event };
}
