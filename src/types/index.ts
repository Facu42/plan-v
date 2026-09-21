export type MealStatus = 'pending_review' | 'confirmed' | 'adjusted';
export type SuggestedAction = 'mensaje' | 'ajuste_menu' | 'turno';
export type Stage = 'ingreso' | 'plan' | 'seguimiento' | 'alta';
export type BillingStatus = 'waived' | 'pending' | 'active' | 'past_due';
export type GoalStatus = 'active' | 'paused' | 'completed';

export type GoalHistoryEntry = {
  id: string;
  goal: string;
  status: GoalStatus;
  progress: number;
  note: string | null;
  updated_at: string;
};

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

export type MealAnalysisStatus = 'pending' | 'succeeded' | 'failed';

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
  analysis_status?: MealAnalysisStatus;
};

export type TimelineEvent = {
  id: string;
  kind: 'meal_logged' | 'meal_missed' | 'habit' | 'activity' | 'reminder_fired' | 'appointment' | 'message' | 'menu' | 'billing' | 'goal' | 'profile';
  atLabel: string;
  title: string;
  body: string;
  visibility?: 'professional' | 'patient';
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
  delivered_at?: string | null;
  read_at?: string | null;
};

export type HabitLog = {
  id: string;
  patient_id: string;
  date: string;
  hydration: number;
  energy: string | null;
  sleep_minutes: number | null;
};

export type ActivityLog = {
  id: string;
  patient_id: string;
  activity: string;
  duration_minutes: number;
  intensity: 'suave' | 'moderada' | 'intensa';
  note: string | null;
  logged_at: string;
};

export type ResourceAssignment = {
  id: string;
  patient_id: string;
  resource_id: string;
  assigned_at: string;
  read_at: string | null;
};

export type AppointmentHistoryAction = 'scheduled' | 'rescheduled' | 'patient_rescheduled' | 'cancelled' | 'elapsed';
export type AppointmentHistoryActor = 'pro' | 'patient' | 'system';

export type AppointmentHistoryEntry = {
  id: string;
  when: string;
  dateId: string | null;
  duration: number;
  channel: string;
  action: AppointmentHistoryAction;
  actor: AppointmentHistoryActor;
  at: string;
};

export type DemoNotice = {
  id: string;
  at: string;
  channel: 'email';
  to: string;
  subject: string;
  body: string;
  patientId: string;
  kind: 'appointment' | 'reminder';
};

export type Patient = {
  id: string;
  name: string;
  initials: string;
  tone: 'peach' | 'lilac' | 'mint';
  status: string;
  archived_at?: string | null;
  billing_status: BillingStatus;
  billing_until: string | null;
  stage: Stage;
  goal: string;
  goal_status?: GoalStatus;
  goal_progress?: number;
  goal_updated_at?: string | null;
  goal_history?: GoalHistoryEntry[];
  sensitive_hours: string;
  plan_b: string;
  next_focus: string;
  adherence_score: number;
  adherence_why: string;
  time: string;
  hydration: number;
  energy: string | null;
  sleep_minutes: number | null;
  appointment: { when: string; duration: number; channel: string; meet_url?: string; starts_at?: string } | null;
  appointment_history?: AppointmentHistoryEntry[];
  habit_logs: HabitLog[];
  activity_logs?: ActivityLog[];
  resource_assignments?: ResourceAssignment[];
  todayPlan: { slot: string; title: string; time: string }[];
  weekPlan: { day: string; meals: { slot: string; title: string }[] }[];
  brief: Brief | null;
  briefDismissed?: boolean;
  timeline: TimelineEvent[];
  meal_logs: MealLog[];
  messages: Message[];
};
