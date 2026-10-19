import { beforeEach,expect,it } from 'vitest';
import { app } from '../index.js';
import { getPatient,resetStore } from '../store.js';
beforeEach(()=>resetStore());
it('pagina comidas anteriores a las veinte de la ficha y conserva revisión pendiente',async()=>{
  const patient=getPatient('pat-sofia')!,base=patient.meal_logs[0];
  patient.meal_logs=Array.from({length:65},(_,i)=>({...base,id:`old-${i}`,status:'pending_review',logged_at:new Date(Date.now()-i*86400000).toISOString()}));
  const first=await app.request('/api/crm/patients/pat-sofia/meals?status=pending_review&limit=3');
  expect(first.status).toBe(200);const body=await first.json();expect(body.logs).toHaveLength(3);expect(body.has_more).toBe(true);
  const rest=await (await app.request('/api/crm/patients/pat-sofia/meals?status=pending_review&offset=60&limit=10')).json();
  expect(rest.logs).toHaveLength(5);expect(rest.has_more).toBe(false);expect(rest.logs[0].id).toBe('old-60');
});
it('rechaza rol paciente, paciente ajena, archivo y filtros inválidos',async()=>{
  expect((await app.request('/api/crm/patients/ajena/meals')).status).toBe(403);
  expect((await app.request('/api/crm/patients/pat-sofia/meals?audience=patient')).status).toBe(403);
  expect((await app.request('/api/crm/patients/pat-sofia/meals?limit=500')).status).toBe(400);
  getPatient('pat-sofia')!.archived_at=new Date().toISOString();
  expect((await app.request('/api/crm/patients/pat-sofia/meals')).status).toBe(403);
});
