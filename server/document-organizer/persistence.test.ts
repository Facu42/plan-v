import { beforeAll,afterAll,describe,expect,it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { consentTextByPurpose } from '../intake/consent.js';
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222',u='33333333-3333-4333-8333-333333333333',n='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',nb='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',p='cccccccc-cccc-4ccc-8ccc-cccccccccccc',other='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
let db:PGlite;
const items=JSON.stringify([{text:'Antecedentes originales',category:'history',origin:{file:'test.pdf',fingerprint:'a'.repeat(64),page:2}}]);
async function actor(id:string){await db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id}',false)`);}
async function row(sql:string){return(await db.query<Record<string,unknown>>(sql)).rows[0];}
async function create(key:string,target=p){return(await row(`select public.document_organizer_enqueue('${target}','${key}','${'a'.repeat(64)}','${items}'::jsonb) as id`)).id as string;}
beforeAll(async()=>{
 db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table profiles(id uuid primary key,role text);create table nutritionists(id uuid primary key,user_id uuid references profiles);
 create table patients(id uuid primary key,user_id uuid,nutritionist_id uuid references nutritionists,archived_at timestamptz,deactivated_at timestamptz,anonymized_at timestamptz);
 create table consent_catalog(purpose text primary key,text_version text,text_hash text,body text,required boolean);
 create table consent_events(id uuid default gen_random_uuid(),patient_id uuid,purpose text,decision text,text_version text,text_hash text,sequence bigint generated always as identity);
 insert into profiles values('${a}','nutri'),('${b}','nutri'),('${u}','paciente');insert into nutritionists values('${n}','${a}'),('${nb}','${b}');insert into patients(id,user_id,nutritionist_id) values('${p}','${u}','${n}'),('${other}',null,'${nb}');`);
 const care=consentTextByPurpose('care_relationship');await db.query('insert into consent_catalog values($1,$2,$3,$4,false)',[care.purpose,care.text_version,care.text_hash,care.text]);
 await db.exec(await readFile(new URL('../../supabase/migrations/20261011140000_clinical_ai_budget.sql',import.meta.url),'utf8'));
 await db.exec(await readFile(new URL('../../supabase/migrations/20261012130000_document_organizer.sql',import.meta.url),'utf8'));
 // Regression Guard drill: mutation lives only in this disposable PostgreSQL, never application SQL.
 if(process.env.PLANV_ORGANIZER_FIRE_TEST==='1')await db.exec("create or replace function public.document_organizer_result_valid(result_value jsonb,source_items jsonb,subset boolean) returns boolean language sql immutable as $$select true$$");
 for(const purpose of ['care_relationship','ai_document_import'])await db.exec(`insert into consent_events(patient_id,purpose,decision,text_version,text_hash) select '${p}',purpose,'granted',text_version,text_hash from consent_catalog where purpose='${purpose}'`);
},30000);
afterAll(async()=>{await db?.close();});
describe('organización privada SQL con etapas y revisión explícita',()=>{
 it('la reserva documental comparte la misma bolsa SQL y una llamada incierta conserva el saldo',async()=>{
  await db.exec('reset role;set role service_role;');
  await row("select public.reserve_clinical_ai_budget('consultation-test',to_char(now() at time zone 'America/Argentina/Buenos_Aires','YYYY-MM'),4999999)");
  await expect(row("select public.reserve_clinical_ai_budget('organize-test',to_char(now() at time zone 'America/Argentina/Buenos_Aires','YYYY-MM'),2)")).rejects.toThrow();
  await row("select public.settle_clinical_ai_budget('consultation-test','uncertain',0)");
  await expect(row("select public.reserve_clinical_ai_budget('organize-test',to_char(now() at time zone 'America/Argentina/Buenos_Aires','YYYY-MM'),2)")).rejects.toThrow();
  expect((await row('select used_micros from clinical_ai_budget_months')).used_micros).toBe(4999999);
 });
 it('aísla consultorios y no permite solicitar IA para contacto sin cuenta/permisos',async()=>{
  await actor(b);await expect(create('99999999-9999-4999-8999-999999999991',p)).rejects.toThrow();
  await expect(create('99999999-9999-4999-8999-999999999991',other)).rejects.toThrow();
  await actor(u);await expect(create('99999999-9999-4999-8999-999999999991')).rejects.toThrow();
 });
 it('confirmación idempotente, reserva excluyente y revisión no importan datos ni cambian el original',async()=>{
  await actor(a);const key='99999999-9999-4999-8999-999999999992',id=await create(key);expect(await create(key)).toBe(id);
  await db.exec('reset role;set role service_role;');const claim=(await row('select public.document_organizer_claim() as job')).job as {id:string;run_token:string};expect(claim.id).toBe(id);
  expect((await row('select public.document_organizer_claim() as job')).job).toBeNull();
  expect((await row(`select public.document_organizer_issue('${id}','${claim.run_token}') as ok`)).ok).toBe(true);
  await row(`select public.document_organizer_generated('${id}','${claim.run_token}','[{"index":0,"category":"study","heading":"Antecedentes"}]')`);
  await row(`select public.document_organizer_finish('${id}','${claim.run_token}',null)`);
  await actor(a);const before=(await row(`select public.document_organizer_read('${id}') as job`)).job as {revision:number;items:unknown};
  expect(before.items).toEqual(JSON.parse(items));
  const after=(await row(`select public.document_organizer_review('${id}',${before.revision},'[{"index":0,"category":"history","heading":"originales"}]') as job`)).job as {status:string;items:unknown};
  expect(after.status).toBe('reviewed');expect(after.items).toEqual(JSON.parse(items));
 });
 it('un envío interrumpido queda incierto y no se vuelve a reservar tras reiniciar',async()=>{
  await actor(a);const id=await create('99999999-9999-4999-8999-999999999993');await db.exec('reset role;set role service_role;');const task=(await row('select public.document_organizer_claim() as job')).job as {run_token:string};
  await row(`select public.document_organizer_issue('${id}','${task.run_token}')`);await db.exec(`reset role;update document_organizer_jobs set lease_until=now()-interval '1 second' where id='${id}';set role service_role;`);
  expect((await row('select public.document_organizer_claim() as job')).job).toBeNull();await actor(a);expect(((await row(`select public.document_organizer_read('${id}') as job`)).job as {status:string}).status).toBe('uncertain');
 });
 it('recupera una respuesta guardada sin repetir la llamada y rechaza resultados inventados',async()=>{
  await actor(a);const id=await create('99999999-9999-4999-8999-999999999994');await db.exec('reset role;set role service_role;');const task=(await row('select public.document_organizer_claim() as job')).job as {run_token:string};await row(`select public.document_organizer_issue('${id}','${task.run_token}')`);
  await expect(row(`select public.document_organizer_generated('${id}','${task.run_token}','[{"index":0,"category":"history","heading":"inventado"}]')`)).rejects.toThrow();
  await row(`select public.document_organizer_generated('${id}','${task.run_token}','[{"index":0,"category":"history","heading":"originales"}]')`);
  await db.exec(`reset role;update document_organizer_jobs set lease_until=now()-interval '1 second' where id='${id}';set role service_role;`);
  const recovered=(await row('select public.document_organizer_claim() as job')).job as {stage:string;run_token:string};expect(recovered.stage).toBe('generated');expect(recovered.run_token).not.toBe(task.run_token);
  expect((await row(`select public.document_organizer_finish('${id}','${task.run_token}',null) as ok`)).ok).toBe(false);expect((await row(`select public.document_organizer_finish('${id}','${recovered.run_token}',null) as ok`)).ok).toBe(true);
 });
 it('la baja o cambio de vínculo durante procesamiento impide guardar y revisar',async()=>{
  await actor(a);const id=await create('99999999-9999-4999-8999-999999999995');await db.exec('reset role;set role service_role;');const task=(await row('select public.document_organizer_claim() as job')).job as {run_token:string};
  await db.exec(`reset role;insert into consent_events(patient_id,purpose,decision,text_version,text_hash) select '${p}',purpose,'withdrawn',text_version,text_hash from consent_catalog where purpose='ai_document_import';set role service_role;`);
  expect((await row(`select public.document_organizer_allowed('${id}','${task.run_token}') as ok`)).ok).toBe(false);
  expect((await row(`select public.document_organizer_generated('${id}','${task.run_token}','[{"index":0,"category":"history","heading":"originales"}]') as ok`)).ok).toBe(false);
  await actor(a);const read=(await row(`select public.document_organizer_read('${id}') as job`)).job as {status:string;proposals:unknown[]};expect(read.status).toBe('cancelled');expect(read.proposals).toEqual([]);
 });
});
