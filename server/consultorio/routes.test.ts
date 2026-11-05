import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CareError } from '../care/errors.js';
import { registerConsultorioRoutes } from './routes.js';
import { resetSedesMemory } from './sedes.js';
import { profiles } from '../scheduling/repository.js';
import { schedulingDefaultSettings } from '../../src/types/scheduling.js';
import { DEMO_NUTRITIONIST_ID } from '../store.js';

const mock = vi.hoisted(() => ({ actor: vi.fn(), enabled: false }));
vi.mock('../db/supabase-client.js', async original => ({ ...await original<typeof import('../db/supabase-client.js')>(), isSupabaseEnabled: () => mock.enabled }));
vi.mock('../db/supabase-repo.js', async original => ({ ...await original<typeof import('../db/supabase-repo.js')>(), sbGetActor: mock.actor }));

function app(real = false) {
  const api = new Hono();
  api.use('*', async (c, next) => { c.set('auth', real ? { userId: 'actor' } : { demo: true }); await next(); });
  api.onError((error, c) => error instanceof CareError ? c.json({ error: error.message }, error.status) : c.json({ error: String(error) }, 500));
  registerConsultorioRoutes(api); return api;
}
const SEDE = '00000000-0000-4000-a000-0000000000b2';
beforeEach(() => { resetSedesMemory(); profiles.clear(); mock.enabled = false; mock.actor.mockReset(); });

describe('rutas del consultorio', () => {
  it('devuelve las estadísticas del período pedido', async () => {
    const r = await app().request('/api/consultorio/estadisticas?meses=12');
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.meses).toHaveLength(12);
    expect(body.total).toHaveProperty('ausencias');
    expect(body.porSede[0].nombre).toBe('Consultorio');
  });

  it('guarda la sede de un turno solo si la sede existe', async () => {
    const config = schedulingDefaultSettings();
    profiles.set(DEMO_NUTRITIONIST_ID, { nutritionist_id: DEMO_NUTRITIONIST_ID, slug: 'demo', revision: 1, config: { ...config, calendars: [...config.calendars, { id: SEDE, name: 'Palermo' }] } });
    const api = app();
    const put = (body: unknown) => api.request('/api/consultorio/sedes-de-turnos/turno-1', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    expect((await put({ location_id: '00000000-0000-4000-a000-0000000000ff' })).status).toBe(400);
    expect((await put({ location_id: SEDE, otra: 1 })).status).toBe(400);
    expect((await put({ location_id: SEDE })).status).toBe(200);
    expect(await (await api.request('/api/consultorio/sedes-de-turnos')).json()).toEqual({ instalada: true, turnos: { 'turno-1': SEDE } });
    expect((await put({ location_id: null })).status).toBe(200);
    expect((await (await api.request('/api/consultorio/sedes-de-turnos')).json()).turnos).toEqual({});
  });

  it('las estadísticas son solo para la nutricionista', async () => {
    mock.enabled = true; mock.actor.mockResolvedValue({ role: 'paciente', userId: 'actor', patientId: 'p1' });
    const r = await app(true).request('/api/consultorio/estadisticas');
    expect(r.status).toBe(403);
  });

  it('la secretaria necesita acceso al consultorio que pide', async () => {
    mock.enabled = true;
    const r = await app(true).request('/api/consultorio/sedes-de-turnos?consultorio=no-es-un-id');
    expect(r.status).toBe(400);
  });
});
