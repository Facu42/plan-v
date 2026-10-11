import {beforeEach,describe,expect,it} from 'vitest';
import {randomUUID} from 'node:crypto';
import {saveCareRecord,reviewCareRecord,resetCareMemory} from '../care/repository.js';
import {app} from '../index.js';
import {resetStore,updatePatient} from '../store.js';

describe('registro semanal compartido entre lista y ficha',()=>{
  beforeEach(()=>{resetStore();resetCareMemory();updatePatient('pat-sofia',{meal_logs:[],habit_logs:[]});});
  it('el alta trae resumen vacío disponible desde el primer render',async()=>{
    const response=await app.request('/api/patients',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Paciente nueva',email:'nueva@example.test',goal:'Organizar comidas'})});
    expect(response.status).toBe(201);expect((await response.json()).patient.weekly_registration).toMatchObject({recorded_days:0,pending_review:0,water_average:null});
  });
  it('conserva el resumen al cancelar una consulta',async()=>{
    const response=await app.request('/api/patients/pat-sofia/appointment',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({appointment:null})});
    expect(response.status).toBe(200);expect((await response.json()).patient.weekly_registration).toMatchObject({recorded_days:0});
  });
  it('actualiza pendientes sin cambiar la cantidad de días al revisar',async()=>{
    const id=randomUUID();await saveCareRecord('pat-sofia',{id,recorded_on:'2026-09-10',data:{kind:'activity',activity:'Caminar',minutes:30,intensity:'suave',kcal:null,note:''}},false);
    const first=await(await app.request('/api/patients/pat-sofia')).json();expect(first.patient.weekly_registration.pending_review).toBe(1);
    await reviewCareRecord('pat-sofia',id,false);
    const last=await(await app.request('/api/patients/pat-sofia')).json();expect(last.patient.weekly_registration.pending_review).toBe(0);expect(last.patient.weekly_registration.recorded_days).toBe(first.patient.weekly_registration.recorded_days);
  });
  it('entrega ausencia de agua como desconocida y conserva cero explícito',async()=>{
    const before=await(await app.request('/api/patients/pat-sofia')).json();
    expect(before.patient.weekly_registration).toMatchObject({recorded_days:0,water_average:null,pending_review:0});
    expect((await app.request('/api/patients/pat-sofia/habits',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({hydration:0})})).status).toBe(200);
    const detail=await(await app.request('/api/patients/pat-sofia')).json();
    expect(detail.patient.weekly_registration).toMatchObject({recorded_days:1,water_average:0,water_days:1});
    const list=await(await app.request('/api/patients')).json();
    expect(list.patients.find((p:any)=>p.id==='pat-sofia').weekly_registration).toEqual(detail.patient.weekly_registration);
  });
});
