import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../db/supabase-client.js', () => ({ isSupabaseEnabled: () => true, privilegedDb: () => { throw new Error('sin base en pruebas'); } }));

import { CareError } from '../care/errors.js';
import { allowedPushEndpoint, createPushNotifier, PUSH_TEXTS, pushConfig, type PushStore, type StoredSubscription } from './push.js';
import { registerPushRoutes } from './routes.js';

const CONFIG = { VAPID_PUBLIC_KEY: 'pub', VAPID_PRIVATE_KEY: 'priv', VAPID_SUBJECT: 'mailto:hola@planv.test' };
const PHONE: StoredSubscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', p256dh: 'BKey', auth: 'aut' };

function memoryStore(rows: Array<StoredSubscription & { user_id: string }> = [], patients: Record<string, string | null> = { p1: 'u1' }) {
  const removed: string[] = [];
  const store: PushStore = {
    patientUser: async id => patients[id] ?? null,
    forUser: async user => rows.filter(row => row.user_id === user),
    save: async (user, sub) => { rows.splice(0, rows.length, ...rows.filter(row => row.endpoint !== sub.endpoint), { ...sub, user_id: user }); },
    remove: async (endpoint, user) => {
      const keep = rows.filter(row => row.endpoint !== endpoint || (user && row.user_id !== user));
      if (keep.length !== rows.length) removed.push(endpoint);
      rows.splice(0, rows.length, ...keep);
    },
    touch: async () => undefined,
  };
  return { store, rows, removed };
}

describe('pushConfig', () => {
  it('queda apagado sin las tres claves o con un remitente inválido', () => {
    expect(pushConfig({})).toBeNull();
    expect(pushConfig({ ...CONFIG, VAPID_PRIVATE_KEY: ' ' })).toBeNull();
    expect(pushConfig({ ...CONFIG, VAPID_SUBJECT: 'hola' })).toBeNull();
    expect(pushConfig(CONFIG)).toEqual({ publicKey: 'pub', privateKey: 'priv', subject: 'mailto:hola@planv.test' });
  });
});

describe('allowedPushEndpoint', () => {
  it('acepta solo los servicios de avisos de los navegadores', () => {
    expect(allowedPushEndpoint('https://fcm.googleapis.com/fcm/send/x')).toBe(true);
    expect(allowedPushEndpoint('https://web.push.apple.com/abc')).toBe(true);
    expect(allowedPushEndpoint('https://updates.push.services.mozilla.com/wpush/v2/x')).toBe(true);
    expect(allowedPushEndpoint('https://wns2-par02p.notify.windows.com/w/?token=x')).toBe(true);
    expect(allowedPushEndpoint('http://fcm.googleapis.com/fcm/send/x')).toBe(false);
    expect(allowedPushEndpoint('https://fcm.googleapis.com.evil.test/x')).toBe(false);
    expect(allowedPushEndpoint('https://fcm.googleapis.com:8443/x')).toBe(false);
    expect(allowedPushEndpoint('https://169.254.169.254/latest')).toBe(false);
    expect(allowedPushEndpoint('no es una dirección')).toBe(false);
  });
});

