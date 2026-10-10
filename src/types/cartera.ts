/** Seguimiento de la cartera del consultorio: Inicio (indicadores y acciones) y Progreso global. */
export const CARTERA_PERIODS = [7, 30] as const;
export type CarteraPeriodDays = (typeof CARTERA_PERIODS)[number];
export const CARTERA_PERIOD_LABELS: Record<CarteraPeriodDays, string> = { 7: 'Últimos 7 días', 30: 'Últimos 30 días' };
export function isCarteraPeriod(value: number): value is CarteraPeriodDays {
  return (CARTERA_PERIODS as readonly number[]).includes(value);
}

export const CARTERA_INDICATORS = ['new_patients', 'first_consultations', 'follow_up_consultations', 'messages_sent', 'income'] as const;
export type CarteraIndicatorId = (typeof CARTERA_INDICATORS)[number];
export const CARTERA_INDICATOR_LABELS: Record<CarteraIndicatorId, string> = {
  new_patients: 'Pacientes nuevos',
  first_consultations: 'Primeras consultas',
  follow_up_consultations: 'Consultas de seguimiento',
  messages_sent: 'Mensajes enviados',
  income: 'Ingresos confirmados',
};

export type CarteraIndicator = {
  id: CarteraIndicatorId;
  value: number;
  previous: number;
  /** Un valor por día del período, en orden cronológico. */
  series: number[];
};

export const ACTION_SIGNALS = ['no_records', 'many_replacements'] as const;
export type ActionSignal = (typeof ACTION_SIGNALS)[number];
export type CarteraAction = {
  id: string;
  signal: ActionSignal;
  patient_id: string;
  patient_name: string;
  /** Un hecho comprobable, nunca un juicio clínico. */
  title: string;
  detail: string;
  action_label: string;
  href: string;
  fingerprint: string;
};

export type CarteraOverview = {
  period: { days: CarteraPeriodDays; start: string; end: string; previous_start: string; previous_end: string; timezone: string };
  active_patients: number;
  indicators: CarteraIndicator[];
  /** Pacientes distintos con un pago confirmado en el período. */
  paying_patients: number;
  consultations_trend: Array<{ start: string; first: number; follow_up: number }>;
  registration_trend: Array<{ start: string; patients: number }>;
  actions: { items: CarteraAction[]; total: number };
  source: 'memory' | 'supabase';
};

export const PROGRESS_FEED_FILTERS = ['all', 'measurement', 'activity', 'meal', 'habit'] as const;
export type ProgressFeedFilter = (typeof PROGRESS_FEED_FILTERS)[number];
export const PROGRESS_FEED_LABELS: Record<ProgressFeedFilter, string> = {
  all: 'Todas', measurement: 'Mediciones', activity: 'Actividad', meal: 'Comidas', habit: 'Hábitos',
};

export type ProgressFeedItem = {
  id: string;
  kind: Exclude<ProgressFeedFilter, 'all'>;
  patient_id: string;
  patient_name: string;
  at: string;
  text: string;
  href: string;
};

export type CarteraProgress = {
  period: CarteraOverview['period'];
  counts: Record<ProgressFeedFilter, number>;
  activity: { sessions: number; minutes: number; kcal_declared: number; sessions_with_kcal: number };
  items: ProgressFeedItem[];
  next_cursor: string | null;
  total: number;
  source: 'memory' | 'supabase';
};
