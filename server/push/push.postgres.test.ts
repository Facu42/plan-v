import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Todas las migraciones en un Postgres descartable: la tabla de teléfonos queda fuera del alcance de las sesiones.
let db: PGlite;
const user = '00000000-0000-4000-a000-0000000000d1';

beforeAll(async () => {
  db = new PGlite();
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
  for (const file of (await readdir(migrations)).filter(name => name.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(file, migrations), 'utf8'));
  await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'paciente@example.test',now())", [user]);
  await db.query("insert into public.push_subscriptions(user_id,endpoint,p256dh,auth) values($1,'https://fcm.googleapis.com/fcm/send/a','BKey','aut')", [user]);
}, 60000);
afterAll(async () => { await db?.close(); });

describe('push_subscriptions', () => {
  it('una sesión del navegador no puede leer ni escribir teléfonos, ni siquiera los propios', async () => {
    const asUser = (sql: string) => db.transaction(async tx => {
      await tx.exec('set local role authenticated');
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user]);
      return tx.query(sql);
    });
    await expect(asUser('select * from public.push_subscriptions')).rejects.toThrow(/permission denied/);
    await expect(asUser(`insert into public.push_subscriptions(user_id,endpoint,p256dh,auth) values('${user}','https://fcm.googleapis.com/b','k','a')`)).rejects.toThrow(/permission denied/);
  });

  it('rechaza direcciones que no son https y repetidas', async () => {
    await expect(db.query("insert into public.push_subscriptions(user_id,endpoint,p256dh,auth) values($1,'http://x.test','k','a')", [user])).rejects.toThrow(/push_subscriptions_endpoint_https/);
    await expect(db.query("insert into public.push_subscriptions(user_id,endpoint,p256dh,auth) values($1,'https://fcm.googleapis.com/fcm/send/a','k','a')", [user])).rejects.toThrow(/duplicate key/);
  });

  it('al borrar la cuenta se borran sus teléfonos', async () => {
    await db.query('delete from auth.users where id=$1', [user]);
    expect((await db.query<{ n: number }>('select count(*)::int as n from public.push_subscriptions')).rows[0].n).toBe(0);
  });
});
