import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CONSENT_CATALOG } from './consent.js';
let db: PGlite; let dir: string;
const a = '00000000-0000-4000-a000-000000000011'; const b = '00000000-0000-4000-a000-000000000012'; const pro = '00000000-0000-4000-a000-000000000013'; const admin = '00000000-0000-4000-a000-000000000014';
const patient = '10000000-0000-4000-a000-000000000011'; const care = CONSENT_CATALOG.find(c => c.purpose === 'care_relationship')!;
async function asUser(user: string, sql: string, args: unknown[] = []) {
  return db.transaction(async tx => { await tx.exec('set local role authenticated'); await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user]); return (await tx.query<{ result: any }>(sql, args)).rows; });
}
async function rpc(user: string, name: string, args: unknown[] = [], schema = 'public') { return (await asUser(user, `select ${schema}.${name}(${args.map((_, i) => `$${i + 1}`).join(',')}) as result`, args))[0].result; }
beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-reopen-')); db = new PGlite(dir);
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    grant usage on schema public, auth, storage to authenticated, anon, service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;`);
  const migrations = new URL('../../supabase/migrations/', import.meta.url);
  for (const name of (await readdir(migrations)).filter(n => n.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(name, migrations), 'utf8'));
  for (const id of [a, b, pro, admin]) await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, `${id}@example.test`]);
  await db.query('insert into public.platform_admins(user_id) values($1)', [admin]);
  const n = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Pro') as id", [pro])).rows[0].id;
  await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values($1,$2,$3,'Ana','waived')", [patient, n, a]);
  await rpc(a, 'get_patient_intake', [patient]);
  await rpc(a, 'save_patient_intake', [patient, 1, 'allergies', { preferred_name: 'Ana', allergies: { state: 'reported', items: ['Maní'] }, patient_intent: 'Mi pedido' }]);
  await rpc(a, 'record_patient_consent', [patient, care.purpose, care.text_version, care.text_hash, 'granted']);
  await rpc(a, 'submit_patient_intake', [patient, 2]); await rpc(pro, 'review_patient_intake', [patient, 3]);
}, 60000);
afterAll(async () => { await db?.close(); if (dir) await rm(dir, { recursive: true, force: true }); });
describe('migración reapertura/historial privado (cadena completa)', () => {
  it('deniega paciente ajeno, profesional y administrador, incluso llamando helper privado', async () => {
    for (const user of [b, pro, admin]) for (const schema of ['public', 'private']) await expect(rpc(user, 'reopen_patient_intake', [patient, 4], schema)).rejects.toMatchObject({ code: '42501' });
    for (const user of [a, b, pro, admin]) await expect(asUser(user, 'select * from private.intake_revision_history')).rejects.toMatchObject({ code: '42501' });
    const grants = await db.query<{ allowed: boolean }>("select has_function_privilege('anon',p.oid,'execute') as allowed from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.proname='reopen_patient_intake'");
    expect(grants.rows).toHaveLength(2); expect(grants.rows.every(g => !g.allowed)).toBe(true);
  });
  it('preserva exactamente la ficha revisada y el consentimiento; limpiar revisión actual no elimina el historial', async () => {
    const before = await rpc(a, 'get_patient_intake', [patient]);
    const original = (await db.query<{snapshot:Record<string,unknown>}>('select to_jsonb(i) as snapshot from public.intake_sessions i where patient_id=$1', [patient])).rows[0].snapshot;
    const opened = await rpc(a, 'reopen_patient_intake', [patient, 4]);
    expect(opened.intake).toMatchObject({ status: 'draft', step: 'profile', revision: 5, payload: before.intake.payload, submitted_at: null });
    expect(opened.consents).toEqual(before.consents); expect(opened).not.toHaveProperty('history'); expect(opened.intake).not.toHaveProperty('reviewed_by');
    const rows = (await db.query('select snapshot from private.intake_revision_history where patient_id=$1', [patient])).rows; expect(rows).toEqual([{ snapshot: original }]);
    expect(original).toMatchObject({ status: 'reviewed', reviewed_by: pro, revision: 4 });
    await expect(rpc(a, 'reopen_patient_intake', [patient, 4])).rejects.toMatchObject({ code: 'PT409' });
    await expect(rpc(a, 'save_patient_intake', [patient, 4, 'profile', { preferred_name: 'Obsoleto' }])).rejects.toMatchObject({ code: 'PT409' });
    await expect(rpc(a, 'submit_patient_intake', [patient, 2])).rejects.toMatchObject({ code: 'PT409' });
    expect((await rpc(a, 'reopen_patient_intake', [patient, 5])).intake.revision).toBe(5);
  });
  it('guarda corrección, conserva alergias y vuelve a exigir revisión profesional', async () => {
    const payload = (await rpc(a, 'get_patient_intake', [patient])).intake.payload;
    await rpc(a, 'save_patient_intake', [patient, 5, 'review', { ...payload, preferred_name: 'Ana corregida' }]);
    await rpc(a, 'submit_patient_intake', [patient, 6]);
    expect((await rpc(a, 'get_patient_intake', [patient])).intake).toMatchObject({ status: 'submitted', revision: 7, payload: { preferred_name: 'Ana corregida', allergies: { items: ['Maní'] } } });
    await rpc(pro, 'review_patient_intake', [patient, 7]);
    const race = await Promise.allSettled([rpc(a, 'reopen_patient_intake', [patient, 8]), rpc(a, 'reopen_patient_intake', [patient, 8])]);
    expect(race.filter(r => r.status === 'fulfilled')).toHaveLength(1); expect(race.find(r => r.status === 'rejected')).toMatchObject({ reason: { code: 'PT409' } });
    expect((await db.query('select revision from private.intake_revision_history where patient_id=$1 order by revision', [patient])).rows).toEqual([{ revision: 4 }, { revision: 8 }]);
  });
  it('persisten datos e historial al reabrir base y retirar consentimiento no altera versiones conservadas', async () => {
    await rpc(a, 'record_patient_consent', [patient, care.purpose, care.text_version, care.text_hash, 'withdrawn']);
    await db.close(); db = new PGlite(dir);
    const saved = await rpc(a, 'get_patient_intake', [patient]); expect(saved.intake).toMatchObject({ status: 'draft', revision: 9, payload: { preferred_name: 'Ana corregida' } }); expect(saved.consents[0].decision).toBe('withdrawn');
    await expect(rpc(a, 'submit_patient_intake', [patient, 9])).rejects.toMatchObject({ message: 'intake_consent_required' });
    expect((await db.query('select revision from private.intake_revision_history where patient_id=$1', [patient])).rows).toHaveLength(2);
  });
});
