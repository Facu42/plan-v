import {
  EVAL_VERSION,
  type AiEvaluation,
  type AiEvaluationFinding,
  type EvalFindingCode,
  type EvalFindingSeverity,
} from '../../src/types/ai-eval.js';
import type { AiJob, AiJobArtifact, AiJobContext, MenuProposal, RecipeProposal } from '../../src/types/ai-jobs.js';
import type { PlanSlot } from '../../src/types/plans.js';
import { hashAiJobContext } from './jobs-context.js';
import { AiJobError } from './repository.js';

const PLACEHOLDER = /completar|pendiente de revisi|contenido de demostraci|a completar/i;
const ZERO_QTY = /(?:^|[^\d.,])0(?:[.,]0+)?\s*(g|ml|kg|l|u|unidades?|cucharadas?|tazas?)\b/i;
const UNIT_MIX = /(?=.*\b\d+(?:[.,]\d+)?\s*g\b)(?=.*\b\d+(?:[.,]\d+)?\s*ml\b)/i;
const MISSING_QTY = /\b(c\/n|cantidad necesaria|a gusto)\b/i;
const MINUTES = /(\d{1,3})\s*(minutos?|min)\b/i;
const FREE_OF = /libre\s+de\s+([a-záéíóúüñ\s]{3,40})/gi;

function fold(value: string) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

function containsItem(haystack: string, item: string) {
  const needle = fold(item);
  if (needle.length < 3) return false;
  const hay = fold(haystack);
  if (needle.length >= 4) return hay.includes(needle);
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(hay);
}

function finding(code: EvalFindingCode, severity: EvalFindingSeverity, message: string, path?: string): AiEvaluationFinding {
  return path ? { code, severity, message, path } : { code, severity, message };
}

function corpus(parts: string[]) {
  return parts.filter(Boolean).join('\n');
}

function matchDeclared(label: 'allergy' | 'restriction', items: string[], text: string, path: string): AiEvaluationFinding[] {
  return items.filter((item) => containsItem(text, item)).map((item) => finding(
    label === 'allergy' ? 'allergy_hit' : 'restriction_hit',
    'block',
    label === 'allergy'
      ? `La propuesta menciona «${item}», declarado como alergia. No se guarda hasta que lo revises.`
      : `La propuesta menciona «${item}», declarado como restricción. No se guarda hasta que lo revises.`,
    path,
  ));
}

function unitFindings(lines: string[], path: string): AiEvaluationFinding[] {
  const found: AiEvaluationFinding[] = [];
  for (const [index, line] of lines.entries()) {
    const at = `${path}.${index}`;
    if (ZERO_QTY.test(line)) found.push(finding('zero_quantity', 'block', 'Hay una cantidad en cero. Completá la porción antes de guardar.', at));
    if (UNIT_MIX.test(line)) found.push(finding('unit_mix', 'warn', 'El mismo renglón mezcla g y ml. No se convierte sin densidad.', at));
    if (MISSING_QTY.test(line)) found.push(finding('missing_quantity', 'warn', 'Hay un ingrediente sin cantidad. Las compras y los macros quedan sin calcular.', at));
  }
  return found;
}

function timeFindings(text: string, cookingTime: number | null): AiEvaluationFinding[] {
  if (cookingTime == null) {
    return [finding('time_unknown', 'warn', 'No hay un tiempo de cocina declarado. La propuesta no se contrastó con la rutina.')];
  }
  const match = text.match(MINUTES);
  if (!match) return [];
  const minutes = Number(match[1]);
  if (!Number.isFinite(minutes) || minutes <= cookingTime) return [];
  return [finding('time_overrun', 'warn', `La propuesta habla de ${minutes} min y el tiempo disponible es ${cookingTime} min.`)];
}

function freeOfClaims(text: string, allergies: string[]): AiEvaluationFinding[] {
  const found: AiEvaluationFinding[] = [];
  for (const match of text.matchAll(FREE_OF)) {
    const claimed = match[1]?.trim() ?? '';
    const hit = allergies.find((item) => containsItem(claimed, item) || containsItem(item, claimed));
    if (hit) {
      found.push(finding('allergen_free_claim', 'block', `No se afirma «libre de ${hit}» por inferencia del modelo. Revisalo antes de guardar.`));
    }
  }
  return found;
}

