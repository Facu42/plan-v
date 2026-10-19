import { z } from 'zod';
import type { AccompanimentDays, AccompanimentMealPage } from '../../src/types/accompaniment.js';
import { CareError } from '../care/errors.js';
import { getPatient } from '../store.js';
import { getRequestDb } from '../db/supabase-client.js';
import { mapMealLog } from '../db/supabase-repo.js';
import { mealLogColumns } from '../db/columns.js';
import { listMeasurements } from '../care/repository.js';
import { signMealPhotos } from '../care/meal-photos.js';
import { previewPermissions } from './patient-permissions.js';
import { readAllRows, queueDbError, resolveWorkScope, type WorkScope } from './repository.js';
import { loadFeedRows } from './feed-repository.js';
import { feedFrom } from './feed.js';
import { accompanimentDay, buildAccompanimentMetrics, type AccompanimentInput, type AccompanimentHabit, type AccompanimentPatient } from './accompaniment.js';
export const accompanimentMealQuery = z.object({ days: z.coerce.number().refine(n => n === 7 || n === 30).default(7), status: z.enum(['all', 'pending_review', 'reviewed']).default('all'), patient_id: z.string().trim().min(1).max(100).optional(), offset: z.coerce.number().int().min(0).max(100000).default(0), limit: z.coerce.number().int().min(1).max(50).default(50) }).strict();
const active = (p: WorkScope['patients'][number]) => !p.archived_at && !p.deactivated_at && !p.anonymized_at;
async function currentScope(scope: WorkScope) { return resolveWorkScope(scope.persistent ? scope.actorId : null, scope.persistent); }
async function permissions(scope: WorkScope) {
    const entries: Array<[
        string,
        string[]
    ]> = [];
    const patients = scope.patients.filter(active);
    for (let i = 0; i < patients.length; i += 8)
        entries.push(...await Promise.all(patients.slice(i, i + 8).map(async (p) => [p.id, (await previewPermissions(p.id, scope.persistent)).consented] as [
            string,
            string[]
        ])));
    return Object.fromEntries(entries);
}
/** Lecturas completas por lotes. El directorio de la interfaz nunca se usa como fuente de totales. */
export async function loadAccompanimentMetrics(scope: WorkScope, days: AccompanimentDays, now = new Date()) {
    const today = accompanimentDay(now.toISOString()), from = feedFrom(today, days);
    const feed = await loadFeedRows(scope, from);
    const patients: AccompanimentPatient[] = [], habits: AccompanimentHabit[] = [], measurements: AccompanimentInput['measurements'] = [], activities: NonNullable<AccompanimentInput['activities']> = [];
    if (!scope.persistent) {
        for (const p of scope.patients) {
            const full = getPatient(p.id);
            if (full) {
                patients.push({ ...full });
                if (active(p)) {
                    habits.push(...full.habit_logs);
                    activities.push(...(full.activity_logs ?? []));
                }
            }
        }
    }
    else {
        const db = getRequestDb();
        for (let i = 0; i < scope.patients.length; i += 100) {
            const batch = scope.patients.slice(i, i + 100), ids = batch.map(p => p.id), activeIds = batch.filter(active).map(p => p.id);
            const columns = 'id,goal,adherence_score,goal_status,goal_progress,goal_updated_at';
            const attributes = await readAllRows((start, end) => db.from('patients').select(columns).in('id', ids).order('id').range(start, end));
            let archiveReasons: Record<string, unknown>[] = [];
            const reasonResult = await db.from('patients').select('id,archive_reason').in('id', ids).order('id').range(0, 99);
            // La nueva columna es opcional durante el despliegue; las bajas siguen contando sin inventar su motivo.
            if (!reasonResult.error)
                archiveReasons = reasonResult.data ?? [];
            else if (!['42703', 'PGRST204'].includes(reasonResult.error.code ?? ''))
                queueDbError(reasonResult.error);
            for (const p of batch) {
                const row = attributes.find(a => a.id === p.id);
                if (!row)
                    throw new CareError(503, 'No pudimos consultar toda la cartera. Reintentá.');
                patients.push({ ...p, ...row, archive_reason: archiveReasons.find(r => r.id === p.id)?.archive_reason as string | undefined } as AccompanimentPatient);
            }
            if (activeIds.length) {
                const rows = await readAllRows((start, end) => db.from('habit_logs').select('patient_id,date,hydration,hydration_declared,energy,sleep_minutes,steps,symptoms').in('patient_id', activeIds).gte('date', from).lte('date', today).order('date').order('patient_id').range(start, end));
                habits.push(...rows as AccompanimentHabit[]);
                activities.push(...await readAllRows((start, end) => db.from('activity_logs').select('patient_id,logged_at').in('patient_id', activeIds).gte('logged_at', from + 'T00:00:00-03:00').lte('logged_at', today + 'T23:59:59.999-03:00').order('logged_at').order('id').range(start, end)) as Array<{
                    patient_id: string;
                    logged_at: string;
                }>);
            }
        }
    }
    const before = await permissions(scope);
    const measurable = scope.patients.filter(p => active(p) && before[p.id]?.includes('measurement'));
    for (let i = 0; i < measurable.length; i += 5) {
        const results = await Promise.all(measurable.slice(i, i + 5).map(p => listMeasurements(p.id, scope.persistent)));
        measurements.push(...results.flat());
    }
    const fresh = await currentScope(scope), freshIds = new Set(fresh.patients.map(p => p.id)), consented = await permissions(fresh);
    return { ...buildAccompanimentMetrics({ patients: patients.filter(p => freshIds.has(p.id)).map(p => ({ ...p, ...fresh.patients.find(current => current.id === p.id)! })), meals: feed.meals, habits, measurements, activities, permissions: consented }, days, now), source: scope.persistent ? 'supabase' as const : 'memory' as const };
}
/** Página transversal de comidas: metadata completa para conteos y hasta 50 registros privados por pedido. */
export async function loadAccompanimentMeals(scope: WorkScope, query: z.infer<typeof accompanimentMealQuery>, now = new Date()): Promise<AccompanimentMealPage> {
    const patients = scope.patients.filter(active), names = new Map(patients.map(p => [p.id, p.name]));
    if (query.patient_id && !names.has(query.patient_id))
        throw new CareError(403, 'Esa paciente no está disponible en tu consultorio.');
    const today = accompanimentDay(now.toISOString()), from = feedFrom(today, query.days);
    const source = await loadFeedRows(scope, from);
    const all = source.meals.filter(m => names.has(m.patient_id) && (!query.patient_id || query.patient_id === m.patient_id) && ['pending_review', 'confirmed', 'adjusted'].includes(m.status) && accompanimentDay(m.logged_at) >= from && accompanimentDay(m.logged_at) <= today).sort((a, b) => b.logged_at.localeCompare(a.logged_at) || b.id.localeCompare(a.id));
    const selected = all.filter(m => query.status === 'all' || (query.status === 'reviewed' ? m.status !== 'pending_review' : m.status === 'pending_review'));
    const page = selected.slice(query.offset, query.offset + query.limit), ids = page.map(m => m.id);
    let logs: AccompanimentMealPage['logs'] = [];
    if (ids.length) {
        const rows = scope.persistent ? await readAllRows((start, end) => getRequestDb().from('meal_logs').select(mealLogColumns.professional).in('patient_id', [...new Set(page.map(p => p.patient_id))]).in('id', ids).order('logged_at', { ascending: false }).order('id', { ascending: false }).range(start, end)) : [];
        for (const pid of [...new Set(page.map(p => p.patient_id))]) {
            const expected = new Set(page.filter(p => p.patient_id === pid).map(p => p.id));
            const full = scope.persistent ? rows.filter(r => r.patient_id === pid).map(mapMealLog) : (getPatient(pid)?.meal_logs ?? []).filter(m => expected.has(m.id));
            const canPhotos = (await previewPermissions(pid, scope.persistent)).consented.includes('meal_photo');
            const safe = full.filter(m => m.patient_id === pid && expected.has(m.id)).map(m => ({ ...m, photo_url: canPhotos && (!scope.persistent || m.photo_url?.startsWith(`patients/${pid}/`)) ? m.photo_url : null }));
            const signed = scope.persistent ? await signMealPhotos(pid, safe) : safe;
            const stillAllowed = (await previewPermissions(pid, scope.persistent)).consented.includes('meal_photo');
            logs.push(...signed.map(m => ({ ...m, photo_url: stillAllowed ? m.photo_url : null, patient_name: names.get(pid)! })));
        }
    }
    const fresh = await currentScope(scope), available = new Set(fresh.patients.filter(active).map(p => p.id));
    if (query.patient_id && !available.has(query.patient_id))
        throw new CareError(403, 'Esa paciente ya no está disponible en tu consultorio.');
    const finalPermissions = await permissions({ ...fresh, patients: fresh.patients.filter(p => logs.some(m => m.patient_id === p.id)) });
    logs = logs.filter(m => available.has(m.patient_id)).map(m => ({ ...m, photo_url: finalPermissions[m.patient_id]?.includes('meal_photo') ? m.photo_url : null })).sort((a, b) => b.logged_at.localeCompare(a.logged_at) || b.id.localeCompare(a.id));
    const counts = all.filter(m => available.has(m.patient_id));
    const has_more = selected.length > query.offset + query.limit;
    return { logs, has_more, next_offset: has_more ? query.offset + query.limit : null, counts: { all: counts.length, pending_review: counts.filter(m => m.status === 'pending_review').length, reviewed: counts.filter(m => m.status !== 'pending_review').length }, source: scope.persistent ? 'supabase' : 'memory' };
}
