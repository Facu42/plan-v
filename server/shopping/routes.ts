import type { Hono, Context } from 'hono';
import { z } from 'zod';
import { authorizePatientAction } from '../security/authorization.js';
import * as sb from '../db/supabase-repo.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { getPatient } from '../store.js';
import { shoppingCheckSchema, shoppingManualSchema } from '../../src/types/shopping.js';
import * as repo from './repository.js';

async function body<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  const raw = await c.req.text();
  if (raw.length > 8_000) throw new repo.CareError(413, 'El archivo es demasiado grande.');
  try { return schema.parse(JSON.parse(raw)); } catch { throw new repo.CareError(400, 'Revisá el nombre, la cantidad y la unidad.'); }
}

async function readAccess(c: Context, patientId: string) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (!getPatient(patientId)) throw new repo.CareError(404, 'Paciente no encontrado.');
    return { persistent: false };
  }
  const actor = await authorizePatientAction(auth.userId, patientId, 'read_patient', {
    getActor: sb.sbGetActor,
    getPatientResource: sb.sbGetPatientResource,
  });
  if (!actor) throw new repo.CareError(403, 'No tenés permiso para esta acción.');
  return { persistent: true };
}

async function patientWrite(c: Context, patientId: string) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (!getPatient(patientId)) throw new repo.CareError(404, 'Paciente no encontrado.');
    if (c.req.query('audience') === 'pro') throw new repo.CareError(403, 'Sólo el paciente puede marcar o agregar compras.');
    return { persistent: false };
  }
  const actor = await authorizePatientAction(auth.userId, patientId, 'log_activity', {
    getActor: sb.sbGetActor,
    getPatientResource: sb.sbGetPatientResource,
  });
  if (!actor || actor.role !== 'paciente') throw new repo.CareError(403, 'Sólo el paciente puede marcar o agregar compras.');
  return { persistent: true };
}

const itemId = z.uuid();

export function registerShoppingRoutes(app: Hono) {
  app.get('/api/patients/:id/shopping', async (c) => {
    const id = c.req.param('id');
    const { persistent } = await readAccess(c, id);
    const list = await repo.getShoppingList(id, persistent);
    return c.json({ list, source: persistent ? 'supabase' : 'memory' });
  });

  app.post('/api/patients/:id/shopping/items', async (c) => {
    const id = c.req.param('id');
    const { persistent } = await patientWrite(c, id);
    const input = await body(c, shoppingManualSchema);
    const list = await repo.addShoppingManual(id, input, persistent);
    return c.json({ list, source: persistent ? 'supabase' : 'memory' }, 201);
  });

  app.post('/api/patients/:id/shopping/check', async (c) => {
    const id = c.req.param('id');
    const { persistent } = await patientWrite(c, id);
    const input = await body(c, shoppingCheckSchema);
    const list = await repo.setShoppingChecked(id, input, persistent);
    return c.json({ list, source: persistent ? 'supabase' : 'memory' });
  });

  app.delete('/api/patients/:id/shopping/items/:itemId', async (c) => {
    const id = c.req.param('id');
    const parsed = itemId.safeParse(c.req.param('itemId'));
    if (!parsed.success) throw new repo.CareError(400, 'Revisá el nombre, la cantidad y la unidad.');
    const { persistent } = await patientWrite(c, id);
    const list = await repo.deleteShoppingManual(id, parsed.data, persistent);
    return c.json({ list, source: persistent ? 'supabase' : 'memory' });
  });
}
