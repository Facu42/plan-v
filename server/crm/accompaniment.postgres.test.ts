import {readFile,readdir} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {afterAll,beforeAll,expect,it} from 'vitest';

let db:PGlite;
const userA='00000000-0000-4000-a000-0000000000d1',userB='00000000-0000-4000-a000-0000000000d2',patientUser='00000000-0000-4000-a000-0000000000d3';
const patientA='10000000-0000-4000-a000-0000000000d1',patientB='10000000-0000-4000-a000-0000000000d2';
let clinicA:string,clinicB:string;
async function actor<T extends Record<string,unknown>>(user:string,sql:string,args:unknown[]=[]){return db.transaction(async tx=>{await tx.exec('set local role authenticated');await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);return (await tx.query<T>(sql,args)).rows;});}
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;
 grant usage on schema public,auth,storage to authenticated,anon,service_role;
 create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;
 create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;`);
 const directory=new URL('../../supabase/migrations/',import.meta.url);
 for(const file of (await readdir(directory)).filter(n=>n.endsWith('.sql')).sort())await db.exec(await readFile(new URL(file,directory),'utf8'));
 for(const [id,email] of [[userA,'pro-a'],[userB,'pro-b'],[patientUser,'patient']])await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[id,email+'@example.test']);
 clinicA=(await db.query<{id:string}>("select public.provision_nutritionist($1,'A') as id",[userA])).rows[0].id;
 clinicB=(await db.query<{id:string}>("select public.provision_nutritionist($1,'B') as id",[userB])).rows[0].id;
 await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,created_at,billing_status) values($1,$2,$3,'Paciente A',now()-interval '60 days','waived'),($4,$5,null,'Paciente B',now()-interval '60 days','waived')",[patientA,clinicA,patientUser,patientB,clinicB]);
},60000);
afterAll(async()=>{await db?.close();});

it('respuestas y favoritas pertenecen al consultorio; otra profesional y paciente no pueden leerlas ni escribirlas',async()=>{
 const reply=JSON.stringify([{id:'20000000-0000-4000-a000-0000000000d1',title:'Agua',body:'Contame cómo venís con el agua.'}]);
 await actor(userA,'insert into public.professional_message_settings(nutritionist_id,replies) values($1,$2::jsonb)',[clinicA,reply]);
 expect((await actor(userA,'select replies from public.professional_message_settings')).length).toBe(1);
 expect(await actor(userB,'select replies from public.professional_message_settings')).toEqual([]);
 expect(await actor(patientUser,'select replies from public.professional_message_settings')).toEqual([]);
 await expect(actor(userB,'insert into public.professional_message_settings(nutritionist_id) values($1)',[clinicA])).rejects.toThrow();
 await expect(actor(patientUser,'insert into public.professional_message_settings(nutritionist_id) values($1)',[clinicB])).rejects.toThrow();
 expect(await actor(userB,'update public.professional_message_settings set replies=\'[]\' where nutritionist_id=$1 returning nutritionist_id',[clinicA])).toEqual([]);
});
it('la revisión anterior no pisa una edición nueva y la base acota contenido',async()=>{
 const before=await actor<{revision:string}>(userA,'select revision from public.professional_message_settings where nutritionist_id=$1',[clinicA]);
 const first=await actor(userA,'update public.professional_message_settings set revision=gen_random_uuid() where nutritionist_id=$1 and revision=$2 returning revision',[clinicA,before[0].revision]);expect(first).toHaveLength(1);
 expect(await actor(userA,'update public.professional_message_settings set replies=\'[]\' where nutritionist_id=$1 and revision=$2 returning revision',[clinicA,before[0].revision])).toEqual([]);
 await expect(actor(userA,'update public.professional_message_settings set replies=$2::jsonb where nutritionist_id=$1',[clinicA,JSON.stringify([{id:'bad',title:'',body:'x'.repeat(2001)}])])).rejects.toThrow();
});
it('el recordatorio exige consultorio y ausencia de registros; el reintento no duplica',async()=>{
 const request='30000000-0000-4000-a000-0000000000d1';
 await expect(actor(userB,'select public.enqueue_followup_reminder($1,$2)',[patientA,request])).rejects.toThrow();
 await expect(actor(patientUser,'select public.enqueue_followup_reminder($1,$2)',[patientA,request])).rejects.toThrow();
 await actor(userA,'select public.enqueue_followup_reminder($1,$2)',[patientA,request]);await actor(userA,'select public.enqueue_followup_reminder($1,$2)',[patientA,request]);
 expect((await db.query<{n:number}>('select count(*)::int as n from public.outbox_events where patient_id=$1 and client_id=$2',[patientA,request])).rows[0].n).toBe(1);
});
it('pasos recientes y archivo impiden encolar el aviso persistente',async()=>{
 await db.query("insert into public.habit_logs(patient_id,date,hydration,steps) values($1,(now() at time zone 'America/Argentina/Buenos_Aires')::date,0,4000)",[patientA]);
 const skip=await actor<{result:{skipped:boolean}}>(userA,'select public.enqueue_followup_reminder($1,gen_random_uuid()) as result',[patientA]);expect(skip[0].result.skipped).toBe(true);
 await db.query('delete from public.habit_logs where patient_id=$1',[patientA]);await db.query('update public.patients set archived_at=now() where id=$1',[patientA]);
 const archived=await actor<{result:{skipped:boolean}}>(userA,'select public.enqueue_followup_reminder($1,gen_random_uuid()) as result',[patientA]);expect(archived[0].result.skipped).toBe(true);
 expect((await db.query<{n:number}>('select count(*)::int as n from public.outbox_events where patient_id=$1',[patientA])).rows[0].n).toBe(1);
});
