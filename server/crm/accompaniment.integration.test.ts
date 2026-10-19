import {randomUUID} from 'node:crypto';
import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import type {AccompanimentMealPage} from '../../src/types/accompaniment';
import {app} from '../index';
import {getPatient,resetStore} from '../store';
import {resetOutboxMemory,listOutboxSnapshot} from '../outbox/repository';
import * as outbox from '../outbox/repository';
beforeEach(()=>{resetStore();resetOutboxMemory();});
afterEach(()=>vi.restoreAllMocks());
it('pagina todas las comidas de Seguimiento y no sólo las veinte de cada ficha',async()=>{
 const patient=getPatient('pat-sofia')!,base=patient.meal_logs[0];
 patient.meal_logs=Array.from({length:65},(_,i)=>({...base,id:`follow-${i}`,logged_at:new Date().toISOString(),status:i<60?'pending_review':'confirmed'}));
 const first=await app.request('/api/crm/accompaniment/meals?patient_id=pat-sofia&limit=50');expect(first.status).toBe(200);
 const one=await first.json() as AccompanimentMealPage;expect(one.logs).toHaveLength(50);expect(one.has_more).toBe(true);expect(one.counts).toEqual({all:65,pending_review:60,reviewed:5});
 const two=await (await app.request('/api/crm/accompaniment/meals?patient_id=pat-sofia&limit=50&offset=50')).json();expect(two.logs).toHaveLength(15);expect(two.has_more).toBe(false);
 expect(new Set([...one.logs,...two.logs].map(m=>m.id)).size).toBe(65);expect(one.logs.every(m=>m.patient_id==='pat-sofia'&&!m.photo_url)).toBe(true);
});
it('rechaza rol paciente, filtros inválidos y pacientes ajenas o archivadas',async()=>{
 expect((await app.request('/api/crm/accompaniment/meals?audience=patient')).status).toBe(403);
 expect((await app.request('/api/crm/accompaniment/meals?patient_id=other')).status).toBe(403);
 expect((await app.request('/api/crm/accompaniment/meals?limit=500')).status).toBe(400);
 getPatient('pat-sofia')!.archived_at=new Date().toISOString();
 expect((await app.request('/api/crm/accompaniment/meals?patient_id=pat-sofia')).status).toBe(403);
 expect((await app.request('/api/crm/accompaniment/metrics?days=365')).status).toBe(200);
});
it('pedir registro conserva la clave de reintento y no avisa a una paciente que ya registró',async()=>{
 const patient=getPatient('pat-sofia')!,base=patient.meal_logs[0];patient.meal_logs=[];patient.habit_logs=[];patient.created_at='2026-01-01T12:00:00Z';
 const request_id=randomUUID();const send=()=>app.request('/api/crm/accompaniment/reminders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({request_id,patient_ids:['pat-sofia']})});
 expect((await send()).status).toBe(200);expect((await send()).status).toBe(200);
 expect(await listOutboxSnapshot('pat-sofia',false)).toHaveLength(1);
 patient.meal_logs=[{...base,id:'new',patient_id:'pat-sofia',logged_at:new Date().toISOString()}];
 const retry=await send();expect((await retry.json()).results[0].status).toBe('skipped');expect(await listOutboxSnapshot('pat-sofia',false)).toHaveLength(1);
});
it.each(['archive','steps'] as const)('revalida %s entre destinatarias del mismo lote',async change=>{
 for(const id of ['pat-sofia','pat-marina']){const p=getPatient(id)!;p.meal_logs=[];p.habit_logs=[];p.activity_logs=[];p.created_at='2026-01-01T12:00:00Z';}
 const enqueue=outbox.enqueueOutboxEvent;
 vi.spyOn(outbox,'enqueueOutboxEvent').mockImplementation(async(input,persistent)=>{
  const result=await enqueue(input,persistent);
  if(input.patient_id==='pat-sofia'){const next=getPatient('pat-marina')!;if(change==='archive')next.archived_at=new Date().toISOString();else next.habit_logs=[{id:'steps',patient_id:next.id,date:new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires'}).format(new Date()),hydration:0,energy:null,sleep_minutes:null,steps:4000}];}
  return result;
 });
 const response=await app.request('/api/crm/accompaniment/reminders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({request_id:randomUUID(),patient_ids:['pat-sofia','pat-marina']})});
 expect(response.status).toBe(200);expect((await response.json()).results[1].status).toBe('skipped');expect(await listOutboxSnapshot('pat-marina',false)).toHaveLength(0);
});
