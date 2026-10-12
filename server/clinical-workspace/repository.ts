import { createHash } from 'node:crypto';
import { getRequestDb } from '../db/supabase-client.js';
import { registerDemoState } from '../demo/state.js';
import { CareError } from '../care/errors.js';
import { currentCareConsents,requireCareConsent } from '../care/consents.js';
import { ingestReadyAsset,accessPrivateAsset,withdrawPrivateAsset } from '../assets/repository.js';
import { parseDataUrl } from '../assets/inspect.js';
import { PDFDocument } from 'pdf-lib';
import { BYTE_LIMIT_BY_CATEGORY,PATIENT_QUOTA } from '../assets/types.js';
import { recordMemoryAccess } from '../privacy/repository.js';
import type { ClinicalDocument,ClinicalWorkspaceInput,ClinicalWorkspaceRecord,ClinicalWorkspaceSnapshot,MethodReference,ClinicBrand } from '../../src/types/clinical-workspace.js';
const records=new Map<string,ClinicalWorkspaceRecord>();const documents=new Map<string,ClinicalDocument>();const references=new Map<string,MethodReference>();const brands=new Map<string,ClinicBrand>();
registerDemoState('clinical-workspace',()=>({records,documents,references,brands}));
export async function auditClinicalAccess(patientId:string,action:'read'|'export'|'document',persistent:boolean){
  if(persistent){const {error:e}=await getRequestDb().rpc('audit_clinical_access',{target:patientId,access_action:action});error(e);}
  else recordMemoryAccess({patientId,action:`clinical_${action}`,objectType:'clinical_workspace'});
}
export function resetClinicalWorkspaceMemory(){records.clear();documents.clear();references.clear();brands.clear();}
function error(error:{code?:string}|null){if(!error)return;if(['42P01','42883','PGRST202','PGRST205'].includes(error.code??''))throw new CareError(501,'Falta habilitar el módulo clínico en este entorno.');if(error.code==='42501')throw new CareError(403,'Falta permiso vigente, referencia aprobada o documento propio.');if(error.code==='PT409'||error.code==='23505')throw new CareError(409,'El registro ya contiene otros datos. Conservá los cambios y recargá.');if(['22023','22P02','23514'].includes(error.code??''))throw new CareError(400,'Revisá los datos, unidades y fechas.');throw new CareError(503,'No se pudo confirmar el guardado. Reintentá sin cambiar el identificador.');}
async function allRows<T>(table:string,scope:string,value:string):Promise<T[]>{const all:T[]=[];for(let offset=0;;offset+=250){const result=await getRequestDb().from(table).select('*').eq(scope,value).order('id').range(offset,offset+249);error(result.error);const rows=(result.data??[])as T[];all.push(...rows);if(rows.length<250)return all;}}
export async function referenceList(nutritionistId:string,persistent:boolean){return persistent?allRows<MethodReference>('clinical_method_references','nutritionist_id',nutritionistId):[...references.values()].filter(r=>r.nutritionist_id===nutritionistId);}
export async function saveReference(nutritionistId:string,input:Omit<MethodReference,'nutritionist_id'|'approved_at'|'active'>,persistent:boolean):Promise<MethodReference>{
  if(persistent){const {data,error:e}=await getRequestDb().rpc('approve_clinical_reference',{payload:input});error(e);return data as MethodReference;}
  const old=references.get(input.id);if(old){if(old.nutritionist_id!==nutritionistId||JSON.stringify({...input})!==JSON.stringify({id:old.id,method:old.method,title:old.title,source_url:old.source_url,notes:old.notes,approved:old.approved}))throw new CareError(409,'La referencia ya contiene otra aprobación.');return old;}
  const saved={...input,nutritionist_id:nutritionistId,approved_at:new Date().toISOString(),active:true};references.set(saved.id,saved);return saved;
}
export async function revokeReference(nutritionistId:string,id:string,persistent:boolean){if(persistent){const {error:e}=await getRequestDb().rpc('deactivate_clinical_reference',{reference_id:id});error(e);return;}const ref=references.get(id);if(!ref||ref.nutritionist_id!==nutritionistId)throw new CareError(403,'Referencia no disponible.');ref.active=false;}
export async function saveBrand(nutritionistId:string,brand:ClinicBrand,persistent:boolean){if(persistent){const {error:e}=await getRequestDb().rpc('save_clinical_brand',{payload:brand});error(e);}else brands.set(nutritionistId,brand);return brand;}
export async function clinicalSnapshot(patientId:string,nutritionistId:string,persistent:boolean):Promise<ClinicalWorkspaceSnapshot>{
  await requireCareConsent(patientId,persistent,'care_relationship');const consented=(await currentCareConsents(patientId,persistent)).consented;
  await auditClinicalAccess(patientId,'read',persistent);
  const rows=persistent?await allRows<ClinicalWorkspaceRecord>('clinical_workspace_records','patient_id',patientId):[...records.values()].filter(r=>r.patient_id===patientId);
  const docs=consented.includes('clinical_document')?(persistent?await allRows<ClinicalDocument>('clinical_source_documents','patient_id',patientId):[...documents.values()].filter(d=>d.patient_id===patientId)):[];
  let brand=brands.get(nutritionistId)??null;if(persistent){const {data,error:e}=await getRequestDb().from('clinical_clinic_brands').select('data').eq('nutritionist_id',nutritionistId).maybeSingle();error(e);brand=data?.data??null;}
  return {records:rows.filter(r=>{
    if('document_id'in r.data&&r.data.document_id&&!consented.includes('clinical_document'))return false;
    return r.data.kind==='laboratory'?consented.includes('clinical_document'):r.data.kind==='study_order'||consented.includes('measurement');
  }).sort((a,b)=>b.recorded_on.localeCompare(a.recorded_on)||b.created_at.localeCompare(a.created_at)),documents:docs,references:await referenceList(nutritionistId,persistent),brand};
}
export async function saveDocument(patientId:string,nutritionistId:string,input:{id:string;filename:string;file:string;source_sha256:string},persistent:boolean):Promise<ClinicalDocument>{
  await requireCareConsent(patientId,persistent,'care_relationship');await requireCareConsent(patientId,persistent,'clinical_document');
  const parsed=parseDataUrl(input.file);
  if(parsed.bytes.length>BYTE_LIMIT_BY_CATEGORY.clinical_document)throw new CareError(413,'Cada documento debe pesar hasta 20 MB.');
  const hash=createHash('sha256').update(parsed.bytes).digest('hex');if(hash!==input.source_sha256)throw new CareError(400,'El archivo cambió desde la extracción. Volvé a leerlo.');
  if(parsed.mime==='application/pdf'){
    // Object streams hide /Type /Page markers: parse the actual tree before storing.
    let pdf:PDFDocument;try{pdf=await PDFDocument.load(parsed.bytes,{updateMetadata:false});}catch{throw new CareError(400,'El PDF está dañado o protegido. Usá un PDF legible.');}
    if(pdf.getPageCount()<1||pdf.getPageCount()>PATIENT_QUOTA.maxPdfPages)throw new CareError(400,'El PDF debe tener entre una y 40 páginas.');
  }
  const previous=persistent?await allRows<ClinicalDocument>('clinical_source_documents','patient_id',patientId):[...documents.values()].filter(d=>d.patient_id===patientId);
  const old=previous.find(d=>d.id===input.id||d.source_sha256===hash);if(old){if(old.source_sha256!==hash)throw new CareError(409,'Ese identificador corresponde a otro archivo.');return old;}
  const asset=await ingestReadyAsset({patientId,nutritionistId,category:'clinical_document',dataUrl:input.file,persistent});
  try{
    const metadata={id:input.id,filename:input.filename,source_sha256:hash,asset_id:asset.id};
    if(persistent){const {data,error:e}=await getRequestDb().rpc('save_clinical_source_document',{target:patientId,payload:metadata});error(e);const saved=data as ClinicalDocument;if(saved.asset_id!==asset.id)await withdrawPrivateAsset(asset.id,patientId,persistent);return saved;}
    await requireCareConsent(patientId,false,'clinical_document');const saved={...metadata,patient_id:patientId,mime:asset.mime,created_at:new Date().toISOString()};documents.set(saved.id,saved);return saved;
  }catch(caught){await withdrawPrivateAsset(asset.id,patientId,persistent).catch(()=>{});throw caught;}
}
export async function openClinicalDocument(patientId:string,documentId:string,persistent:boolean){await requireCareConsent(patientId,persistent,'care_relationship');await requireCareConsent(patientId,persistent,'clinical_document');const rows=persistent?await allRows<ClinicalDocument>('clinical_source_documents','patient_id',patientId):[...documents.values()].filter(d=>d.patient_id===patientId);const document=rows.find(d=>d.id===documentId);if(!document)throw new CareError(404,'Documento fuente no encontrado.');await auditClinicalAccess(patientId,'document',persistent);return {...await accessPrivateAsset(document.asset_id,patientId,persistent),filename:document.filename};}
export async function saveClinicalRecord(patientId:string,nutritionistId:string,input:ClinicalWorkspaceInput,persistent:boolean):Promise<ClinicalWorkspaceRecord>{
  await requireCareConsent(patientId,persistent,'care_relationship');const d=input.data;
  await requireCareConsent(patientId,persistent,d.kind==='laboratory'?'clinical_document':d.kind==='study_order'?'care_relationship':'measurement');
  if(persistent){const {data,error:e}=await getRequestDb().rpc('save_clinical_workspace_record',{target:patientId,payload:input});error(e);return data as ClinicalWorkspaceRecord;}
  if('reference_id'in d){const ref=references.get(d.reference_id);if(!ref?.active||ref.nutritionist_id!==nutritionistId||ref.method!==d.kind)throw new CareError(403,'Aprobá una referencia propia del método antes de registrar resultados.');}
  if('document_id'in d&&d.document_id){await requireCareConsent(patientId,false,'clinical_document');if(documents.get(d.document_id)?.patient_id!==patientId)throw new CareError(403,'El documento fuente no pertenece a esta paciente.');}
  const old=records.get(input.id);if(old){if(old.patient_id!==patientId||JSON.stringify({id:old.id,recorded_on:old.recorded_on,data:old.data,note:old.note,reviewed:old.reviewed})!==JSON.stringify(input))throw new CareError(409,'Ese registro ya contiene otros datos.');return old;}
  const saved={...input,patient_id:patientId,created_at:new Date().toISOString(),reference_snapshot:'reference_id'in d?structuredClone(references.get(d.reference_id)??null):null};records.set(saved.id,saved);return saved;
}
