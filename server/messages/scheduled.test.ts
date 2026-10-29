import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registerMessageRoutes } from './routes.js';
import { deliverDueScheduledMessages, horarioValido, resetScheduledMessages, scheduleThreadMessages, tickScheduledMessages } from './scheduled.js';
import { resetMessageMemory } from './repository.js';
import { CareError } from '../care/errors.js';
import { getPatient, resetStore } from '../store.js';

const mock = vi.hoisted(() => ({ actor: vi.fn(), enabled: false, rpc: vi.fn() }));
vi.mock('../db/supabase-client.js', async original => ({ ...await original<typeof import('../db/supabase-client.js')>(), isSupabaseEnabled: () => mock.enabled, getRequestDb: () => ({ rpc: mock.rpc }), privilegedDb: () => ({ rpc: mock.rpc }) }));
vi.mock('../db/supabase-repo.js', async original => ({ ...await original<typeof import('../db/supabase-repo.js')>(), sbGetActor: mock.actor }));

function app(real = false) {
  const api = new Hono();
  api.use('*', async (c, next) => { c.set('auth', real ? { userId: 'actor' } : { demo: true }); await next(); });
  api.onError((error, c) => error instanceof CareError ? c.json({ error: error.message }, error.status) : c.json({ error: 'error' }, 500));
  registerMessageRoutes(api); return api;
}
const post = (api: Hono, value: unknown) => api.request('/api/messages/scheduled', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
const CID = 'c0000000-0000-4000-8000-000000000001';
const enUnaHora = () => new Date(Date.now() + 3_600_000).toISOString();

beforeEach(() => { resetStore(); resetMessageMemory(); resetScheduledMessages(); mock.enabled = false; mock.actor.mockReset(); mock.rpc.mockReset(); });

describe('Mensaje a varias programado', () => {
  it('lo guarda y no lo manda hasta la hora; a la hora entra al hilo una sola vez', async () => {
    const antes = getPatient('pat-sofia')!.messages.length;
    const r = await post(app(), { send_at: enUnaHora(), items: [{ patient_id: 'pat-sofia', client_id: CID, text: '¡Hola Sofía!' }] });
    expect(r.status).toBe(200);
    expect((await r.json()).scheduled).toBe(1);
    expect(await deliverDueScheduledMessages(new Date(), false)).toEqual([]);
    expect(getPatient('pat-sofia')!.messages).toHaveLength(antes);
    const despues = new Date(Date.now() + 2 * 3_600_000);
    expect(await deliverDueScheduledMessages(despues, false)).toEqual(['pat-sofia']);
    expect(await deliverDueScheduledMessages(despues, false)).toEqual([]);
    const hilo = getPatient('pat-sofia')!.messages;
    expect(hilo).toHaveLength(antes + 1);
    expect(hilo[hilo.length - 1]).toMatchObject({ from: 'vero', text: '¡Hola Sofía!' });
  });

  it('el mismo pedido repetido no programa dos veces', async () => {
    const body = { send_at: enUnaHora(), items: [{ patient_id: 'pat-sofia', client_id: CID, text: 'Hola' }] };
    await post(app(), body);
    expect((await (await post(app(), body)).json()).scheduled).toBe(0);
  });

  it('rechaza horarios pasados o muy lejanos, pacientes ajenas y pedidos vacíos', async () => {
    const item = { patient_id: 'pat-sofia', client_id: CID, text: 'Hola' };
    expect((await post(app(), { send_at: new Date(Date.now() - 1000).toISOString(), items: [item] })).status).toBe(400);
    expect((await post(app(), { send_at: new Date(Date.now() + 9 * 86_400_000).toISOString(), items: [item] })).status).toBe(400);
    expect((await post(app(), { send_at: enUnaHora(), items: [{ ...item, patient_id: 'no-existe' }] })).status).toBe(403);
    expect((await post(app(), { send_at: enUnaHora(), items: [] })).status).toBe(400);
    expect((await post(app(), { send_at: enUnaHora(), items: [{ ...item, text: '  ' }] })).status).toBe(400);
    expect(horarioValido('no es fecha')).toBe(false);
  });

  it('con la base, solo la nutricionista programa y se usa la función de la base', async () => {
    mock.enabled = true;
    const body = { send_at: enUnaHora(), items: [{ patient_id: 'a0000000-0000-4000-8000-000000000001', client_id: CID, text: 'Hola' }] };
    mock.actor.mockResolvedValue({ role: 'paciente', patientId: 'p', userId: 'actor' });
    expect((await post(app(true), body)).status).toBe(403);
    mock.actor.mockResolvedValue({ role: 'nutri', nutritionistId: 'n', userId: 'actor' });
    mock.rpc.mockResolvedValue({ data: { scheduled: 1, send_at: body.send_at }, error: null });
    expect((await (await post(app(true), body)).json()).scheduled).toBe(1);
    expect(mock.rpc).toHaveBeenCalledWith('schedule_thread_messages', { payload: body });
  });

  it('si falta la tabla nueva, lo dice claro', async () => {
    mock.rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202' } });
    await expect(scheduleThreadMessages({ send_at: enUnaHora(), items: [{ patient_id: 'x', client_id: CID, text: 'Hola' }] }, true)).rejects.toMatchObject({ status: 501 });
  });

  it('el worker manda los vencidos por la base y no se cae si la base falla', async () => {
    mock.rpc.mockResolvedValueOnce({ data: ['p1', 'p2'], error: null });
    expect(await deliverDueScheduledMessages(new Date(), true)).toEqual(['p1', 'p2']);
    expect(mock.rpc).toHaveBeenCalledWith('deliver_due_scheduled_messages', { p_limit: 50 });
    mock.enabled = true;
    mock.rpc.mockResolvedValueOnce({ data: null, error: { code: '42883' } });
    expect(await tickScheduledMessages(new Date())).toBeNull();
  });
});
