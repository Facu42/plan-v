import { Hono } from 'hono';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('web-push', () => ({ default: { sendNotification: vi.fn(async () => undefined) } }));
vi.mock('../db/supabase-client.js', () => ({ isSupabaseEnabled: () => true, privilegedDb: () => { throw new Error('sin base en pruebas'); } }));

import webpush from 'web-push';
import { CareError } from '../care/errors.js';
import type { PushStore, StoredSubscription } from './push.js';
import { AVISO_DE_PRUEBA, registerHabitReminderRoutes, resetHabitTestSend } from './habit-routes.js';

const CONFIG = { VAPID_PUBLIC_KEY: 'pub', VAPID_PRIVATE_KEY: 'priv', VAPID_SUBJECT: 'mailto:hola@planv.test' };
const PHONE: StoredSubscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', p256dh: 'BKey', auth: 'aut' };

function app(user: string | null, rows: StoredSubscription[] = [], now = () => 1_000) {
  const store: PushStore = {
    patientUser: async () => null,
    forUser: async () => rows,
    save: async () => undefined,
    remove: async () => undefined,
    touch: async () => undefined,
  };
  const server = new Hono();
  server.use('*', async (c, next) => { if (user) c.set('auth', { userId: user }); await next(); });
  server.onError((error, c) => error instanceof CareError ? c.json({ error: error.message }, error.status) : c.json({ error: 'x' }, 500));
  registerHabitReminderRoutes(server, { store: () => store, now });
  return server;
}

describe('diagnóstico de avisos de hábitos', () => {
  beforeEach(() => {
    resetHabitTestSend();
    vi.mocked(webpush.sendNotification).mockClear();
    vi.unstubAllEnvs();
    for (const [name, value] of Object.entries(CONFIG)) vi.stubEnv(name, value);
    vi.stubEnv('APP_MODE', 'test');
  });

  it('el aviso de prueba no lleva datos de salud', () => {
    expect(JSON.stringify(AVISO_DE_PRUEBA)).not.toMatch(/paciente|comida|ml|peso|sueno|sueño/i);
    expect(AVISO_DE_PRUEBA.title).toBe('Aviso de prueba');
  });

  it('dice si el teléfono está anotado y si la prueba está permitida', async () => {
    expect(await (await app('u1', [PHONE]).request('/api/habit-reminders/diagnostico')).json()).toMatchObject({ suscripcion: true, prueba: true, avisos_activos: true });
    expect(await (await app('u1').request('/api/habit-reminders/diagnostico')).json()).toMatchObject({ suscripcion: false, prueba: true });
    expect(await (await app('u1', [{ ...PHONE, endpoint: 'https://evil.test/x' }]).request('/api/habit-reminders/diagnostico')).json()).toMatchObject({ suscripcion: false });
  });

  it('en staging se puede probar y en la versión publicada no', async () => {
    vi.stubEnv('APP_MODE', 'staging');
    expect((await (await app('u1').request('/api/habit-reminders/diagnostico')).json()).prueba).toBe(true);
    vi.stubEnv('APP_MODE', 'demo');
    expect((await (await app('u1').request('/api/habit-reminders/diagnostico')).json()).prueba).toBe(true);
    vi.stubEnv('APP_MODE', 'production');
    expect((await (await app('u1', [PHONE]).request('/api/habit-reminders/diagnostico')).json()).prueba).toBe(false);
    const send = vi.fn();
    const blocked = new Hono();
    blocked.use('*', async (c, next) => { c.set('auth', { userId: 'u1' }); await next(); });
    blocked.onError((error, c) => error instanceof CareError ? c.json({ error: error.message }, error.status) : c.json({ error: 'x' }, 500));
    registerHabitReminderRoutes(blocked, { send });
    expect((await blocked.request('/api/habit-reminders/prueba', { method: 'POST' })).status).toBe(403);
    expect(send).not.toHaveBeenCalled();
  });

  it('manda el aviso de prueba una vez y pide esperar para el siguiente', async () => {
    let clock = 10_000;
    const server = app('u1', [PHONE], () => clock);
    expect((await server.request('/api/habit-reminders/prueba', { method: 'POST' })).status).toBe(200);
    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
    expect((await server.request('/api/habit-reminders/prueba', { method: 'POST' })).status).toBe(429);
    clock += 31_000;
    expect((await server.request('/api/habit-reminders/prueba', { method: 'POST' })).status).toBe(200);
  });

  it('sin teléfono anotado no manda nada, y sin sesión no entra', async () => {
    expect((await app('u1').request('/api/habit-reminders/prueba', { method: 'POST' })).status).toBe(409);
    expect(webpush.sendNotification).not.toHaveBeenCalled();
    expect((await app(null).request('/api/habit-reminders/diagnostico')).status).toBe(403);
    expect((await app(null).request('/api/habit-reminders/prueba', { method: 'POST' })).status).toBe(403);
  });
});
