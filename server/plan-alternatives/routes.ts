import type { Context, Hono } from 'hono';
import { authorizePatientAction } from '../security/authorization.js';
import * as sb from '../db/supabase-repo.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { DEMO_NUTRITIONIST_ID, getPatient } from '../store.js';
import { CareError } from '../care/errors.js';
import { loadEvalHealth } from '../ai-eval/health.js';
import { readPublishedMealPlan } from '../plans/repository.js';
import { planChoiceSaveSchema } from '../../src/types/plan-alternatives.js';
import { planAlternativeSlots, planAlternativesView } from './compute.js';
import { readGroupsAndChoices, removeChoice, saveChoice } from './repository.js';

async function access(c: Context, patientId: string) {
  const auth = c.get('auth');
  const persistent = 'userId' in auth && isSupabaseEnabled();
  if (!persistent) {
    if (!getPatient(patientId)) throw new CareError(404, 'Paciente no encontrado.');
    return { persistent: false, professional: c.req.query('audience') === 'pro', owner: DEMO_NUTRITIONIST_ID };
  }
  const actor = await authorizePatientAction(auth.userId, patientId, 'read_patient', { getActor: sb.sbGetActor, getPatientResource: sb.sbGetPatientResource });
  if (!actor) throw new CareError(403, 'No tenés permiso para esta acción.');
  return { persistent: true, professional: actor.role === 'nutri', owner: '' };
}

async function load(patientId: string, persistent: boolean, owner: string) {
  const [published, health, stored] = await Promise.all([
    readPublishedMealPlan(patientId, persistent),
    loadEvalHealth(patientId, persistent),
    readGroupsAndChoices(patientId, owner, persistent),
  ]);
  return { plan: published.plan, health, ...stored };
}

export function registerPlanAlternativeRoutes(app: Hono) {
  app.get('/api/patients/:id/plan-alternatives', async (c) => {
    const id = c.req.param('id');
    const { persistent, owner } = await access(c, id);
    const { plan, health, groups, choices } = await load(id, persistent, owner);
    return c.json(planAlternativesView(plan, groups, health, choices));
  });

  app.put('/api/patients/:id/plan-alternatives', async (c) => {
    const id = c.req.param('id');
    const { persistent, professional, owner } = await access(c, id);
    if (professional) throw new CareError(403, 'Solo la paciente elige sus alternativas.');
    const raw = await c.req.text();
    let input;
    try { input = planChoiceSaveSchema.parse(JSON.parse(raw.length > 2_000 ? '' : raw)); } catch { throw new CareError(400, 'Revisá la alternativa elegida.'); }
    if (input.food_id === null) {
      await removeChoice(id, input.item_id, input.component_id, persistent);
    } else {
      const { plan, health, groups } = await load(id, persistent, owner);
      const slot = planAlternativeSlots(plan, groups, health).slots.find(row => row.item_id === input.item_id && row.component_id === input.component_id);
      const option = slot?.options.find(row => row.food_id === input.food_id);
      if (!slot || !option) throw new CareError(409, 'Esa alternativa ya no está disponible. Revisá tu plan.');
      await saveChoice(id, { item_id: slot.item_id, component_id: slot.component_id, group_id: option.group_id, group_revision: option.group_revision, base_food_id: slot.base_food_id, food_id: option.food_id, food_revision: option.food_revision, name: option.name, quantity: option.quantity, unit: option.unit }, persistent);
    }
    const { plan, health, groups, choices } = await load(id, persistent, owner);
    return c.json(planAlternativesView(plan, groups, health, choices));
  });
}
