import { z } from 'zod';

/** Hora de Argentina, sin horario de verano. Los recordatorios se miran contra este reloj. */
export const HABIT_ZONE = 'America/Argentina/Buenos_Aires';

export type HabitKind = 'meals' | 'water' | 'sleep';

export type HabitReminders = {
  mealsOn: boolean;
  mealTimes: string[];
  waterOn: boolean;
  waterEveryHours: number;
  waterFrom: string;
  waterUntil: string;
  sleepOn: boolean;
  sleepTime: string;
};

export const DEFAULT_HABIT_REMINDERS: HabitReminders = {
  mealsOn: false,
  mealTimes: ['08:30', '13:00', '20:30'],
  waterOn: false,
  waterEveryHours: 2,
  waterFrom: '09:00',
  waterUntil: '21:00',
  sleepOn: false,
  sleepTime: '23:00',
};

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
const time = z.string().regex(TIME);

export const habitRemindersSchema = z.object({
  mealsOn: z.boolean(),
  mealTimes: z.array(time).min(1).max(4),
  waterOn: z.boolean(),
  waterEveryHours: z.number().int().min(1).max(4),
  waterFrom: time,
  waterUntil: time,
  sleepOn: z.boolean(),
  sleepTime: time,
}).strict().refine((value) => minutes(value.waterFrom)! < minutes(value.waterUntil)!, {
  message: 'El horario del agua tiene que empezar antes de terminar.',
});

function minutes(value: string): number | null {
  const match = TIME.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Tramo de 10 minutos: 13:04 y 13:00 son el mismo aviso, para no mandarlo cada segundo. */
export function slotMinutes(value: string): number | null {
  const total = minutes(value);
  if (total === null) return null;
  return Math.floor(total / 10) * 10;
}

export function argentinaClock(now: Date): { date: string; minutes: number } {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: HABIT_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now).map((part) => [part.type, part.value]));
  let hour = Number(parts.hour);
  if (hour === 24) hour = 0;
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: hour * 60 + Number(parts.minute) };
}

/** Horas de agua entre el inicio y el fin, inclusive, de a `everyHours`. */
export function waterTimes(from: string, until: string, everyHours: number): string[] {
  const start = minutes(from);
  const end = minutes(until);
  if (start === null || end === null || end <= start || everyHours < 1) return [];
  const times: string[] = [];
  for (let cursor = start; cursor <= end && times.length < 16; cursor += everyHours * 60) {
    const hour = Math.floor(cursor / 60);
    const minute = cursor % 60;
    times.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
  }
  return times;
}

/** Qué avisos tocan en este momento. Apagados no salen, aunque la hora coincida. */
export function dueHabits(prefs: HabitReminders, now: Date): HabitKind[] {
  const nowSlot = Math.floor(argentinaClock(now).minutes / 10) * 10;
  const hits = (times: string[]) => times.some((value) => slotMinutes(value) === nowSlot);
  const due: HabitKind[] = [];
  if (prefs.mealsOn && hits(prefs.mealTimes)) due.push('meals');
  if (prefs.waterOn && hits(waterTimes(prefs.waterFrom, prefs.waterUntil, prefs.waterEveryHours))) due.push('water');
  if (prefs.sleepOn && hits([prefs.sleepTime])) due.push('sleep');
  return due;
}
