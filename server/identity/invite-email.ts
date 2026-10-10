import { CareError } from '../care/errors.js';
import { writeOpsLog } from '../ops/log.js';
import { PUBLIC_SIGNUP_ROLE } from '../../src/context/auth-policy.js';

type MailError = { code?: string; status?: number; message?: string } | null;
type MailResult = Promise<{ error: MailError }>;

/** Los dos mails de Supabase Auth que sirven para invitar: alta nueva o entrar a una cuenta existente. */
export type InviteMailer = {
  invite(email: string, options: { redirectTo: string; data: { role: typeof PUBLIC_SIGNUP_ROLE } }): MailResult;
  magicLink(email: string, redirectTo: string): MailResult;
};

export type InviteEmailDelivery = 'invite' | 'magic_link';

function alreadyRegistered(error: MailError): boolean {
  if (!error) return false;
  if (error.code === 'email_exists' || error.code === 'user_already_exists') return true;
  return /already (been )?registered|already exists/i.test(error.message ?? '');
}

function mailFailure(error: NonNullable<MailError>, step: InviteEmailDelivery): never {
  writeOpsLog('warn', 'invite_email_failed', { step, code: error.code ?? String(error.status ?? 'unknown') });
  if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
    throw new CareError(429, 'Se alcanzó el límite de mails por hora. Copiá el enlace o probá más tarde.');
  }
  // El servidor de mails que trae Supabase sólo manda a las direcciones del equipo del proyecto.
  if (error.code === 'email_address_not_authorized') {
    throw new CareError(503, 'El envío de mails todavía no está habilitado para esta dirección. Copiá el enlace o mandalo por WhatsApp.');
  }
  throw new CareError(503, 'No se pudo mandar el mail. Copiá el enlace o reintentá en un momento.');
}

/**
 * Manda por mail el mismo enlace de invitación que la nutricionista puede copiar. Sin cuenta, sale la
 * invitación de Supabase (crea la cuenta como paciente); con cuenta, un enlace para entrar. Al abrirlo,
 * la app acepta la invitación con las mismas reglas de siempre (mail confirmado y coincidente).
 */
export async function emailPatientInvite(invite: { id: string; email: string }, site: string | undefined, mailer: InviteMailer): Promise<{ delivery: InviteEmailDelivery }> {
  if (!site) throw new CareError(503, 'Falta la dirección del sitio publicado para armar el enlace. Copiá el enlace mientras tanto.');
  const redirectTo = `${site}/app/inicio?invite=${encodeURIComponent(invite.id)}`;
  const sent = await mailer.invite(invite.email, { redirectTo, data: { role: PUBLIC_SIGNUP_ROLE } });
  if (!sent.error) return { delivery: 'invite' };
  if (!alreadyRegistered(sent.error)) mailFailure(sent.error, 'invite');
  const linked = await mailer.magicLink(invite.email, redirectTo);
  if (linked.error) mailFailure(linked.error, 'magic_link');
  return { delivery: 'magic_link' };
}
