import type { Context, Hono } from 'hono';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { resolveWorkScope } from './repository.js';
import { addHistoryEntry, editHistoryEntry, endHistoryEntry, historyEditBodySchema, historyEndBodySchema, historyEntryBodySchema, listHistory } from './patient-history.js';

const BAD_BODY = 'Revisá el dato: tiene que tener texto y hasta 600 letras.';

async function historyScope(c: Context) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent && c.req.query('audience') === 'patient') throw new CareError(403, 'Solo profesionales del consultorio.');
  const id = c.req.param('id');
  if (!id || id.length > 100 || Object.keys(c.req.query()).length) throw new CareError(400, 'Revisá la paciente solicitada.');
  return { id, scope: await resolveWorkScope('userId' in auth ? auth.userId : null, persistent) };
}

const entryId = (c: Context) => {
  const value = c.req.param('entryId');
  if (!value || value.length > 100) throw new CareError(400, 'Revisá el dato solicitado.');
  return value;
};

export function registerPatientHistoryRoutes(app: Hono) {
  app.get('/api/crm/patients/:id/history', async c => { const { id, scope } = await historyScope(c); return c.json({ entries: await listHistory(scope, id) }); });
  app.post('/api/crm/patients/:id/history', async c => {
    const { id, scope } = await historyScope(c);
    const parsed = historyEntryBodySchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) throw new CareError(400, BAD_BODY);
    return c.json({ entries: await addHistoryEntry(scope, id, parsed.data) });
  });
  app.patch('/api/crm/patients/:id/history/:entryId', async c => {
    const { id, scope } = await historyScope(c);
    const parsed = historyEditBodySchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) throw new CareError(400, BAD_BODY);
    return c.json({ entries: await editHistoryEntry(scope, id, entryId(c), parsed.data) });
  });
  app.post('/api/crm/patients/:id/history/:entryId/end', async c => {
    const { id, scope } = await historyScope(c);
    const parsed = historyEndBodySchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) throw new CareError(400, 'El motivo puede tener hasta 200 letras.');
    return c.json({ entries: await endHistoryEntry(scope, id, entryId(c), parsed.data) });
  });
}