describe('createPushNotifier', () => {
  it('no manda nada si los avisos están apagados', async () => {
    const send = vi.fn();
    const { store } = memoryStore([{ ...PHONE, user_id: 'u1' }]);
    const notifier = createPushNotifier({ config: () => null, store: () => store, send });
    expect(await notifier.notifyPatient('p1', 'message')).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });

  it('manda el texto genérico a cada teléfono de la paciente, sin datos de salud', async () => {
    const send = vi.fn().mockResolvedValue(undefined);
    const other = { ...PHONE, endpoint: 'https://web.push.apple.com/otro' };
    const { store } = memoryStore([{ ...PHONE, user_id: 'u1' }, { ...other, user_id: 'u1' }, { ...PHONE, endpoint: 'https://fcm.googleapis.com/ajeno', user_id: 'u2' }]);
    const notifier = createPushNotifier({ config: () => pushConfig(CONFIG), store: () => store, send });
    expect(await notifier.notifyPatient('p1', 'plan')).toBe(2);
    expect(send).toHaveBeenCalledTimes(2);
    expect(JSON.parse(send.mock.calls[0][1] as string)).toEqual(PUSH_TEXTS.plan);
    expect(send.mock.calls.map(call => (call[0] as StoredSubscription).endpoint)).not.toContain('https://fcm.googleapis.com/ajeno');
  });

  it('campaña revalida la baja antes de cada teléfono y usa solo la plantilla revisada',async()=>{
    let allowed=true;const send=vi.fn(async(_subscription:StoredSubscription,_payload:string)=>{allowed=false;});
    const {store}=memoryStore([{...PHONE,user_id:'u1'},{...PHONE,endpoint:'https://web.push.apple.com/segundo',user_id:'u1'}]);
    const payload={title:'Aviso del consultorio',body:'Entrá a Nutridash.',url:'/app/mensajes',tag:'campaign:test'};
    const notifier=createPushNotifier({config:()=>pushConfig(CONFIG),store:()=>store,send});
    expect(await notifier.notifyPatient('p1','message',async()=>allowed,payload)).toBe(1);
    expect(send).toHaveBeenCalledTimes(1);expect(JSON.parse(send.mock.calls[0][1] as string)).toEqual(payload);
  });

  it('borra el teléfono que ya no existe y sigue con los demás', async () => {
    const gone = Object.assign(new Error('gone'), { statusCode: 410 });
    const send = vi.fn().mockRejectedValueOnce(gone).mockResolvedValueOnce(undefined);
    const { store, rows, removed } = memoryStore([{ ...PHONE, user_id: 'u1' }, { ...PHONE, endpoint: 'https://web.push.apple.com/b', user_id: 'u1' }]);
    const notifier = createPushNotifier({ config: () => pushConfig(CONFIG), store: () => store, send });
    expect(await notifier.notifyPatient('p1', 'message')).toBe(1);
    expect(removed).toEqual([PHONE.endpoint]);
    expect(rows.map(row => row.endpoint)).toEqual(['https://web.push.apple.com/b']);
  });

  it('un error del servicio no borra el teléfono ni rompe la ruta', async () => {
    const send = vi.fn().mockRejectedValue(Object.assign(new Error('caído'), { statusCode: 500 }));
    const { store, removed } = memoryStore([{ ...PHONE, user_id: 'u1' }]);
    const notifier = createPushNotifier({ config: () => pushConfig(CONFIG), store: () => store, send });
    expect(await notifier.notifyPatient('p1', 'appointment')).toBe(0);
    expect(removed).toEqual([]);
    const broken: PushStore = { ...store, patientUser: async () => { throw new Error('sin base'); } };
    await expect(createPushNotifier({ config: () => pushConfig(CONFIG), store: () => broken, send }).notifyPatient('p1', 'plan')).resolves.toBe(0);
  });

  it('paciente sin cuenta vinculada: no hay a quién avisar', async () => {
    const send = vi.fn();
    const { store } = memoryStore([], { p1: null });
    expect(await createPushNotifier({ config: () => pushConfig(CONFIG), store: () => store, send }).notifyPatient('p1', 'resource')).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });
});

describe('rutas de avisos al teléfono', () => {
  function app(user: string | null, rows: Array<StoredSubscription & { user_id: string }> = []) {
    const memory = memoryStore(rows);
    const server = new Hono();
    server.use('*', async (c, next) => { c.set('auth', user ? { userId: user } : { demo: true }); await next(); });
    server.onError((error, c) => error instanceof CareError ? c.json({ error: error.message }, error.status) : c.json({ error: 'x' }, 500));
    registerPushRoutes(server, () => memory.store);
    return { server, ...memory };
  }
  const body = (value: unknown) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });

  it('sin claves en el servidor no entrega clave ni guarda teléfonos', async () => {
    vi.unstubAllEnvs();
    const { server, rows } = app('u1');
    expect(await (await server.request('/api/push/key')).json()).toEqual({ public_key: null });
    expect((await server.request('/api/push/subscription', body({ endpoint: PHONE.endpoint, keys: { p256dh: 'BKey', auth: 'aut' } }))).status).toBe(409);
    expect(rows).toEqual([]);
  });

  it('guarda el teléfono de la sesión y rechaza direcciones que no son de avisos', async () => {
    for (const [name, value] of Object.entries(CONFIG)) vi.stubEnv(name, value);
    const { server, rows } = app('u1');
    expect(await (await server.request('/api/push/key')).json()).toEqual({ public_key: 'pub' });
    expect((await server.request('/api/push/subscription', body({ endpoint: PHONE.endpoint, keys: { p256dh: 'BKey', auth: 'aut' } }))).status).toBe(201);
    expect(rows).toEqual([{ ...PHONE, user_id: 'u1' }]);
    expect((await server.request('/api/push/subscription', body({ endpoint: 'https://evil.test/x', keys: { p256dh: 'BKey', auth: 'aut' } }))).status).toBe(400);
    expect((await server.request('/api/push/subscription', body({ endpoint: PHONE.endpoint, keys: { p256dh: '<script>', auth: 'aut' } }))).status).toBe(400);
    vi.unstubAllEnvs();
  });

  it('borrar solo quita el teléfono propio, y el modo demo no puede suscribirse', async () => {
    for (const [name, value] of Object.entries(CONFIG)) vi.stubEnv(name, value);
    const { server, rows } = app('u2', [{ ...PHONE, user_id: 'u1' }]);
    const response = await server.request('/api/push/subscription', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: PHONE.endpoint }) });
    expect(response.status).toBe(200);
    expect(rows).toHaveLength(1);
    const demo = app(null);
    expect((await demo.server.request('/api/push/subscription', body({ endpoint: PHONE.endpoint, keys: { p256dh: 'BKey', auth: 'aut' } }))).status).toBe(409);
    vi.unstubAllEnvs();
  });
});
