import { z } from 'zod';
import { careDate } from './care';
export const CLINICAL_METHODS=['segmental','kerr','bariatric'] as const;
export const methodReferenceSchema=z.object({id:z.uuid(),method:z.enum(CLINICAL_METHODS),title:z.string().trim().min(3).max(200),source_url:z.url({protocol:/^https$/}).max(500),notes:z.string().trim().min(3).max(1000),approved:z.literal(true)}).strict();
export type MethodReference=z.infer<typeof methodReferenceSchema>&{nutritionist_id:string;approved_at:string;active:boolean};
export const SEGMENTS=['arm_right','arm_left','trunk','leg_right','leg_left'] as const;
export const SEGMENT_LABELS={arm_right:'Brazo derecho',arm_left:'Brazo izquierdo',trunk:'Tronco',leg_right:'Pierna derecha',leg_left:'Pierna izquierda'};
export const segmentValueSchema=z.object({segment:z.enum(SEGMENTS),component:z.enum(['muscle','fat','water','impedance']),value:z.number().finite().min(0).max(100000),unit:z.enum(['kg','%','L','ohm']),original:z.string().trim().min(1).max(250)}).strict().refine(row=>
  (row.component==='impedance'?row.unit==='ohm':row.component==='water'?['L','%'].includes(row.unit):['kg','%'].includes(row.unit))&&(row.unit!=='%'||row.value<=100),
  'Revisá la unidad del componente y el porcentaje.');
export type SegmentValue=z.infer<typeof segmentValueSchema>;
export const laboratoryValueSchema=z.object({id:z.uuid(),name:z.string().trim().min(1).max(120),value:z.number().finite().nullable(),operator:z.enum(['','<','>','<=','>=']),unit:z.string().trim().max(40),range_text:z.string().trim().max(200),raw_value:z.string().trim().min(1).max(100),source_line:z.string().trim().min(1).max(500),page:z.number().int().min(1).max(40),reviewed:z.literal(true)}).strict();
export type LaboratoryValue=z.infer<typeof laboratoryValueSchema>;
const dataSchema=z.discriminatedUnion('kind',[
  z.object({kind:z.literal('laboratory'),document_id:z.uuid(),values:z.array(laboratoryValueSchema).min(1).max(200)}).strict(),
  z.object({kind:z.literal('segmental'),reference_id:z.uuid(),document_id:z.uuid().nullable(),device:z.string().trim().min(2).max(160),values:z.array(segmentValueSchema).min(1).max(30).refine(rows=>new Set(rows.map(row=>`${row.segment}:${row.component}:${row.unit}`)).size===rows.length,'Cada segmento/componente/unidad debe aparecer una sola vez.')}).strict(),
  z.object({kind:z.literal('kerr'),reference_id:z.uuid(),document_id:z.uuid().nullable(),weight_kg:z.number().positive().max(500),components_kg:z.object({skin:z.number().min(0).max(500).nullable(),adipose:z.number().min(0).max(500).nullable(),muscle:z.number().min(0).max(500).nullable(),bone:z.number().min(0).max(500).nullable(),residual:z.number().min(0).max(500).nullable()}).strict(),original_measurements:z.string().trim().min(2).max(3000),professional_results:z.literal(true)}).strict(),
  z.object({kind:z.literal('bariatric'),reference_id:z.uuid(),surgery_date:careDate.nullable(),surgery_type:z.string().trim().max(120),preop_kg:z.number().positive().max(500),current_kg:z.number().positive().max(500),reference_kg:z.number().positive().max(500).nullable(),symptoms:z.string().trim().max(2000),supplements:z.string().trim().max(2000),next_review:z.iso.date().nullable()}).strict(),
  z.object({kind:z.literal('study_order'),studies:z.array(z.string().trim().min(2).max(160)).min(1).max(40),reason:z.string().trim().max(1000),instructions:z.string().trim().max(2000)}).strict(),
]);
export const clinicalWorkspaceInputSchema=z.object({id:z.uuid(),recorded_on:careDate,data:dataSchema,note:z.string().trim().max(1000),reviewed:z.literal(true)}).strict();
export type ClinicalWorkspaceInput=z.infer<typeof clinicalWorkspaceInputSchema>;
export type ClinicalWorkspaceRecord=ClinicalWorkspaceInput&{patient_id:string;created_at:string;source?:ClinicalDocument|null;reference_snapshot?:MethodReference|null};
export type ClinicalDocument={id:string;patient_id:string;filename:string;mime:string;source_sha256:string;asset_id:string;created_at:string};
export const clinicalDocumentInputSchema=z.object({id:z.uuid(),filename:z.string().trim().min(1).max(120).refine(s=>!/[\\/]/.test(s)),source_sha256:z.string().regex(/^[a-f0-9]{64}$/),file:z.string().max(28000000)}).strict();
const brandHex=z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional();
export const clinicBrandSchema=z.object({name:z.string().trim().min(2).max(120),contact:z.string().trim().max(240),license:z.string().trim().max(120),logo:z.string().max(700000).nullable().refine(s=>s===null||/^data:image\/(png|jpeg);base64,[a-zA-Z0-9+/]+={0,2}$/.test(s),'Usá un logo PNG/JPG local.'),color:brandHex,accent:brandHex}).strict();
export type ClinicBrand=z.infer<typeof clinicBrandSchema>;
export type ClinicalWorkspaceSnapshot={records:ClinicalWorkspaceRecord[];documents:ClinicalDocument[];references:MethodReference[];brand:ClinicBrand|null};
