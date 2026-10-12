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
 create table public.patients(id uuid primary key,nutritionist_id uuid,user_id uuid,deactivated_at timestamptz,anonymized_at timestamptz);
 create table public.appointments(id uuid primary key,patient_id uuid);
 create table public.consent_catalog(purpose text primary key,text_version text,text_hash text,body text,required boolean);
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
});
