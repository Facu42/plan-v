/** Seed local v0 — no auth, no prod. Fuente: docs/contrato-ficha-cards.md + contrato-foto-macros.md */

export const vero = {
  id: 'nutri-vero',
  display_name: 'Verónica Trenti',
  initials: 'VT',
} as const;

export type SuggestedAction = 'mensaje' | 'ajuste_menu' | 'turno';
export type MealStatus = 'pending_review' | 'confirmed' | 'adjusted';
export type Stage = 'ingreso' | 'plan' | 'seguimiento' | 'alta';
export type Tone = 'peach' | 'lilac' | 'mint';

export type Brief = {
  suggested_action: SuggestedAction;
  up_next_title: string;
  up_next_body: string;
  draft_message: string | null;
};

export type TimelineEvent = {
  id: string;
  kind: 'meal_logged' | 'meal_missed' | 'habit' | 'reminder_fired' | 'appointment' | 'message';
  atLabel: string;
  title: string;
  body: string;
};

export type PatientSeed = {
  id: string;
  name: string;
  initials: string;
  tone: Tone;
  status: string;
  stage: Stage;
  goal: string;
  sensitive_hours: string;
  plan_b: string;
  next_focus: string;
  adherence_score: number;
  adherence_why: string;
  time: string;
  appointment: { when: string; duration: number; channel: string } | null;
  todayPlan: { slot: string; title: string }[];
  brief: Brief | null;
  timeline: TimelineEvent[];
  pendingReviewCount: number;
};

