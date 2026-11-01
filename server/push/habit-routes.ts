import type { Context, Hono } from 'hono';
import webpush from 'web-push';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { habitRemindersSchema } from '../../src/habit-reminders.js';
import { loadHabitReminders, saveHabitReminders } from './habit-reminders.js';
import { allowedPushEndpoint, pushConfig, supabasePushStore, type PushStore } from './push.js';

/** Aviso genérico, sin datos de salud. Solo local, prueba o staging. */
export const AVISO_DE_PRUEBA = { title: 'Aviso de prueba', body: 'Si leés esto, los recordatorios llegan a este teléfono.', url: '/app/inicio', tag: 'plan-v-habit-test' };
const ESPERA_MS = 30_000;
const ultimoEnvio = new Map<string, number>();

export function pruebaDeHabitosPermitida(mode: string | undefined): boolean {
  return mode === 'demo' || mode === 'test' || mode === 'staging';
}

export function resetHabitTestSend() {
  ultimoEnvio.clear();
}

async function enviarPrueba(store: PushStore, userId: string, now: number): Promise<number> {
  const previo = ultimoEnvio.get(userId);
  if (previo != null && now - previo < ESPERA_MS) throw new CareError(429, 'Esperá unos segundos antes de mandar otro aviso de prueba.');
  const config = pushConfig();
  if (!config) throw new CareError(409, 'Los avisos al teléfono todavía no están activos.');
  const subs = (await store.forUser(userId)).filter(item => allowedPushEndpoint(item.endpoint));
  if (!subs.length) throw new CareError(409, 'Este teléfono no está anotado para recibir avisos.');
  let enviados = 0;
  for (const sub of subs) {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(AVISO_DE_PRUEBA),
      { vapidDetails: { subject: config.subject, publicKey: config.publicKey, privateKey: config.privateKey }, TTL: 60 * 60, urgency: 'normal' },
    );
    enviados += 1;
  }
  ultimoEnvio.set(userId, now);
  return enviados;
}

function actor(c: Context): { user: string; persistent: boolean } {
  const auth = c.get('auth') as { userId?: string; demo?: boolean } | undefined;
  if (auth && 'userId' in auth && auth.userId && isSupabaseEnabled()) return { user: auth.userId, persistent: true };
  if (auth && 'demo' in auth && auth.demo) return { user: 'demo', persistent: false };
  throw new CareError(403, 'Entrá a tu cuenta para configurar los recordatorios.');
}

export function registerHabitReminderRoutes(app: Hono, deps: { store?: () => PushStore; now?: () => number; send?: (userId: string) => Promise<number> } = {}) {
  const store = deps.store ?? supabasePushStore;
  const now = deps.now ?? Date.now;

  app.get('/api/habit-reminders/diagnostico', async (c) => {
    const { user, persistent } = actor(c);
    const mode = process.env.APP_MODE;
    let suscripcion = false;
    if (persistent && pushConfig()) {
      const subs = await store().forUser(user);
      suscripcion = subs.some(item => allowedPushEndpoint(item.endpoint));
    }
    return c.json({ suscripcion, prueba: pruebaDeHabitosPermitida(mode), avisos_activos: Boolean(pushConfig()) });
  });

  app.post('/api/habit-reminders/prueba', async (c) => {
    const { user } = actor(c);
    if (!pruebaDeHabitosPermitida(process.env.APP_MODE)) throw new CareError(403, 'El aviso de prueba no está disponible en la versión publicada.');
    try {
      const enviados = deps.send ? await deps.send(user) : await enviarPrueba(store(), user, now());
      return c.json({ enviados });
    } catch (error) {
      if (error instanceof CareError) throw error;
      throw new CareError(503, 'No pudimos mandar el aviso de prueba.');
    }
  });

  app.get('/api/habit-reminders', async (c) => {
    const { user, persistent } = actor(c);
    return c.json({ prefs: await loadHabitReminders(user, persistent) });
  });

  app.put('/api/habit-reminders', async (c) => {
    const { user, persistent } = actor(c);
    const raw = await c.req.text();
    if (raw.length > 4_000) throw new CareError(413, 'Esos horarios son demasiado largos.');
    let body: unknown;
    try { body = JSON.parse(raw); } catch { throw new CareError(400, 'Revisá los horarios.'); }
    const parsed = habitRemindersSchema.safeParse(body);
    if (!parsed.success) throw new CareError(400, 'Revisá los horarios. El agua tiene que empezar antes de terminar.');
    return c.json({ prefs: await saveHabitReminders(user, parsed.data, persistent) });
  });
}
