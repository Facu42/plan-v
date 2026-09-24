import { z } from 'zod';

export const careDate = z.iso.date().refine(value => value <= new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date()), 'La fecha no puede ser futura');
export function careDateConstraintMessage(validity: { rangeOverflow: boolean; valueMissing: boolean }): string {
  if (validity.rangeOverflow) return 'La fecha no puede ser futura.';
  if (validity.valueMissing) return 'Elegí una fecha.';
  return '';
}
const note = z.string().trim().max(500).default('');
export const MEASUREMENT_KINDS = ['weight', 'waist', 'hip'] as const;
export type MeasurementKind = (typeof MEASUREMENT_KINDS)[number];
export const MEASUREMENT_SOURCES = ['patient', 'professional'] as const;
export type MeasurementSource = (typeof MEASUREMENT_SOURCES)[number];
export const MEASUREMENT_SOURCE_LABELS: Record<MeasurementSource, string> = { patient: 'Paciente', professional: 'Profesional' };
const measurementSource = z.enum(MEASUREMENT_SOURCES).default('patient');
const weightUnit = z.enum(['kg', 'lb']).default('kg');
const lengthUnit = z.enum(['cm', 'in']).default('cm');
export function isMeasurementKind(kind: string): kind is MeasurementKind {
  return (MEASUREMENT_KINDS as readonly string[]).includes(kind);
}
export function isMeasurementData(data: CareData): data is Extract<CareData, { kind: MeasurementKind }> {
  return isMeasurementKind(data.kind);
}
export function defaultMeasurementUnit(kind: MeasurementKind): 'kg' | 'cm' {
  return kind === 'weight' ? 'kg' : 'cm';
}
export const careDataSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('weight'), value: z.number().min(1).max(500), unit: weightUnit, source: measurementSource, note }).strict(),
  z.object({ kind: z.literal('waist'), value: z.number().min(10).max(300), unit: lengthUnit, source: measurementSource, note }).strict(),
  z.object({ kind: z.literal('hip'), value: z.number().min(10).max(300), unit: lengthUnit, source: measurementSource, note }).strict(),
  z.object({ kind: z.literal('activity'), activity: z.string().trim().min(2).max(80), minutes: z.number().int().min(1).max(600), intensity: z.enum(['suave','moderada','intensa']), kcal: z.number().int().min(0).max(10000).nullable(), note }).strict(),
  z.object({ kind: z.literal('body_photo'), path: z.string().min(1).max(250), note }).strict(),
  z.object({
    kind: z.literal('clinical_document'),
    path: z.string().min(1).max(250),
    mime: z.enum(['application/pdf','image/jpeg','image/png']),
    filename: z.string().trim().min(1).max(120).refine((value) => !/[\\/]/.test(value), 'Nombre de archivo inválido.'),
    document_kind: z.string().trim().max(80).default(''),
    note,
  }).strict(),
  z.object({ kind: z.literal('payment'), amount: z.number().positive().max(100000000), currency: z.enum(['ARS','USD']), method: z.enum(['transferencia','efectivo','tarjeta','otro']), reference: z.string().trim().max(120), note }).strict(),
  z.object({ kind: z.literal('menu_request'), target: z.string().trim().min(2).max(200), reason: z.string().trim().min(2).max(500), replacement: z.enum(['recipe','ingredient']) }).strict(),
]);
export const careInputSchema = z.object({ id: z.uuid(), recorded_on: careDate, data: careDataSchema }).strict();
export type CareData = z.infer<typeof careDataSchema>;
export type CareInput = z.infer<typeof careInputSchema>;
export type CareRecord = CareInput & { patient_id: string; created_at: string; reviewed_at: string | null };

export const carePreferencesSchema = z.object({
  weight: z.boolean(), waist: z.boolean(), activity: z.boolean(),
  water: z.boolean(), water_interval: z.number().int().min(30).max(240),
  rest: z.boolean(), rest_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
}).strict();
export type CarePreferences = z.infer<typeof carePreferencesSchema>;
export const DEFAULT_CARE_PREFERENCES: CarePreferences = { weight: false, waist: false, activity: false, water: true, water_interval: 120, rest: true, rest_time: '22:30' };

