import {beforeAll,afterAll,describe,expect,it} from 'vitest';
import {PGlite} from '@electric-sql/pglite';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {schedulingDefaultSettings} from '../../src/types/scheduling.js';
let db:PGlite,nutriA:string,nutriB:string,bookingA:string;const a=randomUUID(),b=randomUUID(),patientUser=randomUUID(),admin=randomUUID(),existingPatient=randomUUID();
const day=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires'}).format(new Date(Date.now()+8*86400000)),starts=`${day}T12:00:00Z`,calendar=randomUUID(),type=randomUUID(),client=randomUUID(),intent=randomUUID(),hash='a'.repeat(64);
const settings={...schedulingDefaultSettings(),calendars:[{id:calendar,name:'Consultorio'}],types:[{id:type,name:'Consulta',calendar_id:calendar,duration_min:45,channel:'video' as const,price_minor:1000000,deposit_minor:300000}],weekly:[{calendar_id:calendar,weekday:new Date(`${day}T12:00:00Z`).getUTCDay(),start:'09:00',end:'12:00'}],page:{...schedulingDefaultSettings().page,slug:'consultorio-a',enabled:true}};
async function actor<T=Record<string,unknown>>(user:string,sql:string,params:unknown[]=[]){return db.transaction(async tx=>{await tx.exec('set local role authenticated');await tx.query("select set_config('request.jwt.claim.sub',$1,true)",[user]);return (await tx.query<T>(sql,params)).rows;});}
async function service<T=Record<string,unknown>>(sql:string,params:unknown[]=[]){return db.transaction(async tx=>{await tx.exec('set local role service_role');return (await tx.query<T>(sql,params)).rows;});}
beforeAll(async()=>{db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;grant usage on schema public,auth,storage to authenticated,anon,service_role;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;
create function storage.foldername(text) returns text[] language sql immutable as $$select string_to_array($1,'/')$$;grant select,insert,delete on storage.objects to authenticated;`);
const dir=new URL('../../supabase/migrations/',import.meta.url);for(const file of(await readdir(dir)).filter(n=>n.endsWith('.sql')).sort())await db.exec(await readFile(new URL(file,dir),'utf8'));
for(const [id,email]of[[a,'a@example.test'],[b,'b@example.test'],[patientUser,'patient@example.test'],[admin,'admin@example.test']])await db.query('insert into auth.users(id,email,email_confirmed_at) values($1,$2,now())',[id,email]);
nutriA=(await db.query<{id:string}>("select public.provision_nutritionist($1,'Nutri A') id",[a])).rows[0].id;nutriB=(await db.query<{id:string}>("select public.provision_nutritionist($1,'Nutri B') id",[b])).rows[0].id;
await db.query("insert into public.patients(id,nutritionist_id,user_id,full_name,billing_status) values($1,$2,$3,'Paciente','waived')",[existingPatient,nutriB,patientUser]);
},120000);
afterAll(async()=>{await db?.close();});
describe('agenda completa PostgreSQL: aislamiento, reservas, cobros y jobs',()=>{
 it('aísla dos consultorios, bloquea credenciales y escritura directa',async()=>{await actor(a,'select public.scheduling_save_config($1,0,$2)',[nutriA,settings]);await actor(b,'select public.scheduling_save_config($1,0,$2)',[nutriB,{...settings,page:{...settings.page,slug:'consultorio-b'}}]);await expect(actor(b,'select public.scheduling_save_config($1,1,$2)',[nutriA,settings])).rejects.toThrow();for(const user of[patientUser,admin])expect(await actor(user,'select * from public.scheduling_profiles')).toHaveLength(0);expect(await actor(a,'select * from public.scheduling_profiles')).toHaveLength(1);await expect(actor(a,'select * from public.scheduling_integrations')).rejects.toThrow();await expect(actor(a,"update public.scheduling_profiles set revision=9")).rejects.toThrow();});
 it('reserva de forma idempotente y rechaza solapamiento, horario fuera de disponibilidad y reenvío distinto',async()=>{const input={client_id:client,type_id:type,starts_at:starts,name:'Contacto nuevo',email:'nuevo@example.test',phone:'1123456789',accepted_contact:true};const created=await service<{r:{id:string}}>('select public.scheduling_request_booking($1,$2,$3) r',[nutriA,input,hash]);bookingA=created[0].r.id;const replay=await service<{r:{id:string}}>('select public.scheduling_request_booking($1,$2,$3) r',[nutriA,input,hash]);expect(replay[0].r.id).toBe(bookingA);await expect(service('select public.scheduling_request_booking($1,$2,$3)',[nutriA,{...input,client_id:randomUUID()},hash])).rejects.toThrow();await expect(service('select public.scheduling_request_booking($1,$2,$3)',[nutriA,{...input,starts_at:`${day}T16:00:00Z`},hash])).rejects.toThrow();expect(await actor(b,'select id from public.scheduling_bookings')).toHaveLength(0);await expect(actor(patientUser,'select public.scheduling_request_booking($1,$2,$3)',[nutriA,input,hash])).rejects.toThrow();});
 it('confirmación explícita crea ficha y turno, nunca cuenta ni correo, y rechaza ficha ajena',async()=>{const users=(await db.query<{n:number}>('select count(*)::int n from auth.users')).rows[0].n;await expect(actor(a,'select public.scheduling_change_booking($1,$2,$3)',[nutriA,bookingA,{action:'confirm',expected_revision:1,patient_id:existingPatient}])).rejects.toThrow();await actor(a,'select public.scheduling_change_booking($1,$2,$3)',[nutriA,bookingA,{action:'confirm',expected_revision:1}]);expect((await db.query<{n:number}>('select count(*)::int n from auth.users')).rows[0].n).toBe(users);const row=(await db.query<{patient_id:string;appointment_id:string;revision:number}>('select patient_id,appointment_id,revision from public.scheduling_bookings where id=$1',[bookingA])).rows[0];expect(row.revision).toBe(2);expect((await db.query<{status:string}>('select status from public.patient_invites where patient_id=$1',[row.patient_id])).rows[0].status).toBe('not_sent');expect((await db.query('select * from public.appointments where id=$1',[row.appointment_id])).rows).toHaveLength(1);await expect(actor(b,'select public.scheduling_change_booking($1,$2,$3)',[nutriA,bookingA,{action:'cancel',expected_revision:2}])).rejects.toThrow();});
 it('webhook financiero valida cuenta/moneda/importe y no duplica pago; registra reintegro parcial y contracargo',async()=>{await db.query('insert into public.scheduling_checkout_intents(id,booking_id,nutritionist_id,mode,amount_minor,account_id) values($1,$2,$3,$4,$5,$6)',[intent,bookingA,nutriA,'deposit',300000,'123']);for(const patch of[[300000,'USD','123'],[300001,'ARS','123'],[300000,'ARS','456']])await expect(service('select public.scheduling_apply_payment($1,$2,$3,$4,$5,$6)',[intent,'9','approved',...patch])).rejects.toThrow();await service('select public.scheduling_apply_payment($1,$2,$3,$4,$5,$6)',[intent,'9','approved',300000,'ARS','123']);const duplicate=await service<{r:{duplicate:boolean}}>('select public.scheduling_apply_payment($1,$2,$3,$4,$5,$6) r',[intent,'9','approved',300000,'ARS','123']);expect(duplicate[0].r.duplicate).toBe(true);expect((await db.query<{paid_minor:number}>('select paid_minor from public.scheduling_bookings where id=$1',[bookingA])).rows[0].paid_minor).toBe(300000);await service('select public.scheduling_apply_payment($1,$2,$3,$4,$5,$6,$7)',[intent,'9','approved',300000,'ARS','123',100000]);expect(Number((await db.query<{paid_minor:string}>('select paid_minor from public.scheduling_bookings where id=$1',[bookingA])).rows[0].paid_minor)).toBe(200000);await service('select public.scheduling_apply_payment($1,$2,$3,$4,$5,$6)',[intent,'9','approved',300000,'ARS','123']);expect(Number((await db.query<{paid_minor:string}>('select paid_minor from public.scheduling_bookings where id=$1',[bookingA])).rows[0].paid_minor)).toBe(200000);await service('select public.scheduling_apply_payment($1,$2,$3,$4,$5,$6,$7)',[intent,'9','charged_back',300000,'ARS','123',100000]);expect(Number((await db.query<{paid_minor:string}>('select paid_minor from public.scheduling_bookings where id=$1',[bookingA])).rows[0].paid_minor)).toBe(0);await expect(actor(a,'select public.scheduling_apply_payment($1,$2,$3,$4,$5,$6)',[intent,'9','approved',300000,'ARS','123'])).rejects.toThrow();});
 it('la transferencia sólo se acredita por revisión profesional y no se confirma dos veces',async()=>{const report=randomUUID();await db.query('insert into public.scheduling_transfer_reports(id,booking_id,amount_minor,reference) values($1,$2,300000,$3)',[report,bookingA,'Comprobante']);expect(await actor(b,'select * from public.scheduling_transfer_reports')).toHaveLength(0);await expect(actor(b,'select public.scheduling_review_transfer($1,$2,$3)',[nutriB,report,'confirm'])).rejects.toThrow();await actor(a,'select public.scheduling_review_transfer($1,$2,$3)',[nutriA,report,'confirm']);await expect(actor(a,'select public.scheduling_review_transfer($1,$2,$3)',[nutriA,report,'confirm'])).rejects.toThrow();expect(Number((await db.query<{paid_minor:string}>('select paid_minor from public.scheduling_bookings where id=$1',[bookingA])).rows[0].paid_minor)).toBe(300000);});
 it('reprograma con revisión y token, y el trabajador viejo no puede terminar una reserva cambiada',async()=>{await expect(service('select public.scheduling_change_booking($1,$2,$3,$4)',[nutriA,bookingA,{action:'reschedule',expected_revision:2,starts_at:`${day}T13:30:00Z`},'b'.repeat(64)])).rejects.toThrow();await service('select public.scheduling_change_booking($1,$2,$3,$4)',[nutriA,bookingA,{action:'reschedule',expected_revision:2,starts_at:`${day}T13:30:00Z`},hash]);await db.query('insert into public.scheduling_sync_jobs(booking_id,revision) values($1,3)',[bookingA]);const claim=(await service<{r:{id:string;run_token:string}}>('select public.scheduling_claim_sync_job() r'))[0].r;await actor(a,'select public.scheduling_change_booking($1,$2,$3)',[nutriA,bookingA,{action:'cancel',expected_revision:3}]);expect((await service<{ok:boolean}>('select public.scheduling_complete_sync_job($1,$2,$3) ok',[claim.id,claim.run_token,'https://meet.google.com/abc-defg-hij']))[0].ok).toBe(false);await expect(actor(patientUser,'select public.scheduling_claim_sync_job()')).rejects.toThrow();});
});
describe('equipo operativo sin clínica',()=>{
 it('invita recepción por token, exige correo autenticado, revoca y limita contacto/turnos/cobros',async()=>{
  const nid=nutriA, staff=admin, inviteHash='c'.repeat(64);
  await actor(a,'select public.scheduling_invite_staff($1,$2,$3)',[nid,'admin@example.test',inviteHash]);
  await expect(actor(patientUser,'select public.scheduling_accept_staff($1)',[inviteHash])).rejects.toThrow();
  await actor(staff,'select public.scheduling_accept_staff($1)',[inviteHash]);
  await expect(actor(staff,'select public.scheduling_accept_staff($1)',[inviteHash])).rejects.toThrow();
  const rows=await actor<{r:{contacts:Array<Record<string,unknown>>}}>(staff,'select public.scheduling_operational_snapshot($1,0) r',[nid]);
  expect(rows[0].r.contacts.length).toBeGreaterThan(0);
  expect(Object.keys(rows[0].r.contacts[0]).sort()).toEqual(['email','id','name','phone','revision']);
  expect(await actor(staff,'select * from public.clinical_notes')).toHaveLength(0);
  await expect(actor(staff,'select public.scheduling_save_config($1,1,$2)',[nid,settings])).rejects.toThrow();
  await expect(actor(staff,'select public.scheduling_operational_snapshot($1,0)',[nutriB])).rejects.toThrow();
  const pid=String(rows[0].r.contacts[0].id);
  await actor(staff,'select public.scheduling_save_contact($1,$2,$3)',[nid,pid,{name:'Contacto actualizado',email:'contact@example.test',phone:'1144445555',expected_revision:0}]);
  const contact=(await actor<{r:{contacts:Array<{name:string;revision:number}>}}>(staff,'select public.scheduling_operational_snapshot($1,0) r',[nid]))[0].r.contacts[0];
  expect(contact.name).toBe('Contacto actualizado');expect(contact.revision).toBe(1);
  await expect(actor(staff,'select public.scheduling_save_contact($1,$2,$3)',[nid,pid,{name:'Otro',email:'contact@example.test',phone:'1144445555',expected_revision:0}])).rejects.toThrow();
  await actor(a,'select public.scheduling_revoke_staff($1,$2)',[nid,staff]);
  await expect(actor(staff,'select public.scheduling_operational_snapshot($1,0)',[nid])).rejects.toThrow();
 });
});
describe('asignación clínica explícita',()=>{
 it('un colega sólo lee después de asignación, recepción no hereda y la revocación es inmediata',async()=>{
  const org=(await actor<{r:{id:string}}>(a,'select public.create_organization($1,$2) r',['Equipo de prueba','equipo-prueba']))[0].r.id;
  await actor(a,'select public.invite_org_member($1,$2,$3)',[org,nutriB,'member']);
  await actor(b,'select public.accept_org_invite($1)',[org]);
  const pid=(await db.query<{patient_id:string}>('select patient_id from public.scheduling_bookings where id=$1',[bookingA])).rows[0].patient_id;
  await actor(a,'select public.add_patient_clinical_note($1,$2)',[pid,'Nota clínica de prueba']);
  await expect(actor(b,'select public.scheduling_shared_clinical_snapshot($1)',[pid])).rejects.toThrow();
  const links=(await actor<{r:Array<{id:string}>}>(a,'select public.delegate_patient_care($1,$2,$3,$4) r',[pid,nutriB,'observer',org]))[0].r;
  const view=(await actor<{r:{notes:Array<{body:string}>}}>(b,'select public.scheduling_shared_clinical_snapshot($1) r',[pid]))[0].r;
  expect(view.notes[0].body).toBe('Nota clínica de prueba');
  await expect(actor(admin,'select public.scheduling_shared_clinical_snapshot($1)',[pid])).rejects.toThrow();
  await expect(actor(b,'select public.scheduling_add_shared_note($1,$2)',[pid,'Observer no escribe'])).rejects.toThrow();
  await actor(a,'select public.revoke_patient_care($1)',[links[0].id]);
  await expect(actor(b,'select public.scheduling_shared_clinical_snapshot($1)',[pid])).rejects.toThrow();
  await actor(a,'select public.delegate_patient_care($1,$2,$3,$4)',[pid,nutriB,'delegate',org]);
  const note=(await actor<{r:{body:string}}>(b,'select public.scheduling_add_shared_note($1,$2) r',[pid,'Nota de colega asignada']))[0].r;
  expect(note.body).toBe('Nota de colega asignada');
  expect(await actor(b,'select * from public.clinical_notes where patient_id=$1',[pid])).toHaveLength(0);
 });
});
describe('trabajador de calendario',()=>{
 it('serializa dos revisiones de una misma reserva y rechaza finalizar con lease vencida',async()=>{
  await db.query('insert into public.scheduling_sync_jobs(booking_id,revision) values($1,6),($1,7)',[bookingA]);
  const first=(await service<{r:{id:string;run_token:string}}>('select public.scheduling_claim_sync_job() r'))[0].r;
  expect(first).toBeTruthy();expect((await service<{r:unknown}>('select public.scheduling_claim_sync_job() r'))[0].r).toBeNull();
  await db.query("update public.scheduling_sync_jobs set lease_until=now()-interval '1 minute' where id=$1",[first.id]);
  expect((await service<{ok:boolean}>('select public.scheduling_complete_sync_job($1,$2,null) ok',[first.id,first.run_token]))[0].ok).toBe(false);
  const reclaimed=(await service<{r:{run_token:string}}>('select public.scheduling_claim_sync_job() r'))[0].r;
  expect(reclaimed.run_token).not.toBe(first.run_token);
 });
});
describe('recepción opera turnos y cobros anteriores',()=>{
 it('reutiliza cuenta corriente y agenda existentes sin abrir la ficha, con reintentos y aislamiento',async()=>{
  const pid=(await db.query<{patient_id:string}>('select patient_id from public.scheduling_bookings where id=$1',[bookingA])).rows[0].patient_id;
  await actor(a,'select public.scheduling_invite_staff($1,$2,$3)',[nutriA,'admin@example.test','d'.repeat(64)]);
  await actor(admin,'select public.scheduling_accept_staff($1)',['d'.repeat(64)]);
  await expect(actor(admin,'select public.get_patient_ledger($1)',[existingPatient])).rejects.toThrow();
  await actor(admin,'select public.add_patient_charge($1,500,$2,$3)',[pid,day,'Consulta']);
  const paymentClient=randomUUID();
  await actor(admin,'select public.record_patient_payment($1,500,current_date,$2,$3,$4)',[pid,'efectivo','Recibido en recepción',paymentClient]);
  await actor(admin,'select public.record_patient_payment($1,500,current_date,$2,$3,$4)',[pid,'efectivo','Recibido en recepción',paymentClient]);
  const ledger=(await actor<{r:{payments:unknown[];charges:unknown[]}}>(admin,'select public.get_patient_ledger($1) r',[pid]))[0].r;
  expect(ledger.payments).toHaveLength(1);expect(ledger.charges).toHaveLength(1);
  await actor(admin,'select public.schedule_appointment($1)',[{patient_id:pid,appointment:{day:'Lunes',time:'10:00',duration:30,channel:'presencial',timezone:'America/Argentina/Buenos_Aires'}}]);
  expect((await actor<{r:{appointments:unknown[]}}>(admin,'select public.scheduling_existing_operations($1,0) r',[nutriA]))[0].r.appointments.length).toBeGreaterThan(0);
  await expect(actor(admin,'select public.schedule_appointment($1)',[{patient_id:existingPatient,appointment:null}])).rejects.toThrow();
  expect(await actor(admin,'select * from public.clinical_notes')).toHaveLength(0);
 });
});
describe('agenda histórica y reserva pública comparten el bloqueo',()=>{
 it('no permite insertar un turno sobre una solicitud pública vigente',async()=>{
  await service('select public.scheduling_request_booking($1,$2,$3)',[nutriA,{client_id:randomUUID(),type_id:type,starts_at:starts,name:'Otro contacto',email:'otra@example.test',phone:'1144448888',accepted_contact:true},hash]);
  const pid=(await db.query<{patient_id:string}>('select patient_id from public.scheduling_bookings where id=$1',[bookingA])).rows[0].patient_id;
  await expect(db.query("insert into public.appointments(nutritionist_id,patient_id,starts_at,duration_min,channel,timezone,status) values($1,$2,$3,45,'video','America/Argentina/Buenos_Aires','scheduled')",[nutriA,pid,starts])).rejects.toThrow();
 });
});
describe('Google cubre turnos cargados a mano',()=>{
 it('encola turnos anteriores sin duplicar reservas y conserva cambios que llegan durante la ejecución',async()=>{
  await db.query("update public.scheduling_profiles set config=jsonb_set(config,'{google_enabled}','true') where nutritionist_id=$1",[nutriA]);
  const pid=(await db.query<{patient_id:string}>('select patient_id from public.scheduling_bookings where id=$1',[bookingA])).rows[0].patient_id;
  const appointment=(await db.query<{id:string}>("insert into public.appointments(nutritionist_id,patient_id,starts_at,duration_min,channel,timezone,status) values($1,$2,$3,45,'video','America/Argentina/Buenos_Aires','scheduled') returning id",[nutriA,pid,`${day}T14:15:00Z`])).rows[0].id;
  const job=(await service<{r:{appointment_id:string;run_token:string;revision:number}}>('select public.scheduling_claim_appointment_sync() r'))[0].r;
  expect(job.appointment_id).toBe(appointment);
  await db.query("update public.appointments set status='cancelled' where id=$1",[appointment]);
  expect((await service<{ok:boolean}>('select public.scheduling_complete_appointment_sync($1,$2,$3,null,null) ok',[appointment,job.run_token,job.revision]))[0].ok).toBe(false);
  const latest=(await service<{r:{revision:number}}>('select public.scheduling_claim_appointment_sync() r'))[0].r;
  expect(latest.revision).toBeGreaterThan(job.revision);
 });
});
describe('el token público no crea una segunda vía para miembros revocados',()=>{
 it('authenticated no puede reutilizar hashes de reservas ni leerlos directamente',async()=>{
  const booking=(await service<{r:{id:string}}>('select public.scheduling_request_booking($1,$2,$3) r',[nutriA,{client_id:randomUUID(),type_id:type,starts_at:`${day}T13:30:00Z`,name:'Contacto protegido',email:'protegido@example.test',phone:'1144433333',accepted_contact:true},hash]))[0].r;
  await expect(actor(patientUser,'select public.scheduling_change_booking($1,$2,$3,$4)',[nutriA,booking.id,{action:'cancel',expected_revision:1},hash])).rejects.toThrow();
  await expect(actor(admin,'select token_hash from public.scheduling_bookings')).rejects.toThrow();
 });
});
