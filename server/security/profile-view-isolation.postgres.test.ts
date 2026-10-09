import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';

let db: PGlite;
const users = Array.from({length:5},(_,i)=>`00000000-0000-4000-a000-00000000008${i}`);
const patients = ['10000000-0000-4000-a000-000000000080','10000000-0000-4000-a000-000000000081'];
const views = ['patients_patient_view','patient_access_view'];
async function read(user:string,sql:string,role='authenticated') {
  return db.transaction(async tx=>{
    await tx.exec(`set local role ${role}`);
    await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);
    return (await tx.query(sql)).rows;
  });
}
beforeAll(async()=>{
  db=new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    grant usage on schema public,auth,storage to anon,authenticated,service_role;
    alter default privileges in schema public grant all on functions to anon,authenticated,service_role;
    alter default privileges in schema public grant all on tables to anon,authenticated,service_role;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
  `);
  const dir=new URL('../../supabase/migrations/',import.meta.url);
  for(const file of (await readdir(dir)).filter(x=>x.endsWith('.sql')).sort()) await db.exec(await readFile(new URL(file,dir),'utf8'));
  for(const [i,id] of users.entries()) await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[id,`isolation${i}@example.test`]);
  for(let i=0;i<2;i++) {
    const nid=(await db.query<{id:string}>("select public.provision_nutritionist($1,'Consultorio ficticio') id",[users[i]])).rows[0].id;
    await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status,adherence_why) values($1,$2,$3,'Paciente ficticia','waived','NOTA PRIVADA')",[patients[i],nid,users[i+2]]);
  }
  await db.query('insert into public.platform_admins(user_id) values($1)',[users[4]]);
},60000);
afterAll(async()=>{await db?.close();});
describe('perfil y acceso aislados entre consultorios',()=>{
  it('dispone de un índice por consultorio para pacientes activos',async()=>{
    expect((await db.query("select indexname from pg_indexes where schemaname='public' and tablename='patients' and indexname='patients_active_nutritionist_access_idx'")).rows).toEqual([{indexname:'patients_active_nutritionist_access_idx'}]);
  });
  it('elimina ambas vistas definer sin reabrir lectura de patients',async()=>{
    expect((await db.query("select relname from pg_class where oid in ('public.patients_patient_view'::regclass,'public.patient_access_view'::regclass) and not coalesce(reloptions @> array['security_invoker=true'],false)")).rows).toEqual([]);
    for(const user of users.slice(2)) expect(await read(user,'select adherence_why from public.patients')).toEqual([]);
  });
  it('cada paciente lee su perfil y acceso; los filtros externos no revelan otra paciente',async()=>{
    for(let i=0;i<2;i++) for(const view of views) {
      expect(await read(users[i+2],`select id from public.${view}`)).toEqual([{id:patients[i]}]);
      expect(await read(users[i+2],`select id from public.${view} where id='${patients[1-i]}'`)).toEqual([]);
    }
  });
  it('cada nutricionista lee solo el acceso de sus pacientes; administrar el servicio no concede acceso clínico',async()=>{
    for(let i=0;i<2;i++) {
      expect(await read(users[i],'select id from public.patient_access_view')).toEqual([{id:patients[i]}]);
      expect(await read(users[i],'select id from public.patients_patient_view')).toEqual([]);
    }
    for(const view of views) expect(await read(users[4],`select id from public.${view}`)).toEqual([]);
  });
  it('no permite acceso anónimo ni escrituras por tabla o columna',async()=>{
    for(const view of views) {
      await expect(read('',`select id from public.${view}`,'anon')).rejects.toMatchObject({code:'42501'});
      for(const user of users) {
        for(const sql of [`update public.${view} set billing_status='pending'`, `delete from public.${view}`, `insert into public.${view}(id) values(gen_random_uuid())`])
          await expect(read(user,sql)).rejects.toMatchObject({code:'55000'});
      }
      expect((await db.query(`select has_table_privilege('authenticated','public.${view}','INSERT,UPDATE,DELETE') allowed`)).rows).toEqual([{allowed:false}]);
      expect((await db.query(`select has_any_column_privilege('authenticated','public.${view}','INSERT,UPDATE') allowed`)).rows).toEqual([{allowed:false}]);
    }
  });
  it('las proyecciones privadas también validan al caller y no se conceden a anon/PUBLIC',async()=>{
    for(const fn of ['patient_profile_projection','patient_access_projection']) {
      expect(await read('',`select id from private.${fn}()`)).toEqual([]);
      expect(await read(users[4],`select id from private.${fn}()`)).toEqual([]);
      await expect(read('',`select id from private.${fn}()`,'anon')).rejects.toMatchObject({code:'42501'});
    }
  });
  it('retira acceso al desactivar o anonimizar y no conserva asignaciones cacheadas',async()=>{
    for(const column of ['deactivated_at','anonymized_at']) {
      await db.query(`update public.patients set ${column}=now() where id=$1`,[patients[0]]);
      try { for(const user of [users[0],users[2]]) expect(await read(user,'select id from public.patient_access_view')).toEqual([]); }
      finally {await db.query(`update public.patients set ${column}=null where id=$1`,[patients[0]]);}
    }
  });
  it('puede reaplicarse limpiando ACL heredadas sin modificar datos ni notas',async()=>{
    const before=(await db.query('select id,user_id,nutritionist_id,billing_status,adherence_why from public.patients order by id')).rows;
    await db.exec('grant update(billing_status) on public.patient_access_view to public; grant all on function private.patient_access_projection() to anon');
    await db.exec(await readFile(new URL('../../supabase/migrations/20261009154511_invoker_patient_profile_projections.sql',import.meta.url),'utf8'));
    expect((await db.query("select has_any_column_privilege('authenticated','public.patient_access_view','INSERT,UPDATE') allowed")).rows).toEqual([{allowed:false}]);
    await expect(read('', 'select id from private.patient_access_projection()', 'anon')).rejects.toMatchObject({code:'42501'});
    expect(await read(users[2],'select id from public.patients_patient_view')).toEqual([{id:patients[0]}]);
    expect((await db.query('select id,user_id,nutritionist_id,billing_status,adherence_why from public.patients order by id')).rows).toEqual(before);
  });
});
