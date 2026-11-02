import { request } from './client';
import type { Patient } from '../types';
import type { ClinicalNoteRecord,PatientIntakeView } from '../types/intake';
import type { Measurement } from '../types/care';
import type { ImportedHistory } from '../types/patient-import';
import type { ImportedMeasurement } from '../types/import-authorization';
import type { ImportedClinicalExport } from '../types/clinical-export';
import type { ClinicBrand,ClinicalDocument,ClinicalWorkspaceInput,ClinicalWorkspaceRecord,ClinicalWorkspaceSnapshot,MethodReference } from '../types/clinical-workspace';
const base=(id:string)=>`/api/patients/${encodeURIComponent(id)}/clinical-workspace`;
export type ClinicalExportPackage={patient:Patient;snapshot:ClinicalWorkspaceSnapshot;intake:PatientIntakeView['intake'];clinical_notes:ClinicalNoteRecord[];measurements:Measurement[];imported_history:ImportedHistory[];imported_measurements:ImportedMeasurement[];consented:string[]};
export type LabReadingRequest={date:string;previous_date:string|null;rows:Array<{name:string;value:string;unit:string;range?:string;previous?:string}>};
export type LabDraftValue={name:string;value:string;unit:string;range:string;reviewed:false};
export type LabDraft={values:LabDraftValue[];reviewed:false};
export type BioimpedanceValues={weight_kg:number|null;body_fat_pct:number|null;muscle_kg:number|null;water_pct:number|null;visceral_fat:number|null};
export type BioimpedancePreview={values:BioimpedanceValues;reviewed:false};
export type BioimpedanceReview={id:string;recorded_on:string;values:BioimpedanceValues;reviewed:true};
export type BioimpedanceRecord={id:string;recorded_on:string;values:BioimpedanceValues;reviewed_at:string};
export const clinicalWorkspaceApi={
  snapshot:(id:string,signal?:AbortSignal)=>request<ClinicalWorkspaceSnapshot>(base(id),{signal}),
  save:(id:string,input:ClinicalWorkspaceInput)=>request<{record:ClinicalWorkspaceRecord}>(`${base(id)}/records`,{method:'POST',body:JSON.stringify(input)}),
  reference:(input:Omit<MethodReference,'nutritionist_id'|'approved_at'|'active'>)=>request<{reference:MethodReference}>('/api/clinical/references',{method:'POST',body:JSON.stringify(input)}),
  revokeReference:(id:string)=>request(`/api/clinical/references/${encodeURIComponent(id)}`,{method:'DELETE'}),
  brand:(input:ClinicBrand)=>request<{brand:ClinicBrand}>('/api/clinical/brand',{method:'PUT',body:JSON.stringify(input)}),
  document:(id:string,input:{id:string;filename:string;source_sha256:string;file:string})=>request<{document:ClinicalDocument}>(`${base(id)}/documents`,{method:'POST',body:JSON.stringify(input)}),
  openDocument:(id:string,docId:string)=>request<{url:string;filename:string;mime:string}>(`${base(id)}/documents/${encodeURIComponent(docId)}`),
  labReading:(id:string,reading:LabReadingRequest,requestId:string)=>request<{text:string;mode:'ai'}>(`${base(id)}/lab-reading`,{method:'POST',body:JSON.stringify({request_id:requestId,reading})}),
  labDraft:(id:string,text:string)=>request<LabDraft>(`${base(id)}/lab-reading/draft`,{method:'POST',body:JSON.stringify({text})}),
  bioimpedancePreview:(id:string,text:string)=>request<BioimpedancePreview>(`${base(id)}/bioimpedance/preview`,{method:'POST',body:JSON.stringify({text})}),
  bioimpedanceSave:(id:string,body:BioimpedanceReview)=>request<{record:unknown}>(`${base(id)}/bioimpedance`,{method:'POST',body:JSON.stringify(body)}),
  bioimpedanceList:(id:string,signal?:AbortSignal)=>request<{records:BioimpedanceRecord[]}>(`${base(id)}/bioimpedance`,{signal}),
  export:(id:string)=>request<ClinicalExportPackage>(`${base(id)}/export`),
  importedExport:(id:string,signal?:AbortSignal)=>request<ImportedClinicalExport>(`${base(id)}/imported-export`,{signal}),
};
