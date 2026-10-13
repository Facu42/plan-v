import { z } from 'zod';

export const importOriginSchema = z.object({
  file: z.string().trim().min(1).max(120).refine(s => !/[\\/]/.test(s)),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  sheet: z.string().max(80).optional(), page: z.number().int().min(1).max(40).optional(), row: z.number().int().min(1).max(100000).optional(),
}).strict();
export const importMeasurementSchema = z.object({
  kind: z.enum(['weight', 'waist', 'hip']), value: z.number().finite().positive().max(500),
  unit: z.enum(['kg', 'lb', 'cm', 'in']), date: z.iso.date(), origin: importOriginSchema,
}).strict().superRefine((m, ctx) => {
  if ((m.kind === 'weight') !== ['kg','lb'].includes(m.unit)) ctx.addIssue({ code: 'custom', message: 'Unidad incompatible con la medición.' });
  if (m.kind !== 'weight' && (m.value < 10 || m.value > 300)) ctx.addIssue({ code: 'custom', message: 'Revisá el perímetro.' });
  if (m.date > new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date())) ctx.addIssue({ code: 'custom', message: 'Fecha futura.' });
});
export const importHistorySchema = z.object({ category: z.enum(['history','study','plan']), text: z.string().trim().min(2).max(3000), origin: importOriginSchema }).strict();
export const importCandidateSchema = z.object({
  key: z.uuid(), name: z.string().trim().min(2).max(80), email: z.union([z.email().max(254), z.literal('')]),
  phone: z.string().trim().max(40), action: z.enum(['create','append','discard']), patient_id: z.string().max(80).nullable(),
  origins: z.array(importOriginSchema).min(1).max(200), measurements: z.array(importMeasurementSchema).max(200),
  history: z.array(importHistorySchema).max(40), reviewed: z.literal(true),
}).strict().superRefine((r, ctx) => {
  if (r.action === 'append' && !r.patient_id) ctx.addIssue({ code: 'custom', message: 'Elegí la ficha a incorporar.' });
  if (r.action === 'create' && (r.history.length || r.measurements.length)) ctx.addIssue({ code: 'custom', message: 'Primero creá el contacto y obtené el consentimiento clínico.' });
  const originKeys = new Set(r.origins.map(o => JSON.stringify(o)));
  if ([...r.history,...r.measurements].some(item => !originKeys.has(JSON.stringify(item.origin)))) ctx.addIssue({code:'custom',message:'El origen debe pertenecer al archivo y la fila revisados.'});
});
export const importBatchSchema = z.object({ id: z.uuid(), candidates: z.array(importCandidateSchema).min(1).max(100) }).strict();
export type ImportOrigin = z.infer<typeof importOriginSchema>;
export type ImportMeasurement = z.infer<typeof importMeasurementSchema>;
export type ImportCandidate = z.infer<typeof importCandidateSchema>;
export type ImportBatchInput = z.infer<typeof importBatchSchema>;
export type ImportResult = { key: string; status: 'created' | 'appended' | 'discarded' | 'duplicate' | 'error'; patient_id: string | null; message: string;clinical_pending?:boolean;clinical_digest?:string };
export type ImportBatch = ImportBatchInput & { results: ImportResult[]; created_at: string; status: 'review' | 'partial' | 'completed' };
export type ImportContact = { patient_id: string; name: string; email: string; phone: string };
export type ImportedHistory = {id:string;patient_id:string;category:'history'|'study'|'plan';body:string;origin:ImportOrigin;created_at:string};
