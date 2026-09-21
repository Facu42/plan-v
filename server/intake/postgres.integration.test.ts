import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CONSENT_CATALOG } from './consent.js';

// PostgreSQL real con shims de identidad/storage. No reemplaza el E2E de Supabase Auth.
let db: PGlite;
let dir: string;
const a = '00000000-0000-4000-a000-000000000001';
const b = '00000000-0000-4000-a000-000000000002';
const pro = '00000000-0000-4000-a000-000000000003';
const other = '00000000-0000-4000-a000-000000000004';
const patient = '10000000-0000-4000-a000-000000000001';
const patientB = '10000000-0000-4000-a000-000000000002';
const care = CONSENT_CATALOG[0];

async function asUser<T = Record<string, unknown>>(user: string, sql: string, params: unknown[] = []) {
  return db.transaction(async tx => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user]);
    return (await tx.query<T>(sql, params)).rows;
  });
}
async function rpc(user: string, name: string, args: unknown[] = []) {
  const rows = await asUser<{ result: any }>(user, `select public.${name}(${args.map((_, i) => `$${i + 1}`).join(',')}) as result`, args);
  return rows[0].result;
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-postgres-'));
  db = new PGlite(dir);
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    grant usage on schema public, auth, storage to authenticated, anon, service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
  `);
  const migrations = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort()) {
    try { await db.exec(await readFile(new URL(file, migrations), 'utf8')); }
    catch (error) { console.error(file, JSON.stringify(error)); throw error; }
  }
  for (const id of [a,b,pro,other]) await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, `${id}@example.test`]);
  const n1 = (await db.query<{id:string}>("select public.provision_nutritionist($1,'Nutri A') as id", [pro])).rows[0].id;
  const n2 = (await db.query<{id:string}>("select public.provision_nutritionist($1,'Nutri B') as id", [other])).rows[0].id;
  await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values($1,$2,$3,'Paciente A','waived'),($4,$5,$6,'Paciente B','waived')", [patient,n1,a,patientB,n2,b]);
}, 60000);
afterAll(async () => { await db?.close(); if (dir) await rm(dir, {recursive:true,force:true}); });

describe('migraciones de ingreso en PostgreSQL', () => {
  it('mantiene catálogo y hash idénticos a los textos de la API', async () => {
    const rows = (await db.query('select * from public.consent_catalog')).rows;
    for (const entry of CONSENT_CATALOG) expect(rows).toContainEqual({purpose:entry.purpose,text_version:entry.text_version,text_hash:entry.text_hash,body:entry.text,required:entry.required});
  });
  it('aísla pacientes A/B, profesionales y columnas privadas', async () => {
    expect(await asUser(a, 'select id from public.patients')).toEqual([]);
    expect(await asUser(a, 'select id from public.patients_patient_view')).toEqual([{id:patient}]);
    expect(await asUser(a, 'select id from public.patient_access_view')).toEqual([{id:patient}]);
    await expect(rpc(b, 'get_patient_intake', [patient])).rejects.toMatchObject({code:'42501'});
    await expect(rpc(other, 'get_patient_intake', [patient])).rejects.toMatchObject({code:'42501'});
    await expect(asUser(a, "update public.profiles set role='nutri' where id=$1", [a])).rejects.toMatchObject({code:'42501'});
    await expect(asUser(a, 'insert into public.intake_sessions(patient_id) values($1)', [patient])).rejects.toMatchObject({code:'42501'});
  });
  it('guarda, rechaza revisiones viejas y valida datos incluso por RPC directo', async () => {
    expect((await rpc(a,'get_patient_intake',[patient])).intake.revision).toBe(1);
    const saved = await rpc(a,'save_patient_intake',[patient,1,'allergies',{preferred_name:'Ana',allergies:{state:'reported',items:['Maní']}}]);
    expect(saved.intake.revision).toBe(2);
    await expect(rpc(a,'save_patient_intake',[patient,1,'profile',{preferred_name:'Viejo'}])).rejects.toMatchObject({code:'PT409'});
    await expect(rpc(a,'save_patient_intake',[patient,2,'profile',{allergies:{state:'none',items:['Maní']}}])).rejects.toMatchObject({code:'22023'});
    await expect(rpc(a,'save_patient_intake',[patient,2,'profile',{reviewed_by:pro}])).rejects.toMatchObject({code:'22023'});
    await expect(rpc(pro,'save_patient_intake',[patient,2,'profile',{}])).rejects.toMatchObject({code:'42501'});
    expect((await rpc(a,'get_patient_intake',[patient])).intake.payload.preferred_name).toBe('Ana');
  });
  it('exige consentimiento vigente, conserva retiros y permite reintentar envío sin duplicarlo', async () => {
    await expect(rpc(a,'submit_patient_intake',[patient,2])).rejects.toMatchObject({message:'intake_consent_required'});
    const args = [patient,care.purpose,care.text_version,care.text_hash,'granted'];
    const first = await rpc(a,'record_patient_consent',args);
    expect((await rpc(a,'record_patient_consent',args)).id).toBe(first.id);
    await rpc(a,'record_patient_consent',[...args.slice(0,4),'withdrawn']);
    await expect(rpc(a,'submit_patient_intake',[patient,2])).rejects.toMatchObject({message:'intake_consent_required'});
    await expect(rpc(a,'record_patient_consent',[patient,care.purpose,'old',care.text_hash,'granted'])).rejects.toMatchObject({code:'PT409'});
    await rpc(a,'record_patient_consent',args);
    expect((await rpc(a,'submit_patient_intake',[patient,2])).intake.status).toBe('submitted');
    expect((await rpc(a,'submit_patient_intake',[patient,2])).intake.revision).toBe(3);
    await expect(rpc(a,'save_patient_intake',[patient,3,'profile',{preferred_name:'Cambiar'}])).rejects.toMatchObject({code:'PT409'});
  });
  it('revisión privada y notas nunca se filtran por RPC ni tablas al paciente', async () => {
    await expect(rpc(a,'review_patient_intake',[patient,3])).rejects.toMatchObject({code:'42501'});
    await expect(rpc(other,'add_patient_clinical_note',[patient,'Privado'])).rejects.toMatchObject({code:'42501'});
    const reviewed = await rpc(pro,'review_patient_intake',[patient,3]);
    expect(reviewed.intake.reviewed_by).toBe(pro);
    expect((await rpc(pro,'review_patient_intake',[patient,3])).intake.revision).toBe(4);
    await rpc(pro,'add_patient_clinical_note',[patient,'Nota profesional privada']);
    const publicView = await rpc(a,'get_patient_intake',[patient]);
    expect(publicView).not.toHaveProperty('clinical_notes');
    expect(publicView.intake).not.toHaveProperty('reviewed_by');
    expect(await asUser(a,'select * from public.clinical_notes')).toEqual([]);
    expect(await asUser(b,'select * from public.intake_patient_view')).toEqual([]);
    expect((await rpc(pro,'get_patient_intake',[patient])).clinical_notes[0].body).toBe('Nota profesional privada');
  });
  it('conserva ingreso y consentimientos al cerrar y reabrir la base', async () => {
    await db.close(); db = new PGlite(dir);
    const saved = await rpc(a,'get_patient_intake',[patient]);
    expect(saved.intake).toMatchObject({status:'reviewed',revision:4,payload:{preferred_name:'Ana'}});
    expect(saved.consents[0].decision).toBe('granted');
  });
  it('seguimiento: aislamiento, consentimiento, reintentos y revisión profesional',async()=>{
    const id='20000000-0000-4000-a000-000000000001';const data={kind:'weight',value:65,note:''};
    await expect(rpc(a,'save_care_record',[patient,id,'2026-09-10',data])).rejects.toMatchObject({code:'42501'});
    const c=CONSENT_CATALOG.find(c=>c.purpose==='measurement')!;
    await rpc(a,'record_patient_consent',[patient,c.purpose,c.text_version,c.text_hash,'granted']);
    const first=await rpc(a,'save_care_record',[patient,id,'2026-09-10',data]);
    expect((await rpc(a,'save_care_record',[patient,id,'2026-09-10',data])).id).toBe(first.id);
    await expect(rpc(a,'save_care_record',[patient,id,'2026-09-10',{...data,value:66}])).rejects.toMatchObject({code:'PT409'});
    await expect(rpc(b,'save_care_record',[patient,id,'2026-09-10',data])).rejects.toMatchObject({code:'42501'});
    expect(await asUser(b,'select * from public.care_records')).toEqual([]);
    expect(await asUser(other,'select * from public.care_records')).toEqual([]);
    await expect(asUser(a,"update public.care_records set reviewed_at=now() where id=$1",[id])).rejects.toMatchObject({code:'42501'});
    await expect(rpc(a,'review_care_record',[patient,id])).rejects.toMatchObject({code:'42501'});
    await rpc(pro,'review_care_record',[patient,id]);
    expect((await asUser(pro,'select reviewed_at from public.care_records where id=$1',[id]))[0].reviewed_at).toBeTruthy();
  });
  it('seguimiento: pagos sólo profesionales y borradores invisibles hasta publicación',async()=>{
    const payment='20000000-0000-4000-a000-000000000002';const request='20000000-0000-4000-a000-000000000003';const replacement='20000000-0000-4000-a000-000000000004';
    const data={kind:'payment',amount:24000,currency:'ARS',method:'transferencia',reference:'T1',note:''};
    await expect(rpc(a,'save_care_record',[patient,payment,'2026-09-10',data])).rejects.toMatchObject({code:'42501'});
    await rpc(pro,'save_care_record',[patient,payment,'2026-09-10',data]);
    expect(await asUser(a,'select id from public.care_records where id=$1',[payment])).toEqual([]);
    await rpc(a,'save_care_record',[patient,request,'2026-09-10',{kind:'menu_request',target:'Almuerzo',reason:'Otro ingrediente',replacement:'ingredient'}]);
    const c=CONSENT_CATALOG.find(c=>c.purpose==='ai_menu_draft')!;await rpc(a,'record_patient_consent',[patient,c.purpose,c.text_version,c.text_hash,'granted']);
    await asUser(pro,"insert into public.care_replacements(id,patient_id,request_id,source,recipe) values($1,$2,$3,'demo',$4)",[replacement,patient,request,{title:'Propuesta privada',ingredients:['ejemplo'],steps:['ejemplo'],explanation:'ejemplo'}]);
    expect(await asUser(a,'select * from public.care_replacements')).toEqual([]);
    const recipe={title:'Propuesta privada',ingredients:['ejemplo'],steps:['ejemplo'],explanation:'ejemplo'};
    await expect(rpc(a,'publish_care_replacement',[patient,replacement,recipe,recipe])).rejects.toMatchObject({code:'42501'});
    await expect(rpc(pro,'publish_care_replacement',[patient,replacement,{...recipe,title:'Otro'},recipe])).rejects.toMatchObject({code:'PT409'});
    await rpc(pro,'publish_care_replacement',[patient,replacement,recipe,{...recipe,title:'Revisado'}]);
    await rpc(pro,'publish_care_replacement',[patient,replacement,recipe,{...recipe,title:'Revisado'}]);
    expect(await asUser(a,'select id from public.care_replacements')).toEqual([{id:replacement}]);
    expect(await asUser(b,'select * from public.care_replacements')).toEqual([]);
  });
  it('seguimiento: valida payload directo y preferencias propias',async()=>{
    const id='20000000-0000-4000-a000-000000000005';
    await expect(rpc(a,'save_care_record',[patient,id,'2026-09-10',{kind:'weight',value:-3,note:''}])).rejects.toMatchObject({code:'22023'});
    await expect(rpc(a,'save_care_record',[patient,id,'2026-09-10',{kind:'weight',value:60,note:'',reviewed_at:'hoy'}])).rejects.toMatchObject({code:'22023'});
    await expect(rpc(a,'save_care_preferences',[patient,{water:true}])).rejects.toMatchObject({code:'22023'});
    const prefs={water:true,water_interval:120,weight:true,waist:false,activity:false,rest:true,rest_time:'22:30'};
    await rpc(a,'save_care_preferences',[patient,prefs]);
    expect((await asUser(a,'select settings from public.care_preferences'))[0].settings).toEqual(prefs);
    await expect(rpc(pro,'save_care_preferences',[patient,prefs])).rejects.toMatchObject({code:'42501'});
  });
  it('Storage privado: otro paciente no puede leer, retirar consentimiento bloquea y permite eliminar',async()=>{
    await db.exec('grant select,insert,delete on storage.objects to authenticated');
    const id='20000000-0000-4000-a000-000000000006';const path=`${patient}/${id}`;const c=CONSENT_CATALOG.find(c=>c.purpose==='body_progress')!;
    await expect(asUser(a,"insert into storage.objects(bucket_id,name) values('care-photos',$1)",[path])).rejects.toMatchObject({code:'42501'});
    await rpc(a,'record_patient_consent',[patient,c.purpose,c.text_version,c.text_hash,'granted']);
    await asUser(a,"insert into storage.objects(bucket_id,name) values('care-photos',$1)",[path]);
    await rpc(a,'save_care_record',[patient,id,'2026-09-10',{kind:'body_photo',path,note:''}]);
    expect(await asUser(pro,'select name from storage.objects where name=$1',[path])).toEqual([{name:path}]);
    expect(await asUser(b,'select name from storage.objects where name=$1',[path])).toEqual([]);
    await rpc(a,'record_patient_consent',[patient,c.purpose,c.text_version,c.text_hash,'withdrawn']);
    expect(await asUser(pro,'select name from storage.objects where name=$1',[path])).toEqual([]);
    await asUser(a,'delete from storage.objects where name=$1',[path]);
    await expect(rpc(a,'delete_care_photo',[patient,id])).rejects.toMatchObject({code:'PT409'});
    // Simula Storage.remove del backend autorizado: en Supabase elimina también el blob.
    await db.query('delete from storage.objects where name=$1',[path]);
    await rpc(a,'delete_care_photo',[patient,id]);
    expect((await db.query('select * from public.care_records where id=$1',[id])).rows).toEqual([]);
    expect((await db.query('select * from storage.objects where name=$1',[path])).rows).toEqual([]);
  });
  it('estudios: consentimiento, aislamiento A/B y retiro del blob',async()=>{
    await db.exec('grant select,insert,delete on storage.objects to authenticated');
    const id='20000000-0000-4000-a000-000000000007';const path=`${patient}/${id}`;
    const c=CONSENT_CATALOG.find(c=>c.purpose==='clinical_document')!;
    const data={kind:'clinical_document',path,mime:'application/pdf',filename:'laboratorio.pdf',document_kind:'laboratorio',note:''};
    await expect(asUser(a,"insert into storage.objects(bucket_id,name) values('care-documents',$1)",[path])).rejects.toMatchObject({code:'42501'});
    await rpc(a,'record_patient_consent',[patient,c.purpose,c.text_version,c.text_hash,'granted']);
    await asUser(a,"insert into storage.objects(bucket_id,name) values('care-documents',$1)",[path]);
    await rpc(a,'save_care_record',[patient,id,'2026-09-10',data]);
    expect(await asUser(pro,'select name from storage.objects where bucket_id=$1 and name=$2',['care-documents',path])).toEqual([{name:path}]);
    expect(await asUser(b,'select name from storage.objects where bucket_id=$1 and name=$2',['care-documents',path])).toEqual([]);
    await expect(rpc(b,'save_care_record',[patient,id,'2026-09-10',data])).rejects.toMatchObject({code:'42501'});
    await rpc(a,'record_patient_consent',[patient,c.purpose,c.text_version,c.text_hash,'withdrawn']);
    expect(await asUser(pro,'select name from storage.objects where bucket_id=$1 and name=$2',['care-documents',path])).toEqual([]);
    await asUser(a,'delete from storage.objects where name=$1',[path]);
    await expect(rpc(a,'delete_care_document',[patient,id])).rejects.toMatchObject({code:'PT409'});
    await db.query('delete from storage.objects where name=$1',[path]);
    await rpc(a,'delete_care_document',[patient,id]);
    expect((await db.query('select * from public.care_records where id=$1',[id])).rows).toEqual([]);
  });
  it('PV-15: intenciones service-managed, cuarentena propia y Nutri B aislada', async () => {
    await db.exec('grant select,insert,delete on storage.objects to authenticated');
    const intent = '30000000-0000-4000-a000-000000000001';
    const path = `patients/${patient}/q/${intent}`;
    await expect(asUser(a, 'insert into public.asset_upload_intents(id,patient_id,nutritionist_id,category,object_path,mime_declared,byte_limit,expires_at) values($1,$2,$3,$4,$5,$6,$7,now()+interval \'15 minutes\')', [intent, patient, (await asUser<{nutritionist_id:string}>(pro, 'select nutritionist_id from public.patients where id=$1', [patient]))[0].nutritionist_id, 'clinical_document', path, 'application/pdf', 1024])).rejects.toMatchObject({ code: '42501' });
    expect(await asUser(a, 'select id from public.asset_upload_intents')).toEqual([]);
    const nutriId = (await db.query<{ nutritionist_id: string }>('select nutritionist_id from public.patients where id=$1', [patient])).rows[0].nutritionist_id;
    await db.query(
      `insert into public.asset_upload_intents(id,patient_id,nutritionist_id,category,object_path,mime_declared,byte_limit,expires_at)
       values($1,$2,$3,'body_progress',$4,'image/png',1024,now()+interval '15 minutes')`,
      [intent, patient, nutriId, path],
    );
    expect(await asUser(a, 'select id from public.asset_upload_intents')).toEqual([]);
    expect(await asUser(pro, 'select object_path from public.asset_upload_intents')).toEqual([{ object_path: path }]);
    expect(await asUser(other, 'select id from public.asset_upload_intents')).toEqual([]);
    await expect(asUser(a, "insert into storage.objects(bucket_id,name) values('care-quarantine',$1)", ['mal.jpg'])).rejects.toMatchObject({ code: '42501' });
    await asUser(a, "insert into storage.objects(bucket_id,name) values('care-quarantine',$1)", [path]);
    expect(await asUser(a, 'select name from storage.objects where bucket_id=$1 and name=$2', ['care-quarantine', path])).toEqual([{ name: path }]);
    expect(await asUser(b, 'select name from storage.objects where bucket_id=$1 and name=$2', ['care-quarantine', path])).toEqual([]);
    expect(await asUser(pro, 'select name from storage.objects where bucket_id=$1 and name=$2', ['care-quarantine', path])).toEqual([]);
  });
});
