export type MealStatus = 'pending_review' | 'confirmed' | 'adjusted';
export type SuggestedAction = 'mensaje' | 'ajuste_menu' | 'turno';
export type Stage = 'ingreso' | 'plan' | 'seguimiento' | 'alta';

export type FoodItem = {
  name: string;
  portion_est: number | null;
  portion_unit: 'g' | 'ml' | 'u';
  confidence: number;
};

export type Macros = {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type MealLog = {
  id: string;
  patient_id: string;
  slot: string;
  photo_url: string | null;
  description: string | null;
  foods: FoodItem[];
  macros: Macros | null;
  confidence: number;
  note_for_nutri: string;
  status: MealStatus;
  logged_at: string;
};

export type TimelineEvent = {
  id: string;
  kind: 'meal_logged' | 'meal_missed' | 'habit' | 'reminder_fired' | 'appointment' | 'message';
  atLabel: string;
  title: string;
  body: string;
};

export type Brief = {
  suggested_action: SuggestedAction | null;
  up_next_title: string | null;
  up_next_body: string | null;
  draft_message: string | null;
  source_ids: string[];
  adherence_why: string;
};

export type Message = {
  id: string;
  patient_id: string;
  from: 'vero' | 'patient';
  text: string;
  suggested_by_ai: boolean;
  sent_at: string;
};

export type Patient = {
  id: string;
  name: string;
  initials: string;
  tone: 'peach' | 'lilac' | 'mint';
  status: string;
  stage: Stage;
  goal: string;
  sensitive_hours: string;
  plan_b: string;
  next_focus: string;
  adherence_score: number;
  adherence_why: string;
  time: string;
  hydration: number;
  energy: string | null;
  appointment: { when: string; duration: number; channel: string } | null;
  todayPlan: { slot: string; title: string; time: string }[];
  weekPlan: { day: string; meals: { slot: string; title: string }[] }[];
  brief: Brief | null;
  timeline: TimelineEvent[];
  meal_logs: MealLog[];
  messages: Message[];
};
