import type { Hono } from 'hono';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { buildWorkItems, loadWorkSnapshot, resolveWorkScope } from './repository.js';
import { paginateWorkQueue, workQueueQuerySchema } from './work-queue.js';
import { buildFeed, feedFrom, feedQuerySchema } from './feed.js';
import { loadFeedRows } from './feed-repository.js';
import { argentinaToday } from '../progress/derive.js';

export function registerCrmRoutes(app: Hono) {
  app.get('/api/crm/work-queue', async c => {
    const auth = c.get('auth');
    const persistent = 'userId' in auth && isSupabaseEnabled();
    if (!persistent && c.req.query('audience') === 'patient') throw new CareError(403, 'Solo profesionales del consultorio.');
    const parsed = workQueueQuerySchema.safeParse(c.req.query());
    if (!parsed.success) throw new CareError(400, 'Revisá el paciente, el tipo de pendiente y la página solicitada.');
    const scope = await resolveWorkScope('userId' in auth ? auth.userId : null, persistent);
    if (parsed.data.patient_id && !scope.patients.some(patient => patient.id === parsed.data.patient_id)) {
      throw new CareError(403, 'Ese paciente no pertenece a tu consultorio.');
    }
    if (parsed.data.patient_id) scope.patients = scope.patients.filter(patient => patient.id === parsed.data.patient_id);
    const snapshot = await loadWorkSnapshot(scope);
    return c.json(paginateWorkQueue(buildWorkItems(scope, snapshot), parsed.data, scope.nutritionistId, persistent ? 'supabase' : 'memory'));
  });

  app.get('/api/crm/feed', async c => {
    const auth = c.get('auth');
    const persistent = 'userId' in auth && isSupabaseEnabled();
    if (!persistent && c.req.query('audience') === 'patient') throw new CareError(403, 'Solo profesionales del consultorio.');
    const parsed = feedQuerySchema.safeParse(c.req.query());
    if (!parsed.success) throw new CareError(400, 'Revisá el período, el estado y la paciente elegidos.');
    const scope = await resolveWorkScope('userId' in auth ? auth.userId : null, persistent);
    if (parsed.data.patient_id && !scope.patients.some(patient => patient.id === parsed.data.patient_id)) {
      throw new CareError(403, 'Ese paciente no pertenece a tu consultorio.');
    }
    const today = argentinaToday();
    const rows = await loadFeedRows(scope, feedFrom(today, parsed.data.days));
    return c.json({ ...buildFeed(rows.patients, rows.meals, rows.habits, parsed.data, today), source: persistent ? 'supabase' : 'memory' });
  });
}
