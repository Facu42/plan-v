import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerAjustesRoutes } from './routes.js';
import { resetAjustes } from './repository.js';
import { CareError } from '../care/errors.js';

const mock = vi.hoisted(() => ({ actor: vi.fn(), enabled: false }));
vi.mock('../db/supabase-client.js', () => ({ isSupabaseEnabled: () => mock.enabled, getRequestDb: vi.fn() }));
vi.mock('../db/supabase-repo.js', async original => ({ ...await original<typeof import('../db/supabase-repo.js')>(), sbGetActor: mock.actor }));
function app(real = false) {
  const api = new Hono();
  api.use('*', async (c, next) => { c.set('auth', real ? { userId: 'actor' } : { demo: true }); await next(); });
  api.onError((error, c) => error instanceof CareError ? c.json({ error: error.message }, error.status) : c.json({ error: 'error' }, 500));
  registerAjustesRoutes(api); return api;
}
const send = (api: Hono, path: string, value: unknown, method = 'PUT') => api.request(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
const ID = 'c0000000-0000-4000-8000-000000000001';
beforeEach(() => { resetAjustes(); mock.enabled = false; mock.actor.mockReset(); });

describe('Rutas de Ajustes', () => {
  it('guarda, lista, edita y elimina plantillas', async () => {
    const api = app();
    expect((await (await api.request('/api/ajustes/templates')).json()).templates).toEqual([]);
    const form = { id: ID, kind: 'Formulario', name: 'Control de embarazo', when_text: 'Antes de cada turno', questions: ['¿Cómo dormiste?', ' ¿Náuseas? '] };
    const saved = await (await send(api, '/api/ajustes/templates', form)).json();
    expect(saved.template.questions).toEqual(['¿Cómo dormiste?', '¿Náuseas?']);
    await send(api, '/api/ajustes/templates', { ...form, name: 'Control de embarazo 2' });
    const list = (await (await api.request('/api/ajustes/templates')).json()).templates;
    expect(list).toHaveLength(1); expect(list[0].name).toBe('Control de embarazo 2');
    expect((await api.request(`/api/ajustes/templates/${ID}`, { method: 'DELETE' })).status).toBe(200);
    expect((await (await api.request('/api/ajustes/templates')).json()).templates).toEqual([]);
  });
  it('rechaza plantillas sin preguntas, certificados cortos y momentos inventados', async () => {
    const api = app(), base = { id: ID, name: 'Constancia', when_text: 'Antes de cada turno' };
    expect((await send(api, '/api/ajustes/templates', { ...base, kind: 'Formulario', questions: [] })).status).toBe(400);
    expect((await send(api, '/api/ajustes/templates', { ...base, kind: 'Certificado', text: 'corto' })).status).toBe(400);
    expect((await send(api, '/api/ajustes/templates', { ...base, kind: 'Certificado', text: 'Certifico que {nombre} asistió.', when_text: 'cuando quiera' })).status).toBe(400);
    expect((await api.request('/api/ajustes/templates/no-es-un-id', { method: 'DELETE' })).status).toBe(400);
  });
  it('guarda la configuración de cada aviso y la devuelve', async () => {
    const api = app();
    const body = { key: 'cumple', enabled: true, when_text: 'Ese día a las 9', message: '¡Feliz cumple, {nombre}!' };
    expect((await send(api, '/api/ajustes/notices', body)).status).toBe(200);
    expect((await (await api.request('/api/ajustes/notices')).json()).notices[0]).toMatchObject(body);
    expect((await send(api, '/api/ajustes/notices', { ...body, key: 'otro' })).status).toBe(400);
  });
  it('sólo la nutricionista usa estas rutas', async () => {
    mock.enabled = true;
    for (const actor of [{ role: 'paciente', patientId: 'p', userId: 'actor' }, { role: 'admin', userId: 'actor' }]) {
      mock.actor.mockResolvedValue(actor);
      for (const path of ['/api/ajustes/templates', '/api/ajustes/notices']) expect((await app(true).request(path)).status).toBe(403);
    }
  });
});
