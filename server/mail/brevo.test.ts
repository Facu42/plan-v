import { describe, expect, it, vi } from 'vitest';
import { brevoConfig, sendBrevoEmail, stableUuid } from './brevo.js';

const config = { apiKey: 'clave-de-prueba', senderEmail: 'hola@planv.test', senderName: 'Plan V' };
const message = { to: { email: 'ana@example.com', name: 'Ana' }, subject: 'Asunto', html: '<p>Hola</p>', text: 'Hola' };

describe('Brevo', () => {
  it('sólo se usa con clave y remitente cargados', () => {
    expect(brevoConfig({})).toBeNull();
    expect(brevoConfig({ BREVO_API_KEY: 'x' })).toBeNull();
    expect(brevoConfig({ BREVO_API_KEY: ' x ', BREVO_SENDER_EMAIL: 'hola@planv.test' })).toEqual({ apiKey: 'x', senderEmail: 'hola@planv.test', senderName: 'Nutridash' });
  });

  it('manda el mail con la clave en el encabezado y una llave para no repetirlo', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ messageId: 'm1' }), { status: 201 }));
    await sendBrevoEmail(config, { ...message, idempotencyKey: stableUuid('turno-1') }, fetchImpl);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.brevo.com/v3/smtp/email');
    expect((init.headers as Record<string, string>)['api-key']).toBe('clave-de-prueba');
    expect(JSON.parse(String(init.body))).toEqual({
      sender: { email: 'hola@planv.test', name: 'Plan V' }, to: [{ email: 'ana@example.com', name: 'Ana' }],
      subject: 'Asunto', htmlContent: '<p>Hola</p>', textContent: 'Hola', headers: { idempotencyKey: stableUuid('turno-1') },
    });
  });

  it('la llave es la misma para el mismo turno y distinta para otro', () => {
    expect(stableUuid('a')).toBe(stableUuid('a'));
    expect(stableUuid('a')).not.toBe(stableUuid('b'));
    expect(stableUuid('a')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('un repetido cuenta como ya enviado y los otros errores no muestran la clave', async () => {
    const duplicate = vi.fn(async () => new Response(JSON.stringify({ code: 'duplicate_parameter' }), { status: 400 }));
    await expect(sendBrevoEmail(config, message, duplicate)).resolves.toEqual({ status: 'duplicate' });
    const failing = vi.fn(async () => new Response('{"code":"unauthorized"}', { status: 401 }));
    await expect(sendBrevoEmail(config, message, failing)).rejects.toThrow(/Brevo 401/);
    await expect(sendBrevoEmail(config, message, failing)).rejects.not.toThrow(/clave-de-prueba/);
  });
});
