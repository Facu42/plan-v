import { z } from 'zod';

export const PLAN_SLOTS = ['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena', 'Extra'] as const;
export type PlanSlot = (typeof PLAN_SLOTS)[number];
export const PLAN_SLOT_KEYS = ['desayuno', 'colacion', 'almuerzo', 'merienda', 'cena', 'extra'] as const;
export type PlanSlotKey = (typeof PLAN_SLOT_KEYS)[number];

const SLOT_BY_KEY: Record<PlanSlotKey, PlanSlot> = {
  desayuno: 'Desayuno',
  colacion: 'Colación',
  almuerzo: 'Almuerzo',
  merienda: 'Merienda',
  cena: 'Cena',
  extra: 'Extra',
};
const KEY_BY_SLOT: Record<PlanSlot, PlanSlotKey> = {
  Desayuno: 'desayuno',
  Colación: 'colacion',
  Almuerzo: 'almuerzo',
  Merienda: 'merienda',
  Cena: 'cena',
  Extra: 'extra',
};

export function planSlotLabel(value: string): PlanSlot | null {
  if ((PLAN_SLOTS as readonly string[]).includes(value)) return value as PlanSlot;
  const key = value.trim().toLocaleLowerCase('es-AR').normalize('NFD').replace(/\p{M}/gu, '') as PlanSlotKey;
  return SLOT_BY_KEY[key] ?? null;
}

export function planSlotKey(value: string): PlanSlotKey | null {
  const label = planSlotLabel(value);
  return label ? KEY_BY_SLOT[label] : null;
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const planItemInputSchema = z.object({
  for_date: isoDate,
  slot: z.string().trim().min(1).max(20),
  recipe_id: z.string().trim().min(1).max(80).optional(),
  recipe_version: z.number().int().min(1).optional(),
  free_text: z.string().trim().max(150).optional(),
  portions: z.number().positive().max(50).optional(),
  public_note: z.string().trim().max(200).default(''),
}).strict().superRefine((value, ctx) => {
  if (!planSlotKey(value.slot)) ctx.addIssue({ code: 'custom', message: 'slot', path: ['slot'] });
  const hasRecipe = Boolean(value.recipe_id);
  const hasText = Boolean(value.free_text && value.free_text.length > 0);
  if (hasRecipe === hasText) ctx.addIssue({ code: 'custom', message: 'item', path: hasRecipe ? ['free_text'] : ['recipe_id'] });
});

function utcDays(start: string, end: string) {
  const from = Date.UTC(Number(start.slice(0, 4)), Number(start.slice(5, 7)) - 1, Number(start.slice(8, 10)));
  const to = Date.UTC(Number(end.slice(0, 4)), Number(end.slice(5, 7)) - 1, Number(end.slice(8, 10)));
  return (to - from) / 86_400_000;
}

export const mealPlanDraftSchema = z.object({
  id: z.uuid(),
  period_start: isoDate,
  period_end: isoDate,
  timezone: z.literal('America/Argentina/Buenos_Aires').default('America/Argentina/Buenos_Aires'),
  items: z.array(planItemInputSchema).min(1).max(42),
}).strict().superRefine((value, ctx) => {
  if (value.period_end < value.period_start || utcDays(value.period_start, value.period_end) > 21) {
    ctx.addIssue({ code: 'custom', message: 'period', path: ['period_end'] });
  }
  const keys = new Set<string>();
  for (const [index, item] of value.items.entries()) {
    if (item.for_date < value.period_start || item.for_date > value.period_end) {
      ctx.addIssue({ code: 'custom', message: 'date', path: ['items', index, 'for_date'] });
    }
    const key = `${item.for_date}|${planSlotKey(item.slot) ?? item.slot}`;
    if (keys.has(key)) ctx.addIssue({ code: 'custom', message: 'duplicate', path: ['items', index, 'slot'] });
    keys.add(key);
  }
});

export const mealPlanPublishSchema = z.object({ expected_version: z.number().int().min(1) }).strict();

export type MealPlanDraftInput = z.infer<typeof mealPlanDraftSchema>;
export type PlanRecipeDetail = {
  title: string;
  version: number;
  yield_portions: number;
  steps: string[];
  nutrient_source: string;
  ingredients: Array<{ id: string; name: string; quantity: number; unit: string }>;
};
export type PlanItemView = {
  id: string;
  for_date: string;
  slot: PlanSlot;
  recipe_id: string | null;
  recipe_version: number | null;
  recipe_title: string | null;
  recipe: PlanRecipeDetail | null;
  free_text: string | null;
  portions: number | null;
  public_note: string;
};
export type PlanVersionView = {
  id: string;
  version: number;
  status: 'draft' | 'published' | 'archived';
  period_start: string;
  period_end: string;
  published_at: string | null;
  items: PlanItemView[];
};
export type ProfessionalMealPlan = {
  id: string;
  patient_id: string;
  timezone: string;
  created_at: string;
  current: PlanVersionView;
  published: PlanVersionView | null;
};
export type PatientMealPlan = {
  id: string;
  timezone: string;
  version: number;
  period_start: string;
  period_end: string;
  published_at: string;
  items: PlanItemView[];
};

export function eachIsoDate(start: string, end: string): string[] {
  const days: string[] = [];
  for (let offset = 0; ; offset += 1) {
    const time = Date.UTC(Number(start.slice(0, 4)), Number(start.slice(5, 7)) - 1, Number(start.slice(8, 10)) + offset);
    const iso = new Date(time).toISOString().slice(0, 10);
    if (iso > end) break;
    days.push(iso);
  }
  return days;
}

export function planWeekdayLabel(iso: string): string {
  const label = new Date(`${iso}T12:00:00-03:00`).toLocaleDateString('es-AR', {
    weekday: 'long',
    timeZone: 'America/Argentina/Buenos_Aires',
  });
  return label ? label.charAt(0).toLocaleUpperCase('es-AR') + label.slice(1) : iso;
}

export type PublishedPlanDay = { isoDate: string; weekday: string; items: PlanItemView[] };

export function buildPublishedPlanDays(plan: Pick<PatientMealPlan, 'period_start' | 'period_end' | 'items'>): PublishedPlanDay[] {
  return eachIsoDate(plan.period_start, plan.period_end).map((isoDate) => ({
    isoDate,
    weekday: planWeekdayLabel(isoDate),
    items: plan.items.filter((item) => item.for_date === isoDate),
  }));
}

export function toPublishedPatientPlan(plan: ProfessionalMealPlan): PatientMealPlan | null {
  if (!plan.published?.published_at) return null;
  return {
    id: plan.id,
    timezone: plan.timezone,
    version: plan.published.version,
    period_start: plan.published.period_start,
    period_end: plan.published.period_end,
    published_at: plan.published.published_at,
    items: plan.published.items,
  };
}
