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
  // Coordinator supplies 20261011141000_patient_phone.sql before this module.
  await db.exec('alter table public.patients add column if not exists phone text check(length(phone)<=40)');
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
    expect((await db.query('select phone from public.patients where id=$1',[result.patient_id])).rows).toEqual([{phone:'123456'}]);
    expect(await asUser(b,'select * from public.patient_import_batches where id=$1',[id])).toHaveLength(0);
    expect(await asUser(admin,'select * from public.patient_import_batches where id=$1',[id])).toHaveLength(0);
    await expect(asUser(b,'select public.apply_patient_import_row($1,$2::jsonb)',[id,JSON.stringify(row)])).rejects.toThrow();
    await expect(asUser(b,'select public.prepare_imported_patient_invite($1)',[result.patient_id])).rejects.toThrow();
    const invite=(await asUser(a,'select public.prepare_imported_patient_invite($1) as invite',[result.patient_id]))[0].invite;
    expect(invite.status).toBe('not_sent');
    expect((await asUser(a,'select public.prepare_imported_patient_invite($1) as invite',[result.patient_id]))[0].invite.id).toBe(invite.id);
  });
  it('falla una fila sin perder otra, no acepta historia sin permiso ni manipulación',async()=>{
    const existing=(await asUser(a,'select patient_id from public.patient_import_contacts'))[0].patient_id;
    const row={...candidate(),key:crypto.randomUUID(),email:'',action:'append',patient_id:existing,origins:[{...origin,row:3}]};
    const next={...candidate(),email:'otra@example.test',origins:[{...origin,row:4}]};const id=crypto.randomUUID();
    await asUser(a,'select public.prepare_patient_import($1,$2::jsonb)',[id,JSON.stringify({id,candidates:[row,next]})]);
    const clinical={...row,history:[{category:'history',text:'Historia privada',origin}]};
    expect((await asUser(a,'select public.apply_patient_import_row($1,$2::jsonb) as result',[id,JSON.stringify(clinical)]))[0].result.status).toBe('error');
    await expect(asUser(a,'select public.apply_patient_import_row($1,$2::jsonb)',[id,JSON.stringify(row)])).rejects.toThrow();
    await expect(asUser(a,'select public.apply_patient_import_row($1,$2::jsonb)',[id,JSON.stringify({...clinical,history:[{...clinical.history[0],text:'Otro contenido'}]})])).rejects.toThrow();
    expect((await asUser(a,'select public.apply_patient_import_row($1,$2::jsonb) as result',[id,JSON.stringify(next)]))[0].result.status).toBe('created');
    expect((await asUser(a,'select status from public.patient_import_batches where id=$1',[id]))[0].status).toBe('partial');
    await expect(asUser(a,'select public.apply_patient_import_row($1,$2::jsonb)',[id,JSON.stringify({...row,name:'Manipulado'})])).rejects.toThrow();
    expect((await db.query('select * from public.patient_import_history')).rows).toHaveLength(0);
  });
  it('incorpora medidas e historia sin sobrescribir, y cierra el historial tras retirar permisos',async()=>{
    const existing=(await asUser(a,'select patient_id from public.patient_import_contacts'))[0].patient_id;
    const patientUser='00000000-0000-4000-a000-000000000095';
    await db.query('insert into auth.users(id,email,email_confirmed_at)values($1,$2,now())',[patientUser,'paciente@example.test']);
    await db.query("update public.patients set user_id=$1,billing_status='waived' where id=$2",[patientUser,existing]);
    const consent=async(purpose:string,decision:string)=>{
      const text=(await db.query<{text_version:string;text_hash:string}>('select text_version,text_hash from public.consent_catalog where purpose=$1',[purpose])).rows[0];
      await asUser(patientUser,'select public.record_patient_consent($1,$2,$3,$4,$5)',[existing,purpose,text.text_version,text.text_hash,decision]);
    };
    for(const purpose of ['care_relationship','measurement','clinical_document'])await consent(purpose,'granted');
    const source={...origin,row:7};
    const contact={...candidate(),email:'',phone:'999999',action:'append',patient_id:existing,origins:[source]};const id=crypto.randomUUID();
    await asUser(a,'select public.prepare_patient_import($1,$2::jsonb)',[id,JSON.stringify({id,candidates:[contact]})]);
    const clinical={...contact,history:[{category:'history',text:'Antecedente ficticio',origin:source},{category:'plan',text:'Plan histórico ficticio',origin:source},{category:'study',text:'Estudio ficticio',origin:source}],measurements:[{kind:'weight',value:65.2,unit:'kg',date:'2026-10-01',origin:source}]};
    const saved=(await asUser(a,'select public.apply_patient_import_row($1,$2::jsonb) as result',[id,JSON.stringify(clinical)]))[0].result;expect(saved.status).toBe('appended');
    expect(await asUser(a,'select category from public.patient_import_history where patient_id=$1',[existing])).toHaveLength(3);
    expect(await asUser(b,'select category from public.patient_import_history where patient_id=$1',[existing])).toHaveLength(0);
    expect(await asUser(patientUser,'select category from public.patient_import_history where patient_id=$1',[existing])).toHaveLength(0);
    expect((await db.query('select full_name from public.patients where id=$1',[existing])).rows[0]).toEqual({full_name:'Paciente importada'});
    expect((await db.query('select phone from public.patients where id=$1',[existing])).rows).toEqual([{phone:'123456'}]);
    expect((await db.query('select value_numeric,source from public.measurements where patient_id=$1',[existing])).rows).toHaveLength(1);
    await asUser(a,'select public.apply_patient_import_row($1,$2::jsonb)',[id,JSON.stringify(clinical)]);
    expect((await db.query('select id from public.measurements where patient_id=$1',[existing])).rows).toHaveLength(1);
    await consent('clinical_document','withdrawn');expect(await asUser(a,'select category from public.patient_import_history where patient_id=$1',[existing])).toHaveLength(2);
    await consent('care_relationship','withdrawn');expect(await asUser(a,'select category from public.patient_import_history where patient_id=$1',[existing])).toHaveLength(0);
  });
  it('permite el mecanismo de transferencia existente sin conservar el alcance anterior',async()=>{
    const existing=(await asUser(a,'select patient_id from public.patient_import_contacts'))[0].patient_id;
    const from=(await db.query<{id:string}>('select id from public.nutritionists where user_id=$1',[a])).rows[0].id;
    const to=(await db.query<{id:string}>('select id from public.nutritionists where user_id=$1',[b])).rows[0].id;
    // transfer_patient_ownership updates all child scopes first and patients last.
    await db.transaction(async tx=>{
      await tx.exec('set constraints all deferred');
      const children=(await tx.query<{table_name:string}>(`select c.table_name from information_schema.columns c where c.table_schema='public' and c.column_name='nutritionist_id' and exists(select 1 from information_schema.columns p where p.table_schema='public' and p.table_name=c.table_name and p.column_name='patient_id') and c.table_name not in('patients','patient_care_links','ownership_transfer_events')`)).rows;
      for(const child of children)await tx.query(`update public."${child.table_name}" set nutritionist_id=$1 where patient_id=$2 and nutritionist_id=$3`,[to,existing,from]);
      await tx.query('update public.patients set nutritionist_id=$1 where id=$2',[to,existing]);
    });
    expect(await asUser(a,'select patient_id from public.patient_import_contacts where patient_id=$1',[existing])).toHaveLength(0);
    expect(await asUser(b,'select patient_id from public.patient_import_contacts where patient_id=$1',[existing])).toHaveLength(1);
  });
});
