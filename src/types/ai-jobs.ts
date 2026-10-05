import { z } from 'zod';
import { PLAN_SLOTS } from './plans.js';

export const AI_JOB_TYPES = ['recipe_draft', 'menu_draft'] as const;
export type AiJobType = (typeof AI_JOB_TYPES)[number];

export const AI_JOB_STATUSES = ['queued', 'running', 'succeeded', 'failed', 'cancelled', 'stale'] as const;
export type AiJobStatus = (typeof AI_JOB_STATUSES)[number];

export const RECIPE_PROMPT_VERSION = 'recipe_draft.v2';
export const MENU_PROMPT_VERSION = 'menu_draft.v2';

// Deja 30 s de margen para releer permisos/contexto y cerrar la reserva de 120 s.
export const AI_JOB_TIMEOUT_MS = 90_000;
export const AI_JOB_MAX_TOKENS = 8_000;
export const AI_JOB_MONTHLY_TOKEN_BUDGET = 200_000;
export const AI_JOB_MAX_ACTIVE = 3;
export const AI_JOB_LEASE_MS = 120_000;

const isoDate = z.iso.date();

export const aiJobEnqueueSchema = z.object({
  patient_id: z.string().trim().min(1).max(80),
  job_type: z.enum(AI_JOB_TYPES),
  title_hint: z.string().trim().max(150).optional(),
  period_start: isoDate.optional(),
  period_end: isoDate.optional(),
  slots: z.array(z.enum(PLAN_SLOTS)).min(1).max(6).optional(),
  dietary_preferences: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
}).strict().superRefine((value, ctx) => {
  if (value.job_type === 'menu_draft') {
    if (!value.period_start || !value.period_end) {
      ctx.addIssue({ code: 'custom', message: 'period', path: ['period_start'] });
    } else if (value.period_end < value.period_start ||
      (Date.parse(value.period_end) - Date.parse(value.period_start)) / 86_400_000 > 21) {
      ctx.addIssue({ code: 'custom', message: 'period', path: ['period_end'] });
    } else if (((Date.parse(value.period_end) - Date.parse(value.period_start)) / 86_400_000 + 1) * (value.slots?.length ?? 4) > 42) {
      ctx.addIssue({ code: 'custom', message: 'items', path: ['slots'] });
    }
  }
});

export type AiJobEnqueueInput = z.infer<typeof aiJobEnqueueSchema>;

export type AiJobArtifact = {
  id: string;
  kind: 'recipe_draft' | 'menu_draft' | 'replacement';
  payload: Record<string, unknown>;
  created_at: string;
};

export type AiJobView = {
  id: string;
  patient_id: string;
  job_type: AiJobType;
  status: AiJobStatus;
  model: string;
  prompt_version: string;
  context_hash: string;
  attempt: number;
  cost_tokens: number | null;
  error_code: string | null;
  warnings: string[];
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  applied_at: string | null;
  request: {
    title_hint: string | null;
    period_start: string | null;
    period_end: string | null;
    slots: string[];
    dietary_preferences?: string[];
    _write_base?: { plan_id?: string; recipe_id?: string; revision: string | null };
  };
  artifact: AiJobArtifact | null;
};
