import type { Context,Hono } from 'hono';
import { z } from 'zod';
import { clinicalWorkspaceInputSchema,clinicalDocumentInputSchema,clinicBrandSchema,methodReferenceSchema } from '../../src/types/clinical-workspace.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { sbGetActor,sbGetPatientResource,sbGetPatientById } from '../db/supabase-repo.js';
import { getPatient,DEMO_NUTRITIONIST_ID } from '../store.js';
import { CareError } from '../care/errors.js';
import { currentCareConsents,requireCareConsent } from '../care/consents.js';
import { readIntakeBundle } from '../intake/repository.js';
import { getIntakeRecord,listClinicalNotes } from '../intake/memory.js';
import { listMeasurements } from '../care/repository.js';
import { listImportedHistory } from '../patient-import/repository.js';
import { listImportedMeasurements } from '../patient-import/external-authorization.js';
import * as repo from './repository.js';
import { labReadingProvider,labReadingOperationKey,labReadingInputSchema,LabReadingError } from '../lab-reading/provider.js';
async function scope(c:Context,patientId?:string){const auth=c.get('auth');const persistent='userId'in auth&&isSupabaseEnabled();if(!persistent){if(c.req.query('audience')==='patient')throw new CareError(403,'Sólo la profesional puede abrir este apartado.');if(patientId&&!getPatient(patientId))throw new CareError(404,'Paciente no encontrado.');return {persistent:false,nutritionistId:DEMO_NUTRITIONIST_ID};}const actor=await sbGetActor(auth.userId);if(actor?.role!=='nutri')throw new CareError(403,'Sólo la profesional puede abrir este apartado.');if(patientId&&(await sbGetPatientResource(patientId))?.nutritionistId!==actor.nutritionistId)throw new CareError(403,'La ficha no pertenece a tu consultorio.');return {persistent:true,nutritionistId:actor.nutritionistId};}
async function body<T>(c:Context,schema:z.ZodType<T>,max=900000):Promise<T>{const raw=await c.req.text();if(new TextEncoder().encode(raw).length>max)throw new CareError(413,'El archivo o lote supera el límite.');let input:unknown;try{input=JSON.parse(raw);}catch{throw new CareError(400,'Revisá el formulario.');}const result=schema.safeParse(input);if(!result.success)throw new CareError(400,'Revisá valores, unidades, fechas, referencia y la revisión de cada dato.');return result.data;}
export function registerClinicalWorkspaceRoutes(app:Hono){
  app.get('/api/patients/:id/clinical-workspace/imported-export',async c=>{
    const id=c.req.param('id'),s=await scope(c,id);
    return c.json(await repo.exportImportedClinical(id,s.nutritionistId,s.persistent));
  });
  app.post('/api/clinical/references',async c=>{const s=await scope(c);return c.json({reference:await repo.saveReference(s.nutritionistId,await body(c,methodReferenceSchema),s.persistent)},201);});
  app.delete('/api/clinical/references/:id',async c=>{const s=await scope(c);await repo.revokeReference(s.nutritionistId,c.req.param('id'),s.persistent);return c.json({deactivated:true});});
  app.put('/api/clinical/brand',async c=>{const s=await scope(c);return c.json({brand:await repo.saveBrand(s.nutritionistId,await body(c,clinicBrandSchema),s.persistent)});});
  app.post('/api/patients/:id/clinical-workspace/lab-reading',async c=>{
    const id=c.req.param('id'),s=await scope(c,id);
    const input=await body(c,z.object({request_id:z.uuid(),reading:labReadingInputSchema}).strict(),60000);
    const has=async()=>{const consented=(await currentCareConsents(id,s.persistent)).consented;return consented.includes('care_relationship')&&consented.includes('ai_lab_reading');};
    if(!await has())throw new CareError(403,'Para usar la IA, la paciente tiene que activar el permiso «Lectura de laboratorio con IA».');
    const auth=c.get('auth'),actor='userId'in auth?auth.userId:'demo';
    try{return c.json({text:await labReadingProvider(has).read(input.reading,labReadingOperationKey(actor,id,input.request_id)),mode:'ai'});}
    catch(error){if(error instanceof LabReadingError)return c.json({error:error.message,code:error.code},error.code==='config'?503:error.code==='cancelled'?403:error.code==='quota'?429:502);throw error;}
  });
  app.get('/api/patients/:id/clinical-workspace',async c=>{const id=c.req.param('id');const s=await scope(c,id);return c.json(await repo.clinicalSnapshot(id,s.nutritionistId,s.persistent));});
  app.post('/api/patients/:id/clinical-workspace/records',async c=>{const id=c.req.param('id');const s=await scope(c,id);return c.json({record:await repo.saveClinicalRecord(id,s.nutritionistId,await body(c,clinicalWorkspaceInputSchema),s.persistent)},201);});
  app.post('/api/patients/:id/clinical-workspace/documents',async c=>{const id=c.req.param('id');const s=await scope(c,id);return c.json({document:await repo.saveDocument(id,s.nutritionistId,await body(c,clinicalDocumentInputSchema,28000000),s.persistent)},201);});
  app.get('/api/patients/:id/clinical-workspace/documents/:documentId',async c=>{const id=c.req.param('id');const s=await scope(c,id);return c.json(await repo.openClinicalDocument(id,c.req.param('documentId'),s.persistent));});
  app.get('/api/patients/:id/clinical-workspace/export',async c=>{
    const id=c.req.param('id');const s=await scope(c,id);await requireCareConsent(id,s.persistent,'care_relationship');await repo.auditClinicalAccess(id,'export',s.persistent);
    const patient=s.persistent?await sbGetPatientById(id,'professional'):getPatient(id);if(!patient)throw new CareError(404,'Paciente no encontrado.');
    const consents=(await currentCareConsents(id,s.persistent)).consented;const intake=s.persistent?await readIntakeBundle(id):{intake:getIntakeRecord(id),clinical_notes:listClinicalNotes(id)};
    const measurements=consents.includes('measurement')?await listMeasurements(id,s.persistent):[];
    return c.json({patient,snapshot:await repo.clinicalSnapshot(id,s.nutritionistId,s.persistent),intake:intake.intake,clinical_notes:intake.clinical_notes??[],measurements,imported_history:await listImportedHistory(id,s.persistent),imported_measurements:await listImportedMeasurements(id,s.persistent),consented:consents});
  });
}
