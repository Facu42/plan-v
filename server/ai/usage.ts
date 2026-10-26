import type { AiMonthlyUsage } from '../../src/types/ai-jobs.js';
import { privilegedDb } from '../db/supabase-client.js';
import { argentinaBudgetMonth, clinicalMemoryBudget, MAX_CLINICAL_MICROS, type MemoryClinicalBudget } from '../clinical-processing/budget.js';

/** Sólo el agregado de la bolsa compartida: nunca operaciones, pacientes ni cachés clínicos. */
export async function readAiUsage(persistent: boolean, now = new Date(), memory: MemoryClinicalBudget = clinicalMemoryBudget): Promise<AiMonthlyUsage | null> {
  const month = argentinaBudgetMonth(now);
  if (!persistent) return { month, used_micros: await memory.used(month), limit_micros: MAX_CLINICAL_MICROS, scope: 'global', source: 'memory' };
  try {
    const { data, error } = await privilegedDb().from('clinical_ai_budget_months')
      .select('used_micros,limit_micros').eq('month', month).maybeSingle();
    // Un mes sin fila no prueba que el proveedor no haya facturado: no se inventa cero.
    if (error || !data) return null;
    const used = Number(data.used_micros);
    const limit = Number(data.limit_micros);
    if (!Number.isSafeInteger(used) || !Number.isSafeInteger(limit) || used < 0 || limit < used || limit > MAX_CLINICAL_MICROS) return null;
    return { month, used_micros: used, limit_micros: limit, scope: 'global', source: 'supabase' };
  } catch {
    return null;
  }
}
