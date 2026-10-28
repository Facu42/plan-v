import { createHash } from 'node:crypto';

export const CONSENT_PURPOSES = [
  'care_relationship',
  'meal_photo',
  'clinical_document',
  'body_progress',
  'measurement',
  'ai_meal_analysis',
  'ai_menu_draft',
  'ai_followup',
  'consultation_recording',
  'ai_consultation',
  'ai_document_import',
  'ai_lab_reading',
] as const;

export type ConsentPurpose = (typeof CONSENT_PURPOSES)[number];
export type ConsentDecision = 'granted' | 'withdrawn';

export type ConsentText = {
  purpose: ConsentPurpose;
  text_version: string;
  title: string;
  text: string;
  required: boolean;
  text_hash: string;
};

const TEXTS: Array<Omit<ConsentText, 'text_hash'>> = [
  { purpose: 'consultation_recording', text_version: 'consultation_recording.v1', title: 'Grabación de consultas', text: 'Autorizo a mi nutricionista a grabar el audio de mis consultas en Plan V. No se guarda video. El audio es privado y se elimina a los siete días. La transcripción y las notas quedan en mi ficha. Puedo retirar este permiso y elegir notas manuales.', required: false },
  { purpose: 'ai_consultation', text_version: 'ai_consultation.v1', title: 'Transcripción y resumen con IA', text: 'Autorizo a Plan V a enviar el audio o la transcripción de mi consulta a Groq para transcribir y preparar un resumen. Puede contener datos de salud. El proveedor se configura sin retención de datos. Mi nutricionista revisa el borrador y decide qué compartir conmigo. Este permiso es opcional y puedo retirarlo.', required: false },
  {
    purpose: 'care_relationship',
    text_version: 'care_relationship.v1',
    title: 'Relación de atención',
    text: 'Autorizo a mi nutricionista de Plan V a ver los datos que yo registre para el acompañamiento nutricional. Puedo pedir exportación o retiro más adelante.',
    required: true,
  },
  {
    purpose: 'meal_photo',
    text_version: 'meal_photo.v1',
    title: 'Fotos de comidas',
    text: 'Puedo subir fotos de mis comidas para que mi nutricionista las revise. Son opcionales y las puedo dejar de usar.',
    required: false,
  },
  {
    purpose: 'clinical_document',
    text_version: 'clinical_document.v1',
    title: 'Estudios y análisis',
    text: 'Puedo compartir estudios en PDF o imagen. No se interpretan de forma automática.',
    required: false,
  },
  {
    purpose: 'body_progress',
    text_version: 'body_progress.v1',
    title: 'Fotos corporales',
    text: 'Las fotos corporales son opcionales, no se analizan con IA y no aparecen en listados ni avisos.',
    required: false,
  },
  {
    purpose: 'measurement',
    text_version: 'measurement.v1',
    title: 'Peso y medidas',
    text: 'Puedo cargar peso o medidas con fecha y unidad. Son autodeclarados y opcionales.',
    required: false,
  },
  {
    purpose: 'ai_meal_analysis',
    text_version: 'ai_meal_analysis.v1',
    title: 'Análisis de comidas con IA',
    text: 'Si subo una foto de comida, Plan V puede pedir una estimación a un proveedor de IA. El resultado queda pendiente de revisión profesional.',
    required: false,
  },
  {
    purpose: 'ai_menu_draft',
    text_version: 'ai_menu_draft.v1',
    title: 'Borradores de menú con IA',
    text: 'Mi nutricionista puede usar IA para proponer menús o recetas. Nada se publica ni se me envía sin su revisión.',
    required: false,
  },
  {
    purpose: 'ai_followup',
    text_version: 'ai_followup.v1',
    title: 'Copiloto de seguimiento con IA',
    text: 'Autorizo a Plan V a enviar a un proveedor externo de IA mis indicadores de adherencia, hidratación y cantidad de comidas registradas para preparar sugerencias y borradores de mensajes para mi nutricionista. No se envían mi nombre, notas clínicas ni mensajes. Nada se me envía sin revisión profesional. Este permiso es opcional y puedo retirarlo.',
    required: false,
  },
  { purpose: 'ai_document_import', text_version: 'ai_document_import.v1', title: 'Organización de documentos con IA', text: 'Autorizo a Plan V a enviar a Groq el texto de mis documentos ya extraído localmente para proponer categorías y encabezados de mi ficha. Puede contener datos de salud. El proveedor se configura sin retención de datos. No se inventan ni cambian valores o textos originales. Mi nutricionista revisa cada propuesta antes de incorporarla. Este permiso es opcional y puedo retirarlo; puedo continuar con organización manual.', required: false },
  { purpose: 'ai_lab_reading', text_version: 'ai_lab_reading.v1', title: 'Lectura de laboratorio con IA', text: 'Autorizo a Plan V a enviar a Groq los valores de mis análisis de laboratorio (estudio, valor, unidad, rango del informe y fecha) para preparar un borrador de lectura para mi nutricionista. No se envían mi nombre ni mis datos de contacto. Puede contener datos de salud. El proveedor se configura sin retención de datos. La IA no diagnostica ni indica tratamientos y mi nutricionista revisa el borrador antes de usarlo. Este permiso es opcional y puedo retirarlo; la lectura automática sin IA sigue disponible.', required: false },
];

export function hashConsentText(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export const CONSENT_CATALOG: ConsentText[] = TEXTS.map((entry) => ({
  ...entry,
  text_hash: hashConsentText(entry.text),
}));

export function consentTextByPurpose(purpose: ConsentPurpose): ConsentText {
  const found = CONSENT_CATALOG.find((entry) => entry.purpose === purpose);
  if (!found) throw new Error(`Unknown consent purpose: ${purpose}`);
  return found;
}

export function matchConsentVersion(input: {
  purpose: ConsentPurpose;
  text_version: string;
  text_hash: string;
}): ConsentText | null {
  const current = consentTextByPurpose(input.purpose);
  if (current.text_version !== input.text_version || current.text_hash !== input.text_hash) return null;
  return current;
}
