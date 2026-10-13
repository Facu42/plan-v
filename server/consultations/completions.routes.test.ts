import { beforeEach,describe,it,expect } from 'vitest';
import { Hono } from 'hono';
import { registerConsultationRoutes } from './routes.js';
import { resetConsultationMemory,completion_events } from './memory.js';
import { getStore,resetStore } from '../store.js';
import { appendConsent } from '../intake/memory.js';
import { consentTextByPurpose } from '../intake/consent.js';
const app=new Hono();app.use('*',async(c,next)=>{c.set('auth',{demo:true});await next();});app.onError((error,c)=>c.json({error:error.message},'status'in error?error.status as 400:500));registerConsultationRoutes(app);
const root='/api/patients/pat-sofia/consultations',aid='20000000-0000-4000-a000-000000000001';
const post=(url:string,data:unknown)=>app.request(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
function consent(decision:'granted'|'withdrawn'='granted'){const c=consentTextByPurpose('care_relationship');appendConsent('pat-sofia',{purpose:c.purpose,text_version:c.text_version,text_hash:c.text_hash,decision,actor_id:'patient'});}
beforeEach(()=>{resetStore();resetConsultationMemory();const patient=getStore().patients.find(p=>p.id==='pat-sofia')!;patient.has_account=false;patient.appointment={id:aid,when:'Turno explícito',starts_at:new Date(Date.now()-5*60000).toISOString(),duration:45,channel:'video',patient_reply:'attending'};});
describe('recorrido de consulta realizada sin consentimiento de IA',()=>{
 it('asistencia y cierre de nota no completan consulta; completar y corregir requieren confirmación + CAS',async()=>{
  consent();const sid=crypto.randomUUID();expect((await post(root,{action:'start',id:sid,source:'manual'})).status).toBe(201);
  expect((await post(root,{action:'finish',id:sid,expected_revision:1,interrupted:false})).status).toBe(200);
  expect((await(await app.request(`${root}/completions`)).json()).total_completed).toBe(0);
  expect((await post(`${root}/completions`,{appointment_id:aid,expected_revision:0,completed:true,confirmed:false})).status).toBe(400);
  expect((await post(`${root}/completions`,{appointment_id:aid,expected_revision:0,completed:true,confirmed:true})).status).toBe(200);
  expect((await(await app.request(`${root}/completions?limit=1`)).json()).total_completed).toBe(1);
  expect((await post(`${root}/completions`,{appointment_id:aid,expected_revision:0,completed:false,confirmed:true})).status).toBe(409);
  expect((await post(`${root}/completions`,{appointment_id:aid,expected_revision:1,completed:false,confirmed:true})).status).toBe(200);
  expect((await(await app.request(`${root}/completions`)).json()).total_completed).toBe(0);expect([...completion_events.values()].map(e=>e.completed)).toEqual([true,false]);
 });
 it('rechaza retiro de consentimiento, turnos cruzados, payload extendido y páginas inválidas',async()=>{
  expect((await app.request(`${root}/completions`)).status).toBe(403);consent();
  expect((await post(`${root}/completions`,{appointment_id:crypto.randomUUID(),expected_revision:0,completed:true,confirmed:true})).status).toBe(404);
  expect((await post(`${root}/completions`,{appointment_id:aid,expected_revision:0,completed:true,confirmed:true,clinical_text:'No aceptado'})).status).toBe(400);
  expect((await app.request(`${root}/completions?limit=101`)).status).toBe(400);consent('withdrawn');
  expect((await post(`${root}/completions`,{appointment_id:aid,expected_revision:0,completed:true,confirmed:true})).status).toBe(403);
 });
});
