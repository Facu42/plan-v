import {beforeAll,afterAll,describe,expect,it} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import {randomUUID,createHash} from 'node:crypto';
let db:PGlite;const owner=randomUUID(),other=randomUUID(),user=randomUUID(),userB=randomUUID(),clinic=randomUUID(),clinicB=randomUUID(),patient=randomUUID(),patientB=randomUUID(),appointment=randomUUID();
const reminderText='Recordatorio de turno: tenés una consulta próxima. Revisá la fecha y confirmá o pedí un cambio en Plan V. Para dejar de recibir avisos por WhatsApp, respondé BAJA.';
const hash=createHash('sha256').update(reminderText).digest('hex'),starts=new Date(Date.now()+86400000+120000).toISOString(),until=new Date(Date.parse(starts)+600000).toISOString();
async function actor<T=Record<string,unknown>>(id:string,sql:string,p:unknown[]=[]){return db.transaction(async t=>{await t.exec('set local role authenticated');await t.query("select set_config('request.jwt.claim.sub',$1,true)",[id]);return(await t.query<T>(sql,p)).rows;});}
async function service<T=Record<string,unknown>>(sql:string,p:unknown[]=[]){return db.transaction(async t=>{await t.exec('set local role service_role');return(await t.query<T>(sql,p)).rows;});}
beforeAll(async()=>{db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;grant usage on schema auth,public to authenticated,service_role;
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
create table profiles(id uuid primary key,role text);create table nutritionists(id uuid primary key,user_id uuid,display_name text);
create table patients(id uuid primary key,user_id uuid,nutritionist_id uuid,archived_at timestamptz,deactivated_at timestamptz,anonymized_at timestamptz);
create table appointments(id uuid primary key,patient_id uuid,nutritionist_id uuid,starts_at timestamptz,status text,channel text,meet_url text);
create table consent_catalog(purpose text primary key,text_version text,text_hash text);
create table consent_events(patient_id uuid,purpose text,decision text,text_version text,text_hash text,sequence bigint generated always as identity);
create table notification_preferences(user_id uuid primary key,email boolean default false,updated_at timestamptz default clock_timestamp());`);
for(const[id,email]of[[owner,'owner@example.test'],[other,'other@example.test'],[user,'patient@example.test'],[userB,'patient-b@example.test']]){await db.query('insert into auth.users values($1,$2,now())',[id,email]);await db.query('insert into profiles values($1,$2)',[id,(id===owner||id===other)?'nutri':'paciente']);}
await db.query("insert into nutritionists values($1,$2,'Profesional A'),($3,$4,'Profesional B')",[clinic,owner,clinicB,other]);await db.query('insert into patients(id,user_id,nutritionist_id)values($1,$2,$3),($4,$5,$6)',[patient,user,clinic,patientB,userB,clinicB]);
await db.query("insert into appointments values($1,$2,$3,$4,'scheduled','video',null)",[appointment,patient,clinic,starts]);await db.exec("insert into consent_catalog values('care_relationship','care.v1',repeat('a',64))");for(const pid of[patient,patientB])await db.query("insert into consent_events(patient_id,purpose,decision,text_version,text_hash)values($1,'care_relationship','granted','care.v1',repeat('a',64))",[pid]);await db.query('insert into notification_preferences(user_id,email)values($1,true),($2,false)',[user,userB]);
await db.exec(await readFile(new URL('../../supabase/migrations/20261012120000_ops_capabilities.sql',import.meta.url),'utf8'));
await db.exec(await readFile(new URL('../../supabase/migrations/20261012123000_communications_channels.sql',import.meta.url),'utf8'));
await db.exec(`alter table patients add column created_at timestamptz default now()-interval '90 days';
create table consultation_completions(patient_id uuid,nutritionist_id uuid,completed boolean,appointment_starts_at timestamptz);
create table meal_logs(patient_id uuid,logged_at timestamptz);
create table habit_logs(patient_id uuid,logged_at timestamptz);
create table push_subscriptions(user_id uuid,endpoint text);`);
await db.exec(await readFile(new URL('../../supabase/migrations/20261031210000_bioimpedance_reviews.sql',import.meta.url),'utf8'));
await db.exec("insert into consent_catalog values('measurement','measurement.v1',repeat('b',64))");
await db.query("insert into consent_events(patient_id,purpose,decision,text_version,text_hash)values($1,'measurement','granted','measurement.v1',repeat('b',64))",[patient]);
},30000);afterAll(async()=>{await db?.close();});


describe('bioimpedancia revisada, RLS y permisos en PostgreSQL local',()=>{
 const input=()=>({id:randomUUID(),recorded_on:'2026-10-01',values:{weight_kg:68.5,body_fat_pct:25,muscle_kg:44,water_pct:52,visceral_fat:7},reviewed:true});
 it('bloquea paciente, otra profesional y medidas sin revisión',async()=>{
  await expect(actor(other,'select save_bioimpedance_review($1,$2)',[patient,input()])).rejects.toThrow();
  await expect(actor(user,'select save_bioimpedance_review($1,$2)',[patient,input()])).rejects.toThrow();
  await expect(actor(owner,'select save_bioimpedance_review($1,$2)',[patient,{...input(),reviewed:false}])).rejects.toThrow();
  await expect(actor(owner,'select save_bioimpedance_review($1,$2)',[patient,{...input(),values:{...input().values,water_pct:101}}])).rejects.toThrow();
 });
 it('guarda con autor y fecha, idempotente, sin lecturas ni escrituras cruzadas',async()=>{
  const p=input();await actor(owner,'select save_bioimpedance_review($1,$2)',[patient,p]);await actor(owner,'select save_bioimpedance_review($1,$2)',[patient,p]);
  const own=await actor<{reviewed_by:string}>(owner,'select * from bioimpedance_readings');expect(own).toHaveLength(1);expect(own[0].reviewed_by).toBe(owner);
  expect(await actor(other,'select * from bioimpedance_readings')).toHaveLength(0);
  await expect(actor(owner,'select save_bioimpedance_review($1,$2)',[patient,{...p,values:{...p.values,weight_kg:70}}])).rejects.toThrow();
  await expect(actor(owner,"update bioimpedance_readings set recorded_on=current_date")).rejects.toThrow();
 });
 it('permiso retirado impide nuevos guardados',async()=>{
  await db.query("insert into consent_events(patient_id,purpose,decision,text_version,text_hash)values($1,'measurement','withdrawn','measurement.v1',repeat('b',64))",[patient]);
  await expect(actor(owner,'select save_bioimpedance_review($1,$2)',[patient,input()])).rejects.toThrow();
 });
});
