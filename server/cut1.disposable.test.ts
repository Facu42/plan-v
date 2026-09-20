import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { CONSENT_CATALOG } from './intake/consent.js';
import { createDisposableClient, disposableDatabaseUrl, restartDisposablePostgres } from './test/disposable-pg.js';

type Db = ReturnType<typeof createDisposableClient>;

const url = disposableDatabaseUrl();
const liveJwt = Boolean(
  process.env.DISPOSABLE_SUPABASE_URL
  && process.env.VITE_SUPABASE_ANON_KEY
  && process.env.RLS_JWT_NUTRI_A
  && process.env.RLS_JWT_NUTRI_B,
);

let db: Db;
let nutriAId = '';
let nutriBId = '';

const nutriA = '00000000-0000-4000-a000-0000000000a1';
const nutriB = '00000000-0000-4000-a000-0000000000b1';
const patientAUser = '00000000-0000-4000-a000-0000000000a2';
const patientBUser = '00000000-0000-4000-a000-0000000000b2';
const pendingUser = '00000000-0000-4000-a000-0000000000a3';
const invitee = '00000000-0000-4000-a000-0000000000a4';
const wrongMail = '00000000-0000-4000-a000-0000000000a5';
const anaUser = '00000000-0000-4000-a000-0000000000d3';
const patientA = '10000000-0000-4000-a000-0000000000a1';
const patientB = '10000000-0000-4000-a000-0000000000b1';
const pendingA = '10000000-0000-4000-a000-0000000000a9';
const invitePatient = '10000000-0000-4000-a000-0000000000a8';
const anaPatient = '10000000-0000-4000-a000-0000000000d1';
const PRIVATE_NOTE = 'Nota profesional ficticia: confirmar maní en consulta.';
const PLAN_TITLE = 'Bowl de lentejas ficticio';

async function asUser<T extends Record<string, unknown> = Record<string, unknown>>(user: string, sql: string, params: unknown[] = []) {
  return db.asUser<T>(user, sql, params);
}
async function rpc(user: string, name: string, args: unknown[] = []) {
  return db.rpc(user, name, args);
}

