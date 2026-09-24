import { z } from 'zod';

export const INTAKE_SCHEMA_VERSION = 'intake.v1';

export const INTAKE_STEPS = [
  'start',
  'privacy',
  'profile',
  'intent',
  'allergies',
  'habits',
  'review',
] as const;

export type IntakeStep = (typeof INTAKE_STEPS)[number];
export type IntakeStatus = 'draft' | 'submitted' | 'reviewed';
export type HealthFactState = 'unknown' | 'none' | 'reported';

export const healthFactSchema = z.object({
  state: z.enum(['unknown', 'none', 'reported']),
  items: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
}).superRefine((value, ctx) => {
  if (value.state === 'reported' && value.items.length === 0) {
    ctx.addIssue({ code: 'custom', message: 'Declará al menos un alimento o restricción' });
  }
  if (value.state !== 'reported' && value.items.length > 0) {
    ctx.addIssue({ code: 'custom', message: 'Los ítems sólo aplican si hay algo declarado' });
  }
});

export const intakePayloadSchema = z.object({
  preferred_name: z.string().trim().max(40).default(''),
  phone: z.string().trim().max(30).nullable().optional(),
  timezone: z.string().trim().min(1).max(64).default('America/Argentina/Buenos_Aires'),
  patient_intent: z.string().trim().max(500).default(''),
  allergies: healthFactSchema.default({ state: 'unknown', items: [] }),
  restrictions: healthFactSchema.default({ state: 'unknown', items: [] }),
  prefers_to_discuss: z.boolean().default(false),
  conditions_note: z.string().trim().max(1000).default(''),
  cooking_time_minutes: z.number().int().min(0).max(300).nullable().optional(),
  hydration_glasses: z.number().int().min(0).max(20).nullable().optional(),
  sleep_hours: z.number().min(0).max(16).nullable().optional(),
  energy: z.enum(['Baja', 'Media', 'Alta']).nullable().optional(),
}).strict();

export type IntakePayload = z.infer<typeof intakePayloadSchema>;

export function emptyIntakePayload(): IntakePayload {
  return intakePayloadSchema.parse({});
}

export function parseIntakePayload(input: unknown) {
  return intakePayloadSchema.safeParse(input);
}

export function canSubmitIntakePayload(payload: IntakePayload): boolean {
  const name = payload.preferred_name.trim();
  return name.length >= 2 && name.length <= 40;
}
