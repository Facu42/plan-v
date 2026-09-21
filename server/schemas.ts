import { z } from 'zod';

export const foodItemSchema = z.object({
  name: z.string().trim().min(1).max(120),
  portion_est: z.number().min(0).max(10_000).nullable(),
  portion_unit: z.enum(['g', 'ml', 'u']),
  confidence: z.number().min(0).max(1),
});

export const macrosSchema = z.object({
  kcal: z.number().int().min(0).max(10_000),
  protein_g: z.number().int().min(0).max(1_000),
  carbs_g: z.number().int().min(0).max(1_000),
  fat_g: z.number().int().min(0).max(1_000),
});

export const mealAnalysisSchema = z.object({
  foods: z.array(foodItemSchema).max(8),
  macros: macrosSchema.nullable(),
  confidence: z.number().min(0).max(1),
  note_for_nutri: z.string(),
});

export const copilotBriefSchema = z.object({
  suggested_action: z.enum(['mensaje', 'ajuste_menu', 'turno']).nullable(),
  up_next_title: z.string().nullable(),
  up_next_body: z.string().nullable(),
  draft_message: z.string().nullable(),
  source_ids: z.array(z.string()),
  adherence_why: z.string(),
});

export const mealSlotSchema = z.enum(['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena', 'Extra']);

export const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;

export const menuSlotUpdateSchema = z.object({
  day: z.enum(WEEK_DAYS),
  slot: mealSlotSchema,
  title: z.string().trim().min(1).max(200),
});

export const menuSlotParamsSchema = z.object({
  day: z.enum(WEEK_DAYS),
  slot: mealSlotSchema,
});

const appointmentTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
  message: 'Hora inválida (HH:MM)',
});

const meetUrlSchema = z.string().trim().url({ protocol: /^https$/ }).max(500);

export const appointmentUpdateSchema = z.object({
  appointment: z.object({
    day: z.enum(WEEK_DAYS),
    time: appointmentTimeSchema,
    duration: z.number().int().min(10).max(180),
    channel: z.enum(['video', 'presencial']),
    meet_url: meetUrlSchema.optional(),
  }).nullable(),
});

export const appointmentRescheduleSchema = z.object({
  day: z.enum(WEEK_DAYS),
  time: appointmentTimeSchema,
});

export const appointmentConfirmSchema = z.object({
  reply: z.enum(['attending', 'needs_change']),
});

export const noticeCreateSchema = z.object({
  patientId: z.string().trim().min(1).max(80),
  kind: z.literal('reminder'),
  title: z.string().trim().min(1).max(120),
  detail: z.string().trim().min(1).max(400),
});

const billingDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}, { message: 'Fecha inválida' });

export const billingUpdateInputSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('pending') }),
  z.object({ status: z.literal('waived') }),
  z.object({ status: z.literal('active'), billing_until: billingDateSchema }),
]);

export const goalUpdateInputSchema = z.object({
  goal: z.string().trim().min(2).max(240),
  status: z.enum(['active', 'paused', 'completed']),
  progress: z.number().int().min(0).max(100),
  note: z.string().trim().max(500).optional(),
});

export const analyzeMealInputSchema = z.object({
  description: z.string().trim().min(1).max(1000).optional(),
  imageBase64: z.string().min(4).max(8_000_000).optional(),
  slot: mealSlotSchema,
  photoPreview: z.string().max(10_700_000).optional(),
  client_id: z.uuid().optional(),
}).refine((input) => Boolean(input.description || input.imageBase64), {
  message: 'Se requiere una descripción o imagen',
});

export const mealReviewInputSchema = z.object({
  status: z.enum(['confirmed', 'adjusted']),
  foods: z.array(foodItemSchema).min(1).max(8).optional(),
  macros: macrosSchema.nullable().optional(),
}).refine((input) => input.status === 'confirmed' || input.foods !== undefined || input.macros !== undefined, {
  message: 'Un ajuste requiere alimentos o macros',
});

export const messageInputSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  from: z.enum(['vero', 'patient']),
  suggested_by_ai: z.boolean().optional(),
  client_id: z.uuid().optional(),
});

export const messageReadSchema = z.object({
  reader: z.enum(['vero', 'patient']),
});

