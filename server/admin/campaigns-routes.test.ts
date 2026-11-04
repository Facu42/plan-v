import { Hono } from 'hono';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CareError } from '../care/errors.js';
import { createAuthMiddleware } from '../middleware/auth.js';
const flags = vi.hoisted(() => ({ admin: true, persistent: true }));
vi.mock('../db/supabase-client.js', async (original) => ({ ...await original<typeof import('../db/supabase-client.js')>(), isSupabaseEnabled: () => flags.persistent }));
vi.mock('./repository.js', async (original) => ({ ...await original<typeof import('./repository.js')>(), isAdmin: async () => flags.admin, call: async () => null }));
const { registerAdminRoutes } = await import('./routes.js');
const audience = '11111111-1111-4111-8111-111111111111';
const broadcastId = '22222222-2222-4222-8222-222222222222';
const fetcher = vi.fn();
function app() {
  const instance = new Hono();
  instance.onError((error, c) => error instanceof CareError ? c.json({ error: error.message }, error.status) : c.json({ error: 'Error' }, 500));
  instance.use('/api/*', createAuthMiddleware({ isSupabaseEnabled: () => flags.persistent, verifyAuthToken: async (token) => token ? { userId: 'test-user' } : null, allowDemo: () => !flags.persistent, mfa: { needsSecondStep: async () => false } }));
  registerAdminRoutes(instance);
  return instance;
}
const jwt = (aal = 'aal2') => `Bearer h.${Buffer.from(JSON.stringify({ aal })).toString('base64url')}.s`;
const send = (path: string, method = 'GET', body?: unknown, authorization: string | null = jwt()) => app().request(`/api/admin/campaigns/${path}`, { method, headers: { ...(authorization ? { Authorization: authorization } : {}), 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
function reply(value: unknown, status = 200) { fetcher.mockResolvedValueOnce(new Response(JSON.stringify(value), { status })); }
const draft = () => ({ id: broadcastId, segment_id: audience, status: 'draft', from: 'Nutridash <novedades@news.nutridash.net>', reply_to: ['contacto@nutridash.net'], html: '<a href="{{{RESEND_UNSUBSCRIBE_URL}}}">Darme de baja</a>' });
beforeEach(() => {
  flags.admin = true; flags.persistent = true;
  fetcher.mockReset(); vi.stubGlobal('fetch', fetcher);
  vi.stubEnv('RESEND_API_KEY', 'server-test-key'); vi.stubEnv('RESEND_AUDIENCE_ID', audience); vi.stubEnv('RESEND_CAMPAIGN_FROM', '');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
const endpoints: [string, string, unknown?][] = [
  ['config', 'GET'], ['contacts', 'GET'], ['contacts', 'POST', { email: 'a@example.com' }], ['import', 'POST', { csv: 'email,first_name,last_name\na@example.com,A,B' }], ['broadcasts', 'GET'], ['broadcasts', 'POST', { name: 'Hola', subject: 'Hola', html: 'hola' }], [`broadcasts/${broadcastId}`, 'GET'], [`broadcasts/${broadcastId}/opened`, 'GET'], [`broadcasts/${broadcastId}/send`, 'POST', { confirm: true }], ['emails', 'GET'], [`emails/${broadcastId}`, 'GET'],
];
describe('guarda real de administración y segundo factor', () => {
  it.each(endpoints)('niega a nutris y pacientes: %s %s', async (path, method, body) => {
    flags.admin = false;
    expect((await send(path, method, body)).status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(endpoints)('niega sesión sin segundo factor: %s %s', async (path, method, body) => {
    expect((await send(path, method, body, jwt('aal1'))).status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each(endpoints)('niega demo incluso con credenciales: %s %s', async (path, method, body) => {
    flags.persistent = false;
    expect((await send(`${path}?audience=admin`, method, body)).status).toBe(403);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('niega sin sesión y no expone la clave en configuración', async () => {
    expect((await send('config', 'GET', undefined, null)).status).toBe(401);
    const result = await send('config');
    expect(await result.json()).toEqual({ campaigns_ready: true, mail_ready: true, from: draft().from, reply_to: 'contacto@nutridash.net' });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
describe('operaciones Resend simuladas', () => {
  it('crea contacto en la audiencia configurada', async () => {
    reply({}, 404); reply({ id: broadcastId }, 201);
    expect((await send('contacts', 'POST', { email: 'ANA@example.com', first_name: 'Ana', last_name: 'Gómez' })).status).toBe(201);
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ email: 'ana@example.com', first_name: 'Ana', last_name: 'Gómez', segments: [{ id: audience }] });
  });
  it('respeta la baja de un contacto existente al volver a importarlo', async () => {
    reply({ id: broadcastId, unsubscribed: true }); reply({ id: broadcastId });
    expect((await send('contacts', 'POST', { email: 'a@example.com' })).status).toBe(201);
    expect(fetcher.mock.calls[1][0]).toBe(`https://api.resend.com/contacts/${broadcastId}/segments/${audience}`);
    expect(fetcher.mock.calls[1][1].body).toBeUndefined();
  });
  it('lista bajas y permite paginar', async () => {
    reply({ data: [{ id: broadcastId, email: 'a@example.com', unsubscribed: true }], has_more: true });
    const result = await send(`contacts?after=${broadcastId}`);
    expect(await result.json()).toMatchObject({ data: [{ unsubscribed: true }], has_more: true, next: broadcastId });
    expect(fetcher.mock.calls[0][0]).toContain(`/segments/${audience}/contacts?limit=100&after=${broadcastId}`);
  });
  it('valida todo el CSV antes de llamar a Resend', async () => {
    expect((await send('import', 'POST', { csv: 'email,first_name,last_name\na@example.com,A,B\nmal,C,D' })).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('informa importación parcial sin perder las filas exitosas', async () => {
    reply({}, 404); reply({ id: broadcastId }, 201); reply({ error: 'sensitive' }, 429);
    expect(await (await send('import', 'POST', { csv: 'email,first_name,last_name\na@example.com,A,B\nb@example.com,C,D' })).json()).toMatchObject({ imported: 1, failed_row: 2 });
  });
  it('guarda como borrador con remitente y respuesta fijos', async () => {
    reply({ id: broadcastId }, 201);
    expect((await send('broadcasts', 'POST', { name: 'Hola', subject: 'Hola', html: 'Texto sin baja todavía' })).status).toBe(201);
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toMatchObject({ segment_id: audience, from: draft().from, reply_to: draft().reply_to, send: false });
  });
  it('bloquea un borrador sin baja aunque el cliente afirme tenerla', async () => {
    reply({ ...draft(), html: 'Sin baja' });
    expect((await send(`broadcasts/${broadcastId}/send`, 'POST', { confirm: true })).status).toBe(400);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([{ segment_id: broadcastId }, { status: 'sent' }, { from: 'otro@example.com' }, { reply_to: ['otro@example.com'] }, { text: 'Sin baja' }])('bloquea un envío ajeno o modificado: %j', async (changes) => {
    reply({ ...draft(), ...changes });
    expect((await send(`broadcasts/${broadcastId}/send`, 'POST', { confirm: true })).status).toBeGreaterThanOrEqual(400);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('envía solo después de releer el borrador y recibir confirmación explícita', async () => {
    expect((await send(`broadcasts/${broadcastId}/send`, 'POST', {})).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
    reply(draft()); reply({ id: broadcastId });
    expect((await send(`broadcasts/${broadcastId}/send`, 'POST', { confirm: true })).status).toBe(200);
    expect(fetcher.mock.calls.map((call) => call[0])).toEqual([`https://api.resend.com/broadcasts/${broadcastId}`, `https://api.resend.com/broadcasts/${broadcastId}/send`]);
  });
  it('expone aperturas disponibles y su límite', async () => {
    reply(draft()); reply({ data: [{ email: 'secret@example.com' }], has_more: true });
    expect(await (await send(`broadcasts/${broadcastId}/opened`)).json()).toEqual({ opened: { count: 1, has_more: true } });
  });
  it('degrada aperturas no disponibles sin inventar un cero', async () => {
    reply(draft()); reply({}, 403);
    expect(await (await send(`broadcasts/${broadcastId}/opened`)).json()).toEqual({ opened: null });
  });
  it('lista solo avisos@ y proyecta metadatos sin contenido clínico', async () => {
    reply({ data: [{ id: broadcastId, from: 'Nutridash <avisos@nutridash.net>', created_at: 'hoy', last_event: 'opened', html: 'dato clínico', subject: 'dato privado', to: ['patient@example.com'] }, { id: audience, from: 'novedades@news.nutridash.net' }], has_more: false });
    expect(await (await send('emails')).json()).toEqual({ data: [{ id: broadcastId, from: 'Nutridash <avisos@nutridash.net>', created_at: 'hoy', last_event: 'opened' }], has_more: false, next: null });
  });
  it('relee el último evento y rechaza correo de otro remitente', async () => {
    reply({ id: broadcastId, from: 'avisos@nutridash.net', created_at: 'hoy', last_event: 'delivered', html: 'privado' });
    expect(await (await send(`emails/${broadcastId}`)).json()).toEqual({ id: broadcastId, from: 'avisos@nutridash.net', created_at: 'hoy', last_event: 'delivered' });
    reply({ from: 'otro@example.com' });
    expect((await send(`emails/${broadcastId}`)).status).toBe(404);
  });
  it('rechaza cuerpos, IDs y configuración inválidos sin solicitudes externas', async () => {
    expect((await send('contacts', 'POST', { email: 'mal' })).status).toBe(400);
    expect((await send('contacts?after=../secrets')).status).toBe(400);
    expect((await send('broadcasts/invalid/send', 'POST', { confirm: true })).status).toBe(400);
    vi.stubEnv('RESEND_API_KEY', '');
    expect((await send('emails')).status).toBe(503);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
