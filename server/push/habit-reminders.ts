import { isSupabaseEnabled, privilegedDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { writeOpsLog } from '../ops/log.js';
import {
  DEFAULT_HABIT_REMINDERS,
  dueHabits,
  habitRemindersSchema,
  type HabitKind,
  type HabitReminders,
} from '../../src/habit-reminders.js';
import { pushConfig, pushNotifier } from './push.js';

const memory = new Map<string, HabitReminders>();

export function resetHabitReminderMemory() {
  memory.clear();
}

function copy(prefs: HabitReminders): HabitReminders {
  return { ...prefs, mealTimes: [...prefs.mealTimes] };
}

export function memoryHabitReminders(user: string): HabitReminders {
  return copy(memory.get(user) ?? DEFAULT_HABIT_REMINDERS);
}

export function saveMemoryHabitReminders(user: string, next: HabitReminders): HabitReminders {
  const saved = copy(next);
  memory.set(user, saved);
  return saved;
}

type Row = {
  user_id: string;
  meals_on: boolean;
  meal_times: string[];
  water_on: boolean;
  water_every_hours: number;
  water_from: string;
  water_until: string;
  sleep_on: boolean;
  sleep_time: string;
};

function fromRow(row: Row): HabitReminders {
  return {
    mealsOn: row.meals_on,
    mealTimes: row.meal_times,
    waterOn: row.water_on,
    waterEveryHours: row.water_every_hours,
    waterFrom: row.water_from,
    waterUntil: row.water_until,
    sleepOn: row.sleep_on,
    sleepTime: row.sleep_time,
  };
}

function toRow(user: string, prefs: HabitReminders) {
  return {
    user_id: user,
    meals_on: prefs.mealsOn,
    meal_times: prefs.mealTimes,
    water_on: prefs.waterOn,
    water_every_hours: prefs.waterEveryHours,
    water_from: prefs.waterFrom,
    water_until: prefs.waterUntil,
    sleep_on: prefs.sleepOn,
    sleep_time: prefs.sleepTime,
    updated_at: new Date().toISOString(),
  };
}

function missingTable(error: { code?: string } | null) {
  return Boolean(error && ['42P01', 'PGRST205', 'PGRST204'].includes(error.code ?? ''));
}

export async function loadHabitReminders(user: string, persistent: boolean): Promise<HabitReminders> {
  if (!persistent) return memoryHabitReminders(user);
  const { data, error } = await privilegedDb().from('habit_reminders').select('*').eq('user_id', user).maybeSingle();
  if (missingTable(error)) return copy(DEFAULT_HABIT_REMINDERS);
  if (error) throw new CareError(503, 'No pudimos leer tus recordatorios. Probá de nuevo.');
  if (!data) return copy(DEFAULT_HABIT_REMINDERS);
  const parsed = habitRemindersSchema.safeParse(fromRow(data as Row));
  return parsed.success ? parsed.data : copy(DEFAULT_HABIT_REMINDERS);
}

export async function saveHabitReminders(user: string, next: HabitReminders, persistent: boolean): Promise<HabitReminders> {
  const parsed = habitRemindersSchema.parse(next);
  if (!persistent) return saveMemoryHabitReminders(user, parsed);
  const { error } = await privilegedDb().from('habit_reminders').upsert(toRow(user, parsed), { onConflict: 'user_id' });
  if (missingTable(error)) throw new CareError(501, 'Los recordatorios necesitan una actualización de la base. Avisale a quien administra Nutridash.');
  if (error) throw new CareError(503, 'No pudimos guardar tus recordatorios. Probá de nuevo.');
  return parsed;
}

export type HabitDue = { patientId: string; habits: HabitKind[] };

type HabitTickDeps = {
  list(now: Date): Promise<HabitDue[]>;
  notify(patientId: string, habit: HabitKind): Promise<number>;
};

let lastSlot = -1;
let running = false;

export function resetHabitReminderTick() {
  lastSlot = -1;
  running = false;
}

async function listDuePatients(now: Date): Promise<HabitDue[]> {
  const { data, error } = await privilegedDb().from('habit_reminders').select('*').limit(500);
  if (error) throw error;
  const due = (data ?? []).map((row) => ({ userId: String((row as Row).user_id), habits: dueHabits(fromRow(row as Row), now) })).filter((row) => row.habits.length);
  if (!due.length) return [];
  const { data: patients, error: patientError } = await privilegedDb().from('patients').select('id,user_id,deactivated_at,anonymized_at').in('user_id', due.map((row) => row.userId));
  if (patientError) throw patientError;
  const byUser = new Map(due.map((row) => [row.userId, row.habits]));
  return (patients ?? [])
    .filter((patient) => patient.user_id && !patient.deactivated_at && !patient.anonymized_at)
    .map((patient) => ({ patientId: String(patient.id), habits: byUser.get(String(patient.user_id)) ?? [] }))
    .filter((row) => row.habits.length);
}

function defaultDeps(): HabitTickDeps | null {
  if (!isSupabaseEnabled() || !pushConfig()) return null;
  return {
    list: listDuePatients,
    notify: (patientId, habit) => pushNotifier.notifyPatient(patientId, habit === 'meals' ? 'habit_meal' : habit === 'water' ? 'habit_water' : 'habit_sleep'),
  };
}

/** Una pasada por tramo de 10 minutos. Sin las claves de avisos no manda nada. */
export async function tickHabitReminders(now = new Date(), deps: HabitTickDeps | null = defaultDeps()) {
  if (!deps || running) return null;
  const slot = Math.floor(now.getTime() / (10 * 60 * 1000));
  if (slot === lastSlot) return null;
  lastSlot = slot;
  running = true;
  const result = { patients: 0, delivered: 0 };
  try {
    for (const row of await deps.list(now)) {
      result.patients += 1;
      for (const habit of row.habits) result.delivered += await deps.notify(row.patientId, habit).catch(() => 0);
    }
    if (result.patients) writeOpsLog('info', 'habit_reminders', { patients: String(result.patients), delivered: String(result.delivered) });
    return result;
  } catch {
    writeOpsLog('warn', 'habit_reminders_failed', { step: 'list' });
    return null;
  } finally {
    running = false;
  }
}
