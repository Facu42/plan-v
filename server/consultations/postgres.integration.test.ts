import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
const a='00000000-0000-4000-a000-000000000001', b='00000000-0000-4000-a000-000000000002', patientUser='00000000-0000-4000-a000-000000000003', admin='00000000-0000-4000-a000-000000000004';
const patient='10000000-0000-4000-a000-000000000001', other='10000000-0000-4000-a000-000000000002', sid='20000000-0000-4000-a000-000000000001', tid='30000000-0000-4000-a000-000000000001';
let db: PGlite;
async function actor(user:string,sql:string,values:unknown[]=[]) { return db.transaction(async tx=>{ await tx.exec('set local role authenticated'); await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user]); return (await tx.query(sql,values)).rows; }); }
async function command(payload:unknown) { return actor(a,'select public.consultation_command($1,$2)',[patient,payload]); }
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create schema storage;
 grant usage on schema public,auth,storage to authenticated,service_role;
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 create table auth.users(id uuid primary key); create table public.nutritionists(id uuid primary key,user_id uuid);
 create table public.patients(id uuid primary key,nutritionist_id uuid,user_id uuid,deactivated_at timestamptz,anonymized_at timestamptz,archived_at timestamptz);
 create table public.appointments(id uuid primary key,patient_id uuid);
 create table public.consent_catalog(purpose text primary key,text_version text,text_hash text,body text,required boolean);
 insert into public.consent_catalog values('care_relationship','care.v1',repeat('a',64),'Atención ficticia',true);
 create table public.consent_events(sequence serial,patient_id uuid,purpose text,text_version text,text_hash text,decision text);
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create function public.can_care_for_patient(target uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.patients p join public.nutritionists n on n.id=p.nutritionist_id where p.id=target and n.user_id=auth.uid()) $$;
 create function public.is_own_patient(target uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.patients where id=target and user_id=auth.uid()) $$;
 grant execute on function public.can_care_for_patient(uuid),public.is_own_patient(uuid) to authenticated;
 insert into auth.users values('${a}'),('${b}'),('${patientUser}'),('${admin}');
 insert into public.nutritionists values('${a}','${a}'),('${b}','${b}');
 insert into public.patients(id,nutritionist_id,user_id) values('${patient}','${a}','${patientUser}'),('${other}','${b}',null);`);
 await db.exec(await readFile(new URL('../../supabase/migrations/20261011150000_consultation_sessions.sql',import.meta.url),'utf8'));
},60000);
afterAll(async()=>{await db?.close();});
describe('consultas SQL: dos consultorios, privacidad y recuperación',()=>{
 it('no hereda consentimientos de IA ni admite start grabado sin permiso',async()=>{
  await expect(command({action:'start',id:sid,source:'capture',recording_version:'consultation_recording.v1'})).rejects.toThrow();
  await db.query(`insert into public.consent_events(patient_id,purpose,text_version,text_hash,decision) select $1,purpose,text_version,text_hash,'granted' from public.consent_catalog`,[patient]);
  await command({action:'start',id:sid,source:'capture',recording_version:'consultation_recording.v1',microphone:true,remote_audio:false});
  expect((await actor(a,'select * from public.consultation_sessions'))).toHaveLength(1);
  for(const user of [b,patientUser,admin]) { expect(await actor(user,'select * from public.consultation_sessions')).toHaveLength(0); await expect(actor(user,'select public.consultation_command($1,$2)',[patient,{action:'draft',id:sid,expected_revision:1,draft:'Ataque'}])).rejects.toThrow(); }
 });
 it('publica copia revisada separada y bloquea escritura directa',async()=>{
  await command({action:'finish',id:sid,expected_revision:1,interrupted:false});
  await command({action:'draft',id:sid,expected_revision:2,draft:'Privado',transcript:'Transcripción privada'});
  await command({action:'publish',id:sid,expected_revision:3,summary:'Resumen revisado'});
  await command({action:'draft',id:sid,expected_revision:3,draft:'Otra nota privada'});
  const rows=await actor(patientUser,'select * from public.consultation_shared_summaries'); expect((rows[0] as {summary:string}).summary).toBe('Resumen revisado');
  expect(await actor(b,'select * from public.consultation_shared_summaries')).toEqual([]); expect(await actor(admin,'select * from public.consultation_shared_summaries')).toEqual([]);
  await expect(actor(a,'update public.consultation_sessions set draft=$1',['Directo'])).rejects.toThrow();
  await expect(command({action:'draft',id:sid,expected_revision:3,draft:'Viejo'})).rejects.toThrow();
 });
 it('bloquea chunk en sesión manualizada, reserva resumen sin duplicarlo, lease y CAS invalidan trabajador viejo',async()=>{
  await expect(actor(a,'select public.consultation_enqueue_chunk($1,$2,$3)',[patient,sid,{client_id:tid,index:0,duration_seconds:1,audio_sha256:'a'.repeat(64),consent_version:'ai_consultation.v1'}])).rejects.toThrow();
  await command({action:'summarize',id:sid,expected_revision:4,consent_version:'ai_consultation.v1'});
  await command({action:'summarize',id:sid,expected_revision:4,consent_version:'ai_consultation.v1'});
  expect((await db.query('select * from public.consultation_tasks')).rows).toHaveLength(1);
  const claim1=(await db.query<{t:{id:string;run_token:string}}>('select public.consultation_claim_task() t')).rows[0].t;
  await db.query("update public.consultation_tasks set lease_until=clock_timestamp()-interval '1 second' where id=$1",[claim1.id]);
  const claim2=(await db.query<{t:{id:string;run_token:string}}>('select public.consultation_claim_task() t')).rows[0].t;
  expect(claim2.run_token).not.toBe(claim1.run_token);
  expect((await db.query<{ok:boolean}>('select public.consultation_complete_task($1,$2,$3) ok',[claim1.id,claim1.run_token,'Viejo'])).rows[0].ok).toBe(false);
  await db.query(`insert into public.consent_events(patient_id,purpose,text_version,text_hash,decision) select $1,purpose,text_version,text_hash,'withdrawn' from public.consent_catalog where purpose='ai_consultation'`,[patient]);
  expect((await db.query<{ok:boolean}>('select public.consultation_complete_task($1,$2,$3) ok',[claim2.id,claim2.run_token,'No debe persistir'])).rows[0].ok).toBe(false);
  const session=(await db.query<{draft:string}>('select draft from public.consultation_sessions')).rows[0]; expect(session.draft).toBe('Otra nota privada');
  await expect(actor(patientUser,'select public.consultation_claim_task()')).rejects.toThrow();
 });
 it('ordena segmentos, rechaza reenvío distinto, guarda marcas de tiempo y encola resumen al finalizar',async()=>{
  await db.query(`insert into public.consent_events(patient_id,purpose,text_version,text_hash,decision) select $1,purpose,text_version,text_hash,'granted' from public.consent_catalog`,[patient]);
  const s2='20000000-0000-4000-a000-000000000002',c1='30000000-0000-4000-a000-000000000002',c2='30000000-0000-4000-a000-000000000003';
  await command({action:'start',id:s2,source:'upload',recording_version:'consultation_recording.v1'});
  for(const [id,index]of [[c1,0],[c2,1]]as const)await actor(a,'select public.consultation_enqueue_chunk($1,$2,$3)',[patient,s2,{client_id:id,index,duration_seconds:1,audio_sha256:'a'.repeat(64),consent_version:'ai_consultation.v1'}]);
  await expect(actor(a,'select public.consultation_enqueue_chunk($1,$2,$3)',[patient,s2,{client_id:c1,index:0,duration_seconds:1,audio_sha256:'b'.repeat(64),consent_version:'ai_consultation.v1'}])).rejects.toThrow();
  await db.exec("update public.consultation_tasks set status='queued' where status='uploading'");
  await command({action:'finish',id:s2,expected_revision:1,interrupted:false});
  for(let i=0;i<2;i++){const task=(await db.query<{t:{id:string;run_token:string;index:number}}>('select public.consultation_claim_task() t')).rows[0].t;await db.query('select public.consultation_complete_task($1,$2,$3,null,$4)',[task.id,task.run_token,task.index?'Segundo':'Primero',[{start:0,end:1,text:task.index?'Segundo':'Primero'}]]);}
  const stored=(await db.query<{transcript:string;duration_seconds:number}>('select transcript,duration_seconds from public.consultation_sessions where id=$1',[s2])).rows[0];expect(stored.transcript).toBe('Primero\nSegundo');expect(stored.duration_seconds).toBe(2);
  const summary=(await db.query<{kind:string;status:string}>('select kind,status from public.consultation_tasks where session_id=$1 and kind=$2',[s2,'summary'])).rows[0];expect(summary).toEqual({kind:'summary',status:'queued'});
  expect((await db.query<{segments:unknown[]}>('select segments from public.consultation_tasks where id=$1',[c1])).rows[0].segments).toHaveLength(1);
  const claimed=(await db.query<{t:{id:string;run_token:string;request_key:string}}>('select public.consultation_claim_task() t')).rows[0].t;
  await db.query('select public.consultation_complete_task($1,$2,$3,$4)',[claimed.id,claimed.run_token,'','Fallo controlado']);
  await command({action:'retry',id:s2,expected_revision:2,task_id:claimed.id});
  const retried=(await db.query<{t:{id:string;run_token:string;request_key:string}}>('select public.consultation_claim_task() t')).rows[0].t;
  expect(retried.request_key).not.toBe(claimed.request_key);
  await db.query("update public.consultation_tasks set lease_until=clock_timestamp()-interval '1 second' where id=$1",[retried.id]);
  const recovered=(await db.query<{t:{request_key:string}}>('select public.consultation_claim_task() t')).rows[0].t;
  expect(recovered.request_key).toBe(retried.request_key);
 });
 it('conserva120KB íntegros y espera todoslossegmentos sin gaps antes del resumen',async()=>{
  await db.query(`insert into public.consent_events(patient_id,purpose,text_version,text_hash,decision)select $1,purpose,text_version,text_hash,'granted' from public.consent_catalog`,[patient]);
  const id=crypto.randomUUID();await command({action:'start',id,source:'capture',recording_version:'consultation_recording.v1',microphone:true,remote_audio:true});
  const rows=[];for(let i=0;i<3;i++){const tid=crypto.randomUUID();await actor(a,'select public.consultation_enqueue_chunk($1,$2,$3)',[patient,id,{client_id:tid,index:i,duration_seconds:30,audio_sha256:'a'.repeat(64),consent_version:'ai_consultation.v1'}]);rows.push(tid);}
  await command({action:'finish',id,expected_revision:1,interrupted:false,expected_chunks:4});
  for(const tid of rows){const token=crypto.randomUUID();await db.query("update public.consultation_tasks set status='running',run_token=$2,lease_until=now()+interval '2 minutes' where id=$1",[tid,token]);await db.query('select public.consultation_complete_task($1,$2,$3)',[tid,token,'a'.repeat(40000)]);}
  expect((await db.query<{transcript:string;incomplete:boolean}>('select transcript,incomplete from public.consultation_sessions where id=$1',[id])).rows[0]).toEqual({transcript:['a'.repeat(40000),'a'.repeat(40000),'a'.repeat(40000)].join('\n'),incomplete:false});
  expect((await db.query("select id from public.consultation_tasks where session_id=$1 and kind='summary'",[id])).rows).toHaveLength(0);
  const tid=crypto.randomUUID();await actor(a,'select public.consultation_enqueue_chunk($1,$2,$3)',[patient,id,{client_id:tid,index:3,duration_seconds:1,audio_sha256:'a'.repeat(64),consent_version:'ai_consultation.v1'}]);const token=crypto.randomUUID();await db.query("update public.consultation_tasks set status='running',run_token=$2,lease_until=now()+interval '2 minutes' where id=$1",[tid,token]);await db.query('select public.consultation_complete_task($1,$2,$3)',[tid,token,'Último segmento']);expect((await db.query("select id from public.consultation_tasks where session_id=$1 and kind='summary'",[id])).rows).toHaveLength(1);
  await db.query("update public.consultation_tasks set status='succeeded' where session_id=$1 and kind='summary'",[id]);
 });
 it('no pide un resumen cuando todos los segmentos contienen sólo silencio',async()=>{
  const id=crypto.randomUUID();
  await command({action:'start',id,source:'upload',recording_version:'consultation_recording.v1'});
  for(let index=0;index<2;index++){
   const taskId=crypto.randomUUID(),token=crypto.randomUUID();
   await actor(a,'select public.consultation_enqueue_chunk($1,$2,$3)',[patient,id,{client_id:taskId,index,duration_seconds:1,audio_sha256:'a'.repeat(64),consent_version:'ai_consultation.v1'}]);
   await db.query("update public.consultation_tasks set status='running',run_token=$2,lease_until=now()+interval '2 minutes' where id=$1",[taskId,token]);
   await db.query('select public.consultation_complete_task($1,$2,$3)',[taskId,token,'']);
  }
  await command({action:'finish',id,expected_revision:1,interrupted:false,expected_chunks:2});
  expect((await db.query("select id from public.consultation_tasks where session_id=$1 and kind='summary'",[id])).rows).toHaveLength(0);
  expect((await db.query<{duration_seconds:number}>("select duration_seconds from public.consultation_sessions where id=$1",[id])).rows[0].duration_seconds).toBe(2);
 });
 it('persiste etapas privadas con CAS y liquida respuesta en la misma transacción',async()=>{
  await db.exec(await readFile(new URL('../../supabase/migrations/20261011140000_clinical_ai_budget.sql',import.meta.url),'utf8'));
  const id=crypto.randomUUID();await command({action:'start',id,source:'manual'});await command({action:'draft',id,expected_revision:1,draft:'',transcript:'Texto ficticio'});await command({action:'summarize',id,expected_revision:2,consent_version:'ai_consultation.v1'});
  const task=(await db.query<{id:string;request_key:string}>('select id,request_key from public.consultation_tasks where session_id=$1',[id])).rows[0];const token=crypto.randomUUID();await db.query("update public.consultation_tasks set status='running',run_token=$2,lease_until=now()+interval '2 minutes' where id=$1",[task.id,token]);
  expect((await db.query<{steps:unknown[]}>('select public.consultation_begin_summary($1,$2,$3)steps',[task.id,token,'a'.repeat(64)])).rows[0].steps).toEqual([]);
  const step={level:0,index:0,digest:'b'.repeat(64),text:'Resultado parcial ficticio'};
  expect((await db.query<{ok:boolean}>('select public.consultation_save_summary_step($1,$2,$3,$4)ok',[task.id,token,'a'.repeat(64),step])).rows[0].ok).toBe(true);
  expect((await db.query<{ok:boolean}>('select public.consultation_save_summary_step($1,$2,$3,$4)ok',[task.id,crypto.randomUUID(),'a'.repeat(64),step])).rows[0].ok).toBe(false);
  await expect(db.query('select public.consultation_save_summary_step($1,$2,$3,$4)',[task.id,token,'a'.repeat(64),{...step,text:'Sobrescribir'}])).rejects.toThrow();
  const key=`summary:${task.request_key}`,month=(await db.query<{month:string}>("select to_char(now()at time zone'America/Argentina/Buenos_Aires','YYYY-MM') as month")).rows[0].month;
  await db.query('select public.reserve_clinical_ai_budget($1,$2,$3)',[key,month,100]);const response={fingerprint:'c'.repeat(64),value:{summary:'Respuesta privada ficticia'}};
  expect((await db.query<{ok:boolean}>('select public.cache_clinical_provider_result($1,$2,$3,$4,$5,$6)ok',[key,100,task.id,token,2,response])).rows[0].ok).toBe(true);
  expect((await db.query<{status:string;response_cache:unknown}>('select status,response_cache from public.clinical_ai_spend where operation_key=$1',[key])).rows[0]).toEqual({status:'charged',response_cache:{...response,patient_id:patient,task_id:task.id}});
  await command({action:'draft',id,expected_revision:2,draft:'Edición profesional posterior'});expect((await db.query<{ok:boolean}>('select public.consultation_save_summary_step($1,$2,$3,$4)ok',[task.id,token,'a'.repeat(64),{...step,index:1}])).rows[0].ok).toBe(false);
  await expect(actor(patientUser,'select public.consultation_begin_summary($1,$2,$3)',[task.id,token,'a'.repeat(64)])).rejects.toThrow();await expect(actor(a,'select * from public.clinical_ai_spend')).rejects.toThrow();
 });
 it('retirar Atención cancela el procesamiento aun conservando permisos de IA y grabación',async()=>{
  const id=crypto.randomUUID();await command({action:'start',id,source:'manual'});await command({action:'draft',id,expected_revision:1,draft:'',transcript:'Texto ficticio'});await command({action:'summarize',id,expected_revision:2,consent_version:'ai_consultation.v1'});
  const task=(await db.query<{id:string}>('select id from public.consultation_tasks where session_id=$1',[id])).rows[0];
  await db.query("update public.consultation_tasks set status='running',run_token=$2,lease_until=now()+interval '2 minutes' where id=$1",[task.id,crypto.randomUUID()]);
  expect((await db.query<{ok:boolean}>('select public.consultation_worker_allowed($1)ok',[task.id])).rows[0].ok).toBe(true);
  await db.query("insert into public.consent_events(patient_id,purpose,text_version,text_hash,decision)select $1,purpose,text_version,text_hash,'withdrawn' from public.consent_catalog where purpose='care_relationship'",[patient]);
  expect((await db.query<{ok:boolean}>('select public.consultation_worker_allowed($1)ok',[task.id])).rows[0].ok).toBe(false);
  expect((await db.query<{status:string}>('select status from public.consultation_tasks where id=$1',[task.id])).rows[0].status).toBe('cancelled');
  await expect(command({action:'summarize',id,expected_revision:2,consent_version:'ai_consultation.v1'})).rejects.toThrow();
 });

});
