import type { Hono, Context } from 'hono';
import { z } from 'zod';
import { authorizePatientAction } from '../security/authorization.js';
import * as sb from '../db/supabase-repo.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { getPatient } from '../store.js';
import { bodyDataSchema, calculateTarget, targetInputSchema } from '../../src/lib/nutrition-target.js';
import * as repo from './repository.js';

const saveSchema = z.object({ inputs: targetInputSchema, publish: z.boolean() }).strict();

async function access(c: Context, patientId: string) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (!getPatient(patientId)) throw new repo.TargetError(404, 'Paciente no encontrado.');
    return { persistent: false, professional: c.req.query('audience') === 'pro' };
  }
  const actor = await authorizePatientAction(auth.userId, patientId, 'read_patient', { getActor: sb.sbGetActor, getPatientResource: sb.sbGetPatientResource });
  if (!actor) throw new repo.TargetError(403, 'No tenés permiso para esta acción.');
  return { persistent: true, professional: actor.role === 'nutri' };
}

export function registerTargetRoutes(app: Hono) {
  app.get('/api/patients/:id/nutrition-target', async (c) => {
    const id = c.req.param('id');
    const { persistent, professional } = await access(c, id);
    const target = await repo.getTarget(id, persistent);
    // La paciente sólo ve la meta una vez que la nutricionista la confirmó.
    return c.json({ target: professional ? target : target?.published_at ? target : null });
  });

  app.put('/api/patients/:id/nutrition-target', async (c) => {
    const id = c.req.param('id');
    const { persistent, professional } = await access(c, id);
    if (!professional) throw new repo.TargetError(403, 'Sólo la nutricionista puede definir la meta.');
    let parsed: z.infer<typeof saveSchema>;
    try { parsed = saveSchema.parse(JSON.parse(await c.req.text())); } catch { throw new repo.TargetError(400, 'Revisá sexo, edad, peso, talla y porcentajes.'); }
    // El servidor recalcula: nunca se confía en cifras enviadas por el navegador.
    const result = calculateTarget(parsed.inputs);
    const target = await repo.saveTarget(id, parsed.inputs, result, parsed.publish, persistent);
    return c.json({ target });
  });

  // Datos corporales: los carga la paciente; la nutricionista los lee y puede pedir una actualización.
  app.get('/api/patients/:id/body-data', async (c) => {
    const id = c.req.param('id');
    const { persistent } = await access(c, id);
    return c.json(await repo.getBodyData(id, persistent));
  });

  app.put('/api/patients/:id/body-data', async (c) => {
    const id = c.req.param('id');
    const { persistent, professional } = await access(c, id);
    if (professional) throw new repo.TargetError(403, 'Estos datos los carga la paciente.');
    let body: z.infer<typeof bodyDataSchema>;
    try { body = bodyDataSchema.parse(JSON.parse(await c.req.text())); } catch { throw new repo.TargetError(400, 'Revisá sexo, fecha de nacimiento, talla y peso.'); }
    await repo.saveBodyData(id, body, persistent);
    return c.json(await repo.getBodyData(id, persistent));
  });

  app.post('/api/patients/:id/body-data/request', async (c) => {
    const id = c.req.param('id');
    const { persistent, professional } = await access(c, id);
    if (!professional) throw new repo.TargetError(403, 'Sólo la nutricionista puede pedir la actualización.');
    await repo.requestBodyData(id, persistent);
    return c.json(await repo.getBodyData(id, persistent));
  });
}
