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
  it('la misma fuente clínica revisada para dos fichas no devuelve la identidad de la primera',async()=>{
    const created:string[]=[];for(let i=0;i<2;i++){const input={id:crypto.randomUUID(),candidates:[{...candidate(`Paciente ${i}`,''),origins:[{...origin,row:i+10}]}]};await post('/api/patient-imports',input);created.push((await(await post(`/api/patient-imports/${input.id}/commit`,input)).json()).batch.results[0].patient_id);}
    for(const target of created){await post(`/api/patient-imports/patients/${target}/authorization`,{request_key:crypto.randomUUID(),expected_revision:0,obtained_on:'2026-10-01',source:'Documento revisado',document:{file:'prueba.pdf',fingerprint:'b'.repeat(64)},purposes:['history'],confirmed:true});const input={id:crypto.randomUUID(),candidates:[{...candidate('Revisión compartida',''),action:'append',patient_id:target,history:[{category:'history',text:'Texto revisado con correspondencia explícita',origin}]}]};await post('/api/patient-imports',input);const result=(await(await post(`/api/patient-imports/${input.id}/commit`,input)).json()).batch.results[0];expect(result).toMatchObject({status:'appended',patient_id:target});}
  });
  it('permite registrar y revocar evidencia externa separada del contacto y del append clínico',async()=>{
    const input={id:crypto.randomUUID(),candidates:[candidate('Paciente sin cuenta','')]};await post('/api/patient-imports',input);
    const saved=await(await post(`/api/patient-imports/${input.id}/commit`,input)).json(),target=saved.batch.results[0].patient_id;
    const path=`/api/patient-imports/patients/${target}/authorization`,key=crypto.randomUUID();
    const evidence={request_key:key,expected_revision:0,obtained_on:'2026-10-01',source:'Documento revisado entregado en consulta',document:{file:'permiso.pdf',fingerprint:'b'.repeat(64)},purposes:['history','study','plan','measurement'],confirmed:true};
    expect((await post(path,{...evidence,purposes:['ai_document_import']})).status).toBe(400);
    expect((await post(path,evidence)).status).toBe(201);
    const clinical={id:crypto.randomUUID(),candidates:[{...candidate('Paciente sin cuenta',''),action:'append',patient_id:target,history:[{category:'history',text:'Antecedente externo',origin}],measurements:[{kind:'weight',value:65,unit:'kg',date:'2026-10-01',origin}]}]};
    await post('/api/patient-imports',clinical);const result=await(await post(`/api/patient-imports/${clinical.id}/commit`,clinical)).json();expect(result.batch.results[0].status).toBe('appended');
    const history=await(await app.request(`/api/patients/${target}/imported-history`)).json();expect(history.history).toHaveLength(1);expect(history.measurements).toHaveLength(1);
    expect((await post(`${path}/revoke`,{request_key:crypto.randomUUID(),expected_revision:1,reason:'Retiro solicitado por la paciente',confirmed:true})).status).toBe(200);
    const retired=await(await app.request(`/api/patients/${target}/imported-history`)).json();expect(retired.history).toEqual([]);expect(retired.measurements).toEqual([]);
  });
  it('no completa un antecedente pendiente alretomar contactos sin el texto original',async()=>{
    const input={id:crypto.randomUUID(),candidates:[{...candidate(),email:'',action:'append',patient_id:'pat-sofia',history:[{category:'history',text:'Antecedente ficticio pendiente',origin}]}]};
    await post('/api/patient-imports',input);const failed=await(await post(`/api/patient-imports/${input.id}/commit`,input)).json();
    expect(failed.batch.status).toBe('partial');expect(failed.batch.candidates[0].history).toEqual([]);
    expect((await post(`/api/patient-imports/${input.id}/commit`,{id:input.id,candidates:failed.batch.candidates})).status).toBe(409);
  });
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
