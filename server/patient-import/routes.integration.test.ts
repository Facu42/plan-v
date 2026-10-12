import { beforeEach, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { registerPatientImportRoutes } from './routes.js';
import { resetPatientImportMemory } from './repository.js';
import { getStore, resetStore } from '../store.js';

const origin = { file:'contactos.csv',fingerprint:'a'.repeat(64),row:2 };
const candidate = (name='Paciente importada',email='importada@example.test') => ({key:crypto.randomUUID(),name,email,phone:'',action:'create',patient_id:null,origins:[origin],measurements:[],history:[],reviewed:true});
const app = new Hono(); app.use('*',async(c,next)=>{c.set('auth',{demo:true});await next();});
app.onError((err,c)=>c.json({error:err.message},'status' in err ? err.status as 400 : 500));
registerPatientImportRoutes(app);
const post = (path:string,body:unknown)=>app.request(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});

beforeEach(()=>{resetPatientImportMemory();resetStore();});
describe('importación en demostración',()=>{
  it('crea ficha sin cuenta ni invitación y reintenta sin duplicarla',async()=>{
    const input={id:crypto.randomUUID(),candidates:[candidate()]}; const before=getStore().patientInvites.length;
    expect((await post('/api/patient-imports',input)).status).toBe(201);
    const first=await post(`/api/patient-imports/${input.id}/commit`,input);
    expect(first.status).toBe(200); const saved=await first.json(); expect(saved.batch.results[0].status).toBe('created');
    const result=await post(`/api/patient-imports/${input.id}/commit`,input); expect((await result.json()).batch.results).toEqual(saved.batch.results);
    expect(getStore().patients.filter(p=>p.name==='Paciente importada')).toHaveLength(1);
    expect(getStore().patientInvites).toHaveLength(before);
    const manual=await post(`/api/patient-imports/patients/${saved.batch.results[0].patient_id}/invite`,{});
    expect(manual.status).toBe(200);expect((await manual.json()).invite.status).toBe('pending');
  });
  it('detecta duplicados sin sobrescribir y permite resultados parciales',async()=>{
    const input={id:crypto.randomUUID(),candidates:[candidate(),candidate('Otra paciente')]}; await post('/api/patient-imports',input);
    const result=await(await post(`/api/patient-imports/${input.id}/commit`,input)).json();
    expect(result.batch.results.map((r:{status:string})=>r.status)).toEqual(['created','duplicate']);
    expect(getStore().patients.filter(p=>p.name==='Otra paciente')).toHaveLength(0);
  });
  it('rechaza historias de nuevas pacientes y lote modificado tras revisión',async()=>{
    const row=candidate(); const input={id:crypto.randomUUID(),candidates:[row]};
    const clinical={...input,candidates:[{...row,history:[{category:'history',text:'Dato clínico privado',origin}]}]};
    expect((await post('/api/patient-imports',clinical)).status).toBe(400);
    await post('/api/patient-imports',input);
    expect((await post(`/api/patient-imports/${input.id}/commit`,{...input,candidates:[{...row,name:'Nombre cambiado'}]})).status).toBe(409);
    expect((await app.request('/api/patient-imports?audience=patient')).status).toBe(403);
  });
});
