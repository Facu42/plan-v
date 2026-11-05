import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { argentinaBudgetMonth } from '../clinical-processing/budget.js';
import { isSupabaseEnabled, privilegedDb } from '../db/supabase-client.js';
import { registerDemoState } from '../demo/state.js';
import { DEMO_NUTRITIONIST_ID } from '../store.js';
import type { AdminAiUsage, AdminNutriUsage, AdminOrgUsage, NutritionistAiUsageView, UsageLevel } from '../../src/types/ai-usage.js';
import { AI_FEATURE_LABELS, AI_FEATURES, refreshModelSettings, type AiFeature } from './model-settings.js';

/** Créditos internos por acción lograda. La nutri nunca ve estos números: solo una barra de porcentaje. */
export const FEATURE_CREDITS: Record<AiFeature, number> = {
  menu_draft: 4, recipe_draft: 1, replacement: 1, copilot: 2, meal_photo: 1,
  lab_reading: 2, content_post: 1, admin_assistant: 0, general: 0,
};

/** Cupo mensual interno por nutri, según el plan (Consultorio: el cupo compartido dividido en tres). */
export const PLAN_ALLOWANCE_CREDITS: Record<string, number> = { prueba: 400, arranque: 400, pro: 1500, consultorio: 1700 };
const DEFAULT_PLAN = 'arranque';
export const NEAR_LIMIT_PERCENT = 80;

export function allowanceFor(planCode: string | null | undefined): number {
  return PLAN_ALLOWANCE_CREDITS[planCode ?? ''] ?? PLAN_ALLOWANCE_CREDITS[DEFAULT_PLAN]!;
}

export type MeteredCall = { model: string; inputTokens: number; outputTokens: number; costMicros: number };
export type UsageEvent = {
  id: string; nutritionist_id: string | null; feature: string; model: string;
  input_tokens: number; output_tokens: number; cost_micros: number; credits: number; ok: boolean; created_at: string;
};

type Scope = { nutritionistId: string | null; feature: AiFeature; calls: MeteredCall[] };
const scopes = new AsyncLocalStorage<Scope>();

const memoryEvents: UsageEvent[] = [];
registerDemoState('ai/metering', () => ({ memoryEvents }));
export function resetMeteringMemory() { memoryEvents.length = 0; }

/** A quién se le factura el uso cuando lo dispara una paciente (foto de comida) o un proceso de fondo. */
export async function nutritionistOfPatient(patientId: string): Promise<string | null> {
  if (!isSupabaseEnabled()) return DEMO_NUTRITIONIST_ID;
  try {
    const { data } = await privilegedDb().from('patients').select('nutritionist_id').eq('id', patientId).maybeSingle();
    return (data as { nutritionist_id?: string } | null)?.nutritionist_id ?? null;
  } catch {
    // Medir nunca debe frenar una función de la paciente: el uso queda sin nutri asignada.
    return null;
  }
}

/** Contexto activo: qué función y qué nutri están usando la IA ahora mismo. */
export function currentAiFeature(): AiFeature | null {
  return scopes.getStore()?.feature ?? null;
}

async function insertEvent(event: UsageEvent): Promise<void> {
  if (!isSupabaseEnabled()) { memoryEvents.push(event); return; }
  const { error } = await privilegedDb().from('ai_usage_events').insert(event);
  // Medir nunca debe romper la IA: si la tabla no existe todavía, se avisa en el log y se sigue.
  if (error) console.error('[ai:metering] no se pudo guardar el uso', { code: error.code });
}

function sumCalls(calls: MeteredCall[]) {
  return calls.reduce((total, call) => ({
    input: total.input + call.inputTokens,
    output: total.output + call.outputTokens,
    cost: total.cost + call.costMicros,
  }), { input: 0, output: 0, cost: 0 });
}

async function recordAction(scope: Scope, ok: boolean): Promise<void> {
  if (!scope.calls.length) return; // modo demo o sin proveedor: no hubo gasto que medir
  const total = sumCalls(scope.calls);
  await insertEvent({
    id: randomUUID(), nutritionist_id: scope.nutritionistId, feature: scope.feature, model: scope.calls[0]!.model,
    input_tokens: total.input, output_tokens: total.output, cost_micros: total.cost,
    credits: ok ? FEATURE_CREDITS[scope.feature] : 0, ok, created_at: new Date().toISOString(),
  });
}

