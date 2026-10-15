export const EVAL_VERSION = 'eval.v1' as const;

export const EVAL_FINDING_CODES = [
  'allergy_hit',
  'restriction_hit',
  'allergies_unknown',
  'restrictions_unknown',
  'allergen_free_claim',
  'duplicate_slot',
  'zero_quantity',
  'stale_context',
  'concurrent_edit',
  'placeholder_content',
  'missing_quantity',
  'unit_mix',
  'sparse_menu',
  'time_overrun',
  'time_unknown',
] as const;

export type EvalFindingCode = typeof EVAL_FINDING_CODES[number];
export type EvalFindingSeverity = 'block' | 'warn';

export type AiEvaluationFinding = {
  code: EvalFindingCode;
  severity: EvalFindingSeverity;
  message: string;
  path?: string;
};

export type AiEvaluation = {
  version: typeof EVAL_VERSION;
  findings: AiEvaluationFinding[];
};

export function hasBlockingEvaluation(evaluation?: AiEvaluation | null) {
  return (evaluation?.findings ?? []).some((item) => item.severity === 'block');
}
