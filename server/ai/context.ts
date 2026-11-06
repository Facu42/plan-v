import { createHash } from 'node:crypto';
import type { IntakePayload } from '../intake/payload.js';
import type { Patient } from '../../src/types/index.js';
import {
  AI_JOB_MAX_TOKENS,
  MENU_PROMPT_VERSION,
  RECIPE_PROMPT_VERSION,
  type AiJobType,
} from '../../src/types/ai-jobs.js';
import { CareError } from '../care/errors.js';
import type { MenuNutritionTarget, RecipeNutrition, ProposedRecipe } from '../../src/types/ai-nutrition.js';
import type { CarbohydrateDefinition } from '../../src/types/plan-day-analysis.js';
import type { AssistantReference } from './plan-assistant.js';
import type { ClinicalWorkspaceRecord } from '../../src/types/clinical-workspace.js';

export { RECIPE_PROMPT_VERSION, MENU_PROMPT_VERSION };

export type HealthSlice = {
  state: IntakePayload['allergies']['state'];
  items: string[];
};

/** Ficha de la paciente para el asistente. Nunca incluye nombre ni teléfono. */
export type MeasurementSlice = { kind: string; value: number; unit: string; on: string };
export type LabSlice = { name: string; value: string; unit: string; range: string; on: string };

const MEASUREMENTS_PER_KIND = 4;
const MAX_MEASUREMENTS = 24;
const MAX_LAB_VALUES = 40;

/** Las últimas lecturas de cada medida (peso, cintura…), de la más nueva a la más vieja. */
export function measurementSlices(measurements: Array<{ kind: string; value_numeric: number; unit: string; captured_on: string }>): MeasurementSlice[] {
  const seen = new Map<string, number>();
  const out: MeasurementSlice[] = [];
  for (const entry of [...measurements].sort((a, b) => b.captured_on.localeCompare(a.captured_on))) {
    const count = seen.get(entry.kind) ?? 0;
    if (count >= MEASUREMENTS_PER_KIND || out.length >= MAX_MEASUREMENTS) continue;
    seen.set(entry.kind, count + 1);
    out.push({ kind: entry.kind, value: entry.value_numeric, unit: entry.unit, on: entry.captured_on });
  }
  return out;
}

/** Valores de laboratorio ya revisados por la profesional; sin texto original, páginas ni identificadores. */
export function labSlices(records: ClinicalWorkspaceRecord[]): LabSlice[] {
  return [...records]
    .sort((a, b) => b.recorded_on.localeCompare(a.recorded_on))
    .flatMap((record) => record.data.kind === 'laboratory'
      ? record.data.values.map((row) => ({ name: row.name, value: row.raw_value, unit: row.unit, range: row.range_text, on: record.recorded_on }))
      : [])
    .slice(0, MAX_LAB_VALUES);
}

export type PatientProfileSlice = {
  goal: string;
  conditions_note: string;
  hydration_glasses: number | null;
  sleep_hours: number | null;
  energy: IntakePayload['energy'] | null;
  measurements: MeasurementSlice[];
  labs: LabSlice[];
};

export type RecipeJobContext = {
  schema: typeof RECIPE_PROMPT_VERSION;
  allergies: HealthSlice;
  restrictions: HealthSlice;
  patient_profile: PatientProfileSlice;
  cooking_time_minutes: number | null;
  title_hint: string | null;
  validity?: { intake_revision: number; consent_event_id: string | null };
};

export type MenuSlotContext = { day: string; meals: Array<{ slot: string; title: string }> };
export type MenuCatalogRecipe = Omit<ProposedRecipe, 'nutrition'> & { id: string; version: number; nutrition: RecipeNutrition | null; carbohydrates?: CarbohydrateDefinition };

export type MenuJobContext = {
  schema: typeof MENU_PROMPT_VERSION;
  allergies: HealthSlice;
  restrictions: HealthSlice;
  patient_profile: PatientProfileSlice;
  cooking_time_minutes: number | null;
  period_start: string | null;
  period_end: string | null;
  slots: string[];
  catalog_titles: string[];
  catalog: MenuCatalogRecipe[];
  confirmed_target: MenuNutritionTarget | null;
  preferences: { cooking_time_minutes: number | null; dietary: string[] };
  request: { target: string; reason: string; replacement: 'recipe' | 'ingredient' } | null;
  week_slots: MenuSlotContext[];
  /** Sólo con el asistente de planes encendido: alimentos SARA 2, equivalencias y modelos de la nutri. */
  assistant?: AssistantReference;
  validity?: { intake_revision: number; consent_event_id: string | null };
};

