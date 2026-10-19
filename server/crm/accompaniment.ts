import type { AccompanimentDays, AccompanimentMetrics } from '../../src/types/accompaniment.js';
import type { FeedMeal } from './feed.js';
import { feedFrom } from './feed.js';
export type AccompanimentPatient = {
    id: string;
    name: string;
    created_at?: string | null;
    archived_at?: string | null;
    deactivated_at?: string | null;
    anonymized_at?: string | null;
    archive_reason?: string | null;
    adherence_score?: number | null;
    goal?: string;
    goal_status?: string;
    goal_progress?: number | null;
    goal_updated_at?: string | null;
};
export type AccompanimentHabit = {
    patient_id: string;
    date: string;
    hydration: number;
    hydration_declared?: boolean;
    energy?: string | null;
    sleep_minutes?: number | null;
    steps?: number | null;
    symptoms?: string[];
};
export type AccompanimentMeasurement = {
    id: string;
    patient_id: string;
    kind: string;
    value_numeric: number | null;
    unit: string | null;
    captured_on: string;
};
export type AccompanimentInput = {
    patients: AccompanimentPatient[];
    meals: FeedMeal[];
    habits: AccompanimentHabit[];
    measurements: AccompanimentMeasurement[];
    activities?: Array<{
        patient_id: string;
        logged_at: string;
    }>;
    permissions: Record<string, string[]>;
};
const zone = 'America/Argentina/Buenos_Aires';
export const accompanimentDay = (iso: string) => { const date = new Date(iso); return Number.isFinite(+date) ? new Intl.DateTimeFormat('en-CA', { timeZone: zone }).format(date) : ''; };
const validDay = (day: string) => /^\d{4}-\d{2}-\d{2}$/.test(day) && Number.isFinite(Date.parse(`${day}T12:00:00Z`)) && new Date(`${day}T12:00:00Z`).toISOString().slice(0, 10) === day;
const shift = (day: string, count: number) => new Date(Date.parse(`${day}T12:00:00Z`) + count * 86400000).toISOString().slice(0, 10);
const finitePercent = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
/** Fuente completa y autorizada; los permisos de salud se vuelven a aplicar al derivar cada bloque. */
export function buildAccompanimentMetrics(input: AccompanimentInput, days: AccompanimentDays, now = new Date()): AccompanimentMetrics {
    const to = accompanimentDay(now.toISOString()), from = feedFrom(to, days), week_from = feedFrom(to, 7);
    const sixMonthsAgo = new Date(to + 'T12:00:00Z');
    const monthDay = sixMonthsAgo.getUTCDate();
    sixMonthsAgo.setUTCDate(1);
    sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 6);
    sixMonthsAgo.setUTCDate(Math.min(monthDay, new Date(Date.UTC(sixMonthsAgo.getUTCFullYear(), sixMonthsAgo.getUTCMonth() + 1, 0)).getUTCDate()));
    const retainedFrom = sixMonthsAgo.toISOString().slice(0, 10);
    const active = input.patients.filter(p => !p.archived_at && !p.deactivated_at && !p.anonymized_at), own = new Map(active.map(p => [p.id, p]));
    const can = (id: string, purpose: string) => Boolean(input.permissions[id]?.includes(purpose));
    const inRange = (day: string, start = from) => validDay(day) && day >= start && day <= to;
    const meals = input.meals.filter(m => own.has(m.patient_id) && inRange(accompanimentDay(m.logged_at)));
    const habits = input.habits.filter(h => own.has(h.patient_id) && can(h.patient_id, 'care_relationship') && inRange(h.date));
    const activities = (input.activities ?? []).filter(a => own.has(a.patient_id) && inRange(accompanimentDay(a.logged_at)));
    const datesByPatient = new Map<string, Set<string>>();
    const recordDay = (id: string, date: string) => { if (!datesByPatient.has(id))
        datesByPatient.set(id, new Set()); datesByPatient.get(id)!.add(date); };
    for (const m of meals)
        recordDay(m.patient_id, accompanimentDay(m.logged_at));
    for (const h of input.habits.filter(h => own.has(h.patient_id) && inRange(h.date) && (h.hydration_declared || h.hydration > 0 || h.energy || h.sleep_minutes != null || h.steps != null || h.symptoms?.length)))
        recordDay(h.patient_id, h.date);
    for (const a of activities)
        recordDay(a.patient_id, accompanimentDay(a.logged_at));
    const week = active.map(p => { const dates = datesByPatient.get(p.id) ?? new Set<string>(); const mask = Array.from({ length: 7 }, (_, i) => dates.has(shift(week_from, i))); return { id: p.id, name: p.name, days: mask, recorded_days: mask.filter(Boolean).length }; });
    const wellbeing = habits.filter(h => h.date >= week_from && (h.energy || h.sleep_minutes != null || h.steps != null || h.symptoms?.length)).sort((a, b) => b.date.localeCompare(a.date) || a.patient_id.localeCompare(b.patient_id)).map(h => ({ id: h.patient_id, name: own.get(h.patient_id)!.name, date: h.date, energy: h.energy ?? null, sleep_minutes: h.sleep_minutes ?? null, steps: h.steps ?? null, symptoms: h.symptoms ?? [] }));
    const goals = active.filter(p => can(p.id, 'care_relationship') && (p.goal?.trim() || p.goal_status || p.goal_progress != null)).map(p => ({ id: p.id, name: p.name, goal: p.goal?.trim() || 'Objetivo registrado', status: p.goal_status ?? 'active', progress: finitePercent(p.goal_progress) ? p.goal_progress : null }));
    let weight_decreased = 0, weight_comparable = 0;
    const unchanged: AccompanimentMetrics['unchanged'] = [];
    for (const p of active) {
        if (!can(p.id, 'measurement'))
            continue;
        const measurements = input.measurements.filter(m => m.patient_id === p.id && m.kind === 'weight' && m.unit === 'kg' && typeof m.value_numeric === 'number' && Number.isFinite(m.value_numeric) && inRange(m.captured_on)).sort((a, b) => a.captured_on.localeCompare(b.captured_on) || a.id.localeCompare(b.id));
        const first = measurements[0], last = measurements[measurements.length - 1];
        if (first && last && first.captured_on !== last.captured_on) {
            weight_comparable++;
            if (Date.parse(last.captured_on)-Date.parse(first.captured_on)>=28*86400000 && measurements.every(m=>m.value_numeric===first.value_numeric)) unchanged.push({id:p.id,name:p.name,kind:'weight',value:first.value_numeric!,unit:'kg',from:first.captured_on,to:last.captured_on});
            if (last.value_numeric! < first.value_numeric!)
                weight_decreased++;
        }
    }
    const adherence = active.filter(p=>can(p.id,'care_relationship')).map(p => p.adherence_score).filter(finitePercent), water = habits.filter(h => h.date >= week_from && (h.hydration_declared || h.hydration > 0) && Number.isFinite(h.hydration) && h.hydration >= 0);
    const months = new Map<string, {
        month: string;
        joined: number;
        left: number;
    }>();
    for (let day = from; day <= to; day = shift(day, 1)) {
        const month = day.slice(0, 7);
        if (!months.has(month))
            months.set(month, { month, joined: 0, left: 0 });
    }
    const reasons = new Map<string, number>();
    for (const p of input.patients) {
        if (p.anonymized_at)
            continue;
        const created = p.created_at ? accompanimentDay(p.created_at) : '', archived = p.archived_at ? accompanimentDay(p.archived_at) : '';
        if (inRange(created))
            months.get(created.slice(0, 7))!.joined++;
        if (inRange(archived)) {
            months.get(archived.slice(0, 7))!.left++;
            const reason = p.archive_reason?.trim() || 'Sin motivo registrado';
            reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
        }
    }
    const trend: AccompanimentMetrics['trend'] = [];
    for (let start = from; start <= to; start = shift(start, 7)) {
        const end = shift(start, 6) < to ? shift(start, 6) : to, eligible = active.filter(p => !p.created_at || accompanimentDay(p.created_at) <= end), ids = new Set(eligible.map(p => p.id)), registered = new Set(meals.filter(m => { const date = accompanimentDay(m.logged_at); return ids.has(m.patient_id) && date >= start && date <= end; }).map(m => m.patient_id)).size;
        trend.push({ from: start, to: end, registered, patients: ids.size, percentage: ids.size ? Math.round(registered / ids.size * 100) : null });
    }
    const quiet = active.filter(p => !p.created_at || accompanimentDay(p.created_at) < week_from).map(p => { const dates = [...(datesByPatient.get(p.id) ?? [])].sort(); return { id: p.id, name: p.name, last_day: dates[dates.length - 1] ?? null }; }).filter(p => !p.last_day || p.last_day < week_from);
    const activityPatients = active.filter(p => can(p.id, 'care_relationship'));
    const activityDays = new Set(activities.filter(a => can(a.patient_id, 'care_relationship') && accompanimentDay(a.logged_at) >= week_from).map(a => a.patient_id + ':' + accompanimentDay(a.logged_at))).size;
    return { from, to, week_from, totals: { active: active.length, meals: meals.length, pending: meals.filter(m => m.status === 'pending_review').length, adherence: adherence.length ? Math.round(adherence.reduce((a, b) => a + b, 0) / adherence.length) : null, completed_goals: active.filter(p => can(p.id, 'care_relationship') && p.goal_status === 'completed' && p.goal_updated_at && inRange(accompanimentDay(p.goal_updated_at))).length, retained: active.filter(p => p.created_at && accompanimentDay(p.created_at) <= retainedFrom).length, weight_decreased, weight_comparable, activity_days: activityPatients.length ? Math.round(activityDays / activityPatients.length * 10) / 10 : null, water_glasses: water.length ? Math.round(water.reduce((n, h) => n + h.hydration, 0) / water.length * 10) / 10 : null }, week, wellbeing, goals, trend, unchanged, movements: [...months.values()], archive_reasons: [...reasons].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason)), quiet };
}
