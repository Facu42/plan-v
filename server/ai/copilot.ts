import { generateText, Output } from 'ai';
import { copilotBriefSchema, type CopilotBrief } from '../schemas.js';
import type { AppStore } from '../store.js';
import { AIUnavailableError } from './errors.js';
import { logProviderFailure, resolveAiMode } from './mode.js';
import { getAiModel } from './provider.js';

const COPILOT_SYSTEM = `Sos el copiloto de ficha de Plan V para Lic. Verónica Trenti (nutricionista, Argentina).
Generás Up next y adherence_why. No diagnosticás, no recetás, no hablás al paciente directamente.
Devolvé solo JSON válido.

Reglas:
- suggested_action ∈ mensaje | ajuste_menu | turno | null
- up_next_title fijo: "Mandarle un mensaje" | "Ajustar el menú" | "Proponer un turno" | null
- up_next_body ≤ 240 chars, tono profesional rioplatense, para Vero
- draft_message solo si action = mensaje. Habla como Vero, humano, no clínico-legal
- Si no hay nada accionable: suggested_action, up_next_title, up_next_body, draft_message = null
- adherence_why ≤ 160 chars con números y huecos. No recalcules el score.
- pending_review se menciona como "N fotos sin revisar". No es adherencia.`;

function mockBrief(patient: AppStore['patients'][0]): CopilotBrief {
  const pending = patient.meal_logs.filter((l) => l.status === 'pending_review').length;
  const score = patient.adherence_score;

  if (pending >= 2) {
    return {
      suggested_action: 'mensaje',
      up_next_title: 'Mandarle un mensaje',
      up_next_body: `${pending} fotos sin revisar. Un toque corto para retomar el registro, no un sermón.`,
      draft_message: `Hola, vi que tenés ${pending} comidas pendientes de revisar. ¿Las cargamos juntas hoy?`,
      source_ids: patient.meal_logs.filter((l) => l.status === 'pending_review').map((l) => l.id),
      adherence_why: `${score}/100. ${pending} en revisión (no suman). Revisar antes de cerrar la semana.`,
    };
  }

  if (score < 65) {
    return {
      suggested_action: 'ajuste_menu',
      up_next_title: 'Ajustar el menú',
      up_next_body: 'Adherencia baja esta semana. Conviene simplificar el slot problemático.',
      draft_message: null,
      source_ids: [],
      adherence_why: patient.adherence_why,
    };
  }

  if (pending === 0 && score >= 80) {
    return {
      suggested_action: null,
      up_next_title: null,
      up_next_body: null,
      draft_message: null,
      source_ids: [],
      adherence_why: patient.adherence_why,
    };
  }

  return {
    suggested_action: 'mensaje',
    up_next_title: 'Mandarle un mensaje',
    up_next_body: 'Hay señales de desvío esta semana. Un mensaje breve puede ayudar.',
    draft_message: `Hola, ¿cómo venís con el plan esta semana? Contame si necesitás ajustar algo.`,
    source_ids: [],
    adherence_why: patient.adherence_why,
  };
}

export async function generateCopilotBrief(patient: AppStore['patients'][0]): Promise<CopilotBrief> {
  const aiMode = resolveAiMode();
  if (aiMode === 'disabled') throw new AIUnavailableError();
  if (aiMode === 'demo') return mockBrief(patient);

  const pending = patient.meal_logs.filter((l) => l.status === 'pending_review');
  const confirmed = patient.meal_logs.filter((l) => l.status === 'confirmed' || l.status === 'adjusted');

  const context = `
paciente: ${patient.name}
stage: ${patient.stage}
status: ${patient.status}
goal: ${patient.goal}
adherence_score: ${patient.adherence_score} (no recalcular)
adherence_why actual: ${patient.adherence_why}
fotos_pending_review: ${pending.length}
comidas_confirmadas: ${confirmed.length}
agua_hoy: ${patient.hydration}/8
eventos recientes:
${patient.timeline.slice(0, 6).map((e) => `- ${e.title}: ${e.body}`).join('\n')}
meal_logs pendientes:
${pending.map((l) => `- ${l.slot}: confianza ${l.confidence}, nota: ${l.note_for_nutri}`).join('\n') || 'ninguno'}
`;

  try {
    const { output } = await generateText({
      model: getAiModel(),
      system: COPILOT_SYSTEM,
      prompt: context,
      output: Output.object({ schema: copilotBriefSchema }),
      abortSignal: AbortSignal.timeout(20_000),
    });
    if (!output) throw new AIUnavailableError();
    return output;
  } catch (error) {
    logProviderFailure('copilot', error);
    throw error instanceof AIUnavailableError ? error : new AIUnavailableError();
  }
}
