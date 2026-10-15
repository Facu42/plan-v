import type { Hono } from 'hono';
import { z } from 'zod';
import { getRequestDb, isSupabaseEnabled, privilegedDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { buildWorkItems, loadWorkSnapshot, readAllRows, resolveWorkScope, type WorkScope } from '../crm/repository.js';
import { withWeeklyRegistration } from '../progress/weekly-repository.js';
import { briefForDisplay, getStore } from '../store.js';
import type { WeeklyRegistration } from '../../src/types/weekly-registration.js';
import { ASSISTANT_QUESTION_MAX } from '../../src/types/assistant.js';
import { answerPortfolioQuestion, type PortfolioPatient } from './portfolio.js';
import { withAiSummary } from './ai-summary.js';

/** El navegador sólo manda la pregunta: el alcance sale siempre de la sesión. */
const assistantQuestionSchema = z.object({
  question: z.string().trim().min(1).max(ASSISTANT_QUESTION_MAX),
}).strict();

const isActive = (patient: WorkScope['patients'][number]) => !patient.archived_at && !patient.deactivated_at && !patient.anonymized_at;

async function loadPersistentPortfolio(scope: WorkScope): Promise<PortfolioPatient[]> {
  const active = scope.patients.filter(isActive);
  const ids = active.map(patient => patient.id);
  const weekly = new Map<string, WeeklyRegistration>();
  const briefs = new Map<string, PortfolioPatient['brief']>();
  // La función de la base valida el acceso de la sesión a cada paciente (lotes de 100).
  for (let index = 0; index < ids.length; index += 100) {
    const { data, error } = await getRequestDb().rpc('get_weekly_registrations', { patient_ids: ids.slice(index, index + 100) });
    // Un resumen no disponible se informa como "sin dato", nunca como cero registros.
    if (error || !data) continue;
    for (const [id, summary] of Object.entries(data as Record<string, WeeklyRegistration>)) weekly.set(id, summary);
  }
  // Mismo patrón que la ficha: el servidor lee la sugerencia vigente del copiloto
  // sólo para ids ya acotados por la sesión y por el consultorio autenticado.
  for (let index = 0; index < ids.length; index += 100) {
    const batch = ids.slice(index, index + 100);
    const rows = await readAllRows((offset, end) => privilegedDb().from('ai_briefs')
      .select('id,patient_id,suggested_action,up_next_title')
      .eq('nutritionist_id', scope.nutritionistId).eq('status', 'pending_review')
      .in('patient_id', batch).order('id').range(offset, end));
    for (const row of rows) if (row.suggested_action) briefs.set(String(row.patient_id), {
      suggested_action: String(row.suggested_action), up_next_title: row.up_next_title == null ? null : String(row.up_next_title),
    });
  }
  return active.map(patient => ({ id: patient.id, name: patient.name, weekly: weekly.get(patient.id) ?? null, brief: briefs.get(patient.id) ?? null }));
}

async function loadMemoryPortfolio(scope: WorkScope): Promise<PortfolioPatient[]> {
  const ids = new Set(scope.patients.filter(isActive).map(patient => patient.id));
  const patients = getStore().patients.filter(patient => ids.has(patient.id));
  const withWeekly = await withWeeklyRegistration(patients, false);
  return withWeekly.map(patient => {
    const brief = briefForDisplay(patient);
    return { id: patient.id, name: patient.name, weekly: patient.weekly_registration,
      brief: brief?.suggested_action ? { suggested_action: brief.suggested_action, up_next_title: brief.up_next_title } : null };
  });
}

export function registerAssistantRoutes(app: Hono) {
  app.post('/api/crm/assistant', async c => {
    const auth = c.get('auth');
    const persistent = 'userId' in auth && isSupabaseEnabled();
    if (!persistent && c.req.query('audience') === 'patient') throw new CareError(403, 'Solo profesionales del consultorio.');
    let body: unknown;
    try { body = await c.req.json(); } catch { throw new CareError(400, 'Escribí una pregunta de hasta 500 caracteres.'); }
    const parsed = assistantQuestionSchema.safeParse(body);
    if (!parsed.success) throw new CareError(400, 'Escribí una pregunta de hasta 500 caracteres.');
    // Sólo una nutricionista con consultorio: el administrador del servicio no tiene acceso clínico.
    const scope = await resolveWorkScope('userId' in auth ? auth.userId : null, persistent);
    const [snapshot, patients] = await Promise.all([
      loadWorkSnapshot(scope),
      persistent ? loadPersistentPortfolio(scope) : loadMemoryPortfolio(scope),
    ]);
    c.header('Cache-Control', 'no-store');
    const answer = answerPortfolioQuestion({
      question: parsed.data.question, patients, workItems: buildWorkItems(scope, snapshot), source: persistent ? 'supabase' : 'memory',
    });
    return c.json(await withAiSummary(answer));
  });
}
