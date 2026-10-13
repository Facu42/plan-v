import {beforeAll,afterAll,describe,expect,it} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {schedulingDefaultSettings} from '../../src/types/scheduling.js';
let db:PGlite,nid:string,other:string;const owner=randomUUID(),delegate=randomUUID(),patient=randomUUID(),booking=randomUUID();
async function actor<T=Record<string,unknown>>(user:string,sql:string,args:unknown[]=[]){return db.transaction(async tx=>{await tx.exec('set local role authenticated');await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);return (await tx.query<T>(sql,args)).rows;});}
async function service<T=Record<string,unknown>>(sql:string,args:unknown[]=[]){return db.transaction(async tx=>{await tx.exec('set local role service_role');return (await tx.query<T>(sql,args)).rows;});}
beforeAll(async()=>{
 db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;grant usage on schema public,auth,storage to authenticated,anon,service_role;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;
 create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;grant select,insert,delete on storage.objects to authenticated;`);
 const dir=new URL('../../supabase/migrations/',import.meta.url);
 for(const file of(await readdir(dir)).filter(n=>n.endsWith('.sql')).sort())if(!(process.env.PLANV_SCHEDULING_LEGACY==='1'&&file==='20261012134000_scheduling_concurrency.sql'))await db.exec(await readFile(new URL(file,dir),'utf8'));
 await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now()),($3,$4,now())',[owner,'owner@example.test',delegate,'delegate@example.test']);
 nid=(await db.query<{id:string}>("select public.provision_nutritionist($1,'Nutri A') id",[owner])).rows[0].id;
 other=(await db.query<{id:string}>("select public.provision_nutritionist($1,'Nutri B') id",[delegate])).rows[0].id;
 await db.query("insert into public.patients(id,nutritionist_id,full_name,billing_status) values($1,$2,'Prueba','waived')",[patient,nid]);
 await db.query('insert into public.scheduling_profiles(nutritionist_id,slug,config) values($1,$2,$3)',[nid,'concurrency-test',{...schedulingDefaultSettings(),google_enabled:true,google_calendar_id:'primary'}]);
 await db.query("insert into public.scheduling_bookings(id,nutritionist_id,client_id,token_hash,type_id,calendar_id,starts_at,duration_min,contact_name,contact_email,contact_phone,total_minor,deposit_minor,patient_id,status) values($1,$2,$3,$4,$3,$3,now()+interval '8 days',45,'Prueba','test@example.test','1144433333',100,20,$5,'confirmed')",[booking,nid,randomUUID(),'a'.repeat(64),patient]);
 // Controlled fire drill changes only this disposable database, never application SQL.
 if(process.env.PLANV_SCHEDULING_FIRE_TEST==='1')await db.exec("create or replace function public.scheduling_guard_google_write(kind text,target uuid,token uuid,expected_revision int,expected_epoch uuid,issue boolean default false,profile_revision int default null) returns boolean language sql security definer set search_path='' as $$select true$$;");
},120000);
afterAll(async()=>{await db?.close();});
async function epoch(){return (await service<{e:string}>("select public.scheduling_connection_epoch($1,'google') e",[nid]))[0].e;}
async function connect(expected=undefined as string|undefined){return (await service<{e:string}>("select public.scheduling_write_connection($1,'google',$2,$3,'account') e",[nid,expected??await epoch(),'sealed-test-credentials-value']))[0].e;}
describe('controles persistentes de conexiones y escrituras externas',()=>{
 it('separa consultorios y serializa refresh; CAS viejo nunca restaura desconexión ni nueva cuenta',async()=>{
  let e=await connect();const token=(await service<{t:string}>("select public.scheduling_claim_connection_refresh($1,'google',$2) t",[nid,e]))[0].t;
  await expect(service("select public.scheduling_claim_connection_refresh($1,'google',$2)",[nid,e])).rejects.toMatchObject({code:'PT409'});
  await expect(service("select public.scheduling_write_connection($1,'google',$2,$3,'account',$4)",[other,e,'sealed-test-credentials-value',token])).rejects.toMatchObject({code:'PT409'});
  await service("select public.scheduling_disconnect_connection($1,'google')",[nid]);
  await expect(service("select public.scheduling_write_connection($1,'google',$2,$3,'old-account',$4)",[nid,e,'sealed-test-credentials-value',token])).rejects.toMatchObject({code:'PT409'});
  expect((await db.query('select * from public.scheduling_integrations')).rows).toHaveLength(0);
  e=await epoch();const fresh=await connect(e);await expect(connect(e)).rejects.toMatchObject({code:'PT409'});expect(fresh).not.toBe(e);
  await expect(actor(owner,"select public.scheduling_connection_epoch($1,'google')",[nid])).rejects.toMatchObject({code:'42501'});
  await expect(actor(owner,'select * from public.scheduling_connection_epochs')).rejects.toMatchObject({code:'42501'});
 });
 it('renueva la lease sólo para el token/revisión/cuenta y no repite escritura incierta tras reinicio',async()=>{
  const e=await connect();await db.query('insert into public.scheduling_sync_jobs(booking_id,revision) values($1,1)',[booking]);
  const j=(await service<{j:{id:string;run_token:string}}>('select public.scheduling_claim_sync_job() j'))[0].j;
  const guard=(token:string,revision:number,epochValue:string,issue=false)=>service<{ok:boolean}>("select public.scheduling_guard_google_write('booking',$1,$2,$3,$4,$5) ok",[j.id,token,revision,epochValue,issue]);
  expect((await guard(randomUUID(),1,e))[0].ok).toBe(false);expect((await guard(j.run_token,2,e))[0].ok).toBe(false);expect((await guard(j.run_token,1,randomUUID()))[0].ok).toBe(false);
  expect((await guard(j.run_token,1,e,true))[0].ok).toBe(true);
  await db.query("update public.scheduling_sync_jobs set lease_until=now()-interval '1 second' where id=$1",[j.id]);
  await db.query('update public.scheduling_bookings set revision=2 where id=$1',[booking]);await db.query('insert into public.scheduling_sync_jobs(booking_id,revision) values($1,2)',[booking]);
  expect((await service<{j:unknown}>('select public.scheduling_claim_sync_job() j'))[0].j).toBeNull();
  expect((await db.query<{status:string}>('select status from public.scheduling_sync_jobs where id=$1',[j.id])).rows[0].status).toBe('uncertain');
  expect((await db.query<{google_sync_status:string}>('select google_sync_status from public.scheduling_bookings where id=$1',[booking])).rows[0].google_sync_status).toBe('uncertain');
  await expect(actor(owner,'select public.scheduling_requeue_sync_job($1,$2)',[nid,booking])).rejects.toMatchObject({code:'PT409'});
  expect((await guard(j.run_token,1,e))[0].ok).toBe(false);
 });
 it('ambas funciones toman primero el bloqueo de paciente y una asignación revocada no agrega notas',async()=>{
  const defs=(await db.query<{proname:string;body:string}>("select proname,pg_get_functiondef(oid) body from pg_proc where proname in('revoke_patient_care','scheduling_add_shared_note')")).rows;
  for(const fn of defs){expect(fn.body).toMatch(/from public\.patients.*for update/);const patientLock=fn.body.indexOf('from public.patients'),linkLock=fn.body.indexOf('from public.patient_care_links',patientLock);expect(linkLock).toBeGreaterThan(patientLock);expect(fn.body.slice(linkLock)).toMatch(/for update/);}
  const org=(await actor<{r:{id:string}}>(owner,'select public.create_organization($1,$2) r',['Prueba','concurrency-org']))[0].r.id;
  await actor(owner,'select public.invite_org_member($1,$2,$3)',[org,other,'member']);await actor(delegate,'select public.accept_org_invite($1)',[org]);
  const links=(await actor<{r:Array<{id:string}>}>(owner,'select public.delegate_patient_care($1,$2,$3,$4) r',[patient,other,'delegate',org]))[0].r;
  await actor(delegate,'select public.scheduling_add_shared_note($1,$2)',[patient,'Nota antes de revocar']);
  const link=(await db.query<{id:string}>('select id from public.patient_care_links where patient_id=$1 and nutritionist_id=$2 and revoked_at is null',[patient,other])).rows[0].id;expect(links.some(l=>l.id===link)).toBe(true);
  await actor(owner,'select public.revoke_patient_care($1)',[link]);await expect(actor(delegate,'select public.scheduling_add_shared_note($1,$2)',[patient,'Nota prohibida'])).rejects.toMatchObject({code:'42501'});
  expect((await db.query('select * from public.clinical_notes where patient_id=$1',[patient])).rows).toHaveLength(1);
 });
 it('refresh exitoso exige lease propia y no permite que un release viejo quite la siguiente',async()=>{
  let e=await connect();const old=e;
  const t=(await service<{t:string}>("select public.scheduling_claim_connection_refresh($1,'google',$2) t",[nid,e]))[0].t;
  await expect(service("select public.scheduling_write_connection($1,'google',$2,$3,'account',$4)",[nid,e,'sealed-test-credentials-value',randomUUID()])).rejects.toMatchObject({code:'PT409'});
  e=(await service<{e:string}>("select public.scheduling_write_connection($1,'google',$2,$3,'account',$4) e",[nid,e,'sealed-test-credentials-new-value',t]))[0].e;
  const next=(await service<{t:string}>("select public.scheduling_claim_connection_refresh($1,'google',$2) t",[nid,e]))[0].t;
  await service("select public.scheduling_release_connection_refresh($1,'google',$2,$3)",[nid,old,t]);
  await expect(service("select public.scheduling_claim_connection_refresh($1,'google',$2)",[nid,e])).rejects.toMatchObject({code:'PT409'});
  await service("select public.scheduling_release_connection_refresh($1,'google',$2,$3)",[nid,e,next]);
 });
 it('turno manual cambiado después de emitir queda uncertain, incluso al finalizar o cambiarlo otra vez',async()=>{
  const e=await connect(),aid=(await db.query<{id:string}>("insert into public.appointments(nutritionist_id,patient_id,starts_at,duration_min,channel,timezone,status) values($1,$2,now()+interval '10 days',30,'video','America/Argentina/Buenos_Aires','scheduled') returning id",[nid,patient])).rows[0].id;
  const j=(await service<{j:{appointment_id:string;revision:number;run_token:string}}>('select public.scheduling_claim_appointment_sync() j'))[0].j;expect(j.appointment_id).toBe(aid);
  expect((await service<{ok:boolean}>("select public.scheduling_guard_google_write('appointment',$1,$2,$3,$4,true) ok",[aid,j.run_token,j.revision,e]))[0].ok).toBe(true);
  await db.query("update public.appointments set starts_at=starts_at+interval '1 hour' where id=$1",[aid]);
  expect((await service<{ok:boolean}>('select public.scheduling_complete_appointment_sync($1,$2,$3,null,null) ok',[aid,j.run_token,j.revision]))[0].ok).toBe(false);
  await db.query("update public.appointments set status='cancelled' where id=$1",[aid]);
  expect((await db.query<{status:string}>('select status from public.scheduling_appointment_sync_jobs where appointment_id=$1',[aid])).rows[0].status).toBe('uncertain');
  expect((await service<{j:unknown}>('select public.scheduling_claim_appointment_sync() j'))[0].j).toBeNull();
  await expect(actor(owner,'select public.scheduling_requeue_appointment_sync($1,$2)',[nid,aid])).rejects.toMatchObject({code:'PT409'});
 });
 it('resolver coincidencia recupera el estado sin repetir un envío y rechaza otro epoch/consultorio/replay',async()=>{
  const current=(await service<{c:{job:string;revision:number;profile_revision:number;write_account:string;write_calendar:string}}>("select public.scheduling_google_review_context($1,'booking',$2) c",[nid,booking]))[0].c;expect(current.write_account).toBe('account');expect(current.write_calendar).toBe('primary');const e=await epoch();
  const resolve=(clinic:string,epochValue:string)=>service<{ok:boolean}>("select public.scheduling_resolve_google_review($1,'booking',$2,$3,$4,$5,$6,'accept_match') ok",[clinic,booking,current.job,current.revision,current.profile_revision,epochValue]);
  expect((await resolve(other,e))[0].ok).toBe(false);expect((await resolve(nid,randomUUID()))[0].ok).toBe(false);expect((await resolve(nid,e))[0].ok).toBe(true);expect((await resolve(nid,e))[0].ok).toBe(false);
  expect((await db.query<{google_sync_status:string}>('select google_sync_status from public.scheduling_bookings where id=$1',[booking])).rows[0].google_sync_status).toBe('synced');
  expect((await service<{j:unknown}>('select public.scheduling_claim_sync_job() j'))[0].j).toBeNull();
  await expect(actor(owner,"select public.scheduling_google_review_context($1,'booking',$2)",[nid,booking])).rejects.toMatchObject({code:'42501'});
 });
 it('una revisión manual puede reencolar sólo con cuenta/calendario/revisión actuales',async()=>{
  const aid=(await db.query<{appointment_id:string}>("select appointment_id from public.scheduling_appointment_sync_jobs where status='uncertain'")).rows[0].appointment_id;
  const current=(await service<{c:{job:string;revision:number;profile_revision:number}}>("select public.scheduling_google_review_context($1,'appointment',$2)c",[nid,aid]))[0].c,e=await epoch();
  expect((await service<{ok:boolean}>("select public.scheduling_resolve_google_review($1,'appointment',$2,$3,$4,$5,$6,'requeue') ok",[nid,aid,current.job,current.revision+1,current.profile_revision,e]))[0].ok).toBe(false);
  await db.query("update public.scheduling_profiles set config=jsonb_set(config,'{google_calendar_id}','\"other-calendar\"') where nutritionist_id=$1",[nid]);
  expect((await service<{ok:boolean}>("select public.scheduling_resolve_google_review($1,'appointment',$2,$3,$4,$5,$6,'requeue') ok",[nid,aid,current.job,current.revision,current.profile_revision,e]))[0].ok).toBe(false);
  await db.query("update public.scheduling_profiles set config=jsonb_set(config,'{google_calendar_id}','\"primary\"') where nutritionist_id=$1",[nid]);
  const resolveAs=(who:string)=>service<{ok:boolean}>("select public.scheduling_resolve_google_review($1,'appointment',$2,$3,$4,$5,$6,'requeue',null,$7) ok",[nid,aid,current.job,current.revision,current.profile_revision,e,who]);
  expect((await resolveAs(delegate))[0].ok).toBe(false);
  await db.query('insert into public.scheduling_staff_members(nutritionist_id,user_id,granted_by) values($1,$2,$3)',[nid,delegate,owner]);await db.query('update public.scheduling_staff_members set revoked_at=now() where nutritionist_id=$1 and user_id=$2',[nid,delegate]);
  expect((await resolveAs(delegate))[0].ok).toBe(false);expect((await resolveAs(owner))[0].ok).toBe(true);
  const job=(await service<{j:{appointment_id:string;write_issued:boolean}}>('select public.scheduling_claim_appointment_sync()j'))[0].j;expect(job.appointment_id).toBe(aid);expect(job.write_issued).toBe(false);
 });
});