export function assertKnownAllergies(intake: Pick<IntakePayload, 'allergies' | 'restrictions'>) {
  if (intake.allergies.state === 'unknown' || intake.restrictions.state === 'unknown') {
    throw new CareError(409, 'Completá alergias y restricciones con el paciente antes de generar alternativas.');
  }
}

function sliceFact(fact: IntakePayload['allergies']): HealthSlice {
  return { state: fact.state, items: [...fact.items] };
}

type ProfileSource = Pick<IntakePayload, 'allergies' | 'restrictions' | 'cooking_time_minutes'> & Partial<Pick<IntakePayload, 'patient_intent' | 'conditions_note' | 'hydration_glasses' | 'sleep_hours' | 'energy'>>;

export type ClinicalSlices = { measurements?: MeasurementSlice[]; labs?: LabSlice[] };

function profileSlice(intake: ProfileSource, clinical: ClinicalSlices = {}): PatientProfileSlice {
  return {
    goal: intake.patient_intent?.trim() ?? '',
    conditions_note: intake.conditions_note?.trim() ?? '',
    hydration_glasses: intake.hydration_glasses ?? null,
    sleep_hours: intake.sleep_hours ?? null,
    energy: intake.energy ?? null,
    measurements: clinical.measurements ?? [],
    labs: clinical.labs ?? [],
  };
}

export function buildRecipeJobContext(input: {
  intake: ProfileSource;
  titleHint?: string | null;
  clinical?: ClinicalSlices;
}): RecipeJobContext {
  assertKnownAllergies(input.intake);
  return {
    schema: RECIPE_PROMPT_VERSION,
    allergies: sliceFact(input.intake.allergies),
    restrictions: sliceFact(input.intake.restrictions),
    patient_profile: profileSlice(input.intake, input.clinical),
    cooking_time_minutes: input.intake.cooking_time_minutes ?? null,
    title_hint: input.titleHint?.trim() ? input.titleHint.trim() : null,
  };
}

export function buildMenuJobContext(input: {
  intake: ProfileSource;
  periodStart?: string | null;
  periodEnd?: string | null;
  slots?: string[];
  catalogTitles?: string[];
  catalog?: MenuCatalogRecipe[];
  confirmedTarget?: MenuNutritionTarget | null;
  dietaryPreferences?: string[];
  request?: { target: string; reason: string; replacement: 'recipe' | 'ingredient' } | null;
  weekPlan?: Patient['weekPlan'];
  assistant?: AssistantReference;
  clinical?: ClinicalSlices;
}): MenuJobContext {
  assertKnownAllergies(input.intake);
  return {
    schema: MENU_PROMPT_VERSION,
    allergies: sliceFact(input.intake.allergies),
    restrictions: sliceFact(input.intake.restrictions),
    patient_profile: profileSlice(input.intake, input.clinical),
    cooking_time_minutes: input.intake.cooking_time_minutes ?? null,
    period_start: input.periodStart ?? null,
    period_end: input.periodEnd ?? null,
    slots: input.slots ?? [],
    catalog_titles: (input.catalogTitles ?? []).slice(0, 20),
    catalog: [...(input.catalog ?? [])].sort((a, b) => a.id.localeCompare(b.id)).slice(0, 12),
    confirmed_target: input.confirmedTarget ?? null,
    preferences: { cooking_time_minutes: input.intake.cooking_time_minutes ?? null, dietary: input.dietaryPreferences ?? [] },
    request: input.request ?? null,
    week_slots: (input.weekPlan ?? []).slice(0, 7).map((entry) => ({
      day: entry.day,
      meals: entry.meals.slice(0, 6).map((meal) => ({ slot: meal.slot, title: meal.title })),
    })),
    ...(input.assistant ? { assistant: input.assistant } : {}),
  };
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`).join(',')}}`;
}

/** Validity markers stay on our server; providers receive no consent IDs. */
export function providerJobContext(context: RecipeJobContext | MenuJobContext) {
  const { validity: _validity, ...external } = context;
  if('catalog' in external)return {...external,catalog:external.catalog.map(({carbohydrates:_localDefinition,...recipe})=>recipe)};
  return external;
}

export function hashAiContext(context: unknown): string {
  return createHash('sha256').update(canonicalJson(context), 'utf8').digest('hex');
}

export function estimateTokens(context: unknown): number {
  return Math.max(1, Math.ceil(canonicalJson(context).length / 4));
}

export function assertJobTokenBudget(tokens: number) {
  if (tokens > AI_JOB_MAX_TOKENS) {
    throw new CareError(429, 'El contexto de este job supera el límite de tokens. Reducí el período o las comidas.');
  }
}

export function promptVersionFor(jobType: AiJobType) {
  return jobType === 'recipe_draft' ? RECIPE_PROMPT_VERSION : MENU_PROMPT_VERSION;
}
