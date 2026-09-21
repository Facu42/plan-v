import { randomUUID } from 'node:crypto';
import { calculateAdherence } from './adherence.js';
import { CareError } from './care/errors.js';
import {
  DEFAULT_APPOINTMENT_TIMEZONE,
  historyEntry,
  resolveAppointmentState,
  stampStartsAt,
  type AppointmentHistoryActor,
  type AppointmentHistoryEntry,
} from './appointment-ops.js';
import {
  activateInvite,
  canOpenInvite,
  createInviteRecord,
  evaluateInviteAcceptance,
  publicInviteView,
  revokeInvite,
  type AcceptActor,
  type InviteEvent,
  type PatientInvite,
} from './identity/invites.js';
import { validateProvisionInput } from './identity/provision.js';
import { resetIntakeMemory } from './intake/memory.js';
import { resetCareMemory } from './care/repository.js';
import { resetPrivateAssets } from './assets/repository.js';
import { resetProcessQueue } from './jobs/queue.js';
import { resetRecipeMemory } from './recipes/repository.js';
import { resetMealPlanMemory } from './plans/repository.js';
import { resetDiaryMemory } from './diary/repository.js';
import { markMemoryRead, resetMessageMemory, sendMemoryMessage } from './messages/repository.js';
import { resetAiJobMemory } from './ai-jobs/repository.js';
import { resetPrivacyMemory } from './privacy/repository.js';
import { resetShoppingMemory } from './shopping/repository.js';
import { enqueueMemoryOutbox, listMemoryMailbox, processMemoryDeliveries, resetOutboxMemory } from './outbox/memory.js';
import type { OutboxEventType } from '../src/types/outbox.js';

export type { PatientInvite, InviteEvent } from './identity/invites.js';

export const DEMO_NUTRITIONIST_ID = 'nutri-demo';

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

