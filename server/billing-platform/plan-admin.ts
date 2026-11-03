import { CareError } from '../care/errors.js';
import { HIDDEN_PLAN, invalidatePlans, planFromRow, seedPlans, type PlanRow } from './catalog.js';
import * as repo from './repository.js';

export type PlanEditor = {
  code: string;
  name: string;
  monthly_pesos: number;
  annual_pesos: number;
  founder_monthly_pesos: number;
  founder_annual_pesos: number;
  active: boolean;
  listed: boolean;
};

export type PlanChangeView = {
  id: string;
  plan_code: string;
  actor_email: string;
  monthly_pesos: number;
  annual_pesos: number;
  founder_monthly_pesos: number;
  founder_annual_pesos: number;
  active: boolean;
  created_at: string;
};

export type PlanBoard = {
  plans: PlanEditor[];
  changes: PlanChangeView[];
  testers: string[];
  editable: boolean;
};

const CODES = new Set(['arranque', 'pro', 'consultorio', 'prueba']);

type Memory = { plans: PlanRow[]; changes: PlanChangeView[]; testers: string[] };
let memory: Memory | null = null;

function pesos(cents: number): number {
  return cents / 100;
}

function toEditor(plan: PlanRow): PlanEditor {
  return {
    code: plan.code,
    name: plan.name,
    monthly_pesos: pesos(plan.monthly_amount_cents),
    annual_pesos: pesos(plan.annual_amount_cents),
    founder_monthly_pesos: pesos(plan.founder_monthly_amount_cents),
    founder_annual_pesos: pesos(plan.founder_annual_amount_cents),
    active: plan.active,
    listed: plan.listed,
  };
}

function blankMemory(): Memory {
  return { plans: [...seedPlans(), { ...HIDDEN_PLAN }], changes: [], testers: [] };
}

export function resetPlanMemory(): void {
  memory = null;
}

export function pesosToCents(pesosAmount: number): number {
  if (!Number.isInteger(pesosAmount) || pesosAmount <= 0 || pesosAmount > 100_000_000) {
    throw new CareError(400, 'El monto tiene que ser un entero en pesos, mayor a cero.');
  }
  return pesosAmount * 100;
}

export async function adminPlanBoard(persistent: boolean): Promise<PlanBoard> {
  if (!persistent) {
    memory ??= blankMemory();
    return { plans: memory.plans.map(toEditor), changes: memory.changes, testers: [...memory.testers], editable: true };
  }
  const rows = await repo.readPlanCatalog();
  if (!rows?.length) throw new CareError(501, 'Falta aplicar la migración de precios. No aplicar en prod sin la frase de Facundo.');
  const plans = rows.map(planFromRow).filter((plan): plan is PlanRow => plan != null);
  if (!plans.length) throw new CareError(501, 'Falta aplicar la migración de precios. No aplicar en prod sin la frase de Facundo.');
  const changes = (await repo.listPlanChanges()).map((row) => ({
    id: String(row.id),
    plan_code: String(row.plan_code),
    actor_email: String(row.actor_email),
    monthly_pesos: pesos(Number(row.monthly_amount_cents)),
    annual_pesos: pesos(Number(row.annual_amount_cents)),
    founder_monthly_pesos: pesos(Number(row.founder_monthly_amount_cents)),
    founder_annual_pesos: pesos(Number(row.founder_annual_amount_cents)),
    active: row.active === true,
    created_at: String(row.created_at),
  }));
  return { plans: plans.map(toEditor), changes, testers: await repo.listPlanTesters(), editable: true };
}

export async function adminUpdatePlan(code: string, input: {
  monthly_pesos: number;
  annual_pesos: number;
  founder_monthly_pesos: number;
  founder_annual_pesos: number;
  active: boolean;
}, actor: { userId: string | null; email: string }, persistent: boolean): Promise<PlanBoard> {
  if (!CODES.has(code)) throw new CareError(404, 'Ese plan no existe.');
  const patch = {
    monthly_amount_cents: pesosToCents(input.monthly_pesos),
    annual_amount_cents: pesosToCents(input.annual_pesos),
    founder_monthly_amount_cents: pesosToCents(input.founder_monthly_pesos),
    founder_annual_amount_cents: pesosToCents(input.founder_annual_pesos),
    active: input.active,
  };
  if (!persistent) {
    memory ??= blankMemory();
    const plan = memory.plans.find((item) => item.code === code);
    if (!plan) throw new CareError(404, 'Ese plan no existe.');
    Object.assign(plan, patch);
    memory.changes.unshift({
      id: `mem-${memory.changes.length + 1}`,
      plan_code: code,
      actor_email: actor.email,
      monthly_pesos: input.monthly_pesos,
      annual_pesos: input.annual_pesos,
      founder_monthly_pesos: input.founder_monthly_pesos,
      founder_annual_pesos: input.founder_annual_pesos,
      active: input.active,
      created_at: new Date().toISOString(),
    });
    invalidatePlans();
    return adminPlanBoard(false);
  }
  await repo.savePlanAmount(code, patch, actor);
  invalidatePlans();
  return adminPlanBoard(true);
}

export async function adminReplaceTesters(emails: string[], persistent: boolean): Promise<PlanBoard> {
  const unique = [...new Set(emails.map((email) => email.trim().toLowerCase()))];
  if (!persistent) {
    memory ??= blankMemory();
    memory.testers = unique;
    return adminPlanBoard(false);
  }
  await repo.replacePlanTesters(unique);
  return adminPlanBoard(true);
}
