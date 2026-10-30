import type { Context,Hono } from 'hono';
import { importBatchSchema, type ImportBatchInput } from '../../src/types/patient-import.js';
import { isSupabaseEnabled } from '../db/supabase-client.js';
import { sbGetActor,sbGetPatientResource } from '../db/supabase-repo.js';
import { DEMO_NUTRITIONIST_ID,getPatient } from '../store.js';
import { CareError } from '../care/errors.js';
import { commitImportBatch,listImportBatches,listImportContacts,listImportedHistory,readImportBatch,saveImportBatch,prepareImportedInvite } from './repository.js';
import {importAuthorizationInputSchema,importAuthorizationRevokeSchema} from '../../src/types/import-authorization.js';
import {importAuthorizationState,recordImportAuthorization,revokeImportAuthorization,listImportedMeasurements} from './external-authorization.js';
import { assertCanAdd } from '../billing-platform/limits.js';

async function scope(c:Context){
  const auth=c.get('auth');const persistent='userId' in auth&&isSupabaseEnabled();
  if(!persistent){if(c.req.query('audience')==='patient')throw new CareError(403,'Solo profesionales del consultorio.');return {persistent:false,nutritionistId:DEMO_NUTRITIONIST_ID};}
  const actor=await sbGetActor(auth.userId);if(actor?.role!=='nutri')throw new CareError(403,'Solo profesionales del consultorio.');
  return {persistent:true,nutritionistId:actor.nutritionistId};
}
async function input(c:Context):Promise<ImportBatchInput>{
  const raw=await c.req.text();if(new TextEncoder().encode(raw).length>900000)throw new CareError(413,'Dividí el lote en archivos más chicos.');
  let value:unknown;try{value=JSON.parse(raw);}catch{throw new CareError(400,'Revisá el lote.');}
  const parsed=importBatchSchema.safeParse(value);if(!parsed.success)throw new CareError(400,'Revisá los nombres, emails, fechas, unidades y permisos de cada fila.');
  const keys=new Set(parsed.data.candidates.map(r=>r.key));if(keys.size!==parsed.data.candidates.length)throw new CareError(400,'No repitas identificadores de pacientes.');
  const files=new Set(parsed.data.candidates.flatMap(r=>r.origins.map(o=>o.fingerprint)));if(files.size>20)throw new CareError(400,'Cada lote admite hasta veinte archivos.');
  return parsed.data;
}
export function registerPatientImportRoutes(app:Hono){
  app.get('/api/patient-imports/patients/:id/authorization',async c=>{const s=await scope(c);return c.json({authorization:await importAuthorizationState(c.req.param('id'),s.persistent)});});
  app.post('/api/patient-imports/patients/:id/authorization',async c=>{const s=await scope(c);const parsed=importAuthorizationInputSchema.safeParse(await c.req.json().catch(()=>null));if(!parsed.success)throw new CareError(400,'Revisá la evidencia y confirmá su alcance antes de registrarla.');return c.json({authorization:await recordImportAuthorization(c.req.param('id'),parsed.data,s.persistent)},201);});
  app.post('/api/patient-imports/patients/:id/authorization/revoke',async c=>{const s=await scope(c);const parsed=importAuthorizationRevokeSchema.safeParse(await c.req.json().catch(()=>null));if(!parsed.success)throw new CareError(400,'Revisá el motivo y confirmá el retiro.');return c.json({authorization:await revokeImportAuthorization(c.req.param('id'),parsed.data,s.persistent)});});
  app.post('/api/patient-imports/patients/:id/invite',async c=>{const s=await scope(c);return c.json({invite:await prepareImportedInvite(c.req.param('id'),s.persistent),source:s.persistent?'supabase':'memory'});});
  app.get('/api/patients/:id/imported-history',async c=>{const s=await scope(c);const id=c.req.param('id');if(s.persistent){const patient=await sbGetPatientResource(id);if(patient?.nutritionistId!==s.nutritionistId)throw new CareError(403,'La ficha no pertenece a tu consultorio.');}else if(!getPatient(id))throw new CareError(404,'Paciente no encontrado.');const [history,measurements]=await Promise.all([listImportedHistory(id,s.persistent),listImportedMeasurements(id,s.persistent)]);return c.json({history,measurements});});
  app.get('/api/patient-imports',async c=>{const s=await scope(c);return c.json({batches:await listImportBatches(s.persistent,s.nutritionistId)});});
  app.get('/api/patient-imports/contacts',async c=>{const s=await scope(c);return c.json({contacts:await listImportContacts(s.persistent,s.nutritionistId)});});
  app.post('/api/patient-imports',async c=>{const s=await scope(c);return c.json({batch:await saveImportBatch(await input(c),s.persistent)},201);});
  app.get('/api/patient-imports/:id',async c=>{const s=await scope(c);return c.json({batch:await readImportBatch(c.req.param('id'),s.persistent)});});
  app.post('/api/patient-imports/:id/commit',async c=>{const s=await scope(c);const parsed=await input(c);if(parsed.id!==c.req.param('id'))throw new CareError(400,'El identificador del lote cambió.');if(s.persistent)await assertCanAdd(s.nutritionistId,'patient',parsed.candidates.length);return c.json({batch:await commitImportBatch(parsed,s.persistent)});});
}
