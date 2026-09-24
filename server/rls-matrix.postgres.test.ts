import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CONSENT_CATALOG } from './intake/consent.js';

// Matriz RLS-01…23 sobre migraciones ejecutables. JWT shim, no Auth/PostgREST live.
let db: PGlite;
let dir: string;
let nutriAId = '';
let nutriBId = '';

const nutriA = '00000000-0000-4000-a000-0000000000a1';
const nutriB = '00000000-0000-4000-a000-0000000000b1';
const patientAUser = '00000000-0000-4000-a000-0000000000a2';
const patientBUser = '00000000-0000-4000-a000-0000000000b2';
const pendingUser = '00000000-0000-4000-a000-0000000000a3';
const invitee = '00000000-0000-4000-a000-0000000000a4';
const wrongMail = '00000000-0000-4000-a000-0000000000a5';
const patientA = '10000000-0000-4000-a000-0000000000a1';
const patientB = '10000000-0000-4000-a000-0000000000b1';
const pendingA = '10000000-0000-4000-a000-0000000000a9';
const invitePatient = '10000000-0000-4000-a000-0000000000a8';

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
  dir = await mkdtemp(join(tmpdir(), 'plan-v-rls-matrix-'));
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
  const migrations = new URL('../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort()) {
    try {
      await db.exec(await readFile(new URL(file, migrations), 'utf8'));
    } catch (error) {
      console.error(file, JSON.stringify(error));
      throw error;
    }
  }
  const users: Array<[string, string, string | null]> = [
    [nutriA, 'nutri-a@example.test', 'now()'],
    [nutriB, 'nutri-b@example.test', 'now()'],
    [patientAUser, 'paciente-a@example.test', 'now()'],
    [patientBUser, 'paciente-b@example.test', 'now()'],
    [pendingUser, 'pendiente-a@example.test', 'now()'],
    [invitee, 'invitada@example.test', 'now()'],
    [wrongMail, 'otro@example.test', 'now()'],
  ];
  for (const [id, email] of users) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, email]);
  }
  nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  nutriBId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri B') as id", [nutriB])).rows[0].id;
  await db.query(
    `insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status)
     values ($1,$2,$3,'Paciente A','waived'),($4,$5,$6,'Paciente B','waived'),($7,$2,$8,'Paciente A pendiente','pending')`,
    [patientA, nutriAId, patientAUser, patientB, nutriBId, patientBUser, pendingA, pendingUser],
  );
  await db.query(
    `insert into public.patients(id,nutritionist_id,full_name,billing_status) values ($1,$2,'Paciente invitada','waived')`,
    [invitePatient, nutriAId],
  );
}, 60000);
afterAll(async () => {
  await db?.close();
  if (dir) await rm(dir, { recursive: true, force: true });
});