/**
 * Agrupa todas las llamadas al modelo de una acción (por ejemplo los dos intentos de una receta)
 * en una sola fila de uso a nombre de la nutri. Los créditos solo cuentan si la acción salió bien;
 * el costo se registra siempre.
 */
export async function withAiAction<T>(
  context: { nutritionistId: string | null; feature: AiFeature },
  run: () => Promise<T>,
): Promise<T> {
  await refreshModelSettings();
  const scope: Scope = { ...context, calls: [] };
  let ok = false;
  try {
    const result = await scopes.run(scope, run);
    ok = true;
    return result;
  } finally {
    await recordAction(scope, ok).catch(() => undefined);
  }
}

/** Lo llama el modelo envuelto después de cada respuesta. Sin acción activa se guarda suelto, sin nutri. */
export async function recordModelCall(feature: AiFeature, call: MeteredCall): Promise<void> {
  const scope = scopes.getStore();
  if (scope) { scope.calls.push(call); return; }
  await insertEvent({
    id: randomUUID(), nutritionist_id: null, feature, model: call.model,
    input_tokens: call.inputTokens, output_tokens: call.outputTokens, cost_micros: call.costMicros,
    credits: 0, ok: true, created_at: new Date().toISOString(),
  }).catch(() => undefined);
}

// ── Lectura ─────────────────────────────────────────────────────────────────

const MAX_ROWS = 50_000;

/** Un mes argentino va de las 00:00 de Buenos Aires (03:00 UTC) a las 00:00 del mes siguiente. */
export function monthRange(month: string): { from: string; to: string } {
  const [year, mon] = month.split('-').map(Number) as [number, number];
  const next = mon === 12 ? { year: year + 1, mon: 1 } : { year, mon: mon + 1 };
  const iso = (y: number, m: number) => `${y}-${String(m).padStart(2, '0')}-01T03:00:00.000Z`;
  return { from: iso(year, mon), to: iso(next.year, next.mon) };
}

async function eventsOfMonth(month: string, nutritionistId?: string): Promise<UsageEvent[]> {
  const { from, to } = monthRange(month);
  if (!isSupabaseEnabled()) {
    return memoryEvents.filter((event) => event.created_at >= from && event.created_at < to
      && (!nutritionistId || event.nutritionist_id === nutritionistId));
  }
  let query = privilegedDb().from('ai_usage_events')
    .select('id,nutritionist_id,feature,model,input_tokens,output_tokens,cost_micros,credits,ok,created_at')
    .gte('created_at', from).lt('created_at', to).limit(MAX_ROWS);
  if (nutritionistId) query = query.eq('nutritionist_id', nutritionistId);
  const { data, error } = await query;
  if (error) return [];
  return (data ?? []).map((row) => ({
    ...(row as Omit<UsageEvent, 'cost_micros'>),
    cost_micros: Number((row as { cost_micros: unknown }).cost_micros),
  }));
}

export type { AdminAiUsage, AdminNutriUsage, AdminOrgUsage, NutritionistAiUsageView, UsageLevel };

export function levelFor(percent: number): UsageLevel {
  return percent >= 100 ? 'over' : percent >= NEAR_LIMIT_PERCENT ? 'near' : 'ok';
}

export function renewalDate(month: string): string {
  return monthRange(month).to.slice(0, 10);
}

export async function planCodeOf(nutritionistId: string): Promise<string | null> {
  if (!isSupabaseEnabled()) return null;
  const { data } = await privilegedDb().from('platform_subscriptions').select('plan_code')
    .eq('nutritionist_id', nutritionistId).neq('status', 'canceled').order('created_at', { ascending: false }).limit(1);
  const code = (data?.[0] as { plan_code?: string } | undefined)?.plan_code;
  return code ?? null;
}

export async function nutritionistUsageView(nutritionistId: string, now = new Date()): Promise<NutritionistAiUsageView> {
  const month = argentinaBudgetMonth(now);
  const [events, plan] = await Promise.all([eventsOfMonth(month, nutritionistId), planCodeOf(nutritionistId)]);
  const credits = events.reduce((sum, event) => sum + event.credits, 0);
  const percent = Math.min(999, Math.round((credits / allowanceFor(plan)) * 100));
  return { month, percent, level: levelFor(percent), renews_on: renewalDate(month) };
}

type Directory = { names: Map<string, string>; plans: Map<string, string>; orgs: Map<string, string> };

