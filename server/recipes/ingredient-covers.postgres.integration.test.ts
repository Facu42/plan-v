import { PGlite } from '@electric-sql/pglite';
import { randomUUID } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

// Catálogo compartido de fotos de ingredientes: sin datos de pacientes, sólo servicio escribe.
let db: PGlite;
const user = '00000000-0000-4000-a000-0000000000c1';

async function as<T = Record<string, unknown>>(role: 'anon' | 'authenticated' | 'service_role', sql: string, params: unknown[] = []) {
  return db.transaction(async tx => {
    await tx.exec(`set local role ${role}`);
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [role === 'authenticated' ? user : '']);
    return (await tx.query<T>(sql, params)).rows;
  });
}
async function service<T = any>(name: string, args: unknown[] = []): Promise<T> {
  const rows = await as<{ result: T }>('service_role', `select public.${name}(${args.map((_, i) => `$${i + 1}`).join(',')}) as result`, args);
  return rows[0].result;
}
async function object(key: string, ext = 'jpg') {
  await db.query("insert into storage.objects(bucket_id,name) values('recipe-covers',$1)", [`ingredients/${key}.${ext}`]);
  return `https://synthetic.supabase.co/storage/v1/object/public/recipe-covers/ingredients/${key}.${ext}`;
}
const rows = async () => (await db.query<any>('select * from public.ingredient_covers order by key')).rows;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;
    grant usage on schema public,auth,storage to authenticated,anon,service_role;
    alter default privileges in schema public grant all on functions to anon,authenticated,service_role;
    alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,last_sign_in_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;
    grant select,insert,delete on storage.objects to authenticated;
    create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;`);
  const root = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(root)).filter(f => f.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(file, root), 'utf8'));
  await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())', [user, 'lectora@example.test']);
}, 60000);
beforeEach(async () => { await db.exec('delete from public.ingredient_covers;delete from public.cover_daily_usage;delete from storage.objects'); });
afterAll(async () => { await db?.close(); });

describe('permisos del catálogo de ingredientes', () => {
  it('tiene RLS sin políticas: ni anon ni una persona con sesión leen nada, ni siquiera las fotos listas', async () => {
    expect((await db.query<{ rls: boolean }>("select relrowsecurity as rls from pg_class where oid='public.ingredient_covers'::regclass")).rows[0].rls).toBe(true);
    expect((await db.query("select 1 from pg_policy where polrelid='public.ingredient_covers'::regclass")).rows).toHaveLength(0);
    await service('enqueue_ingredient_covers', [['tomate']]);
    const url = await object('tomate');
    const job = await service('lease_ingredient_cover', [50]);
    await service('finish_ingredient_cover', [job.key, job.run_token, url, 'Tomate', 60]);
    for (const role of ['anon', 'authenticated'] as const) {
      for (const sql of ['select key from public.ingredient_covers', 'select url from public.ingredient_covers', 'select run_token from public.ingredient_covers', 'select * from public.cover_daily_usage']) {
        await expect(as(role, sql), `${role}: ${sql}`).rejects.toMatchObject({ code: '42501' });
      }
      for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) {
        for (const table of ['ingredient_covers', 'cover_daily_usage']) {
          expect((await db.query<{ ok: boolean }>('select has_table_privilege($1,$2,$3) as ok', [role, `public.${table}`, privilege])).rows[0].ok, `${role} ${table} ${privilege}`).toBe(false);
        }
      }
      expect((await db.query<{ ok: boolean }>("select has_any_column_privilege($1,'public.ingredient_covers','SELECT') as ok", [role])).rows[0].ok).toBe(false);
    }
    expect(await as('service_role', 'select key,status,url from public.ingredient_covers')).toEqual([{ key: 'tomate', status: 'ready', url }]);
  });

  it('nadie con sesión escribe: ni insertar, ni modificar, ni borrar, ni vaciar', async () => {
    for (const sql of [
      "insert into public.ingredient_covers(key) values('papa')", "update public.ingredient_covers set status='ready'",
      'delete from public.ingredient_covers', 'truncate public.ingredient_covers', "insert into public.cover_daily_usage(day,kind,attempts) values(current_date,'dish',1)",
    ]) {
      await expect(as('authenticated', sql), sql).rejects.toMatchObject({ code: '42501' });
      await expect(as('anon', sql), sql).rejects.toMatchObject({ code: '42501' });
    }
  });

  it.each(['enqueue_ingredient_covers', 'lease_ingredient_cover', 'finish_ingredient_cover', 'record_cover_attempt'])('%s sólo la ejecuta el servicio', async name => {
    const args: Record<string, string> = {
      enqueue_ingredient_covers: "array['papa']", lease_ingredient_cover: '5', finish_ingredient_cover: "'papa',gen_random_uuid(),null,'x',60", record_cover_attempt: "'dish'",
    };
    const sql = `select public.${name}(${args[name]})`;
    await expect(as('authenticated', sql)).rejects.toMatchObject({ code: '42501' });
    await expect(as('anon', sql)).rejects.toMatchObject({ code: '42501' });
  });
});

describe('encolado idempotente', () => {
  it('crea una fila por clave válida, ignora repetidas e inválidas y no toca las que ya existen', async () => {
    expect(await service('enqueue_ingredient_covers', [['tomate', 'tomate', 'Mala Clave', '', 'a--b', 'zanahoria', "x'; drop table y;--"]])).toBe(2);
    expect((await rows()).map(r => [r.key, r.status, r.attempts])).toEqual([['tomate', 'queued', 0], ['zanahoria', 'queued', 0]]);
    expect(await service('enqueue_ingredient_covers', [['tomate', 'papa']])).toBe(1);
    expect((await rows()).map(r => r.key)).toEqual(['papa', 'tomate', 'zanahoria']);
  });

  it('una foto lista no vuelve a la cola, ni siquiera pidiendo reintento', async () => {
    await service('enqueue_ingredient_covers', [['tomate']]);
    const job = await service('lease_ingredient_cover', [50]);
    await service('finish_ingredient_cover', [job.key, job.run_token, await object('tomate'), 'Tomate', 60]);
    expect(await service('enqueue_ingredient_covers', [['tomate'], true])).toBe(0);
    expect((await rows())[0].status).toBe('ready');
  });

  it('un fallo definitivo sólo se reabre con el reintento explícito', async () => {
    await service('enqueue_ingredient_covers', [['tomate']]);
    for (let i = 0; i < 3; i += 1) {
      const job = await service('lease_ingredient_cover', [50]);
      await service('finish_ingredient_cover', [job.key, job.run_token, null, 'Tomate', 60]);
      await db.exec("update public.ingredient_covers set run_after=clock_timestamp()-interval '1 second'");
    }
    expect((await rows())[0]).toMatchObject({ status: 'failed', attempts: 3 });
    expect(await service('enqueue_ingredient_covers', [['tomate']])).toBe(0);
    expect(await service('lease_ingredient_cover', [50])).toBeNull();
    expect(await service('enqueue_ingredient_covers', [['tomate'], true])).toBe(1);
    expect((await rows())[0]).toMatchObject({ status: 'queued', attempts: 0 });
  });

  it('acepta como mucho 200 claves por llamada', async () => {
    const keys = Array.from({ length: 250 }, (_, i) => `ingrediente-${i}`);
    expect(await service('enqueue_ingredient_covers', [keys])).toBe(200);
  });
});

describe('reserva, cuota diaria y cierre', () => {
  it('una reserva es exclusiva, sale por orden de llegada y no entrega nada si no hay trabajo', async () => {
    await service('enqueue_ingredient_covers', [['tomate']]); await db.exec("update public.ingredient_covers set created_at=created_at-interval '1 minute'");
    await service('enqueue_ingredient_covers', [['zanahoria']]);
    const first = await service('lease_ingredient_cover', [50]), second = await service('lease_ingredient_cover', [50]);
    expect([first.key, second.key]).toEqual(['tomate', 'zanahoria']);
    expect(Object.keys(first).sort()).toEqual(['key', 'run_token']);
    expect(await service('lease_ingredient_cover', [50])).toBeNull();
    expect((await rows()).map(r => [r.status, r.attempts])).toEqual([['generating', 1], ['generating', 1]]);
  });

  it('respeta run_after: un 429 espera hasta el día siguiente', async () => {
    await service('enqueue_ingredient_covers', [['tomate']]);
    const job = await service('lease_ingredient_cover', [50]);
    await service('finish_ingredient_cover', [job.key, job.run_token, null, 'Tomate', 86460]);
    const [row] = await rows();
    expect(row.status).toBe('queued');
    expect(Date.parse(row.run_after) - Date.now()).toBeGreaterThan(86_000_000);
    expect(await service('lease_ingredient_cover', [50])).toBeNull();
  });

  it('el tope diario cuenta INTENTOS reales del día UTC y se libera al día siguiente', async () => {
    for (const key of ['a1', 'a2', 'a3', 'a4']) await service('enqueue_ingredient_covers', [[key]]);
    expect((await service('lease_ingredient_cover', [2])).key).toBe('a1');
    expect((await service('lease_ingredient_cover', [2])).key).toBe('a2');
    expect(await service('lease_ingredient_cover', [2])).toBeNull();
    await db.exec("update public.cover_daily_usage set day=day-1");
    expect((await service('lease_ingredient_cover', [2])).key).toBe('a3');
  });

  it('la misma clave reservada varias veces el mismo día con tope 2 se corta', async () => {
    await service('enqueue_ingredient_covers', [['tomate']]);
    for (let i = 0; i < 2; i += 1) {
      const job = await service('lease_ingredient_cover', [2]);
      expect(job.key).toBe('tomate');
      await service('finish_ingredient_cover', [job.key, job.run_token, null, 'Tomate', 60]);
      await db.exec("update public.ingredient_covers set run_after=clock_timestamp()-interval '1 second'");
    }
    expect(await service('lease_ingredient_cover', [2])).toBeNull();
    expect((await db.query<{ attempts: number }>("select attempts from public.cover_daily_usage where kind='ingredient'")).rows[0].attempts).toBe(2);
  });

  it('los ingredientes usan como máximo la mitad de la cuota total y cuentan también los intentos de platos', async () => {
    for (const key of ['a1', 'a2', 'a3', 'a4', 'a5']) await service('enqueue_ingredient_covers', [[key]]);
    expect((await service('lease_ingredient_cover', [50, 4])).key).toBe('a1');
    expect((await service('lease_ingredient_cover', [50, 4])).key).toBe('a2');
    expect(await service('lease_ingredient_cover', [50, 4])).toBeNull();
    await db.exec('delete from public.cover_daily_usage');
    for (let i = 0; i < 4; i += 1) await service('record_cover_attempt', ['dish']);
    expect(await service('lease_ingredient_cover', [50, 4])).toBeNull();
    await db.exec('delete from public.cover_daily_usage');
    for (let i = 0; i < 3; i += 1) await service('record_cover_attempt', ['dish']);
    expect((await service('lease_ingredient_cover', [50, 4])).key).toBeTruthy();
    expect(await service('lease_ingredient_cover', [50, 4])).toBeNull();
  });

  it('record_cover_attempt cuenta por día y tipo y rechaza tipos desconocidos', async () => {
    await service('record_cover_attempt', ['dish']); await service('record_cover_attempt', ['dish']);
    expect((await db.query<any>('select kind,attempts from public.cover_daily_usage')).rows).toEqual([{ kind: 'dish', attempts: 2 }]);
    await expect(service('record_cover_attempt', ['otro'])).rejects.toBeTruthy();
  });

  it('una caída del proveedor (401/403/429) no consume intentos, devuelve la cuota y nunca deja la fila en fallo', async () => {
    await service('enqueue_ingredient_covers', [['tomate']]);
    for (let i = 0; i < 5; i += 1) {
      const job = await service('lease_ingredient_cover', [50]);
      expect(job.key).toBe('tomate');
      const done = await service('finish_ingredient_cover', [job.key, job.run_token, null, '', 3600, true]);
      expect(done).toMatchObject({ key: 'tomate', status: 'queued' });
      const [row] = await rows();
      expect(row).toMatchObject({ status: 'queued', attempts: 0, run_token: null });
      expect(Date.parse(row.run_after) - Date.now()).toBeGreaterThan(3_500_000);
      expect(await service('lease_ingredient_cover', [50])).toBeNull();
      await db.exec("update public.ingredient_covers set run_after=clock_timestamp()-interval '1 second'");
    }
    expect((await db.query<{ attempts: number }>("select attempts from public.cover_daily_usage where kind='ingredient'")).rows[0].attempts).toBe(0);
  });

  it('un fallo propio (no del proveedor) sí consume intento y llega a fallo definitivo', async () => {
    await service('enqueue_ingredient_covers', [['tomate']]);
    for (let i = 0; i < 3; i += 1) {
      const job = await service('lease_ingredient_cover', [50]);
      await service('finish_ingredient_cover', [job.key, job.run_token, null, '', 60, false]);
      await db.exec("update public.ingredient_covers set run_after=clock_timestamp()-interval '1 second'");
    }
    expect((await rows())[0]).toMatchObject({ status: 'failed', attempts: 3 });
  });

  it('con tope cero o inválido no reserva nada', async () => {
    await service('enqueue_ingredient_covers', [['tomate']]);
    expect(await service('lease_ingredient_cover', [0])).toBeNull();
    expect(await service('lease_ingredient_cover', [-5])).toBeNull();
    expect(await service('lease_ingredient_cover', [5, 1])).toBeNull();
  });

  it('una reserva vencida vuelve a la cola, o falla si ya gastó los tres intentos', async () => {
    await service('enqueue_ingredient_covers', [['tomate']]); await service('enqueue_ingredient_covers', [['zanahoria']]);
    await service('lease_ingredient_cover', [50]); await service('lease_ingredient_cover', [50]);
    await db.exec("update public.ingredient_covers set lease_until=clock_timestamp()-interval '1 second'");
    await db.exec("update public.ingredient_covers set attempts=3 where key='zanahoria'");
    const again = await service('lease_ingredient_cover', [50]);
    expect(again.key).toBe('tomate');
    expect((await rows()).find(r => r.key === 'zanahoria')).toMatchObject({ status: 'failed', run_token: null });
  });

  it('finalizar exige la reserva vigente con su clave secreta', async () => {
    await service('enqueue_ingredient_covers', [['tomate']]);
    const job = await service('lease_ingredient_cover', [50]);
    await expect(service('finish_ingredient_cover', ['tomate', randomUUID(), null, 'x', 60])).rejects.toMatchObject({ code: 'PT409' });
    await expect(service('finish_ingredient_cover', ['papa', job.run_token, null, 'x', 60])).rejects.toMatchObject({ code: 'PT409' });
    await db.exec("update public.ingredient_covers set lease_until=clock_timestamp()-interval '1 second'");
    await expect(service('finish_ingredient_cover', [job.key, job.run_token, null, 'x', 60])).rejects.toMatchObject({ code: 'PT409' });
  });

  it('sólo acepta direcciones del bucket público bajo ingredients/ con un archivo realmente guardado', async () => {
    await service('enqueue_ingredient_covers', [['tomate']]);
    const job = await service('lease_ingredient_cover', [50]);
    for (const bad of [
      'https://example.test/photo.jpg', 'http://synthetic.supabase.co/storage/v1/object/public/recipe-covers/ingredients/tomate.jpg',
      'https://synthetic.supabase.co/storage/v1/object/public/recipe-covers/ingredients/papa.jpg',
      'https://synthetic.supabase.co/storage/v1/object/public/recipe-covers/other/tomate.jpg',
      'https://synthetic.supabase.co/storage/v1/object/public/recipe-covers/ingredients/tomate.svg',
      'data:image/png;base64,AAAA', 'javascript:alert(1)',
    ]) await expect(service('finish_ingredient_cover', [job.key, job.run_token, bad, 'x', 60]), bad).rejects.toMatchObject({ code: '22023' });
    await expect(service('finish_ingredient_cover', [job.key, job.run_token, 'https://synthetic.supabase.co/storage/v1/object/public/recipe-covers/ingredients/tomate.jpg', 'x', 60]))
      .rejects.toMatchObject({ code: '22023' });
    const url = await object('tomate', 'png');
    const done = await service('finish_ingredient_cover', [job.key, job.run_token, url, 'Tomate · imagen ilustrativa generada con IA', 60]);
    expect(done).toMatchObject({ key: 'tomate', status: 'ready', url });
    expect((await rows())[0]).toMatchObject({ status: 'ready', url, storage_path: 'ingredients/tomate.png', run_token: null, lease_until: null });
    expect((await rows())[0].ready_at).not.toBeNull();
  });

  it('un cierre repetido o fuera de tiempo no pisa la foto lista', async () => {
    await service('enqueue_ingredient_covers', [['tomate']]);
    const job = await service('lease_ingredient_cover', [50]);
    const url = await object('tomate');
    await service('finish_ingredient_cover', [job.key, job.run_token, url, 'Tomate', 60]);
    await expect(service('finish_ingredient_cover', [job.key, job.run_token, null, 'Tomate', 60])).rejects.toMatchObject({ code: 'PT409' });
    expect((await rows())[0]).toMatchObject({ status: 'ready', url });
  });

  it('el catálogo no guarda datos de pacientes: sólo claves de ingrediente y estado', async () => {
    const columns = (await db.query<{ column_name: string }>("select column_name from information_schema.columns where table_schema='public' and table_name='ingredient_covers' order by 1")).rows.map(r => r.column_name);
    expect(columns).toEqual(['alt', 'attempts', 'created_at', 'key', 'last_attempt_at', 'lease_until', 'ready_at', 'run_after', 'run_token', 'status', 'storage_path', 'updated_at', 'url']);
    await expect(db.query("insert into public.ingredient_covers(key) values('Tomate Con Paciente')")).rejects.toBeTruthy();
  });
});
