import { Buffer } from 'node:buffer';
import { z } from 'zod';
import {
  PROGRESS_FEED_FILTERS,
  type ActionSignal,
  type CarteraAction,
  type CarteraIndicator,
  type CarteraOverview,
  type CarteraPeriodDays,
  type CarteraProgress,
  type ProgressFeedFilter,
  type ProgressFeedItem,
} from '../../src/types/cartera.js';
import { PROGRESS_TIMEZONE } from '../../src/types/progress.js';
import { CareError } from '../care/errors.js';
import { argentinaToday, shiftIsoDate } from '../progress/derive.js';

/** Días sin registros a partir de los cuales se avisa; es un hecho, no un juicio clínico. */
export const NO_RECORDS_DAYS = 7;
/** La lectura mira este tramo hacia atrás; más antiguo se dice como «en los últimos 60 días». */
export const LOOKBACK_DAYS = 60;
export const REPLACEMENT_WINDOW_DAYS = 30;
export const REPLACEMENT_THRESHOLD = 3;
export const MAX_ACTIONS = 20;

export type CarteraPatient = { id: string; name: string; created_at: string | null; has_account: boolean };
export type CarteraSnapshot = {
  patients: CarteraPatient[];
  /** Turnos de toda la historia (para saber cuál fue la primera consulta). */
  appointments: Array<{ patient_id: string; status: string; starts_at: string; duration_min?: number }>;
  /** Sólo mensajes escritos por la profesional (o su equipo), nunca los de la paciente. */
  messages: Array<{ id: string; patient_id: string; sent_at: string }>;
  payments: Array<{ id: string; patient_id: string; amount: number; paid_on: string; status: string }>;
  meals: Array<{ id: string; patient_id: string; logged_at: string; slot: string; status: string }>;
  habits: Array<{ patient_id: string; date: string; hydration: number; hydration_declared?: boolean; energy: string | null; sleep_minutes: number | null; steps?: number | null }>;
  activities: Array<{ id: string; patient_id: string; at: string; name: string; minutes: number; kcal: number | null }>;
  measurements: Array<{ id: string; patient_id: string; kind: 'weight' | 'waist' | 'hip'; value: number; unit: string; at: string }>;
  replacements: Array<{ id: string; patient_id: string; recorded_on: string }>;
  dismissals: Array<{ patient_id: string; signal: ActionSignal; fingerprint: string }>;
};

export function emptySnapshot(): CarteraSnapshot {
  return { patients: [], appointments: [], messages: [], payments: [], meals: [], habits: [], activities: [], measurements: [], replacements: [], dismissals: [] };
}

function lastOf<T>(items: readonly T[]): T | undefined {
  return items[items.length - 1];
}

function localDate(value: string): string | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : argentinaToday(date);
}

function isoDays(start: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => shiftIsoDate(start, index));
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000);
}

export function periodFor(days: CarteraPeriodDays, now = new Date()): CarteraOverview['period'] {
  const end = argentinaToday(now);
  const start = shiftIsoDate(end, -(days - 1));
  return { days, start, end, previous_start: shiftIsoDate(start, -days), previous_end: shiftIsoDate(start, -1), timezone: PROGRESS_TIMEZONE };
}

function habitDeclared(habit: CarteraSnapshot['habits'][number]) {
  return habit.hydration_declared === true || habit.hydration > 0 || habit.energy != null || habit.sleep_minutes != null || habit.steps != null;
}

/** Fecha argentina de cada registro de la paciente, de cualquier origen. */
function recordDates(snapshot: CarteraSnapshot): Map<string, Set<string>> {
  const byPatient = new Map<string, Set<string>>();
  const add = (patientId: string, date: string | null) => {
    if (!date) return;
    if (!byPatient.has(patientId)) byPatient.set(patientId, new Set());
    byPatient.get(patientId)!.add(date);
  };
  for (const meal of snapshot.meals) add(meal.patient_id, localDate(meal.logged_at));
  for (const habit of snapshot.habits) if (habitDeclared(habit)) add(habit.patient_id, habit.date);
  for (const activity of snapshot.activities) add(activity.patient_id, localDate(activity.at));
  for (const measurement of snapshot.measurements) add(measurement.patient_id, localDate(measurement.at));
  return byPatient;
}

function bucketSize(days: CarteraPeriodDays) {
  return days <= 7 ? 1 : 7;
}

