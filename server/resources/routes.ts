import type { Context, Hono } from 'hono';
import { z } from 'zod';
import { authorizePatientAction } from '../security/authorization.js';
import * as sb from '../db/supabase-repo.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { getPatient } from '../store.js';
import { toPatientSelfView } from '../security/contracts.js';
import { favoriteInputSchema, resourceSlugSchema } from '../../src/types/resources.js';
import * as repo from './repository.js';

async function body<T>(c: Context, schema: z.ZodType<T>, fallback: string): Promise<T> {
  const raw = await c.req.text();
  if (raw.length > 8_000) throw new repo.CareError(413, 'El archivo es demasiado grande.');
  try { return schema.parse(JSON.parse(raw)); } catch { throw new repo.CareError(400, fallback); }
}

async function access(
  c: Context,
  patientId: string,
  action: 'read_patient' | 'assign_resource' | 'read_resource' | 'manage_favorites',
) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (!getPatient(patientId)) throw new repo.CareError(404, 'Paciente no encontrado.');
    const audience = c.req.query('audience');
    const professional = audience === 'pro' || (action === 'assign_resource' && audience !== 'patient');
    if (action === 'assign_resource' && !professional) {
      throw new repo.CareError(403, 'Sólo una profesional puede asignar un recurso.');
    }
    if ((action === 'read_resource' || action === 'manage_favorites') && audience === 'pro') {
      throw new repo.CareError(403, 'Sólo la paciente puede hacer esta acción.');
    }
    return { persistent: false, professional };
  }
  const actor = await authorizePatientAction(auth.userId, patientId, action, {
    getActor: sb.sbGetActor,
    getPatientResource: sb.sbGetPatientResource,
  });
  if (!actor) throw new repo.CareError(403, 'No tenés permiso para esta acción.');
  return { persistent: true, professional: actor.role === 'nutri' };
}

const assignSchema = z.object({
  resource_id: resourceSlugSchema,
  patient_ids: z.array(z.string().trim().min(1).max(120)).min(1).max(100),
}).refine((input) => new Set(input.patient_ids).size === input.patient_ids.length, {
  message: 'Los pacientes no pueden repetirse',
  path: ['patient_ids'],
});

const draftSchema = z.object({
  slug: resourceSlugSchema,
  title: z.string().trim().min(2).max(150),
  summary: z.string().trim().min(2).max(400),
  category: z.string().trim().min(2).max(40),
  sections: z.array(z.object({
    title: z.string().trim().min(1).max(80),
    body: z.string().trim().min(1).max(800),
  })).min(1).max(8),
}).strict();

export function registerResourceRoutes(app: Hono) {
  app.get('/api/patients/:id/library', async (c) => {
    const id = c.req.param('id');
    const { persistent, professional } = await access(c, id, 'read_patient');
    const library = await repo.getPatientLibrary(id, persistent, professional, c.req.query('q') ?? '');
    return c.json({ library, source: persistent ? 'supabase' : 'memory' });
  });

  app.post('/api/resources/assign', async (c) => {
    const input = await body(c, assignSchema, 'Datos inválidos');
    const first = input.patient_ids[0];
    const { persistent, professional } = await access(c, first, 'assign_resource');
    if (persistent) {
      const auth = c.get('auth');
      if ('userId' in auth) {
        const decisions = await Promise.all(input.patient_ids.map((patientId) => authorizePatientAction(auth.userId, patientId, 'assign_resource', {
          getActor: sb.sbGetActor,
          getPatientResource: sb.sbGetPatientResource,
        })));
        if (decisions.some((actor) => !actor)) throw new repo.CareError(403, 'No tenés permiso para esta acción.');
      }
    } else {
      for (const patientId of input.patient_ids) {
        if (!getPatient(patientId)) throw new repo.CareError(404, 'Paciente no encontrado.');
      }
    }
    const result = await repo.assignEditorialResource(input.resource_id, input.patient_ids, persistent, professional);
    return c.json({
      patients: persistent ? result.patients : result.patients,
      assigned_count: result.assigned_count,
      existing_count: result.existing_count,
      source: persistent ? 'supabase' : 'memory',
    });
  });

  app.post('/api/patients/:id/resources/:resourceId/read', async (c) => {
    const patientId = c.req.param('id');
    const parsed = resourceSlugSchema.safeParse(c.req.param('resourceId'));
    if (!parsed.success) throw new repo.CareError(400, 'Recurso inválido');
    const { persistent, professional } = await access(c, patientId, 'read_resource');
    const result = await repo.markEditorialRead(patientId, parsed.data, persistent, professional);
    return c.json({
      patient: result.patient ? toPatientSelfView(result.patient) : null,
      library: result.library,
      source: persistent ? 'supabase' : 'memory',
    });
  });

  app.post('/api/patients/:id/favorites', async (c) => {
    const patientId = c.req.param('id');
    const input = await body(c, favoriteInputSchema, 'Datos inválidos');
    const { persistent, professional } = await access(c, patientId, 'manage_favorites');
    const library = await repo.toggleFavorite(patientId, input.item_kind, input.item_id, persistent, professional);
    return c.json({ library, source: persistent ? 'supabase' : 'memory' });
  });

  app.post('/api/resources', async (c) => {
    const input = await body(c, draftSchema, 'Revisá el recurso, la autoría y las reglas de publicación.');
    const auth = c.get('auth');
    const persistent = 'userId' in auth && isSupabaseEnabled();
    const professional = persistent ? false : c.req.query('audience') === 'pro';
    if (persistent) {
      const actor = await sb.sbGetActor(auth.userId);
      if (actor?.role !== 'nutri') throw new repo.CareError(403, 'Sólo una profesional puede crear un artículo.');
      const resource = await repo.saveEditorialDraft(input.slug, input.title, input.summary, input.category, input.sections, true, true);
      return c.json({ resource, source: 'supabase' }, 201);
    }
    const resource = await repo.saveEditorialDraft(input.slug, input.title, input.summary, input.category, input.sections, false, professional);
    return c.json({ resource, source: 'memory' }, 201);
  });

  app.post('/api/resources/:id/publish', async (c) => {
    const id = c.req.param('id');
    const auth = c.get('auth');
    const persistent = 'userId' in auth && isSupabaseEnabled();
    if (persistent) {
      const actor = await sb.sbGetActor(auth.userId);
      if (actor?.role !== 'nutri') throw new repo.CareError(403, 'Sólo una profesional puede publicar un artículo.');
      const resource = await repo.publishEditorial(id, true, true);
      return c.json({ resource, source: 'supabase' });
    }
    const professional = c.req.query('audience') === 'pro';
    const resource = await repo.publishEditorial(id, false, professional);
    return c.json({ resource, source: 'memory' });
  });
}
