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
const patientA = '10000000-0000-4000-a000-0000000000a1';
const patientA2 = '10000000-0000-4000-a000-0000000000a2';
const patientB = '10000000-0000-4000-a000-0000000000b1';
const cid = (n: number) => `55555555-5555-4555-8555-${String(n).padStart(12, '0')}`;
const enUnaHora = () => new Date(Date.now() + 3_600_000).toISOString();

async function as<T = Record<string, unknown>>(role: 'authenticated' | 'service_role', user: string | null, sql: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${role}`);
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [user ?? '']);
    return (await tx.query<T>(sql, params)).rows;
  });
}
const schedule = (user: string, payload: unknown) => as<{ r: { scheduled: number } }>('authenticated', user, 'select public.schedule_thread_messages($1) as r', [payload]).then(rows => rows[0].r);
const deliver = () => as<{ r: string[] }>('service_role', null, 'select public.deliver_due_scheduled_messages(50) as r').then(rows => rows[0].r);

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-scheduled-'));
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
  for (const [id, email] of [[nutriA, 'a@example.test'], [nutriB, 'b@example.test'], [patientAUser, 'pa@example.test']] as const) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, email]);
  }
  const a = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  const b = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri B') as id", [nutriB])).rows[0].id;
  await db.query(
    `insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status)
     values ($1,$2,$3,'Paciente A','waived'),($4,$2,null,'Paciente A2','waived'),($5,$6,null,'Paciente B','waived')`,
    [patientA, a, patientAUser, patientA2, patientB, b],
  );
}, 60000);

afterAll(async () => {
  await db?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('Mensajes programados en PostgreSQL descartable', () => {
  it('la nutri programa a sus pacientes, sin duplicar, y no a las de otra', async () => {
    const items = [{ patient_id: patientA, client_id: cid(1), text: ' Hola A ' }, { patient_id: patientA2, client_id: cid(2), text: 'Hola A2' }];
    expect((await schedule(nutriA, { send_at: enUnaHora(), items })).scheduled).toBe(2);
    expect((await schedule(nutriA, { send_at: enUnaHora(), items })).scheduled).toBe(0);
    await expect(schedule(nutriA, { send_at: enUnaHora(), items: [{ patient_id: patientB, client_id: cid(3), text: 'Hola' }] })).rejects.toMatchObject({ code: '42501' });
    await expect(schedule(patientAUser, { send_at: enUnaHora(), items })).rejects.toMatchObject({ code: '42501' });
    await expect(schedule(nutriA, { send_at: new Date(Date.now() - 60_000).toISOString(), items })).rejects.toMatchObject({ code: '22023' });
    await expect(schedule(nutriA, { send_at: new Date(Date.now() + 9 * 86_400_000).toISOString(), items })).rejects.toMatchObject({ code: '22023' });
    expect(await as('authenticated', nutriB, 'select id from public.scheduled_messages')).toEqual([]);
    expect(await as('authenticated', nutriA, 'select id from public.scheduled_messages')).toHaveLength(2);
    await expect(as('authenticated', nutriA, "update public.scheduled_messages set send_at=now()")).rejects.toMatchObject({ code: '42501' });
    await expect(as('authenticated', nutriA, 'select public.deliver_due_scheduled_messages(50)')).rejects.toMatchObject({ code: '42501' });
  });

  it('el worker no manda antes de hora; a la hora entra al hilo con su recibo, una sola vez', async () => {
    expect(await deliver()).toEqual([]);
    await db.query("update public.scheduled_messages set send_at = now() - interval '1 second'");
    await db.query("update public.patients set deactivated_at = now() where id = $1", [patientA2]);
    expect(await deliver()).toEqual([patientA]);
    expect(await deliver()).toEqual([]);
    const sent = await db.query<{ body: string; author_id: string; sent_at: string | null }>('select body, author_id, sent_at from public.messages where patient_id=$1', [patientA]);
    expect(sent.rows).toHaveLength(1);
    expect(sent.rows[0]).toMatchObject({ body: 'Hola A', author_id: nutriA });
    expect(sent.rows[0].sent_at).not.toBeNull();
    const receipt = await db.query('select user_id from public.message_receipts r join public.messages m on m.id=r.message_id where m.patient_id=$1', [patientA]);
    expect(receipt.rows).toEqual([{ user_id: patientAUser }]);
    const states = await db.query<{ patient_id: string; state: string }>('select patient_id, state from public.scheduled_messages order by patient_id');
    expect(states.rows).toEqual([{ patient_id: patientA, state: 'sent' }, { patient_id: patientA2, state: 'skipped' }]);
    const listed = await as<{ r: Array<{ text: string; from: string }> }>('authenticated', patientAUser, 'select public.list_thread_messages($1, false) as r', [patientA]);
    expect(listed[0].r[0]).toMatchObject({ text: 'Hola A', from: 'vero' });
  });
});
