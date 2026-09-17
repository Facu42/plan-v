import type { MealLog, Message, Patient } from '../../src/types/index.js';
import { hasFullPatientAccess, resolveBillingStatus } from '../../src/billing.js';

export type RequestAuthDecision =
  | { kind: 'public' }
  | { kind: 'demo' }
  | { kind: 'user'; userId: string }
  | { kind: 'unauthorized' };

export function resolveRequestAuth(input: {
  supabaseEnabled: boolean;
  path: string;
  verifiedUserId: string | null;
}): RequestAuthDecision {
  if (input.path === '/api/health') return { kind: 'public' };
  if (!input.supabaseEnabled) return { kind: 'demo' };
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
  | 'send_message'
  | 'edit_patient'
  | 'archive_patient'
  | 'edit_menu'
  | 'edit_appointment'
  | 'reschedule_appointment'
  | 'edit_goal'
  | 'edit_billing'
  | 'assign_resource'
  | 'generate_copilot';

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
  'send_message',
  'reschedule_appointment',
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
  'generate_copilot',
]);

export function canAccessPatient(actor: Actor, patient: PatientResource, action: PatientAction): boolean {
  if (actor.role === 'paciente') {
    if (actor.patientId !== patient.id || !PATIENT_ACTIONS.has(action)) return false;
    if (action === 'read_self' || action === 'read_patient' || action === 'read_resource' || action === 'send_message') return true;
    return hasFullPatientAccess(patient);
  }
  return actor.nutritionistId === patient.nutritionistId && NUTRITIONIST_ACTIONS.has(action);
}

export type PatientSelfMealLog = Omit<MealLog, 'note_for_nutri'>;
export type PatientSelfMessage = Omit<Message, 'suggested_by_ai'>;
export type PatientSelfView = Omit<Patient, 'adherence_why' | 'brief' | 'goal_history' | 'meal_logs' | 'messages'> & {
  meal_logs: PatientSelfMealLog[];
  messages: PatientSelfMessage[];
};

export function toPatientSelfMealLog(log: MealLog): PatientSelfMealLog {
  const { note_for_nutri: _noteForNutri, ...visibleLog } = log;
  return visibleLog;
}

export function toPatientMealAnalysis<T extends { note_for_nutri: string }>(analysis: T): Omit<T, 'note_for_nutri'> {
  const { note_for_nutri: _noteForNutri, ...visibleAnalysis } = analysis;
  return visibleAnalysis;
}

export function toPatientSelfView(patient: Patient): PatientSelfView {
  const {
    adherence_why: _adherenceWhy,
    brief: _brief,
    goal_history: _goalHistory,
    meal_logs: mealLogs,
    messages,
    ...visiblePatient
  } = patient;

  const visibleMessages = messages
    .filter((message) => Boolean(message.sent_at))
    .map(({ suggested_by_ai: _suggestedByAi, ...visibleMessage }) => visibleMessage);
  const billing_status = resolveBillingStatus(patient);
  const visible = {
    ...visiblePatient,
    billing_status,
    meal_logs: mealLogs.map(toPatientSelfMealLog),
    messages: visibleMessages,
  };

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
    todayPlan: [],
    weekPlan: [],
    timeline: [],
    meal_logs: [],
  };
}
