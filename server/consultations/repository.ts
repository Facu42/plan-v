import { createHash,randomUUID } from 'node:crypto';
import { getRequestDb, privilegedDb } from '../db/supabase-client.js';
import { requireCareConsent } from '../care/consents.js';
import { CareError } from '../care/errors.js';
import { registerDemoState } from '../demo/state.js';
import { getPatient } from '../store.js';
import { decodeConsultationWav } from './audio.js';
import { commandMemory, consultationMemoryView, sessions, shared, tasks } from './memory.js';
import type { ConsultationCommand, ConsultationScope, ConsultationSession, ConsultationTask, ConsultationView } from '../../src/types/consultations.js';

export const AUDIO_BUCKET = 'consultation-audio-private';
export const memoryAudio = new Map<string, Uint8Array>();
registerDemoState('consultations', () => ({ sessions, shared, tasks, audio: memoryAudio }));
export function consultationDbError(error: {code?:string} | null) {
  if (!error) return;
  if (['42P01','42883','PGRST202','PGRST205'].includes(error.code ?? '')) throw new CareError(501, 'Las consultas requieren instalar su migración en este entorno.');
  if (error.code === '42501') throw new CareError(403, 'Revisá los permisos de la paciente antes de continuar.');
  if (error.code === 'PT404') throw new CareError(404, 'Consulta no encontrada.');
  if (['PT409','23505'].includes(error.code ?? '')) throw new CareError(409, 'La consulta cambió o tiene transcripciones pendientes. Recargá antes de continuar.');
  if (['22023','22P02','23514'].includes(error.code ?? '')) throw new CareError(400, 'Revisá los datos de la consulta.');
  throw new CareError(503, 'No se pudo confirmar el guardado de la consulta. Conservá los datos y reintentá.');
}
export async function consultationView(patientId:string, professional:boolean, persistent:boolean, offset=0,limit=50):Promise<ConsultationView & {has_more:boolean}> {
  if (!persistent) { const v=consultationMemoryView(patientId,professional); return {...v,sessions:v.sessions.slice(offset,offset+limit),shared:v.shared.slice(offset,offset+limit),has_more:v.sessions.length>offset+limit || v.shared.length>offset+limit}; }
  const db=getRequestDb();
  const [s,r,t]=await Promise.all([
    professional ? db.from('consultation_sessions').select('id,patient_id,nutritionist_id,appointment_id,source,status,revision,started_at,finished_at,duration_seconds,microphone,remote_audio,incomplete,transcript,draft,manual_transcript').eq('patient_id',patientId).order('started_at',{ascending:false}).order('id').range(offset,offset+limit) : Promise.resolve({data:[],error:null}),
    db.from('consultation_shared_summaries').select('*').eq('patient_id',patientId).order('published_at',{ascending:false}).order('id').range(offset,offset+limit),
    professional ? db.rpc('consultation_list_tasks',{target:patientId}) : Promise.resolve({data:[],error:null}),
  ]);
  consultationDbError(s.error); consultationDbError(r.error); consultationDbError(t.error);
  return {sessions:(s.data ?? []).slice(0,limit) as ConsultationSession[],shared:(r.data ?? []).slice(0,limit) as ConsultationView['shared'],tasks:t.data ?? [],has_more:(s.data?.length??0)>limit || (r.data?.length??0)>limit};
}
export async function commandConsultation(scope:ConsultationScope,input:ConsultationCommand,persistent:boolean) {
  if (input.action==='start' && input.source!=='manual') await requireCareConsent(scope.patientId,persistent,'consultation_recording');
  if (input.action==='summarize'||input.action==='retry') await requireCareConsent(scope.patientId,persistent,'ai_consultation');
  if(input.action==='retry'&&!persistent&&tasks.get(input.task_id)?.kind==='chunk')await requireCareConsent(scope.patientId,false,'consultation_recording');
  if (!persistent) return commandMemory(scope,input);
  const {data,error}=await getRequestDb().rpc('consultation_command',{target:scope.patientId,payload:input}); consultationDbError(error); return data as ConsultationSession;
}
export async function enqueueConsultationAudio(scope:ConsultationScope,sessionId:string,input:{client_id:string;index:number;audio:string;mime:'audio/wav';consent_version:'ai_consultation.v1'},persistent:boolean) {
  await requireCareConsent(scope.patientId,persistent,'consultation_recording'); await requireCareConsent(scope.patientId,persistent,'ai_consultation');
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(input.audio) || input.audio.length%4) throw new CareError(415,'El audio no tiene un formato válido.');
  const audio=Buffer.from(input.audio,'base64'); const {durationSeconds}=decodeConsultationWav(audio);
  const hash=createHash('sha256').update(audio).digest('hex'); let task:ConsultationTask;
  if (!persistent) {
    const s=sessions.get(sessionId); if (!s || s.patient_id!==scope.patientId || s.nutritionist_id!==scope.nutritionistId) throw new CareError(404,'Consulta no encontrada.');
    if (s.source==='manual' || s.manual_transcript) throw new CareError(409,'Esta consulta usa una transcripción manual.');
    const existing=[...tasks.values()].find(t=>t.session_id===sessionId && t.kind==='chunk' && t.index===input.index);
    if (existing && (existing.id!==input.client_id || existing.audio_sha256!==hash)) throw new CareError(409,'Ese segmento ya existe con otro contenido.');
    task=existing ?? {id:input.client_id,request_key:randomUUID(),session_id:sessionId,patient_id:scope.patientId,nutritionist_id:scope.nutritionistId,requested_by:scope.requestedBy,kind:'chunk',index:input.index,revision:1,status:'uploading',audio_path:`${scope.patientId}/${sessionId}/${input.client_id}.wav`,audio_sha256:hash,expires_at:new Date(Date.now()+7*86400000).toISOString(),duration_seconds:durationSeconds,run_token:null,lease_until:null,attempts:0,text:'',error:null,consent_version:'ai_consultation.v1'};
    tasks.set(task.id,task); if (task.status==='uploading') { memoryAudio.set(task.audio_path!,new Uint8Array(audio)); task.status='queued'; task.error=null; task.attempts=0; }
  } else {
    const {data,error}=await getRequestDb().rpc('consultation_enqueue_chunk',{target:scope.patientId,sid:sessionId,payload:{client_id:input.client_id,index:input.index,duration_seconds:durationSeconds,audio_sha256:hash,consent_version:input.consent_version}}); consultationDbError(error); task=data as ConsultationTask;
    if (task.status==='uploading') {
      const db=privilegedDb(); const upload=await db.storage.from(AUDIO_BUCKET).upload(task.audio_path!,audio,{contentType:'audio/wav',upsert:true});
      if (upload.error) throw new CareError(503,'No se pudo guardar el audio privado. Reintentá el mismo segmento.');
      // Authenticated consent is checked again before the server changes a reserved row to ready.
      await requireCareConsent(scope.patientId,true,'consultation_recording'); await requireCareConsent(scope.patientId,true,'ai_consultation');
      const saved=await db.from('consultation_tasks').update({status:'queued',error:null,attempts:0}).eq('id',task.id).eq('status','uploading'); consultationDbError(saved.error);
    }
  }
  return {task:{id:task.id,session_id:task.session_id,index:task.index,status:task.status==='uploading'?'queued':task.status}};
}

