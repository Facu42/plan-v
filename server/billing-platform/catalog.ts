import { catalog as seedCatalog, cycleAmountCents, type BillingCycle } from './pricing.js';
import * as repo from './repository.js';

export type PlanRow = {
  code: string;
  name: string;
  monthly_amount_cents: number;
  annual_amount_cents: number;
  founder_monthly_amount_cents: number;
  founder_annual_amount_cents: number;
  max_active_patients: number | null;
  max_nutritionists: number;
  max_ai_meal_photos_month: number | null;
  active: boolean;
  listed: boolean;
};

const TTL_MS = 15_000;
let cache: { at: number; plans: PlanRow[] } | null = null;

export function seedPlans(): PlanRow[] {
  return seedCatalog().map((plan) => ({ ...plan, active: true, listed: true }));
}

export const HIDDEN_PLAN: PlanRow = {
  code: 'prueba',
  name: 'Prueba',
  monthly_amount_cents: 10_000,
  annual_amount_cents: 96_000,
  founder_monthly_amount_cents: 10_000,
  founder_annual_amount_cents: 96_000,
  max_active_patients: 25,
  max_nutritionists: 1,
  max_ai_meal_photos_month: 150,
  active: true,
  listed: false,
};

export function invalidatePlans(): void {
  cache = null;
}

function cents(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isSafeInteger(parsed)) return null;
  return parsed;
}

export function planFromRow(row: Record<string, unknown>): PlanRow | null {
  const monthly = cents(row.monthly_amount_cents);
  const annual = cents(row.annual_amount_cents);
  const founderMonthly = cents(row.founder_monthly_amount_cents);
  const founderAnnual = cents(row.founder_annual_amount_cents);
  const seats = cents(row.max_nutritionists);
  if (monthly == null || annual == null || founderMonthly == null || founderAnnual == null || seats == null) return null;
  const patients = row.max_active_patients == null ? null : cents(row.max_active_patients);
  const photos = row.max_ai_meal_photos_month == null ? null : cents(row.max_ai_meal_photos_month);
  return {
    code: String(row.code),
    name: String(row.name),
    monthly_amount_cents: monthly,
    annual_amount_cents: annual,
    founder_monthly_amount_cents: founderMonthly,
    founder_annual_amount_cents: founderAnnual,
    max_active_patients: patients,
    max_nutritionists: seats,
    max_ai_meal_photos_month: photos,
    active: row.active !== false,
    listed: row.listed !== false,
  };
}

export function amountOf(plan: PlanRow, cycle: BillingCycle, founder: boolean): number {
  const value = founder
    ? (cycle === 'annual' ? plan.founder_annual_amount_cents : plan.founder_monthly_amount_cents)
    : (cycle === 'annual' ? plan.annual_amount_cents : plan.monthly_amount_cents);
  if (!Number.isInteger(value) || value <= 0 || value % 100 !== 0) return cycleAmountCents(plan.monthly_amount_cents, cycle, founder);
  return value;
}

export async function loadPlans(force = false): Promise<PlanRow[]> {
  if (!force && cache && Date.now() - cache.at < TTL_MS) return cache.plans;
  let plans = seedPlans();
  try {
    if (typeof repo.readPlanCatalog === 'function') {
      const rows = await repo.readPlanCatalog();
      const parsed = rows?.map(planFromRow).filter((plan): plan is PlanRow => plan != null) ?? [];
      if (parsed.length) plans = parsed;
    }
  } catch {
    plans = seedPlans();
  }
  cache = { at: Date.now(), plans };
  return plans;
}

export async function planByCodeLive(code: string): Promise<PlanRow | null> {
  const plans = await loadPlans();
  return plans.find((plan) => plan.code === code) ?? null;
}

export async function isTester(email: string | null | undefined): Promise<boolean> {
  if (!email || typeof repo.isPlanTester !== 'function') return false;
  try { return await repo.isPlanTester(email); } catch { return false; }
}

export function visiblePlans(plans: PlanRow[], tester: boolean): PlanRow[] {
  return plans.filter((plan) => plan.active && (plan.listed || tester));
}
