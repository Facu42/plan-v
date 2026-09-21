import { z } from 'zod';
import { recipeBodySchema } from './recipes';
import { PLAN_DAYS, PLAN_SLOTS } from './plans';
import type { AiEvaluation } from './ai-eval';

export const AI_JOB_TYPES = ['recipe', 'menu'] as const;
export const AI_JOB_STATUSES = ['queued', 'running', 'succeeded', 'failed', 'cancelled'] as const;
export type AiJobType = typeof AI_JOB_TYPES[number];
export type AiJobStatus = typeof AI_JOB_STATUSES[number];

export const RECIPE_PROMPT_VERSION = 'recipe.v1';
export const MENU_PROMPT_VERSION = 'menu.v1';
export const AI_JOB_MAX_ATTEMPTS = 2;
export const AI_JOB_MAX_OUTPUT_TOKENS = {
  recipe: 1200,
  menu: 2500,
} as const;
export const AI_JOB_TIMEOUT_MS = {
  recipe: 25_000,
  menu: 40_000,
} as const;

export const aiJobEnqueueSchema = z.object({
  id: z.uuid(),
  job_type: z.enum(AI_JOB_TYPES),
  focus: z.string().trim().max(200).optional(),
}).strict();

export const recipeProposalSchema = recipeBodySchema.extend({
  warnings: z.array(z.string().trim().min(1).max(240)).max(8).default([]),
}).strict();

export const menuProposalSchema = z.object({
  slots: z.array(z.object({
    day: z.enum(PLAN_DAYS),
    slot: z.enum(PLAN_SLOTS),
    title: z.string().trim().min(2).max(150),
  }).strict()).min(1).max(42),
  warnings: z.array(z.string().trim().min(1).max(240)).max(8).default([]),
}).strict();

export type RecipeProposal = z.infer<typeof recipeProposalSchema>;
export type MenuProposal = z.infer<typeof menuProposalSchema>;
export type AiJobEnqueue = z.infer<typeof aiJobEnqueueSchema>;

export type AiJobContext = {
  allergies: { state: 'unknown' | 'none' | 'reported'; items: string[] };
  restrictions: { state: 'unknown' | 'none' | 'reported'; items: string[] };
  cooking_time_minutes: number | null;
  catalog: string[];
  current_plan: { day: string; slot: string; title: string }[];
  period_start: string;
  focus: string | null;
};

export type AiJobArtifact =
  | { kind: 'recipe'; payload: RecipeProposal }
  | { kind: 'menu'; payload: MenuProposal };

export type AiJob = {
  id: string;
  patient_id: string;
  nutritionist_id: string;
  job_type: AiJobType;
  status: AiJobStatus;
  prompt_version: string;
  context_hash: string;
  attempt: number;
  cost_tokens: number | null;
  error_code: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  artifact: AiJobArtifact | null;
};

export type AiJobView = Omit<AiJob, 'nutritionist_id'> & {
  evaluation?: AiEvaluation;
};