export const patients: PatientSeed[] = [
  {
    id: 'pat-sofia',
    name: 'Sofía R.',
    initials: 'SR',
    tone: 'peach',
    status: 'Atención',
    stage: 'seguimiento',
    goal: 'Comer con más regularidad',
    sensitive_hours: 'Después de las 20:30',
    plan_b: 'Tostada + huevo + palta',
    next_focus: 'Organización nocturna',
    // 0.50*(12/28) + 0.25*(3/7) + 0.25*(4/7) = 0.214 + 0.107 + 0.143 = 0.464 → 46
    // más logs confirmados de desayuno: 0.50*(16/28)=0.286 + 0.107 + 0.143 = 0.536 → 54
    // seed explícito 62, por qué en copy (no inflar con pending_review ni confidence 0.38)
    adherence_score: 62,
    adherence_why: '4 de 7 almuerzos confirmados. Agua 3/7 días. Cena de ayer en revisión (no suma).',
    time: 'hace 38 min',
    appointment: { when: 'Jueves · 14:30', duration: 45, channel: 'video' },
    todayPlan: [
      { slot: 'Almuerzo', title: 'Bowl tibio de pollo y vegetales' },
      { slot: 'Merienda', title: 'Tostada + huevo + palta' },
    ],
    brief: {
      suggested_action: 'mensaje',
      up_next_title: 'Mandarle un mensaje',
      up_next_body: 'Ayer no cargó el almuerzo y el agua quedó en 3/8. Un toque corto, no un sermón.',
      draft_message: 'Hola, vi que ayer se te escapó el almuerzo. ¿Lo resolvemos con el Plan B o lo pasamos a hoy?',
    },
    pendingReviewCount: 2,
    timeline: [
      { id: 's1', kind: 'meal_logged', atLabel: 'HOY', title: 'Cena · foto en revisión', body: '21:47 · estimación floja (0.38). Macros no entran al gauge.' },
      { id: 's2', kind: 'habit', atLabel: 'HOY', title: 'Energía baja', body: 'Check-in del paciente' },
      { id: 's3', kind: 'meal_logged', atLabel: 'HOY', title: 'Almuerzo · foto en revisión', body: '14:02 · estimación (0.62). Pendiente de Vero. Nota oculta al paciente.' },
      { id: 's4', kind: 'meal_missed', atLabel: 'AYER', title: 'Sin registro · almuerzo', body: '13:30 · slot planificado, sin meal_log' },
      { id: 's5', kind: 'habit', atLabel: 'AYER', title: 'Agua 3/8', body: 'value crudo' },
    ],
  },
  {
    id: 'pat-marina',
    name: 'Marina C.',
    initials: 'MC',
    tone: 'lilac',
    status: 'Plan B',
    stage: 'plan',
    goal: 'Sostener el Plan B sin improvisar de noche',
    sensitive_hours: 'Salida del trabajo · 18:00',
    plan_b: 'Yogur + fruta + puñado de nueces',
    next_focus: 'Merienda pre-armada',
    adherence_score: 72,
    adherence_why: '5 de 7 meriendas confirmadas. Usó Plan B 3 veces. Agua 5/7.',
    time: 'ayer',
    appointment: { when: 'Viernes · 11:00', duration: 30, channel: 'video' },
    todayPlan: [
      { slot: 'Almuerzo', title: 'Wrap de pollo y ensalada' },
      { slot: 'Merienda', title: 'Yogur + fruta + nueces (Plan B)' },
    ],
    brief: {
      suggested_action: 'ajuste_menu',
      up_next_title: 'Ajustar el menú',
      up_next_body: 'Plan B tres veces esta semana. Conviene dejar la merienda pre-armada en el slot, no reescribir sola.',
      draft_message: null,
    },
    pendingReviewCount: 1,
    timeline: [
      { id: 'm1', kind: 'meal_logged', atLabel: 'HOY', title: 'Merienda · foto en revisión', body: '17:40 · 0.58 · pendiente. Macros aún no suman adherencia.' },
      { id: 'm2', kind: 'meal_logged', atLabel: 'AYER', title: 'Merienda · Plan B confirmado', body: 'yogur, fruta, nueces · 280 kcal (adjusted)' },
      { id: 'm3', kind: 'habit', atLabel: 'AYER', title: 'Agua 6/8', body: 'value crudo' },
      { id: 'm4', kind: 'reminder_fired', atLabel: 'AYER', title: 'Recordatorio merienda', body: 'meal · 17:30. Alimenta el resumen; no es un nag.' },
    ],
  },
  {
    id: 'pat-lucia',
    name: 'Lucía F.',
    initials: 'LF',
    tone: 'mint',
    status: 'En ritmo',
    stage: 'seguimiento',
    goal: 'Mantener regularidad de almuerzos',
    sensitive_hours: 'Ninguno marcado',
    plan_b: 'Huevos revueltos + pan',
    next_focus: 'Seguir como viene',
    adherence_score: 88,
    adherence_why: '6 de 7 almuerzos confirmados. Agua 6/7. Sueño cargado 6/7.',
    time: 'ayer',
    appointment: { when: 'Jueves · 16:00', duration: 45, channel: 'presencial' },
    todayPlan: [
      { slot: 'Almuerzo', title: 'Milanesa de pollo y ensalada' },
      { slot: 'Merienda', title: 'Fruta + yogur' },
    ],
    brief: null,
    pendingReviewCount: 0,
    timeline: [
      { id: 'l1', kind: 'meal_logged', atLabel: 'HOY', title: 'Almuerzo · confirmado', body: 'milanesa de pollo, ensalada · 520 kcal' },
      { id: 'l2', kind: 'habit', atLabel: 'HOY', title: 'Agua 5/8', body: 'value crudo' },
      { id: 'l3', kind: 'habit', atLabel: 'AYER', title: 'Sueño 7 h', body: 'value crudo' },
      { id: 'l4', kind: 'appointment', atLabel: 'JUE', title: 'Turno presencial', body: '16:00 · 45 min · scheduled' },
    ],
  },
];

export function scoreBand(score: number): 0 | 1 | 2 | 3 {
  if (score >= 80) return 0;
  if (score >= 70) return 1;
  if (score >= 55) return 2;
  return 3;
}

export function gaugeLabel(score: number): string {
  if (score >= 80) return 'en ritmo';
  if (score >= 60) return 'irregular';
  return 'a mirar';
}

export const UP_NEXT_CTA: Record<SuggestedAction, string> = {
  mensaje: 'Preparar mensaje',
  ajuste_menu: 'Abrir el slot',
  turno: 'Abrir preparación',
};

export const STAGE_RAIL: Stage[] = ['ingreso', 'plan', 'seguimiento', 'alta'];