describe('matriz RLS-01…23 en PostgreSQL descartable (PGlite)', () => {
  it('RLS-01 Nutri A opera el circuito de Paciente A', async () => {
    const slot = (await asUser<{ id: string }>(nutriA, `insert into public.meal_slots(patient_id,weekday,slot,title) values($1,0,'almuerzo','Bowl') returning id`, [patientA]))[0].id;
    const log = (await asUser<{ id: string }>(nutriA, `insert into public.meal_logs(patient_id,meal_slot_id,slot_label,status) values($1,$2,'Almuerzo','confirmed') returning id`, [patientA, slot]))[0].id;
    await asUser(nutriA, `insert into public.habit_logs(patient_id,date,hydration) values($1,'2026-09-19',4)`, [patientA]);
    await asUser(nutriA, `insert into public.reminders(patient_id,kind,time_local) values($1,'water','10:00')`, [patientA]);
    await asUser(nutriA, `insert into public.timeline_events(patient_id,kind,visibility,title) values($1,'habit','patient','Agua')`, [patientA]);
    await asUser(nutriA, `insert into public.appointments(nutritionist_id,patient_id,starts_at,channel) values($1,$2,'2026-09-22T14:00:00Z','video')`, [nutriAId, patientA]);
    await asUser(nutriA, `insert into public.ai_briefs(nutritionist_id,patient_id,up_next_title) values($1,$2,'Próximo foco')`, [nutriAId, patientA]);
    await asUser(nutriA, `update public.patients set goal='Ritmo estable' where id=$1`, [patientA]);
    expect(await asUser(nutriA, 'select id,goal from public.patients where id=$1', [patientA])).toEqual([{ id: patientA, goal: 'Ritmo estable' }]);
    expect(await asUser(nutriA, 'select id from public.meal_slots')).toEqual([{ id: slot }]);
    expect(await asUser(nutriA, 'select id from public.meal_logs')).toEqual([{ id: log }]);
  });

  it('RLS-02 Nutri A no lee ni escribe filas de Paciente B', async () => {
    expect(await asUser(nutriA, 'select id from public.patients where id=$1', [patientB])).toEqual([]);
    await expect(asUser(nutriA, `insert into public.meal_slots(patient_id,weekday,slot,title) values($1,1,'cena','Ajeno')`, [patientB])).rejects.toMatchObject({ code: '42501' });
    expect(await asUser(nutriA, 'select id from public.meal_logs where patient_id=$1', [patientB])).toEqual([]);
    expect(await asUser(nutriA, 'select id from public.habit_logs where patient_id=$1', [patientB])).toEqual([]);
    expect(await asUser(nutriA, 'select id from public.appointments where patient_id=$1', [patientB])).toEqual([]);
    expect(await asUser(nutriA, 'select id from public.ai_briefs where patient_id=$1', [patientB])).toEqual([]);
  });

  it('RLS-03 Paciente A sólo ve sus vistas, nunca a B', async () => {
    expect(await asUser(patientAUser, 'select id from public.patients_patient_view')).toEqual([{ id: patientA }]);
    expect(await asUser(patientAUser, 'select id from public.meal_logs_patient_view')).toHaveLength(1);
    expect(await asUser(patientAUser, 'select id from public.appointments_patient_view')).toHaveLength(1);
    expect(await asUser(patientAUser, 'select * from public.patients_patient_view where id=$1', [patientB])).toEqual([]);
    expect(await asUser(patientBUser, 'select id from public.patients_patient_view')).toEqual([{ id: patientB }]);
  });

  it('RLS-04 Paciente A no sustituye las vistas leyendo tablas crudas', async () => {
    expect(await asUser(patientAUser, 'select id from public.patients')).toEqual([]);
    expect(await asUser(patientAUser, 'select id from public.meal_logs')).toEqual([]);
    expect(await asUser(patientAUser, 'select id from public.messages')).toEqual([]);
    expect(await asUser(patientAUser, 'select id from public.appointments')).toEqual([]);
  });

  it('RLS-05 las vistas de paciente no exponen columnas profesionales', async () => {
    const patientCols = Object.keys((await asUser(patientAUser, 'select * from public.patients_patient_view'))[0]);
    const mealCols = Object.keys((await asUser(patientAUser, 'select * from public.meal_logs_patient_view'))[0]);
    const apptCols = Object.keys((await asUser(patientAUser, 'select * from public.appointments_patient_view'))[0]);
    for (const column of ['adherence_why', 'plan_b', 'next_focus', 'sensitive_hours']) {
      expect(patientCols).not.toContain(column);
    }
    expect(mealCols).not.toContain('note_for_nutri');
    expect(apptCols).not.toContain('prep_note');
    await asUser(nutriA, `insert into public.messages(nutritionist_id,patient_id,author_id,body,suggested_by_ai,sent_at) values($1,$2,$3,'Hola',false,now())`, [nutriAId, patientA, nutriA]);
    const msgCols = Object.keys((await asUser(patientAUser, 'select * from public.messages_patient_view'))[0]);
    expect(msgCols).not.toContain('suggested_by_ai');
  });

  it('RLS-06 Paciente A inserta meal_logs propios pendientes', async () => {
    const logId = '20000000-0000-4000-a000-0000000000a6';
    await asUser(patientAUser, `insert into public.meal_logs(id,patient_id,slot_label,status,note_for_nutri,photo_path) values($1,$2,'Cena','pending_review','',$3)`, [logId, patientA, `patients/${patientA}/foto.jpg`]);
    expect(await asUser(patientAUser, 'select id from public.meal_logs_patient_view where id=$1', [logId])).toEqual([{ id: logId }]);
  });

  it('RLS-07 rechaza logs confirmados, nota interna o path de B', async () => {
    await expect(asUser(patientAUser, `insert into public.meal_logs(patient_id,slot_label,status) values($1,'Cena','confirmed')`, [patientA])).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(patientAUser, `insert into public.meal_logs(patient_id,slot_label,note_for_nutri) values($1,'Cena','secreto')`, [patientA])).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(patientAUser, `insert into public.meal_logs(patient_id,slot_label,photo_path) values($1,'Cena',$2)`, [patientA, `patients/${patientB}/x.jpg`])).rejects.toMatchObject({});
  });

  it('RLS-08 hábitos propios con acceso pleno; B inaccesible', async () => {
    await asUser(patientAUser, `insert into public.habit_logs(patient_id,date,hydration) values($1,'2026-09-18',3) on conflict (patient_id,date) do update set hydration=excluded.hydration`, [patientA]);
    expect(await asUser(patientAUser, 'select hydration from public.habit_logs where date=$1', ['2026-09-18'])).toEqual([{ hydration: 3 }]);
    expect(await asUser(patientAUser, 'select * from public.habit_logs where patient_id=$1', [patientB])).toEqual([]);
    await expect(asUser(patientAUser, `insert into public.habit_logs(patient_id,date,hydration) values($1,'2026-09-18',1)`, [patientB])).rejects.toMatchObject({ code: '42501' });
  });

  it('RLS-09 pendiente no lee menú/logs/turnos; mensajes enviados sí', async () => {
    await asUser(nutriA, `insert into public.messages(nutritionist_id,patient_id,author_id,body,sent_at) values($1,$2,$3,'Bienvenida',now())`, [nutriAId, pendingA, nutriA]);
    expect(await asUser(pendingUser, 'select * from public.meal_slots')).toEqual([]);
    expect(await asUser(pendingUser, 'select * from public.meal_logs_patient_view')).toEqual([]);
    expect(await asUser(pendingUser, 'select * from public.appointments_patient_view')).toEqual([]);
    expect(await asUser(pendingUser, 'select body from public.messages_patient_view')).toEqual([{ body: 'Bienvenida' }]);
    await expect(asUser(pendingUser, `insert into storage.objects(bucket_id,name) values('meal-photos',$1)`, [`patients/${pendingA}/foto.jpg`])).rejects.toMatchObject({ code: '42501' });
  });

  it('RLS-10 timeline paciente sólo visibility=patient; recordatorios propios', async () => {
    await asUser(nutriA, `insert into public.timeline_events(patient_id,kind,visibility,title) values($1,'menu','professional','Interno')`, [patientA]);
    const titles = (await asUser<{ title: string }>(patientAUser, 'select title from public.timeline_events')).map((row) => row.title);
    expect(titles).toContain('Agua');
    expect(titles).not.toContain('Interno');
    expect(await asUser(patientAUser, 'select kind from public.reminders')).toEqual([{ kind: 'water' }]);
  });

  it('RLS-11 paciente no gestiona reminders ni timeline', async () => {
    await expect(asUser(patientAUser, `insert into public.reminders(patient_id,kind,time_local) values($1,'sleep','22:00')`, [patientA])).rejects.toMatchObject({ code: '42501' });
    expect(await asUser(patientAUser, `delete from public.reminders returning id`)).toEqual([]);
    expect(await asUser(patientAUser, 'select kind from public.reminders')).toEqual([{ kind: 'water' }]);
    await expect(asUser(patientAUser, `insert into public.timeline_events(patient_id,kind,visibility,title) values($1,'habit','patient','Yo')`, [patientA])).rejects.toMatchObject({ code: '42501' });
  });

  it('RLS-12 grants de columna bloquean rol y billing/user_id', async () => {
    await expect(asUser(patientAUser, "update public.profiles set role='nutri' where id=$1", [patientAUser])).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(patientAUser, "update public.patients set billing_status='active', billing_until='2026-12-31' where id=$1", [patientA])).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(patientAUser, 'update public.patients set user_id=$1 where id=$2', [patientBUser, patientA])).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(nutriA, "update public.patients set billing_status='active' where id=$1", [patientA])).rejects.toMatchObject({ code: '42501' });
  });

  it('RLS-13 Nutri A no escribe mensajes como B ni los muta', async () => {
    await expect(asUser(nutriA, `insert into public.messages(nutritionist_id,patient_id,author_id,body,sent_at) values($1,$2,$3,'Ajeno',now())`, [nutriAId, patientA, nutriB])).rejects.toMatchObject({});
    await expect(asUser(nutriA, `update public.messages set body='editado'`)).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(nutriA, `delete from public.messages`)).rejects.toMatchObject({ code: '42501' });
  });

  it('RLS-14 paciente no marca IA, sent_at null ni author ajeno', async () => {
    await expect(asUser(patientAUser, `insert into public.messages(nutritionist_id,patient_id,author_id,body,suggested_by_ai,sent_at) values($1,$2,$3,'Hola',true,now())`, [nutriAId, patientA, patientAUser])).rejects.toMatchObject({ code: 'P0001' });
    await expect(asUser(patientAUser, `insert into public.messages(nutritionist_id,patient_id,author_id,body,sent_at) values($1,$2,$3,'Hola',null)`, [nutriAId, patientA, patientAUser])).rejects.toMatchObject({ code: 'P0001' });
    await expect(asUser(patientAUser, `insert into public.messages(nutritionist_id,patient_id,author_id,body,sent_at) values($1,$2,$3,'Hola',now())`, [nutriAId, patientA, nutriA])).rejects.toMatchObject({});
  });

  it('RLS-15 paciente no lee internos', async () => {
    expect(await asUser(patientAUser, 'select * from public.ai_briefs')).toEqual([]);
    expect(await asUser(patientAUser, 'select * from public.payments')).toEqual([]);
    expect(await asUser(patientAUser, 'select * from public.patient_assets')).toEqual([]);
    await expect(asUser(patientAUser, 'select * from public.audit_events')).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(patientAUser, 'select * from public.privacy_requests')).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(patientAUser, 'select * from public.payment_webhook_events')).rejects.toMatchObject({ code: '42501' });
  });

  it('RLS-16 Nutri A lee pagos propios y no los escribe ni cambia billing', async () => {
    await db.query(
      `insert into public.payments(patient_id,nutritionist_id,provider,amount_ars,status,period_start,period_end) values($1,$2,'manual',1000,'pending','2026-09-01','2026-09-30')`,
      [patientA, nutriAId],
    );
    expect(await asUser(nutriA, 'select amount_ars from public.payments')).toEqual([{ amount_ars: 1000 }]);
    expect(await asUser(nutriB, 'select * from public.payments')).toEqual([]);
    await expect(asUser(nutriA, `insert into public.payments(patient_id,nutritionist_id,provider,amount_ars,period_start,period_end) values($1,$2,'manual',1,'2026-09-01','2026-09-30')`, [patientA, nutriAId])).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(nutriA, "update public.payments set status='approved', approved_at=now()")).rejects.toMatchObject({ code: '42501' });
  });

  it('RLS-17 authenticated no ejecuta provision_nutritionist', async () => {
    await expect(rpc(patientAUser, 'provision_nutritionist', [patientAUser, 'Intrusa'])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(nutriA, 'provision_nutritionist', [patientAUser, 'Intrusa'])).rejects.toMatchObject({ code: '42501' });
  });

  it('RLS-18 accept_patient_invite vincula una vez con email confirmado', async () => {
    const invite = (await db.query<{ id: string }>(
      `insert into public.patient_invites(patient_id,nutritionist_id,email,status,invited_at,expires_at)
       values($1,$2,'invitada@example.test','pending',now(),now()+interval '7 days') returning id`,
      [invitePatient, nutriAId],
    )).rows[0].id;
    expect(await rpc(invitee, 'accept_patient_invite', [invite])).toBe(invitePatient);
    expect((await db.query<{ user_id: string | null }>('select user_id from public.patients where id=$1', [invitePatient])).rows[0]).toEqual({ user_id: invitee });
    await expect(rpc(invitee, 'accept_patient_invite', [invite])).rejects.toMatchObject({});
  });

  it('RLS-19 invite vencido, revocado o email distinto no vincula', async () => {
    const extra = (await db.query<{ id: string }>(
      `insert into public.patients(id,nutritionist_id,full_name,billing_status) values(gen_random_uuid(),$1,'Otra','waived') returning id`,
      [nutriAId],
    )).rows[0].id;
    const expired = (await db.query<{ id: string }>(
      `insert into public.patient_invites(patient_id,nutritionist_id,email,status,invited_at,expires_at)
       values($1,$2,'otro@example.test','pending',now(),now()-interval '1 day') returning id`,
      [extra, nutriAId],
    )).rows[0].id;
    await expect(rpc(wrongMail, 'accept_patient_invite', [expired])).rejects.toMatchObject({});
    await db.query(`update public.patient_invites set status='revoked', revoked_at=now() where id=$1`, [expired]);
    await expect(rpc(wrongMail, 'accept_patient_invite', [expired])).rejects.toMatchObject({});
    const mismatch = (await db.query<{ id: string }>(
      `insert into public.patient_invites(patient_id,nutritionist_id,email,status,invited_at,expires_at)
       values($1,$2,'no-es-el@example.test','pending',now(),now()+interval '1 day') returning id`,
      [extra, nutriAId],
    )).rows[0].id;
    await expect(rpc(wrongMail, 'accept_patient_invite', [mismatch])).rejects.toMatchObject({});
    expect((await db.query<{ user_id: string | null }>('select user_id from public.patients where id=$1', [extra])).rows[0].user_id).toBeNull();
  });

  it('RLS-20 fotos de comida: prefijo propio, B denegado', async () => {
    const pathA = `patients/${patientA}/comida.jpg`;
    const pathB = `patients/${patientB}/comida.jpg`;
    await expect(asUser(patientAUser, `insert into storage.objects(bucket_id,name) values('meal-photos',$1)`, [pathA])).rejects.toMatchObject({ code: '42501' });
    const mealPhoto = CONSENT_CATALOG.find((entry) => entry.purpose === 'meal_photo')!;
    await rpc(patientAUser, 'record_patient_consent', [patientA, mealPhoto.purpose, mealPhoto.text_version, mealPhoto.text_hash, 'granted']);
    await asUser(patientAUser, `insert into storage.objects(bucket_id,name) values('meal-photos',$1)`, [pathA]);
    expect(await asUser(nutriA, 'select name from storage.objects where name=$1', [pathA])).toEqual([{ name: pathA }]);
    expect(await asUser(patientBUser, 'select name from storage.objects where name=$1', [pathA])).toEqual([]);
    await expect(asUser(patientAUser, `insert into storage.objects(bucket_id,name) values('meal-photos',$1)`, [pathB])).rejects.toMatchObject({ code: '42501' });
    await expect(asUser(patientAUser, `insert into storage.objects(bucket_id,name) values('meal-photos','mal.jpg')`)).rejects.toMatchObject({ code: '42501' });
  });

  it('RLS-21 webhook duplicado no se inserta dos veces', async () => {
    await db.query(`insert into public.payment_webhook_events(provider,external_event_id,event_type) values('mercadopago','evt-1','payment')`);
    await expect(db.query(`insert into public.payment_webhook_events(provider,external_event_id,event_type) values('mercadopago','evt-1','payment')`)).rejects.toMatchObject({});
    expect((await db.query(`select count(*)::int as n from public.payment_webhook_events where external_event_id='evt-1'`)).rows[0]).toEqual({ n: 1 });
  });

  it('RLS-22 no borra paciente con pagos', async () => {
    await db.query(`update public.payments set status='approved', approved_at=now() where patient_id=$1`, [patientA]);
    await expect(db.query('delete from public.patients where id=$1', [patientA])).rejects.toMatchObject({});
    expect((await db.query('select id from public.patients where id=$1', [patientA])).rows).toEqual([{ id: patientA }]);
  });

  it('RLS-23 Nutri A no cuelga un log de A del slot de B', async () => {
    const slotB = (await asUser<{ id: string }>(nutriB, `insert into public.meal_slots(patient_id,weekday,slot,title) values($1,0,'cena','Cena B') returning id`, [patientB]))[0].id;
    await expect(asUser(nutriA, `insert into public.meal_logs(patient_id,meal_slot_id,slot_label) values($1,$2,'Almuerzo')`, [patientA, slotB])).rejects.toMatchObject({});
  });

  it('conserva aislamiento de A/B al cerrar y reabrir la base', async () => {
    await db.close();
    db = new PGlite(dir);
    expect(await asUser(nutriA, 'select full_name from public.patients where id=$1', [patientA])).toEqual([{ full_name: 'Paciente A' }]);
    expect(await asUser(nutriA, 'select id from public.patients where id=$1', [patientB])).toEqual([]);
    expect(await asUser(patientAUser, 'select id from public.patients_patient_view')).toEqual([{ id: patientA }]);
    expect(await asUser(invitee, 'select id from public.patients_patient_view')).toEqual([{ id: invitePatient }]);
  });
});
