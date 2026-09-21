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
const patientA2 = '10000000-0000-4000-a000-0000000000a3';
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

function slot(overrides: Record<string, unknown> = {}) {
  return {
    patient_id: patientA,
    appointment: {
      day: 'Jueves',
      time: '14:30',
      duration: 45,
      channel: 'video',
      meet_url: 'https://meet.example.test/a',
      ...overrides,
    },
  };
}

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'plan-v-appointments-'));
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
     values ($1,$2,$3,'Paciente A','waived'),($4,$2,null,'Paciente A2','waived'),($5,$6,$7,'Paciente B','waived')`,
    [patientA, nutriAId, patientAUser, patientA2, patientB, nutriBId, patientBUser],
  );
}, 60000);

afterAll(async () => {
  await db?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('PV-25 turnos en PostgreSQL descartable', () => {
  it('agenda sin borrar, bloquea solapes, confirma una vez y aísla a Nutri B', async () => {
    const created = await rpc(nutriA, 'schedule_appointment', [slot()]) as {
      appointment: { when: string; duration: number; timezone: string; starts_at: string; meet_url: string };
      history: Array<{ action: string }>;
    };
    expect(created.appointment).toMatchObject({
      when: 'Jueves · 14:30',
      duration: 45,
      timezone: 'America/Argentina/Buenos_Aires',
      meet_url: 'https://meet.example.test/a',
    });
    expect(typeof created.appointment.starts_at).toBe('string');
    expect(created.history.some((entry) => entry.action === 'scheduled')).toBe(true);

    const moved = await rpc(nutriA, 'schedule_appointment', [slot({ day: 'Viernes', time: '11:00' })]) as {
      appointment: { when: string };
    };
    expect(moved.appointment.when).toBe('Viernes · 11:00');
    const rows = await asUser<{ status: string }>(nutriA, 'select status from public.appointments where patient_id=$1 order by created_at', [patientA]);
    expect(rows.map((row) => row.status)).toEqual(['cancelled', 'scheduled']);

    await expect(rpc(nutriA, 'schedule_appointment', [{
      patient_id: patientA2,
      appointment: { day: 'Viernes', time: '11:00', duration: 30, channel: 'presencial' },
    }])).rejects.toMatchObject({ code: 'PT409' });

    const other = await rpc(nutriA, 'schedule_appointment', [{
      patient_id: patientA2,
      appointment: { day: 'Lunes', time: '09:00', duration: 30, channel: 'presencial' },
    }]) as { appointment: { when: string } };
    expect(other.appointment.when).toBe('Lunes · 09:00');

    const patientMoved = await rpc(patientAUser, 'reschedule_appointment', [{
      patient_id: patientA,
      day: 'Miércoles',
      time: '10:00',
    }]) as { appointment: { when: string; duration: number; channel: string } };
    expect(patientMoved.appointment).toMatchObject({
      when: 'Miércoles · 10:00',
      duration: 45,
      channel: 'video',
    });

    const first = await rpc(patientAUser, 'confirm_appointment', [{
      patient_id: patientA,
      reply: 'attending',
    }]) as { appointment: { patient_reply: string; confirmed_at: string } };
    expect(first.appointment.patient_reply).toBe('attending');
    const second = await rpc(patientAUser, 'confirm_appointment', [{
      patient_id: patientA,
      reply: 'attending',
    }]) as { appointment: { confirmed_at: string } };
    expect(second.appointment.confirmed_at).toBe(first.appointment.confirmed_at);

    await expect(rpc(patientAUser, 'schedule_appointment', [slot({ day: 'Martes', time: '08:00' })])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(nutriB, 'schedule_appointment', [slot({ day: 'Martes', time: '08:00' })])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(nutriB, 'get_patient_appointment', [patientA])).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(nutriA, 'update public.appointment_events set action=$1', ['cancelled'])).rejects.toMatchObject({ code: '42501' });
    const beforeDelete = await asUser<{ id: string }>(nutriA, 'select id from public.appointments where patient_id=$1', [patientA]);
    expect(beforeDelete.length).toBeGreaterThan(0);
    await asUser(patientAUser, 'delete from public.appointments');
    const afterDelete = await asUser<{ id: string }>(nutriA, 'select id from public.appointments where patient_id=$1', [patientA]);
    expect(afterDelete).toEqual(beforeDelete);
  });

  it('sin RPC de turnos el persistente falla cerrado', async () => {
    await db.exec('alter function public.schedule_appointment(jsonb) rename to schedule_appointment_pv25_hidden');
    try {
      await expect(rpc(nutriA, 'schedule_appointment', [slot({ day: 'Martes', time: '16:00' })])).rejects.toMatchObject({ code: '42883' });
    } finally {
      await db.exec('alter function public.schedule_appointment_pv25_hidden(jsonb) rename to schedule_appointment');
    }
  });
});