export function deriveOverview(snapshot: CarteraSnapshot, days: CarteraPeriodDays, now = new Date()): CarteraOverview {
  const period = periodFor(days, now);
  const dates = isoDays(period.start, days);
  const index = new Map(dates.map((date, position) => [date, position]));
  const inCurrent = (date: string | null) => date !== null && date >= period.start && date <= period.end;
  const inPrevious = (date: string | null) => date !== null && date >= period.previous_start && date <= period.previous_end;
  const emptySeries = () => Array.from({ length: days }, () => 0);
  const indicator = (id: CarteraIndicator['id']): CarteraIndicator => ({ id, value: 0, previous: 0, series: emptySeries() });
  const indicators = {
    new_patients: indicator('new_patients'), first_consultations: indicator('first_consultations'),
    follow_up_consultations: indicator('follow_up_consultations'), messages_sent: indicator('messages_sent'), income: indicator('income'),
  };
  const bump = (target: CarteraIndicator, date: string | null, amount = 1) => {
    if (inCurrent(date)) { target.value += amount; target.series[index.get(date!)!] += amount; }
    else if (inPrevious(date)) target.previous += amount;
  };

  for (const patient of snapshot.patients) bump(indicators.new_patients, patient.created_at ? localDate(patient.created_at) : null);

  // Mismo criterio que la lista de pacientes: turno no cancelado cuyo horario ya terminó.
  const nowMs = now.getTime();
  const held = snapshot.appointments
    .filter((appointment) => appointment.status !== 'cancelled' && Date.parse(appointment.starts_at) + (appointment.duration_min ?? 0) * 60_000 <= nowMs)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const seen = new Set<string>();
  const consultations: Array<{ date: string; first: boolean }> = [];
  for (const appointment of held) {
    const first = !seen.has(appointment.patient_id);
    seen.add(appointment.patient_id);
    const date = localDate(appointment.starts_at);
    if (!date) continue;
    consultations.push({ date, first });
    bump(first ? indicators.first_consultations : indicators.follow_up_consultations, date);
  }

  for (const message of snapshot.messages) bump(indicators.messages_sent, localDate(message.sent_at));

  const payers = new Set<string>();
  for (const payment of snapshot.payments) {
    if (payment.status !== 'confirmed') continue;
    bump(indicators.income, payment.paid_on, payment.amount);
    if (inCurrent(payment.paid_on)) payers.add(payment.patient_id);
  }

  const size = bucketSize(days);
  const starts = Array.from({ length: Math.ceil(days / size) }, (_, bucket) => dates[bucket * size]);
  const bucketOf = (date: string) => Math.floor((index.get(date) ?? 0) / size);
  const consultations_trend = starts.map((start) => ({ start, first: 0, follow_up: 0 }));
  for (const entry of consultations) {
    if (!inCurrent(entry.date)) continue;
    consultations_trend[bucketOf(entry.date)][entry.first ? 'first' : 'follow_up'] += 1;
  }
  const registered = recordDates(snapshot);
  const registration_trend = starts.map((start, bucket) => {
    const patients = new Set<string>();
    for (const [patientId, set] of registered) {
      for (const date of set) if (inCurrent(date) && Math.floor(index.get(date)! / size) === bucket) patients.add(patientId);
    }
    return { start, patients: patients.size };
  });

  const actions = deriveActions(snapshot, now);
  return {
    period,
    active_patients: snapshot.patients.length,
    indicators: Object.values(indicators),
    paying_patients: payers.size,
    consultations_trend,
    registration_trend,
    actions: { items: actions.slice(0, MAX_ACTIONS), total: actions.length },
    source: 'memory',
  };
}

export function ficha(patientId: string, section = 'registros') {
  return `/crm/ficha?${new URLSearchParams({ paciente: patientId, seccion: section })}`;
}

/**
 * Acciones sugeridas. Cada motivo es un hecho comprobable (cuántos días sin registros,
 * cuántos pedidos); nunca se infiere riesgo clínico a partir de la ausencia de registros.
 */
