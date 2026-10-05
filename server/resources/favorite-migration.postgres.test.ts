import { afterAll, beforeAll, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import type { PatientLibraryView } from '../../src/types/resources.js';

let db: PGlite;
const pro = '00000000-0000-4000-a000-0000000000a1';
const user = '00000000-0000-4000-a000-0000000000a2';
const patient = '10000000-0000-4000-a000-0000000000a1';
let guideId: string;
let articleId: string;
let favoriteId: string;

async function rpc<T>(actor: string, name: string, args: unknown[]) {
  return db.transaction(async tx => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [actor]);
    return (await tx.query<{result:T}>(`select public.${name}(${args.map((_, i) => `$${i+1}`).join(',')}) as result`, args)).rows[0].result;
  });
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    grant usage on schema public,auth,storage to authenticated,anon,service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
    grant select,insert,delete on storage.objects to authenticated;
  `);
  const migrations = new URL('../../supabase/migrations/', import.meta.url);
  const productMigration = '20261005002314_harden_product_writes.sql';
  for (const file of (await readdir(migrations)).filter(name => name.endsWith('.sql') && name !== productMigration).sort()) {
    await db.exec(await readFile(new URL(file, migrations), 'utf8'));
  }
  await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now()),($3,$4,now())', [pro,'pro@example.test',user,'patient@example.test']);
  const nid = (await db.query<{id:string}>("select public.provision_nutritionist($1,'Profesional ficticia') as id", [pro])).rows[0].id;
  await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values($1,$2,$3,'Paciente ficticia','waived')", [patient,nid,user]);
  guideId = (await db.query<{id:string}>('select id from public.resources where slug=$1', ['leer-plan-semanal'])).rows[0].id;
  const article = await rpc<{id:string}>(pro,'save_editorial_resource',[guideId,'Artículo con alias UUID','Resumen ficticio.','Hábitos',[{title:'Uno',body:'Texto ficticio.'}],'clinical']);
  articleId = article.id;
  await rpc(pro,'publish_editorial_resource',[article.id]);
  await rpc(pro,'assign_editorial_resource',[guideId,[patient]]);
  await rpc(user,'toggle_favorite',[patient,'resource','leer-plan-semanal']);
  const legacy = await rpc<PatientLibraryView>(user,'toggle_favorite',[patient,'article',guideId]);
  favoriteId = legacy.favorites.find(f => f.item_kind === 'article')!.id;
  expect(legacy.favorites.find(f => f.id === favoriteId)?.item_id).toBe(guideId);
  await db.exec(await readFile(new URL(productMigration, migrations), 'utf8'));
}, 60000);

afterAll(async () => { await db?.close(); });

it('migra favoritos creados por el RPC anterior sin confundir un slug UUID con otro recurso', async () => {
  const current = await rpc<PatientLibraryView>(user,'get_patient_library',[patient]);
  expect(current.favorites).toHaveLength(2);
  expect(current.favorites.find(f => f.id === favoriteId)).toMatchObject({item_kind:'article',item_id:articleId});
  const removed = await rpc<PatientLibraryView>(user,'toggle_favorite',[patient,'article',articleId]);
  expect(removed.favorites).toHaveLength(1);
  expect(removed.favorites[0]).toMatchObject({item_kind:'resource',item_id:guideId});
});
