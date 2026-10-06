import { AsyncLocalStorage } from 'node:async_hooks';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CrmWorkResponse } from '../../src/types/crm-work.js';
import { CONSENT_CATALOG } from '../intake/consent.js';
import { CareError } from '../care/errors.js';
import { registerCrmRoutes } from './routes.js';

const clients = vi.hoisted(() => ({ request: null as null | (() => SupabaseClient), admin: null as null | (() => SupabaseClient) }));
vi.mock('../db/supabase-client.js', () => ({
  getRequestDb: () => clients.request!(),
  privilegedDb: () => clients.admin!(),
  isSupabaseEnabled: () => true,
}));

// El adaptador traduce sólo las lecturas usadas por esta ruta a SQL real.
// JWT shim y RLS de todas las migraciones; no usa Auth/PostgREST ni producción.
let db: PGlite;
const requestActor = new AsyncLocalStorage<string>();
const nutriA = '00000000-0000-4000-a000-0000000000c1';
const nutriB = '00000000-0000-4000-a000-0000000000c2';
const patientAUser = '00000000-0000-4000-a000-0000000000c3';
const patientBUser = '00000000-0000-4000-a000-0000000000c4';
const patientA = '10000000-0000-4000-a000-0000000000c1';
const patientB = '10000000-0000-4000-a000-0000000000c2';
let nutriAId = '';

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
registerCrmRoutes(app);
const request = (user = nutriA, query = '') => app.request(`/api/crm/work-queue${query}`, { headers: { 'x-test-user': user } });

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
  for (const [id, mail] of [[nutriA, 'nutri-a'], [nutriB, 'nutri-b'], [patientAUser, 'paciente-a'], [patientBUser, 'paciente-b']]) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, `${mail}@example.test`]);
  }
  nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  const nutriBId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri B') as id", [nutriB])).rows[0].id;
  for (const [pid, nid, user, name] of [[patientA, nutriAId, patientAUser, 'Paciente A'], [patientB, nutriBId, patientBUser, 'Paciente B']]) {
    await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values($1,$2,$3,$4,'waived')", [pid, nid, user, name]);
    for (const text of CONSENT_CATALOG) {
      await select('select public.record_patient_consent($1,$2,$3,$4,$5)', [pid, text.purpose, text.text_version, text.text_hash, 'granted'], user);
    }
    await db.query("insert into public.meal_logs(patient_id,slot_label,status,description,note_for_nutri) select $1,'Almuerzo','pending_review','Descripción privada','Nota privada' from generate_series(1,35)", [pid]);
    await db.query("insert into public.messages(patient_id,nutritionist_id,author_id,body,sent_at) values($1,$2,$3,'Texto privado',now())", [pid, nid, user]);
    await db.query("insert into public.appointments(patient_id,nutritionist_id,starts_at,channel) values($1,$2,$3,'video')", [pid, nid, new Date().toISOString()]);
    await db.query("insert into public.ai_jobs(patient_id,nutritionist_id,requested_by,job_type,status,prompt_version,context_hash,request) values($1,$2,$3,'menu_draft','succeeded','menu_draft.v2',$4,'{\"period_start\":\"2026-10-05\",\"period_end\":\"2026-10-11\"}')", [pid, nid, user, 'a'.repeat(64)]);
    await db.query("insert into public.care_records(id,patient_id,recorded_on,data) values(gen_random_uuid(),$1,current_date,'{\"kind\":\"weight\",\"source\":\"patient\",\"value\":70,\"unit\":\"kg\",\"note\":\"Dato privado\"}')", [pid]);
  }
}, 60000);
afterAll(async () => { await db?.close(); });

describe('Bandeja: rutas con sesiones y migraciones reales en Postgres descartable', () => {
  it('aísla dos consultorios incluso en los turnos leídos por el servidor y conserva conteos completos', async () => {
    const [a, b] = await Promise.all([request(nutriA, '?kind=meal&limit=30'), request(nutriB, '?kind=meal&limit=30')]);
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    const bodyA = await a.json() as CrmWorkResponse;
    const bodyB = await b.json() as CrmWorkResponse;
    expect(bodyA.total).toBe(35);
    expect(bodyA.counts).toMatchObject({ meal: 35, message: 1, appointment: 1, ai_menu: 1, record: 1 });
    expect(new Set(bodyA.items.map(item => item.patient_id))).toEqual(new Set([patientA]));
    expect(new Set(bodyB.items.map(item => item.patient_id))).toEqual(new Set([patientB]));
    const next = await request(nutriA, `?kind=meal&limit=30&cursor=${bodyA.next_cursor}`);
    expect((await next.json() as CrmWorkResponse).items).toHaveLength(5);
    const all = await (await request(nutriA, '?limit=100')).json() as CrmWorkResponse;
    expect(all.items.every(item => item.patient_id === patientA)).toBe(true);
    expect(JSON.stringify(all)).not.toMatch(/Descripción privada|Nota privada|Texto privado|Dato privado|context_hash|nutritionist_id/);
  });

  it('rechaza la sesión paciente, un filtro ajeno y la reutilización del cursor de otro consultorio', async () => {
    expect((await request(patientAUser)).status).toBe(403);
    expect((await request(patientBUser)).status).toBe(403);
    expect((await request(nutriA, `?patient_id=${patientB}`)).status).toBe(403);
    const page = await (await request(nutriA, '?kind=meal&limit=1')).json() as CrmWorkResponse;
    expect((await request(nutriB, `?kind=meal&limit=1&cursor=${page.next_cursor}`)).status).toBe(400);
  });

  it('la lectura no marca mensajes como vistos y una revisión real retira el pendiente al recargar', async () => {
    await request(nutriA);
    await request(nutriA);
    expect((await db.query<{ count: number }>('select count(*)::int as count from public.message_receipts')).rows[0].count).toBe(0);
    await select('select public.mark_thread_read($1)', [patientA], nutriA);
    const refreshed = await (await request(nutriA)).json() as CrmWorkResponse;
    expect(refreshed.counts.message).toBe(0);
    expect(refreshed.counts.meal).toBe(35);
    expect((await (await request(nutriB)).json() as CrmWorkResponse).counts.message).toBe(1);
  });

  it('un consultorio con más de 100 fichas sigue encontrando el pendiente de la última página', async () => {
    await db.query("insert into public.patients(nutritionist_id,full_name,billing_status) select $1,'Paciente adicional '||n,'waived' from generate_series(1,251) n", [nutriAId]);
    const last = (await db.query<{ id: string }>('select id from public.patients where nutritionist_id=$1 order by id desc limit 1', [nutriAId])).rows[0].id;
    await db.query("insert into public.meal_logs(patient_id,slot_label,status) values($1,'Cena','pending_review')", [last]);
    const response = await request(nutriA, '?kind=meal&limit=100');
    expect(response.status).toBe(200);
    const body = await response.json() as CrmWorkResponse;
    expect(body.total).toBe(36);
    expect(body.items.some(item => item.patient_id === last)).toBe(true);
  }, 30000);
});
