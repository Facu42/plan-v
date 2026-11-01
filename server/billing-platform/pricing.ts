/** Precios de Nutridash en centavos enteros. El 40% de fundador no se suma al 20% anual. */

export const FOUNDER_CAP = 30;
export const GRACE_DAYS = 30;
export const GRACE_MS = GRACE_DAYS * 24 * 60 * 60 * 1000;
export const ACTIVE_PATIENT_DAYS = 30;

export const PLATFORM_PLANS = [
  { code: 'arranque' as const, name: 'Arranque', monthly_amount_cents: 2_490_000, max_active_patients: 25, max_nutritionists: 1, max_ai_meal_photos_month: 150 },
  { code: 'pro' as const, name: 'Pro', monthly_amount_cents: 4_990_000, max_active_patients: 120, max_nutritionists: 1, max_ai_meal_photos_month: 600 },
  { code: 'consultorio' as const, name: 'Consultorio', monthly_amount_cents: 8_990_000, max_active_patients: null, max_nutritionists: 3, max_ai_meal_photos_month: null },
];

export type PlanCode = (typeof PLATFORM_PLANS)[number]['code'];
export type BillingCycle = 'monthly' | 'annual';

export function planByCode(code: string) {
  return PLATFORM_PLANS.find((plan) => plan.code === code) ?? null;
}

/**
 * Fundadora: 40% sobre el precio de lista del ciclo (mensual, o 12 meses).
 * Sin fundadora y anual: 20% sobre 12 meses.
 * Nunca las dos juntas (no es 60% del precio ya rebajado).
 */
export function cycleAmountCents(monthlyCents: number, cycle: BillingCycle, founder: boolean): number {
  if (!Number.isInteger(monthlyCents) || monthlyCents <= 0) throw new Error('monto');
  const monthly = BigInt(monthlyCents);
  const amount = founder
    ? (cycle === 'annual' ? monthly * 12n * 60n : monthly * 60n) / 100n
    : cycle === 'annual' ? monthly * 12n * 80n / 100n : monthly;
  const value = Number(amount);
  if (!Number.isSafeInteger(value)) throw new Error('monto');
  return value;
}

export function pesosFromCents(cents: number): number {
  if (!Number.isInteger(cents) || cents % 100 !== 0) return NaN;
  return cents / 100;
}

export function catalog() {
  return PLATFORM_PLANS.map((plan) => ({
    ...plan,
    annual_amount_cents: cycleAmountCents(plan.monthly_amount_cents, 'annual', false),
    founder_monthly_amount_cents: cycleAmountCents(plan.monthly_amount_cents, 'monthly', true),
    founder_annual_amount_cents: cycleAmountCents(plan.monthly_amount_cents, 'annual', true),
  }));
}
