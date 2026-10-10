import type { Hono } from 'hono';
import { z } from 'zod';
import { ACTION_SIGNALS, isCarteraPeriod } from '../../src/types/cartera.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { resolveWorkScope } from '../crm/repository.js';
import { deriveOverview, deriveProgress, progressQuerySchema } from './derive.js';
import { dismissAction, loadCarteraSnapshot, sinceFor } from './repository.js';

const overviewQuerySchema = z.object({ days: z.coerce.number().int().default(30) }).strict();
const dismissSchema = z.object({
  patient_id: z.string().trim().min(1).max(100),
  signal: z.enum(ACTION_SIGNALS),
  fingerprint: z.string().trim().min(1).max(80),
}).strict();

async function professionalScope(c: { get: (key: 'auth') => unknown; req: { query: (key: string) => string | undefined } }) {
  const auth = c.get('auth') as { userId?: string };
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent && c.req.query('audience') === 'patient') throw new CareError(403, 'Solo profesionales del consultorio.');
  return resolveWorkScope(auth.userId ?? null, persistent);
}

export function registerCarteraRoutes(app: Hono) {
  app.get('/api/crm/overview', async c => {
    const parsed = overviewQuerySchema.safeParse(c.req.query());
    if (!parsed.success || !isCarteraPeriod(parsed.data.days)) throw new CareError(400, 'Elegí un período de 7 o 30 días.');
    const scope = await professionalScope(c);
    const now = new Date();
    const snapshot = await loadCarteraSnapshot(scope, sinceFor(parsed.data.days, now, true), true);
    const overview = deriveOverview(snapshot, parsed.data.days, now);
    return c.json({ ...overview, source: scope.persistent ? 'supabase' : 'memory' });
  });

  app.get('/api/crm/progress', async c => {
    const raw = progressQuerySchema.safeParse(c.req.query());
    if (!raw.success || !isCarteraPeriod(raw.data.days)) throw new CareError(400, 'Revisá el período, el filtro y la página solicitada.');
    const scope = await professionalScope(c);
    if (raw.data.patient_id && !scope.patients.some(patient => patient.id === raw.data.patient_id)) {
      throw new CareError(403, 'Ese paciente no pertenece a tu consultorio.');
    }
    const now = new Date();
    const snapshot = await loadCarteraSnapshot(scope, sinceFor(raw.data.days, now, false), false);
    const result = deriveProgress(snapshot, {
      days: raw.data.days, filter: raw.data.filter, patientId: raw.data.patient_id, cursor: raw.data.cursor, limit: raw.data.limit,
    }, now);
    return c.json({ ...result, source: scope.persistent ? 'supabase' : 'memory' });
  });

  app.post('/api/crm/actions/dismiss', async c => {
    const body = dismissSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) throw new CareError(400, 'No pudimos descartar esa acción. Recargá Inicio e intentá de nuevo.');
    const scope = await professionalScope(c);
    await dismissAction(scope, body.data);
    return c.json({ ok: true });
  });
}
