import type { Context, Hono } from 'hono';
import { z } from 'zod';
import { authorizePatientAction } from '../security/authorization.js';
import * as sb from '../db/supabase-repo.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import * as repo from './repository.js';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => !Number.isNaN(Date.parse(`${value}T12:00:00Z`)));
const saleSchema = z.object({
  name: z.string().trim().min(1).max(60),
  sessions: z.number().int().min(1).max(50),
  amount: z.number().int().min(0).max(100_000_000),
  starts_on: dateSchema,
  valid_days: z.number().int().min(1).max(730).nullable(),
  charge: z.boolean(),
}).strict();
const useSchema = z.object({ pack_id: z.uuid().nullable().optional(), used_on: dateSchema, note: z.string().trim().max(120).optional() }).strict();
const idSchema = z.uuid();

async function body<T>(c: Context, schema: z.ZodType<T>): Promise<T> {
  const raw = await c.req.text();
  if (raw.length > 2_000) throw new repo.CareError(413, 'Los datos son demasiado largos.');
  try { return schema.parse(JSON.parse(raw)); } catch { throw new repo.CareError(400, 'Revisá el nombre, las consultas, el precio y la fecha.'); }
}

/** Solo la nutricionista con permiso de cobranzas sobre esa paciente. En demo, la vista de paciente no entra. */
async function nutriFor(c: Context, patientId: string): Promise<boolean> {
  const auth = c.get('auth');
  if (!('userId' in auth) || !isSupabaseEnabled()) {
    if (c.req.query('audience') === 'patient') throw new repo.CareError(403, 'No tenés permiso para esta acción.');
    return false;
  }
  const actor = await authorizePatientAction(auth.userId, patientId, 'edit_billing', { getActor: sb.sbGetActor, getPatientResource: sb.sbGetPatientResource });
  if (!actor || actor.role !== 'nutri') throw new repo.CareError(403, 'No tenés permiso para esta acción.');
  return true;
}

function idParam(value: string, missing: string): string {
  const parsed = idSchema.safeParse(value);
  if (!parsed.success) throw new repo.CareError(404, missing);
  return parsed.data;
}

export function registerPackRoutes(app: Hono) {
  app.get('/api/patients/:id/packs', async (c) => {
    const id = c.req.param('id');
    const persistent = await nutriFor(c, id);
    return c.json({ packs: await repo.listPacks(id, persistent) });
  });

  // La paciente ve su propio saldo de consultas (en demo, con ?audience=patient).
  app.get('/api/patients/:id/packs/own', async (c) => {
    const id = c.req.param('id');
    const auth = c.get('auth');
    if (!('userId' in auth) || !isSupabaseEnabled()) return c.json({ packs: await repo.listOwnPacks(id, false) });
    const actor = await authorizePatientAction(auth.userId, id, 'read_patient', { getActor: sb.sbGetActor, getPatientResource: sb.sbGetPatientResource });
    if (!actor || actor.role !== 'paciente') throw new repo.CareError(403, 'No tenés permiso para esta acción.');
    return c.json({ packs: await repo.listOwnPacks(id, true) });
  });

  // Vender un paquete; con charge = true queda el cobro suelto en Cobranzas.
  app.post('/api/patients/:id/packs', async (c) => {
    const id = c.req.param('id');
    const persistent = await nutriFor(c, id);
    const input = await body(c, saleSchema);
    return c.json({ packs: await repo.sellPack(id, input, persistent) }, 201);
  });

  // Descontar una consulta a mano (sin pack_id, del paquete vigente más viejo).
  app.post('/api/patients/:id/packs/uses', async (c) => {
    const id = c.req.param('id');
    const persistent = await nutriFor(c, id);
    const input = await body(c, useSchema);
    return c.json({ packs: await repo.usePack(id, input, persistent) }, 201);
  });

  app.post('/api/patients/:id/packs/uses/:useId/void', async (c) => {
    const id = c.req.param('id');
    const useId = idParam(c.req.param('useId'), 'Ese paquete o esa consulta ya no están.');
    const persistent = await nutriFor(c, id);
    if (!persistent && repo.memoryUsePatient(useId) !== id) throw new repo.CareError(404, 'Ese paquete o esa consulta ya no están.');
    return c.json({ packs: await repo.voidUse(useId, persistent) });
  });

  app.post('/api/patients/:id/packs/:packId/close', async (c) => {
    const id = c.req.param('id');
    const packId = idParam(c.req.param('packId'), 'Ese paquete o esa consulta ya no están.');
    const persistent = await nutriFor(c, id);
    if (!persistent && repo.memoryPackPatient(packId) !== id) throw new repo.CareError(404, 'Ese paquete o esa consulta ya no están.');
    return c.json({ packs: await repo.closePack(packId, persistent) });
  });
}