export function deriveActions(snapshot: CarteraSnapshot, now = new Date()): CarteraAction[] {
  const today = argentinaToday(now);
  const registered = recordDates(snapshot);
  const dismissed = new Set(snapshot.dismissals.map((entry) => `${entry.patient_id}:${entry.signal}:${entry.fingerprint}`));
  const result: Array<CarteraAction & { weight: number }> = [];
  const lookbackStart = shiftIsoDate(today, -(LOOKBACK_DAYS - 1));

  for (const patient of snapshot.patients) {
    if (!patient.has_account) continue;
    const last = lastOf([...(registered.get(patient.id) ?? [])].filter((date) => date <= today).sort()) ?? null;
    const created = patient.created_at ? localDate(patient.created_at) : null;
    let silentDays: number | null = null;
    let title = '';
    let detail = '';
    if (last) {
      silentDays = daysBetween(last, today);
      title = `Sin registros hace ${silentDays} días`;
      detail = `Último registro: ${last.split('-').reverse().join('/')}.`;
    } else if (created && created > lookbackStart) {
      silentDays = daysBetween(created, today);
      title = 'Todavía sin registros';
      detail = `Se sumó hace ${silentDays} días y aún no cargó comidas, hábitos, actividad ni medidas.`;
    } else {
      silentDays = LOOKBACK_DAYS;
      title = `Sin registros en los últimos ${LOOKBACK_DAYS} días`;
      detail = 'No hay comidas, hábitos, actividad ni medidas cargados en ese tramo.';
    }
    if (silentDays < NO_RECORDS_DAYS) continue;
    const fingerprint = last ?? 'none';
    if (dismissed.has(`${patient.id}:no_records:${fingerprint}`)) continue;
    result.push({
      id: `no_records:${patient.id}`, signal: 'no_records', patient_id: patient.id, patient_name: patient.name,
      title, detail, action_label: 'Escribirle un mensaje', href: `/crm/mensajes?${new URLSearchParams({ paciente: patient.id })}`,
      fingerprint, weight: silentDays,
    });
  }

  const windowStart = shiftIsoDate(today, -(REPLACEMENT_WINDOW_DAYS - 1));
  const names = new Map(snapshot.patients.map((patient) => [patient.id, patient.name]));
  const requests = new Map<string, string[]>();
  for (const entry of snapshot.replacements) {
    if (entry.recorded_on < windowStart || entry.recorded_on > today || !names.has(entry.patient_id)) continue;
    requests.set(entry.patient_id, [...(requests.get(entry.patient_id) ?? []), entry.recorded_on]);
  }
  for (const [patientId, dates] of requests) {
    if (dates.length < REPLACEMENT_THRESHOLD) continue;
    const fingerprint = `${lastOf([...dates].sort())}:${dates.length}`;
    if (dismissed.has(`${patientId}:many_replacements:${fingerprint}`)) continue;
    result.push({
      id: `many_replacements:${patientId}`, signal: 'many_replacements', patient_id: patientId, patient_name: names.get(patientId)!,
      title: `${dates.length} pedidos de reemplazo en ${REPLACEMENT_WINDOW_DAYS} días`,
      detail: 'La paciente pidió cambiar comidas del plan. Podés revisar el plan con ella.',
      action_label: 'Revisar el plan', href: `/crm/plan?${new URLSearchParams({ paciente: patientId })}`,
      fingerprint, weight: dates.length,
    });
  }
  return result
    .sort((a, b) => b.weight - a.weight || a.patient_name.localeCompare(b.patient_name, 'es') || a.id.localeCompare(b.id))
    .map(({ weight: _weight, ...action }) => action);
}

export const progressQuerySchema = z.object({
  days: z.coerce.number().int().default(30),
  filter: z.enum(PROGRESS_FEED_FILTERS).default('all'),
  patient_id: z.string().trim().min(1).max(100).optional(),
  cursor: z.string().min(1).max(2000).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
}).strict();

const cursorSchema = z.object({
  v: z.literal(1), days: z.number(), filter: z.enum(PROGRESS_FEED_FILTERS), patient_id: z.string().nullable(), at: z.string(), id: z.string(),
}).strict();

const feedOrder = (a: Pick<ProgressFeedItem, 'at' | 'id'>, b: Pick<ProgressFeedItem, 'at' | 'id'>) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id);
const MEASUREMENT_LABELS = { weight: 'el peso', waist: 'la cintura', hip: 'la cadera' } as const;
const qty = (value: number) => String(value).replace('.', ',');

