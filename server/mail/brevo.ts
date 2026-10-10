import { createHash } from 'node:crypto';

/** Mails de Plan V por la API de Brevo. La clave vive sólo en el servidor (variables de Railway). */
export type BrevoConfig = { apiKey: string; senderEmail: string; senderName: string };
export type BrevoMessage = {
  to: { email: string; name?: string };
  subject: string;
  html: string;
  text: string;
  /** Mismo valor = Brevo no repite el envío (por un rato), aunque el pedido llegue dos veces. */
  idempotencyKey?: string;
};

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

export function brevoConfig(env: Record<string, string | undefined> = process.env): BrevoConfig | null {
  const apiKey = env.BREVO_API_KEY?.trim();
  const senderEmail = env.BREVO_SENDER_EMAIL?.trim();
  if (!apiKey || !senderEmail) return null;
  return { apiKey, senderEmail, senderName: env.BREVO_SENDER_NAME?.trim() || 'Plan V' };
}

/** UUID estable a partir de un texto: la misma llave para el mismo aviso. */
export function stableUuid(seed: string): string {
  const hex = createHash('sha256').update(seed).digest('hex').slice(0, 32).split('');
  hex[12] = '4';
  hex[16] = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  const s = hex.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

export async function sendBrevoEmail(config: BrevoConfig, message: BrevoMessage, fetchImpl: typeof fetch = fetch): Promise<{ status: 'sent' | 'duplicate' }> {
  const response = await fetchImpl(BREVO_URL, {
    method: 'POST',
    headers: { 'api-key': config.apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: config.senderEmail, name: config.senderName },
      to: [message.to],
      subject: message.subject,
      htmlContent: message.html,
      textContent: message.text,
      ...(message.idempotencyKey ? { headers: { idempotencyKey: message.idempotencyKey } } : {}),
    }),
  });
  if (response.ok) return { status: 'sent' };
  const body = await response.text().catch(() => '');
  let code = '';
  try { code = String((JSON.parse(body) as { code?: unknown }).code ?? ''); } catch { /* sin cuerpo JSON */ }
  if (response.status === 400 && code === 'duplicate_parameter') return { status: 'duplicate' };
  throw new Error(`Brevo ${response.status}${code ? ` ${code}` : ''}`);
}
