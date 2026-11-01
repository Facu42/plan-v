import { randomUUID } from 'node:crypto';
import { isSupabaseEnabled,privilegedDb } from '../db/supabase-client.js';
import { requireCareConsent } from '../care/consents.js';
import type { ConsultationScope,ConsultationTask,ConsultationSummaryStep } from '../../src/types/consultations.js';
import {clinicalTextDigest,hierarchicalConsultationSummary} from './summary.js';
import { sessions,tasks,commandMemory } from './memory.js';
import { AUDIO_BUCKET,consultationDbError,memoryAudio } from './repository.js';
import { decodeConsultationWav } from './audio.js';

export type ConsultationProcessingProvider = {
 transcribeClinicalAudio(input:{scope:ConsultationScope;taskId:string;requestKey:string;previousRequestKeys?:string[];runToken?:string;sessionId:string;revision:number;audio:Uint8Array;mime:'audio/wav';durationSeconds:number;consentVersion:'ai_consultation.v1'}):Promise<{text:string;segments:Array<{start:number;end:number;text:string}>}>;
 summarizeClinicalText(input:{scope:ConsultationScope;taskId:string;requestKey:string;previousRequestKeys?:string[];runToken?:string;sessionId:string;revision:number;text:string;summaryMode?:'part'|'final';consentVersion:'ai_consultation.v1'}):Promise<{summary:string}>;
};
let provider:ConsultationProcessingProvider|undefined;
export function configureConsultationProcessing(value:ConsultationProcessingProvider|undefined) { provider=value; }
function claimMemory():ConsultationTask|null {
 for(const t of tasks.values()) if(t.status==='queued'||(t.status==='running'&&Date.parse(t.lease_until??'')<Date.now())) {
  if(t.attempts>=5) {t.status='failed';t.error='Se interrumpió el procesamiento. Reintentá desde la ficha.';continue;}
  t.status='running';t.run_token=randomUUID();t.lease_until=new Date(Date.now()+120000).toISOString();t.attempts++;return structuredClone(t);
 } return null;
}
async function allowed(t:ConsultationTask,persistent:boolean) {
 if(persistent) {const r=await privilegedDb().rpc('consultation_worker_allowed',{task_id:t.id});consultationDbError(r.error);return r.data===true;}
 try {await requireCareConsent(t.patient_id,false,'care_relationship');await requireCareConsent(t.patient_id,false,'ai_consultation');if(t.kind==='chunk') await requireCareConsent(t.patient_id,false,'consultation_recording');return t.kind==='summary'||Date.parse(t.expires_at??'')>Date.now();}catch{return false;}
}
async function complete(t:ConsultationTask,text:string,error:string|null,persistent:boolean,segments:Array<{start:number;end:number;text:string}>=[]) {
 if(persistent) {const r=await privilegedDb().rpc('consultation_complete_task',{task_id:t.id,token:t.run_token,result_text:text,failure:error,result_segments:segments});consultationDbError(r.error);return r.data===true;}
 const current=tasks.get(t.id);const s=sessions.get(t.session_id);
 if(!current||!s||current.run_token!==t.run_token||current.status!=='running'||Date.parse(current.lease_until??'')<=Date.now()) return false;
 if(!await allowed(t,false)||(t.kind==='summary'&&s.revision!==t.revision)){current.status='cancelled';current.error='El permiso o la consulta cambió.';current.run_token=null;current.lease_until=null;return false;}
 current.status=error?'failed':'succeeded';current.error=error;current.text=error?'':text;current.segments=error?[]:segments;current.run_token=null;current.lease_until=null;
 if(error){if(t.kind==='chunk')s.incomplete=true;return false;}
 if(t.kind==='summary'){s.draft=text;s.revision++;}
 else if(!s.manual_transcript){const all=[...tasks.values()].filter(r=>r.session_id===s.id&&r.kind==='chunk'&&r.status==='succeeded').sort((a,b)=>a.index-b.index);const full=all.map(r=>r.text).join('\n');if(Buffer.byteLength(full)>1048576){s.incomplete=true;current.error='La transcripción supera 1 MB. Los segmentos se conservan para revisión.';}else s.transcript=full;s.duration_seconds=all.reduce((sum,r)=>sum+r.duration_seconds,0);}
 return true;
}
/** Persisted claims recover expired leases after restart. Provider calls are never emulated. */
export async function runPendingConsultations(limit=2) {
 if(!provider)return 0;
 const persistent=isSupabaseEnabled();let processed=0;
 if(!persistent) for(const s of sessions.values()) {
  if(s.status!=='finished'||s.source==='manual'||s.manual_transcript||s.draft||!s.transcript.trim())continue;
  const chunks=[...tasks.values()].filter(t=>t.session_id===s.id&&t.kind==='chunk');
  if(chunks.length&&chunks.every((t,i,rows)=>t.status==='succeeded'&&rows.some(r=>r.index===i))&&(s.expected_chunks==null||s.expected_chunks===chunks.length)&&!chunks.some(t=>t.error))try{await requireCareConsent(s.patient_id,false,'care_relationship');await requireCareConsent(s.patient_id,false,'ai_consultation');commandMemory({patientId:s.patient_id,nutritionistId:s.nutritionist_id,requestedBy:'demo'},{action:'summarize',id:s.id,expected_revision:s.revision,consent_version:'ai_consultation.v1'});}catch{/* Withdrawal keeps notes available. */}
 }
 for(let i=0;i<Math.min(limit,10);i++) {
  let t:ConsultationTask|null;
  if(persistent){const r=await privilegedDb().rpc('consultation_claim_task');consultationDbError(r.error);t=r.data as ConsultationTask|null;}else t=claimMemory();
  if(!t)break;
  let lost=false,transcribed=false,audioDisposable=false;
  const renewal=setInterval(()=>{void(async()=>{try{if(persistent){const r=await privilegedDb().rpc('consultation_renew_task',{task_id:t!.id,token:t!.run_token});if(r.error||r.data!==true)lost=true;}else{const current=tasks.get(t!.id);if(current?.run_token!==t!.run_token||current.status!=='running')lost=true;else current.lease_until=new Date(Date.now()+120000).toISOString();}}catch{lost=true;}})();},30000);
  try {
   if(!await allowed(t,persistent)){await complete(t,'','El permiso cambió. Revisá los permisos de la paciente.',persistent);continue;}
   const scope={patientId:t.patient_id,nutritionistId:t.nutritionist_id,requestedBy:t.requested_by};let text:string;let segments:Array<{start:number;end:number;text:string}>=[];
   if(t.kind==='chunk'){
    let audio:Uint8Array;
    if(persistent){const r=await privilegedDb().storage.from(AUDIO_BUCKET).download(t.audio_path!);if(r.error||!r.data)throw new Error('private_audio_unavailable');audio=new Uint8Array(await r.data.arrayBuffer());}else{const b=memoryAudio.get(t.audio_path!);if(!b)throw new Error('private_audio_unavailable');audio=b;}
    const {durationSeconds}=decodeConsultationWav(audio);if(Math.abs(durationSeconds-t.duration_seconds)>0.000001)throw new Error('audio_duration_mismatch');if(!await allowed(t,persistent)||lost)continue;
    const result=await provider.transcribeClinicalAudio({scope,taskId:t.id,requestKey:t.request_key,previousRequestKeys:t.request_history,runToken:t.run_token??undefined,sessionId:t.session_id,revision:t.index+1,audio,mime:'audio/wav',durationSeconds,consentVersion:'ai_consultation.v1'});text=result.text;transcribed=true;
    segments=result.segments.filter(s=>Number.isFinite(s.start)&&Number.isFinite(s.end)&&s.start>=0&&s.end>=s.start&&s.end<=durationSeconds+1&&typeof s.text==='string'&&s.text.length<=5000).slice(0,1000);
   }else{
    let transcript:string;
    if(persistent){const r=await privilegedDb().from('consultation_sessions').select('transcript,revision').eq('id',t.session_id).single();consultationDbError(r.error);if(!r.data||r.data.revision!==t.revision){await complete(t,'','La consulta cambió.',true);continue;}transcript=r.data.transcript;}else transcript=sessions.get(t.session_id)?.transcript??'';
    const sourceHash=clinicalTextDigest(transcript);
    const check=async()=>{if(lost||!await allowed(t!,persistent))throw new Error('stale_stage');if(!persistent&&sessions.get(t!.session_id)?.revision!==t!.revision)throw new Error('stale_revision');};
    await check();
    if(persistent){const r=await privilegedDb().rpc('consultation_begin_summary',{task_id:t.id,token:t.run_token,source_hash:sourceHash});consultationDbError(r.error);if(!r.data)throw new Error('stale_stage');t.summary_steps=r.data as ConsultationSummaryStep[];}
    else{const current=tasks.get(t.id)!;if(current.source_sha256&&current.source_sha256!==sourceHash)throw new Error('stale_source');current.source_sha256=sourceHash;t.summary_steps=structuredClone(current.summary_steps??[]);}
    text=await hierarchicalConsultationSummary({text:transcript,requestKey:t.request_key,steps:t.summary_steps??[],summarize:async(part,key,mode)=>{await check();return(await provider!.summarizeClinicalText({scope,taskId:t!.id,runToken:t!.run_token??undefined,requestKey:key,previousRequestKeys:(t!.request_history??[]).map(prior=>prior+key.slice(t!.request_key.length)),sessionId:t!.session_id,revision:t!.revision,text:part,summaryMode:mode,consentVersion:'ai_consultation.v1'})).summary;},save:async(step)=>{await check();if(persistent){const r=await privilegedDb().rpc('consultation_save_summary_step',{task_id:t!.id,token:t!.run_token,source_hash:sourceHash,step_value:step});consultationDbError(r.error);if(r.data!==true)throw new Error('stale_stage');}else{const current=tasks.get(t!.id)!;if(current.run_token!==t!.run_token||Date.parse(current.lease_until??'')<=Date.now())throw new Error('stale_lease');current.summary_steps=[...(current.summary_steps??[]),structuredClone(step)];}}});
   }
   // A successful transcription may contain silence. Only summaries require words.
   if((t.kind==='summary'&&!text.trim())||text.length>50000)throw new Error('invalid_provider_result');
   if(!lost){const saved=await complete(t,text,null,persistent,segments);audioDisposable=saved||!await allowed(t,persistent);} processed++;
  }catch{
   if(!lost)await complete(t,'','No se pudo procesar con IA. Revisá la configuración, el presupuesto o los permisos y reintentá.',persistent);
  }finally{
   clearInterval(renewal);
   if(transcribed&&audioDisposable&&t.audio_path){
    if(!persistent)memoryAudio.delete(t.audio_path);
    else {
     // Mark due before deletion so the existing cleanup job repairs a storage failure.
     const db=privilegedDb();
     const due=await db.from('consultation_tasks').update({expires_at:new Date().toISOString()}).eq('id',t.id).eq('nutritionist_id',t.nutritionist_id);
     consultationDbError(due.error);
     const removed=await db.storage.from(AUDIO_BUCKET).remove([t.audio_path]);
     if(!removed.error){const marked=await db.from('consultation_tasks').update({audio_deleted_at:new Date().toISOString()}).eq('id',t.id).eq('nutritionist_id',t.nutritionist_id);consultationDbError(marked.error);}
    }
   }
  }
 }
 return processed;
}
