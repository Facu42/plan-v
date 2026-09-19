import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CONSENT_CATALOG } from './intake/consent.js';

// Circuito invitación → ingreso → revisión → plan publicado. JWT shim, no Auth live.
let db: PGlite;
let dir: string;
let nutriAId = '';
let nutriBId = '';

const nutriA = '00000000-0000-4000-a000-0000000000c1';
const nutriB = '00000000-0000-4000-a000-0000000000c2';
const invitee = '00000000-0000-4000-a000-0000000000c3';
const patientBUser = '00000000-0000-4000-a000-0000000000c4';
const invitePatient = '10000000-0000-4000-a000-0000000000c1';
const patientB = '10000000-0000-4000-a000-0000000000c2';
const PRIVATE_NOTE = 'Nota profesional ficticia: confirmar maní en consulta.';
const PLAN_TITLE = 'Bowl de lentejas ficticio';

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
  dir = await mkdtemp(join(tmpdir(), 'plan-v-invite-plan-'));
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
  `);
  const migrations = new URL('../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort()) {
    try {
      await db.exec(await readFile(new URL(file, migrations), 'utf8'));
    } catch (error) {
      console.error(file, JSON.stringify(error));
      throw error;
    }
  }
  for (const [id, email] of [
    [nutriA, 'nutri-a@example.test'],
    [nutriB, 'nutri-b@example.test'],
    [invitee, 'ana.corte@example.test'],
    [patientBUser, 'paciente-b@example.test'],
  ] as const) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, email]);
  }
  nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  nutriBId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri B') as id", [nutriB])).rows[0].id;
  await db.query(
    `insert into public.patients(id,nutritionist_id,full_name,billing_status) values ($1,$2,'Ana Corte','waived')`,
    [invitePatient, nutriAId],
  );
  await db.query(
    `insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values ($1,$2,$3,'Paciente B','waived')`,
    [patientB, nutriBId, patientBUser],
  );
}, 60000);
afterAll(async () => {
  await db?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('circuito invitación → ingreso → revisión → plan publicado (PGlite)', () => {
    it('Nutri A invita, Ana acepta, declara, Nutri A revisa en privado y publica el plan', async () => {
    const invite = (await db.query<{ id: string }>(
      `insert into public.patient_invites(patient_id,nutritionist_id,email,status,invited_at,expires_at)
       values($1,$2,'ana.corte@example.test','pending',now(),now()+interval '7 days') returning id`,
      [invitePatient, nutriAId],
    )).rows[0].id;
    expect(await rpc(invitee, 'accept_patient_invite', [invite])).toBe(invitePatient);

    const started = await rpc(invitee, 'get_patient_intake', [invitePatient]) as { intake: { revision: number } };
    const saved = await rpc(invitee, 'save_patient_intake', [invitePatient, started.intake.revision, 'allergies', {
      preferred_name: 'Ana',
      patient_intent: 'Quiero regular horarios',
      allergies: { state: 'reported', items: ['Maní'] },
      restrictions: { state: 'none', items: [] },
    }]) as { intake: { revision: number } };
    const care = CONSENT_CATALOG.find((entry) => entry.purpose === 'care_relationship')!;
    await rpc(invitee, 'record_patient_consent', [invitePatient, care.purpose, care.text_version, care.text_hash, 'granted']);
    const submitted = await rpc(invitee, 'submit_patient_intake', [invitePatient, saved.intake.revision]) as { intake: { status: string; revision: number } };
    expect(submitted.intake.status).toBe('submitted');

    await expect(rpc(nutriB, 'get_patient_intake', [invitePatient])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientBUser, 'get_patient_intake', [invitePatient])).rejects.toMatchObject({ code: '42501' });

    const reviewed = await rpc(nutriA, 'review_patient_intake', [invitePatient, submitted.intake.revision]) as { intake: { status: string; reviewed_by: string } };
    expect(reviewed.intake.status).toBe('reviewed');
    expect(reviewed.intake.reviewed_by).toBe(nutriA);
    await rpc(nutriA, 'add_patient_clinical_note', [invitePatient, PRIVATE_NOTE]);

    const patientView = await rpc(invitee, 'get_patient_intake', [invitePatient]) as Record<string, unknown> & { intake: Record<string, unknown> };
    expect(patientView).not.toHaveProperty('clinical_notes');
    expect(patientView.intake).not.toHaveProperty('reviewed_by');
    expect(JSON.stringify(patientView)).not.toContain(PRIVATE_NOTE);
    expect((await rpc(nutriA, 'get_patient_intake', [invitePatient]) as { clinical_notes: Array<{ body: string }> }).clinical_notes[0].body).toBe(PRIVATE_NOTE);

    await asUser(nutriA, `insert into public.meal_slots(patient_id,weekday,slot,title) values($1,0,'almuerzo',$2)`, [invitePatient, PLAN_TITLE]);
    expect(await asUser(invitee, 'select title from public.meal_slots')).toEqual([{ title: PLAN_TITLE }]);
    expect(await asUser(nutriB, 'select title from public.meal_slots')).toEqual([]);
    expect(await asUser(patientBUser, 'select title from public.meal_slots')).toEqual([]);
  });

  it('conserva ingreso revisado y plan publicado al reabrir la base', async () => {
    await db.close();
    db = new PGlite(dir);
    const saved = await rpc(invitee, 'get_patient_intake', [invitePatient]) as { intake: { status: string; payload: { preferred_name: string } } };
    expect(saved.intake).toMatchObject({ status: 'reviewed', payload: { preferred_name: 'Ana' } });
    expect(await asUser(invitee, 'select title from public.meal_slots')).toEqual([{ title: PLAN_TITLE }]);
    expect(await asUser(nutriA, 'select id from public.patients where id=$1', [patientB])).toEqual([]);
  });
});
