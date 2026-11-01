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
await db.exec(await readFile(new URL('../../supabase/migrations/20261031200000_reactivation_campaigns.sql',import.meta.url),'utf8'));
},30000);afterAll(async()=>{await db?.close();});

describe('campañas: segmentos, bajas y cupo diario por consultorio',()=>{
 it('viene apagado y solamente su nutri puede activarlo y ver pacientes',async()=>{
  expect((await actor<{r:boolean}>(owner,'select ops_campaign_enabled($1) r',[clinic]))[0].r).toBe(false);
  await expect(actor(other,'select ops_configure_campaigns($1,true,1)',[clinic])).rejects.toThrow();
  await actor(owner,'select ops_configure_campaigns($1,true,1)',[clinic]);
  expect(await actor(other,"select * from ops_campaign_segment($1,'no_consultation',30)",[clinic])).toHaveLength(0);
 });
 it('consulta realizada y registro reciente excluyen sin leer contenido clínico',async()=>{
  expect(await actor(owner,"select * from ops_campaign_segment($1,'no_consultation',30)",[clinic])).toHaveLength(1);
  await db.query('insert into consultation_completions values($1,$2,true,now())',[patient,clinic]);
  expect(await actor(owner,"select * from ops_campaign_segment($1,'no_consultation',30)",[clinic])).toHaveLength(0);
  await db.query('insert into habit_logs values($1,now())',[patient]);
  expect(await actor(owner,"select * from ops_campaign_segment($1,'no_app_record',30)",[clinic])).toHaveLength(0);
  await db.exec('delete from habit_logs');
 });
 it('crea email idempotente, respeta baja al reclamar y no cruza consultorios',async()=>{
  const t=(await db.query<{id:string;content_hash:string}>('select id,content_hash from ops_email_templates order by id limit 1')).rows[0];
  const key=randomUUID();const args=[clinic,key,'no_app_record',30,'email',t.id,t.content_hash,[patient]];
  const one=(await actor<{r:string}>(owner,'select ops_create_campaign($1,$2,$3,$4,$5,$6,$7,$8) r',args))[0].r;
  expect((await actor<{r:string}>(owner,'select ops_create_campaign($1,$2,$3,$4,$5,$6,$7,$8) r',args))[0].r).toBe(one);
  expect(await actor(other,'select * from ops_campaigns')).toHaveLength(0);
  const id=(await db.query<{id:string}>('select id from ops_deliveries where campaign_id=$1',[one])).rows[0].id;
  await actor(user,'select ops_set_campaign_optout($1,true)',[patient]);
  expect((await service<{r:unknown}>('select ops_claim_delivery($1,$2) r',[clinic,id]))[0].r).toBeNull();
 });
 it('cupo compartido entre canales, reserva atómica y baja posterior bloquean antes de POST',async()=>{
  await actor(user,'select ops_set_campaign_optout($1,false)',[patient]);
  await db.query('insert into push_subscriptions values($1,$2)',[user,'https://fcm.googleapis.com/test']);
  const t=(await db.query<{id:string;content_hash:string}>('select id,content_hash from ops_email_templates order by id limit 1')).rows[0];
  for(const channel of ['push','email'])await actor(owner,'select ops_create_campaign($1,$2,$3,$4,$5,$6,$7,$8)',[clinic,randomUUID(),'no_app_record',30,channel,t.id,t.content_hash,[patient]]);
  const ids=(await db.query<{id:string}>("select id from ops_deliveries where state='queued' order by channel desc")).rows;
  const claim=(await service<{r:{token:string}}>('select ops_claim_delivery($1,$2) r',[clinic,ids[0].id]))[0].r;expect(claim).not.toBeNull();
  expect((await service<{r:unknown}>('select ops_claim_delivery($1,$2) r',[clinic,ids[1].id]))[0].r).toBeNull();
  await actor(user,'select ops_set_campaign_optout($1,true)',[patient]);
  expect((await service<{r:boolean}>('select ops_check_delivery($1,$2,$3) r',[clinic,ids[0].id,claim.token]))[0].r).toBe(false);
  await expect(actor(owner,'select ops_set_campaign_optout($1,false)',[patient])).rejects.toThrow();
 });
 it('cupo agotado y pausa rotan la cola y dejan avanzar otro consultorio',async()=>{
  await actor(user,'select ops_set_campaign_optout($1,false)',[patient]);
  const t=(await db.query<{id:string;content_hash:string}>('select id,content_hash from ops_email_templates order by id limit 1')).rows[0];
  const campaign=(await actor<{r:string}>(owner,'select ops_create_campaign($1,$2,$3,$4,$5,$6,$7,$8) r',[clinic,randomUUID(),'no_app_record',30,'email',t.id,t.content_hash,[patient]]))[0].r;
  const id=(await db.query<{id:string}>('select id from ops_deliveries where campaign_id=$1',[campaign])).rows[0].id;
  for(const paused of [false,true]){
   if(paused)await actor(owner,'select ops_configure_campaigns($1,false,1)',[clinic]);
   await db.query("update ops_deliveries set updated_at=now()-interval '1 day' where id=$1",[id]);
   expect((await service<{r:unknown}>('select ops_claim_delivery($1,$2) r',[clinic,id]))[0].r).toBeNull();
   expect((await db.query<{rotated:boolean}>("select updated_at>now()-interval '1 minute' rotated from ops_deliveries where id=$1",[id])).rows[0].rotated).toBe(true);
  }
  await actor(other,'select ops_configure_campaigns($1,true,1)',[clinicB]);
  await db.query('update notification_preferences set email=true where user_id=$1',[userB]);
  const b=(await actor<{r:string}>(other,'select ops_create_campaign($1,$2,$3,$4,$5,$6,$7,$8) r',[clinicB,randomUUID(),'no_app_record',30,'email',t.id,t.content_hash,[patientB]]))[0].r;
  const bid=(await db.query<{id:string}>('select id from ops_deliveries where campaign_id=$1',[b])).rows[0].id;
  expect((await service<{r:unknown}>('select ops_claim_delivery($1,$2) r',[clinicB,bid]))[0].r).not.toBeNull();
 });

});
