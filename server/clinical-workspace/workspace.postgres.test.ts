import { afterAll,beforeAll,describe,expect,it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile,readdir } from 'node:fs/promises';
let db:PGlite;
const a='00000000-0000-4000-a000-000000000201',b='00000000-0000-4000-a000-000000000202',p='00000000-0000-4000-a000-000000000203',patient='10000000-0000-4000-a000-000000000201';
async function asUser(user:string,sql:string,args:unknown[]=[]){return db.transaction(async tx=>{await tx.exec('set local role authenticated');await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);return (await tx.query(sql,args)).rows as Record<string,any>[];});}
async function consent(purpose:string,decision:string){const text=(await db.query<{text_version:string;text_hash:string}>('select text_version,text_hash from public.consent_catalog where purpose=$1',[purpose])).rows[0];await asUser(p,'select public.record_patient_consent($1,$2,$3,$4,$5)',[patient,purpose,text.text_version,text.text_hash,decision]);}
beforeAll(async()=>{
  db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;
  grant usage on schema public,auth,storage to anon,authenticated,service_role;alter default privileges in schema public grant all on functions to anon,authenticated,service_role;alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
  create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;`);
  const dir=new URL('../../supabase/migrations/',import.meta.url);for(const name of(await readdir(dir)).filter(n=>n.endsWith('.sql')).sort())await db.exec(await readFile(new URL(name,dir),'utf8'));await readFile(new URL('20261012113000_clinical_workspace.sql',dir),'utf8');
  for(const id of[a,b,p])await db.query('insert into auth.users(id,email,email_confirmed_at)values($1,$2,now())',[id,`${id}@example.test`]);for(const id of[a,b])await db.query('select public.provision_nutritionist($1,$2)',[id,'Consultorio de prueba']);
  const nutri=(await db.query<{id:string}>('select id from public.nutritionists where user_id=$1',[a])).rows[0].id;await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status)values($1,$2,$3,'Paciente ficticia','waived')",[patient,nutri,p]);for(const purpose of['care_relationship','clinical_document','measurement'])await consent(purpose,'granted');
},60000);afterAll(async()=>{await db?.close();});
describe('clínica persistente por consultorio',()=>{
  it('valida documento original propio y protege el laboratorio después de retiro',async()=>{
    const n=(await db.query<{id:string}>('select id from public.nutritionists where user_id=$1',[a])).rows[0].id;const asset=crypto.randomUUID();const doc=crypto.randomUUID();
    await db.query(`insert into public.patient_assets(id,patient_id,nutritionist_id,bucket,object_path,category,mime,byte_size,checksum_sha256,status)values($1,$2,$3,'care-documents',$4,'clinical_document','application/pdf',100,$5,'ready')`,[asset,patient,n,`patients/${patient}/clinical_document/${asset}`,'a'.repeat(64)]);
    const document={id:doc,filename:'estudio.pdf',asset_id:asset,source_sha256:'a'.repeat(64)};
    await expect(asUser(b,'select public.save_clinical_source_document($1,$2::jsonb)',[patient,JSON.stringify(document)])).rejects.toThrow();
    await asUser(a,'select public.save_clinical_source_document($1,$2::jsonb)',[patient,JSON.stringify(document)]);
    const input={id:crypto.randomUUID(),recorded_on:'2026-10-01',note:'',reviewed:true,data:{kind:'laboratory',document_id:doc,values:[{id:crypto.randomUUID(),name:'Glucosa',value:95,operator:'',unit:'mg/dL',range_text:'70 - 110',raw_value:'95',source_line:'Glucosa 95 mg/dL 70 - 110',page:1,reviewed:true}]}};
    await asUser(a,'select public.save_clinical_workspace_record($1,$2::jsonb)',[patient,JSON.stringify(input)]);await asUser(a,'select public.save_clinical_workspace_record($1,$2::jsonb)',[patient,JSON.stringify(input)]);
    expect(await asUser(a,'select id from public.clinical_workspace_records')).toHaveLength(1);expect(await asUser(b,'select id from public.clinical_workspace_records')).toHaveLength(0);expect(await asUser(p,'select id from public.clinical_workspace_records')).toHaveLength(0);
    await expect(asUser(a,'select public.save_clinical_workspace_record($1,$2::jsonb)',[patient,JSON.stringify({...input,id:crypto.randomUUID(),data:{...input.data,document_id:crypto.randomUUID()}})])).rejects.toThrow();
    await consent('clinical_document','withdrawn');expect(await asUser(a,'select id from public.clinical_workspace_records')).toHaveLength(0);expect(await asUser(a,'select id from public.clinical_source_documents')).toHaveLength(0);
  });
  it('rechaza referencias ajenas/inactivas y resultados sin permiso de mediciones',async()=>{
    const reference={id:crypto.randomUUID(),method:'segmental',title:'Referencia de prueba',source_url:'https://example.test/metodo',notes:'Validación profesional declarada en prueba',approved:true};
    await asUser(a,'select public.approve_clinical_reference($1::jsonb)',[JSON.stringify(reference)]);
    const input={id:crypto.randomUUID(),recorded_on:'2026-10-01',note:'',reviewed:true,data:{kind:'segmental',reference_id:reference.id,document_id:null,device:'Dispositivo declarado',values:[{segment:'arm_right',component:'muscle',value:2.4,unit:'kg',original:'Brazo derecho 2,4 kg'}]}};
    await asUser(a,'select public.save_clinical_workspace_record($1,$2::jsonb)',[patient,JSON.stringify(input)]);
    await expect(asUser(b,'select public.deactivate_clinical_reference($1)',[reference.id])).rejects.toThrow();
    await asUser(a,'select public.deactivate_clinical_reference($1)',[reference.id]);await expect(asUser(a,'select public.save_clinical_workspace_record($1,$2::jsonb)',[patient,JSON.stringify({...input,id:crypto.randomUUID()})])).rejects.toThrow();
    await consent('measurement','withdrawn');expect(await asUser(a,'select id from public.clinical_workspace_records')).toHaveLength(0);
  });
  it('la validación de RPC no acepta un valor de laboratorio sin número ni id',async()=>{
    const value={name:'Glucosa',operator:'',unit:'mg/dL',range_text:'70-110',raw_value:'95',source_line:'Glucosa 95 mg/dL',page:1,reviewed:true};
    const data={kind:'laboratory',document_id:crypto.randomUUID(),values:[value]};
    await expect(db.query('select public.clinical_workspace_validate($1::jsonb)',[JSON.stringify(data)])).rejects.toThrow();
  });
  it('no habilita unidades incompatibles o segmentos duplicados mediante RPC directo',async()=>{
    const value={segment:'arm_right',component:'muscle',value:2.4,unit:'ohm',original:'Equipo original'};
    const data={kind:'segmental',reference_id:crypto.randomUUID(),document_id:null,device:'Equipo declarado',values:[value]};
    await expect(db.query('select public.clinical_workspace_validate($1::jsonb)',[JSON.stringify(data)])).rejects.toThrow();
    await expect(db.query('select public.clinical_workspace_validate($1::jsonb)',[JSON.stringify({...data,values:[{...value,unit:'kg'},{...value,unit:'kg'}]})])).rejects.toThrow();
  });
  it('oculta mediciones con documento cuando se retira el permiso de documentos',async()=>{
    await consent('clinical_document','granted');await consent('measurement','granted');
    const n=(await db.query<{id:string}>('select id from public.nutritionists where user_id=$1',[a])).rows[0].id;
    const asset=crypto.randomUUID(),doc=crypto.randomUUID(),ref=crypto.randomUUID();
    await db.query(`insert into public.patient_assets(id,patient_id,nutritionist_id,bucket,object_path,category,mime,byte_size,checksum_sha256,status)values($1,$2,$3,'care-documents',$4,'clinical_document','application/pdf',100,$5,'ready')`,[asset,patient,n,`patients/${patient}/clinical_document/${asset}`,'b'.repeat(64)]);
    await asUser(a,'select public.save_clinical_source_document($1,$2::jsonb)',[patient,JSON.stringify({id:doc,filename:'bioimpedancia.pdf',asset_id:asset,source_sha256:'b'.repeat(64)})]);
    await asUser(a,'select public.approve_clinical_reference($1::jsonb)',[JSON.stringify({id:ref,method:'segmental',title:'Fuente del equipo',source_url:'https://example.test/equipo',notes:'Validado por profesional',approved:true})]);
    const input={id:crypto.randomUUID(),recorded_on:'2026-10-01',note:'',reviewed:true,data:{kind:'segmental',reference_id:ref,document_id:doc,device:'Equipo original',values:[{segment:'arm_right',component:'muscle',value:2,unit:'kg',original:'Página 1: brazo derecho 2 kg'}]}};
    await asUser(a,'select public.save_clinical_workspace_record($1,$2::jsonb)',[patient,JSON.stringify(input)]);
    expect(await asUser(a,'select id from public.clinical_workspace_records where id=$1',[input.id])).toHaveLength(1);
    await consent('clinical_document','withdrawn');
    expect(await asUser(a,'select id from public.clinical_workspace_records where id=$1',[input.id])).toHaveLength(0);
  });
});
