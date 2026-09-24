import { generateText, Output } from 'ai';
import { mealAnalysisSchema, type MealAnalysis } from '../schemas.js';
import { AIUnavailableError } from './errors.js';
import { logProviderFailure, resolveAiMode } from './mode.js';
import { getAiModel } from './provider.js';

const MEAL_SYSTEM = `Sos el analizador de comidas de Plan V (Argentina, español rioplatense).
Estimás alimentos y macros de una comida. No diagnosticás, no juzgás, no recetás.
Devolvé JSON válido según el schema.

Reglas:
- Máximo 8 ítems en foods. Nombres culinarios en minúsculas ("milanesa de pollo", no "poultry cutlet").
- portion_unit: "g", "ml" o "u". portion_est null si no se puede estimar.
- macros: enteros, coherentes con P/C/G (×4/4/9) ±10%. Si no hay porciones, macros null.
- confidence global 0-1 (no promedio de ítems). Baja si foto oscura, ángulo malo, plato mixto.
- note_for_nutri: 1-3 oraciones para la nutricionista. Qué se ve vs qué se adivina. Sin diagnóstico.
- Si confidence < 0.75, note_for_nutri es obligatoria.`;

function mockFromText(description: string, slot: string): MealAnalysis {
  const lower = description.toLowerCase();
  const hasProtein = /pollo|carne|huevo|pescado|atún|milanesa|prote/.test(lower);
  const hasCarbs = /arroz|pasta|pan|papa|quinoa|avena|fideos/.test(lower);
  const hasVeg = /ensalada|vegetal|verdura|brócoli|brocoli|zapallito|tomate/.test(lower);

  const foods = [
    ...(hasProtein ? [{ name: 'proteína principal', portion_est: 120, portion_unit: 'g' as const, confidence: 0.55 }] : []),
    ...(hasCarbs ? [{ name: 'acompañamiento con hidratos', portion_est: 150, portion_unit: 'g' as const, confidence: 0.5 }] : []),
    ...(hasVeg ? [{ name: 'vegetales', portion_est: 80, portion_unit: 'g' as const, confidence: 0.6 }] : []),
  ];

  if (foods.length === 0) {
    foods.push({ name: description.slice(0, 40).toLowerCase(), portion_est: 200, portion_unit: 'g', confidence: 0.42 });
  }

  const kcal = hasProtein && hasCarbs ? 480 : hasProtein ? 320 : 380;
  return {
    foods,
    macros: { kcal, protein_g: hasProtein ? 28 : 12, carbs_g: hasCarbs ? 45 : 30, fat_g: 14 },
    confidence: 0.58,
    note_for_nutri: `Descripción del paciente (${slot}): "${description.slice(0, 80)}". Estimación basada en texto; conviene confirmar porciones.`,
  };
}

function mockFromImage(slot: string): MealAnalysis {
  return {
    foods: [
      { name: 'pollo a la plancha', portion_est: 130, portion_unit: 'g', confidence: 0.72 },
      { name: 'quinoa', portion_est: 120, portion_unit: 'g', confidence: 0.68 },
      { name: 'vegetales asados', portion_est: 90, portion_unit: 'g', confidence: 0.65 },
      { name: 'palta', portion_est: 40, portion_unit: 'g', confidence: 0.7 },
    ],
    macros: { kcal: 520, protein_g: 38, carbs_g: 42, fat_g: 18 },
    confidence: 0.71,
    note_for_nutri: `Foto de ${slot}. Se ven proteína, cereal y vegetales. Aceite no visible; grasa puede estar subestimada.`,
  };
}

export const UNAVAILABLE_MEAL_NOTE =
  'La estimación automática no está disponible. El registro quedó pendiente de revisión profesional. No se usaron alimentos de demostración.';

export const UNAVAILABLE_MEAL_ANALYSIS: MealAnalysis = {
  foods: [],
  macros: null,
  confidence: 0,
  note_for_nutri: UNAVAILABLE_MEAL_NOTE,
};

export function analysisOrUnavailable(error: unknown): MealAnalysis {
  if (error instanceof AIUnavailableError) return UNAVAILABLE_MEAL_ANALYSIS;
  throw error;
}

export async function analyzeMeal(input: {
  description?: string;
  imageBase64?: string;
  slot: string;
  scheduledTitle?: string;
}): Promise<MealAnalysis> {
  const { description, imageBase64, slot, scheduledTitle } = input;
  const aiMode = resolveAiMode();

  if (aiMode === 'disabled') throw new AIUnavailableError();
  if (aiMode === 'demo') {
    if (description?.trim()) return mockFromText(description.trim(), slot);
    return mockFromImage(slot);
  }

  const userParts: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = [];

  let prompt = `Comida: ${slot}.`;
  if (scheduledTitle) prompt += ` Menú planificado: ${scheduledTitle}.`;
  if (description?.trim()) prompt += `\nDescripción del paciente: ${description.trim()}`;
  if (!imageBase64 && !description?.trim()) {
    prompt += '\nNo hay imagen ni descripción detallada; estimá con baja confianza.';
  }
  userParts.push({ type: 'text', text: prompt });

  if (imageBase64) {
    const mime = imageBase64.startsWith('/9j/') ? 'image/jpeg' : imageBase64.startsWith('UklGR') ? 'image/webp' : 'image/png';
    userParts.push({ type: 'image', image: `data:${mime};base64,${imageBase64}` });
  }

  try {
    const { output } = await generateText({
      model: getAiModel(),
      system: MEAL_SYSTEM,
      messages: [{ role: 'user', content: userParts }],
      output: Output.object({ schema: mealAnalysisSchema }),
      abortSignal: AbortSignal.timeout(20_000),
    });
    if (!output) throw new AIUnavailableError();
    return output;
  } catch (error) {
    logProviderFailure('meal-analyzer', error);
    throw error instanceof AIUnavailableError ? error : new AIUnavailableError();
  }
}