export function deriveProgress(
  snapshot: CarteraSnapshot,
  query: { days: CarteraPeriodDays; filter?: ProgressFeedFilter; patientId?: string; cursor?: string; limit?: number },
  now = new Date(),
): CarteraProgress {
  const period = periodFor(query.days, now);
  const filter = query.filter ?? 'all';
  const names = new Map(snapshot.patients.map((patient) => [patient.id, patient.name]));
  const include = (patientId: string) => names.has(patientId) && (!query.patientId || patientId === query.patientId);
  const within = (date: string | null) => date !== null && date >= period.start && date <= period.end;
  const iso = (value: string) => new Date(value).toISOString();
  const items: ProgressFeedItem[] = [];
  const push = (kind: ProgressFeedItem['kind'], id: string, patientId: string, at: string, text: string) => {
    items.push({ id, kind, patient_id: patientId, patient_name: names.get(patientId)!, at: iso(at), text, href: ficha(patientId) });
  };
  for (const meal of snapshot.meals) {
    if (include(meal.patient_id) && within(localDate(meal.logged_at))) push('meal', `meal:${meal.id}`, meal.patient_id, meal.logged_at, `Registró una comida: ${meal.slot}`);
  }
  let sessions = 0; let minutes = 0; let kcal = 0; let withKcal = 0;
  for (const activity of snapshot.activities) {
    if (!include(activity.patient_id) || !within(localDate(activity.at))) continue;
    sessions += 1; minutes += activity.minutes;
    if (activity.kcal !== null) { kcal += activity.kcal; withKcal += 1; }
    push('activity', `activity:${activity.id}`, activity.patient_id, activity.at,
      `Registró actividad: ${activity.name} · ${activity.minutes} min${activity.kcal === null ? '' : ` · ${activity.kcal} kcal declaradas`}`);
  }
  for (const measurement of snapshot.measurements) {
    if (include(measurement.patient_id) && within(localDate(measurement.at))) {
      push('measurement', `measurement:${measurement.id}`, measurement.patient_id, measurement.at,
        `Registró ${MEASUREMENT_LABELS[measurement.kind]}: ${qty(measurement.value)} ${measurement.unit}`);
    }
  }
  for (const habit of snapshot.habits) {
    if (!include(habit.patient_id) || !within(habit.date) || !habitDeclared(habit)) continue;
    const parts = [
      habit.hydration_declared === true || habit.hydration > 0 ? `${habit.hydration} ${habit.hydration === 1 ? 'vaso' : 'vasos'} de agua` : null,
      habit.energy ? `energía ${habit.energy}` : null,
      habit.sleep_minutes != null ? `descanso ${Math.floor(habit.sleep_minutes / 60)} h${habit.sleep_minutes % 60 ? ` ${habit.sleep_minutes % 60} min` : ''}` : null,
      habit.steps != null ? `${habit.steps.toLocaleString('es-AR')} pasos` : null,
    ].filter(Boolean);
    push('habit', `habit:${habit.patient_id}:${habit.date}`, habit.patient_id, `${habit.date}T12:00:00-03:00`, `Registró hábitos: ${parts.join(' · ')}`);
  }

  const counts = Object.fromEntries(PROGRESS_FEED_FILTERS.map((id) => [id, 0])) as Record<ProgressFeedFilter, number>;
  for (const item of items) { counts.all += 1; counts[item.kind] += 1; }
  const filtered = items.filter((item) => filter === 'all' || item.kind === filter).sort(feedOrder);

  let after: { at: string; id: string } | null = null;
  if (query.cursor) {
    try {
      const parsed = cursorSchema.parse(JSON.parse(Buffer.from(query.cursor, 'base64url').toString('utf8')));
      if (parsed.days !== query.days || parsed.filter !== filter || parsed.patient_id !== (query.patientId ?? null)) throw new Error('different_filter');
      after = parsed;
    } catch {
      throw new CareError(400, 'La página no corresponde a estos filtros. Volvé a cargar el progreso.');
    }
  }
  const available = after ? filtered.filter((item) => feedOrder(item, after!) > 0) : filtered;
  const limit = query.limit ?? 30;
  const page = available.slice(0, limit);
  const last = lastOf(page);
  return {
    period, counts, activity: { sessions, minutes, kcal_declared: kcal, sessions_with_kcal: withKcal },
    items: page,
    next_cursor: last && available.length > limit
      ? Buffer.from(JSON.stringify({ v: 1, days: query.days, filter, patient_id: query.patientId ?? null, at: last.at, id: last.id })).toString('base64url')
      : null,
    total: filtered.length,
    source: 'memory',
  };
}
