import type { Context, Hono } from 'hono';
import { z } from 'zod';
import { authorizePatientAction } from '../security/authorization.js';
import * as sb from '../db/supabase-repo.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { getPatient } from '../store.js';
import { orgNameSchema, orgSlugSchema } from '../../src/types/orgs.js';
import { DEMO_OWNER_NUTRITIONIST_ID } from './memory.js';
import * as repo from './repository.js';

async function body<T>(c: Context, schema: z.ZodType<T>, fallback: string): Promise<T> {
  const raw = await c.req.text();
  if (raw.length > 8_000) throw new repo.CareError(413, 'El archivo es demasiado grande.');
  try { return schema.parse(JSON.parse(raw || '{}')); } catch { throw new repo.CareError(400, fallback); }
}

async function nutriAccess(c: Context) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (c.req.query('audience') === 'patient') {
      throw new repo.CareError(403, 'Sólo una profesional puede administrar organizaciones.');
    }
    return { persistent: false, actorId: c.req.query('as')?.trim() || DEMO_OWNER_NUTRITIONIST_ID };
  }
  const actor = await sb.sbGetActor(auth.userId);
  if (actor?.role !== 'nutri') throw new repo.CareError(403, 'Sólo una profesional puede administrar organizaciones.');
  return { persistent: true, actorId: actor.nutritionistId };
}

async function ownerAccess(
  c: Context,
  patientId: string,
  action: 'delegate_patient' | 'revoke_delegation' | 'transfer_ownership' | 'read_patient',
) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (!getPatient(patientId)) throw new repo.CareError(404, 'Paciente no encontrado.');
    if (c.req.query('audience') === 'patient') {
      throw new repo.CareError(403, 'Sólo una profesional puede hacer esta acción.');
    }
    return { persistent: false, actorId: c.req.query('as')?.trim() || DEMO_OWNER_NUTRITIONIST_ID };
  }
  const actor = await authorizePatientAction(auth.userId, patientId, action, {
    getActor: sb.sbGetActor,
    getPatientResource: sb.sbGetPatientResource,
  });
  if (!actor || actor.role !== 'nutri') throw new repo.CareError(403, 'No tenés permiso para esta acción.');
  return { persistent: true, actorId: actor.nutritionistId };
}

const createSchema = z.object({
  name: orgNameSchema,
  slug: orgSlugSchema,
}).strict();

const inviteSchema = z.object({
  nutritionist_id: z.string().trim().min(1).max(80),
  role: z.enum(['admin', 'member']),
}).strict();

const subscriptionSchema = z.object({
  status: z.enum(['trialing', 'waived', 'canceled', 'past_due']),
  note: z.string().trim().max(200).optional().default(''),
}).strict();

const delegateSchema = z.object({
  nutritionist_id: z.string().trim().min(1).max(80),
  organization_id: z.string().uuid(),
  role: z.enum(['delegate', 'observer']),
}).strict();

const transferSchema = z.object({
  nutritionist_id: z.string().trim().min(1).max(80),
  reason: z.string().trim().max(200).optional().default(''),
}).strict();

export function registerOrgRoutes(app: Hono) {
  app.post('/api/orgs', async (c) => {
    const input = await body(c, createSchema, 'Revisá la organización, el equipo y las reglas de delegación.');
    const { persistent, actorId } = await nutriAccess(c);
    const organization = await repo.createOrganization(input.name, input.slug, persistent, actorId);
    return c.json({ organization, source: persistent ? 'supabase' : 'memory' }, 201);
  });

  app.get('/api/orgs', async (c) => {
    const { persistent, actorId } = await nutriAccess(c);
    const organizations = await repo.listOrganizations(persistent, actorId);
    return c.json({ organizations, source: persistent ? 'supabase' : 'memory' });
  });

  app.post('/api/orgs/:id/members', async (c) => {
    const input = await body(c, inviteSchema, 'Revisá la organización, el equipo y las reglas de delegación.');
    const { persistent, actorId } = await nutriAccess(c);
    const organization = await repo.inviteOrgMember(c.req.param('id'), input.nutritionist_id, input.role, persistent, actorId);
    return c.json({ organization, source: persistent ? 'supabase' : 'memory' });
  });

  app.post('/api/orgs/:id/members/accept', async (c) => {
    const { persistent, actorId } = await nutriAccess(c);
    const organization = await repo.acceptOrgInvite(c.req.param('id'), persistent, actorId);
    return c.json({ organization, source: persistent ? 'supabase' : 'memory' });
  });

  app.get('/api/orgs/:id/subscription', async (c) => {
    const { persistent, actorId } = await nutriAccess(c);
    const subscription = await repo.getOrgSubscription(c.req.param('id'), persistent, actorId);
    return c.json({ subscription, source: persistent ? 'supabase' : 'memory' });
  });

  app.patch('/api/orgs/:id/subscription', async (c) => {
    const input = await body(c, subscriptionSchema, 'Revisá la organización, el equipo y las reglas de delegación.');
    const { persistent, actorId } = await nutriAccess(c);
    const subscription = await repo.setOrgSubscription(c.req.param('id'), input.status, input.note, persistent, actorId);
    return c.json({ subscription, source: persistent ? 'supabase' : 'memory' });
  });

  app.get('/api/patients/:id/care-links', async (c) => {
    const patientId = c.req.param('id');
    const { persistent, actorId } = await nutriAccess(c);
    if (!persistent && !getPatient(patientId)) throw new repo.CareError(404, 'Paciente no encontrado.');
    const links = await repo.listCareLinks(patientId, persistent, actorId);
    return c.json({ links, source: persistent ? 'supabase' : 'memory' });
  });

  app.post('/api/patients/:id/care-links', async (c) => {
    const patientId = c.req.param('id');
    const input = await body(c, delegateSchema, 'Revisá la organización, el equipo y las reglas de delegación.');
    const { persistent, actorId } = await ownerAccess(c, patientId, 'delegate_patient');
    const links = await repo.delegateCare(patientId, input.nutritionist_id, input.role, input.organization_id, persistent, actorId);
    return c.json({ links, source: persistent ? 'supabase' : 'memory' });
  });

  app.delete('/api/patients/:id/care-links/:linkId', async (c) => {
    const { persistent, actorId } = await ownerAccess(c, c.req.param('id'), 'revoke_delegation');
    const links = await repo.revokeCare(c.req.param('linkId'), persistent, actorId);
    return c.json({ links, source: persistent ? 'supabase' : 'memory' });
  });

  app.post('/api/patients/:id/transfer-ownership', async (c) => {
    const patientId = c.req.param('id');
    const input = await body(c, transferSchema, 'Revisá la organización, el equipo y las reglas de delegación.');
    const { persistent, actorId } = await ownerAccess(c, patientId, 'transfer_ownership');
    const transfer = await repo.transferOwnership(patientId, input.nutritionist_id, input.reason, persistent, actorId);
    return c.json({ transfer, source: persistent ? 'supabase' : 'memory' });
  });
}
