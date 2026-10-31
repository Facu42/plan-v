import type { Context, Hono } from 'hono';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { buildHomeOverview, buildWorkItems, loadGlobalProgress, loadWorkSnapshot, resolveWorkScope } from './repository.js';
import { paginateWorkQueue, workQueueQuerySchema } from './work-queue.js';
import { buildFeed, feedFrom, feedQuerySchema } from './feed.js';
import { loadFeedRows } from './feed-repository.js';
import { argentinaToday, isProgressPeriodDays } from '../progress/derive.js';
import { loadPatientQuickPreview, loadPatientRowPreview } from './patient-preview.js';
import { z } from 'zod';
import { loadPatientMealPage,patientMealQuerySchema } from './patient-meals.js';
import { addPatientTag, listPatientTags, listTagGroups, patientTagBodySchema, removePatientTag } from './patient-tags.js';
import { MFA_REQUIRED_MESSAGE } from '../security/mfa.js';

export function registerCrmRoutes(app: Hono) {
  app.get('/api/crm/patients/:id/meals',async c=>{
    const auth=c.get('auth'),persistent='userId' in auth&&isSupabaseEnabled();
    if(!persistent&&c.req.query('audience')==='patient')throw new CareError(403,'Solo profesionales del consultorio.');
    const parsed=patientMealQuerySchema.safeParse(c.req.query());if(!parsed.success)throw new CareError(400,'Revisá el período, estado y página solicitados.');
    const scope=await resolveWorkScope('userId' in auth?auth.userId:null,persistent);
    return c.json(await loadPatientMealPage(scope,c.req.param('id'),parsed.data));
  });
  app.post('/api/crm/patients/directory-summary', async c => {
    const auth = c.get('auth');
    const persistent = 'userId' in auth && isSupabaseEnabled();
    if (!persistent && c.req.query('audience') === 'patient') throw new CareError(403, 'Solo profesionales del consultorio.');
    if (Object.keys(c.req.query()).length) throw new CareError(400, 'Revisá las pacientes solicitadas.');
    const parsed = z.object({ patient_ids: z.array(z.string().min(1).max(100)).min(1).max(50) }).strict().safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) throw new CareError(400, 'Revisá las pacientes solicitadas.');
    const scope = await resolveWorkScope('userId' in auth ? auth.userId : null, persistent);
    const ids = [...new Set(parsed.data.patient_ids)];
    if (ids.some(id => !scope.patients.some(p => p.id === id && !p.deactivated_at && !p.anonymized_at))) throw new CareError(403, 'Esa paciente no está disponible en tu consultorio.');
    const patients = [];
    // Hasta cinco lecturas simultáneas, sin notas, cobros ni ficha completa.
    for (let i = 0; i < ids.length; i += 5) patients.push(...await Promise.all(ids.slice(i, i + 5).map(id => loadPatientRowPreview(scope, id))));
    return c.json({ patients });
  });
  const tagScope = async (c: Context) => {
    const auth = c.get('auth');
    const persistent = 'userId' in auth && isSupabaseEnabled();
    if (!persistent && c.req.query('audience') === 'patient') throw new CareError(403, 'Solo profesionales del consultorio.');
    const id = c.req.param('id');
    if (!id || id.length > 100 || Object.keys(c.req.query()).length) throw new CareError(400, 'Revisá la paciente solicitada.');
    return { id, scope: await resolveWorkScope('userId' in auth ? auth.userId : null, persistent) };
  };
  app.get('/api/crm/tag-groups', async c => {
    const auth = c.get('auth');
    const persistent = 'userId' in auth && isSupabaseEnabled();
    if (!persistent && c.req.query('audience') === 'patient') throw new CareError(403, 'Solo profesionales del consultorio.');
    if (Object.keys(c.req.query()).length) throw new CareError(400, 'Revisá lo solicitado.');
    return c.json({ groups: await listTagGroups(await resolveWorkScope('userId' in auth ? auth.userId : null, persistent)) });
  });
  app.get('/api/crm/patients/:id/tags', async c => { const { id, scope } = await tagScope(c); return c.json({ tags: await listPatientTags(scope, id) }); });
  app.post('/api/crm/patients/:id/tags', async c => {
    const { id, scope } = await tagScope(c);
    const parsed = patientTagBodySchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) throw new CareError(400, 'Escribí una etiqueta de hasta 30 letras.');
    return c.json({ tags: await addPatientTag(scope, id, parsed.data) });
  });
  app.delete('/api/crm/patients/:id/tags/:tagId', async c => {
    const { id, scope } = await tagScope(c);
    const tagId = c.req.param('tagId');
    if (!tagId || tagId.length > 100) throw new CareError(400, 'Revisá la etiqueta solicitada.');
    return c.json({ tags: await removePatientTag(scope, id, tagId) });
  });
  app.get('/api/crm/patients/:id/preview', async c => {
    const auth = c.get('auth');
    const persistent = 'userId' in auth && isSupabaseEnabled();
    if (!persistent && c.req.query('audience') === 'patient') throw new CareError(403, 'Solo profesionales del consultorio.');
    const id = c.req.param('id');
    if (!id || id.length > 100 || Object.keys(c.req.query()).length) throw new CareError(400, 'Revisá la paciente solicitada.');
    const scope = await resolveWorkScope('userId' in auth ? auth.userId : null, persistent);
    return c.json(await loadPatientQuickPreview(scope, id));
  });
  app.get('/api/crm/work-queue', async c => {
    const auth = c.get('auth');
    const persistent = 'userId' in auth && isSupabaseEnabled();
    if (!persistent && c.req.query('audience') === 'patient') throw new CareError(403, 'Solo profesionales del consultorio.');
    const parsed = workQueueQuerySchema.safeParse(c.req.query());
    if (!parsed.success) throw new CareError(400, 'Revisá el paciente, el tipo de pendiente y la página solicitada.');
    const scope = await resolveWorkScope('userId' in auth ? auth.userId : null, persistent);
    if (c.get('preMfaProfessional') && scope.patients.length > 0) {
      throw new CareError(403, MFA_REQUIRED_MESSAGE);
    }
    if (parsed.data.patient_id && !scope.patients.some(patient => patient.id === parsed.data.patient_id)) {
      throw new CareError(403, 'Ese paciente no pertenece a tu consultorio.');
    }
    if (parsed.data.patient_id) scope.patients = scope.patients.filter(patient => patient.id === parsed.data.patient_id);
    const snapshot = await loadWorkSnapshot(scope);
    const now = new Date();
    const items = buildWorkItems(scope, snapshot, now);
    const queued = parsed.data.include_home ? items.filter(item => item.kind !== 'appointment' || item.status === 'needs_change') : items;
    return c.json({ ...paginateWorkQueue(queued, parsed.data, scope.nutritionistId, persistent ? 'supabase' : 'memory'), ...(parsed.data.include_home ? { home: buildHomeOverview(scope, snapshot, items, now) } : {}) });
  });

  app.get('/api/crm/progress-global', async c => {
    const auth = c.get('auth');
    const persistent = 'userId' in auth && isSupabaseEnabled();
    if (!persistent && c.req.query('audience') === 'patient') throw new CareError(403, 'Solo profesionales del consultorio.');
    const raw = c.req.query('days');
    const days = raw == null || raw === '' ? 30 : Number(raw);
    if (!Number.isInteger(days) || !isProgressPeriodDays(days)) throw new CareError(400, 'Elegí un período de 7, 30 o 90 días.');
    const scope = await resolveWorkScope('userId' in auth ? auth.userId : null, persistent);
    return c.json(await loadGlobalProgress(scope, days));
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
