import { productFixtureArgs } from '../testing/product-rpc-fixture';
import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { unavailableCard } from '../../src/types/recipe-plate.js';

let db: PGlite;
const owner = '00000000-0000-4000-a000-000000000061';
const outsider = '00000000-0000-4000-a000-000000000062';
const patientUser = '00000000-0000-4000-a000-000000000063';
const adminUser = '00000000-0000-4000-a000-000000000064';
const patient = '10000000-0000-4000-a000-000000000061';
let nid: string;
let rid: string;
let vid: string;
const content = () => ({ id: rid, title: 'Ensalada de tomate', yield_portions: 1, steps: ['Lavar el tomate.', 'Cortar y servir.'], nutrient_source: '', items: [{ name: 'Tomate', quantity: 100, unit: 'g' }] });
async function asUser<T = Record<string, unknown>>(user: string, sql: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [user]);
    return (await tx.query<T>(sql, params)).rows;
  });
}
async function rpc<T = Record<string, unknown>>(user: string, name: string, args: unknown[] = []): Promise<T> {
  args = await productFixtureArgs(db, name, args);
  return (await asUser<{ result: T }>(user, `select public.${name}(${args.map((_, i) => `$${i + 1}`).join(',')}) as result`, args))[0].result;
}
async function objectUrl() {
  const path = `${nid}/${vid}/${randomUUID()}.png`;
  await asUser(owner, "insert into storage.objects(bucket_id,name) values('recipe-covers',$1)", [path]);
  return `https://synthetic.supabase.co/storage/v1/object/public/recipe-covers/${path}`;
}
beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    grant usage on schema public,auth,storage to authenticated,anon,service_role;
    alter default privileges in schema public grant all on functions to anon,authenticated,service_role;
    alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,last_sign_in_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant select,insert,delete on storage.objects to authenticated;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
  `);
  const migrations = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(file, migrations), 'utf8'));
  for (const user of [owner, outsider, patientUser, adminUser]) await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [user, `${user}@example.test`]);
  nid = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri ficticia') as id", [owner])).rows[0].id;
  await db.query("select public.provision_nutritionist($1,'Otra ficticia')", [outsider]);
  await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values($1,$2,$3,'Paciente ficticia','waived')", [patient, nid, patientUser]);
  await rpc(patientUser, 'save_patient_intake', [patient, 1, 'allergies', { preferred_name: 'Ficticia', allergies: { state: 'none', items: [] }, restrictions: { state: 'none', items: [] } }]);
}, 60000);
beforeEach(async () => {
  rid = randomUUID();
  const saved = await rpc<{ current: { id: string } }>(owner, 'save_recipe_draft', [{ ...content(), card: unavailableCard('Ensalada de tomate') }]);
  const recipe = await rpc<{ published: { id: string } }>(owner, 'publish_recipe', [rid, 1]);
  vid = recipe.published.id;
});
afterAll(async () => { await db?.close(); });

describe('foto manual con SQL real y Storage existente reproducido', () => {
  it('persiste portada de la versión aprobada y la paciente asignada la recibe al releer', async () => {
    const url = await objectUrl();
    const saved = await rpc(owner, 'save_manual_recipe_cover', [rid, 1, null, url]);
    expect(saved).toMatchObject({ cover_status: 'ready', cover_url: url });
    await rpc(owner, 'assign_recipe', [rid, patient, 1]);
    const reloaded = await rpc<Array<{ id: string; card: { cover_url: string } }>>(patientUser, 'list_assigned_recipes', [patient]);
    expect(reloaded.find((row) => row.id === rid)!.card.cover_url).toBe(url);
    expect(await asUser(patientUser, 'select * from public.recipe_covers')).toEqual([]);
  });
  it('la portada publicada conserva el título aprobado después de editar el borrador',async()=>{
    await rpc(owner,'save_recipe_draft',[{...content(),title:'Título privado nuevo'}]);
    const url=await objectUrl();
    const cover=await rpc(owner,'save_manual_recipe_cover',[rid,1,null,url]);
    expect(cover).toMatchObject({cover_alt:'Ensalada de tomate'});
  });
  it('rechaza paciente, otra profesional y una cuenta sin rol profesional', async () => {
    const url = await objectUrl();
    for (const user of [patientUser, outsider, adminUser, '']) await expect(rpc(user, 'save_manual_recipe_cover', [rid, 1, null, url])).rejects.toMatchObject({ code: '42501' });
    expect((await db.query('select * from public.recipe_covers where recipe_version_id=$1', [vid])).rows).toEqual([]);
    await expect(asUser(patientUser, "insert into storage.objects(bucket_id,name) values('recipe-covers',$1)", [`${nid}/${vid}/${randomUUID()}.png`])).rejects.toMatchObject({ code: '42501' });
  });
  it('CAS de portada y versión mantiene la foto anterior ante propuestas antiguas', async () => {
    const first = await objectUrl();
    await rpc(owner, 'save_manual_recipe_cover', [rid, 1, null, first]);
    const second = await objectUrl();
    await expect(rpc(owner, 'save_manual_recipe_cover', [rid, 1, null, second])).rejects.toMatchObject({ code: 'PT409' });
    await rpc(owner, 'save_recipe_draft', [{ ...content(), steps: ['Lavar y cortar el tomate.', 'Servir en un plato.'] }]);
    await rpc(owner, 'publish_recipe', [rid, 2]);
    await expect(rpc(owner, 'save_manual_recipe_cover', [rid, 1, first, second])).rejects.toMatchObject({ code: 'PT409' });
    expect((await db.query<{ url: string }>('select url from public.recipe_covers where recipe_version_id=$1', [vid])).rows[0].url).toBe(first);
  });
  it('la foto manual invalida una finalización IA anterior', async () => {
    const token = await rpc<string>(owner, 'claim_recipe_cover', [vid, false]);
    const manualUrl = await objectUrl();
    await rpc(owner, 'save_manual_recipe_cover', [rid, 1, null, manualUrl]);
    await expect(rpc(owner, 'finish_recipe_cover', [vid, token, 'ready', await objectUrl(), 'Otra foto'])).rejects.toMatchObject({ code: 'PT409' });
    expect((await db.query<{ url: string }>('select url from public.recipe_covers where recipe_version_id=$1', [vid])).rows[0].url).toBe(manualUrl);
  });
  it('la base rechaza URL fuera del namespace u objeto inexistente antes de modificar portada', async () => {
    for (const url of ['https://example.test/photo.png', `https://synthetic.supabase.co/storage/v1/object/public/recipe-covers/${nid}/${vid}/${randomUUID()}.png`]) {
      await expect(rpc(owner, 'save_manual_recipe_cover', [rid, 1, null, url])).rejects.toMatchObject({ code: '22023' });
    }
    expect((await db.query('select * from public.recipe_covers where recipe_version_id=$1', [vid])).rows).toEqual([]);
  });
  it('dos cambios con la misma portada esperada sólo confirman uno', async () => {
    const urls = [await objectUrl(), await objectUrl()];
    const results = await Promise.allSettled(urls.map((url) => rpc(owner, 'save_manual_recipe_cover', [rid, 1, null, url])));
    expect(results.filter((row) => row.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((row) => row.status === 'rejected')).toEqual([expect.objectContaining({ reason: expect.objectContaining({ code: 'PT409' }) })]);
  });
  it('los RPC nuevos no conceden ejecución a visitantes', async () => {
    for (const signature of ['public.save_manual_recipe_cover(uuid,int,text,text)', 'private.save_manual_recipe_cover(uuid,int,text,text)']) {
      expect((await db.query<{ allowed: boolean }>('select has_function_privilege($1,$2,\'execute\') as allowed', ['anon', signature])).rows[0].allowed).toBe(false);
    }
  });
});
