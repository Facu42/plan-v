import {z} from 'zod';
export const importPurposeSchema=z.enum(['history','study','plan','measurement']);
export type ImportPurpose=z.infer<typeof importPurposeSchema>;
export const importEvidenceSchema=z.object({
 obtained_on:z.iso.date().refine(value=>value<=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires'}).format(new Date()),'La autorización no puede tener fecha futura.'),
 source:z.string().trim().min(3).max(500),document:z.object({file:z.string().trim().min(1).max(120).refine(value=>!/[\\/]/.test(value)),fingerprint:z.string().regex(/^[a-f0-9]{64}$/)}).strict(),
 purposes:z.array(importPurposeSchema).min(1).max(4).refine(values=>new Set(values).size===values.length),confirmed:z.literal(true),
}).strict();
export const importAuthorizationInputSchema=importEvidenceSchema.extend({request_key:z.uuid(),expected_revision:z.number().int().min(0)}).strict();
export const importAuthorizationRevokeSchema=z.object({request_key:z.uuid(),expected_revision:z.number().int().min(1),reason:z.string().trim().min(3).max(500),confirmed:z.literal(true)}).strict();
export type ImportEvidence=z.infer<typeof importEvidenceSchema>;
export type ImportAuthorizationInput=z.infer<typeof importAuthorizationInputSchema>;
export type ImportAuthorizationRevoke=z.infer<typeof importAuthorizationRevokeSchema>;
export type ImportAuthorizationState={patient_id:string;revision:number;account_linked:boolean;allowed:Record<ImportPurpose,boolean>;evidence:{id:string;patient_id:string;request_key:string;revision:number;decision:'granted'|'revoked';evidence:ImportEvidence|{reason:string};created_at:string}|null};
export type ImportedMeasurement={id:string;patient_id:string;kind:'weight'|'waist'|'hip';value:number;unit:'kg'|'lb'|'cm'|'in';recorded_on:string;origin:import('./patient-import').ImportOrigin;created_at:string};