/** Only the internal worker uses this; audio is never exposed through a signed public URL. */
export async function cleanupExpiredConsultationAudio(limit=100) {
  const db=privilegedDb();
  const interrupted=await db.from('consultation_sessions').update({status:'finished',incomplete:true,finished_at:new Date().toISOString()}).eq('status','recording').lte('started_at',new Date(Date.now()-3*3600000).toISOString()); consultationDbError(interrupted.error);
  const {data,error}=await db.from('consultation_tasks').select('id,audio_path').not('audio_path','is',null).is('audio_deleted_at',null).lte('expires_at',new Date().toISOString()).limit(Math.min(limit,100)); consultationDbError(error);
  let deleted=0;
  for(const t of data??[]) {
    const result=await db.storage.from(AUDIO_BUCKET).remove([String(t.audio_path)]); if(result.error) continue;
    const updated=await db.from('consultation_tasks').update({audio_deleted_at:new Date().toISOString()}).eq('id',t.id); if(!updated.error) deleted++;
  }
  return deleted;
}

/** Called by the existing privacy-delete worker after deactivation, never by public routes. Clinical notes retain the existing clinical retention policy. */
export async function purgeConsultationAudioForPatient(patientId:string,persistent:boolean) {
  if(!persistent){const p=getPatient(patientId);if(!p?.deactivated_at)throw new CareError(403,'Primero debe confirmarse el retiro de la cuenta.');for(const t of tasks.values())if(t.patient_id===patientId){if(t.audio_path)memoryAudio.delete(t.audio_path);t.status='cancelled';t.text='';t.segments=[];t.run_token=null;t.lease_until=null;}return;}
  const db=privilegedDb();const p=await db.from('patients').select('deactivated_at,anonymized_at').eq('id',patientId).single();consultationDbError(p.error);
  if(!p.data?.deactivated_at&&!p.data?.anonymized_at)throw new CareError(403,'Primero debe confirmarse el retiro de la cuenta.');
  const cancel=await db.from('consultation_tasks').update({status:'cancelled',run_token:null,lease_until:null,text:'',segments:[]}).eq('patient_id',patientId);consultationDbError(cancel.error);
  for(;;){const pending=await db.from('consultation_tasks').select('id,audio_path').eq('patient_id',patientId).not('audio_path','is',null).is('audio_deleted_at',null).limit(100);consultationDbError(pending.error);if(!pending.data?.length)break;const removal=await db.storage.from(AUDIO_BUCKET).remove(pending.data.map(t=>String(t.audio_path)));if(removal.error)throw new CareError(503,'No se pudo completar el retiro del audio privado.');const done=await db.from('consultation_tasks').update({audio_deleted_at:new Date().toISOString()}).in('id',pending.data.map(t=>String(t.id)));consultationDbError(done.error);}
}
