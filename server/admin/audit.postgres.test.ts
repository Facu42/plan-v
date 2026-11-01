import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';

let db: PGlite;
const admin = '00000000-0000-4000-a000-000000000001';
const other = '00000000-0000-4000-a000-000000000002';
const request = '00000000-0000-4000-a000-000000000003';
async function asActor(actor: string, aal: string, sql: string) {
  return db.transaction(async tx => {
    await tx.exec('set local role authenticated');
    await tx.query("select set_config('request.jwt.claim.sub',$1,true),set_config('request.jwt.claims',$2,true)", [actor, JSON.stringify({ aal })]);
    return tx.query(sql);
  });
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    grant usage on schema auth,public to anon,authenticated,service_role;
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function public.is_platform_admin() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;
    alter default privileges in schema public grant execute on functions to anon,authenticated;
  `);
  await db.exec(await readFile(new URL('../../supabase/migrations/20261031110000_admin_audit.sql', import.meta.url), 'utf8'));
}, 30000);
afterAll(async () => { await db?.close(); });

describe('registro privado del administrador', () => {
  it('anon no puede ejecutar el registro ni ningún cliente leer o alterar la evidencia', async () => {
    const { rows } = await db.query<{ role: string; execute: boolean; read: boolean; write: boolean }>(`
      select r as role,
        has_function_privilege(r,'public.admin_record_audit(uuid,text,text,uuid)','execute') as execute,
        has_table_privilege(r,'private.admin_audit_log','select') as read,
        has_table_privilege(r,'private.admin_audit_log','insert,update,delete') as write
      from unnest(array['anon','authenticated','service_role']) r order by r
    `);
    expect(rows).toEqual([
      { role: 'anon', execute: false, read: false, write: false },
      { role: 'authenticated', execute: true, read: false, write: false },
      { role: 'service_role', execute: false, read: false, write: false },
    ]);
  });

  it('exige administrador y segundo factor aunque el interruptor global esté apagado', async () => {
    for (const [actor, aal] of [[other, 'aal2'], [admin, 'aal1']]) {
      await expect(asActor(actor, aal, `select public.admin_record_audit('${request}','nutritionist.create','started')`)).rejects.toMatchObject({ code: '42501' });
    }
    expect((await db.query('select * from private.admin_audit_log')).rows).toHaveLength(0);
  });

  it('conserva actor, acción, destino y resultado sin columnas libres ni datos clínicos', async () => {
    await asActor(admin, 'aal2', `select public.admin_record_audit('${request}','nutritionist.override','started','${other}')`);
    await asActor(admin, 'aal2', `select public.admin_record_audit('${request}','nutritionist.override','succeeded','${other}')`);
    const { rows } = await db.query('select actor_id,action,target_id,outcome from private.admin_audit_log order by id');
    expect(rows).toEqual(['started','succeeded'].map(outcome => ({ actor_id: admin, action: 'nutritionist.override', target_id: other, outcome })));
    const columns = (await db.query<{ column_name: string }>("select column_name from information_schema.columns where table_schema='private' and table_name='admin_audit_log' order by ordinal_position")).rows.map(row => row.column_name);
    expect(columns).toEqual(['id','request_id','actor_id','action','target_id','outcome','occurred_at']);
  });

  it('no inventa resultados sin inicio ni cambia el resultado de una acción cerrada', async () => {
    await expect(asActor(admin, 'aal2', `select public.admin_record_audit('${other}','nutritionist.create','succeeded')`)).rejects.toMatchObject({ code: '22023' });
    await expect(asActor(admin, 'aal2', `select public.admin_record_audit('${request}','nutritionist.override','failed','${other}')`)).rejects.toMatchObject({ code: '22023' });
  });
});