export type TimelineEvent = {
  id: string;
  kind: 'meal_logged' | 'meal_missed' | 'habit' | 'activity' | 'reminder_fired' | 'appointment' | 'message' | 'menu' | 'billing' | 'goal' | 'profile';
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
  delivered_at?: string | null;
  read_at?: string | null;
  attachment?: {
    asset_id: string;
    filename: string;
    mime: string;
    byte_size: number;
    kind: 'image' | 'pdf';
    available?: boolean;
  };
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

export type Patient = {
  id: string;
  name: string;
  initials: string;
  tone: 'peach' | 'lilac' | 'mint';
  status: string;
  archived_at?: string | null;
  deactivated_at?: string | null;
  anonymized_at?: string | null;
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
  appointment: {
    when: string;
    duration: number;
    channel: string;
    meet_url?: string;
    starts_at?: string;
    timezone?: string;
    patient_reply?: 'attending' | 'needs_change';
    confirmed_at?: string | null;
  } | null;
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

const now = () => new Date().toISOString();

function patientInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

const localDateId = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const localDateOffset = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDateId(date);
};

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

function reviewedLog(id: string, patientId: string, slot: string, title: string, kcal: number, daysBack: number, status: 'confirmed' | 'adjusted' = 'confirmed'): MealLog {
  return {
    id,
    patient_id: patientId,
    slot,
    photo_url: null,
    description: title,
    foods: [{ name: title, portion_est: 150, portion_unit: 'g', confidence: 0.7 }],
    macros: { kcal, protein_g: 28, carbs_g: 40, fat_g: 12 },
    confidence: 0.7,
    note_for_nutri: 'Revisada en la semana.',
    status,
    logged_at: daysAgo(daysBack),
  };
}

function habitSeed(patientId: string, dailyHydration: number[], todayEnergy: string | null = null, sleepMinutes: readonly (number | null)[] = []): HabitLog[] {
  return dailyHydration.map((hydration, i) => ({
    id: `hb-${patientId}-${i}`,
    patient_id: patientId,
    date: localDateId(new Date(Date.now() - i * 86_400_000)),
    hydration,
    energy: i === 0 ? todayEnergy : null,
    sleep_minutes: sleepMinutes[i] ?? null,
  }));
}

function seedPatients(): Patient[] {
  return [
    {
      id: 'pat-sofia',
      name: 'Sofía R.',
      initials: 'SR',
      tone: 'peach',
      status: 'Atención',
      billing_status: 'active',
      billing_until: localDateOffset(30),
      stage: 'seguimiento',
      goal: 'Comer con más regularidad',
      goal_status: 'active',
      goal_progress: 55,
      goal_updated_at: daysAgo(2),
      goal_history: [{ id: 'goal-s1', goal: 'Comer con más regularidad', status: 'active', progress: 55, note: 'Mejoró la organización del almuerzo; sostener el foco nocturno.', updated_at: daysAgo(2) }],
      sensitive_hours: 'Después de las 20:30',
      plan_b: 'Tostada + huevo + palta',
      next_focus: 'Organización nocturna',
      adherence_score: 62,
      adherence_why: '4 de 7 almuerzos confirmados. Agua 3/7 días. Cena de ayer en revisión (no suma).',
      time: 'hace 38 min',
      hydration: 3,
      energy: 'Baja',
      sleep_minutes: null,
      appointment: { when: 'Jueves · 14:30', duration: 45, channel: 'video' },
      habit_logs: habitSeed('pat-sofia', [3, 3, 2, 3, 4, 3, 3], 'Baja', [null, 390, 450, 420, 480, 405, 435]),
      todayPlan: [
        { slot: 'Desayuno', title: 'Yogur griego, granola y frutas', time: '08:00' },
        { slot: 'Almuerzo', title: 'Bowl tibio de pollo y vegetales', time: '13:30' },
        { slot: 'Merienda', title: 'Tostada + huevo + palta', time: '17:30' },
        { slot: 'Cena', title: 'Elegí tu versión favorita', time: '21:00' },
      ],
      weekPlan: [
        { day: 'Lunes', meals: [{ slot: 'Almuerzo', title: 'Wrap de pollo' }, { slot: 'Cena', title: 'Ensalada tibia' }] },
        { day: 'Martes', meals: [{ slot: 'Almuerzo', title: 'Bowl de quinoa' }, { slot: 'Cena', title: 'Omelette + ensalada' }] },
        { day: 'Miércoles', meals: [{ slot: 'Almuerzo', title: 'Bowl tibio de pollo y vegetales' }, { slot: 'Cena', title: 'Plan B: tostada + huevo' }] },
        { day: 'Jueves', meals: [{ slot: 'Almuerzo', title: 'Milanesa de pollo y ensalada' }, { slot: 'Cena', title: 'Sopa de verduras' }] },
        { day: 'Viernes', meals: [{ slot: 'Almuerzo', title: 'Pasta integral con verduras' }, { slot: 'Cena', title: 'Pescado al horno' }] },
      ],
      brief: {
        suggested_action: 'mensaje',
        up_next_title: 'Mandarle un mensaje',
        up_next_body: 'Ayer no cargó el almuerzo y el agua quedó en 3/8. Un toque corto, no un sermón.',
        draft_message: 'Hola, vi que ayer se te escapó el almuerzo. ¿Lo resolvemos con el Plan B o lo pasamos a hoy?',
        source_ids: [],
        adherence_why: '4 de 7 almuerzos confirmados. Agua 3/7 días. Cena de ayer en revisión (no suma).',
      },
      timeline: [
        { id: 's1', kind: 'meal_logged', atLabel: 'HOY', title: 'Cena · foto en revisión', body: '21:47 · estimación floja (0.38). Macros no entran al gauge.' },
        { id: 's2', kind: 'habit', atLabel: 'HOY', title: 'Energía baja', body: 'Check-in del paciente' },
        { id: 's3', kind: 'meal_logged', atLabel: 'HOY', title: 'Almuerzo · foto en revisión', body: '14:02 · estimación (0.62). Pendiente de Vero.' },
        { id: 's4', kind: 'meal_missed', atLabel: 'AYER', title: 'Sin registro · almuerzo', body: '13:30 · slot planificado, sin meal_log' },
      ],
      meal_logs: [
        {
          id: 'ml-s1',
          patient_id: 'pat-sofia',
          slot: 'Cena',
          photo_url: null,
          description: 'Pasta con salsa',
          foods: [{ name: 'pasta con salsa', portion_est: 200, portion_unit: 'g', confidence: 0.38 }],
          macros: { kcal: 380, protein_g: 12, carbs_g: 58, fat_g: 10 },
          confidence: 0.38,
          note_for_nutri: 'Foto oscura, difícil estimar porción de pasta y grasa de la salsa.',
          status: 'pending_review',
          logged_at: now(),
        },
        {
          id: 'ml-s2',
          patient_id: 'pat-sofia',
          slot: 'Almuerzo',
          photo_url: null,
          description: 'Bowl de pollo',
          foods: [
            { name: 'pollo a la plancha', portion_est: 120, portion_unit: 'g', confidence: 0.65 },
            { name: 'vegetales', portion_est: 80, portion_unit: 'g', confidence: 0.6 },
          ],
          macros: { kcal: 420, protein_g: 35, carbs_g: 28, fat_g: 14 },
          confidence: 0.62,
          note_for_nutri: 'Coincide con el bowl planificado. Aceite no visible.',
          status: 'pending_review',
          logged_at: now(),
        },
        reviewedLog('ml-s3', 'pat-sofia', 'Almuerzo', 'Wrap de pollo', 430, 1),
        reviewedLog('ml-s4', 'pat-sofia', 'Cena', 'Ensalada tibia', 350, 1),
        reviewedLog('ml-s5', 'pat-sofia', 'Almuerzo', 'Bowl de quinoa', 410, 2, 'adjusted'),
        reviewedLog('ml-s6', 'pat-sofia', 'Cena', 'Omelette + ensalada', 330, 2),
        reviewedLog('ml-s7', 'pat-sofia', 'Almuerzo', 'Bowl tibio de pollo y vegetales', 420, 3),
        reviewedLog('ml-s8', 'pat-sofia', 'Cena', 'Plan B: tostada + huevo', 310, 3),
        reviewedLog('ml-s9', 'pat-sofia', 'Almuerzo', 'Milanesa de pollo y ensalada', 480, 4, 'adjusted'),
        reviewedLog('ml-s10', 'pat-sofia', 'Cena', 'Sopa de verduras', 280, 4),
        reviewedLog('ml-s11', 'pat-sofia', 'Almuerzo', 'Pasta integral con verduras', 450, 5),
        reviewedLog('ml-s12', 'pat-sofia', 'Cena', 'Pescado al horno', 390, 5),
      ],
      messages: [
        { id: 'msg-1', patient_id: 'pat-sofia', from: 'vero', text: 'Me encantó cómo venís encontrando opciones simples para tus almuerzos.', suggested_by_ai: false, sent_at: now(), delivered_at: now() },
      ],
    },
    {
      id: 'pat-marina',
      name: 'Marina C.',
      initials: 'MC',
      tone: 'lilac',
      status: 'Plan B',
      billing_status: 'pending',
      billing_until: null,
      stage: 'plan',
      goal: 'Sostener el Plan B sin improvisar de noche',
      goal_status: 'paused',
      goal_progress: 40,
      goal_updated_at: daysAgo(5),
      goal_history: [{ id: 'goal-m1', goal: 'Sostener el Plan B sin improvisar de noche', status: 'paused', progress: 40, note: 'Pausa breve durante una semana de cambios laborales.', updated_at: daysAgo(5) }],
      sensitive_hours: 'Salida del trabajo · 18:00',
      plan_b: 'Yogur + fruta + puñado de nueces',
      next_focus: 'Merienda pre-armada',
      adherence_score: 72,
      adherence_why: '5 de 7 meriendas confirmadas. Usó Plan B 3 veces. Agua 5/7.',
      time: 'ayer',
      hydration: 5,
      energy: 'Tranquila',
      sleep_minutes: 480,
      appointment: { when: 'Viernes · 11:00', duration: 30, channel: 'video' },
      habit_logs: habitSeed('pat-marina', [5, 5, 5, 5, 5, 5, 5], 'Tranquila', [480, 450, 465, 420, 480, 450, 435]),
      todayPlan: [
        { slot: 'Desayuno', title: 'Avena con frutas', time: '08:00' },
        { slot: 'Almuerzo', title: 'Wrap de pollo y ensalada', time: '13:00' },
        { slot: 'Merienda', title: 'Yogur + fruta + nueces (Plan B)', time: '17:30' },
        { slot: 'Cena', title: 'Ensalada completa', time: '21:00' },
      ],
      weekPlan: [
        { day: 'Miércoles', meals: [{ slot: 'Almuerzo', title: 'Wrap de pollo' }, { slot: 'Merienda', title: 'Plan B' }] },
        { day: 'Jueves', meals: [{ slot: 'Almuerzo', title: 'Bowl de quinoa' }, { slot: 'Cena', title: 'Omelette + ensalada' }] },
      ],
      brief: {
        suggested_action: 'ajuste_menu',
        up_next_title: 'Ajustar el menú',
        up_next_body: 'Plan B tres veces esta semana. Conviene dejar la merienda pre-armada en el slot.',
        draft_message: null,
        source_ids: [],
        adherence_why: '5 de 7 meriendas confirmadas. Usó Plan B 3 veces. Agua 5/7.',
      },
      timeline: [
        { id: 'm1', kind: 'meal_logged', atLabel: 'HOY', title: 'Merienda · foto en revisión', body: '17:40 · 0.58 · pendiente.' },
      ],
      meal_logs: [
        {
          id: 'ml-m1',
          patient_id: 'pat-marina',
          slot: 'Merienda',
          photo_url: null,
          description: 'Yogur con fruta',
          foods: [{ name: 'yogur con fruta', portion_est: 180, portion_unit: 'g', confidence: 0.58 }],
          macros: { kcal: 220, protein_g: 12, carbs_g: 28, fat_g: 6 },
          confidence: 0.58,
          note_for_nutri: 'Parece Plan B. Confirmar si incluyó nueces.',
          status: 'pending_review',
          logged_at: now(),
        },
        reviewedLog('ml-m2', 'pat-marina', 'Almuerzo', 'Wrap de pollo', 420, 1),
        reviewedLog('ml-m3', 'pat-marina', 'Merienda', 'Yogur + fruta + nueces (Plan B)', 210, 1),
        reviewedLog('ml-m4', 'pat-marina', 'Almuerzo', 'Wrap de pollo y ensalada', 430, 2, 'adjusted'),
        reviewedLog('ml-m5', 'pat-marina', 'Cena', 'Ensalada completa', 340, 3),
        reviewedLog('ml-m6', 'pat-marina', 'Almuerzo', 'Bowl de quinoa', 410, 4),
        reviewedLog('ml-m7', 'pat-marina', 'Merienda', 'Yogur + fruta', 190, 5),
      ],
      messages: [],
    },
    {
      id: 'pat-lucia',
      name: 'Lucía F.',
      initials: 'LF',
      tone: 'mint',
      status: 'En ritmo',
      billing_status: 'past_due',
      billing_until: localDateOffset(-1),
      stage: 'seguimiento',
      goal: 'Mantener regularidad de almuerzos',
      goal_status: 'completed',
      goal_progress: 100,
      goal_updated_at: daysAgo(1),
      goal_history: [{ id: 'goal-l1', goal: 'Mantener regularidad de almuerzos', status: 'completed', progress: 100, note: 'Objetivo sostenido durante cuatro semanas.', updated_at: daysAgo(1) }],
      sensitive_hours: 'Ninguno marcado',
      plan_b: 'Huevos revueltos + pan',
      next_focus: 'Seguir como viene',
      adherence_score: 88,
      adherence_why: '6 de 7 almuerzos confirmados. Agua 6/7. Sueño cargado 6/7.',
      time: 'ayer',
      hydration: 6,
      energy: 'Con energía',
      sleep_minutes: 450,
      appointment: { when: 'Jueves · 16:00', duration: 45, channel: 'presencial' },
      habit_logs: habitSeed('pat-lucia', [6, 6, 6, 6, 6, 6, 6], 'Con energía', [450, 420, 480, 450, 435, 465, null]),
      todayPlan: [
        { slot: 'Desayuno', title: 'Tostadas integrales + huevo', time: '08:00' },
        { slot: 'Almuerzo', title: 'Milanesa de pollo y ensalada', time: '13:30' },
        { slot: 'Merienda', title: 'Fruta + yogur', time: '17:00' },
        { slot: 'Cena', title: 'Verduras al wok con arroz', time: '21:00' },
      ],
      weekPlan: [
        { day: 'Lunes', meals: [{ slot: 'Almuerzo', title: 'Wrap de pollo' }, { slot: 'Cena', title: 'Ensalada tibia' }] },
        { day: 'Martes', meals: [{ slot: 'Almuerzo', title: 'Bowl de quinoa' }, { slot: 'Cena', title: 'Omelette + ensalada' }] },
        { day: 'Miércoles', meals: [{ slot: 'Almuerzo', title: 'Milanesa de pollo y ensalada' }, { slot: 'Cena', title: 'Sopa de verduras' }] },
        { day: 'Jueves', meals: [{ slot: 'Almuerzo', title: 'Pasta integral con verduras' }, { slot: 'Cena', title: 'Pescado al horno' }] },
        { day: 'Viernes', meals: [{ slot: 'Almuerzo', title: 'Wok de verduras y arroz' }, { slot: 'Cena', title: 'Tortilla de verduras' }] },
        { day: 'Sábado', meals: [{ slot: 'Almuerzo', title: 'Bowl tibio de pollo' }, { slot: 'Cena', title: 'Plan B: huevos revueltos + pan' }] },
        { day: 'Domingo', meals: [{ slot: 'Almuerzo', title: 'Asado + ensaladas' }, { slot: 'Cena', title: 'Sopa crema' }] },
      ],
      brief: null,
      timeline: [
        { id: 'l1', kind: 'meal_logged', atLabel: 'HOY', title: 'Almuerzo · confirmado', body: 'milanesa de pollo, ensalada · 520 kcal' },
      ],
      meal_logs: [
        {
          id: 'ml-l1',
          patient_id: 'pat-lucia',
          slot: 'Almuerzo',
          photo_url: null,
          description: 'Milanesa con ensalada',
          foods: [
            { name: 'milanesa de pollo', portion_est: 150, portion_unit: 'g', confidence: 0.82 },
            { name: 'ensalada mixta', portion_est: 100, portion_unit: 'g', confidence: 0.78 },
          ],
          macros: { kcal: 520, protein_g: 42, carbs_g: 22, fat_g: 28 },
          confidence: 0.85,
          note_for_nutri: 'Coincide con el menú. Porción adecuada.',
          status: 'confirmed',
          logged_at: now(),
        },
        reviewedLog('ml-l2', 'pat-lucia', 'Almuerzo', 'Wok de verduras y arroz', 450, 1),
        reviewedLog('ml-l3', 'pat-lucia', 'Cena', 'Tortilla de verduras', 330, 1),
        reviewedLog('ml-l4', 'pat-lucia', 'Almuerzo', 'Pasta integral con verduras', 460, 2),
        reviewedLog('ml-l5', 'pat-lucia', 'Cena', 'Pescado al horno', 380, 2),
        reviewedLog('ml-l6', 'pat-lucia', 'Almuerzo', 'Milanesa de pollo y ensalada', 510, 3),
        reviewedLog('ml-l7', 'pat-lucia', 'Cena', 'Sopa de verduras', 270, 3),
        reviewedLog('ml-l8', 'pat-lucia', 'Almuerzo', 'Bowl de quinoa', 420, 4),
        reviewedLog('ml-l9', 'pat-lucia', 'Cena', 'Omelette + ensalada', 320, 4),
        reviewedLog('ml-l10', 'pat-lucia', 'Almuerzo', 'Wrap de pollo', 430, 5),
        reviewedLog('ml-l11', 'pat-lucia', 'Cena', 'Ensalada tibia', 340, 5),
        reviewedLog('ml-l12', 'pat-lucia', 'Almuerzo', 'Asado + ensaladas', 560, 6),
        reviewedLog('ml-l13', 'pat-lucia', 'Cena', 'Sopa crema', 290, 6),
        reviewedLog('ml-l14', 'pat-lucia', 'Desayuno', 'Tostadas integrales + huevo', 350, 0),
        reviewedLog('ml-l15', 'pat-lucia', 'Merienda', 'Fruta + yogur', 210, 0),
      ],
      messages: [],
    },
  ];
}

export type AppStore = {
  patients: Patient[];
  patientInvites: PatientInvite[];
  inviteEvents: InviteEvent[];
  provisionedNutritionists: { id: string; userId: string; displayName: string }[];
  linkedPatientUsers: Record<string, string>;
  notices: DemoNotice[];
  activePatientId: string;
};

let store: AppStore = {
  patients: seedPatients(),
  patientInvites: [],
  inviteEvents: [],
  provisionedNutritionists: [],
  linkedPatientUsers: {},
  notices: [],
  activePatientId: 'pat-sofia',
};

function persistAppointmentState(now = new Date()): void {
  store.patients = store.patients.map((patient) => {
    const resolved = resolveAppointmentState(patient, now, randomUUID);
    if (!resolved.changed) return patient;
    return { ...patient, appointment: resolved.appointment, appointment_history: resolved.appointment_history };
  });
}

export function getStore(): AppStore {
  persistAppointmentState();
  return store;
}

export function getPatient(id: string): Patient | undefined {
  persistAppointmentState();
  return store.patients.find((p) => p.id === id);
}

const DEMO_NOTICE_TO = 'aviso.demo@plan-v.local';

function recordOutboxNotice(input: {
  patientId: string;
  eventType: OutboxEventType;
  kind: DemoNotice['kind'];
  subject: string;
  body: string;
  clientId?: string;
}) {
  const patient = getPatient(input.patientId);
  if (!patient) return;
  enqueueMemoryOutbox({
    patient: {
      id: patient.id,
      nutritionist_id: DEMO_NUTRITIONIST_ID,
      deactivated_at: patient.deactivated_at,
      anonymized_at: patient.anonymized_at,
    },
    event_type: input.eventType,
    client_id: input.clientId ?? randomUUID(),
    subject: input.subject,
    body: input.body,
    kind: input.kind,
    pref_user: patient.id,
  });
  processMemoryDeliveries();
}

export function enqueueNotice(input: Omit<DemoNotice, 'id' | 'at' | 'channel' | 'to'> & { to?: string }): DemoNotice {
  recordOutboxNotice({
    patientId: input.patientId,
    eventType: input.kind === 'appointment' ? 'appointment_scheduled' : 'reminder',
    kind: input.kind,
    subject: input.subject,
    body: input.body,
  });
  const mailbox = listMemoryMailbox(input.patientId);
  const entry = mailbox[0];
  if (entry) return entry;
  return {
    id: randomUUID(),
    at: now(),
    channel: 'email',
    to: input.to ?? DEMO_NOTICE_TO,
    subject: input.subject,
    body: input.body,
    patientId: input.patientId,
    kind: input.kind,
  };
}

export function listNotices(patientId?: string): DemoNotice[] {
  return listMemoryMailbox(patientId);
}

function recordInviteEvent(inviteId: string, event: InviteEvent['event'], actorId: string | null = null): void {
  store.inviteEvents.push({
    id: randomUUID(),
    invite_id: inviteId,
    event,
    actor_id: actorId,
    detail: {},
    created_at: now(),
  });
}

export function getPatientInvite(patientId: string): PatientInvite | undefined {
  return store.patientInvites.find((invite) => invite.patient_id === patientId);
}

export function getInviteById(inviteId: string): PatientInvite | undefined {
  return store.patientInvites.find((invite) => invite.id === inviteId);
}

export function listInviteEvents(inviteId: string): InviteEvent[] {
  return store.inviteEvents.filter((event) => event.invite_id === inviteId);
}

export function createPatient(input: { name: string; email: string; goal: string }): { patient: Patient; invite: PatientInvite } | null {
  const email = input.email.trim().toLowerCase();
  if (!canOpenInvite(store.patientInvites, {
    patientId: `pending-${email}`,
    nutritionistId: DEMO_NUTRITIONIST_ID,
    email,
  })) return null;
  if (store.patientInvites.some((invite) => invite.email === email && (invite.status === 'not_sent' || invite.status === 'pending'))) {
    return null;
  }

  const id = `pat-${randomUUID()}`;
  const initials = patientInitials(input.name);
  const tones: Patient['tone'][] = ['peach', 'lilac', 'mint'];
  const patient: Patient = {
    id,
    name: input.name.trim(),
    initials,
    tone: tones[store.patients.length % tones.length],
    status: 'Ingreso',
    archived_at: null,
    billing_status: 'pending',
    billing_until: null,
    stage: 'ingreso',
    goal: input.goal.trim(),
    goal_status: 'active',
    goal_progress: 0,
    goal_updated_at: null,
    goal_history: [],
    sensitive_hours: '',
    plan_b: '',
    next_focus: 'Completar evaluación inicial',
    adherence_score: 0,
    adherence_why: 'Acompañamiento todavía sin registros.',
    time: 'recién',
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
    brief: null,
    timeline: [],
    meal_logs: [],
    messages: [],
  };
  const invite = createInviteRecord({
    id: randomUUID(),
    patientId: id,
    nutritionistId: DEMO_NUTRITIONIST_ID,
    email,
    now: new Date(),
  });

  store.patients.push(patient);
  store.patientInvites.push(invite);
  recordInviteEvent(invite.id, 'created');
  return { patient, invite: publicInviteView(invite) };
}

export function sendPatientInvite(inviteId: string): PatientInvite | null {
  const current = getInviteById(inviteId);
  if (!current) return null;
  const activated = activateInvite(current, new Date());
  if (!activated) return null;
  store.patientInvites = store.patientInvites.map((invite) => invite.id === inviteId ? activated.invite : invite);
  recordInviteEvent(inviteId, activated.event);
  recordOutboxNotice({
    patientId: current.patient_id,
    eventType: 'invite_sent',
    kind: 'reminder',
    subject: `Invitación enviada · ${current.email}`,
    body: 'La invitación quedó en el buzón in-app de Plan V; no se envió un mail real.',
    clientId: inviteId,
  });
  return publicInviteView(activated.invite);
}

export function revokePatientInvite(inviteId: string): PatientInvite | null {
  const current = getInviteById(inviteId);
  if (!current) return null;
  const revoked = revokeInvite(current, new Date());
  if (!revoked) return null;
  store.patientInvites = store.patientInvites.map((invite) => invite.id === inviteId ? revoked : invite);
  recordInviteEvent(inviteId, 'revoked');
  return publicInviteView(revoked);
}

export function acceptPatientInvite(inviteId: string, actor: AcceptActor): ReturnType<typeof evaluateInviteAcceptance> {
  const current = getInviteById(inviteId);
  if (!current) {
    return { ok: false, code: 'invite_unavailable', message: 'Invitación no disponible' };
  }
  const result = evaluateInviteAcceptance({
    invite: current,
    actor,
    now: new Date(),
    patientUserId: store.linkedPatientUsers[current.patient_id] ?? null,
  });
  if (!result.ok) return result;
  store.patientInvites = store.patientInvites.map((invite) => invite.id === inviteId ? result.invite : invite);
  store.linkedPatientUsers[result.patientId] = actor.userId;
  recordInviteEvent(inviteId, 'accepted', actor.userId);
  return result;
}

export function provisionNutritionistMemory(input: { userId: string; displayName: string; license?: string | null; monthlyFee?: number | null }): { nutritionist_id: string } | { error: string } {
  const parsed = validateProvisionInput(input);
  if (!parsed.ok) return { error: parsed.message };
  const existing = store.provisionedNutritionists.find((row) => row.userId === parsed.userId);
  if (existing) {
    existing.displayName = parsed.displayName;
    return { nutritionist_id: existing.id };
  }
  const id = `nutri-${randomUUID()}`;
  store.provisionedNutritionists.push({ id, userId: parsed.userId, displayName: parsed.displayName });
  return { nutritionist_id: id };
}

export function resetStore(): void {
  resetIntakeMemory();
  resetCareMemory();
  resetPrivateAssets();
  resetProcessQueue();
  resetRecipeMemory();
  resetMealPlanMemory();
  resetDiaryMemory();
  resetMessageMemory();
  resetAiJobMemory();
  resetPrivacyMemory();
  resetShoppingMemory();
  resetOutboxMemory();
  store = {
    patients: seedPatients(),
    patientInvites: [],
    inviteEvents: [],
    provisionedNutritionists: [],
    linkedPatientUsers: {},
    notices: [],
    activePatientId: 'pat-sofia',
  };
}

const WEEK_DAY_ORDER = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MENU_SLOT_ORDER = ['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena', 'Extra'];

export function upsertMenuSlot(id: string, day: string, slot: string, title: string): Patient | undefined {
  const patient = getPatient(id);
  if (!patient) return undefined;

  const withSlot = patient.weekPlan.map((entry) => {
    if (entry.day !== day) return entry;
    const meals = entry.meals.some((meal) => meal.slot === slot)
      ? entry.meals.map((meal) => (meal.slot === slot ? { ...meal, title } : meal))
      : [...entry.meals, { slot, title }];
    return { ...entry, meals };
  });
  if (!withSlot.some((entry) => entry.day === day)) withSlot.push({ day, meals: [{ slot, title }] });

  const weekPlan = withSlot
    .map((entry) => ({
      ...entry,
      meals: [...entry.meals].sort((a, b) => MENU_SLOT_ORDER.indexOf(a.slot) - MENU_SLOT_ORDER.indexOf(b.slot)),
    }))
    .sort((a, b) => WEEK_DAY_ORDER.indexOf(a.day) - WEEK_DAY_ORDER.indexOf(b.day));

  const timeline = [{
    id: randomUUID(),
    kind: 'menu' as const,
    atLabel: 'HOY',
    title: `Menú · ${day} ${slot}`,
    body: title,
  }, ...patient.timeline];

  updatePatient(id, { weekPlan, timeline });
  return recalculateAdherence(id);
}

export function removeMenuSlot(id: string, day: string, slot: string): Patient | undefined {
  const patient = getPatient(id);
  if (!patient) return undefined;
  const entry = patient.weekPlan.find((d) => d.day === day);
  const removed = entry?.meals.find((meal) => meal.slot === slot);
  if (!entry || !removed) return undefined;

  const weekPlan = patient.weekPlan.map((d) => (
    d.day !== day ? d : { ...d, meals: d.meals.filter((meal) => meal.slot !== slot) }
  ));
  const timeline = [{
    id: randomUUID(),
    kind: 'menu' as const,
    atLabel: 'HOY',
    title: `Menú · quitado ${day} ${slot}`,
    body: removed.title,
  }, ...patient.timeline];

  updatePatient(id, { weekPlan, timeline });
  return recalculateAdherence(id);
}

export function addActivityLog(
  id: string,
  input: Pick<ActivityLog, 'activity' | 'duration_minutes' | 'intensity'> & { note?: string },
): Patient | undefined {
  const patient = getPatient(id);
  if (!patient) return undefined;
  const loggedAt = new Date().toISOString();
  const activity: ActivityLog = {
    id: randomUUID(),
    patient_id: patient.id,
    activity: input.activity.trim(),
    duration_minutes: input.duration_minutes,
    intensity: input.intensity,
    note: input.note?.trim() || null,
    logged_at: loggedAt,
  };
  const timeline: TimelineEvent[] = [{
    id: randomUUID(), kind: 'activity', atLabel: 'HOY',
    title: `Actividad · ${activity.activity}`,
    body: `${activity.duration_minutes} min · Intensidad ${activity.intensity}`,
  }, ...patient.timeline];
  return updatePatient(id, {
    activity_logs: [activity, ...(patient.activity_logs ?? [])],
    timeline,
  });
}

export function deleteActivityLog(id: string, activityId: string): Patient | undefined {
  const patient = getPatient(id);
  if (!patient) return undefined;
  const current = patient.activity_logs ?? [];
  if (!current.some((entry) => entry.id === activityId)) return undefined;
  return updatePatient(id, { activity_logs: current.filter((entry) => entry.id !== activityId) });
}

export function assignResourceToPatients(resourceId: string, patientIds: string[]): {
  patients: Patient[];
  assignedCount: number;
  existingCount: number;
} | null {
  const patients = [...new Set(patientIds)].map(getPatient);
  if (patients.some((patient) => !patient)) return null;

  let assignedCount = 0;
  let existingCount = 0;
  const assignedAt = now();
  const updated = (patients as Patient[]).map((patient) => {
    const current = patient.resource_assignments ?? [];
    if (current.some((assignment) => assignment.resource_id === resourceId)) {
      existingCount += 1;
      return patient;
    }
    assignedCount += 1;
    return updatePatient(patient.id, {
      resource_assignments: [...current, {
        id: randomUUID(),
        patient_id: patient.id,
        resource_id: resourceId,
        assigned_at: assignedAt,
        read_at: null,
      }],
    })!;
  });
  return { patients: updated, assignedCount, existingCount };
}

export function markResourceRead(patientId: string, resourceId: string): Patient | undefined {
  const patient = getPatient(patientId);
  if (!patient) return undefined;
  const assignments = patient.resource_assignments ?? [];
  const assignment = assignments.find((item) => item.resource_id === resourceId);
  if (!assignment) return undefined;
  if (assignment.read_at) return patient;
  return updatePatient(patientId, {
    resource_assignments: assignments.map((item) => item.id === assignment.id ? { ...item, read_at: now() } : item),
  });
}

export function updatePatient(id: string, patch: Partial<Patient>): Patient | undefined {
  const idx = store.patients.findIndex((p) => p.id === id);
  if (idx === -1) return undefined;
  store.patients[idx] = { ...store.patients[idx], ...patch };
  return store.patients[idx];
}

export function setPatientProfile(
  id: string,
  input: Partial<Pick<Patient, 'name' | 'status' | 'stage' | 'sensitive_hours' | 'plan_b' | 'next_focus'>>,
): Patient | undefined {
  const patient = getPatient(id);
  if (!patient) return undefined;

  const timeline: TimelineEvent[] = [{
    id: randomUUID(),
    kind: 'profile',
    atLabel: 'HOY',
    title: 'Paciente · ficha actualizada',
    body: 'Datos de acompañamiento actualizados por la profesional.',
  }, ...patient.timeline];
  return updatePatient(id, {
    ...input,
    ...(input.name ? { initials: patientInitials(input.name) } : {}),
    timeline,
  });
}

export function setPatientArchived(id: string, archived: boolean): Patient | undefined {
  const patient = getPatient(id);
  if (!patient) return undefined;

  const timeline: TimelineEvent[] = [{
    id: randomUUID(),
    kind: 'profile',
    atLabel: 'HOY',
    title: archived ? 'Paciente · archivado' : 'Paciente · restaurado',
    body: archived ? 'Se quitó de las vistas operativas.' : 'Volvió a las vistas operativas.',
  }, ...patient.timeline];
  return updatePatient(id, { archived_at: archived ? now() : null, timeline });
}

export function setBillingStatus(
  id: string,
  input: { status: 'pending' | 'waived' } | { status: 'active'; billing_until: string },
): Patient | undefined {
  const patient = getPatient(id);
  if (!patient) return undefined;

  const billing_until = input.status === 'active' ? input.billing_until : null;
  const billing_status: BillingStatus = input.status === 'active' && input.billing_until < localDateId(new Date())
    ? 'past_due'
    : input.status;
  const titleStatus = billing_status === 'waived'
    ? 'exceptuado'
    : billing_status === 'pending'
      ? 'pendiente'
      : billing_status === 'past_due'
        ? 'vencido'
        : 'activo';
  const timeline: TimelineEvent[] = [{
    id: randomUUID(),
    kind: 'billing',
    atLabel: 'HOY',
    title: `Cobro · ${titleStatus}`,
    body: billing_until
      ? `Vigente hasta ${billing_until}`
      : billing_status === 'waived'
        ? 'Acceso habilitado por Verónica'
        : 'A la espera de confirmación de pago',
  }, ...patient.timeline];

  return updatePatient(id, { billing_status, billing_until, timeline });
}

export function setGoal(
  id: string,
  input: { goal: string; status: GoalStatus; progress: number; note?: string },
): Patient | undefined {
  const patient = getPatient(id);
  if (!patient) return undefined;

  const updatedAt = now();
  const historyEntry: GoalHistoryEntry = {
    id: randomUUID(),
    goal: input.goal,
    status: input.status,
    progress: input.progress,
    note: input.note ?? null,
    updated_at: updatedAt,
  };
  const statusLabel = input.status === 'active' ? 'Activo' : input.status === 'paused' ? 'En pausa' : 'Completado';
  const timeline: TimelineEvent[] = [{
    id: randomUUID(),
    kind: 'goal',
    atLabel: 'HOY',
    title: 'Objetivo · actualizado',
    body: `${input.goal} · ${input.progress}% · ${statusLabel}`,
  }, ...patient.timeline];

  return updatePatient(id, {
    goal: input.goal,
    goal_status: input.status,
    goal_progress: input.progress,
    goal_updated_at: updatedAt,
    goal_history: [historyEntry, ...(patient.goal_history ?? [])],
    timeline,
  });
}

export function recalculateAdherence(id: string): Patient | undefined {
  const patient = getPatient(id);
  if (!patient) return undefined;
  const { score, why } = calculateAdherence(patient);
  return updatePatient(id, { adherence_score: score, adherence_why: why });
}

export function upsertHabitLog(id: string, patch: { hydration?: number; energy?: string | null; sleep_minutes?: number }): Patient | undefined {
  const patient = getPatient(id);
  if (!patient) return undefined;

  const today = localDateId(new Date());
  const habit_logs = patient.habit_logs.some((h) => h.date === today)
    ? patient.habit_logs.map((h) => (h.date === today ? { ...h, ...patch } : h))
    : [{ id: randomUUID(), patient_id: id, date: today, hydration: 0, energy: null, sleep_minutes: null, ...patch }, ...patient.habit_logs];

  const snapshot: Partial<Patient> = { habit_logs };
  if (patch.hydration !== undefined) snapshot.hydration = patch.hydration;
  if (patch.energy !== undefined) snapshot.energy = patch.energy;
  if (patch.sleep_minutes !== undefined) snapshot.sleep_minutes = patch.sleep_minutes;

  updatePatient(id, snapshot);
  return recalculateAdherence(id);
}

function appointmentTitle(previous: Patient['appointment'], next: Patient['appointment'], actor: AppointmentHistoryActor): string {
  if (!next) return 'Consulta · cancelada';
  if (!previous) return 'Consulta · agendada';
  return actor === 'patient' ? 'Consulta · reprogramada por la paciente' : 'Consulta · reprogramada';
}

function appointmentRangesOverlap(
  left: { starts_at?: string; duration: number },
  right: { starts_at?: string; duration: number },
) {
  if (!left.starts_at || !right.starts_at) return false;
  const aStart = Date.parse(left.starts_at);
  const bStart = Date.parse(right.starts_at);
  if (Number.isNaN(aStart) || Number.isNaN(bStart)) return false;
  const aEnd = aStart + left.duration * 60_000;
  const bEnd = bStart + right.duration * 60_000;
  return aStart < bEnd && bStart < aEnd;
}

export function setAppointment(
  id: string,
  appointment: { day: string; time: string; duration: number; channel: string; meet_url?: string; timezone?: string } | null,
  options: { actor?: AppointmentHistoryActor } = {},
): Patient | undefined {
  const patient = getPatient(id);
  if (!patient) return undefined;
  const actor = options.actor ?? 'pro';
  const recordedAt = now();
  const clock = new Date(recordedAt);
  const previous = patient.appointment;
  const scheduled = appointment
    ? stampStartsAt({
        when: `${appointment.day} · ${appointment.time}`,
        duration: appointment.duration,
        channel: appointment.channel,
        timezone: appointment.timezone ?? previous?.timezone ?? DEFAULT_APPOINTMENT_TIMEZONE,
        ...(appointment.meet_url ? { meet_url: appointment.meet_url } : {}),
      }, clock)
    : null;
  if (scheduled) {
    for (const other of store.patients) {
      if (other.id === id || !other.appointment) continue;
      if (appointmentRangesOverlap(scheduled, other.appointment)) {
        throw new CareError(409, 'Ese horario se solapa con otra consulta del consultorio.');
      }
    }
  }
  const history = [...(patient.appointment_history ?? [])];
  if (previous && previous.when !== scheduled?.when) {
    history.unshift(historyEntry({
      id: randomUUID(),
      slot: previous,
      action: scheduled ? actor === 'patient' ? 'patient_rescheduled' : 'rescheduled' : 'cancelled',
      actor,
      at: recordedAt,
      now: clock,
    }));
  }
  const title = appointmentTitle(previous, scheduled, actor);
  const timeline = [{
    id: randomUUID(),
    kind: 'appointment' as const,
    atLabel: clock.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
    title,
    body: scheduled
      ? `${scheduled.when} · ${scheduled.duration} min · ${scheduled.channel}`
      : previous ? `Era ${previous.when}` : 'Sin turno previo',
  }, ...patient.timeline];

  if (scheduled || previous) {
    const when = scheduled?.when ?? previous?.when ?? '';
    const eventType: OutboxEventType = !scheduled
      ? 'appointment_cancelled'
      : previous
        ? 'appointment_rescheduled'
        : 'appointment_scheduled';
    recordOutboxNotice({
      patientId: id,
      eventType,
      kind: 'appointment',
      subject: `${title} · ${patient.name}`,
      body: scheduled
        ? `Turno publicado: ${when} · ${scheduled.duration} min · ${scheduled.channel}. Este aviso quedó en el buzón demo de Plan V; no se envió a internet.`
        : `Turno cancelado${previous ? ` (era ${previous.when})` : ''}. Este aviso quedó en el buzón demo de Plan V; no se envió a internet.`,
    });
  }

  return updatePatient(id, { appointment: scheduled, appointment_history: history, timeline });
}

export function confirmAppointment(id: string, reply: 'attending' | 'needs_change'): Patient | undefined {
  const patient = getPatient(id);
  if (!patient) return undefined;
  if (!patient.appointment) throw new CareError(409, 'No hay un turno para reprogramar');
  if (patient.appointment.patient_reply === reply) return patient;
  const recordedAt = now();
  const appointment = {
    ...patient.appointment,
    timezone: patient.appointment.timezone ?? DEFAULT_APPOINTMENT_TIMEZONE,
    patient_reply: reply,
    ...(reply === 'attending' || patient.appointment.confirmed_at
      ? { confirmed_at: patient.appointment.confirmed_at ?? recordedAt }
      : {}),
  };
  const history = [historyEntry({
    id: randomUUID(),
    slot: appointment,
    action: reply === 'attending' ? 'confirmed' : 'needs_change',
    actor: 'patient',
    at: recordedAt,
    now: new Date(recordedAt),
  }), ...(patient.appointment_history ?? [])];
  recordOutboxNotice({
    patientId: id,
    eventType: 'appointment_confirmed',
    kind: 'appointment',
    subject: `Consulta · ${reply === 'attending' ? 'confirmada' : 'pide cambio'} · ${patient.name}`,
    body: `La paciente respondió ${reply === 'attending' ? 'asiste' : 'pide cambio'} al turno ${appointment.when}. Este aviso quedó en el buzón in-app de Plan V; no se envió a internet.`,
  });
  return updatePatient(id, { appointment, appointment_history: history });
}

export function addMealLog(patientId: string, log: Omit<MealLog, 'id' | 'patient_id' | 'logged_at' | 'status'>): MealLog {
  const entry: MealLog = {
    ...log,
    id: randomUUID(),
    patient_id: patientId,
    status: 'pending_review',
    logged_at: now(),
  };
  const patient = getPatient(patientId);
  if (patient) {
    patient.meal_logs.unshift(entry);
    const loggedAt = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    const estimationLabel = entry.foods.length === 0 && entry.confidence === 0 && entry.macros == null
      ? 'estimación no disponible'
      : `estimación (${entry.confidence.toFixed(2)})`;
    patient.timeline.unshift({
      id: randomUUID(),
      kind: 'meal_logged',
      atLabel: 'HOY',
      title: `${entry.slot} · foto en revisión`,
      body: `${loggedAt} · ${estimationLabel}. Pendiente de Vero.`,
    });
    recalculateAdherence(patientId);
  }
  return entry;
}

export function updateMealLog(patientId: string, logId: string, patch: Partial<MealLog>): MealLog | undefined {
  const patient = getPatient(patientId);
  if (!patient) return undefined;
  const idx = patient.meal_logs.findIndex((l) => l.id === logId);
  if (idx === -1) return undefined;
  patient.meal_logs[idx] = { ...patient.meal_logs[idx], ...patch };
  if (patch.status === 'confirmed' || patch.status === 'adjusted') {
    const log = patient.meal_logs[idx];
    patient.timeline.unshift({
      id: randomUUID(),
      kind: 'meal_logged',
      atLabel: 'HOY',
      title: `${log.slot} · ${patch.status === 'confirmed' ? 'confirmado' : 'ajustado'}`,
      body: log.macros ? `${log.foods.map((f) => f.name).join(', ')} · ${log.macros.kcal} kcal` : 'Sin macros',
    });
  }
  recalculateAdherence(patientId);
  return patient.meal_logs[idx];
}

export function addMessage(patientId: string, text: string, from: 'vero' | 'patient', suggestedByAi = false): Message {
  return sendMemoryMessage(patientId, {
    text,
    from,
    suggestedByAi,
    client_id: randomUUID(),
  }).message;
}

export function markMessagesRead(patientId: string, reader: 'vero' | 'patient'): Patient | undefined {
  if (!getPatient(patientId)) return undefined;
  return markMemoryRead(patientId, reader);
}

export function setBrief(patientId: string, brief: Brief): void {
  updatePatient(patientId, { brief, briefDismissed: false, adherence_why: brief.adherence_why });
}

export function dismissBrief(patientId: string): Patient | undefined {
  const patient = getPatient(patientId);
  if (!patient || !patient.brief) return undefined;
  if (patient.briefDismissed) return patient;
  return updatePatient(patientId, { briefDismissed: true });
}

export function briefForDisplay(patient: Patient): Brief | null {
  if (!patient.brief || patient.briefDismissed || !patient.brief.suggested_action) return null;
  return patient.brief;
}

export function computeShoppingList(patient: Patient): string[] {
  const items = new Set<string>();
  for (const day of patient.weekPlan) {
    for (const meal of day.meals) items.add(meal.title);
  }
  for (const meal of patient.todayPlan) items.add(meal.title);
  return [...items];
}
