import type { MealLog, Message, Patient } from '../../src/types/index.js';
import { hasFullPatientAccess, resolveBillingStatus } from '../../src/billing.js';

export type RequestAuthDecision =
  | { kind: 'public' }
  | { kind: 'demo' }
  | { kind: 'user'; userId: string }
  | { kind: 'unauthorized' }
  | { kind: 'unavailable' };

const PUBLIC_API_PATHS = new Set([
  '/api/health',
  '/api/ready',
  '/api/auth/recover',
  '/api/ops/nutritionists',
  '/api/alcance',
]);

export function resolveRequestAuth(input: {
  supabaseEnabled: boolean;
  path: string;
  verifiedUserId: string | null;
  allowDemo: boolean;
}): RequestAuthDecision {
  if (PUBLIC_API_PATHS.has(input.path) || input.path.startsWith('/api/assets/blob/')) return { kind: 'public' };
  if (!input.supabaseEnabled) return input.allowDemo ? { kind: 'demo' } : { kind: 'unavailable' };
  if (input.verifiedUserId) return { kind: 'user', userId: input.verifiedUserId };
  return { kind: 'unauthorized' };
}

export type Actor =
  | { role: 'nutri'; userId: string; nutritionistId: string }
  | { role: 'paciente'; userId: string; patientId: string };

export type PatientAction =
  | 'read_self'
  | 'read_patient'
  | 'read_clinical'
  | 'analyze_meal'
  | 'review_meal'
  | 'update_habits'
  | 'log_activity'
  | 'delete_activity'
  | 'read_resource'
  | 'manage_favorites'
  | 'send_message'
  | 'edit_patient'
  | 'archive_patient'
  | 'edit_menu'
  | 'edit_appointment'
  | 'reschedule_appointment'
  | 'confirm_appointment'
  | 'edit_goal'
  | 'edit_billing'
  | 'assign_resource'
  | 'assign_routine'
  | 'generate_copilot'
  | 'generate_ai_job'
  | 'read_intake'
  | 'edit_intake'
  | 'submit_intake'
  | 'review_intake'
  | 'grant_consent'
  | 'read_consent'
  | 'read_clinical_note'
  | 'write_clinical_note'
  | 'request_privacy'
  | 'read_privacy'
  | 'delegate_patient'
  | 'revoke_delegation'
  | 'transfer_ownership';

export type PatientManagementAction = 'create_patient';

export function canManagePatients(actor: Actor | null, action: PatientManagementAction): boolean {
  return action === 'create_patient' && actor?.role === 'nutri';
}

export type PatientResource = {
  id: string;
  nutritionistId: string;
  billing_status: Patient['billing_status'];
  billing_until: string | null;
};

const PATIENT_ACTIONS = new Set<PatientAction>([
  'read_self',
  'read_patient',
  'analyze_meal',
  'update_habits',
  'log_activity',
  'delete_activity',
  'read_resource',
  'manage_favorites',
  'send_message',
  'reschedule_appointment',
  'confirm_appointment',
  'read_intake',
  'edit_intake',
  'submit_intake',
  'grant_consent',
  'read_consent',
  'request_privacy',
  'read_privacy',
]);

const NUTRITIONIST_ACTIONS = new Set<PatientAction>([
  'read_patient',
  'read_clinical',
  'review_meal',
  'send_message',
  'edit_patient',
  'archive_patient',
  'edit_menu',
  'edit_appointment',
  'edit_goal',
  'edit_billing',
  'assign_resource',
  'assign_routine',
  'generate_copilot',
  'generate_ai_job',
  'read_intake',
  'review_intake',
  'read_consent',
  'read_clinical_note',
  'write_clinical_note',
  'delegate_patient',
  'revoke_delegation',
  'transfer_ownership',
]);

export function canAccessPatient(actor: Actor, patient: PatientResource, action: PatientAction): boolean {
  if (actor.role === 'paciente') {
    if (actor.patientId !== patient.id || !PATIENT_ACTIONS.has(action)) return false;
    if (
      action === 'read_self'
      || action === 'read_patient'
      || action === 'read_resource'
      || action === 'manage_favorites'
      || action === 'send_message'
      || action === 'read_intake'
      || action === 'edit_intake'
      || action === 'submit_intake'
      || action === 'grant_consent'
      || action === 'read_consent'
      || action === 'request_privacy'
      || action === 'read_privacy'
    ) return true;
    return hasFullPatientAccess(patient);
  }
  return actor.nutritionistId === patient.nutritionistId && NUTRITIONIST_ACTIONS.has(action);
}

export type PatientSelfMealLog = Omit<MealLog, 'note_for_nutri'>;
export type PatientSelfMessage = Pick<Message, 'id' | 'patient_id' | 'from' | 'text' | 'sent_at' | 'delivered_at' | 'read_at' | 'attachment'>;
export type PatientSelfView = Omit<Patient, 'adherence_why' | 'brief' | 'goal_history' | 'meal_logs' | 'messages'> & {
  meal_logs: PatientSelfMealLog[];
  messages: PatientSelfMessage[];
};

function publicFoods(foods: MealLog['foods']): MealLog['foods'] {
  return foods.map(({ name, portion_est, portion_unit, confidence }) => ({
    name,
    portion_est,
    portion_unit,
    confidence,
  }));
}

