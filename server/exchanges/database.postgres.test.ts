import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Equivalencias sobre la cadena completa de migraciones, con dos consultorios, una paciente y la
// cuenta administradora. Base descartable en memoria; sólo identidades ficticias.
let db: PGlite;
const nutriAUser = '00000000-0000-4000-a000-0000000000a1';
const nutriBUser = '00000000-0000-4000-a000-0000000000b1';
const patientUser = '00000000-0000-4000-a000-0000000000a2';
const adminUser = '00000000-0000-4000-a000-0000000000ad';
const listId = '10000000-0000-4000-8000-000000000001';
const systemId = '10000000-0000-4000-8000-000000000002';
const groupId = '10000000-0000-4000-8000-000000000003';
const foodA = '20000000-0000-4000-8000-00000000000a';
let nutriA = '';
let nutriB = '';

const item = { food_id: null, name: 'Arroz integral cocido', measure: '1 taza', grams: 180 };
const listPayload = { name: 'Cereales de A', description: '', justification: 'Hidratos similares.', base: item, items: [{ ...item, name: 'Fideos', measure: '1 taza', grams: 140 }] };
const groupPayload = { name: 'Lácteos de A', description: '', portion: null, foods: [{ food_id: null, name: 'Yogur natural' }] };
const foodPayload = { name: 'Avena de A', brand: '', category: '', kind: 'food', source: 'Etiqueta', reference: '', nutrients: { kcal: 380, protein: null, carbs: null, fat: null, fiber: null, sodium: null, calcium: null, iron: null, potassium: null, magnesium: null, vitamin_c: null }, portions: [] };

async function as<T = Record<string, unknown>>(role: 'anon' | 'authenticated' | 'service_role', user: string, sql: string, params: unknown[] = []) {
  return db.transaction(async tx => {
    await tx.exec(`set local role ${role}`);
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user]);
    return (await tx.query<T>(sql, params)).rows;
  });
}
const rows = (user: string) => as<{ id: string; owner_id: string | null; kind: string }>('authenticated', user, 'select id,owner_id,kind from public.exchange_catalog order by id');
const save = async (user: string, id: string, kind: string, revision: number, payload: unknown) =>
  (await as<{ saved: { id: string; revision: number; owner_id: string; payload: { name: string } } }>('authenticated', user, 'select public.save_exchange_entry($1::uuid,$2,$3::bigint,$4::jsonb) as saved', [id, kind, revision, JSON.stringify(payload)]))[0].saved;
