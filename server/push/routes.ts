import type { Context, Hono } from 'hono';
import type { z } from 'zod';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { pushConfig, pushSubscriptionSchema, pushUnsubscribeSchema, supabasePushStore, type PushStore } from './push.js';

async function parse<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  const raw = await c.req.text();
  if (raw.length > 4_000) throw new CareError(413, 'No pudimos activar los avisos en este teléfono.');
  try {
    return schema.parse(JSON.parse(raw));
  } catch {
    throw new CareError(400, 'No pudimos activar los avisos en este teléfono.');
  }
}

function userId(c: Context): string {
  const auth = c.get('auth');
  if (!auth || !('userId' in auth) || !isSupabaseEnabled()) throw new CareError(409, 'Los avisos al teléfono no están disponibles en esta cuenta.');
  return auth.userId;
}

export function registerPushRoutes(app: Hono, store: () => PushStore = supabasePushStore) {
  /** Clave pública para que el navegador se suscriba; null mientras los avisos estén apagados. */
  app.get('/api/push/key', (c) => {
    const config = isSupabaseEnabled() ? pushConfig() : null;
    return c.json({ public_key: config?.publicKey ?? null });
  });

  app.post('/api/push/subscription', async (c) => {
    const user = userId(c);
    if (!pushConfig()) throw new CareError(409, 'Los avisos al teléfono todavía no están activos.');
    const input = await parse(c, pushSubscriptionSchema);
    await store().save(user, { endpoint: input.endpoint, p256dh: input.keys.p256dh, auth: input.keys.auth });
    return c.json({ ok: true }, 201);
  });

  app.delete('/api/push/subscription', async (c) => {
    const user = userId(c);
    const input = await parse(c, pushUnsubscribeSchema);
    await store().remove(input.endpoint, user);
    return c.json({ ok: true });
  });
}
