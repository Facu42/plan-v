import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { PatientLibraryView } from '../../src/types/resources.js';

let db: PGlite;
let dir: string;
let nutriAId = '';
const nutriA = '00000000-0000-4000-a000-0000000000a1';
const nutriB = '00000000-0000-4000-a000-0000000000b1';
const patientAUser = '00000000-0000-4000-a000-0000000000a2';
const patientBUser = '00000000-0000-4000-a000-0000000000b2';
const patientA = '10000000-0000-4000-a000-0000000000a1';
const patientB = '10000000-0000-4000-a000-0000000000b1';

async function asUser<T = Record<string, unknown>>(user: string, sql: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user]);
    return (await tx.query<T>(sql, params)).rows;
  });
}

async function rpc(user: string, name: string, args: unknown[] = []) {
  const rows = await asUser<{ result: unknown }>(user, `select public.${name}(${args.map((_, i) => `$${i + 1}`).join(',')}) as result`, args);
  return rows[0].result;
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-resources-'));
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
    grant select,insert,delete on storage.objects to authenticated;
  `);
  const migrations = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort()) {
    try { await db.exec(await readFile(new URL(file, migrations), 'utf8')); }
    catch (error) { console.error(file, JSON.stringify(error)); throw error; }
  }
  for (const [id, email] of [
    [nutriA, 'nutri-a@example.test'],
    [nutriB, 'nutri-b@example.test'],
    [patientAUser, 'paciente-a@example.test'],
    [patientBUser, 'paciente-b@example.test'],
  ] as const) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, email]);
  }
  nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  const nutriBId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri B') as id", [nutriB])).rows[0].id;
  await db.query(
    `insert into public.patients(id,nutritionist_id,user_id,full_name,plan_b,billing_status)
     values ($1,$2,$3,'Paciente A','Tostada de la ficha','waived'),($4,$5,$6,'Paciente B','','waived')`,
    [patientA, nutriAId, patientAUser, patientB, nutriBId, patientBUser],
  );
}, 60000);

afterAll(async () => {
  await db?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('PV-36 recursos en PostgreSQL descartable', () => {
  it('exige revisión para publicar, aísla artículos y persiste favoritos', async () => {
    const seed = await rpc(patientAUser, 'get_patient_library', [patientA, '']) as PatientLibraryView;
    expect(seed.resources).toHaveLength(6);
    expect(seed.articles).toEqual([]);
    expect(seed.plan_b).toBeNull();

    const assigned = await asUser<{ result: { assigned_count: number } }>(
      nutriA,
      'select public.assign_editorial_resource($1,$2::uuid[]) as result',
      ['hidratacion-cotidiana', [patientA]],
    );
    expect(assigned[0].result.assigned_count).toBe(1);

    const after = await rpc(patientAUser, 'get_patient_library', [patientA, 'agua']) as PatientLibraryView;
    expect(after.articles[0].slug).toBe('hidratacion-cotidiana');
    expect(after.articles[0].author_name).toContain('Plan V');
    expect(after.articles[0].reviewed_at).toBeTruthy();
    expect(after.hits.some((hit) => hit.kind === 'article')).toBe(true);

    const other = await rpc(patientBUser, 'get_patient_library', [patientB, '']) as PatientLibraryView;
    expect(other.articles).toEqual([]);

    await expect(rpc(nutriB, 'get_patient_library', [patientA, ''])).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(nutriB, 'select public.assign_editorial_resource($1,$2::uuid[])', ['hidratacion-cotidiana', [patientA]])).rejects.toMatchObject({ code: '42501' });

    const favored = await rpc(patientAUser, 'toggle_favorite', [patientA, 'article', 'hidratacion-cotidiana']) as PatientLibraryView;
    expect(favored.favorites[0].item_id).toBe('hidratacion-cotidiana');
    await expect(rpc(patientAUser, 'toggle_favorite', [patientA, 'article', 'comidas-fuera-de-casa'])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientAUser, 'toggle_favorite', [patientA, 'plan_b', patientA])).rejects.toMatchObject({ code: '22023' });

    const pro = await rpc(nutriA, 'get_patient_library', [patientA, 'tostada']) as PatientLibraryView;
    expect(pro.plan_b?.title).toContain('Tostada');
    expect(pro.hits.some((hit) => hit.kind === 'plan_b')).toBe(true);

    const draft = await asUser<{ result: { id: string; published: boolean } }>(nutriA, `
      select public.save_editorial_resource($1,$2,$3,$4,$5::jsonb,$6) as result
    `, ['nota-local', 'Borrador local', 'Resumen de borrador revisable.', 'Hábitos', JSON.stringify([{ title: 'Uno', body: 'Cuerpo' }]), 'clinical']);
    expect(draft[0].result.published).toBe(false);
    const hidden = await rpc(patientAUser, 'get_patient_library', [patientA, '']) as PatientLibraryView;
    expect(hidden.articles.some((entry) => entry.slug === 'nota-local')).toBe(false);

    const published = await rpc(nutriA, 'publish_editorial_resource', [draft[0].result.id]) as { published: boolean; reviewed_at: string };
    expect(published.published).toBe(true);
    expect(published.reviewed_at).toBeTruthy();
    await expect(rpc(patientAUser, 'publish_editorial_resource', [draft[0].result.id])).rejects.toMatchObject({ code: '42501' });
  });

  it('sin RPC falla cerrado', async () => {
    await db.exec('drop function public.get_patient_library(uuid, text)');
    await expect(rpc(patientAUser, 'get_patient_library', [patientA, ''])).rejects.toMatchObject({ code: '42883' });
  });
});
