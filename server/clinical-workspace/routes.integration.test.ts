import { beforeEach,describe,expect,it } from 'vitest';
import { Hono } from 'hono';
import { registerClinicalWorkspaceRoutes } from './routes.js';
import { resetClinicalWorkspaceMemory } from './repository.js';
import { resetStore } from '../store.js';
import { CONSENT_CATALOG } from '../intake/consent.js';
import { appendConsent } from '../intake/memory.js';
import { createHash } from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
import { commitImportBatch, resetPatientImportMemory, saveImportBatch, contactSnapshot } from '../patient-import/repository.js';
import type { ImportBatchInput } from '../../src/types/patient-import.js';
import { recordImportAuthorization, revokeImportAuthorization } from '../patient-import/external-authorization.js';
import { getPatient } from '../store.js';
const origin={file:'historia.csv',fingerprint:'c'.repeat(64),row:7,page:2,sheet:'Medidas'};
async function historicalPatient(){
  const candidate={key:crypto.randomUUID(),name:'Ficha histórica ficticia',email:'',phone:'',action:'create' as const,patient_id:null,origins:[origin],measurements:[],history:[],reviewed:true as const};
  const batch={id:crypto.randomUUID(),candidates:[candidate]};await saveImportBatch(batch,false);
  const created=await commitImportBatch(batch,false);const patient=created.results[0].patient_id!;
  await recordImportAuthorization(patient,{request_key:crypto.randomUUID(),expected_revision:0,obtained_on:'2026-10-01',source:'Autorización escrita específica',document:{file:'permiso.pdf',fingerprint:'d'.repeat(64)},purposes:['history','measurement'],confirmed:true},false);
  const append:ImportBatchInput={id:crypto.randomUUID(),candidates:[{...candidate,key:crypto.randomUUID(),action:'append',patient_id:patient,history:[{category:'history',text:'Antecedente original 2020',origin}],measurements:[{kind:'weight',value:132.25,unit:'lb',date:'2020-09-01',origin}]}]};
  await saveImportBatch(contactSnapshot(append),false);await commitImportBatch(append,false);
  return patient;
}
const app=new Hono();app.use('*',async(c,next)=>{c.set('auth',{demo:true});await next();});app.onError((err,c)=>c.json({error:err.message},'status' in err?err.status as 400:500));registerClinicalWorkspaceRoutes(app);
const post=(path:string,input:unknown)=>app.request(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)});
function grant(purpose:string){const text=CONSENT_CATALOG.find(c=>c.purpose===purpose)!;appendConsent('pat-sofia',{purpose:text.purpose,text_version:text.text_version,text_hash:text.text_hash,decision:'granted',actor_id:'demo-patient'});}
beforeEach(()=>{resetStore();resetClinicalWorkspaceMemory();resetPatientImportMemory();grant('care_relationship');grant('measurement');grant('clinical_document');});
describe('módulo clínico demo',()=>{
  it('exporta sólo históricos autorizados sin cuenta; el export completo conserva el permiso de atención',async()=>{
    const id=await historicalPatient();const url=`/api/patients/${id}/clinical-workspace`;
    expect((await app.request(url+'/export')).status).toBe(403);
    const response=await app.request(url+'/imported-export');expect(response.status).toBe(200);const pkg=await response.json();
    expect(Object.keys(pkg).sort()).toEqual(['brand','imported_history','imported_measurements','patient']);
    expect(pkg.imported_measurements[0]).toMatchObject({value:132.25,unit:'lb',recorded_on:'2020-09-01',origin});
    expect(pkg.imported_history[0]).toMatchObject({body:'Antecedente original 2020',origin});
    expect((await app.request(url+'/imported-export?audience=patient')).status).toBe(403);
    await revokeImportAuthorization(id,{request_key:crypto.randomUUID(),expected_revision:1,reason:'Retiro solicitado',confirmed:true},false);
    expect((await app.request(url+'/imported-export')).status).toBe(403);
  });
  it('el export completo conserva las medidas históricas aparte y no las incorpora a medidas actuales',async()=>{
    const id=await historicalPatient();getPatient(id)!.has_account=true;
    for(const purpose of ['care_relationship','measurement']as const){const c=CONSENT_CATALOG.find(text=>text.purpose===purpose)!;appendConsent(id,{purpose,text_version:c.text_version,text_hash:c.text_hash,decision:'granted',actor_id:'demo-patient'});}
    const response=await app.request(`/api/patients/${id}/clinical-workspace/export`);expect(response.status).toBe(200);const pkg=await response.json();
    expect(pkg.imported_measurements).toHaveLength(1);expect(pkg.measurements).toEqual([]);expect(pkg.snapshot.records).toEqual([]);
  });
  it('exige referencia aprobada y conserva resultados declarados sin inventar fórmulas',async()=>{
    const reference={id:crypto.randomUUID(),method:'bariatric',title:'Protocolo del consultorio',source_url:'https://example.test/protocolo',notes:'Referencia validada por profesional en datos ficticios',approved:true};
    expect((await post('/api/clinical/references',reference)).status).toBe(201);
    const input={id:crypto.randomUUID(),recorded_on:'2026-10-01',note:'Nota ficticia',reviewed:true,data:{kind:'bariatric',reference_id:reference.id,surgery_date:'2026-09-01',surgery_type:'Declarada por profesional',preop_kg:120,current_kg:90,reference_kg:null,symptoms:'',supplements:'',next_review:null}};
    expect((await post('/api/patients/pat-sofia/clinical-workspace/records',input)).status).toBe(201);
    expect((await post('/api/patients/pat-sofia/clinical-workspace/records',input)).status).toBe(201);
    const snapshot=await(await app.request('/api/patients/pat-sofia/clinical-workspace')).json();expect(snapshot.records).toHaveLength(1);
    const invalid={...input,id:crypto.randomUUID(),data:{...input.data,reference_id:crypto.randomUUID()}};expect((await post('/api/patients/pat-sofia/clinical-workspace/records',invalid)).status).toBe(403);
  });
  it('no acepta un laboratorio con un document_id desconocido',async()=>{
    const input={id:crypto.randomUUID(),recorded_on:'2026-10-01',note:'',reviewed:true,data:{kind:'laboratory',document_id:crypto.randomUUID(),values:[{id:crypto.randomUUID(),name:'Glucosa',value:95,operator:'',unit:'mg/dL',range_text:'70 - 110',raw_value:'95',source_line:'Glucosa 95 mg/dL 70 - 110',page:1,reviewed:true}]}};
    expect((await post('/api/patients/pat-sofia/clinical-workspace/records',input)).status).toBe(403);
    expect((await app.request('/api/patients/pat-sofia/clinical-workspace?audience=patient')).status).toBe(403);
  });
  it('verifica páginas reales de un PDF comprimido y limita 40 páginas',async()=>{
    const pdf=await PDFDocument.create();for(let i=0;i<41;i++)pdf.addPage();const bytes=Buffer.from(await pdf.save());
    const input={id:crypto.randomUUID(),filename:'estudio.pdf',source_sha256:createHash('sha256').update(bytes).digest('hex'),file:`data:application/pdf;base64,${bytes.toString('base64')}`};
    expect((await post('/api/patients/pat-sofia/clinical-workspace/documents',input)).status).toBe(400);
  });
  it('rechaza 20 MB excedidos y no guarda el documento si cambia el hash',async()=>{
    const bytes=Buffer.alloc(20*1024*1024+1);Buffer.from('%PDF-').copy(bytes);
    const input={id:crypto.randomUUID(),filename:'estudio.pdf',source_sha256:createHash('sha256').update(bytes).digest('hex'),file:`data:application/pdf;base64,${bytes.toString('base64')}`};
    expect((await post('/api/patients/pat-sofia/clinical-workspace/documents',input)).status).toBe(413);
    expect((await post('/api/patients/pat-sofia/clinical-workspace/documents',{...input,file:'data:application/pdf;base64,JVBERi0=',source_sha256:'a'.repeat(64)})).status).toBe(400);
  });
});
