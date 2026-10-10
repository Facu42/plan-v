import { AsyncLocalStorage } from 'node:async_hooks';
import { readFile, readdir } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { Hono } from 'hono';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkspaceSearchResponse } from '../../src/types/search.js';
import { CareError } from '../care/errors.js';
import { registerSearchRoutes } from './routes.js';

const clients = vi.hoisted(() => ({ request: null as null | (() => SupabaseClient), admin: null as null | (() => SupabaseClient) }));
vi.mock('../db/supabase-client.js', () => ({
  getRequestDb: () => clients.request!(),
  privilegedDb: () => clients.admin!(),
  isSupabaseEnabled: () => true,
}));

// Dos consultorios reales en Postgres descartable (PGlite) con todas las migraciones y RLS; sin Supabase ni producción.
let db: PGlite;
const requestActor = new AsyncLocalStorage<string>();
const nutriA = '00000000-0000-4000-a000-0000000000d1';
const nutriB = '00000000-0000-4000-a000-0000000000d2';
const adminUser = '00000000-0000-4000-a000-0000000000d3';
const patientAUser = '00000000-0000-4000-a000-0000000000d4';
const patientA = '10000000-0000-4000-a000-0000000000d1';
const patientB = '10000000-0000-4000-a000-0000000000d2';

async function select(sql: string, params: unknown[], actor: string | null) {
  return db.transaction(async tx => {
    if (actor) {
      await tx.exec('set local role authenticated');
      await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [actor]);
    }
    return (await tx.query<Record<string, unknown>>(sql, params)).rows;
  });
}
const identifier = (value: string) => {
  if (!/^[a-z_]+$/.test(value)) throw new Error('Identificador de prueba inválido');
  return `"${value}"`;
};
const normalizeDates = (row: Record<string, unknown>) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]));

function adapter(actor: string | null) {
  return {
    from(table: string) {
      let columns = '*';
      let wantCount = false;
      const where: string[] = [];
      const params: unknown[] = [];
      const orders: string[] = [];
      const run = async (offset = 0, limit = 1, single = false) => {
        const clause = where.length ? ` where ${where.join(' and ')}` : '';
        try {
          const rows = await select(`select ${columns} from public.${identifier(table)}${clause}${orders.length ? ` order by ${orders.join(',')}` : ''} limit ${limit} offset ${offset}`, params, actor);
          const count = wantCount ? Number((await select(`select count(*)::int as n from public.${identifier(table)}${clause}`, params, actor))[0].n) : null;
          return { data: single ? rows[0] ?? null : rows.map(normalizeDates), error: null, count };
        } catch (error) { return { data: null, error: error as { code: string }, count: null }; }
      };
      const query = {
        select(value: string, options?: { count?: string }) {
          wantCount = options?.count === 'exact';
          columns = value.split(',').map(column => identifier(column)).join(',');
          return query;
        },
        eq(column: string, value: unknown) { params.push(value); where.push(`${identifier(column)}=$${params.length}`); return query; },
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
registerSearchRoutes(app);
const search = (q: string, user = nutriA) => app.request(`/api/search?q=${encodeURIComponent(q)}`, { headers: { 'x-test-user': user } });
const foodPayload = (name: string) => JSON.stringify({ name, brand: '', category: 'Legumbres', kind: 'food', source: 'Etiqueta', reference: '', nutrients: { kcal: 340, protein: null, carbs: null, fat: null, fiber: null, sodium: null, calcium: null, iron: null, potassium: null, magnesium: null, vitamin_c: null }, portions: [] });

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
  for (const [id, mail] of [[nutriA, 'nutri-a'], [nutriB, 'nutri-b'], [adminUser, 'admin'], [patientAUser, 'paciente-a']]) {
    await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [id, `${mail}@example.test`]);
  }
  const nutriAId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri A') as id", [nutriA])).rows[0].id;
  const nutriBId = (await db.query<{ id: string }>("select public.provision_nutritionist($1,'Nutri B') as id", [nutriB])).rows[0].id;
  await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values($1,$2,$3,'Marisol Ficticia A','waived')", [patientA, nutriAId, patientAUser]);
  await db.query("insert into public.patients(nutritionist_id,full_name,billing_status,archived_at) values($1,'Marisol Archivada A','waived',now())", [nutriAId]);
  await db.query("insert into public.patients(id,nutritionist_id,full_name,billing_status) values($1,$2,'Marisol Ficticia B','waived')", [patientB, nutriBId]);
  await db.query('insert into public.food_catalog(id,owner_id,payload) values(gen_random_uuid(),$1,$2::jsonb),(gen_random_uuid(),$3,$4::jsonb)', [nutriAId, foodPayload('Lentejas del consultorio A'), nutriBId, foodPayload('Lentejas del consultorio B')]);
  for (const [nid, title] of [[nutriAId, 'Guiso de lentejas A'], [nutriBId, 'Guiso de lentejas B']]) {
    const recipe = (await db.query<{ id: string }>('insert into public.recipes(id,nutritionist_id,title) values(gen_random_uuid(),$1,$2) returning id', [nid, title])).rows[0].id;
    await db.query('insert into public.recipe_versions(recipe_id,version,yield_portions) values($1,1,2)', [recipe]);
  }
}, 120000);
afterAll(async () => { await db?.close(); });

describe('Buscador global: dos consultorios reales en Postgres descartable', () => {
  it('cada profesional encuentra sólo sus pacientes, alimentos propios y recetas', async () => {
    const a = await (await search('marisol', nutriA)).json() as WorkspaceSearchResponse;
    const b = await (await search('marisol', nutriB)).json() as WorkspaceSearchResponse;
    expect(a.patients.map(p => p.name)).toEqual(['Marisol Ficticia A']);
    expect(b.patients.map(p => p.name)).toEqual(['Marisol Ficticia B']);
    expect(a.totals.patients).toBe(1);
    const lentejasA = await (await search('lentejas', nutriA)).json() as WorkspaceSearchResponse;
    const lentejasB = await (await search('lentejas', nutriB)).json() as WorkspaceSearchResponse;
    expect(lentejasA.foods.map(f => f.name)).toEqual(['Lentejas del consultorio A']);
    expect(lentejasA.recipes.map(r => r.title)).toEqual(['Guiso de lentejas A']);
    expect(lentejasB.foods.map(f => f.name)).toEqual(['Lentejas del consultorio B']);
    expect(lentejasB.recipes.map(r => r.title)).toEqual(['Guiso de lentejas B']);
    expect(JSON.stringify([a, lentejasA])).not.toContain(patientB);
  });

  it('una sesión de paciente o un administrador sin consultorio no reciben resultados clínicos', async () => {
    expect((await search('marisol', patientAUser)).status).toBe(403);
    expect((await search('marisol', adminUser)).status).toBe(403);
  });

  it('un identificador de consultorio enviado por el cliente se rechaza y no cambia el alcance', async () => {
    const response = await app.request('/api/search?q=marisol&nutritionist_id=otro', { headers: { 'x-test-user': nutriA } });
    expect(response.status).toBe(400);
  });
});
