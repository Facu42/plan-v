import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {encodeConsultationWav} from '../../src/lib/consultation-capture.js';
const state=vi.hoisted(()=>({rows:[] as Array<Record<string,unknown>>,audio:new Set<string>(),removed:[] as string[],removeFails:false,completeFails:false,claimed:false}));
vi.mock('../db/supabase-client.js',async()=>({
 ...await vi.importActual('../db/supabase-client.js'),isSupabaseEnabled:()=>true,
 privilegedDb:()=>({
  from(table:string){
   let patch:Record<string,unknown>|undefined;const filters:Array<[string,unknown]>=[];let expression='';
   const q={select:()=>q,update:(value:Record<string,unknown>)=>{patch=value;return q;},not:()=>q,is:()=>q,lte:()=>q,eq:(key:string,value:unknown)=>{filters.push([key,value]);return q;},or:(value:string)=>{expression=value;return q;},limit:()=>q,
    then(resolve:(value:unknown)=>unknown){
     let rows=table==='consultation_tasks'?state.rows:[];
     rows=rows.filter(row=>filters.every(([key,value])=>row[key]===value));
     if(expression)rows=rows.filter(row=>row.audio_deleted_at==null&&(Number(new Date(String(row.expires_at)))<=Date.now()||['succeeded','cancelled'].includes(String(row.status))));
     if(patch)for(const row of rows)Object.assign(row,patch);
     return Promise.resolve(resolve({data:rows,error:null}));
    }};return q;
  },
  async rpc(name:string,args:Record<string,unknown>){
   if(name==='consultation_claim_task'){if(state.claimed)return {data:null,error:null};state.claimed=true;return {data:{...state.rows[0]},error:null};}
   if(name==='consultation_worker_allowed')return {data:true,error:null};
   if(name==='consultation_complete_task'){
    if(state.completeFails)throw Error('local_db_failure');
    Object.assign(state.rows[0],{status:'succeeded',text:args.result_text});return {data:true,error:null};
   }
   return {data:true,error:null};
  },
  storage:{from:()=>({
   async download(path:string){const wav=encodeConsultationWav(new Float32Array(16000),16000);return {error:null,data:{arrayBuffer:async()=>wav.buffer}};},
   async remove(paths:string[]){if(state.removeFails)return {error:{message:'local_failure'}};for(const path of paths){state.audio.delete(path);state.removed.push(path);}return {error:null};},
  })},
 }),
}));
import {cleanupExpiredConsultationAudio} from './repository.js';
import {configureConsultationProcessing,runPendingConsultations} from './worker.js';
beforeEach(()=>{state.rows=[];state.audio.clear();state.removed=[];state.removeFails=false;state.completeFails=false;state.claimed=false;});
afterEach(()=>configureConsultationProcessing(undefined));
function task(status='running'){
 const row={id:'task-local',patient_id:'patient-local',nutritionist_id:'clinic-local',requested_by:'user-local',session_id:'session-local',kind:'chunk',request_key:'request-local',index:0,revision:1,status,run_token:'token-local',lease_until:new Date(Date.now()+120000).toISOString(),expires_at:new Date(Date.now()+86400000).toISOString(),audio_path:'patient-local/session-local/task.wav',audio_deleted_at:null,duration_seconds:1,text:''};
 state.rows.push(row);state.audio.add(row.audio_path);return row;
}
describe('borrado persistente de audio privado, sin proveedores reales',()=>{
 it('borra tras confirmar transcripción y conserva el texto guardado',async()=>{
  const row=task();configureConsultationProcessing({transcribeClinicalAudio:async()=>({text:'Transcripción ficticia',segments:[]}),summarizeClinicalText:vi.fn()});
  await runPendingConsultations(1);
  expect(row.status).toBe('succeeded');expect(row.text).toBe('Transcripción ficticia');expect(state.audio.size).toBe(0);expect(row.audio_deleted_at).toBeTruthy();
 });
 it('repara un fallo del almacenamiento sin volver a transcribir',async()=>{
  const row=task();state.removeFails=true;const transcribe=vi.fn(async()=>({text:'Resultado ficticio',segments:[]}));configureConsultationProcessing({transcribeClinicalAudio:transcribe,summarizeClinicalText:vi.fn()});
  await runPendingConsultations(1);expect(state.audio.size).toBe(1);expect(row.audio_deleted_at).toBeNull();expect(row.text).toBe('Resultado ficticio');
  state.removeFails=false;expect(await cleanupExpiredConsultationAudio()).toBe(1);
  expect(state.audio.size).toBe(0);expect(row.audio_deleted_at).toBeTruthy();expect(row.text).toBe('Resultado ficticio');expect(transcribe).toHaveBeenCalledTimes(1);
 });
 it('recupera borrados tras reinicio aun con vencimiento futuro y no toca pendientes',async()=>{
  const done=task('succeeded');done.text='Texto confirmado';const pending={...task('queued'),id:'pending-local',audio_path:'patient-local/session-local/pending.wav'};state.rows[1]=pending;state.audio.add(pending.audio_path);
  expect(await cleanupExpiredConsultationAudio()).toBe(1);expect(state.audio.has(done.audio_path)).toBe(false);expect(state.audio.has(pending.audio_path)).toBe(true);expect(done.text).toBe('Texto confirmado');expect(pending.audio_deleted_at).toBeNull();
 });
 it('conserva audio recuperable si no se pudo confirmar el guardado de la transcripción',async()=>{
  const row=task();state.completeFails=true;configureConsultationProcessing({transcribeClinicalAudio:async()=>({text:'Resultado todavía no confirmado',segments:[]}),summarizeClinicalText:vi.fn()});
  await runPendingConsultations(1).catch(()=>undefined);
  expect(state.audio.has(row.audio_path)).toBe(true);expect(row.audio_deleted_at).toBeNull();expect(row.text).toBe('');
 });
});
