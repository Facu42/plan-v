import { describe, expect, it, vi } from 'vitest';
import { resendMailConfig, sendResendEmail } from './resend-send.js';
import { mailTransportConfig, sendOperationalMail } from './transport.js';

const env = { MAIL_ENABLED: 'true', MAIL_PROVIDER: 'resend', RESEND_API_KEY: 'test-key' };
const message = { to: { email: 'paciente@example.test', name: 'Ana' }, subject: 'Tu espacio en Nutridash', text: 'Hola', html: '<p>Hola</p>', senderName: 'Lic. Vero vía Nutridash', replyTo: { email: 'vero@example.test', name: 'Vero' } };

describe('envío operativo por Resend', () => {
  it('solo se activa con bandera, proveedor y clave; remitente por defecto de Nutridash', () => {
    expect(mailTransportConfig({ MAIL_PROVIDER: 'resend', RESEND_API_KEY: 'test-key' })).toBeNull();
    expect(mailTransportConfig({ MAIL_ENABLED: 'true', MAIL_PROVIDER: 'resend' })).toBeNull();
    expect(mailTransportConfig(env)).toEqual({ provider: 'resend', config: { apiKey: 'test-key', senderEmail: 'avisos@nutridash.net', senderName: 'Nutridash' } });
    expect(resendMailConfig({ RESEND_API_KEY: 'k', RESEND_SENDER_EMAIL: 'no es mail' })).toBeNull();
  });

  it('manda remitente de la nutri, respuestas a ella y devuelve el id de Resend', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ id: 'msg_1' }), { status: 200 }));
    await expect(sendResendEmail(resendMailConfig(env)!, { ...message, idempotencyKey: 'k1' }, fetcher as typeof fetch)).resolves.toEqual({ providerId: 'msg_1' });
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect((init.headers as Record<string, string>)['Idempotency-Key']).toBe('k1');
    expect(JSON.parse(String(init.body))).toMatchObject({ from: '"Lic. Vero vía Nutridash" <avisos@nutridash.net>', to: ['"Ana" <paciente@example.test>'], reply_to: ['"Vero" <vero@example.test>'], subject: 'Tu espacio en Nutridash' });
  });

  it('un rechazo de Resend queda como entrega incierta, sin reintento', async () => {
    const fetcher = vi.fn(async () => new Response('{}', { status: 403 }));
    await expect(sendOperationalMail(mailTransportConfig(env)!, message, async () => true, undefined, fetcher as typeof fetch)).rejects.toMatchObject({ uncertain: true });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
