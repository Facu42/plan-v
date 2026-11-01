import type { Context, Hono } from 'hono';
import { z } from 'zod';
import { CareError } from '../care/errors.js';
import { liveKitJoin } from './livekit.js';
import { authorizePatientAction } from '../security/authorization.js';
import { sbGetActor, sbGetPatientResource } from '../db/supabase-repo.js';

const bodySchema = z.object({
  patient_id: z.string().trim().min(1).max(80),
  appointment_id: z.string().trim().min(1).max(80),
}).strict();

const access = { getActor: sbGetActor, getPatientResource: sbGetPatientResource };

export function registerCallRoutes(app: Hono, env: () => NodeJS.ProcessEnv = () => process.env) {
  app.post('/api/calls/livekit', async c => {
    const parsed = bodySchema.safeParse(await readJson(c));
    if (!parsed.success) throw new CareError(400, 'Revisá el turno.');
    const auth = c.get('auth');
    if (!('userId' in auth)) return c.json({ ready: false, videoRecording: false, egress: false });
    const actor = await authorizePatientAction(auth.userId, parsed.data.patient_id, 'read_patient', access);
    if (!actor) throw new CareError(403, 'No podés entrar a la sala de otra paciente.');
    const identity = actor.role === 'nutri' ? `nutri:${actor.nutritionistId}` : `paciente:${actor.patientId}`;
    return c.json(liveKitJoin(env(), parsed.data.appointment_id, identity));
  });
}

async function readJson(c: Context) {
  try { return await c.req.json(); } catch { return null; }
}
