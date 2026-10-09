import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import {
  assertLocalDatabaseUrl,
  openMigratedDatabase,
  problemsForPublicViews,
  publicViewGrantProblems,
  publicViewInvokerAllowlist,
} from './public-view-grants.js';

let db: PGlite;
const owner = '00000000-0000-4000-a000-0000000000a1';
const patientUser = '00000000-0000-4000-a000-0000000000a2';
const patient = '10000000-0000-4000-a000-0000000000a1';

async function asPatient(sql: string, params: unknown[] = []) {
  return db.transaction(async (tx) => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub', $1, true)", [patientUser]);
    return (await tx.query(sql, params)).rows;
  });
}

beforeAll(async () => {
  db = await openMigratedDatabase();
  await db.query(
    `insert into auth.users(id, email, email_confirmed_at) values ($1, 'nutri@example.test', now()), ($2, 'paciente@example.test', now())`,
    [owner, patientUser],
  );
  const nutritionist = (await db.query<{ id: string }>(
    `select public.provision_nutritionist($1, 'Ficticia') as id`,
    [owner],
  )).rows[0].id;
  await db.query(
    `insert into public.patients(id, nutritionist_id, user_id, full_name, billing_status) values ($1, $2, $3, 'A ficticia', 'waived')`,
    [patient, nutritionist, patientUser],
  );
}, 60000);

afterAll(async () => {
  await db?.close();
});

describe('control de vistas públicas', () => {
  it('se niega a revisar producción o un servidor remoto', () => {
    expect(() => assertLocalDatabaseUrl('postgresql://planv@db.wvosvlxpfytokwfbcero.supabase.co:5432/postgres')).toThrow(/producción/);
    expect(() => assertLocalDatabaseUrl('postgresql://planv@example.com:5432/planv')).toThrow(/local/);
    expect(assertLocalDatabaseUrl('postgresql://planv@127.0.0.1:55433/planv_disposable')).toContain('127.0.0.1');
  });

  it('pasa con el esquema corregido y exige security_invoker en todas las vistas', async () => {
    expect(publicViewInvokerAllowlist).toEqual([]);
    expect(await publicViewGrantProblems(db)).toEqual([]);
    const invoker = await db.query<{ name: string; options: string[] | null }>(`
      select c.relname as name, c.reloptions as options
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'v'
      order by 1
    `);
    const byName = new Map(invoker.rows.map((row) => [row.name, row.options ?? []]));
    expect(byName.get('meal_logs_patient_view')).toContain('security_invoker=true');
    expect(byName.get('patients_patient_view')).toContain('security_invoker=true');
    expect(byName.get('patient_access_view')).toContain('security_invoker=true');
    for (const options of byName.values()) {
      expect(options).toContain('security_invoker=true');
    }
  });

  it('rechaza una lista sin explicación', () => {
    expect(problemsForPublicViews([], [{ name: 'patients_patient_view', reason: '   ' }])).toEqual([
      'La lista de public.patients_patient_view no explica por qué puede quedar sin security_invoker.',
      'La lista permite public.patients_patient_view, pero esa vista no existe.',
    ]);
  });

  it('falla si una vista nueva no tiene security_invoker', async () => {
    const rollback = new Error('rollback');
    await expect(db.transaction(async (tx) => {
      await tx.exec(`create view public.definer_probe as select id from public.patients`);
      await tx.exec(`revoke insert, update, delete on public.definer_probe from public, anon, authenticated`);
      expect(await publicViewGrantProblems(tx)).toEqual([
        'public.definer_probe no tiene security_invoker=true.',
      ]);
      throw rollback;
    })).rejects.toBe(rollback);
  });

  it('falla si una vista concede escritura de tabla o de columna', async () => {
    const rollback = new Error('rollback');
    await expect(db.transaction(async (tx) => {
      await tx.exec(`
        create view public.table_write_probe with (security_invoker = true) as
          select id, patient_id from public.meal_logs;
        revoke all on public.table_write_probe from public, anon, authenticated;
        grant delete on public.table_write_probe to anon;
        create view public.column_write_probe with (security_invoker = true) as
          select id, patient_id from public.meal_logs;
        revoke all on public.column_write_probe from public, anon, authenticated;
        grant update (patient_id) on public.column_write_probe to authenticated;
      `);
      expect(await publicViewGrantProblems(tx)).toEqual([
        'public.column_write_probe concede authenticated UPDATE por columna.',
        'public.table_write_probe concede anon DELETE.',
      ]);
      throw rollback;
    })).rejects.toBe(rollback);
  });

  it('la lista no perdona escritura en una vista de identidad', async () => {
    const rollback = new Error('rollback');
    await expect(db.transaction(async (tx) => {
      await tx.exec(`grant insert on public.patients_patient_view to authenticated`);
      expect(await publicViewGrantProblems(tx)).toEqual([
        'public.patients_patient_view concede authenticated INSERT.',
      ]);
      throw rollback;
    })).rejects.toBe(rollback);
  });

  it('mantiene la escritura de las tablas que ya existen y no se la da a una tabla nueva', async () => {
    const before = await db.query<{ allowed: boolean }>(
      `select has_any_column_privilege('authenticated', 'public.meal_logs', 'INSERT') as allowed`,
    );
    expect(before.rows[0].allowed).toBe(true);
    await asPatient(
      `insert into public.meal_logs(patient_id, slot_label, status, note_for_nutri) values ($1, 'Cena', 'pending_review', '')`,
      [patient],
    );
    const rollback = new Error('rollback');
    await expect(db.transaction(async (tx) => {
      await tx.exec(`create table public.future_probe(id int); create view public.future_probe_view as select id from public.future_probe`);
      const created = await tx.query<{
        name: string;
        insert: boolean;
        update: boolean;
        delete: boolean;
        truncate: boolean;
        service: boolean;
      }>(`
        select c.relname as name,
               has_table_privilege('authenticated', c.oid, 'INSERT') as insert,
               has_table_privilege('authenticated', c.oid, 'UPDATE') as update,
               has_table_privilege('authenticated', c.oid, 'DELETE') as delete,
               has_table_privilege('authenticated', c.oid, 'TRUNCATE') as truncate,
               has_table_privilege('service_role', c.oid, 'INSERT') as service
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where c.relname in ('future_probe', 'future_probe_view')
        order by 1
      `);
      expect(created.rows).toEqual([
        { name: 'future_probe', insert: false, update: false, delete: false, truncate: false, service: true },
        { name: 'future_probe_view', insert: false, update: false, delete: false, truncate: false, service: true },
      ]);
      expect(await publicViewGrantProblems(tx)).toEqual([
        'public.future_probe_view no tiene security_invoker=true.',
      ]);
      throw rollback;
    })).rejects.toBe(rollback);
  });
});
