import type { Hono, Context } from 'hono';
import { authorizePatientAction } from '../security/authorization.js';
import * as sb from '../db/supabase-repo.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { getPatient } from '../store.js';
import { CareError, getPatientProgress, isProgressPeriodDays } from './repository.js';

async function readAccess(c: Context, patientId: string) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (!getPatient(patientId)) throw new CareError(404, 'Paciente no encontrado.');
    return { persistent: false };
  }
  const actor = await authorizePatientAction(auth.userId, patientId, 'read_patient', {
    getActor: sb.sbGetActor,
    getPatientResource: sb.sbGetPatientResource,
  });
  if (!actor) throw new CareError(403, 'No tenés permiso para esta acción.');
  return { persistent: true };
}

export function registerProgressRoutes(app: Hono) {
  app.get('/api/patients/:id/progress', async (c) => {
    const id = c.req.param('id');
    const raw = c.req.query('days');
    const days = raw == null || raw === '' ? 7 : Number(raw);
    if (!Number.isInteger(days) || !isProgressPeriodDays(days)) {
      throw new CareError(400, 'Elegí un período de 7, 30 o 90 días.');
    }
    const { persistent } = await readAccess(c, id);
    const progress = await getPatientProgress(id, days, persistent);
    return c.json({ progress, source: persistent ? 'supabase' : 'memory' });
  });
}
