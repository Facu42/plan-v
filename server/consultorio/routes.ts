// Rutas del consultorio: estadísticas (solo la dueña) y sede de cada turno (la dueña o su secretaria).
import type { Context, Hono } from 'hono';
import { z } from 'zod';
import { CareError } from '../care/errors.js';
import { getRequestDb, isSupabaseEnabled } from '../db/supabase-client.js';
import { sbGetActor } from '../db/supabase-repo.js';
import { DEMO_NUTRITIONIST_ID } from '../store.js';
import { schedulingDbError } from '../scheduling/repository.js';
import { consumeRateLimit } from '../ops/rate-limit.js';
import { estadisticasDelConsultorio } from './estadisticas.js';
import { guardarSedeDeTurno, leerSedesDeTurnos } from './sedes.js';

const uuid = z.uuid();
const sedeSchema = z.object({ location_id: z.uuid().nullable() }).strict();

async function duena(c: Context) {
  const auth = c.get('auth');
  if (!('userId' in auth) || !isSupabaseEnabled()) return { nid: DEMO_NUTRITIONIST_ID, persistent: false };
  const actor = await sbGetActor(auth.userId);
  if (actor?.role !== 'nutri') throw new CareError(403, 'Sólo la nutricionista puede ver las estadísticas del consultorio.');
  return { nid: actor.nutritionistId, persistent: true };
}

/** La dueña usa su consultorio; la secretaria manda `?consultorio=<id>` y se comprueba que tenga acceso. */
async function operativo(c: Context) {
  const pedido = c.req.query('consultorio');
  const auth = c.get('auth');
  if (!('userId' in auth) || !isSupabaseEnabled()) return { nid: DEMO_NUTRITIONIST_ID, persistent: false };
  if (!pedido) return duena(c);
  const nid = uuid.safeParse(pedido);
  if (!nid.success) throw new CareError(400, 'Consultorio inválido.');
  const r = await getRequestDb().rpc('scheduling_can_manage', { nid: nid.data });
  schedulingDbError(r.error);
  if (!r.data) throw new CareError(403, 'No tenés acceso a este consultorio.');
  return { nid: nid.data, persistent: true };
}

export function registerConsultorioRoutes(app: Hono) {
  app.get('/api/consultorio/estadisticas', async c => {
    const a = await duena(c);
    if (!consumeRateLimit(`estadisticas:${a.nid}`, 30, 60_000).ok) throw new CareError(429, 'Esperá un minuto y volvé a probar.');
    const meses = c.req.query('meses') === '12' ? 12 : 6;
    return c.json(await estadisticasDelConsultorio(a.nid, a.persistent, meses));
  });
  app.get('/api/consultorio/sedes-de-turnos', async c => {
    const a = await operativo(c);
    return c.json(await leerSedesDeTurnos(a.nid, a.persistent));
  });
  app.put('/api/consultorio/sedes-de-turnos/:appointmentId', async c => {
    const a = await operativo(c), id = (a.persistent ? uuid : z.string().regex(/^[A-Za-z0-9_-]{1,80}$/)).safeParse(c.req.param('appointmentId'));
    if (!id.success) throw new CareError(400, 'Turno inválido.');
    const text = await c.req.text();
    if (text.length > 500) throw new CareError(413, 'Los datos son demasiado largos.');
    let parsed: z.infer<typeof sedeSchema>;
    try { parsed = sedeSchema.parse(JSON.parse(text)); } catch { throw new CareError(400, 'Elegí una sede.'); }
    await guardarSedeDeTurno(a.nid, id.data, parsed.location_id, a.persistent);
    return c.json({ saved: true });
  });
}
