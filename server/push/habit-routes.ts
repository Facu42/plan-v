import type { Context, Hono } from 'hono';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { habitRemindersSchema } from '../../src/habit-reminders.js';
import { loadHabitReminders, saveHabitReminders } from './habit-reminders.js';

function actor(c: Context): { user: string; persistent: boolean } {
  const auth = c.get('auth') as { userId?: string; demo?: boolean } | undefined;
  if (auth && 'userId' in auth && auth.userId && isSupabaseEnabled()) return { user: auth.userId, persistent: true };
  if (auth && 'demo' in auth && auth.demo) return { user: 'demo', persistent: false };
  throw new CareError(403, 'Entrá a tu cuenta para configurar los recordatorios.');
}

export function registerHabitReminderRoutes(app: Hono) {
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
