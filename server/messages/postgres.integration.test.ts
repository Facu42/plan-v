import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let db: PGlite;
let dir: string;
const nutriA = '00000000-0000-4000-a000-0000000000a1';
const nutriB = '00000000-0000-4000-a000-0000000000b1';
const patientAUser = '00000000-0000-4000-a000-0000000000a2';
const patientBUser = '00000000-0000-4000-a000-0000000000b2';
const patientA = '10000000-0000-4000-a000-0000000000a1';
const patientB = '10000000-0000-4000-a000-0000000000b1';
const clientId = '55555555-5555-4555-8555-555555555555';

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

function sendPayload(overrides: Record<string, unknown> = {}) {
  return {
    patient_id: patientA,
    client_id: clientId,
    text: '¿Revisamos la merienda?',
    ...overrides,
  };
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-messages-'));
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
  const nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  const nutriBId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri B') as id", [nutriB])).rows[0].id;
  await db.query(
    `insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status)
     values ($1,$2,$3,'Paciente A','waived'),($4,$5,$6,'Paciente B','waived')`,
    [patientA, nutriAId, patientAUser, patientB, nutriBId, patientBUser],
  );
}, 60000);

afterAll(async () => {
  await db?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('PV-23 hilos en PostgreSQL descartable', () => {
  it('envía sin duplicar, aísla a Nutri B y deja entrega/lectura inmutables', async () => {
    const sent = await rpc(patientAUser, 'send_thread_message', [sendPayload()]) as {
      message: { id: string; text: string; from: string; delivered_at: string | null; read_at: string | null; suggested_by_ai?: boolean };
      duplicate: boolean;
    };
    expect(sent.duplicate).toBe(false);
    expect(sent.message).toMatchObject({
      text: '¿Revisamos la merienda?',
      from: 'patient',
      delivered_at: null,
      read_at: null,
    });
    expect(sent.message).not.toHaveProperty('suggested_by_ai');
    expect(sent.message).not.toHaveProperty('client_id');

    const replayed = await rpc(patientAUser, 'send_thread_message', [sendPayload({ text: 'otro' })]) as {
      message: { id: string; text: string };
      duplicate: boolean;
    };
    expect(replayed.duplicate).toBe(true);
    expect(replayed.message.id).toBe(sent.message.id);
    expect(replayed.message.text).toBe('¿Revisamos la merienda?');

    const listed = await rpc(nutriA, 'list_thread_messages', [patientA, false]) as Array<{ id: string; delivered_at: string | null; read_at: string | null }>;
    expect(listed[0]).toMatchObject({ id: sent.message.id, delivered_at: null, read_at: null });

    const delivered = await rpc(nutriA, 'ack_thread_delivery', [patientA]) as Array<{ delivered_at: string | null; read_at: string | null }>;
    expect(typeof delivered[0].delivered_at).toBe('string');
    expect(delivered[0].read_at).toBeNull();

    const firstRead = await rpc(nutriA, 'mark_thread_read', [patientA]) as Array<{ delivered_at: string; read_at: string }>;
    expect(typeof firstRead[0].read_at).toBe('string');
    const secondRead = await rpc(nutriA, 'mark_thread_read', [patientA]) as Array<{ delivered_at: string; read_at: string }>;
    expect(secondRead[0].read_at).toBe(firstRead[0].read_at);
    expect(secondRead[0].delivered_at).toBe(firstRead[0].delivered_at);

    await expect(rpc(patientBUser, 'send_thread_message', [sendPayload({ client_id: '66666666-6666-4666-8666-666666666666' })])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(nutriB, 'list_thread_messages', [patientA, false])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(nutriB, 'mark_thread_read', [patientA])).rejects.toMatchObject({ code: '42501' });
    expect(await asUser(nutriB, 'select message_id from public.message_receipts')).toEqual([]);
    await expect(asUser(nutriA, 'update public.message_receipts set read_at=now()')).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(patientAUser, 'update public.messages set body=$1', ['editado'])).rejects.toMatchObject({ code: '42501' });
  });

  it('sin RPC de hilos el persistente falla cerrado', async () => {
    await db.exec('alter function public.send_thread_message(jsonb) rename to send_thread_message_pv23_hidden');
    try {
      await expect(rpc(patientAUser, 'send_thread_message', [sendPayload({ client_id: '77777777-7777-4777-8777-777777777777' })])).rejects.toMatchObject({ code: '42883' });
    } finally {
      await db.exec('alter function public.send_thread_message_pv23_hidden(jsonb) rename to send_thread_message');
    }
  });
});
