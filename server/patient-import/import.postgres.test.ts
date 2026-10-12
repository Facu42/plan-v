import { afterAll,beforeAll,describe,expect,it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile,readdir } from 'node:fs/promises';

let db:PGlite;
const a='00000000-0000-4000-a000-000000000091',b='00000000-0000-4000-a000-000000000092',admin='00000000-0000-4000-a000-000000000094';
const origin={file:'archivo.csv',fingerprint:'b'.repeat(64),row:2};
const candidate=()=>({key:crypto.randomUUID(),name:'Paciente importada',email:'importada@example.test',phone:'123456',action:'create',patient_id:null,origins:[origin],measurements:[],history:[],reviewed:true});
async function asUser(user:string,sql:string,args:unknown[]=[]){return db.transaction(async tx=>{await tx.exec('set local role authenticated');await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);return (await tx.query(sql,args)).rows as Record<string,any>[];});}
beforeAll(async()=>{
  db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;
  grant usage on schema public,auth,storage to anon,authenticated,service_role;
  alter default privileges in schema public grant all on functions to anon,authenticated,service_role;
  alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
  create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
  create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;
  create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;`);
  const dir=new URL('../../supabase/migrations/',import.meta.url);
  for(const name of (await readdir(dir)).filter(n=>n.endsWith('.sql')).sort())await db.exec(await readFile(new URL(name,dir),'utf8'));
  // The test fails before implementation if this required migration is absent.
  await readFile(new URL('20261011160000_patient_import.sql',dir),'utf8');
  for(const id of [a,b,admin])await db.query('insert into auth.users(id,email,email_confirmed_at)values($1,$2,now())',[id,`${id}@example.test`]);
  for(const id of [a,b])await db.query('select public.provision_nutritionist($1,$2)',[id,'Consultorio ficticio']);
},60000);
afterAll(async()=>{await db?.close();});

describe('importación Postgres multi consultorio',()=>{
  it('crea contacto, sin cuenta ni invitación, con reintento idempotente',async()=>{
    const row=candidate();const id=crypto.randomUUID();const input={id,candidates:[row]};
    await asUser(a,'select public.prepare_patient_import($1,$2::jsonb)',[id,JSON.stringify(input)]);
    const result=(await asUser(a,'select public.apply_patient_import_row($1,$2::jsonb) as result',[id,JSON.stringify(row)]))[0].result;
    expect(result.status).toBe('created');
    expect((await asUser(a,'select public.apply_patient_import_row($1,$2::jsonb) as result',[id,JSON.stringify(row)]))[0].result).toEqual(result);
    const patient=(await db.query<{user_id:null}>('select user_id from public.patients where id=$1',[result.patient_id])).rows[0];expect(patient.user_id).toBeNull();
    expect((await db.query('select id from public.patient_invites where patient_id=$1',[result.patient_id])).rows).toHaveLength(0);
    expect(await asUser(b,'select * from public.patient_import_batches where id=$1',[id])).toHaveLength(0);
    expect(await asUser(admin,'select * from public.patient_import_batches where id=$1',[id])).toHaveLength(0);
    await expect(asUser(b,'select public.apply_patient_import_row($1,$2::jsonb)',[id,JSON.stringify(row)])).rejects.toThrow();
  });
  it('falla una fila sin perder otra, no acepta historia sin permiso ni manipulación',async()=>{
    const existing=(await asUser(a,'select patient_id from public.patient_import_contacts'))[0].patient_id;
    const row={...candidate(),key:crypto.randomUUID(),email:'',action:'append',patient_id:existing,origins:[{...origin,row:3}]};
    const next={...candidate(),email:'otra@example.test',origins:[{...origin,row:4}]};const id=crypto.randomUUID();
    await asUser(a,'select public.prepare_patient_import($1,$2::jsonb)',[id,JSON.stringify({id,candidates:[row,next]})]);
    const clinical={...row,history:[{category:'history',text:'Historia privada',origin}]};
    expect((await asUser(a,'select public.apply_patient_import_row($1,$2::jsonb) as result',[id,JSON.stringify(clinical)]))[0].result.status).toBe('error');
    expect((await asUser(a,'select public.apply_patient_import_row($1,$2::jsonb) as result',[id,JSON.stringify(next)]))[0].result.status).toBe('created');
    expect((await asUser(a,'select status from public.patient_import_batches where id=$1',[id]))[0].status).toBe('partial');
    await expect(asUser(a,'select public.apply_patient_import_row($1,$2::jsonb)',[id,JSON.stringify({...row,name:'Manipulado'})])).rejects.toThrow();
    expect((await db.query('select * from public.patient_import_history')).rows).toHaveLength(0);
  });
});
