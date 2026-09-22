import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
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

type Snapshot = {
  event: { id: string; event_type: string; client_id: string };
  deliveries: Array<{
    channel: string;
    status: string;
    skip_reason: string | null;
    last_error: string | null;
    sent_at: string | null;
    attempt: number;
  }>;
};

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-outbox-'));
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

describe('PV-26 outbox en PostgreSQL descartable', () => {
  it('idempotencia, skip desactivado/desvinculado, Nutri B 42501 y email/push nunca sent', async () => {
    await rpc(patientAUser, 'save_notification_preferences', [{ in_app: true, email: true, push: true }]);
    const clientId = '55555555-5555-4555-8555-555555555555';
    const created = await rpc(nutriA, 'enqueue_outbox_event', [{
      patient_id: patientA,
      event_type: 'appointment_scheduled',
      client_id: clientId,
      subject: 'Consulta',
      body: 'Turno publicado. Buzón in-app.',
      kind: 'appointment',
    }]) as Snapshot;
    expect(created.deliveries.find((row) => row.channel === 'in_app')).toMatchObject({ status: 'sent' });
    expect(created.deliveries.find((row) => row.channel === 'email')).toMatchObject({ status: 'queued', sent_at: null });
    expect(created.deliveries.find((row) => row.channel === 'push')).toMatchObject({ status: 'queued', sent_at: null });

    const replayed = await rpc(nutriA, 'enqueue_outbox_event', [{
      patient_id: patientA,
      event_type: 'appointment_scheduled',
      client_id: clientId,
      subject: 'Consulta',
      body: 'Turno publicado. Buzón in-app.',
      kind: 'appointment',
    }]) as Snapshot;
    expect(replayed.event.id).toBe(created.event.id);

    const drained = await rpc(nutriA, 'process_outbox_deliveries', [{ limit: 20 }]) as { deliveries: Snapshot['deliveries'] };
    expect(drained.deliveries.some((row) => (row.channel === 'email' || row.channel === 'push') && row.last_error === 'provider_unconfigured')).toBe(true);
    expect(drained.deliveries.some((row) => row.channel !== 'in_app' && row.status === 'sent')).toBe(false);

    const mailbox = await rpc(patientAUser, 'list_outbox_mailbox', [patientA]) as { notices: Array<{ channel: string; to: string }> };
    expect(mailbox.notices[0]).toMatchObject({ channel: 'email', to: 'aviso.demo@plan-v.local' });

    await expect(rpc(nutriB, 'enqueue_outbox_event', [{
      patient_id: patientA,
      event_type: 'reminder',
      client_id: '66666666-6666-4666-8666-666666666666',
      subject: 'Ajeno',
      body: 'No.',
      kind: 'reminder',
    }])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientBUser, 'list_outbox_mailbox', [patientA])).rejects.toMatchObject({ code: '42501' });

    await db.query('update public.patients set deactivated_at = now() where id = $1', [patientA]);
    const deactivated = await rpc(nutriA, 'enqueue_outbox_event', [{
      patient_id: patientA,
      event_type: 'reminder',
      client_id: randomUUID(),
      subject: 'Desactivado',
      body: 'No enviar.',
      kind: 'reminder',
    }]) as Snapshot;
    expect(deactivated.deliveries.every((row) => row.status === 'skipped' && row.skip_reason === 'deactivated')).toBe(true);
    await db.query('update public.patients set deactivated_at = null, user_id = null where id = $1', [patientA]);
    const unlinked = await rpc(nutriA, 'enqueue_outbox_event', [{
      patient_id: patientA,
      event_type: 'invite_sent',
      client_id: randomUUID(),
      subject: 'Desvinculado',
      body: 'No enviar.',
      kind: 'invite',
    }]) as Snapshot;
    expect(unlinked.deliveries.every((row) => row.status === 'skipped' && row.skip_reason === 'unlinked')).toBe(true);

    await db.exec('alter function public.enqueue_outbox_event(jsonb) rename to enqueue_outbox_event_pv26_hidden');
    try {
      await expect(rpc(nutriA, 'enqueue_outbox_event', [{
        patient_id: patientA,
        event_type: 'reminder',
        client_id: randomUUID(),
        subject: 'Sin schema',
        body: '501.',
        kind: 'reminder',
      }])).rejects.toMatchObject({ code: '42883' });
    } finally {
      await db.exec('alter function public.enqueue_outbox_event_pv26_hidden(jsonb) rename to enqueue_outbox_event');
    }
  });
});
