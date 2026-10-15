import { AsyncLocalStorage } from 'node:async_hooks';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AssistantAnswer } from '../../src/types/assistant.js';
import { CONSENT_CATALOG } from '../intake/consent.js';
import { CareError } from '../care/errors.js';
import { registerAssistantRoutes } from './routes.js';

const clients = vi.hoisted(() => ({ request: null as null | (() => SupabaseClient), admin: null as null | (() => SupabaseClient) }));
vi.mock('../db/supabase-client.js', () => ({
  getRequestDb: () => clients.request!(),
  privilegedDb: () => clients.admin!(),
  isSupabaseEnabled: () => true,
}));

// Postgres descartable (PGlite) con todas las migraciones del repo, RLS y sesiones simuladas.
// Identidades ficticias; no usa Auth/PostgREST ni la base de producción.
let db: PGlite;
const requestActor = new AsyncLocalStorage<string>();
const nutriA = '00000000-0000-4000-a000-0000000000d1';
const nutriB = '00000000-0000-4000-a000-0000000000d2';
const patientAUser = '00000000-0000-4000-a000-0000000000d3';
const patientBUser = '00000000-0000-4000-a000-0000000000d4';
const serviceAdmin = '00000000-0000-4000-a000-0000000000d5';
const patientA = '10000000-0000-4000-a000-0000000000d1';
const patientB = '10000000-0000-4000-a000-0000000000d2';
const patientAQuiet = '10000000-0000-4000-a000-0000000000d3';

async function select(sql: string, params: unknown[], actor: string | null) {
  return db.transaction(async tx => {
    if (actor) {
      await tx.exec('set local role authenticated');
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [actor]);
    }
    return (await tx.query<Record<string, unknown>>(sql, params)).rows;
  });
}
function identifier(value: string) {
  if (!/^[a-z_]+$/.test(value)) throw new Error('Identificador de prueba inválido');
  return `"${value}"`;
}
function normalizeDates(row: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]));
}
function adapter(actor: string | null) {
  return {
    from(table: string) {
      let columns = '*';
      const where: string[] = [];
      const params: unknown[] = [];
      const orders: string[] = [];
      const run = async (offset = 0, limit = 1, single = false) => {
        try {
          const rows = await select(`select ${columns} from public.${identifier(table)}${where.length ? ` where ${where.join(' and ')}` : ''}${orders.length ? ` order by ${orders.join(',')}` : ''} limit ${limit} offset ${offset}`, params, actor);
          return { data: single ? rows[0] ?? null : rows.map(normalizeDates), error: null };
        } catch (error) { return { data: null, error: error as { code: string } }; }
      };
      const query = {
        select(value: string) {
          columns = value.split(',').map(column => {
            const json = /^([a-z_]+):([a-z_]+)->>([a-z_]+)$/.exec(column);
            return json ? `${identifier(json[2])}->>'${json[3]}' as ${identifier(json[1])}` : identifier(column);
          }).join(',');
          return query;
        },
        eq(column: string, value: unknown) { params.push(value); where.push(`${identifier(column)}=$${params.length}`); return query; },
        is(column: string, value: null) { if (value !== null) throw new Error('Sólo null'); where.push(`${identifier(column)} is null`); return query; },
        in(column: string, values: unknown[]) { params.push(values); where.push(`${identifier(column)}::text=any($${params.length}::text[])`); return query; },
        order(column: string) { orders.push(identifier(column)); return query; },
        range(start: number, end: number) { return run(start, end - start + 1); },
        maybeSingle() { return run(0, 1, true); },
      };
      return query;
    },
    async rpc(name: string, args: Record<string, unknown> = {}) {
      try {
        const values = Object.values(args);
        const rows = await select(`select public.${identifier(name)}(${Object.keys(args).map((key, index) => `${identifier(key)}=>$${index + 1}`).join(',')}) as result`, values, actor);
        return { data: rows[0]?.result ?? null, error: null };
      } catch (error) { return { data: null, error: error as { code: string } }; }
    },
  } as unknown as SupabaseClient;
}

const app = new Hono();
app.use('*', async (c, next) => {
  const user = c.req.header('x-test-user') ?? nutriA;
  c.set('auth', { userId: user });
  return requestActor.run(user, next);
});
app.onError((error, c) => error instanceof CareError ? c.json({ error: error.message }, error.status) : c.json({ error: error.message }, 500));
registerAssistantRoutes(app);
const ask = (user: string, body: unknown) => app.request('/api/crm/assistant', {
  method: 'POST', headers: { 'x-test-user': user, 'content-type': 'application/json' }, body: JSON.stringify(body),
});

