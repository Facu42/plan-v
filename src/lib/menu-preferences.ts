import { MAX_DIETARY_PREFERENCES, MAX_DIETARY_PREFERENCE_LENGTH } from '../types/ai-jobs';

export function menuPreferences(text: string): { values: string[]; error?: string } {
  const values = text.split('\n').map(line=>line.trim()).filter(Boolean);
  if (values.length>MAX_DIETARY_PREFERENCES) return {values,error:`Ingresá hasta ${MAX_DIETARY_PREFERENCES} preferencias, una por línea.`};
  const index = values.findIndex(line=>line.length>MAX_DIETARY_PREFERENCE_LENGTH);
  if (index>=0) return {values,error:`La preferencia ${index+1} supera los ${MAX_DIETARY_PREFERENCE_LENGTH} caracteres. Separala en varias líneas más cortas.`};
  return {values};
}
