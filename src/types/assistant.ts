/** Asistente IA de la cartera: preguntas sobre los pacientes del consultorio autenticado. */
export const ASSISTANT_SUGGESTIONS = [
  '¿Qué pacientes necesitan atención hoy?',
  'Resumime la adherencia de mi cartera',
  '¿A quién debería contactar esta semana?',
  '¿Quién tiene el ánimo más bajo?',
] as const;

export type AssistantIntent = 'attention_today' | 'adherence' | 'contact_week' | 'mood' | 'unsupported';
export type AssistantPriority = 'alta' | 'media';

/** Una tarjeta sólo propone abrir una pantalla: nunca envía ni agenda por sí misma. */
export type AssistantCard = {
  patient_id: string;
  patient_name: string;
  priority: AssistantPriority;
  reason: string;
  action: { label: string; href: string };
};

export type AssistantAnswer = {
  intent: AssistantIntent;
  question: string;
  summary: string;
  cards: AssistantCard[];
  /** Origen de los datos usados, para que la profesional pueda verificarlos. */
  sources: string[];
  notice: string;
  generated_at: string;
  source: 'memory' | 'supabase';
  /** 'ia' = resumen redactado por el modelo gratuito; 'reglas' = texto fijo del motor. */
  summary_by?: 'ia' | 'reglas';
};

export const ASSISTANT_QUESTION_MAX = 500;
export const ASSISTANT_NOTICE = 'El asistente usa sólo los datos de tu consultorio. Verificá siempre antes de actuar: nada se envía ni se agenda solo.';