beforeAll(async () => {
  db = new PGlite();
  clients.request = () => adapter(requestActor.getStore()!);
  clients.admin = () => adapter(null);
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
  const migrations = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter(name => name.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(file, migrations), 'utf8'));
  for (const [id, mail] of [[nutriA, 'nutri-a'], [nutriB, 'nutri-b'], [patientAUser, 'paciente-a'], [patientBUser, 'paciente-b'], [serviceAdmin, 'admin']]) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, `${mail}@example.test`]);
  }
  const nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  const nutriBId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri B') as id", [nutriB])).rows[0].id;
  // Administrador comercial sin consultorio y una nutricionista que además administra el servicio.
  await db.query('insert into public.platform_admins(user_id) values($1),($2)', [serviceAdmin, nutriB]);
  for (const [pid, nid, user, name] of [[patientA, nutriAId, patientAUser, 'Paciente Alfa Ficticia'], [patientB, nutriBId, patientBUser, 'Paciente Beta Ficticia']]) {
    await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values($1,$2,$3,$4,'waived')", [pid, nid, user, name]);
    for (const text of CONSENT_CATALOG) {
      await select('select public.record_patient_consent($1,$2,$3,$4,$5)', [pid, text.purpose, text.text_version, text.text_hash, 'granted'], user);
    }
    await db.query("insert into public.meal_logs(patient_id,slot_label,status,description,note_for_nutri) values($1,'Almuerzo','pending_review','Descripción privada','Nota privada')", [pid]);
    await db.query("insert into public.messages(patient_id,nutritionist_id,author_id,body,sent_at) values($1,$2,$3,'Texto privado',now())", [pid, nid, user]);
    await db.query("insert into public.appointments(patient_id,nutritionist_id,starts_at,channel) values($1,$2,$3,'video')", [pid, nid, new Date().toISOString()]);
  }
  await db.query("insert into public.patients(id,nutritionist_id,full_name,billing_status) values($1,$2,'Paciente Gama Ficticia','waived')", [patientAQuiet, nutriAId]);
  await db.query("insert into public.ai_briefs(patient_id,nutritionist_id,suggested_action,up_next_title,up_next_body,draft_message,adherence_why) values($1,$2,'ajuste_menu','Ajustar el menú','Cuerpo privado del copiloto','Borrador privado','Explicación privada')", [patientB, nutriBId]);
}, 60000);
afterAll(async () => { await db?.close(); });

describe('Asistente de cartera: dos consultorios y administrador sin acceso clínico', () => {
  it('cada nutricionista recibe sólo sus pacientes, sin textos clínicos ni borradores', async () => {
    const [a, b] = await Promise.all([
      ask(nutriA, { question: '¿Qué pacientes necesitan atención hoy?' }),
      ask(nutriB, { question: '¿Qué pacientes necesitan atención hoy?' }),
    ]);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    const bodyA = await a.json() as AssistantAnswer;
    const bodyB = await b.json() as AssistantAnswer;
    expect(bodyA.source).toBe('supabase');
    expect(bodyA.cards.map(card => card.patient_id)).toEqual([patientA]);
    expect(bodyA.cards[0]).toMatchObject({ priority: 'alta', patient_name: 'Paciente Alfa Ficticia' });
    expect(bodyA.cards[0].reason).toBe('Consulta hoy · 1 mensaje sin leer · 1 comida por revisar');
    expect(bodyB.cards.map(card => card.patient_id)).toEqual([patientB]);
    expect(bodyB.cards[0].reason).toContain('Sugerencia del copiloto: Ajustar el menú');
    const serializedA = JSON.stringify(bodyA);
    expect(serializedA).not.toMatch(/Beta|Ajustar el menú/);
    expect(serializedA).not.toContain(patientB);
    expect(JSON.stringify(bodyB)).not.toMatch(/Alfa|Gama/);
    expect(JSON.stringify([bodyA, bodyB])).not.toMatch(/Descripción privada|Nota privada|Texto privado|Cuerpo privado|Borrador privado|Explicación privada|nutritionist_id/);
  });

  it('el registro semanal se calcula con la sesión y sólo para el consultorio propio', async () => {
    const body = await (await ask(nutriA, { question: 'Resumime la adherencia de mi cartera' })).json() as AssistantAnswer;
    expect(body.intent).toBe('adherence');
    expect(body.summary).toContain('1 registró entre 1 y 4 días');
    expect(body.summary).toContain('1 no registró');
    expect(body.cards.map(card => card.patient_name)).toEqual(['Paciente Gama Ficticia', 'Paciente Alfa Ficticia']);
    expect(JSON.stringify(body)).not.toContain('Beta');
  });

  it('rechaza al administrador comercial sin consultorio y a las pacientes; ser admin no amplía el alcance', async () => {
    expect((await ask(serviceAdmin, { question: '¿Qué pacientes necesitan atención hoy?' })).status).toBe(403);
    expect((await ask(patientAUser, { question: '¿Qué pacientes necesitan atención hoy?' })).status).toBe(403);
    expect((await ask(patientBUser, { question: 'Resumime la adherencia de mi cartera' })).status).toBe(403);
    const adminNutri = await (await ask(nutriB, { question: 'Resumime la adherencia de mi cartera' })).json() as AssistantAnswer;
    expect(JSON.stringify(adminNutri)).not.toMatch(/Alfa|Gama/);
  });

  it('valida la pregunta y no acepta parámetros de alcance enviados por el navegador', async () => {
    expect((await ask(nutriA, { question: '' })).status).toBe(400);
    expect((await ask(nutriA, { question: 'x'.repeat(501) })).status).toBe(400);
    expect((await ask(nutriA, { question: 'hola', nutritionist_id: 'otro' })).status).toBe(400);
    expect((await ask(nutriA, { question: 'hola', patient_ids: [patientB] })).status).toBe(400);
  });
});
