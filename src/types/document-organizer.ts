import { z } from 'zod';
import { importOriginSchema } from './patient-import';
export const organizerCategory=z.enum(['history','study','plan']);
const exactOriginSchema=importOriginSchema.extend({file:z.string().min(1).max(120).refine(s=>Boolean(s.trim())&&!/[\\/]/.test(s))});
export const organizerItemSchema=z.object({text:z.string().min(2).max(3000),origin:exactOriginSchema,category:organizerCategory}).strict();
export const organizerInputSchema=z.object({request_key:z.uuid(),items:z.array(organizerItemSchema).min(1).max(40)}).strict().superRefine((v,ctx)=>{if(v.items.reduce((n,i)=>n+new TextEncoder().encode(i.text).length,0)>60000)ctx.addIssue({code:'custom',message:'Dividí el texto en lotes de hasta 60 KB.'});});
export const organizerProposalSchema=z.object({index:z.number().int().min(0).max(39),category:organizerCategory,heading:z.string().min(2).max(100).refine(v=>v.trim().length>=2)}).strict();
export type OrganizerItem=z.infer<typeof organizerItemSchema>;
export type OrganizerProposal=z.infer<typeof organizerProposalSchema>;
export type OrganizerReviewedItem=OrganizerItem&{heading:string};
export type OrganizerJob={id:string;patient_id:string;nutritionist_id:string;requested_by:string;request_key:string;source_hash:string;items:OrganizerItem[];status:'queued'|'running'|'review'|'reviewed'|'failed'|'cancelled'|'uncertain';stage:'queued'|'claimed'|'request_issued'|'generated';revision:number;run_token:string|null;operation_key:string|null;lease_until:string|null;attempts:number;proposals:OrganizerProposal[];reviewed:OrganizerProposal[];error:string|null;created_at:string;consent_version:'ai_document_import.v1'};
export function validateOrganizerProposals(value:unknown,items:OrganizerItem[],allowSubset=false):OrganizerProposal[]{
 const proposals=z.array(organizerProposalSchema).min(1).max(40).parse(value);
 if((!allowSubset&&proposals.length!==items.length)||new Set(proposals.map(p=>p.index)).size!==proposals.length||proposals.some(p=>!items[p.index]||!items[p.index].text.includes(p.heading)))throw new Error('La propuesta debe referenciar exclusivamente texto de las fuentes originales.');
 return proposals;
}
