import type { Hono, Context } from 'hono';
import { z } from 'zod';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import * as sb from '../db/supabase-repo.js';
import { appointmentConfirmSchema, appointmentRescheduleSchema, appointmentUpdateSchema } from '../schemas.js';
import { authorizePatientAction } from '../security/authorization.js';
import { toPatientSelfView, type PatientAction } from '../security/contracts.js';
import { getPatient } from '../store.js';
import * as repo from './repository.js';

const access = {
  getActor: sb.sbGetActor,
  getPatientResource: sb.sbGetPatientResource,
};

function authorize(userId: string, patientId: string, action: PatientAction) {
  return authorizePatientAction(userId, patientId, action, access);
}

function audience(role: 'nutri' | 'paciente') {
  return role === 'paciente' ? 'patient' as const : 'professional' as const;
}

async function jsonBody<T>(c: Context, schema: z.ZodType<T>) {
  try {
    return schema.safeParse(await c.req.json());
  } catch {
    return { success: false as const };
  }
}

function serialize(patient: NonNullable<Awaited<ReturnType<typeof sb.sbGetPatientById>>>, role: 'nutri' | 'paciente') {
  return role === 'paciente' ? toPatientSelfView(patient) : patient;
}

export function registerAppointmentRoutes(app: Hono) {
  app.put('/api/patients/:id/appointment', async (c) => {
    const auth = c.get('auth');
    const patientId = c.req.param('id');
    const parsedBody = await jsonBody(c, appointmentUpdateSchema);
    if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);
    const persistent = 'userId' in auth && isSupabaseEnabled();

    if (persistent) {
      const actor = await authorize(auth.userId, patientId, 'edit_appointment');
      if (!actor || actor.role !== 'nutri') return c.json({ error: 'Prohibido' }, 403);
      await repo.scheduleAppointment(patientId, parsedBody.data.appointment, true);
      if (parsedBody.data.appointment) {
        await sb.sbAddTimelineEvent(patientId, {
          kind: 'appointment',
          title: 'Consulta · actualizada',
          body: `${parsedBody.data.appointment.day} ${parsedBody.data.appointment.time}`,
          visibility: 'patient',
        });
      }
      const patient = await sb.sbGetPatientById(patientId);
      if (!patient) return c.notFound();
      return c.json({ patient, source: 'supabase' });
    }

    const patient = await repo.scheduleAppointment(patientId, parsedBody.data.appointment, false);
    if (!patient) return c.notFound();
    return c.json({ patient, source: 'memory' });
  });

  app.post('/api/patients/:id/appointment/reschedule', async (c) => {
    const auth = c.get('auth');
    const patientId = c.req.param('id');
    const parsedBody = await jsonBody(c, appointmentRescheduleSchema);
    if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);
    const persistent = 'userId' in auth && isSupabaseEnabled();

    if (persistent) {
      const actor = await authorize(auth.userId, patientId, 'reschedule_appointment');
      if (!actor) return c.json({ error: 'Prohibido' }, 403);
      await repo.rescheduleAppointment(patientId, parsedBody.data, true);
      await sb.sbAddTimelineEvent(patientId, {
        kind: 'appointment',
        title: 'Consulta · reprogramada',
        body: `${parsedBody.data.day} ${parsedBody.data.time}`,
        visibility: 'patient',
      });
      const patient = await sb.sbGetPatientById(patientId, audience(actor.role));
      if (!patient) return c.notFound();
      return c.json({ patient: serialize(patient, actor.role), source: 'supabase' });
    }

    if (!getPatient(patientId)) return c.notFound();
    const patient = await repo.rescheduleAppointment(patientId, parsedBody.data, false);
    if (!patient) return c.notFound();
    return c.json({ patient, source: 'memory' });
  });

  app.post('/api/patients/:id/appointment/confirm', async (c) => {
    const auth = c.get('auth');
    const patientId = c.req.param('id');
    const parsedBody = await jsonBody(c, appointmentConfirmSchema);
    if (!parsedBody.success) return c.json({ error: 'Datos inválidos' }, 400);
    const persistent = 'userId' in auth && isSupabaseEnabled();

    if (persistent) {
      const actor = await authorize(auth.userId, patientId, 'confirm_appointment');
      if (!actor) return c.json({ error: 'Prohibido' }, 403);
      await repo.confirmAppointmentReply(patientId, parsedBody.data.reply, true);
      const patient = await sb.sbGetPatientById(patientId, audience(actor.role));
      if (!patient) return c.notFound();
      return c.json({ patient: serialize(patient, actor.role), source: 'supabase' });
    }

    if (!getPatient(patientId)) return c.notFound();
    const patient = await repo.confirmAppointmentReply(patientId, parsedBody.data.reply, false);
    if (!patient) return c.notFound();
    return c.json({ patient, source: 'memory' });
  });
}
