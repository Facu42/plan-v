import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

// Lista revisada en producción el 1/10. Una tabla nueva sin políticas exige
// justificar su uso y cerrar también permisos de tabla y de columnas.
const INTERNAL = [
  // Cola de fotos: sólo servicio; lectura mediante el plan autorizado.
  // Catálogo de fotos de ingredientes y su contador diario: sólo servicio, sin lectura directa.
  'audit_events', 'cover_daily_usage', 'ingredient_covers', 'menu_dish_covers', 'notification_deliveries', 'notification_preferences',
  'nutritionist_subscriptions', 'outbox_events', 'patient_invite_events',
  'payment_webhook_events', 'platform_admins', 'platform_settings',
  'privacy_access_events', 'privacy_export_packages', 'privacy_requests',
  'processing_jobs', 'recipe_cover_requests', 'recipe_day_assignments', 'recipe_version_cards', 'service_payments',
] as const;
const PUBLIC_ROLES = ['anon', 'authenticated'] as const;
const TABLE_PRIVILEGES = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER', 'MAINTAIN'];
let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  // Reproducir grants abiertos de Supabase antes de ejecutar las migraciones.
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    grant usage on schema public, auth, storage to authenticated, anon, service_role;
    alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
  `);
  const migrations = new URL('../../supabase/migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter((name) => name.endsWith('.sql')).sort()) {
    await db.exec(await readFile(new URL(file, migrations), 'utf8'));
  }
}, 60000);

afterAll(async () => { await db?.close(); });

describe('tablas internas: cierre directo y funciones autorizadas', () => {
  it('las únicas tablas public sin políticas son las clasificadas y tienen RLS', async () => {
    const { rows } = await db.query<{ name: string; rls: boolean }>(`
      select c.relname as name,c.relrowsecurity as rls
      from pg_class c join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind in ('r','p')
        and not exists(select 1 from pg_policy p where p.polrelid=c.oid)
      order by c.relname
    `);
    expect(rows.map((r) => r.name)).toEqual(INTERNAL);
    expect(rows.every((r) => r.rls)).toBe(true);
  });

  for (const role of PUBLIC_ROLES) {
    it(`${role} no tiene permisos de tabla ni excepciones por columnas`, async () => {
      for (const table of INTERNAL) {
        for (const privilege of TABLE_PRIVILEGES) {
          const { rows } = await db.query<{ allowed: boolean }>(
            'select has_table_privilege($1,$2,$3) as allowed', [role, `public.${table}`, privilege],
          );
          expect(rows[0].allowed, `${role}: ${table} ${privilege}`).toBe(false);
        }
        for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'REFERENCES']) {
          const { rows } = await db.query<{ allowed: boolean }>(
            'select has_any_column_privilege($1,$2,$3) as allowed', [role, `public.${table}`, privilege],
          );
          expect(rows[0].allowed, `${role}: ${table} columna ${privilege}`).toBe(false);
        }
      }
    });

    for (const table of INTERNAL) {
      it(`${role} recibe denegación al leer, insertar, borrar o vaciar ${table}`, async () => {
        for (const sql of [
          `select * from public.${table}`,
          `insert into public.${table} default values`,
          `delete from public.${table} where false`,
          `truncate public.${table}`,
        ]) {
          // Transacción local: ante una apertura accidental la prueba no conserva cambios.
          await expect(db.transaction(async (tx) => {
            await tx.exec(`set local role ${role}`);
            await tx.exec(sql);
            throw new Error('Acceso directo inesperado');
          })).rejects.toMatchObject({ code: '42501' });
        }
      });
    }
  }

  it('service_role conserva las operaciones necesarias para el servidor', async () => {
    for (const table of INTERNAL) {
      for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
        const { rows } = await db.query<{ allowed: boolean }>(
          'select has_table_privilege($1,$2,$3) as allowed', ['service_role', `public.${table}`, privilege],
        );
        expect(rows[0].allowed, `${table} ${privilege}`).toBe(true);
      }
    }
  });

  it('ninguna vista ni vista materializada depende de estas tablas', async () => {
    const { rows } = await db.query(`
      select distinct n.nspname,c.relname
      from pg_depend d join pg_rewrite rw on rw.oid=d.objid
      join pg_class c on c.oid=rw.ev_class join pg_namespace n on n.oid=c.relnamespace
      join pg_class target on target.oid=d.refobjid
      join pg_namespace tn on tn.oid=target.relnamespace
      where d.classid='pg_rewrite'::regclass and d.refclassid='pg_class'::regclass
        and c.relkind in ('v','m') and tn.nspname='public' and target.relname=any($1::text[])
    `, [INTERNAL]);
    expect(rows).toEqual([]);
  });

  it('las preferencias siguen funcionando por RPC y se aíslan por identidad', async () => {
    const userA = '00000000-0000-4000-a000-0000000000a1';
    const userB = '00000000-0000-4000-a000-0000000000b1';
    await db.query("insert into auth.users(id,email,email_confirmed_at) values ($1,'a@example.test',now()),($2,'b@example.test',now())", [userA, userB]);
    async function preferences(user: string, write = false) {
      return db.transaction(async (tx) => {
        await tx.exec('set local role authenticated');
        await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [user]);
        const sql = write
          ? `select public.save_notification_preferences('{"in_app":false,"email":true,"push":false}'::jsonb) as result`
          : 'select public.get_notification_preferences() as result';
        return (await tx.query<{ result: unknown }>(sql)).rows[0].result;
      });
    }
    expect(await preferences(userA, true)).toEqual({ in_app: false, email: true, push: false });
    expect(await preferences(userA)).toEqual({ in_app: false, email: true, push: false });
    expect(await preferences(userB)).toEqual({ in_app: true, email: false, push: false });
    await expect(db.transaction(async (tx) => {
      await tx.exec('set local role anon');
      await tx.exec('select public.get_notification_preferences()');
    })).rejects.toMatchObject({ code: '42501' });
  });
});

