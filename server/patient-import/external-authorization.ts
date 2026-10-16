import {randomUUID} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {getRequestDb} from '../db/supabase-client.js';
import {CareError} from '../care/errors.js';
import {currentCareConsents} from '../care/consents.js';
import {listConsentEvents} from '../intake/memory.js';
import type {ConsentPurpose} from '../intake/consent.js';
import {registerDemoState} from '../demo/state.js';
import {getPatient} from '../store.js';
import type {ImportAuthorizationInput,ImportAuthorizationRevoke,ImportAuthorizationState,ImportPurpose,ImportedMeasurement} from '../../src/types/import-authorization.js';
import type {ImportMeasurement} from '../../src/types/patient-import.js';
const authorizations=new Map<string,NonNullable<ImportAuthorizationState['evidence']>>(),measurements=new Map<string,ImportedMeasurement>();
registerDemoState('import-external-authorization',()=>({authorizations,measurements}));
export function resetImportAuthorizations(){authorizations.clear();measurements.clear();}
const purposes:ImportPurpose[]=['history','study','plan','measurement'];
function dbError(error:{code?:string}|null){if(!error)return;if(error.code==='42501')throw new CareError(403,'La evidencia requiere una ficha propia sin cuenta y no puede reemplazar un permiso retirado.');if(error.code==='PT409'||error.code==='23505')throw new CareError(409,'La evidencia cambió. Recargá y revisá la versión vigente.');if(['22023','23514','22P02'].includes(error.code??''))throw new CareError(400,'Revisá la fecha, documento, propósitos y confirmación de la evidencia.');if(['42P01','42883','PGRST202','PGRST205'].includes(error.code??''))throw new CareError(501,'Falta instalar el módulo de autorización de importación.');throw new CareError(503,'No pudimos confirmar la evidencia. Reintentá con la misma revisión.');}
function memoryEntries(patientId:string){return [...authorizations.values()].filter(a=>a.patient_id===patientId).sort((a,b)=>b.revision-a.revision);}
function withdrawn(patientId:string,purpose:ImportPurpose){const relevant:ConsentPurpose[]=['care_relationship',purpose==='study'?'clinical_document':purpose==='measurement'?'measurement':'care_relationship'];const latest=new Map(listConsentEvents(patientId).map(c=>[c.purpose,c]));return relevant.some(p=>latest.get(p)?.decision==='withdrawn');}
export async function externalImportAllowed(patientId:string,purpose:ImportPurpose,persistent:boolean){if(persistent){const r=await getRequestDb().rpc('patient_import_external_allowed',{target:patientId,purpose_value:purpose});dbError(r.error);return r.data===true;}const patient=getPatient(patientId),last=memoryEntries(patientId)[0];return patient?.has_account===false&&!patient.archived_at&&last?.decision==='granted'&&'purposes'in last.evidence&&last.evidence.purposes.includes(purpose)&&!withdrawn(patientId,purpose);}
export async function importAuthorizationState(patientId:string,persistent:boolean):Promise<ImportAuthorizationState>{
 if(persistent){const r=await getRequestDb().rpc('patient_import_authorization_state',{target:patientId});dbError(r.error);if(!r.data)throw new CareError(503,'No se pudo leer la autorización vigente.');return r.data as ImportAuthorizationState;}
 const patient=getPatient(patientId);if(!patient)throw new CareError(403,'La ficha no pertenece a este consultorio.');const evidence=memoryEntries(patientId)[0]??null,consent=await currentCareConsents(patientId,false),care=consent.consented.includes('care_relationship');const allowed={}as Record<ImportPurpose,boolean>;for(const p of purposes)allowed[p]=Boolean(await externalImportAllowed(patientId,p,false)||care&&(p!=='study'||consent.consented.includes('clinical_document'))&&(p!=='measurement'||consent.consented.includes('measurement')));return {patient_id:patientId,revision:evidence?.revision??0,account_linked:patient.has_account!==false,evidence,allowed};
}
export async function recordImportAuthorization(patientId:string,input:ImportAuthorizationInput,persistent:boolean){
 const {request_key,expected_revision,...evidence}=input;
 if(persistent){const r=await getRequestDb().rpc('record_patient_import_authorization',{target:patientId,key_value:request_key,expected_revision,payload:evidence});dbError(r.error);return r.data as ImportAuthorizationState;}
 const state=await importAuthorizationState(patientId,false);if(state.account_linked||getPatient(patientId)?.archived_at||evidence.purposes.some(p=>withdrawn(patientId,p)))throw new CareError(403,'La evidencia no reemplaza los permisos de una cuenta ni un retiro previo.');
 const prior=[...authorizations.values()].find(a=>a.request_key===request_key);if(prior){if(prior.patient_id!==patientId||prior.decision!=='granted'||!isDeepStrictEqual(prior.evidence,evidence))throw new CareError(409,'La solicitud ya identifica otra evidencia.');return state;}
 const retired=memoryEntries(patientId).find(a=>a.decision==='revoked');if(retired&&(evidence.obtained_on<=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires'}).format(new Date(retired.created_at))||memoryEntries(patientId).some(a=>a.decision==='granted'&&'document'in a.evidence&&a.evidence.document.fingerprint===evidence.document.fingerprint&&a.revision<retired.revision)))throw new CareError(403,'La evidencia anterior no puede restablecer una autorización retirada.');
 if(state.revision!==expected_revision)throw new CareError(409,'La revisión de evidencia cambió.');
 authorizations.set(request_key,{id:randomUUID(),patient_id:patientId,request_key,revision:state.revision+1,decision:'granted',evidence,created_at:new Date().toISOString()});return importAuthorizationState(patientId,false);
}
export async function revokeImportAuthorization(patientId:string,input:ImportAuthorizationRevoke,persistent:boolean){
 if(persistent){const r=await getRequestDb().rpc('revoke_patient_import_authorization',{target:patientId,key_value:input.request_key,expected_revision:input.expected_revision,reason_value:input.reason});dbError(r.error);return r.data as ImportAuthorizationState;}
 const state=await importAuthorizationState(patientId,false),prior=[...authorizations.values()].find(a=>a.request_key===input.request_key);if(prior){if(prior.patient_id!==patientId||prior.decision!=='revoked'||!isDeepStrictEqual(prior.evidence,{reason:input.reason}))throw new CareError(409,'La solicitud ya identifica otra evidencia.');return state;}if(!state.revision||state.revision!==input.expected_revision)throw new CareError(409,'La revisión de evidencia cambió.');authorizations.set(input.request_key,{id:randomUUID(),patient_id:patientId,request_key:input.request_key,revision:state.revision+1,decision:'revoked',evidence:{reason:input.reason},created_at:new Date().toISOString()});return importAuthorizationState(patientId,false);
}
export function saveImportedMeasurement(patientId:string,item:ImportMeasurement){const r:ImportedMeasurement={id:randomUUID(),patient_id:patientId,kind:item.kind,value:item.value,unit:item.unit,recorded_on:item.date,origin:item.origin,created_at:new Date().toISOString()};measurements.set(r.id,r);}
export async function listImportedMeasurements(patientId:string,persistent:boolean):Promise<ImportedMeasurement[]>{
 if(!persistent){const allowed=(await importAuthorizationState(patientId,false)).allowed.measurement;return allowed?[...measurements.values()].filter(m=>m.patient_id===patientId):[];}
 const result:ImportedMeasurement[]=[];for(let offset=0;;offset+=250){const r=await getRequestDb().from('patient_import_measurements').select('id,patient_id,kind,value,unit,recorded_on,origin,created_at').eq('patient_id',patientId).order('recorded_on',{ascending:false}).order('id').range(offset,offset+249);dbError(r.error);if(!Array.isArray(r.data))throw new CareError(503,'No se pudieron leer todas las medidas importadas.');result.push(...r.data.map(m=>({...m,value:Number(m.value)})as ImportedMeasurement));if(r.data.length<250)return result;}
}
