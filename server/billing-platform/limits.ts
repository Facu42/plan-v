import { CareError } from '../care/errors.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { billingEnabled } from './flag.js';
import { planByCode } from './pricing.js';
import { findOpenSubscription, logBilling, nutritionistCreatedAt, schemaMissing, tryAiPhoto, usageOf } from './repository.js';
import { admission, platformWriteAccess } from './state.js';

export function argentinaMonth(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit' }).format(now);
  return parts.slice(0, 7);
}

function relaxed(error: unknown): boolean {
  return error instanceof CareError && error.status === 501 || schemaMissing(error);
}

/** Con la bandera apagada no cambia nada. Sin la migración, tampoco corta el consultorio. */
export async function assertCanAdd(nutritionistId: string, kind: 'patient' | 'nutritionist', incoming: number): Promise<void> {
  if (!billingEnabled() || !isSupabaseEnabled() || incoming <= 0) return;
  try {
    const open = await findOpenSubscription(nutritionistId);
    const createdAt = await nutritionistCreatedAt(nutritionistId);
    const mode = platformWriteAccess(open, createdAt, Date.now());
    if (mode === 'read_only' || !open) {
      if (mode === 'full') return;
      throw new CareError(403, 'Elegí un plan de Nutridash para seguir cargando. Tus pacientes no pierden el acceso.');
    }
    const plan = planByCode(open.plan_code);
    if (!plan) throw new CareError(403, 'Elegí un plan de Nutridash para seguir cargando. Tus pacientes no pierden el acceso.');
    const usage = await usageOf(nutritionistId, argentinaMonth());
    const decision = admission({
      mode,
      active: kind === 'patient' ? usage.active_patients : usage.nutritionists,
      incoming,
      max: kind === 'patient' ? plan.max_active_patients : plan.max_nutritionists,
      kind,
    });
    if (!decision.ok) throw new CareError(decision.status, decision.message);
  } catch (error) {
    if (relaxed(error) && !(error instanceof CareError && error.status === 409)) {
      if (!(error instanceof CareError) || error.status === 501) {
        logBilling('schema_missing');
        return;
      }
    }
    throw error;
  }
}

/** La paciente sigue registrando la comida. Esto solo frena la foto con IA si el plan tiene tope. */
export async function reserveAiPhoto(nutritionistId: string): Promise<boolean> {
  if (!billingEnabled() || !isSupabaseEnabled()) return true;
  try {
    const open = await findOpenSubscription(nutritionistId);
    const plan = open ? planByCode(open.plan_code) : null;
    if (!plan) return true;
    return await tryAiPhoto(nutritionistId, argentinaMonth(), plan.max_ai_meal_photos_month);
  } catch (error) {
    if (relaxed(error)) {
      logBilling('schema_missing');
      return true;
    }
    throw error;
  }
}
