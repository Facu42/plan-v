import type { MealStatus } from './index';

export const FEED_DAYS = [7, 14, 30] as const;
export type FeedDays = (typeof FEED_DAYS)[number];
export const FEED_STATUSES = ['all', 'pending_review', 'reviewed'] as const;
export type FeedStatus = (typeof FEED_STATUSES)[number];

/** Novedades de la cartera: sólo metadatos (franja, estado, vasos), sin fotos, descripciones ni notas. */
export type CrmFeedItem =
  | { id: string; kind: 'meal'; patient_id: string; patient_name: string; date: string; at: string; slot: string; status: MealStatus; href: string }
  | { id: string; kind: 'water'; patient_id: string; patient_name: string; date: string; at: string; glasses: number; href: string };

export type CrmFeedQuery = { days?: FeedDays; status?: FeedStatus; patient_id?: string };

export type CrmFeedResponse = {
  items: CrmFeedItem[];
  from: string;
  to: string;
  source: 'memory' | 'supabase';
};
