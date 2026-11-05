import type { BrevoMessage } from './brevo.js';

/** Mails operativos (invitaciones, avisos, planes) por la API de Resend. La clave vive solo en el servidor. */
export type ResendMailConfig = { apiKey: string; senderEmail: string; senderName: string };
type ResendMessage = BrevoMessage & { unsubscribeUrl?: string };

const RESEND_EMAILS_URL = 'https://api.resend.com/emails';
const DEFAULT_SENDER = 'avisos@nutridash.net';
const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

export function resendMailConfig(env: Record<string, string | undefined> = process.env): ResendMailConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const senderEmail = env.RESEND_SENDER_EMAIL?.trim() || DEFAULT_SENDER;
  if (!apiKey || !EMAIL.test(senderEmail)) return null;
  return { apiKey, senderEmail, senderName: env.RESEND_SENDER_NAME?.trim() || 'Nutridash' };
}

/** «Nombre» <mail>, sin comillas ni signos que rompan el encabezado. */
function mailbox(email: string, name?: string): string {
  const clean = (name ?? '').replace(/["<>\\\r\n]/g, '').trim();
  return clean ? `"${clean}" <${email}>` : email;
}

export async function sendResendEmail(config: ResendMailConfig, message: ResendMessage, fetchImpl: typeof fetch = fetch): Promise<{ providerId: string | null }> {
  const response = await fetchImpl(RESEND_EMAILS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
      ...(message.idempotencyKey ? { 'Idempotency-Key': message.idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: mailbox(config.senderEmail, message.senderName ?? config.senderName),
      to: [mailbox(message.to.email, message.to.name)],
      ...(message.replyTo ? { reply_to: [mailbox(message.replyTo.email, message.replyTo.name)] } : {}),
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.unsubscribeUrl ? { headers: { 'List-Unsubscribe': `<${message.unsubscribeUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' } } : {}),
    }),
  });
  if (!response.ok) throw new Error(`Resend ${response.status}`);
  const body = await response.json().catch(() => ({})) as { id?: unknown };
  return { providerId: typeof body.id === 'string' ? body.id : null };
}
