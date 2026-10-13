import { createHash, randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import type { ImportBatch, ImportBatchInput, ImportCandidate, ImportContact, ImportResult, ImportedHistory } from '../../src/types/patient-import.js';
import { careDataSchema } from '../../src/types/care.js';
import type { Patient } from '../../src/types/index.js';
import { getRequestDb } from '../db/supabase-client.js';
import { registerDemoState } from '../demo/state.js';
import { CareError } from '../care/errors.js';
import { requireCareConsent } from '../care/consents.js';
import { saveCareRecord } from '../care/repository.js';
import { getPatient, getStore,DEMO_NUTRITIONIST_ID,sendPatientInvite } from '../store.js';
import { createInviteRecord,canOpenInvite } from '../identity/invites.js';
import { sbSendInvite } from '../db/supabase-repo.js';

const batches = new Map<string, ImportBatch>();
const contacts = new Map<string, ImportContact>();
const applied = new Map<string,string>();
const histories = new Map<string,ImportedHistory>();
registerDemoState('patient-import',()=>({batches,contacts,applied,histories}));
export function resetPatientImportMemory() { batches.clear(); contacts.clear(); applied.clear();histories.clear(); }
/** Clinical text remains in the browser during review; drafts persisted here contain contact only. */
export const contactSnapshot = (input: ImportBatchInput): ImportBatchInput => ({id:input.id,candidates:input.candidates.map(c=>({...c,history:[],measurements:[]}))});
export const importSourceKey = (row: ImportCandidate) => createHash('sha256').update(JSON.stringify({action:row.action,origins:row.origins,history:row.history,measurements:row.measurements})).digest('hex');
function dbError(error: {code?:string}|null) {
  if (!error) return;
  if (['42P01','42883','PGRST202','PGRST205'].includes(error.code??'')) throw new CareError(501,'Falta instalar el módulo de importación en este entorno.');
  if (error.code==='42501') throw new CareError(403,'No tenés permiso para importar en este consultorio o falta consentimiento.');
  if (error.code==='PT409'||error.code==='23505') throw new CareError(409,'El lote cambió o ya existe. Volvé a revisarlo.');
  if (['22023','23514','22P02'].includes(error.code??'')) throw new CareError(400,'Revisá los datos de importación.');
  throw new CareError(503,'No pudimos confirmar la importación. Reintentá el mismo lote.');
}
export async function listImportContacts(persistent:boolean,nutritionistId:string):Promise<ImportContact[]> {
  if (!persistent) return getStore().patients.map(p=>({patient_id:p.id,name:p.name,email:contacts.get(p.id)?.email??getStore().patientInvites.find(i=>i.patient_id===p.id)?.email??'',phone:contacts.get(p.id)?.phone??''}));
  const result:ImportContact[]=[];
  for(let offset=0;;offset+=250){
    const {data,error}=await getRequestDb().rpc('list_patient_import_contacts',{start_at:offset});dbError(error);
    const rows=(data??[]) as ImportContact[];result.push(...rows);if(rows.length<250)break;
  }
  return result;
}
export async function listImportBatches(persistent:boolean,nutritionistId:string):Promise<ImportBatch[]> {
  if (!persistent) return [...batches.values()].sort((a,b)=>b.created_at.localeCompare(a.created_at));
  const {data,error}=await getRequestDb().from('patient_import_batches').select('id,payload,results,created_at,status').eq('nutritionist_id',nutritionistId).order('created_at',{ascending:false}).limit(25);dbError(error);
  return (data??[]).map(row=>({...row.payload,id:row.id,results:row.results,created_at:row.created_at,status:row.status})) as ImportBatch[];
}
export async function readImportBatch(id:string,persistent:boolean):Promise<ImportBatch> {
  if (!persistent) { const batch=batches.get(id);if(!batch)throw new CareError(404,'Lote no encontrado.');return batch; }
  const {data,error}=await getRequestDb().from('patient_import_batches').select('id,payload,results,created_at,status').eq('id',id).maybeSingle();dbError(error);
  if(!data)throw new CareError(404,'Lote no encontrado.');return {...data.payload,id:data.id,results:data.results,created_at:data.created_at,status:data.status} as ImportBatch;
}
export async function saveImportBatch(input:ImportBatchInput,persistent:boolean):Promise<ImportBatch> {
  const payload=contactSnapshot(input);
  if (persistent) { const {error}=await getRequestDb().rpc('prepare_patient_import',{batch_id:input.id,payload_value:payload});dbError(error);return readImportBatch(input.id,true); }
  const current=batches.get(input.id);
  if(current){if(!isDeepStrictEqual(contactSnapshot(current),payload))throw new CareError(409,'Ese lote ya contiene otra revisión.');return current;}
  const batch:ImportBatch={...payload,results:[],created_at:new Date().toISOString(),status:'review'};batches.set(batch.id,batch);return batch;
}
function memoryPatient(row:ImportCandidate):Patient {
  return {id:randomUUID(),name:row.name,initials:row.name.split(/\s+/).map(n=>n[0]).slice(0,2).join('').toUpperCase(),tone:'mint',status:'Ingreso',archived_at:null,billing_status:'pending',billing_until:null,has_account:false,created_at:new Date().toISOString(),stage:'ingreso',goal:'',sensitive_hours:'',plan_b:'',next_focus:'Completar evaluación inicial',adherence_score:0,adherence_why:'Todavía sin registros.',time:'recién',hydration:0,energy:null,sleep_minutes:null,appointment:null,appointment_history:[],habit_logs:[],todayPlan:[],weekPlan:[],brief:null,timeline:[],meal_logs:[],messages:[],resource_assignments:[]};
}
async function applyMemory(row:ImportCandidate):Promise<ImportResult> {
  const result=(status:ImportResult['status'],patient_id:string|null,message:string):ImportResult=>({key:row.key,status,patient_id,message});
  if(row.action==='discard')return result('discarded',null,'Descartado por la profesional.');
  const source=importSourceKey(row);const old=applied.get(source);
  if(old)return result('duplicate',old,'Este origen ya se importó.');
  const match=row.email?(await listImportContacts(false,'')).find(c=>c.email.toLowerCase()===row.email.toLowerCase()):null;
  if(row.action==='create'&&match)return result('duplicate',match.patient_id,'El email ya corresponde a una ficha. Incorporá los datos tras revisarla.');
  if(row.action==='append'&&row.email&&match&&match.patient_id!==row.patient_id)throw new CareError(409,'El email corresponde a otra ficha.');
  if(row.action==='append'){
    if(!getPatient(row.patient_id!))throw new CareError(403,'La ficha no pertenece a este consultorio.');
    if(row.history.length||row.measurements.length)await requireCareConsent(row.patient_id!,false,'care_relationship');
    if(row.measurements.length)await requireCareConsent(row.patient_id!,false,'measurement');
    if(row.history.some(h=>h.category==='study'))await requireCareConsent(row.patient_id!,false,'clinical_document');
  }
  const patient=row.action==='create'?memoryPatient(row):getPatient(row.patient_id!)!;
  if(!(patient as Patient&{phone?:string|null}).phone&&row.phone)Object.assign(patient,{phone:row.phone});
  if(row.action==='create')getStore().patients.push(patient);
  if(!contacts.has(patient.id))contacts.set(patient.id,{patient_id:patient.id,name:patient.name,email:row.email,phone:row.phone});
  else if(!contacts.get(patient.id)!.email&&row.email)contacts.get(patient.id)!.email=row.email;
  for(const m of row.measurements)await saveCareRecord(patient.id,{id:randomUUID(),recorded_on:m.date,data:careDataSchema.parse({kind:m.kind,value:m.value,unit:m.unit,source:'professional',note:`Importado de ${m.origin.file}, fila ${m.origin.row??''}, página ${m.origin.page??''}.`})},false);
  for(const h of row.history){const record:ImportedHistory={id:randomUUID(),patient_id:patient.id,category:h.category,body:h.text,origin:h.origin,created_at:new Date().toISOString()};histories.set(record.id,record);}
  applied.set(source,patient.id);return result(row.action==='create'?'created':'appended',patient.id,row.action==='create'?'Ficha creada sin cuenta ni invitación.':'Datos incorporados sin reemplazar los actuales.');
}
export async function listImportedHistory(patientId:string,persistent:boolean):Promise<ImportedHistory[]> {
  await requireCareConsent(patientId,persistent,'care_relationship');
  if(!persistent){const rows=[...histories.values()].filter(h=>h.patient_id===patientId);try{await requireCareConsent(patientId,false,'clinical_document');return rows;}catch{return rows.filter(h=>h.category!=='study');}}
  const result:ImportedHistory[]=[];
  for(let offset=0;;offset+=250){const {data,error}=await getRequestDb().from('patient_import_history').select('id,patient_id,category,body,origin,created_at').eq('patient_id',patientId).order('created_at',{ascending:false}).order('id').range(offset,offset+249);dbError(error);const rows=(data??[])as ImportedHistory[];result.push(...rows);if(rows.length<250)return result;}
}
/** Only an explicit Invitar action creates an invitation; import itself never does. */
export async function prepareImportedInvite(patientId:string,persistent:boolean){
  if(persistent){const {data,error}=await getRequestDb().rpc('prepare_imported_patient_invite',{target:patientId});dbError(error);if(!data?.id)throw new CareError(409,'Agregá un email válido al contacto antes de invitar.');return sbSendInvite(String(data.id));}
  const patient=getPatient(patientId);const contact=contacts.get(patientId);
  if(!patient||!contact)throw new CareError(404,'No encontramos el contacto importado.');
  if(patient.has_account)throw new CareError(409,'Esta paciente ya vinculó su cuenta.');
  if(!contact.email)throw new CareError(409,'Agregá un email válido al contacto antes de invitar.');
  const existing=getStore().patientInvites.find(i=>i.patient_id===patientId&&(i.status==='pending'||i.status==='not_sent'));
  if(existing)return sendPatientInvite(existing.id)!;
  if(!canOpenInvite(getStore().patientInvites,{patientId,nutritionistId:DEMO_NUTRITIONIST_ID,email:contact.email}))throw new CareError(409,'Ese email ya está vinculado a otra ficha.');
  const invite=createInviteRecord({id:randomUUID(),patientId,nutritionistId:DEMO_NUTRITIONIST_ID,email:contact.email,now:new Date()});getStore().patientInvites.push(invite);return sendPatientInvite(invite.id)!;
}
export async function commitImportBatch(input:ImportBatchInput,persistent:boolean):Promise<ImportBatch> {
  const batch=await readImportBatch(input.id,persistent);
  if(!isDeepStrictEqual({id:batch.id,candidates:batch.candidates},contactSnapshot(input)))throw new CareError(409,'La revisión cambió. Prepará un lote nuevo antes de guardar.');
  for(const row of input.candidates){
    if(batch.results.some(r=>r.key===row.key&&r.status!=='error'))continue;
    const previous=batch.results.find(r=>r.key===row.key);
    const clinicalPending=row.history.length>0||row.measurements.length>0;
    const clinicalDigest=createHash('sha256').update(JSON.stringify({history:row.history,measurements:row.measurements})).digest('hex');
    if(previous?.clinical_pending&&(!clinicalPending||(!persistent&&previous.clinical_digest!==clinicalDigest)))throw new CareError(409,'Releé los archivos originales y revisá los datos clínicos pendientes. No se puede completar esta fila sólo con el contacto.');
    if(persistent){const {error}=await getRequestDb().rpc('apply_patient_import_row',{batch_id:input.id,row_value:row});dbError(error);}
    else {
      let result:ImportResult;try{result=await applyMemory(row);}catch{result={key:row.key,status:'error',patient_id:null,message:'No se guardó esta fila. Revisá la ficha, los datos y sus permisos.'};}
      if(result.status==='error'&&clinicalPending){result.clinical_pending=true;result.clinical_digest=clinicalDigest;}
      batch.results=batch.results.filter(r=>r.key!==row.key).concat(result);
    }
  }
  if(!persistent){batch.status=batch.results.some(r=>r.status==='error')?'partial':'completed';return batch;}
  return readImportBatch(input.id,true);
}