const archive = async (user: string, id: string, revision: number) =>
  (await as<{ done: { archived_at: string | null } }>('authenticated', user, 'select public.archive_exchange_entry($1::uuid,$2::bigint) as done', [id, revision]))[0].done;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;
    grant usage on schema public,auth,storage to authenticated,anon,service_role;
    alter default privileges in schema public grant all on functions to anon,authenticated,service_role;
    alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,last_sign_in_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;
    grant select,insert,delete on storage.objects to authenticated;
    create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;`);
  const root = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(root)).filter(name => name.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(file, root), 'utf8'));
  for (const [id, email] of [[nutriAUser, 'a@example.test'], [nutriBUser, 'b@example.test'], [patientUser, 'paciente@example.test'], [adminUser, 'admin@example.test']])
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, email]);
  nutriA = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Consultorio A') as id", [nutriAUser])).rows[0].id;
  nutriB = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Consultorio B') as id", [nutriBUser])).rows[0].id;
  // Una lista de Sistema, cargada por el servicio con sus propias credenciales.
  await as('service_role', '', 'insert into public.exchange_catalog(id,owner_id,kind,payload) values($1,null,$2,$3::jsonb)', [systemId, 'list', JSON.stringify({ ...listPayload, name: 'Sistema cereales' })]);
}, 120000);
afterAll(async () => { await db?.close(); });

describe('equivalencias en la base', () => {
  it('cada consultorio guarda lo suyo y la lista de Sistema se comparte sólo para lectura', async () => {
    const saved = await save(nutriAUser, listId, 'list', 0, listPayload);
    expect(saved).toMatchObject({ id: listId, revision: 1, owner_id: nutriA });
    await save(nutriAUser, groupId, 'group', 0, groupPayload);
    expect((await rows(nutriAUser)).map(r => r.id).sort()).toEqual([listId, systemId, groupId].sort());
    // B ve Sistema pero ni rastro de lo de A.
    expect((await rows(nutriBUser)).map(r => r.id)).toEqual([systemId]);
    // B no puede editar, reemplazar ni archivar lo de A, ni leerlo por identificador.
    await expect(save(nutriBUser, listId, 'list', 1, { ...listPayload, name: 'Robada' })).rejects.toMatchObject({ code: 'PT409' });
    await expect(save(nutriBUser, listId, 'list', 0, { ...listPayload, name: 'Robada' })).rejects.toMatchObject({ code: '23505' });
    await expect(archive(nutriBUser, listId, 1)).rejects.toMatchObject({ code: '42501' });
    expect(await as('authenticated', nutriBUser, 'select 1 from public.exchange_catalog where id=$1', [listId])).toEqual([]);
    // Nadie edita Sistema desde un consultorio.
    await expect(save(nutriAUser, systemId, 'list', 1, { ...listPayload, name: 'Tocada' })).rejects.toMatchObject({ code: 'PT409' });
    await expect(save(nutriAUser, systemId, 'list', 0, { ...listPayload, name: 'Tocada' })).rejects.toMatchObject({ code: '23505' });
    await expect(archive(nutriAUser, systemId, 1)).rejects.toMatchObject({ code: '42501' });
    // Ni insertar filas de Sistema ni de otro consultorio por la API de datos.
    await expect(as('authenticated', nutriAUser, 'insert into public.exchange_catalog(id,owner_id,kind,payload) values($1,null,$2,$3::jsonb)', [crypto.randomUUID(), 'list', JSON.stringify(listPayload)])).rejects.toMatchObject({ code: '42501' });
    await expect(as('authenticated', nutriAUser, 'insert into public.exchange_catalog(id,owner_id,kind,payload) values($1,$2,$3,$4::jsonb)', [crypto.randomUUID(), nutriB, 'list', JSON.stringify(listPayload)])).rejects.toMatchObject({ code: '42501' });
    await expect(as('authenticated', nutriAUser, 'update public.exchange_catalog set owner_id=$1 where id=$2', [nutriB, listId])).rejects.toMatchObject({ code: '42501' });
    await expect(as('authenticated', nutriAUser, 'delete from public.exchange_catalog where id=$1', [listId])).rejects.toMatchObject({ code: '42501' });
  });
  it('la paciente, la cuenta administradora sin consultorio y anon no leen ni escriben', async () => {
    for (const user of [patientUser, adminUser]) {
      expect(await rows(user)).toEqual([]);
      await expect(save(user, crypto.randomUUID(), 'list', 0, listPayload)).rejects.toMatchObject({ code: '42501' });
    }
    await expect(as('anon', '', 'select * from public.exchange_catalog')).rejects.toMatchObject({ code: '42501' });
    await expect(as('anon', '', 'select public.save_exchange_entry($1::uuid,$2,0,$3::jsonb)', [crypto.randomUUID(), 'list', JSON.stringify(listPayload)])).rejects.toMatchObject({ code: '42501' });
  });
  it('controla revisión, tipo, contenido y alimentos vinculados', async () => {
    const edited = await save(nutriAUser, listId, 'list', 1, { ...listPayload, name: 'Cereales editados' });
    expect(edited).toMatchObject({ revision: 2, payload: { name: 'Cereales editados' } });
    await expect(save(nutriAUser, listId, 'list', 1, listPayload)).rejects.toMatchObject({ code: 'PT409' });
    await expect(save(nutriAUser, listId, 'group', 2, groupPayload)).rejects.toMatchObject({ code: '22023' });
    await expect(save(nutriAUser, crypto.randomUUID(), 'list', 0, { ...listPayload, items: [] })).rejects.toMatchObject({ code: '22023' });
    await expect(save(nutriAUser, crypto.randomUUID(), 'list', 0, { ...listPayload, base: { ...item, grams: 0 } })).rejects.toMatchObject({ code: '22023' });
    await expect(save(nutriAUser, crypto.randomUUID(), 'list', 0, { ...listPayload, extra: true })).rejects.toMatchObject({ code: '22023' });
    await expect(save(nutriAUser, crypto.randomUUID(), 'group', 0, { ...groupPayload, foods: [] })).rejects.toMatchObject({ code: '22023' });
    await expect(save(nutriAUser, crypto.randomUUID(), 'otro', 0, listPayload)).rejects.toMatchObject({ code: '22023' });
    // Un alimento propio de A se puede vincular; B no puede vincularlo ni conocerlo.
    await as('authenticated', nutriAUser, 'select public.save_food_catalog_item($1::uuid,0,$2::jsonb)', [foodA, JSON.stringify(foodPayload)]);
    const linked = { ...listPayload, items: [{ ...item, food_id: foodA, name: 'Avena de A', grams: 30 }] };
    expect((await save(nutriAUser, listId, 'list', 2, linked)).revision).toBe(3);
    await expect(save(nutriBUser, crypto.randomUUID(), 'list', 0, linked)).rejects.toMatchObject({ code: '22023' });
  });
  it('archivar retira la entrada del consultorio, exige revisión y conserva la fila', async () => {
    await expect(archive(nutriAUser, groupId, 99)).rejects.toMatchObject({ code: 'PT409' });
    expect((await archive(nutriAUser, groupId, 1)).archived_at).not.toBeNull();
    await expect(save(nutriAUser, groupId, 'group', 2, groupPayload)).rejects.toMatchObject({ code: 'PT409' });
    const stored = await db.query<{ archived_at: string | null }>('select archived_at from public.exchange_catalog where id=$1', [groupId]);
    expect(stored.rows[0].archived_at).not.toBeNull();
  });
  it('las tablas no quedan abiertas por defecto', async () => {
    for (const role of ['anon', 'authenticated'] as const)
      for (const privilege of ['DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'])
        expect((await db.query<{ ok: boolean }>('select has_table_privilege($1,$2,$3) as ok', [role, 'public.exchange_catalog', privilege])).rows[0].ok, `${role} ${privilege}`).toBe(false);
    expect((await db.query<{ ok: boolean }>("select has_table_privilege('anon','public.exchange_catalog','SELECT') as ok")).rows[0].ok).toBe(false);
    expect((await db.query<{ rls: boolean }>("select relrowsecurity as rls from pg_class where oid='public.exchange_catalog'::regclass")).rows[0].rls).toBe(true);
  });
});
