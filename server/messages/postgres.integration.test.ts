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

describe('PV-24 adjuntos en PostgreSQL descartable', () => {
  it('adjunta un asset listo, aísla a Nutri B y falla cerrado sin RPC', async () => {
    const assetId = 'a0000000-0000-4000-a000-0000000000c1';
    const mealId = 'a0000000-0000-4000-a000-0000000000c2';
    const withdrawnId = 'a0000000-0000-4000-a000-0000000000c3';
    const extraId = 'a0000000-0000-4000-a000-0000000000c4';
    const nutriId = (await db.query<{ nutritionist_id: string }>('select nutritionist_id from public.patients where id=$1', [patientA])).rows[0].nutritionist_id;
    await db.query(
      `insert into public.patient_assets (id,patient_id,nutritionist_id,bucket,object_path,category,mime,byte_size,checksum_sha256,status)
       values
         ($1,$2,$3,'care-documents',$4,'chat_attachment','image/png',80,'aa','ready'),
         ($5,$2,$3,'meal-photos',$6,'meal_photo','image/png',80,'aa','ready'),
         ($7,$2,$3,'care-documents',$8,'chat_attachment','image/png',80,'aa','withdrawn'),
         ($9,$2,$3,'care-documents',$10,'chat_attachment','image/png',80,'aa','ready')`,
      [
        assetId, patientA, nutriId, `patients/${patientA}/${assetId}`,
        mealId, `patients/${patientA}/${mealId}`,
        withdrawnId, `patients/${patientA}/${withdrawnId}`,
        extraId, `patients/${patientA}/${extraId}`,
      ],
    );
    await db.query('update public.patient_assets set withdrawn_at=now() where id=$1', [withdrawnId]);

    const sent = await rpc(patientAUser, 'send_thread_attachment', [{
      patient_id: patientA,
      client_id: '88888888-8888-4888-8888-888888888888',
      text: 'Merienda',
      asset_id: assetId,
      filename: 'merienda.png',
    }]) as { message: { id: string; text: string; attachment?: { filename: string; kind: string; available: boolean } }; duplicate: boolean };
    expect(sent.duplicate).toBe(false);
    expect(sent.message.attachment).toMatchObject({ filename: 'merienda.png', kind: 'image', available: true });
    expect(sent.message).not.toHaveProperty('url');

    const replayed = await rpc(patientAUser, 'send_thread_attachment', [{
      patient_id: patientA,
      client_id: '88888888-8888-4888-8888-888888888888',
      text: 'otro',
      asset_id: assetId,
      filename: 'merienda.png',
    }]) as { message: { id: string }; duplicate: boolean };
    expect(replayed.duplicate).toBe(true);
    expect(replayed.message.id).toBe(sent.message.id);

    const opened = await rpc(nutriA, 'open_message_attachment', [patientA, sent.message.id]) as { asset_id: string; filename: string };
    expect(opened).toMatchObject({ asset_id: assetId, filename: 'merienda.png' });

    await expect(rpc(nutriB, 'open_message_attachment', [patientA, sent.message.id])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientBUser, 'send_thread_attachment', [{
      patient_id: patientA,
      client_id: '99999999-9999-4999-8999-999999999999',
      text: 'no',
      asset_id: extraId,
      filename: 'x.png',
    }])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientAUser, 'send_thread_attachment', [{
      patient_id: patientA,
      client_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      text: 'comida',
      asset_id: mealId,
      filename: 'almuerzo.png',
    }])).rejects.toMatchObject({ code: '22023' });
    await expect(rpc(patientAUser, 'send_thread_attachment', [{
      patient_id: patientA,
      client_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
      text: 'retirado',
      asset_id: withdrawnId,
      filename: 'viejo.png',
    }])).rejects.toMatchObject({ code: '22023' });

    const pro = await rpc(nutriA, 'send_thread_attachment', [{
      patient_id: patientA,
      client_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
      text: '',
      asset_id: extraId,
      filename: 'indicacion.png',
    }]) as { message: { attachment?: { filename: string } } };
    expect(pro.message.attachment?.filename).toBe('indicacion.png');

    await db.exec('alter function public.send_thread_attachment(jsonb) rename to send_thread_attachment_pv24_hidden');
    try {
      await expect(rpc(patientAUser, 'send_thread_attachment', [{
        patient_id: patientA,
        client_id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
        text: 'x',
        asset_id: extraId,
        filename: 'x.png',
      }])).rejects.toMatchObject({ code: '42883' });
    } finally {
      await db.exec('alter function public.send_thread_attachment_pv24_hidden(jsonb) rename to send_thread_attachment');
    }
  });
});
