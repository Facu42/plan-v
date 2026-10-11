import { planReviewSnapshot, type PlanVersionView } from '../../src/types/plans.js';
import type { PGlite } from '@electric-sql/pglite';
import { randomUUID } from 'node:crypto';

/** Existing fixtures represent a fresh editor read. Stale-write tests pass explicit tokens. */
export async function productFixtureArgs(db: PGlite, name: string, supplied: unknown[]) {
  const args = [...supplied];
  if (name === 'save_recipe_draft' || name === 'save_meal_plan_draft') {
    const index = name === 'save_recipe_draft' ? 0 : 1;
    const body = args[index] as Record<string, unknown>;
    if (body && !Object.prototype.hasOwnProperty.call(body, 'expected_revision')) {
      const query = name === 'save_recipe_draft'
        ? 'select revision from public.recipe_versions where recipe_id=$1 order by version desc limit 1'
        : 'select v.revision from public.meal_plan_versions v join public.meal_plans p on p.id=v.meal_plan_id where p.patient_id=$1 order by v.version desc limit 1';
      const current = await db.query<{ revision: string }>(query, [name === 'save_recipe_draft' ? body.id : args[0]]);
      args[index] = { ...body, expected_revision: current.rows[0]?.revision ?? null };
    }
  }
  if (name === 'publish_meal_plan') {
    const version = await db.query<{ snapshot: unknown }>('select public.meal_plan_version_json(v.id) as snapshot from public.meal_plan_versions v where v.meal_plan_id=$1 order by (v.version=$2) desc,v.version desc limit 1', args);
    const snapshot = version.rows[0]?.snapshot as Record<string,unknown> | undefined;
    if (snapshot) { args.push(planReviewSnapshot(snapshot as unknown as PlanVersionView)); } else args.push({});
  }
  if (name === 'publish_recipe' && args.length === 2) {
    const current = await db.query<{ revision: string }>('select revision from public.recipe_versions where recipe_id=$1 and version=$2', args);
    args.push(current.rows[0]?.revision ?? randomUUID());
  }
  if (['record_patient_payment', 'report_patient_payment'].includes(name) && args.length < 6) {
    args[4] ??= ''; args[5] = randomUUID();
  }
  if (name === 'log_patient_activity' && args.length < 9) {
    while (args.length < 8) args.push(null);
    args.push(randomUUID());
  }
  return args;
}
