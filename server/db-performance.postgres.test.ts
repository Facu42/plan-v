import { beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

// Rendimiento de la base (apartado E): lo que marca el asesor de Supabase no vuelve.
// Toda clave que apunta a otra tabla tiene un índice que empieza por esas columnas, y
// ninguna regla de acceso llama a auth.uid() fila por fila.

let db: PGlite;

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
  const migrations = new URL('../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(file, migrations), 'utf8'));
  }
}, 60_000);

describe('rendimiento de la base', () => {
  it('toda clave foránea de public tiene un índice que la cubre', async () => {
    const { rows } = await db.query<{ tbl: string; conname: string }>(`
      select c.conrelid::regclass::text as tbl, c.conname
      from pg_constraint c join pg_namespace n on n.oid = c.connamespace
      where c.contype = 'f' and n.nspname = 'public'
        and not exists (
          select 1 from pg_index i
          where i.indrelid = c.conrelid
            and (i.indkey::int2[])[0:array_length(c.conkey, 1) - 1] @> c.conkey
            and (i.indkey::int2[])[0:array_length(c.conkey, 1) - 1] <@ c.conkey)
      order by 1, 2`);
    expect(rows).toEqual([]);
  });

  it('ninguna regla de acceso llama a auth.uid() por cada fila', async () => {
    const { rows } = await db.query<{ tablename: string; policyname: string }>(`
      select tablename, policyname from pg_policies
      where schemaname = 'public'
        and (regexp_replace(coalesce(qual, '') || ' ' || coalesce(with_check, ''),
               '\\(\\s*select\\s+auth\\.uid\\(\\)\\s+as\\s+uid\\s*\\)', '', 'gi') ~* 'auth\\.uid\\(\\)')
      order by 1, 2`);
    expect(rows).toEqual([]);
  });
});
