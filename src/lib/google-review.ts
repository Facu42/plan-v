/** Link de reseña de Google Business. Solo hosts de Google y https, sin datos de pacientes. */

const HOSTS = new Set([
  'g.page',
  'www.g.page',
  'google.com',
  'www.google.com',
  'maps.google.com',
  'search.google.com',
  'business.google.com',
]);

const PLACE_ID = /^[A-Za-z0-9_-]{10,}$/;
const GPAGE = /^\/(?:r\/)?[A-Za-z0-9_-]+(?:\/review)?$/;

function parsed(raw: string): URL | null {
  const value = raw.trim();
  if (!value || value.length > 300) return null;
  let url: URL;
  try { url = new URL(value); } catch { return null; }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) return null;
  if (!HOSTS.has(url.hostname)) return null;
  return url;
}

function placeId(url: URL): string | null {
  const id = url.searchParams.get('placeid') ?? url.searchParams.get('query_place_id') ?? '';
  return PLACE_ID.test(id) ? id : null;
}

/** Arma el link para dejar la reseña. Null si no es un link de Google que sepamos convertir. */
export function googleReviewLink(raw: string): string | null {
  const url = parsed(raw);
  if (!url) return null;
  const id = placeId(url);
  if (id) return `https://search.google.com/local/writereview?placeid=${id}`;
  if (url.hostname === 'g.page' || url.hostname === 'www.g.page') {
    const path = url.pathname.replace(/\/+$/, '') || '/';
    if (!GPAGE.test(path)) return null;
    return `https://g.page${path.endsWith('/review') ? path : `${path}/review`}`;
  }
  if (url.hostname === 'search.google.com' && url.pathname.replace(/\/+$/, '') === '/local/writereview') {
    return null;
  }
  return null;
}

export function isGoogleBusinessUrl(raw: string): boolean {
  return raw.trim() === '' || googleReviewLink(raw) !== null;
}

export function reviewRequestText(link: string): string {
  return `Si querés, dejá una reseña en Google: ${link}`;
}

export type ReviewAudience = {
  /** Pidió no recibir avisos de este tipo. */
  campaignOptOut: boolean;
  /** Mensajes dentro de la app. */
  inApp: boolean;
  /** Mail de avisos. */
  email: boolean;
  /** Avisos por WhatsApp. */
  broadcasts: boolean;
};

export type ReviewChannel = 'chat' | 'email' | 'whatsapp';

export function reviewChannels(audience: ReviewAudience): Record<ReviewChannel, boolean> {
  if (audience.campaignOptOut) return { chat: false, email: false, whatsapp: false };
  return { chat: audience.inApp, email: audience.email, whatsapp: audience.broadcasts };
}

export type ReviewDelivery = {
  link: string;
  text: string;
  delivered: 'chat' | 'none';
  channels: Record<ReviewChannel, 'sent' | 'opt_out' | 'not_sent'>;
};

/**
 * El chat de la app es el canal que ya existe.
 * Mail y WhatsApp no se disparan acá (siguen sus propios envíos y no hay gasto).
 * Si la paciente se dio de baja, no se manda nada.
 */
export function planReviewDelivery(link: string, audience: ReviewAudience | null): ReviewDelivery {
  const text = reviewRequestText(link);
  if (!audience) {
    return { link, text, delivered: 'none', channels: { chat: 'opt_out', email: 'opt_out', whatsapp: 'opt_out' } };
  }
  const allowed = reviewChannels(audience);
  return {
    link,
    text,
    delivered: allowed.chat ? 'chat' : 'none',
    channels: {
      chat: allowed.chat ? 'sent' : 'opt_out',
      email: allowed.email ? 'not_sent' : 'opt_out',
      whatsapp: allowed.whatsapp ? 'not_sent' : 'opt_out',
    },
  };
}
