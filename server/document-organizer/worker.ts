import { randomUUID } from 'node:crypto';
import { clinicalMemoryBudget,SupabaseClinicalBudget,type ClinicalBudget } from '../clinical-processing/budget.js';
import { isSupabaseEnabled,privilegedDb } from '../db/supabase-client.js';
import { createDocumentOrganizerProvider,OrganizerProcessingError } from './provider.js';
import { memoryOrganizerAllowed,organizerMemory,organizerDbError,organizerWorkerAllowed } from './repository.js';
import type { OrganizerJob,OrganizerProposal } from '../../src/types/document-organizer.js';
type Options={env?:Record<string,string|undefined>;fetch?:typeof fetch;budget?:ClinicalBudget};
async function claimMemory(budget:ClinicalBudget):Promise<OrganizerJob|null>{
 for(const current of organizerMemory.values()){
  if(current.status!=='queued'&&!(current.status==='running'&&Date.parse(current.lease_until??'')<Date.now()))continue;
  if(!await memoryOrganizerAllowed(current)){current.status='cancelled';current.proposals=[];current.reviewed=[];continue;}
  if(current.stage==='request_issued'){current.status='uncertain';current.error='Envío interrumpido: no se repetirá automáticamente.';continue;}
  if(current.attempts>=3&&current.stage!=='generated'){current.status='failed';current.error='No se pudo reservar el trabajo.';continue;}
  if(current.stage==='claimed'&&current.operation_key)try{await budget.settle(current.operation_key,'released',0);}catch{/* A prior settled charge is never released or replayed. */}
  current.status='running';current.run_token=randomUUID();current.lease_until=new Date(Date.now()+90000).toISOString();current.attempts++;
  if(current.stage!=='generated'){current.stage='claimed';current.operation_key=`organize:${current.id}:${current.run_token}`;}
  return structuredClone(current);
 }return null;
}
export async function runPendingDocumentOrganizer(limit=2,options:Options={}):Promise<number>{
 const persistent=isSupabaseEnabled(),budget=options.budget??(persistent?new SupabaseClinicalBudget():clinicalMemoryBudget);let processed=0;
 for(let i=0;i<Math.max(0,Math.min(limit,5));i++){
  let task:OrganizerJob|null;
  if(persistent){const result=await privilegedDb().rpc('document_organizer_claim');organizerDbError(result.error);task=result.data as OrganizerJob|null;}else task=await claimMemory(budget);
  if(!task)break;const job=task;let lost=false;
  const authorize=async()=>!lost&&await organizerWorkerAllowed(job,persistent);
  async function renew(){try{if(persistent){const result=await privilegedDb().rpc('document_organizer_renew',{job_id:job.id,token:job.run_token});if(result.error||result.data!==true)lost=true;}else if(await authorize())organizerMemory.get(job.id)!.lease_until=new Date(Date.now()+90000).toISOString();else lost=true;}catch{lost=true;}}
  const renewal=setInterval(()=>{void renew();},15000);
  async function issue(){if(!await authorize())return false;if(persistent){const result=await privilegedDb().rpc('document_organizer_issue',{job_id:job.id,token:job.run_token});organizerDbError(result.error);return result.data===true;}const current=organizerMemory.get(job.id)!;if(current.stage!=='claimed')return false;current.stage='request_issued';current.revision++;return true;}
  async function saveGenerated(_:OrganizerJob,proposals:OrganizerProposal[]){if(!await authorize())return false;if(persistent){const result=await privilegedDb().rpc('document_organizer_generated',{job_id:job.id,token:job.run_token,result_value:proposals});organizerDbError(result.error);return result.data===true;}const current=organizerMemory.get(job.id)!;if(current.stage!=='request_issued')return false;current.stage='generated';current.proposals=structuredClone(proposals);current.revision++;return true;}
  async function finish(failure:string|null){if(persistent){const result=await privilegedDb().rpc('document_organizer_finish',{job_id:job.id,token:job.run_token,failure});organizerDbError(result.error);return result.data===true;}const current=organizerMemory.get(job.id);if(!current||current.run_token!==job.run_token||current.status!=='running'||Date.parse(current.lease_until??'')<=Date.now())return false;if(!await memoryOrganizerAllowed(current))failure='cancelled';if(!failure&&current.stage!=='generated')return false;current.status=failure==='cancelled'||failure==='uncertain'?failure:failure?'failed':'review';current.error=failure;if(failure)current.proposals=[];current.run_token=null;current.lease_until=null;current.revision++;return true;}
  try{
   if(!await authorize()){await finish('cancelled');continue;}
   if(job.stage!=='generated')await createDocumentOrganizerProvider({...options,budget,authorize,markIssued:issue,saveGenerated}).organize(job);
   if(!lost&&await finish(null))processed++;
  }catch(error){if(!lost)await finish(error instanceof OrganizerProcessingError?error.code:'invalid');}
  finally{clearInterval(renewal);}
 }
 return processed;
}
