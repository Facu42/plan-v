import {randomUUID} from 'node:crypto';
import {beforeEach,expect,it} from 'vitest';
import {app} from '../index';
import {getPatient,resetStore} from '../store';
import {resetOutboxMemory,listOutboxSnapshot} from '../outbox/repository';
beforeEach(()=>{resetStore();resetOutboxMemory();});
it('pagina todas las comidas de Seguimiento y no sólo las veinte de cada ficha',async()=>{
 const patient=getPatient('pat-sofia')!,base=patient.meal_logs[0];
 patient.meal_logs=Array.from({length:65},(_,i)=>({...base,id:`follow-${i}`,logged_at:new Date().toISOString(),status:i<60?'pending_review':'confirmed'}));
 const first=await app.request('/api/crm/accompaniment/meals?patient_id=pat-sofia&limit=50');expect(first.status).toBe(200);
 const one=await first.json();expect(one.logs).toHaveLength(50);expect(one.has_more).toBe(true);expect(one.counts).toEqual({all:65,pending_review:60,reviewed:5});
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
 const patient=getPatient('pat-sofia')!;patient.meal_logs=[];patient.habit_logs=[];patient.created_at='2026-01-01T12:00:00Z';
 const request_id=randomUUID();const send=()=>app.request('/api/crm/accompaniment/reminders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({request_id,patient_ids:['pat-sofia']})});
 expect((await send()).status).toBe(200);expect((await send()).status).toBe(200);
 expect(await listOutboxSnapshot('pat-sofia',false)).toHaveLength(1);
 const base=getPatient('pat-lucia')!.meal_logs[0];patient.meal_logs=[{...base,id:'new',patient_id:'pat-sofia',logged_at:new Date().toISOString()}];
 const retry=await send();expect((await retry.json()).results[0].status).toBe('skipped');expect(await listOutboxSnapshot('pat-sofia',false)).toHaveLength(1);
});
