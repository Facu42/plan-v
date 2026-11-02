import type { Hono } from 'hono';
import { z } from 'zod';
import { contarHechos } from '../../src/lib/hoy-accion.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { SchemaUnavailableError, sbGetActor, sbGetPatientResource, sbGetProfileRole } from '../db/supabase-repo.js';
import { authorizePatientAction } from '../security/authorization.js';
import type { PatientAction } from '../security/contracts.js';
import { getPatient } from '../store.js';
import { guardarHechoMemoria, listarHechosMemoria } from './memory.js';
import { guardarHechoPersistido, listarHechosPersistidos } from './persist.js';

const cuerpo = z.object({
  action: z.enum(['mensaje', 'ajuste_menu', 'turno']),
  source_key: z.string().trim().min(1).max(180),
}).strict();

const permiso: Record<'mensaje' | 'ajuste_menu' | 'turno', PatientAction> = {
  mensaje: 'send_message',
  ajuste_menu: 'edit_menu',
  turno: 'edit_appointment',
};

export function registerHoyRoutes(app: Hono) {
  app.get('/api/crm/hoy-hechos', async c => {
    const auth = c.get('auth');
    if ('userId' in auth && isSupabaseEnabled()) {
      if (await sbGetProfileRole(auth.userId) !== 'nutri') return c.json({ error: 'Prohibido' }, 403);
      const actor = await sbGetActor(auth.userId);
      if (!actor || actor.role !== 'nutri') return c.json({ error: 'Prohibido' }, 403);
      try {
        const hechos = await listarHechosPersistidos(actor.nutritionistId);
        return c.json({ hechos, hechos_7d: contarHechos(hechos, new Date()) });
      } catch (error) {
        if (error instanceof SchemaUnavailableError) return c.json({ hechos: [], hechos_7d: 0, persistencia: 'pendiente' });
        throw error;
      }
    }
    const hechos = listarHechosMemoria();
    return c.json({ hechos, hechos_7d: contarHechos(hechos, new Date()) });
  });

  app.post('/api/patients/:id/hoy/hecho', async c => {
    const parsed = cuerpo.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'Revisá la acción.' }, 400);
    const patientId = c.req.param('id');
    const { action, source_key: sourceKey } = parsed.data;
    const doneAt = new Date().toISOString();
    const auth = c.get('auth');
    if ('userId' in auth && isSupabaseEnabled()) {
      const actor = await authorizePatientAction(auth.userId, patientId, permiso[action], {
        getActor: sbGetActor,
        getPatientResource: sbGetPatientResource,
      });
      if (!actor || actor.role !== 'nutri') return c.json({ error: 'Prohibido' }, 403);
      try {
        const hecho = await guardarHechoPersistido(actor.nutritionistId, patientId, action, sourceKey, doneAt);
        const hechos = await listarHechosPersistidos(actor.nutritionistId);
        return c.json({ hecho, hechos_7d: contarHechos(hechos, new Date()) });
      } catch (error) {
        if (error instanceof SchemaUnavailableError) return c.json({ error: 'Todavía no se puede anotar la acción hecha.' }, 501);
        throw error;
      }
    }
    if (!getPatient(patientId)) return c.json({ error: 'No encontrada' }, 404);
    const hecho = guardarHechoMemoria({ patientId, action, sourceKey, doneAt });
    return c.json({ hecho, hechos_7d: contarHechos(listarHechosMemoria(), new Date()) });
  });
}