export const activityInputSchema = z.object({
  activity: z.string().trim().min(2).max(80),
  duration_minutes: z.number().int().min(1).max(600),
  intensity: z.enum(['suave', 'moderada', 'intensa']),
  note: z.string().trim().max(500).optional(),
});

export const RESOURCE_GUIDE_IDS = [
  'leer-plan-semanal',
  'registrar-comida',
  'compras-desde-plan',
  'contacto-nutricionista',
  'progreso-semanal',
  'actividad-autodeclarada',
] as const;

export const resourceGuideIdSchema = z.enum(RESOURCE_GUIDE_IDS);
export const resourceAssignmentInputSchema = z.object({
  resource_id: resourceGuideIdSchema,
  patient_ids: z.array(z.string().trim().min(1).max(120)).min(1).max(100),
}).refine((input) => new Set(input.patient_ids).size === input.patient_ids.length, {
  message: 'Los pacientes no pueden repetirse',
  path: ['patient_ids'],
});

export const habitUpdateInputSchema = z.object({
  hydration: z.number().int().min(0).max(8).optional(),
  energy: z.string().trim().min(1).max(80).nullable().optional(),
  sleep_minutes: z.number().int().min(0).max(1440).optional(),
}).refine((input) => input.hydration !== undefined || input.energy !== undefined || input.sleep_minutes !== undefined, {
  message: 'Se requiere al menos un hábito',
});

export const patientCreateInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  goal: z.string().trim().min(2).max(240),
});

export const patientProfileUpdateInputSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  status: z.string().trim().min(2).max(40).optional(),
  stage: z.enum(['ingreso', 'plan', 'seguimiento', 'alta']).optional(),
  sensitive_hours: z.string().trim().max(120).optional(),
  plan_b: z.string().trim().max(240).optional(),
  next_focus: z.string().trim().max(240).optional(),
}).refine((input) => Object.keys(input).length > 0, {
  message: 'Se requiere al menos un cambio',
});

export const patientArchiveInputSchema = z.object({
  archived: z.boolean(),
});

export const nutritionistSetupInputSchema = z.object({
  display_name: z.string().trim().min(2).max(120),
});

export const inviteIdParamSchema = z.string().uuid();

export const inviteAcceptInputSchema = z.object({
  invite_id: z.string().uuid(),
});

export const authRecoverInputSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
});

export const provisionNutritionistInputSchema = z.object({
  user_id: z.string().trim().min(1).max(80),
  display_name: z.string().trim().min(2).max(120),
  license: z.string().trim().max(80).nullable().optional(),
  monthly_fee_ars: z.number().int().positive().nullable().optional(),
});

export const PAGE_DEFAULT_LIMIT = 50;
export const PAGE_MAX_LIMIT = 100;
export const MESSAGE_PAGE_SIZE = 50;

export const listPageQuerySchema = z.object({
  limit: z.preprocess(
    (value) => (value === undefined || value === '' ? PAGE_DEFAULT_LIMIT : value),
    z.coerce.number().int().min(1).max(PAGE_MAX_LIMIT),
  ),
  offset: z.preprocess(
    (value) => (value === undefined || value === '' ? 0 : value),
    z.coerce.number().int().min(0).max(10_000),
  ),
});

export const intakeStepSchema = z.enum(['start', 'privacy', 'profile', 'intent', 'allergies', 'habits', 'review']);

export const intakePatchInputSchema = z.object({
  expected_revision: z.number().int().min(1),
  step: intakeStepSchema.optional(),
  payload: z.unknown().optional(),
});

export const intakeSubmitInputSchema = z.object({
  expected_revision: z.number().int().min(1),
});

export const consentDecisionInputSchema = z.object({
  purpose: z.enum([
    'care_relationship',
    'meal_photo',
    'clinical_document',
    'body_progress',
    'measurement',
    'ai_meal_analysis',
    'ai_menu_draft',
  ]),
  text_version: z.string().trim().min(3).max(80),
  text_hash: z.string().trim().min(16).max(128),
  decision: z.enum(['granted', 'withdrawn']),
});

export const clinicalNoteInputSchema = z.object({
  body: z.string().trim().min(2).max(4000),
});

export type MealAnalysis = z.infer<typeof mealAnalysisSchema>;
export type CopilotBrief = z.infer<typeof copilotBriefSchema>;
