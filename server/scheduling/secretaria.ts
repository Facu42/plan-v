// Invitación de la secretaria: arma el enlace /equipo?codigo=… y, si el correo de Nutridash está prendido, lo manda por mail.
// La secretaria no ocupa lugar de profesional en el plan (como en Nutreando, va incluida).
import { mailTransportConfig, sendOperationalMail } from '../mail/transport.js';
import { secretaryInviteEmail } from '../mail/templates.js';
import { stableUuid } from '../mail/brevo.js';
import { siteUrl } from '../admin/accounts.js';
import { writeOpsLog } from '../ops/log.js';

export type MailDeInvitacion = 'enviado' | 'apagado' | 'fallo';
export const INVITE_DAYS = 7;

export function enlaceDeInvitacion(site: string | undefined, token: string): string | null {
  if (!site) return null;
  const url = new URL('/equipo', site);
  url.searchParams.set('codigo', token);
  return url.toString();
}

/** Manda el mail si hay correo configurado. Nunca rompe la invitación: el código ya quedó guardado. */
export async function mandarInvitacion(input: { email: string; clinic: string; link: string | null; token: string }, send = sendOperationalMail, config = mailTransportConfig()): Promise<MailDeInvitacion> {
  if (!config || !input.link) return 'apagado';
  try {
    await send(config, { to: { email: input.email }, ...secretaryInviteEmail({ clinic: input.clinic, link: input.link, days: INVITE_DAYS }), idempotencyKey: stableUuid(`staff-invite:${input.token.slice(0, 16)}`) }, async () => true);
    return 'enviado';
  } catch {
    writeOpsLog('warn', 'staff_invite_mail_failed');
    return 'fallo';
  }
}

export const invitacionSitio = () => siteUrl();
