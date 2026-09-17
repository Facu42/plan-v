import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
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
  for (const file of ['20260917190000_core.sql', '20260917190100_intake.sql']) {
    try { await db.exec(await readFile(new URL(`../../supabase/migrations/${file}`, import.meta.url), 'utf8')); }
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
});
