import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseLeadsCsv, validateUnsubscribe } from './campaigns.js';
import { ResendClient } from '../mail/resend.js';

const audience = '11111111-1111-4111-8111-111111111111';
afterEach(() => vi.unstubAllGlobals());
describe('CSV de leads', () => {
  it('lee BOM, CRLF, comas, comillas escapadas y saltos dentro de campos', () => {
    expect(parseLeadsCsv('\uFEFFemail,first_name,last_name\r\nANA@example.com,"Ana, María","D""Elía"\r\n')).toEqual([{ email: 'ana@example.com', first_name: 'Ana, María', last_name: 'D"Elía' }]);
    expect(parseLeadsCsv('last_name,email,first_name\n"Dos\nlíneas",a@example.com,Ana')[0].last_name).toBe('Dos\nlíneas');
  });
  it.each(['email,name\na@example.com,Ana', 'email,first_name,last_name\nmal,Ana,X', 'email,first_name,last_name\n"sin cerrar', 'email,first_name,last_name\na@example.com,A,B,extra', 'email,first_name,last_name'])('rechaza CSV inválido antes de importar: %s', (csv) => expect(() => parseLeadsCsv(csv)).toThrow());
  it('deduplica por correo y limita tamaño y filas', () => {
    expect(parseLeadsCsv('email,first_name,last_name\na@example.com,A,B\nA@example.com,A,B')).toHaveLength(1);
    expect(() => parseLeadsCsv('x'.repeat(100_001))).toThrow();
    expect(() => parseLeadsCsv('email,first_name,last_name\n' + Array.from({ length: 101 }, (_, n) => `a${n}@example.com,A,B`).join('\n'))).toThrow();
  });
});
describe('baja obligatoria', () => {
  it('exige un enlace utilizable y visible con el marcador exacto', () => {
    expect(() => validateUnsubscribe('<a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Dar de baja</a>')).not.toThrow();
  });
  it.each(['<!--<a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Baja</a>', '<script><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Baja</a>', '<iframe><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Baja</a>', `<a title=' href="{{{RESEND_UNSUBSCRIBE_URL}}}"'>Baja</a>`, `<div title='<a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Baja</a>'></div>`, '<a href="https://example.com" href="{{{RESEND_UNSUBSCRIBE_URL}}}">Baja</a>', '<a data-href="{{{RESEND_UNSUBSCRIBE_URL}}}">Baja</a>', '<script><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Baja</a></script>', '<style><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Baja</a></style>', '<template><a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Baja</a></template>', 'hola', '{{{RESEND_UNSUBSCRIBE_URL}}}', '<!-- <a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Baja</a> -->', '<a href="{{RESEND_UNSUBSCRIBE_URL}}">Baja</a>', '<a href="{{{RESEND_UNSUBSCRIBE_URL}}}"></a>'])('bloquea baja inválida: %s', (html) => expect(() => validateUnsubscribe(html)).toThrow());
});
describe('cliente Resend', () => {
  it('usa credencial solo en el servidor y contratos REST; no reintenta escrituras', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: audience }), { status: 201 }));
    vi.stubGlobal('fetch', fetcher);
    const client = new ResendClient('test-key', 0);
    await client.call('/broadcasts', 'POST', { subject: 'Hola' });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][0]).toBe('https://api.resend.com/broadcasts');
    expect(fetcher.mock.calls[0][1]).toMatchObject({ method: 'POST', headers: { Authorization: 'Bearer test-key' }, body: '{"subject":"Hola"}' });
  });
  it.each([401, 429, 500])('oculta errores y secretos de Resend (%s)', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('secret-in-provider-error', { status })));
    await expect(new ResendClient('test-key', 0).call('/emails')).rejects.toThrow('Resend');
    await expect(new ResendClient('test-key', 0).call('/emails')).rejects.not.toThrow('secret-in-provider-error');
  });
});
