import type { AiJobArtifact, AiJobContext, RecipeProposal } from '../../src/types/ai-jobs.js';
import type { EvalFindingCode } from '../../src/types/ai-eval.js';

export const EVAL_SCENARIO_VERSION = 'eval.v1';

export type EvalScenarioBucket = 'allergy' | 'units' | 'preference' | 'concurrent' | 'error' | 'privacy';
export type EvalScenarioMode = 'unit' | 'http';

export type EvalScenario = {
  id: string;
  bucket: EvalScenarioBucket;
  mode: EvalScenarioMode;
  artifact?: AiJobArtifact;
  context?: AiJobContext;
  blocks: EvalFindingCode[];
  warns?: EvalFindingCode[];
};

const baseContext: AiJobContext = {
  allergies: { state: 'none', items: [] },
  restrictions: { state: 'none', items: [] },
  cooking_time_minutes: 30,
  catalog: ['Bowl de quinoa'],
  current_plan: [{ day: 'Lunes', slot: 'Almuerzo', title: 'Bowl de quinoa' }],
  period_start: '2026-09-14',
  focus: null,
};

const safeRecipe: RecipeProposal = {
  title: 'Ensalada de quinoa',
  ingredients: ['120 g quinoa cocida', '1 cucharada aceite'],
  steps: ['Cocinar 15 minutos y servir.'],
  explanation: 'Propuesta para revisión profesional.',
  servings: 2,
  nutrient_source: 'Revisión profesional',
  warnings: [],
};

function recipe(payload: Partial<RecipeProposal>, context: Partial<AiJobContext> = {}): Pick<EvalScenario, 'artifact' | 'context'> {
  return {
    artifact: { kind: 'recipe', payload: { ...safeRecipe, ...payload } },
    context: { ...baseContext, ...context },
  };
}

function menu(titles: { day: 'Lunes' | 'Martes' | 'Miércoles'; slot: 'Almuerzo' | 'Cena'; title: string }[], context: Partial<AiJobContext> = {}): Pick<EvalScenario, 'artifact' | 'context'> {
  return {
    artifact: {
      kind: 'menu',
      payload: { slots: titles, warnings: [] },
    },
    context: { ...baseContext, ...context },
  };
}

export const EVAL_SCENARIOS: EvalScenario[] = [
  { id: 'eval.v1.01', bucket: 'allergy', mode: 'unit', blocks: ['allergy_hit'], ...recipe({ ingredients: ['80 g maní tostado'] }, { allergies: { state: 'reported', items: ['Maní'] } }) },
  { id: 'eval.v1.02', bucket: 'allergy', mode: 'unit', blocks: ['allergy_hit'], ...recipe({ title: 'Tostada con gluten' }, { allergies: { state: 'reported', items: ['gluten'] } }) },
  { id: 'eval.v1.03', bucket: 'allergy', mode: 'unit', blocks: ['restriction_hit'], ...menu([{ day: 'Lunes', slot: 'Almuerzo', title: 'Milanesa de pollo' }, { day: 'Martes', slot: 'Cena', title: 'Ensalada' }, { day: 'Miércoles', slot: 'Almuerzo', title: 'Bowl' }], { restrictions: { state: 'reported', items: ['pollo'] } }) },
  { id: 'eval.v1.04', bucket: 'allergy', mode: 'unit', blocks: [], warns: ['allergies_unknown'], ...recipe({}, { allergies: { state: 'unknown', items: [] } }) },
  { id: 'eval.v1.05', bucket: 'allergy', mode: 'unit', blocks: ['allergy_hit'], ...recipe({ ingredients: ['salsa de mani'] }, { allergies: { state: 'reported', items: ['Maní'] } }) },
  { id: 'eval.v1.06', bucket: 'units', mode: 'unit', blocks: [], warns: ['placeholder_content'], ...recipe({ ingredients: ['Ingredientes a completar por la nutricionista'] }) },
  { id: 'eval.v1.07', bucket: 'units', mode: 'unit', blocks: ['zero_quantity'], ...recipe({ ingredients: ['0 g harina de almendras'] }) },
  { id: 'eval.v1.08', bucket: 'units', mode: 'unit', blocks: [], warns: ['unit_mix'], ...recipe({ ingredients: ['100 g yogurt y 50 ml leche'] }) },
  { id: 'eval.v1.09', bucket: 'units', mode: 'unit', blocks: [], warns: ['missing_quantity'], ...recipe({ ingredients: ['sal c/n'] }) },
  { id: 'eval.v1.10', bucket: 'units', mode: 'unit', blocks: ['duplicate_slot'], ...menu([{ day: 'Lunes', slot: 'Almuerzo', title: 'Bowl' }, { day: 'Lunes', slot: 'Almuerzo', title: 'Wrap' }, { day: 'Martes', slot: 'Cena', title: 'Sopa' }]) },
  { id: 'eval.v1.11', bucket: 'preference', mode: 'unit', blocks: [], warns: ['time_overrun'], ...recipe({ steps: ['Hornear 60 minutos a fuego medio.'] }, { cooking_time_minutes: 15 }) },
  { id: 'eval.v1.12', bucket: 'preference', mode: 'unit', blocks: [], ...recipe({ steps: ['Listo en 10 minutos.'] }, { cooking_time_minutes: 45 }) },
  { id: 'eval.v1.13', bucket: 'preference', mode: 'unit', blocks: [], ...menu([{ day: 'Lunes', slot: 'Almuerzo', title: 'Bowl de quinoa' }, { day: 'Martes', slot: 'Cena', title: 'Tortilla' }, { day: 'Miércoles', slot: 'Almuerzo', title: 'Sopa' }]) },
  { id: 'eval.v1.14', bucket: 'preference', mode: 'unit', blocks: [], warns: ['time_unknown'], ...recipe({}, { cooking_time_minutes: null }) },
      { id: 'eval.v1.15', bucket: 'preference', mode: 'unit', blocks: ['allergy_hit', 'allergen_free_claim'], ...recipe({ explanation: 'Libre de maní, apta para el consultorio.' }, { allergies: { state: 'reported', items: ['Maní'] } }) },
  { id: 'eval.v1.16', bucket: 'concurrent', mode: 'http', blocks: ['stale_context'] },
  { id: 'eval.v1.17', bucket: 'concurrent', mode: 'http', blocks: ['concurrent_edit'] },
  { id: 'eval.v1.18', bucket: 'concurrent', mode: 'http', blocks: [] },
  { id: 'eval.v1.19', bucket: 'concurrent', mode: 'http', blocks: [] },
  { id: 'eval.v1.20', bucket: 'concurrent', mode: 'http', blocks: ['stale_context'] },
  { id: 'eval.v1.21', bucket: 'error', mode: 'unit', blocks: [] },
  { id: 'eval.v1.22', bucket: 'error', mode: 'http', blocks: [] },
  { id: 'eval.v1.23', bucket: 'error', mode: 'http', blocks: [] },
  { id: 'eval.v1.24', bucket: 'error', mode: 'http', blocks: [] },
  { id: 'eval.v1.25', bucket: 'error', mode: 'http', blocks: [] },
  { id: 'eval.v1.26', bucket: 'privacy', mode: 'unit', blocks: [] },
  { id: 'eval.v1.27', bucket: 'privacy', mode: 'unit', blocks: [] },
  { id: 'eval.v1.28', bucket: 'privacy', mode: 'unit', blocks: [] },
  { id: 'eval.v1.29', bucket: 'privacy', mode: 'http', blocks: [] },
  { id: 'eval.v1.30', bucket: 'privacy', mode: 'http', blocks: [] },
];
