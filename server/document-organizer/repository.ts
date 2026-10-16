import { randomUUID } from 'node:crypto';
import { getRequestDb,privilegedDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { currentCareConsents } from '../care/consents.js';
import { listConsentEvents } from '../intake/memory.js';
import { DEMO_NUTRITIONIST_ID,getPatient } from '../store.js';
import { organizerInputSchema,validateOrganizerProposals,type OrganizerJob,type OrganizerProposal } from '../../src/types/document-organizer.js';
import { documentSourceHash } from './source.js';
export type OrganizerScope={patientId:string;nutritionistId:string;requestedBy:string;persistent:boolean};
type MemoryJob=OrganizerJob&{ai_event:string;care_event:string};
export const organizerMemory=new Map<string,MemoryJob>();
export function organizerDbError(error:{code?:string}|null){if(!error)return;if(error.code==='42501')throw new CareError(403,'Necesitás una paciente vinculada con permiso específico de organización documental.');if(['40001','23505'].includes(error.code??''))throw new CareError(409,'El trabajo cambió. Recargá antes de revisar.');if(['22023','22P02','23514'].includes(error.code??''))throw new CareError(400,'Revisá fuentes, referencias y límite de texto.');if(['42P01','42883','PGRST202','PGRST205'].includes(error.code??''))throw new CareError(501,'La organización documental requiere su migración en este entorno.');throw new CareError(503,'No se pudo confirmar el trabajo. Las fuentes locales se conservan.');}
async function memoryEvents(patientId:string){const patient=getPatient(patientId),consents=await currentCareConsents(patientId,false);if(!patient?.has_account||patient.archived_at||patient.deactivated_at||patient.anonymized_at||!consents.consented.includes('care_relationship')||!consents.consented.includes('ai_document_import'))throw new CareError(403,'Primero vinculá la cuenta de la paciente y obtené su permiso específico de organización documental.');const events=listConsentEvents(patientId);return {ai_event:events.filter(e=>e.purpose==='ai_document_import').slice(-1)[0]!.id,care_event:events.filter(e=>e.purpose==='care_relationship').slice(-1)[0]!.id};}
export async function memoryOrganizerAllowed(job:OrganizerJob){try{if(job.nutritionist_id!==DEMO_NUTRITIONIST_ID)return false;const events=await memoryEvents(job.patient_id),stored=organizerMemory.get(job.id);return Boolean(stored&&stored.ai_event===events.ai_event&&stored.care_event===events.care_event);}catch{return false;}}
export async function enqueueOrganizer(scope:OrganizerScope,input:unknown):Promise<OrganizerJob>{
 const parsed=organizerInputSchema.safeParse(input);if(!parsed.success)throw new CareError(400,'Elegí hasta cuarenta fuentes con un máximo de 60 KB de texto.');const hash=documentSourceHash(parsed.data.items);
 if(scope.persistent){const result=await getRequestDb().rpc('document_organizer_enqueue',{target:scope.patientId,key_value:parsed.data.request_key,hash_value:hash,source_items:parsed.data.items});organizerDbError(result.error);return readOrganizer(scope,String(result.data));}
 if(scope.nutritionistId!==DEMO_NUTRITIONIST_ID)throw new CareError(403,'La paciente no pertenece a este consultorio.');const events=await memoryEvents(scope.patientId);
 const existing=[...organizerMemory.values()].find(j=>j.patient_id===scope.patientId&&j.nutritionist_id===scope.nutritionistId&&j.request_key===parsed.data.request_key);if(existing){if(existing.source_hash!==hash)throw new CareError(409,'Este pedido tiene otras fuentes.');return structuredClone(existing);}
 const job:MemoryJob={id:randomUUID(),patient_id:scope.patientId,nutritionist_id:scope.nutritionistId,requested_by:scope.requestedBy,request_key:parsed.data.request_key,source_hash:hash,items:structuredClone(parsed.data.items),status:'queued',stage:'queued',revision:1,run_token:null,operation_key:null,lease_until:null,attempts:0,proposals:[],reviewed:[],error:null,created_at:new Date().toISOString(),consent_version:'ai_document_import.v1',...events};organizerMemory.set(job.id,job);return structuredClone(job);
}
export async function readOrganizer(scope:OrganizerScope,id:string):Promise<OrganizerJob>{
 if(scope.persistent){const result=await getRequestDb().rpc('document_organizer_read',{job_id:id});organizerDbError(result.error);if(result.data.patient_id!==scope.patientId)throw new CareError(403,'El trabajo pertenece a otra ficha.');return result.data as OrganizerJob;}
 const job=organizerMemory.get(id);if(!job||job.patient_id!==scope.patientId||job.nutritionist_id!==scope.nutritionistId)throw new CareError(404,'Trabajo no encontrado.');return await memoryOrganizerAllowed(job)?structuredClone(job):{...structuredClone(job),status:'cancelled',items:[],proposals:[],reviewed:[],error:'El permiso o la asignación cambió.'};
}
export async function listOrganizer(scope:OrganizerScope,hash?:string):Promise<OrganizerJob[]>{
 if(scope.persistent){const result=await getRequestDb().rpc('document_organizer_list',{target:scope.patientId,hash_value:hash??null});organizerDbError(result.error);return result.data as OrganizerJob[];}
 return Promise.all([...organizerMemory.values()].filter(j=>j.patient_id===scope.patientId&&j.nutritionist_id===scope.nutritionistId&&(!hash||j.source_hash===hash)).sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,50).map(j=>readOrganizer(scope,j.id)));
}
export async function reviewOrganizer(scope:OrganizerScope,id:string,revision:number,choices:unknown):Promise<OrganizerJob>{
 const current=await readOrganizer(scope,id);if(current.status==='cancelled')throw new CareError(403,'El permiso cambió. No se aplicará la propuesta.');let proposals:OrganizerProposal[];try{proposals=validateOrganizerProposals(choices,current.items,true);}catch{throw new CareError(400,'Cada encabezado debe existir en su fuente; no agregues índices ni texto nuevo.');}
 if(scope.persistent){const result=await getRequestDb().rpc('document_organizer_review',{job_id:id,expected_revision:revision,choices:proposals});organizerDbError(result.error);return result.data as OrganizerJob;}
 const job=organizerMemory.get(id)!;if(job.revision!==revision||!['review','reviewed'].includes(job.status))throw new CareError(409,'La propuesta cambió. Recargá antes de revisar.');if(!await memoryOrganizerAllowed(job))throw new CareError(403,'El permiso cambió.');job.reviewed=proposals;job.status='reviewed';job.revision++;return structuredClone(job);
}
export async function organizerWorkerAllowed(job:OrganizerJob,persistent:boolean){if(persistent){const result=await privilegedDb().rpc('document_organizer_allowed',{job_id:job.id,token:job.run_token});organizerDbError(result.error);return result.data===true;}const current=organizerMemory.get(job.id);return Boolean(current?.status==='running'&&current.run_token===job.run_token&&Date.parse(current.lease_until??'')>Date.now()&&await memoryOrganizerAllowed(current));}
