import { describe,expect,it,vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { consentTextByPurpose } from '../intake/consent.js';
import { listDueAppointments } from './reminder-source.js';
type Row=Record<string,unknown>;
function database(tables:Record<string,Row[]>) {
 const getUserById=vi.fn(async()=>({data:{user:{email:'patient@example.test',email_confirmed_at:'2026-10-12'}},error:null}));
 const db={auth:{admin:{getUserById}},from:(table:string)=>{
  let rows=tables[table]??[];
  const query={select:()=>query,eq:(key:string,value:unknown)=>{rows=rows.filter(r=>r[key]===value);return query;},in:(key:string,values:unknown[])=>{rows=rows.filter(r=>values.includes(r[key]));return query;},gte:(key:string,value:string)=>{rows=rows.filter(r=>String(r[key])>=value);return query;},lt:(key:string,value:string)=>{rows=rows.filter(r=>String(r[key])<value);return query;},order:()=>query,range:(from:number,to:number)=>Promise.resolve({data:rows.slice(from,to+1),error:null})};return query;
 }};
 return {db:db as unknown as SupabaseClient,getUserById};
}
describe('recordatorios completos con opt-in y vínculo vigente',()=>{
 it('lee mil turnos y sólo consulta el correo de una paciente con preferencia explícita',async()=>{
  const care=consentTextByPurpose('care_relationship');
  const tables={appointments:[],patients:[],nutritionists:[{id:'n1',display_name:'Consultorio'}],notification_preferences:[],consent_events:[]} as Record<string,Row[]>;
  for(let i=0;i<1000;i++){
   tables.appointments.push({id:`a${i}`,status:'scheduled',starts_at:'2026-10-13T15:00:00Z',patient_id:`p${i}`,nutritionist_id:'n1',channel:'video'});
   tables.patients.push({id:`p${i}`,user_id:`u${i}`,nutritionist_id:'n1',full_name:'Paciente'});
   tables.notification_preferences.push({user_id:`u${i}`,email:i===999});
   tables.consent_events.push({patient_id:`p${i}`,purpose:care.purpose,text_version:care.text_version,text_hash:care.text_hash,decision:'granted',sequence:1});
  }
  const fake=database(tables),rows=await listDueAppointments('2026-10-13T00:00:00Z','2026-10-14T00:00:00Z',fake.db);
  expect(rows).toHaveLength(1);expect(rows[0].id).toBe('a999');expect(fake.getUserById).toHaveBeenCalledExactlyOnceWith('u999');
 });
 it('excluye archivo, retiro del permiso y turno de otro consultorio aunque exista correo',async()=>{
  const care=consentTextByPurpose('care_relationship');
  const tables={appointments:[1,2,3].map(i=>({id:`a${i}`,status:'scheduled',starts_at:'2026-10-13T15:00:00Z',patient_id:`p${i}`,nutritionist_id:'n1'})),patients:[1,2,3].map(i=>({id:`p${i}`,user_id:`u${i}`,nutritionist_id:i===3?'foreign':'n1',archived_at:i===1?'2026-10-10':null})),nutritionists:[{id:'n1'}],notification_preferences:[1,2,3].map(i=>({user_id:`u${i}`,email:true})),consent_events:[1,2,3].map(i=>({patient_id:`p${i}`,purpose:care.purpose,text_version:care.text_version,text_hash:care.text_hash,decision:i===2?'withdrawn':'granted',sequence:2}))};
  const fake=database(tables);
  expect(await listDueAppointments('2026-10-13T00:00:00Z','2026-10-14T00:00:00Z',fake.db)).toEqual([]);expect(fake.getUserById).not.toHaveBeenCalled();
 });
});