describe.skipIf(!url)('corte 1 en Postgres descartable local (Docker)', () => {
  beforeAll(async () => {
    db = createDisposableClient(url);
    const users: Array<[string, string]> = [
      [nutriA, 'nutri-a@example.test'],
      [nutriB, 'nutri-b@example.test'],
      [patientAUser, 'paciente-a@example.test'],
      [patientBUser, 'paciente-b@example.test'],
      [pendingUser, 'pendiente-a@example.test'],
      [invitee, 'invitada@example.test'],
      [wrongMail, 'otro@example.test'],
      [anaUser, 'ana.corte@example.test'],
    ];
    for (const [id, email] of users) {
      await db.query(
        'insert into auth.users(id,email,email_confirmed_at) values($1,$2,now()) on conflict (id) do update set email=excluded.email, email_confirmed_at=now()',
        [id, email],
      );
    }
    nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
    nutriBId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri B') as id", [nutriB])).rows[0].id;
    await db.query(
      `insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status)
       values ($1,$2,$3,'Paciente A','waived'),($4,$5,$6,'Paciente B','waived'),($7,$2,$8,'Paciente A pendiente','pending')
       on conflict (id) do nothing`,
      [patientA, nutriAId, patientAUser, patientB, nutriBId, patientBUser, pendingA, pendingUser],
    );
    await db.query(
      `insert into public.patients(id,nutritionist_id,full_name,billing_status) values ($1,$2,'Paciente invitada','waived')
       on conflict (id) do nothing`,
      [invitePatient, nutriAId],
    );
    await db.query(
      `insert into public.patients(id,nutritionist_id,full_name,billing_status) values ($1,$2,'Ana Corte','waived')
       on conflict (id) do nothing`,
      [anaPatient, nutriAId],
    );
  }, 60000);

  afterAll(async () => {
    await db?.pool.end();
  });

  it('no inventa JWT live ni Storage Auth', () => {
    expect(liveJwt).toBe(false);
  });

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
    expect(await asUser(nutriA, 'select id from public.meal_slots where patient_id=$1', [patientA])).toEqual([{ id: slot }]);
    expect(await asUser(nutriA, 'select id from public.meal_logs where id=$1', [log])).toEqual([{ id: log }]);
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
    expect(await asUser(patientAUser, 'select id from public.meal_logs_patient_view')).not.toHaveLength(0);
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
    await db.query(`insert into public.payment_webhook_events(provider,external_event_id,event_type) values('mercadopago','evt-docker-1','payment')`);
    await expect(db.query(`insert into public.payment_webhook_events(provider,external_event_id,event_type) values('mercadopago','evt-docker-1','payment')`)).rejects.toMatchObject({});
    expect(Number((await db.query<{ n: number }>(`select count(*)::int as n from public.payment_webhook_events where external_event_id='evt-docker-1'`)).rows[0].n)).toBe(1);
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

  it('Nutri A invita, Ana acepta, declara, Nutri A revisa en privado y publica el plan', async () => {
    const invite = (await db.query<{ id: string }>(
      `insert into public.patient_invites(patient_id,nutritionist_id,email,status,invited_at,expires_at)
       values($1,$2,'ana.corte@example.test','pending',now(),now()+interval '7 days') returning id`,
      [anaPatient, nutriAId],
    )).rows[0].id;
    expect(await rpc(anaUser, 'accept_patient_invite', [invite])).toBe(anaPatient);

    const started = await rpc(anaUser, 'get_patient_intake', [anaPatient]) as { intake: { revision: number } };
    const saved = await rpc(anaUser, 'save_patient_intake', [anaPatient, started.intake.revision, 'allergies', {
      preferred_name: 'Ana',
      patient_intent: 'Quiero regular horarios',
      allergies: { state: 'reported', items: ['Maní'] },
      restrictions: { state: 'none', items: [] },
    }]) as { intake: { revision: number } };
    const care = CONSENT_CATALOG.find((entry) => entry.purpose === 'care_relationship')!;
    await rpc(anaUser, 'record_patient_consent', [anaPatient, care.purpose, care.text_version, care.text_hash, 'granted']);
    const submitted = await rpc(anaUser, 'submit_patient_intake', [anaPatient, saved.intake.revision]) as { intake: { status: string; revision: number } };
    expect(submitted.intake.status).toBe('submitted');

    await expect(rpc(nutriB, 'get_patient_intake', [anaPatient])).rejects.toMatchObject({ code: '42501' });
    await expect(rpc(patientBUser, 'get_patient_intake', [anaPatient])).rejects.toMatchObject({ code: '42501' });

    const reviewed = await rpc(nutriA, 'review_patient_intake', [anaPatient, submitted.intake.revision]) as { intake: { status: string; reviewed_by: string } };
    expect(reviewed.intake.status).toBe('reviewed');
    expect(reviewed.intake.reviewed_by).toBe(nutriA);
    await rpc(nutriA, 'add_patient_clinical_note', [anaPatient, PRIVATE_NOTE]);

    const patientView = await rpc(anaUser, 'get_patient_intake', [anaPatient]) as Record<string, unknown> & { intake: Record<string, unknown> };
    expect(patientView).not.toHaveProperty('clinical_notes');
    expect(patientView.intake).not.toHaveProperty('reviewed_by');
    expect(JSON.stringify(patientView)).not.toContain(PRIVATE_NOTE);
    expect((await rpc(nutriA, 'get_patient_intake', [anaPatient]) as { clinical_notes: Array<{ body: string }> }).clinical_notes[0].body).toBe(PRIVATE_NOTE);

    await asUser(nutriA, `insert into public.meal_slots(patient_id,weekday,slot,title) values($1,1,'almuerzo',$2)`, [anaPatient, PLAN_TITLE]);
    expect(await asUser(anaUser, 'select title from public.meal_slots')).toEqual([{ title: PLAN_TITLE }]);
    expect(await asUser(nutriB, 'select title from public.meal_slots')).toEqual([{ title: 'Cena B' }]);
    expect(await asUser(patientBUser, 'select title from public.meal_slots')).toEqual([{ title: 'Cena B' }]);
  });

  it('conserva ingreso, plan y aislamiento A/B tras reiniciar el contenedor', async () => {
    await db.pool.end();
    db = await restartDisposablePostgres(url);
    const saved = await rpc(anaUser, 'get_patient_intake', [anaPatient]) as { intake: { status: string; payload: { preferred_name: string } } };
    expect(saved.intake).toMatchObject({ status: 'reviewed', payload: { preferred_name: 'Ana' } });
    expect(await asUser(anaUser, 'select title from public.meal_slots')).toEqual([{ title: PLAN_TITLE }]);
    expect(await asUser(nutriA, 'select full_name from public.patients where id=$1', [patientA])).toEqual([{ full_name: 'Paciente A' }]);
    expect(await asUser(nutriA, 'select id from public.patients where id=$1', [patientB])).toEqual([]);
    expect(await asUser(patientAUser, 'select id from public.patients_patient_view')).toEqual([{ id: patientA }]);
  });

  it('apply:disposable rehúsa cuando ya hay pacientes sintéticos', () => {
    const result = spawnSync('npm', ['run', 'apply:disposable'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        APP_MODE: 'test',
        DISPOSABLE_SUPABASE_APPLY: 'I_UNDERSTAND_DISPOSABLE_ONLY',
        DISPOSABLE_DATABASE_URL: url,
      },
    });
    expect(result.status).not.toBe(0);
    expect(`${result.stderr}${result.stdout}`).toMatch(/patients already has/i);
  });
});