export const replacementRecipeSchema = z.object({
  title: z.string().trim().min(2).max(150),
  ingredients: z.array(z.string().trim().min(1).max(150)).min(1).max(20),
  steps: z.array(z.string().trim().min(1).max(400)).min(1).max(12),
  explanation: z.string().trim().min(2).max(800),
}).strict();
export type ReplacementRecipe = z.infer<typeof replacementRecipeSchema>;
export type CareReplacement = { id: string; patient_id: string; request_id: string; recipe: ReplacementRecipe; source: 'ai' | 'demo'; published_at: string | null; created_at: string };
export type Measurement = {
  id: string;
  patient_id: string;
  kind: MeasurementKind;
  value_numeric: number;
  unit: string;
  source: MeasurementSource;
  captured_on: string;
  created_at: string;
};
export type CareSnapshot = { records: CareRecord[]; preferences: CarePreferences; replacements: CareReplacement[]; consented: string[]; measurements: Measurement[]; source: 'memory' | 'supabase' };
export type CareAlert = { id: string; patient_id: string; patient_name: string; title: string; detail: string; target: 'ficha' | 'diario'; created_at: string };

export const CARE_DOCUMENT_KINDS = ['laboratorio', 'imagen', 'informe', 'otro'] as const;
export type CareDocumentKind = (typeof CARE_DOCUMENT_KINDS)[number];
export const CARE_DOCUMENT_KIND_LABELS: Record<CareDocumentKind, string> = {
  laboratorio: 'Laboratorio',
  imagen: 'Imagen',
  informe: 'Informe',
  otro: 'Otro',
};
export const CARE_LABELS: Record<CareData['kind'], string> = { weight: 'Peso semanal', waist: 'Cintura mensual', hip: 'Cadera', activity: 'Actividad física', body_photo: 'Archivo privado', clinical_document: 'Estudio clínico', payment: 'Pago registrado', menu_request: 'Revisar menú' };
export function describeMeasurement(entry: Measurement): string {
  return `${entry.value_numeric} ${entry.unit} · ${MEASUREMENT_SOURCE_LABELS[entry.source]}`;
}
export function describeCareRecord(record: CareRecord): string {
  const data = record.data;
  switch (data.kind) {
    case 'weight': return `${data.value} ${data.unit} · ${MEASUREMENT_SOURCE_LABELS[data.source]}`;
    case 'waist': return `${data.value} ${data.unit} · ${MEASUREMENT_SOURCE_LABELS[data.source]}`;
    case 'hip': return `${data.value} ${data.unit} · ${MEASUREMENT_SOURCE_LABELS[data.source]}`;
    case 'activity': return `${data.activity} · ${data.minutes} min${data.kcal === null ? '' : ` · ${data.kcal} kcal declaradas`}`;
    case 'body_photo': return 'Foto corporal privada';
    case 'clinical_document': {
      const kind = CARE_DOCUMENT_KINDS.includes(data.document_kind as CareDocumentKind)
        ? CARE_DOCUMENT_KIND_LABELS[data.document_kind as CareDocumentKind]
        : data.document_kind;
      return kind ? `${data.filename} · ${kind}` : data.filename;
    }
    case 'payment': return `${data.amount.toLocaleString('es-AR')} ${data.currency} · ${data.method}`;
    case 'menu_request': return `${data.target} · ${data.reason}`;
  }
}

export function dueCareReminders(records: CareRecord[], preferences: CarePreferences, today: string) {
  const latest = (kind: CareData['kind']) => records.filter(r => r.data.kind === kind).map(r => r.recorded_on).sort().slice(-1)[0];
  const weight = latest('weight'); const waist = latest('waist'); const activity = latest('activity');
  const elapsed = weight ? (Date.parse(today) - Date.parse(weight)) / 86400000 : Infinity;
  return [
    ...(preferences.weight && elapsed >= 7 ? [{ id: `weight:${today}`, title: 'Tu registro semanal de peso', detail: 'Podés registrar tu peso cuando te resulte cómodo.' }] : []),
    ...(preferences.waist && (!waist || waist.slice(0,7) < today.slice(0,7)) ? [{ id: `waist:${today.slice(0,7)}`, title: 'Tu registro mensual de cintura', detail: 'Este registro es opcional.' }] : []),
    ...(preferences.activity && activity !== today ? [{ id: `activity:${today}`, title: 'Movimiento de hoy', detail: 'Si hiciste actividad, podés anotarla con su duración.' }] : []),
  ];
}
