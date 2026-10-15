import { AsyncLocalStorage } from 'node:async_hooks';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CarteraOverview, CarteraProgress } from '../../src/types/cartera.js';
import { CONSENT_CATALOG } from '../intake/consent.js';
import { CareError } from '../care/errors.js';
import { registerCarteraRoutes } from './routes.js';

const clients = vi.hoisted(() => ({ request: null as null | (() => SupabaseClient), admin: null as null | (() => SupabaseClient) }));
vi.mock('../db/supabase-client.js', () => ({
  getRequestDb: () => clients.request!(),
  privilegedDb: () => clients.admin!(),
  isSupabaseEnabled: () => true,
}));

// Dos consultorios, una paciente en cada uno y un administrador del servicio sin ficha clínica.
// Migraciones y RLS reales en PGlite; no hay Auth, PostgREST ni producción.
let db: PGlite;
const requestActor = new AsyncLocalStorage<string>();
const nutriA = '00000000-0000-4000-a000-0000000000d1';
const nutriB = '00000000-0000-4000-a000-0000000000d2';
const patientAUser = '00000000-0000-4000-a000-0000000000d3';
const patientBUser = '00000000-0000-4000-a000-0000000000d4';
const platformAdmin = '00000000-0000-4000-a000-0000000000d5';
const patientA = '10000000-0000-4000-a000-0000000000d1';
const patientB = '10000000-0000-4000-a000-0000000000d2';
const silentA = '10000000-0000-4000-a000-0000000000d6';

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
        gte(column: string, value: unknown) { params.push(value); where.push(`${identifier(column)}>=$${params.length}`); return query; },
        in(column: string, values: unknown[]) { params.push(values); where.push(`${identifier(column)}::text=any($${params.length}::text[])`); return query; },
        order(column: string) { orders.push(identifier(column)); return query; },
        range(start: number, end: number) { return run(start, end - start + 1); },
        maybeSingle() { return run(0, 1, true); },
      };
      return query;
    },
    async rpc(name: string, args: Record<string, unknown> = {}) {
      try {
        const rows = await select(`select public.${identifier(name)}(${Object.keys(args).map((key, index) => `${identifier(key)}=>$${index + 1}`).join(',')}) as result`, Object.values(args), actor);
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
registerCarteraRoutes(app);
const get = (path: string, user = nutriA) => app.request(path, { headers: { 'x-test-user': user } });
const post = (path: string, body: unknown, user = nutriA) => app.request(path, {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-test-user': user }, body: JSON.stringify(body),
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
  for (const [id, mail] of [[nutriA, 'nutri-a'], [nutriB, 'nutri-b'], [patientAUser, 'paciente-a'], [patientBUser, 'paciente-b'], [platformAdmin, 'admin']]) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, `${mail}@example.test`]);
  }
  const nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  const nutriBId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri B') as id", [nutriB])).rows[0].id;
  await db.query('insert into public.platform_admins(user_id) values($1)', [platformAdmin]);
  const patients: Array<[string, string, string | null, string, string]> = [
    [patientA, nutriAId, patientAUser, 'Paciente A', 'now()'],
    [patientB, nutriBId, patientBUser, 'Paciente B', 'now()'],
    [silentA, nutriAId, '00000000-0000-4000-a000-0000000000d7', 'Paciente A sin registros', "now() - interval '100 days'"],
  ];
  await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', ['00000000-0000-4000-a000-0000000000d7', 'silent@example.test']);
  for (const [pid, nid, user, name, createdAt] of patients) {
    await db.query(`insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status,created_at) values($1,$2,$3,$4,'waived',${createdAt})`, [pid, nid, user, name]);
  }
  for (const [pid, user] of [[patientA, patientAUser], [patientB, patientBUser]]) {
    for (const text of CONSENT_CATALOG) {
      await select('select public.record_patient_consent($1,$2,$3,$4,$5)', [pid, text.purpose, text.text_version, text.text_hash, 'granted'], user);
    }
  }
  // Paciente A: comidas, actividad con kcal declaradas, peso (con permiso), pedidos de reemplazo, mensaje de la profesional y de la paciente.
  await db.query("insert into public.meal_logs(patient_id,slot_label,status) select $1,'Almuerzo','confirmed' from generate_series(1,260)", [patientA]);
  await db.query("insert into public.habit_logs(patient_id,date,hydration,hydration_declared,energy) values($1,(now() at time zone 'America/Argentina/Buenos_Aires')::date,5,true,'Alta')", [patientA]);
  await db.query(`insert into public.care_records(id,patient_id,recorded_on,data) values
    (gen_random_uuid(),$1,(now() at time zone 'America/Argentina/Buenos_Aires')::date,'{"kind":"activity","activity":"Caminata","minutes":30,"intensity":"suave","kcal":120,"note":"Nota privada"}'),
    (gen_random_uuid(),$1,(now() at time zone 'America/Argentina/Buenos_Aires')::date,'{"kind":"weight","source":"patient","value":64.1,"unit":"kg","note":""}'),
    (gen_random_uuid(),$1,(now() at time zone 'America/Argentina/Buenos_Aires')::date,'{"kind":"menu_request","target":"Pollo","reason":"No me gusta","replacement":"recipe"}'),
    (gen_random_uuid(),$1,(now() at time zone 'America/Argentina/Buenos_Aires')::date,'{"kind":"menu_request","target":"Pescado","reason":"No me gusta","replacement":"recipe"}'),
    (gen_random_uuid(),$1,(now() at time zone 'America/Argentina/Buenos_Aires')::date,'{"kind":"menu_request","target":"Arroz","reason":"No me gusta","replacement":"ingredient"}')`, [patientA]);
  await db.query("insert into public.messages(patient_id,nutritionist_id,author_id,body,sent_at) values($1,$2,$3,'Texto privado profesional',now()),($1,$2,$4,'Texto privado paciente',now())", [patientA, nutriAId, nutriA, patientAUser]);
  await db.query("insert into public.appointments(patient_id,nutritionist_id,starts_at,channel) values($1,$2,now() - interval '2 days','video')", [patientA, nutriAId]);
  await db.query("insert into public.patient_payments(patient_id,nutritionist_id,amount,paid_on,method,status,created_by) values($1,$2,30000,(now() at time zone 'America/Argentina/Buenos_Aires')::date,'efectivo','confirmed',$3)", [patientA, nutriAId, nutriA]);
  // Paciente B: datos propios que nunca deben verse desde el consultorio A.
  await db.query("insert into public.meal_logs(patient_id,slot_label,status) select $1,'Cena','confirmed' from generate_series(1,3)", [patientB]);
  await db.query(`insert into public.care_records(id,patient_id,recorded_on,data) values
    (gen_random_uuid(),$1,(now() at time zone 'America/Argentina/Buenos_Aires')::date,'{"kind":"activity","activity":"Yoga B","minutes":50,"intensity":"suave","kcal":null,"note":""}')`, [patientB]);
  await db.query("insert into public.messages(patient_id,nutritionist_id,author_id,body,sent_at) values($1,$2,$3,'Texto privado B',now())", [patientB, nutriBId, nutriB]);
  await db.query("insert into public.patient_payments(patient_id,nutritionist_id,amount,paid_on,method,status,created_by) values($1,$2,99000,(now() at time zone 'America/Argentina/Buenos_Aires')::date,'efectivo','confirmed',$3)", [patientB, nutriBId, nutriB]);
}, 90000);
afterAll(async () => { await db?.close(); });

