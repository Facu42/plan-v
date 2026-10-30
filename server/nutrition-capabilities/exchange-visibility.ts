import type { Context, Hono } from 'hono';
import { exchangeVisibilityInputSchema, type ExchangeVisibility, type ExchangeVisibilityInput, type PatientExchanges } from '../../src/types/exchange-visibility.js';
import { getRequestDb, isSupabaseEnabled } from '../db/supabase-client.js';
import { sbGetActor, sbGetPatientResource } from '../db/supabase-repo.js';
import { authorizePatientAction } from '../security/authorization.js';
import { DEMO_NUTRITIONIST_ID, getPatient } from '../store.js';
import { registerDemoState } from '../demo/state.js';
import { CareError } from '../care/errors.js';
import { listNutritionExchanges, nutritionDbError } from './repository.js';
import type { ExchangeGroup } from '../../src/types/nutrition-capabilities.js';
import { foodQuantityUnit } from '../../src/types/foods.js';

const visibility = new Map<string, ExchangeVisibility>();
registerDemoState('nutrition-exchange-visibility', () => ({ visibility }));
export function resetExchangeVisibilityMemory() { visibility.clear(); }
function dbError(error: { code?: string } | null) {
  if (error && ['42P01','42883','PGRST202','PGRST205'].includes(error.code ?? '')) throw new CareError(501, 'La visibilidad de equivalencias necesita instalar su migración antes de activarla.');
  nutritionDbError(error);
}
export async function getExchangeVisibility(owner: string, persistent: boolean): Promise<ExchangeVisibility> {
  if (!persistent) return structuredClone(visibility.get(owner) ?? { enabled: false, revision: 0 });
  const { data, error } = await getRequestDb().rpc('nutrition_exchange_visibility'); dbError(error); return data;
}
export async function saveExchangeVisibility(owner: string, input: ExchangeVisibilityInput, persistent: boolean): Promise<ExchangeVisibility> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('save_nutrition_exchange_visibility', { expected_revision: input.expected_revision, visibility_enabled: input.enabled });
    dbError(error); return data;
  }
  const prior = visibility.get(owner) ?? { enabled: false, revision: 0 };
  if (prior.revision !== input.expected_revision) throw new CareError(409, 'La visibilidad cambió. Recargá antes de guardar.');
  const saved = { enabled: input.enabled, revision: prior.revision + 1 }; visibility.set(owner, saved); return structuredClone(saved);
}
export function publicExchangeGroups(groups: ExchangeGroup[]): PatientExchanges['groups'] {
  return groups.map(g => ({ id: g.id, name: g.name, revision: g.revision, items: g.items.map(i => ({
    quantity: i.quantity ?? i.grams!, unit: i.unit ?? foodQuantityUnit(i.food),
    food: { id: i.food.id, name: i.food.name,
      nutrients: { kcal: i.food.nutrients.kcal, protein: i.food.nutrients.protein, carbs: i.food.nutrients.carbs, fat: i.food.nutrients.fat },
      portions: i.food.portions.map(p => ({ name: p.name, grams: p.grams })),
    },
  })) }));
}
export async function patientExchanges(patientId: string, owner: string, persistent: boolean): Promise<PatientExchanges> {
  if (persistent) {
    const { data, error } = await getRequestDb().rpc('list_patient_nutrition_exchanges', { target_patient: patientId }); dbError(error); return data;
  }
  const state = await getExchangeVisibility(owner, false);
  return { enabled: state.enabled, groups: state.enabled ? publicExchangeGroups(await listNutritionExchanges(owner, false)) : [] };
}
async function professional(c: Context) {
  const auth = c.get('auth');
  if ('demo' in auth) return { owner: DEMO_NUTRITIONIST_ID, persistent: false };
  if (!isSupabaseEnabled()) throw new CareError(503, 'El servicio no está disponible.');
  const actor = await sbGetActor(auth.userId);
  if (actor?.role !== 'nutri') throw new CareError(403, 'Solo la nutricionista puede cambiar la visibilidad.');
  // The actor-scoped RPC also denies platform administrators, even if they have a nutri profile.
  return { owner: actor.nutritionistId, persistent: true };
}
function noOwnerQuery(c: Context) { if (Object.keys(c.req.query()).length) throw new CareError(400, 'La consulta no acepta un consultorio ni otros parámetros.'); }
export function registerExchangeVisibilityRoutes(app: Hono) {
  app.get('/api/nutrition/exchange-visibility', async c => {
    noOwnerQuery(c); const actor = await professional(c); return c.json(await getExchangeVisibility(actor.owner, actor.persistent));
  });
  app.put('/api/nutrition/exchange-visibility', async c => {
    noOwnerQuery(c); const actor = await professional(c);
    if (Number(c.req.header('Content-Length')) > 1000) throw new CareError(413, 'Los datos son demasiado grandes.');
    const raw = await c.req.text(); if (raw.length > 1000) throw new CareError(413, 'Los datos son demasiado grandes.');
    let value: unknown; try { value = JSON.parse(raw); } catch { throw new CareError(400, 'Revisá los datos enviados.'); }
    const input = exchangeVisibilityInputSchema.safeParse(value); if (!input.success) throw new CareError(400, 'Revisá la visibilidad y la versión actual.');
    return c.json(await saveExchangeVisibility(actor.owner, input.data, actor.persistent));
  });
  app.get('/api/patients/:id/nutrition/exchanges', async c => {
    noOwnerQuery(c); const auth = c.get('auth'), id = c.req.param('id');
    if ('demo' in auth) {
      const patient = getPatient(id); if (!patient || patient.archived_at || patient.deactivated_at || patient.anonymized_at) throw new CareError(404, 'Paciente no disponible.');
      return c.json(await patientExchanges(id, DEMO_NUTRITIONIST_ID, false));
    }
    if (!isSupabaseEnabled()) throw new CareError(503, 'El servicio no está disponible.');
    const actor = await authorizePatientAction(auth.userId, id, 'read_patient', { getActor: sbGetActor, getPatientResource: sbGetPatientResource });
    if (!actor || !['nutri','paciente'].includes(actor.role)) throw new CareError(403, 'No tenés permiso para leer estas equivalencias.');
    // No owner input reaches the RPC: SQL derives ownership from the authorized patient.
    return c.json(await patientExchanges(id, '', true));
  });
}