function unknownFindings(context: AiJobContext): AiEvaluationFinding[] {
  const found: AiEvaluationFinding[] = [];
  if (context.allergies.state === 'unknown') {
    found.push(finding('allergies_unknown', 'warn', 'Las alergias siguen sin declarar. Completalas antes de publicar.'));
  }
  if (context.restrictions.state === 'unknown') {
    found.push(finding('restrictions_unknown', 'warn', 'Las restricciones siguen sin declarar. Completalas antes de publicar.'));
  }
  return found;
}

export function evaluateRecipeProposal(payload: RecipeProposal, context: AiJobContext): AiEvaluationFinding[] {
  const text = corpus([payload.title, payload.explanation, ...payload.ingredients, ...payload.steps, ...payload.warnings]);
  const found: AiEvaluationFinding[] = [
    ...unknownFindings(context),
    ...matchDeclared('allergy', context.allergies.items, text, 'recipe'),
    ...matchDeclared('restriction', context.restrictions.items, text, 'recipe'),
    ...freeOfClaims(text, context.allergies.items),
    ...unitFindings(payload.ingredients, 'ingredients'),
    ...timeFindings(corpus(payload.steps), context.cooking_time_minutes),
  ];
  if (PLACEHOLDER.test(text)) {
    found.push(finding('placeholder_content', 'warn', 'Hay texto de demostración o pendiente. Completalo antes de publicar.'));
  }
  return found;
}

export function evaluateMenuSlots(slots: { day: string; slot: string; title: string }[], context: AiJobContext): AiEvaluationFinding[] {
  const found: AiEvaluationFinding[] = [...unknownFindings(context)];
  const seen = new Set<string>();
  for (const item of slots) {
    const key = `${item.day}|${item.slot}`;
    if (seen.has(key)) found.push(finding('duplicate_slot', 'block', `Hay dos comidas en ${item.day} · ${item.slot}.`, key));
    seen.add(key);
    const text = item.title;
    found.push(...matchDeclared('allergy', context.allergies.items, text, key));
    found.push(...matchDeclared('restriction', context.restrictions.items, text, key));
    found.push(...freeOfClaims(text, context.allergies.items));
    if (PLACEHOLDER.test(text)) found.push(finding('placeholder_content', 'warn', 'Hay un título de demostración. Completalo antes de publicar.', key));
  }
  if (slots.length < 3) {
    found.push(finding('sparse_menu', 'warn', 'La semana quedó incompleta. Completá el resto antes de publicar.'));
  }
  found.push(...timeFindings(slots.map((item) => item.title).join('\n'), context.cooking_time_minutes));
  return found;
}

export function evaluateMenuProposal(payload: MenuProposal, context: AiJobContext): AiEvaluationFinding[] {
  return evaluateMenuSlots(payload.slots, context);
}

export function evaluateArtifact(artifact: AiJobArtifact | null, context: AiJobContext, storedHash?: string): AiEvaluation {
  const findings = !artifact
    ? []
    : artifact.kind === 'recipe'
      ? evaluateRecipeProposal(artifact.payload, context)
      : evaluateMenuProposal(artifact.payload, context);
  if (storedHash && storedHash !== hashAiJobContext(context)) {
    findings.unshift(finding('stale_context', 'block', 'El ingreso o el plan cambió. Generá una propuesta nueva para no guardar un contexto desactualizado.'));
  }
  return { version: EVAL_VERSION, findings };
}

export function assertCanApply(job: AiJob, context: AiJobContext, concurrent = false) {
  if (job.status !== 'succeeded' || !job.artifact) {
    throw new AiJobError(409, 'La propuesta todavía no está lista para guardar.');
  }
  if (concurrent) {
    throw new AiJobError(409, 'Ya hay una copia inédita del plan. Revisala o generá la propuesta sobre esa copia.');
  }
  const evaluation = evaluateArtifact(job.artifact, context, job.context_hash);
  const blocked = evaluation.findings.find((item) => item.severity === 'block');
  if (blocked) throw new AiJobError(409, blocked.message);
  return evaluation;
}

export function evaluatePlanSlots(slots: PlanSlot[], context: AiJobContext): AiEvaluation {
  return { version: EVAL_VERSION, findings: evaluateMenuSlots(slots, context) };
}
