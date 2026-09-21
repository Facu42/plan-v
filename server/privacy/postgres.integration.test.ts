import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let db: PGlite;
let dir: string;
const nutriA = '00000000-0000-4000-a000-0000000000a1';
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
  dir = await mkdtemp(join(tmpdir(), 'plan-v-privacy-'));
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
    [patientAUser, 'paciente-a@example.test'],
    [patientBUser, 'paciente-b@example.test'],
  ] as const) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, email]);
  }
  const nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  await db.query(
    `insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status)
     values ($1,$2,$3,'Paciente A','waived'),($4,$2,$5,'Paciente B','waived')`,
    [patientA, nutriAId, patientAUser, patientB, patientBUser],
  );
}, 60000);

afterAll(async () => {
  await db?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('PV-31 privacidad en PostgreSQL descartable', () => {
  it('el paciente exporta y descarga, el otro no, y el delete no toca payments', async () => {
    const created = await rpc(patientAUser, 'request_privacy_action', [{ patient_id: patientA, kind: 'export' }]) as { id: string; kind: string; status: string };
    expect(created.kind).toBe('export');
    expect(created.status).toBe('in_progress');

    const completed = await rpc(patientAUser, 'complete_privacy_export', [{
      request_id: created.id,
      package: { version: 'privacy-export.v1', patient_id: patientA, retained: { payments: 'se conservan' } },
    }]) as { id: string; status: string };
    expect(completed.status).toBe('completed');

    await expect(rpc(patientAUser, 'complete_privacy_export', [{
      request_id: created.id,
      package: { clinical_notes: [] },
    }])).rejects.toMatchObject({ code: '22023' });

    const downloaded = await rpc(patientAUser, 'get_privacy_package', [created.id]) as { package: Record<string, unknown> };
    expect(downloaded.package.version).toBe('privacy-export.v1');
    expect(downloaded.package).not.toHaveProperty('clinical_notes');

    await expect(rpc(patientBUser, 'get_privacy_package', [created.id])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientBUser, 'request_privacy_action', [{ patient_id: patientA, kind: 'export' }])).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(patientAUser, 'insert into public.privacy_requests(patient_id, kind) values($1,$2)', [patientA, 'export'])).rejects.toMatchObject({ code: '42501' });

    const deleted = await rpc(patientAUser, 'request_privacy_action', [{ patient_id: patientA, kind: 'delete' }]) as { id: string; kind: string };
    expect(deleted.kind).toBe('delete');
    await rpc(patientAUser, 'complete_privacy_delete', [deleted.id]);
    const row = await db.query<{ deactivated_at: string | null; deletion_requested_at: string | null }>(
      'select deactivated_at, deletion_requested_at from public.patients where id=$1',
      [patientA],
    );
    expect(row.rows[0].deactivated_at).toBeTruthy();
    expect(row.rows[0].deletion_requested_at).toBeTruthy();
    expect((await db.query('select count(*)::int as n from public.payments')).rows[0]).toMatchObject({ n: 0 });
  });

  it('sin las RPC nuevas el pedido no se disfraza de insert a privacy_requests', async () => {
    await db.exec('drop function public.request_privacy_action(jsonb)');
    await expect(rpc(patientBUser, 'request_privacy_action', [{ patient_id: patientB, kind: 'export' }])).rejects.toMatchObject({ code: '42883' });
  });
});
