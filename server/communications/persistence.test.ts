import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
const actor='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',patientActor='33333333-3333-4333-8333-333333333333';
const clinic='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',otherClinic='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',patient='cccccccc-cccc-4ccc-8ccc-cccccccccccc',foreign='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
let db:PGlite;
async function asActor(id:string){await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${id}',false);`);}
async function rows(sql:string){return (await db.query<Record<string,unknown>>(sql)).rows;}
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth;
 create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema auth to authenticated; grant execute on function auth.uid() to authenticated;
 create table profiles(id uuid primary key,role text); create table nutritionists(id uuid primary key,user_id uuid references profiles);
 create table patients(id uuid primary key,user_id uuid references profiles,nutritionist_id uuid references nutritionists,archived_at timestamptz,deactivated_at timestamptz,anonymized_at timestamptz);
 insert into profiles values('${actor}','nutri'),('${other}','nutri'),('${patientActor}','paciente');
 insert into nutritionists values('${clinic}','${actor}'),('${otherClinic}','${other}');
 insert into patients(id,user_id,nutritionist_id) values('${patient}','${patientActor}','${clinic}'),('${foreign}',null,'${otherClinic}');`);
 await db.exec(await readFile(new URL('../../supabase/migrations/20261012120000_ops_capabilities.sql',import.meta.url),'utf8'));
},30000);
afterAll(async()=>{await db?.close();});
describe('difusiones persistentes con baja y aislamiento real SQL',()=>{
 it('configuración pertenece a un consultorio y no concede acceso al otro profesional',async()=>{
  await asActor(actor);
  await rows(`insert into public.ops_clinic_settings(nutritionist_id,default_days) values('${clinic}',7)`);
  await asActor(other);expect((await rows('select * from public.ops_clinic_settings')).length).toBe(0);
  await expect(rows(`insert into public.ops_clinic_settings(nutritionist_id,default_days) values('${clinic}',90)`)).rejects.toThrow();
 });
 it('no permite que la profesional otorgue consentimiento por la paciente ni lea otro consultorio',async()=>{
  await asActor(actor);
  await expect(rows(`select public.ops_set_preferences('${patient}','+5491112345678',true,true,'whatsapp.v1')`)).rejects.toThrow();
  await expect(rows(`select public.ops_create_broadcast('99999999-9999-4999-8999-999999999991','aviso','es_AR',array['${foreign}']::uuid[])`)).rejects.toThrow();
 });
 it('la paciente otorga permiso explícito, no puede crear difusiones y no accede a datos clínicos',async()=>{
  await asActor(patientActor);
  await rows(`select public.ops_set_preferences('${patient}','+5491112345678',true,true,'whatsapp.v1')`);
  expect((await rows('select * from public.ops_contact_preferences')).length).toBe(1);
  await expect(rows(`select public.ops_create_broadcast('99999999-9999-4999-8999-999999999992','aviso','es_AR',array['${patient}']::uuid[])`)).rejects.toThrow();
 });
 it('duplica la confirmación de forma idempotente y reserva en exclusión',async()=>{
  await asActor(actor);
  const args=`'99999999-9999-4999-8999-999999999993','aviso','es_AR',array['${patient}']::uuid[]`;
  await rows(`select public.ops_create_broadcast(${args})`);await rows(`select public.ops_create_broadcast(${args})`);
  expect((await rows('select * from public.ops_deliveries')).length).toBe(1);
  const id=(await rows('select id from public.ops_deliveries'))[0].id;
  await db.exec('reset role; set role service_role;');
  const first=(await rows(`select public.ops_claim_delivery('${clinic}','${id}') as claim`))[0].claim as {token:string};
  expect(first.token).toBeTruthy();
  expect((await rows(`select public.ops_claim_delivery('${clinic}','${id}') as claim`))[0].claim).toBeNull();
  expect((await rows(`select public.ops_finish_delivery('${id}','eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee','accepted','wamid.x') as done`))[0].done).toBe(false);
  expect((await rows(`select public.ops_finish_delivery('${id}','${first.token}','accepted','wamid.x') as done`))[0].done).toBe(true);
 });
 it('la baja cancela pendientes y un proceso vencido no se reenvía',async()=>{
  await asActor(actor);
  await rows(`select public.ops_create_broadcast('99999999-9999-4999-8999-999999999994','aviso','es_AR',array['${patient}']::uuid[])`);
  await db.exec('reset role;');
  const id=(await rows("select id from public.ops_deliveries where state='queued'"))[0].id;
  await db.exec('set role service_role;');
  await rows(`select public.ops_claim_delivery('${clinic}','${id}')`);
  await db.exec("reset role; update public.ops_deliveries set lease_until=now()-interval '1 second' where state='sending'; set role service_role;");
  expect((await rows(`select public.ops_claim_delivery('${clinic}','${id}') as claim`))[0].claim).toBeNull();
  await asActor(actor);expect((await rows(`select state from public.ops_deliveries where id='${id}'`))[0].state).toBe('uncertain');
  await rows(`select public.ops_create_broadcast('99999999-9999-4999-8999-999999999995','aviso','es_AR',array['${patient}']::uuid[])`);
  await db.exec('reset role; set role service_role;');
  const queued=(await rows("select id from public.ops_deliveries where state='queued'"))[0].id;
  const reserved=(await rows(`select public.ops_claim_delivery('${clinic}','${queued}') as claim`))[0].claim as {token:string};
  expect((await rows(`select public.ops_check_delivery('${clinic}','${queued}','${reserved.token}') as valid`))[0].valid).toBe(true);
  await asActor(actor);await rows(`select public.ops_create_broadcast('99999999-9999-4999-8999-999999999996','aviso','es_AR',array['${patient}']::uuid[])`);
  await asActor(patientActor);await rows(`select public.ops_set_preferences('${patient}','+5491112345678',false,false,'whatsapp.v1')`);
  await db.exec('reset role; set role service_role;');
  expect((await rows(`select public.ops_check_delivery('${clinic}','${queued}','${reserved.token}') as valid`))[0].valid).toBe(false);
  await asActor(actor);expect((await rows("select count(*)::int as count from public.ops_deliveries where state='queued'"))[0].count).toBe(0);
 });
 it('conserva webhooks que llegan antes de la finalización y nunca degrada leído a enviado',async()=>{
  await db.exec('reset role; set role service_role;');
  await rows("select public.ops_whatsapp_event('wamid.early','read',null)");
  await asActor(patientActor);await rows(`select public.ops_set_preferences('${patient}','+5491112345678',false,true,'whatsapp.v1')`);
  await asActor(actor);await rows(`select public.ops_create_broadcast('99999999-9999-4999-8999-999999999997','aviso','es_AR',array['${patient}']::uuid[])`);
  const id=(await rows("select id from public.ops_deliveries where state='queued'"))[0].id;
  await db.exec('reset role; set role service_role;');
  const claim=(await rows(`select public.ops_claim_delivery('${clinic}','${id}') as claim`))[0].claim as {token:string};
  await rows(`select public.ops_finish_delivery('${id}','${claim.token}','accepted','wamid.early')`);
  await rows("select public.ops_whatsapp_event('wamid.early','sent',null)");
  await rows("select public.ops_whatsapp_event('wamid.early','failed',null)");
  await asActor(actor);expect((await rows(`select delivery_status from public.ops_deliveries where id='${id}'`))[0].delivery_status).toBe('read');
  await db.exec('reset role; set role service_role;');
  await rows("select public.ops_whatsapp_event('wamid.x','sent',null)");
  await rows("select public.ops_whatsapp_event('wamid.x','failed',null)");
  await asActor(actor);expect((await rows("select delivery_status from public.ops_deliveries where provider_id='wamid.x'"))[0].delivery_status).toBe('failed');
 });
});
