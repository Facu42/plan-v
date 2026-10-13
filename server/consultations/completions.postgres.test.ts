import { beforeAll,afterAll,describe,it,expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
const pro='00000000-0000-4000-a000-000000000001',otherPro='00000000-0000-4000-a000-000000000002',patientUser='00000000-0000-4000-a000-000000000003',admin='00000000-0000-4000-a000-000000000004',reception='00000000-0000-4000-a000-000000000005';
const patient='10000000-0000-4000-a000-000000000001',other='10000000-0000-4000-a000-000000000002',appointment='20000000-0000-4000-a000-000000000001',future='20000000-0000-4000-a000-000000000002',cancelled='20000000-0000-4000-a000-000000000003',crossed='20000000-0000-4000-a000-000000000004';
let db:PGlite;
async function actor(user:string,sql:string,args:unknown[]=[]){return db.transaction(async tx=>{await tx.exec('set local role authenticated');await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);return(await tx.query(sql,args)).rows;});}
const list=async(user=pro,offset=0,limit=50)=>(await actor(user,'select public.consultation_completion_list($1,$2,$3) result',[patient,offset,limit]))[0] as {result:{total_completed:number;appointments:Array<{appointment_id:string;revision:number;completed:boolean}>;has_more:boolean}};
const command=(id:string,revision:number,completed:boolean,user=pro,target=patient)=>actor(user,'select public.consultation_completion_command($1,$2) result',[target,{appointment_id:id,expected_revision:revision,completed,confirmed:true}]);
beforeAll(async()=>{
 db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;grant usage on schema public,auth to authenticated,service_role;
 create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create table public.nutritionists(id uuid primary key,user_id uuid);create table public.patients(id uuid primary key,nutritionist_id uuid,user_id uuid,deactivated_at timestamptz,anonymized_at timestamptz,consented boolean default true);
 create table public.appointments(id uuid primary key,patient_id uuid,nutritionist_id uuid,starts_at timestamptz,duration_min int default 45,channel text default 'video',status text default 'scheduled');
 create function public.my_nutritionist_id()returns uuid language sql stable security definer set search_path='' as $$select id from public.nutritionists where user_id=auth.uid()$$;
 create function public.is_assigned_patient(target uuid)returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.patients where id=target and nutritionist_id=public.my_nutritionist_id())$$;
 -- Simulate delegated/observer access for otherPro: completion still requires ownership.
 create function public.can_care_for_patient(target uuid)returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.patients p join public.nutritionists n on n.id=p.nutritionist_id where p.id=target and n.user_id=auth.uid())or auth.uid()='${otherPro}'::uuid$$;
 create function public.consultation_can_read(target uuid)returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.patients where id=target and deactivated_at is null and anonymized_at is null)$$;
 create function public.consultation_consent_active(target uuid,purpose_value text)returns boolean language sql stable security definer set search_path='' as $$select coalesce((select consented from public.patients where id=target),false)and purpose_value='care_relationship'$$;
 insert into public.nutritionists values('${pro}','${pro}'),('${otherPro}','${otherPro}');insert into public.patients(id,nutritionist_id,user_id)values('${patient}','${pro}','${patientUser}'),('${other}','${otherPro}',null);
 insert into public.appointments(id,patient_id,nutritionist_id,starts_at,status)values('${appointment}','${patient}','${pro}',now()-interval'1day','scheduled'),('${future}','${patient}','${pro}',now()+interval'1day','scheduled'),('${cancelled}','${patient}','${pro}',now()-interval'1day','cancelled'),('${crossed}','${other}','${otherPro}',now()-interval'1day','scheduled');`);
 // Baseline installs the existing module before the new delivery exists (RED).
 try{await db.exec(await readFile(new URL('../../supabase/migrations/20261013100000_consultation_completions.sql',import.meta.url),'utf8'));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
},60000);
afterAll(async()=>{await db?.close();});
describe('consulta realizada explícita y separada de asistencia/grabación',()=>{
 it('un turno pasado o confirmado no cuenta antes de la acción explícita',async()=>{expect((await list()).result.total_completed).toBe(0);expect((await list()).result.appointments.find(a=>a.appointment_id===appointment)).toMatchObject({revision:0,completed:false});});
 it('marca sólo el turno propio pasado, con CAS y sin alterar agenda',async()=>{
  for(const id of [future,cancelled,crossed])await expect(command(id,0,true)).rejects.toThrow();
  for(const user of [otherPro,patientUser,admin,reception]){await expect(list(user)).rejects.toThrow();await expect(command(appointment,0,true,user)).rejects.toThrow();expect(await actor(user,'select * from public.consultation_completions')).toHaveLength(0);}
  await expect(actor(pro,'select public.consultation_completion_command($1,$2)',[patient,{appointment_id:appointment,expected_revision:0,completed:true,confirmed:false}])).rejects.toThrow();
  await command(appointment,0,true);expect((await list()).result.total_completed).toBe(1);expect((await list()).result.appointments.find(a=>a.appointment_id===appointment)).toMatchObject({revision:1,completed:true});
  await expect(command(appointment,0,true)).rejects.toThrow();await expect(actor(pro,'update public.consultation_completions set completed=false')).rejects.toThrow();
  expect((await db.query<{status:string}>('select status from public.appointments where id=$1',[appointment])).rows[0].status).toBe('scheduled');
 });
 it('revierte un error con confirmación, nueva revisión y auditoría inmutable',async()=>{
  await command(appointment,1,false);expect((await list()).result.total_completed).toBe(0);await expect(command(appointment,1,true)).rejects.toThrow();
  const events=await actor(pro,'select revision,completed,actor_id from public.consultation_completion_events order by revision');expect(events).toEqual([{revision:1,completed:true,actor_id:pro},{revision:2,completed:false,actor_id:pro}]);
  await expect(actor(pro,'delete from public.consultation_completion_events')).rejects.toThrow();
  await db.query('update public.patients set consented=false where id=$1',[patient]);await expect(command(appointment,2,true)).rejects.toThrow();await expect(list()).rejects.toThrow();await db.query('update public.patients set consented=true where id=$1',[patient]);
 });
 it('el contador incluye toda la cartera de turnos y no sólo la página',async()=>{
  await command(appointment,2,true);const page=(await list(pro,0,1)).result;expect(page.total_completed).toBe(1);expect(page.appointments).toHaveLength(1);expect(page.appointments[0].completed).toBe(false);expect(page.has_more).toBe(true);
  await db.query('update public.patients set deactivated_at=now()where id=$1',[patient]);await expect(command(appointment,3,false)).rejects.toThrow();expect(await actor(pro,'select * from public.consultation_completions')).toHaveLength(0);
 });
 it('el antiguo titular no conserva lectura directa por el identificador del marcador tras reasignar la paciente',async()=>{
  await db.query('update public.patients set deactivated_at=null,nutritionist_id=$2 where id=$1',[patient,otherPro]);
  expect(await actor(pro,'select * from public.consultation_completions')).toHaveLength(0);expect(await actor(pro,'select * from public.consultation_completion_events')).toHaveLength(0);
 });
});