export function toPatientSelfMealLog(log: MealLog): PatientSelfMealLog {
  return {
    id: log.id,
    patient_id: log.patient_id,
    slot: log.slot,
    photo_url: log.photo_url,
    description: log.description,
    foods: publicFoods(log.foods),
    macros: log.macros
      ? {
          kcal: log.macros.kcal,
          protein_g: log.macros.protein_g,
          carbs_g: log.macros.carbs_g,
          fat_g: log.macros.fat_g,
        }
      : null,
    confidence: log.confidence,
    status: log.status,
    logged_at: log.logged_at,
    ...(log.analysis_status ? { analysis_status: log.analysis_status } : {}),
  };
}

export function toPatientMealAnalysis<T extends { note_for_nutri: string }>(analysis: T): Omit<T, 'note_for_nutri'> {
  const { note_for_nutri: _noteForNutri, ...visibleAnalysis } = analysis;
  return visibleAnalysis;
}

function publicAppointment(appointment: Patient['appointment']): Patient['appointment'] {
  if (!appointment) return null;
  return {
    when: appointment.when,
    duration: appointment.duration,
    channel: appointment.channel,
    ...(appointment.meet_url ? { meet_url: appointment.meet_url } : {}),
    ...(appointment.starts_at ? { starts_at: appointment.starts_at } : {}),
    ...(appointment.timezone ? { timezone: appointment.timezone } : {}),
    ...(appointment.patient_reply ? { patient_reply: appointment.patient_reply } : {}),
    ...(appointment.confirmed_at ? { confirmed_at: appointment.confirmed_at } : {}),
  };
}

function publicHabitLogs(logs: Patient['habit_logs']): Patient['habit_logs'] {
  return logs.map(({ id, patient_id, date, hydration, energy, sleep_minutes }) => ({
    id,
    patient_id,
    date,
    hydration,
    energy,
    sleep_minutes,
  }));
}

function publicActivityLogs(logs: NonNullable<Patient['activity_logs']>): NonNullable<Patient['activity_logs']> {
  return logs.map(({ id, patient_id, activity, duration_minutes, intensity, note, logged_at }) => ({
    id,
    patient_id,
    activity,
    duration_minutes,
    intensity,
    note,
    logged_at,
  }));
}

function publicAssignments(assignments: NonNullable<Patient['resource_assignments']>): NonNullable<Patient['resource_assignments']> {
  return assignments.map(({ id, patient_id, resource_id, assigned_at, read_at }) => ({
    id,
    patient_id,
    resource_id,
    assigned_at,
    read_at,
  }));
}

function publicAppointmentHistory(history: NonNullable<Patient['appointment_history']>): NonNullable<Patient['appointment_history']> {
  return history.map(({ id, when, dateId, duration, channel, action, actor, at }) => ({
    id,
    when,
    dateId,
    duration,
    channel,
    action,
    actor,
    at,
  }));
}

function publicTodayPlan(plan: Patient['todayPlan']): Patient['todayPlan'] {
  return plan.map(({ slot, title, time }) => ({ slot, title, time }));
}

function publicWeekPlan(plan: Patient['weekPlan']): Patient['weekPlan'] {
  return plan.map(({ day, meals }) => ({
    day,
    meals: meals.map(({ slot, title }) => ({ slot, title })),
  }));
}

export function toPatientSelfView(patient: Patient): PatientSelfView {
  const billing_status = resolveBillingStatus(patient);
  const messages = patient.messages
    .filter((message) => Boolean(message.sent_at))
    .map(({ id, patient_id, from, text, sent_at, delivered_at, read_at, attachment }) =>
      ({ id, patient_id, from, text, sent_at, delivered_at, read_at, ...(attachment ? { attachment } : {}) }));

  const visible: PatientSelfView = {
    id: patient.id,
    name: patient.name,
    initials: patient.initials,
    tone: patient.tone,
    billing_status,
    billing_until: patient.billing_until,
    status: patient.status,
    stage: patient.stage,
    goal: patient.goal,
    goal_status: patient.goal_status,
    goal_progress: patient.goal_progress,
    goal_updated_at: patient.goal_updated_at,
    sensitive_hours: '',
    plan_b: '',
    next_focus: '',
    adherence_score: patient.adherence_score,
    time: patient.time,
    hydration: patient.hydration,
    energy: patient.energy,
    sleep_minutes: patient.sleep_minutes,
    appointment: publicAppointment(patient.appointment),
    appointment_history: publicAppointmentHistory(patient.appointment_history ?? []),
    habit_logs: publicHabitLogs(patient.habit_logs),
    activity_logs: publicActivityLogs(patient.activity_logs ?? []),
    resource_assignments: publicAssignments(patient.resource_assignments ?? []),
    todayPlan: publicTodayPlan(patient.todayPlan),
    weekPlan: publicWeekPlan(patient.weekPlan),
    timeline: [],
    meal_logs: patient.meal_logs.map(toPatientSelfMealLog),
    messages,
  };

  if (patient.archived_at !== undefined) visible.archived_at = patient.archived_at;

  if (hasFullPatientAccess({ ...patient, billing_status })) return visible;

  return {
    ...visible,
    status: '',
    stage: 'ingreso',
    goal: '',
    sensitive_hours: '',
    plan_b: '',
    next_focus: '',
    adherence_score: 0,
    time: '',
    hydration: 0,
    energy: null,
    sleep_minutes: null,
    appointment: null,
    appointment_history: [],
    habit_logs: [],
    activity_logs: [],
    resource_assignments: [],
    todayPlan: [],
    weekPlan: [],
    timeline: [],
    meal_logs: [],
  };
}
