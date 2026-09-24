export const EVAL_SET_VERSION = 'eval.v1';

export const EVAL_ISSUE_CODES = [
  'allergy',
  'restriction',
  'unknown_allergies',
  'missing_item',
  'missing_step',
  'missing_portion',
  'invalid_unit',
  'incomplete_draft',
  'xor',
  'date_range',
  'duplicate_slot',
  'time_exceeded',
  'stale_version',
  'privacy',
] as const;

export type EvalIssueCode = (typeof EVAL_ISSUE_CODES)[number];

export type EvalIssue = {
  code: EvalIssueCode;
  message: string;
  path?: string;
};

export type EvalResult = {
  set: typeof EVAL_SET_VERSION;
  blockers: EvalIssue[];
  warnings: EvalIssue[];
};

export type EvalHealth = {
  allergies: { state: 'unknown' | 'none' | 'reported'; items: string[] };
  restrictions: { state: 'unknown' | 'none' | 'reported'; items: string[] };
  cooking_time_minutes?: number | null;
};
