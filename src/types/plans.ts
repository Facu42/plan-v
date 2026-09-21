import { z } from 'zod';

export const PLAN_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
export const PLAN_SLOTS = ['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena', 'Extra'] as const;
export type PlanDayName = typeof PLAN_DAYS[number];
export type PlanSlotName = typeof PLAN_SLOTS[number];

export const planSlotSchema = z.object({
  day: z.enum(PLAN_DAYS),
  slot: z.enum(PLAN_SLOTS),
  title: z.string().trim().min(2).max(150),
  recipe_id: z.uuid().nullable(),
  servings: z.number().int().min(1).max(20).nullable(),
}).strict();
export const planSlotsSchema = z.array(planSlotSchema).max(42).superRefine((slots, ctx) => {
  const seen = new Set<string>();
  for (const [index, item] of slots.entries()) {
    const key = `${item.day}|${item.slot}`;
    if (seen.has(key)) ctx.addIssue({ code: 'custom', message: 'duplicate_slot', path: [index] });
    seen.add(key);
  }
});
export const planInputSchema = z.object({
  id: z.uuid(),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slots: planSlotsSchema,
  expected_version: z.number().int().min(0).max(10_000),
}).strict();
export const planPublishSchema = z.object({
  expected_version: z.number().int().min(1).max(10_000),
}).strict();

export type PlanSlot = z.infer<typeof planSlotSchema>;
export type PlanInput = z.infer<typeof planInputSchema>;
export type MealPlan = {
  id: string;
  patient_id: string;
  nutritionist_id: string;
  version: number;
  period_start: string;
  slots: PlanSlot[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
};
export type MealPlanView = Omit<MealPlan, 'nutritionist_id'>;

export function mondayOf(isoDate?: string): string {
  const today = isoDate ?? new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
  const [year, month, day] = today.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const offset = date.getUTCDay() === 0 ? -6 : 1 - date.getUTCDay();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function weekPlanFromSlots(slots: readonly PlanSlot[]): { day: string; meals: { slot: string; title: string }[] }[] {
  return PLAN_DAYS
    .map((day) => ({
      day,
      meals: slots.filter((item) => item.day === day).map((item) => ({ slot: item.slot, title: item.title })),
    }))
    .filter((entry) => entry.meals.length > 0);
}

export function slotsFromWeekPlan(weekPlan: readonly { day: string; meals: readonly { slot: string; title: string }[] }[]): PlanSlot[] {
  return weekPlan.flatMap((entry) => {
    const day = PLAN_DAYS.find((name) => name === entry.day);
    if (!day) return [];
    return entry.meals.flatMap((meal) => {
      const slot = PLAN_SLOTS.find((name) => name === meal.slot);
      const title = meal.title.trim();
      if (!slot || title.length < 2) return [];
      return [{ day, slot, title, recipe_id: null, servings: null }];
    });
  });
}
