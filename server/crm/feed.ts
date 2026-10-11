import { z } from 'zod';
import type { MealStatus } from '../../src/types/index.js';
import { FEED_DAYS, FEED_STATUSES, type FeedDays, type CrmFeedItem, type CrmFeedQuery, type CrmFeedResponse } from '../../src/types/crm-feed.js';

export const feedQuerySchema = z.object({
  days: z.coerce.number().int().refine((value): value is FeedDays => (FEED_DAYS as readonly number[]).includes(value)).default(7),
  status: z.enum(FEED_STATUSES).default('all'),
  patient_id: z.string().trim().min(1).max(100).optional(),
}).strict();

export type FeedMeal = { id: string; patient_id: string; slot: string; status: string; logged_at: string };
export type FeedHabit = { patient_id: string; date: string; hydration: number; logged_at: string };

const DAY = 86_400_000;
const ARGENTINA_DAY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
const localDate = (iso: string) => { const date = new Date(iso); return Number.isNaN(date.getTime()) ? '' : ARGENTINA_DAY.format(date); };

export function feedFrom(todayId: string, days: number) {
  return new Date(Date.parse(`${todayId}T12:00:00Z`) - (days - 1) * DAY).toISOString().slice(0, 10);
}

const href = (patientId: string) => `/crm/ficha?${new URLSearchParams({ paciente: patientId, seccion: 'registros' })}`;
const isMealStatus = (value: string): value is MealStatus => value === 'pending_review' || value === 'confirmed' || value === 'adjusted';

/** Comidas y agua del período por fecha de Argentina, de lo nuevo a lo viejo. Sólo pacientes del consultorio. */
export function buildFeed(patients: readonly { id: string; name: string }[], meals: readonly FeedMeal[], habits: readonly FeedHabit[],
  query: Required<Pick<CrmFeedQuery, 'days' | 'status'>> & Pick<CrmFeedQuery, 'patient_id'>, todayId: string): Omit<CrmFeedResponse, 'source'> {
  const from = feedFrom(todayId, query.days);
  const names = new Map(patients.filter((patient) => !query.patient_id || patient.id === query.patient_id).map((patient) => [patient.id, patient.name]));
  const inRange = (date: string) => date >= from && date <= todayId;
  const items: CrmFeedItem[] = [];
  for (const meal of meals) {
    const name = names.get(meal.patient_id);
    const date = localDate(meal.logged_at);
    if (!name || !inRange(date) || !isMealStatus(meal.status)) continue;
    if (query.status === 'pending_review' && meal.status !== 'pending_review') continue;
    if (query.status === 'reviewed' && meal.status === 'pending_review') continue;
    items.push({ id: `meal:${meal.id}`, kind: 'meal', patient_id: meal.patient_id, patient_name: name, date, at: meal.logged_at, slot: meal.slot, status: meal.status, href: href(meal.patient_id) });
  }
  if (query.status === 'all') for (const habit of habits) {
    const name = names.get(habit.patient_id);
    if (!name || !inRange(habit.date) || !(habit.hydration > 0)) continue;
    items.push({ id: `water:${habit.patient_id}:${habit.date}`, kind: 'water', patient_id: habit.patient_id, patient_name: name, date: habit.date, at: habit.logged_at, glasses: habit.hydration, href: href(habit.patient_id) });
  }
  items.sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id));
  return { items, from, to: todayId };
}
