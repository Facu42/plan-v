import { generateText } from 'ai';
import type { AssistantAnswer } from '../../src/types/assistant.js';
import { AIUnavailableError } from '../ai/errors.js';
import { logProviderFailure, resolveAiMode } from '../ai/mode.js';
import { getAiModel } from '../ai/provider.js';

export type AssistantAiContext = {
  intent: AssistantAnswer['intent'];
  total_cards: number;
  cards: Array<{ ref: string; priority: 'alta' | 'media'; reason: string }>;
};
export type SummaryGenerator = (system: string, prompt: string) => Promise<string>;
export type AssistantAnswerWithSummary = AssistantAnswer & { summary_by: 'ia' | 'reglas' };

const MAX_SUMMARY = 600;
/** El resumen no puede convertir la falta de registros en un juicio clínico. */
const FORBIDDEN = /riesgo|abandon|diagn[oó]st|patolog|trastorno|enfermedad|incumpl|grave|urgencia m[eé]dica/i;

const SYSTEM = `Sos el asistente del consultorio de una nutricionista en Argentina. Redactás en español rioplatense, en 1 a 3 oraciones, un resumen para la profesional a partir de una lista de pacientes identificados sólo como P1, P2, etc.
Reglas:
- Usá únicamente los motivos recibidos. No inventes datos, pacientes ni causas.
- No diagnostiques ni hables de riesgo, abandono o incumplimiento: la falta de registros es sólo falta de registros.
- No propongas enviar mensajes ni agendar por tu cuenta; sugerí qué revisar primero.
- Devolvé sólo el texto, sin listas ni comillas.`;

/** Contexto mínimo: sin nombres, teléfonos, ids, enlaces ni la pregunta libre de la profesional. */
export function buildAssistantAiContext(answer: AssistantAnswer): AssistantAiContext {
  return {
    intent: answer.intent,
    total_cards: answer.cards.length,
    cards: answer.cards.map((card, index) => ({ ref: `P${index + 1}`, priority: card.priority, reason: card.reason })),
  };
}

const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'Paciente';

/** Devuelve el texto final con nombres de pila, o null si no pasa los controles. */
function acceptSummary(text: string, answer: AssistantAnswer): string | null {
  const clean = text.trim().replace(/^["“]|["”]$/g, '');
  if (!clean || clean.length > MAX_SUMMARY || FORBIDDEN.test(clean)) return null;
  let invalid = false;
  const named = clean.replace(/\bP(\d{1,2})\b/g, (_match, digits: string) => {
    const card = answer.cards[Number(digits) - 1];
    if (!card) { invalid = true; return ''; }
    return firstName(card.patient_name);
  });
  return invalid ? null : named;
}

const liveGenerator: SummaryGenerator = async (system, prompt) => {
  const { text } = await generateText({ model: getAiModel(), system, prompt, abortSignal: AbortSignal.timeout(15_000) });
  return text;
};

/**
 * Las tarjetas siempre salen de reglas sobre datos del consultorio. La IA gratuita
 * (OPENROUTER_MODEL, sólo modelos :free) sólo redacta el resumen; ante cualquier
 * falla o texto no admitido se conserva el resumen por reglas.
 */
export async function withAiSummary(
  answer: AssistantAnswer,
  options: { mode?: 'demo' | 'disabled' | 'live'; generate?: SummaryGenerator } = {},
): Promise<AssistantAnswerWithSummary> {
  const fallback = { ...answer, summary_by: 'reglas' as const };
  if (!answer.cards.length) return fallback;
  let mode = options.mode;
  if (!mode) { try { mode = resolveAiMode(); } catch { return fallback; } }
  if (mode !== 'live') return fallback;
  try {
    const text = await (options.generate ?? liveGenerator)(SYSTEM, JSON.stringify(buildAssistantAiContext(answer)));
    const summary = acceptSummary(text, answer);
    return summary ? { ...answer, summary, summary_by: 'ia' } : fallback;
  } catch (error) {
    logProviderFailure('assistant', error instanceof AIUnavailableError ? error : new AIUnavailableError());
    return fallback;
  }
}
