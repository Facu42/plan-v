import type { MealLog } from '../../types';

export type Step = 'capture' | 'analyzing' | 'review' | 'success';
export type CaptureMode = 'photo' | 'text';

export const MEAL_SLOTS = ['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena', 'Extra'] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export function mealLogWasKept(log: Pick<MealLog, 'foods' | 'macros' | 'analysis_status'>) {
  return log.analysis_status === 'failed' || (log.foods.length === 0 && !log.macros);
}

export const MEAL_KEPT_COPY = 'No pudimos estimar alimentos ni macros. Verónica lo revisará. Tu registro no se perdió.';

/** Momento de la comida más probable según la hora local (0 a 23). */
export function suggestSlot(hour: number): MealSlot {
  if (hour >= 5 && hour < 10) return 'Desayuno';
  if (hour >= 10 && hour < 12) return 'Colación';
  if (hour >= 12 && hour < 16) return 'Almuerzo';
  if (hour >= 16 && hour < 19) return 'Merienda';
  if (hour >= 19) return 'Cena';
  return 'Extra';
}

const plain = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Si viene un momento conocido se respeta; si no, se sugiere por la hora. */
export function resolveInitialSlot(defaultSlot: string | undefined, hour: number): MealSlot {
  const wanted = defaultSlot ? plain(defaultSlot) : '';
  return MEAL_SLOTS.find((slot) => plain(slot) === wanted) ?? suggestSlot(hour);
}

export const STEP_ORDER: readonly Step[] = ['capture', 'analyzing', 'review', 'success'];
export const STEP_LABELS: Record<Step, string> = {
  capture: 'Tu comida', analyzing: 'Análisis', review: 'Revisión', success: 'Listo',
};

export function stepProgress(step: Step) {
  const index = STEP_ORDER.indexOf(step);
  const total = STEP_ORDER.length;
  return { index, total, percent: Math.round(((index + 1) / total) * 100), label: STEP_LABELS[step] };
}

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_ERROR = 'Elegí una foto JPG, PNG o WebP de hasta 5 MB.';
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Devuelve el mensaje de error si la foto no sirve, o null si está bien. */
export function photoProblem(file: { size: number; type: string }): string | null {
  return file.size > MAX_PHOTO_BYTES || !PHOTO_TYPES.includes(file.type) ? PHOTO_ERROR : null;
}

export function analyzingMessages(mode: CaptureMode, hasPhoto: boolean): readonly string[] {
  const first = mode === 'photo' && hasPhoto ? 'Mirando tu plato…' : 'Leyendo tu descripción…';
  return [first, 'Estimando porciones…', 'Sumando proteínas, carbohidratos y grasas…', 'Armando tu resumen…'];
}

export function messageAt(messages: readonly string[], tick: number): string {
  return messages[((tick % messages.length) + messages.length) % messages.length];
}

type MacroGrams = { protein_g: number; carbs_g: number; fat_g: number; kcal?: number };

/** Porcentaje de las calorías que aporta cada macro (4, 4 y 9 kcal por gramo). */
export function macroShares({ protein_g, carbs_g, fat_g }: MacroGrams) {
  const protein = protein_g * 4;
  const carbs = carbs_g * 4;
  const fat = fat_g * 9;
  const total = protein + carbs + fat;
  if (total <= 0) return { protein: 0, carbs: 0, fat: 0 };
  const pct = (part: number) => Math.round((part / total) * 100);
  return { protein: pct(protein), carbs: pct(carbs), fat: pct(fat) };
}

/** Valor del conteo animado: sale rápido y frena al llegar (easeOutCubic). */
export function countAt(target: number, progress: number): number {
  const t = Math.min(1, Math.max(0, progress));
  return Math.round(target * (1 - Math.pow(1 - t, 3)));
}

export function confidenceLevel(confidence: number): 'high' | 'medium' | 'low' {
  return confidence >= 0.75 ? 'high' : confidence >= 0.45 ? 'medium' : 'low';
}

/** Por qué todavía no se puede analizar, o null si está todo listo. `consented` es null mientras cargan los permisos. */
export function captureProblem(input: { mode: CaptureMode; text: string; hasImage: boolean; consented: readonly string[] | null }): string | null {
  const { mode, text, hasImage, consented } = input;
  if (consented && !consented.includes('ai_meal_analysis')) return 'Activá el permiso de análisis con IA para continuar.';
  if (mode === 'photo' && consented && !consented.includes('meal_photo')) return 'Activá el permiso de fotos de comidas para subir una imagen.';
  if (mode === 'photo' && !hasImage && !text) return 'Subí una foto o contanos qué comiste en texto.';
  if (mode === 'text' && !text) return 'Describí qué comiste.';
  return null;
}
