import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

let db: PGlite;
const a = '00000000-0000-4000-a000-0000000000a2';
const b = '00000000-0000-4000-a000-0000000000b2';
const owner = '00000000-0000-4000-a000-0000000000a1';
const pa = '10000000-0000-4000-a000-0000000000a1';
const pb = '10000000-0000-4000-a000-0000000000b1';
const ma = '20000000-0000-4000-a000-0000000000a1';
const mb = '20000000-0000-4000-a000-0000000000b1';
const mc = '20000000-0000-4000-a000-0000000000c1';
const migration = new URL('../../supabase/migrations/20261009141501_readonly_patient_meal_views.sql', import.meta.url);
async function asUser(user: string, sql: string, params: unknown[] = [], role = 'authenticated') {
  return db.transaction(async tx => {
    await tx.exec(`set local role ${role}`);
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)", [user]);
    return (await tx.query(sql,params)).rows;
  });
}

beforeAll(async () => {
  db = new PGlite();
  await db.exec(await readFile(new URL('../../supabase/disposable/bootstrap.sql',import.meta.url),'utf8'));
  // Reproduce Supabase's inherited ACL, absent in older local fixtures.
  await db.exec('alter default privileges in schema public grant all on tables to anon,authenticated,service_role; alter default privileges in schema public grant all on functions to anon,authenticated,service_role;');
  const dir = new URL('../../supabase/migrations/',import.meta.url);
  for (const f of (await readdir(dir)).filter(f=>f.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(f,dir),'utf8'));
  for (const [id,email] of [[owner,'nutri@example.test'],[a,'a@example.test'],[b,'b@example.test']]) await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[id,email]);
  const nid = (await db.query<{id:string}>("select public.provision_nutritionist($1,'Ficticia') as id",[owner])).rows[0].id;
  await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values($1,$2,$3,'A ficticia','waived'),($4,$2,$5,'B ficticia','waived')",[pa,nid,a,pb,b]);
  await db.query("insert into public.meal_logs(id,patient_id,slot_label,description,note_for_nutri) values($1,$2,'Almuerzo','Comida A','Nota privada A'),($3,$4,'Cena','Comida B','Nota privada B')",[ma,pa,mb,pb]);
},60000);
afterAll(async()=>{await db?.close();});

describe('vistas públicas de comidas: aislamiento y sólo lectura',()=>{
  it('reproduce el INSERT cruzado y la reasignación en una transacción de prueba que revierte',async()=>{
    const rollback = new Error('rollback ficticio');
    await expect(db.transaction(async tx=>{
      await tx.exec('alter view public.meal_logs_patient_view set(security_invoker=false); grant all on public.meal_logs_patient_view to authenticated;');
      await tx.exec('set local role authenticated');
      await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[a]);
      await tx.query("insert into public.meal_logs_patient_view(id,patient_id,slot_label,description) values($1,$2,'Cena','Registro cruzado')",[mc,pb]);
      await tx.query('update public.meal_logs_patient_view set patient_id=$1 where id=$2',[pb,ma]);
      await tx.exec('reset role');
      expect((await tx.query('select patient_id from public.meal_logs where id in ($1,$2) order by id',[ma,mc])).rows).toEqual([{patient_id:pb},{patient_id:pb}]);
      throw rollback;
    })).rejects.toBe(rollback);
  });
  it('niega INSERT, UPDATE y DELETE de A hacia B y conserva los datos',async()=>{
    const before=(await db.query('select id,patient_id,description from public.meal_logs order by id')).rows;
    for(const role of ['authenticated','anon']) {
      for(const [sql,args] of [
        ["insert into public.meal_logs_patient_view(id,patient_id,slot_label) values($1,$2,'Cena')",[mc,pb]],
        ['update public.meal_logs_patient_view set patient_id=$1 where id=$2',[pb,ma]],
        ['delete from public.meal_logs_patient_view where id=$1',[mb]],
      ] as const) await expect(asUser(a,sql,[...args],role)).rejects.toMatchObject({code:'42501'});
    }
    expect(await asUser(a,'select id from public.meal_logs_patient_view where patient_id=$1',[pb])).toEqual([]);
    expect(await asUser(a,'select id from public.meal_logs where patient_id=$1',[pb])).toEqual([]);
    expect((await db.query('select id,patient_id,description from public.meal_logs order by id')).rows).toEqual(before);
  });
  it('conserva lectura propia sin notas privadas y rechaza identidades ajenas o sin acceso',async()=>{
    const rows=await asUser(a,'select * from public.get_patient_meal_logs($1)',[pa]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({id:ma,patient_id:pa,description:'Comida A'});
    expect(rows[0]).not.toHaveProperty('note_for_nutri');
    expect(rows[0]).not.toHaveProperty('client_id');
    await expect(asUser(a,'select * from public.get_patient_meal_logs($1)',[pb])).rejects.toMatchObject({code:'42501'});
    await expect(asUser('', 'select * from public.get_patient_meal_logs($1)',[pa])).rejects.toMatchObject({code:'42501'});
    await expect(asUser(a,'select * from public.get_patient_meal_logs($1)',[pa],'anon')).rejects.toMatchObject({code:'42501'});
    await db.query("update public.patients set billing_status='pending' where id=$1",[pa]);
    expect(await asUser(a,'select * from public.get_patient_meal_logs($1)',[pa])).toEqual([]);
    await db.query("update public.patients set billing_status='waived' where id=$1",[pa]);
    await db.query('update public.patients set deactivated_at=now() where id=$1',[pa]);
    await expect(asUser(a,'select * from public.get_patient_meal_logs($1)',[pa])).rejects.toMatchObject({code:'42501'});
    await db.query('update public.patients set deactivated_at=null where id=$1',[pa]);
    expect(await asUser(owner,'select note_for_nutri from public.meal_logs where id=$1',[ma])).toEqual([{note_for_nutri:'Nota privada A'}]);
  });
  it('cierra también concesiones por columna y PUBLIC de otras vistas vulnerables, de forma idempotente',async()=>{
    await db.exec('create view public.extra_meal_test as select id,patient_id,description from public.meal_logs; revoke all on public.extra_meal_test from anon,authenticated; grant select on public.extra_meal_test to authenticated; grant update(patient_id) on public.extra_meal_test to public;');
    await db.exec(await readFile(migration,'utf8'));
    await db.exec(await readFile(migration,'utf8'));
    expect((await db.query("select reloptions from pg_class where oid='public.extra_meal_test'::regclass")).rows[0]).toMatchObject({reloptions:['security_invoker=true']});
    await expect(asUser(a,'update public.extra_meal_test set patient_id=$1 where id=$2',[pb,ma])).rejects.toMatchObject({code:'42501'});
    expect((await db.query("select has_table_privilege('authenticated','public.meal_logs_patient_view','SELECT') as can_read,has_any_column_privilege('authenticated','public.meal_logs_patient_view','UPDATE') as can_write")).rows).toEqual([{can_read:true,can_write:false}]);
  });
});
