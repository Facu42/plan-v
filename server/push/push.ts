import webpush from 'web-push';
import { z } from 'zod';
import { isSupabaseEnabled, privilegedDb } from '../db/supabase-client.js';
import { writeOpsLog } from '../ops/log.js';

/**
 * Avisos al teléfono (push) de la paciente. Viajan por el servicio de avisos de Google, Apple o
 * Mozilla, así que nunca llevan datos de salud: solo un texto genérico y la pantalla que abren.
 * Sin las tres variables VAPID_* en el servidor, todo queda apagado y no se manda nada.
 */
export type PushKind = 'message' | 'plan' | 'resource' | 'appointment' | 'reminder' | 'subscription';
export type PushPayload = { title: string; body: string; url: string; tag: string };

export const PUSH_TEXTS: Record<PushKind, PushPayload> = {
  message: { title: 'Tu nutricionista te escribió', body: 'Abrí Nutridash para leer el mensaje.', url: '/app/mensajes', tag: 'plan-v-message' },
  plan: { title: 'Tenés un plan nuevo', body: 'Tu nutricionista publicó tu plan en Nutridash.', url: '/app/plan', tag: 'plan-v-plan' },
  resource: { title: 'Tu nutricionista te indicó un recurso', body: 'Está en Recursos, en «Indicados».', url: '/app/recursos', tag: 'plan-v-resource' },
  appointment: { title: 'Tu consulta cambió', body: 'Mirá el día y la hora en Nutridash.', url: '/app/agenda', tag: 'plan-v-appointment' },
  reminder: { title: 'Mañana tenés consulta', body: 'Mirá el horario en Nutridash.', url: '/app/agenda', tag: 'plan-v-reminder' },
  subscription: { title: 'Novedades de tu plan', body: 'Abrí Nutridash para ver el estado de tu pago.', url: '/app/pagos', tag: 'plan-v-subscription' },
};

export type PushConfig = { publicKey: string; privateKey: string; subject: string };

export function pushConfig(env: Record<string, string | undefined> = process.env): PushConfig | null {
  const publicKey = env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = env.VAPID_PRIVATE_KEY?.trim();
  const subject = env.VAPID_SUBJECT?.trim();
  if (!publicKey || !privateKey || !subject || !/^(mailto:|https:\/\/)/.test(subject)) return null;
  return { publicKey, privateKey, subject };
}

/** Solo los servicios de avisos de los navegadores: el servidor nunca le pega a otra dirección. */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^android\.googleapis\.com$/, /^web\.push\.apple\.com$/, /(^|\.)push\.apple\.com$/,
  /^updates\.push\.services\.mozilla\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)notify\.windows\.com$/];

export function allowedPushEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return url.protocol === 'https:' && !url.port && PUSH_HOSTS.some(host => host.test(url.hostname));
  } catch {
    return false;
  }
}

const key = z.string().min(1).max(200).regex(/^[A-Za-z0-9_-]+=*$/);
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().max(1000).refine(allowedPushEndpoint),
  keys: z.object({ p256dh: key, auth: key.max(100) }),
});
export const pushUnsubscribeSchema = z.object({ endpoint: z.string().max(1000) });

export type StoredSubscription = { endpoint: string; p256dh: string; auth: string };

export type PushStore = {
  patientUser(patientId: string): Promise<string | null>;
  forUser(userId: string): Promise<StoredSubscription[]>;
  save(userId: string, subscription: StoredSubscription): Promise<void>;
  remove(endpoint: string, userId?: string): Promise<void>;
  touch(endpoint: string): Promise<void>;
};

export function supabasePushStore(): PushStore {
  const table = () => privilegedDb().from('push_subscriptions');
  return {
    async patientUser(patientId) {
      const { data, error } = await privilegedDb().from('patients').select('user_id').eq('id', patientId).maybeSingle();
      if (error) throw error;
      return (data as { user_id: string | null } | null)?.user_id ?? null;
    },
    async forUser(userId) {
      const { data, error } = await table().select('endpoint,p256dh,auth').eq('user_id', userId).limit(10);
      if (error) throw error;
      return (data ?? []) as StoredSubscription[];
    },
    async save(userId, subscription) {
      const { error } = await table().upsert({ user_id: userId, ...subscription }, { onConflict: 'endpoint' });
      if (error) throw error;
    },
    async remove(endpoint, userId) {
      let query = table().delete().eq('endpoint', endpoint);
      if (userId) query = query.eq('user_id', userId);
      const { error } = await query;
      if (error) throw error;
    },
    async touch(endpoint) {
      await table().update({ last_used_at: new Date().toISOString() }).eq('endpoint', endpoint);
    },
  };
}

export type PushSender = (subscription: StoredSubscription, payload: string, config: PushConfig) => Promise<void>;

const webPushSender: PushSender = async (subscription, payload, config) => {
  await webpush.sendNotification(
    { endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } },
    payload,
    { vapidDetails: { subject: config.subject, publicKey: config.publicKey, privateKey: config.privateKey }, TTL: 60 * 60 * 24, urgency: 'normal' },
  );
};

const GONE = new Set([404, 410]);

export function createPushNotifier(deps: { config: () => PushConfig | null; store: () => PushStore; send?: PushSender }) {
  const send = deps.send ?? webPushSender;
  /** Manda el aviso a todos los teléfonos de la paciente. Devuelve cuántos lo recibieron. Nunca lanza. */
  async function notifyPatient(patientId: string, kind: PushKind): Promise<number> {
    const config = deps.config();
    if (!config) return 0;
    try {
      const store = deps.store();
      const userId = await store.patientUser(patientId);
      if (!userId) return 0;
      const subscriptions = await store.forUser(userId);
      const payload = JSON.stringify(PUSH_TEXTS[kind]);
      let delivered = 0;
      for (const subscription of subscriptions) {
        try {
          await send(subscription, payload, config);
          delivered += 1;
          await store.touch(subscription.endpoint).catch(() => undefined);
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status && GONE.has(status)) await store.remove(subscription.endpoint).catch(() => undefined);
          else writeOpsLog('warn', 'push_failed', { kind, status: status ?? 'network' });
        }
      }
      return delivered;
    } catch {
      writeOpsLog('warn', 'push_unavailable', { kind });
      return 0;
    }
  }
  return { notifyPatient };
}

export const pushNotifier = createPushNotifier({ config: () => pushConfig(), store: supabasePushStore });

/** Para las rutas: aviso de fondo, sin demorar la respuesta ni fallar si el teléfono no responde. */
export function notifyPatientPush(patientId: string, kind: PushKind): void {
  if (!isSupabaseEnabled() || !pushConfig()) return;
  void pushNotifier.notifyPatient(patientId, kind);
}