describe('Inicio y Progreso global con sesiones, migraciones y RLS reales', () => {
  it('cada consultorio ve sólo sus indicadores, sin cifras ni nombres del otro', async () => {
    const [a, b] = await Promise.all([get('/api/crm/overview?days=30', nutriA), get('/api/crm/overview?days=30', nutriB)]);
    expect(a.status).toBe(200);
    const bodyA = await a.json() as CarteraOverview;
    const bodyB = await b.json() as CarteraOverview;
    const value = (body: CarteraOverview, id: string) => body.indicators.find(entry => entry.id === id)!.value;
    expect(value(bodyA, 'income')).toBe(30000);
    expect(value(bodyB, 'income')).toBe(99000);
    expect(value(bodyA, 'messages_sent')).toBe(1);
    expect(value(bodyA, 'first_consultations')).toBe(1);
    expect(value(bodyA, 'new_patients')).toBe(1);
    expect(value(bodyB, 'new_patients')).toBe(1);
    expect(bodyA.active_patients).toBe(2);
    expect(JSON.stringify(bodyA)).not.toMatch(/Paciente B|Yoga B|Texto privado|Nota privada|99000/);
    expect(JSON.stringify(bodyB)).not.toMatch(/Paciente A|Caminata|30000/);
  });

  it('las acciones son hechos y salen sólo de pacientes propias', async () => {
    const body = await (await get('/api/crm/overview?days=30', nutriA)).json() as CarteraOverview;
    const titles = body.actions.items.map(item => `${item.patient_name}: ${item.title}`);
    expect(titles).toContain('Paciente A: 3 pedidos de reemplazo en 30 días');
    expect(titles).toContain('Paciente A sin registros: Sin registros en los últimos 60 días');
    expect(JSON.stringify(body.actions)).not.toMatch(/riesgo|abandono|adherencia/i);
    const other = await (await get('/api/crm/overview?days=30', nutriB)).json() as CarteraOverview;
    expect(other.actions.items.every(item => item.patient_id === patientB)).toBe(true);
  });

  it('descartar es del consultorio, no se comparte y la acción reaparece si cambia el hecho', async () => {
    const before = await (await get('/api/crm/overview?days=30', nutriA)).json() as CarteraOverview;
    const target = before.actions.items.find(item => item.patient_id === silentA)!;
    const payload = { patient_id: target.patient_id, signal: target.signal, fingerprint: target.fingerprint };
    expect((await post('/api/crm/actions/dismiss', payload, nutriB)).status).toBe(403);
    expect((await post('/api/crm/actions/dismiss', payload, patientAUser)).status).toBe(403);
    expect((await post('/api/crm/actions/dismiss', payload, platformAdmin)).status).toBe(403);
    expect((await post('/api/crm/actions/dismiss', { ...payload, signal: 'otra' }, nutriA)).status).toBe(400);
    expect((await post('/api/crm/actions/dismiss', payload, nutriA)).status).toBe(200);
    expect((await post('/api/crm/actions/dismiss', payload, nutriA)).status).toBe(200);
    const after = await (await get('/api/crm/overview?days=30', nutriA)).json() as CarteraOverview;
    expect(after.actions.items.some(item => item.patient_id === silentA)).toBe(false);
    expect(after.actions.items.some(item => item.signal === 'many_replacements')).toBe(true);
    expect((await select('select * from public.crm_action_dismissals', [], nutriB)).length).toBe(0);
    expect((await select('select * from public.crm_action_dismissals', [], nutriA)).length).toBe(1);
    await db.query("insert into public.meal_logs(patient_id,slot_label,status,logged_at) values($1,'Cena','confirmed',now() - interval '9 days')", [silentA]);
    const changed = await (await get('/api/crm/overview?days=30', nutriA)).json() as CarteraOverview;
    expect(changed.actions.items.find(item => item.patient_id === silentA)?.title).toBe('Sin registros hace 9 días');
  });

  it('el feed completo se pagina sin truncar y no mezcla consultorios', async () => {
    const first = await (await get('/api/crm/progress?days=30&filter=meal&limit=100', nutriA)).json() as CarteraProgress;
    expect(first.counts.meal).toBe(261);
    expect(first.items).toHaveLength(100);
    let cursor = first.next_cursor;
    let seen = first.items.length;
    while (cursor) {
      const page = await (await get(`/api/crm/progress?days=30&filter=meal&limit=100&cursor=${cursor}`, nutriA)).json() as CarteraProgress;
      seen += page.items.length;
      cursor = page.next_cursor;
    }
    expect(seen).toBe(261);
    const all = await (await get('/api/crm/progress?days=30&limit=100', nutriA)).json() as CarteraProgress;
    expect(new Set(all.items.map(item => item.patient_id)).has(patientB)).toBe(false);
    expect(all.activity).toEqual({ sessions: 1, minutes: 30, kcal_declared: 120, sessions_with_kcal: 1 });
    expect(all.counts.measurement).toBe(1);
    expect(JSON.stringify(all)).not.toMatch(/Yoga B|Texto privado|Nota privada|Paciente B/);
    const b = await (await get('/api/crm/progress?days=30&limit=100', nutriB)).json() as CarteraProgress;
    expect(new Set(b.items.map(item => item.patient_id))).toEqual(new Set([patientB]));
    expect(b.activity.sessions).toBe(1);
  });

  it('sin permiso de medidas vigente el peso no aparece ni cuenta', async () => {
    const text = CONSENT_CATALOG.find(entry => entry.purpose === 'measurement')!;
    await select('select public.record_patient_consent($1,$2,$3,$4,$5)', [patientA, text.purpose, text.text_version, text.text_hash, 'withdrawn'], patientAUser);
    const body = await (await get('/api/crm/progress?days=30', nutriA)).json() as CarteraProgress;
    expect(body.counts.measurement).toBe(0);
    expect(JSON.stringify(body)).not.toContain('64,1');
  });

  it('rechaza sesión de paciente, administrador del servicio, filtros ajenos y cursores de otro consultorio', async () => {
    for (const user of [patientAUser, patientBUser, platformAdmin]) {
      expect((await get('/api/crm/overview?days=30', user)).status).toBe(403);
      expect((await get('/api/crm/progress?days=30', user)).status).toBe(403);
    }
    expect((await get(`/api/crm/progress?days=30&patient_id=${patientB}`, nutriA)).status).toBe(403);
    const page = await (await get('/api/crm/progress?days=30&limit=1', nutriA)).json() as CarteraProgress;
    expect((await get(`/api/crm/progress?days=30&limit=1&cursor=${page.next_cursor}&patient_id=${patientB}`, nutriB)).status).toBe(400);
    expect((await get('/api/crm/overview?days=14', nutriA)).status).toBe(400);
    expect((await get('/api/crm/progress?days=30&nutritionist_id=otro', nutriA)).status).toBe(400);
  });
});