async function directory(): Promise<Directory> {
  const empty: Directory = { names: new Map(), plans: new Map(), orgs: new Map() };
  if (!isSupabaseEnabled()) return empty;
  const db = privilegedDb();
  const [nutris, subs, members, orgs] = await Promise.all([
    db.from('nutritionists').select('id,display_name').limit(5000),
    db.from('platform_subscriptions').select('nutritionist_id,plan_code,created_at').neq('status', 'canceled').order('created_at', { ascending: true }).limit(5000),
    db.from('organization_members').select('organization_id,nutritionist_id').eq('status', 'active').limit(5000),
    db.from('organizations').select('id,name').limit(2000),
  ]);
  (nutris.data ?? []).forEach((row) => empty.names.set(String(row.id), String(row.display_name)));
  (subs.data ?? []).forEach((row) => empty.plans.set(String(row.nutritionist_id), String(row.plan_code)));
  const orgNames = new Map((orgs.data ?? []).map((row) => [String(row.id), String(row.name)]));
  (members.data ?? []).forEach((row) => {
    const name = orgNames.get(String(row.organization_id));
    if (name) empty.orgs.set(String(row.nutritionist_id), name);
  });
  return empty;
}

function label(feature: string): string {
  return (AI_FEATURE_LABELS as Record<string, string>)[feature] ?? feature;
}

/** Vista del administrador: consumo del mes por nutri, por consultorio y por función. */
export async function adminUsageView(now = new Date()): Promise<AdminAiUsage> {
  const month = argentinaBudgetMonth(now);
  const [events, dir] = await Promise.all([eventsOfMonth(month), directory()]);
  const perNutri = new Map<string, UsageEvent[]>();
  const perFeature = new Map<string, { calls: number; cost: number }>();
  let unassigned = 0;
  for (const event of events) {
    const bucket = perFeature.get(event.feature) ?? { calls: 0, cost: 0 };
    perFeature.set(event.feature, { calls: bucket.calls + 1, cost: bucket.cost + event.cost_micros });
    if (!event.nutritionist_id) { unassigned += event.cost_micros; continue; }
    perNutri.set(event.nutritionist_id, [...(perNutri.get(event.nutritionist_id) ?? []), event]);
  }
  const nutris: AdminNutriUsage[] = [...perNutri.entries()].map(([id, rows]) => {
    const credits = rows.reduce((sum, row) => sum + row.credits, 0);
    const plan = dir.plans.get(id) ?? null;
    const allowance = allowanceFor(plan);
    const features = new Map<string, { calls: number; cost: number }>();
    rows.forEach((row) => {
      const current = features.get(row.feature) ?? { calls: 0, cost: 0 };
      features.set(row.feature, { calls: current.calls + 1, cost: current.cost + row.cost_micros });
    });
    return {
      nutritionist_id: id, name: dir.names.get(id) ?? 'Nutricionista', plan_code: plan, organization: dir.orgs.get(id) ?? null,
      credits, allowance, percent: Math.round((credits / allowance) * 100), calls: rows.length,
      cost_usd_micros: rows.reduce((sum, row) => sum + row.cost_micros, 0),
      by_feature: [...features.entries()].map(([feature, value]) => ({ feature, label: label(feature), calls: value.calls, cost_usd_micros: value.cost })),
    };
  }).sort((a, b) => b.cost_usd_micros - a.cost_usd_micros || b.credits - a.credits);
  const orgs = new Map<string, AdminNutriUsage[]>();
  nutris.forEach((nutri) => { if (nutri.organization) orgs.set(nutri.organization, [...(orgs.get(nutri.organization) ?? []), nutri]); });
  const consultorios: AdminOrgUsage[] = [...orgs.entries()].map(([organization, list]) => {
    const credits = list.reduce((sum, item) => sum + item.credits, 0);
    const allowance = list.reduce((sum, item) => sum + item.allowance, 0);
    return { organization, nutris: list.length, credits, allowance, percent: Math.round((credits / allowance) * 100), cost_usd_micros: list.reduce((sum, item) => sum + item.cost_usd_micros, 0) };
  }).sort((a, b) => b.cost_usd_micros - a.cost_usd_micros);
  return {
    month,
    totals: { calls: events.length, credits: nutris.reduce((sum, n) => sum + n.credits, 0), cost_usd_micros: events.reduce((sum, e) => sum + e.cost_micros, 0), unassigned_cost_usd_micros: unassigned },
    nutris, consultorios,
    features: AI_FEATURES.filter((feature) => perFeature.has(feature)).map((feature) => ({ feature, label: label(feature), calls: perFeature.get(feature)!.calls, cost_usd_micros: perFeature.get(feature)!.cost })),
  };
}
