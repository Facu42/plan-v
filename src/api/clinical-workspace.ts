import { request } from './client';
import type { Patient } from '../types';
import type { ClinicalNoteRecord,PatientIntakeView } from '../types/intake';
import type { Measurement } from '../types/care';
import type { ImportedHistory } from '../types/patient-import';
import type { ClinicBrand,ClinicalDocument,ClinicalWorkspaceInput,ClinicalWorkspaceRecord,ClinicalWorkspaceSnapshot,MethodReference } from '../types/clinical-workspace';
const base=(id:string)=>`/api/patients/${encodeURIComponent(id)}/clinical-workspace`;
export type ClinicalExportPackage={patient:Patient;snapshot:ClinicalWorkspaceSnapshot;intake:PatientIntakeView['intake'];clinical_notes:ClinicalNoteRecord[];measurements:Measurement[];imported_history:ImportedHistory[];consented:string[]};
export const clinicalWorkspaceApi={
  snapshot:(id:string,signal?:AbortSignal)=>request<ClinicalWorkspaceSnapshot>(base(id),{signal}),
  save:(id:string,input:ClinicalWorkspaceInput)=>request<{record:ClinicalWorkspaceRecord}>(`${base(id)}/records`,{method:'POST',body:JSON.stringify(input)}),
  reference:(input:Omit<MethodReference,'nutritionist_id'|'approved_at'|'active'>)=>request<{reference:MethodReference}>('/api/clinical/references',{method:'POST',body:JSON.stringify(input)}),
  revokeReference:(id:string)=>request(`/api/clinical/references/${encodeURIComponent(id)}`,{method:'DELETE'}),
  brand:(input:ClinicBrand)=>request<{brand:ClinicBrand}>('/api/clinical/brand',{method:'PUT',body:JSON.stringify(input)}),
  document:(id:string,input:{id:string;filename:string;source_sha256:string;file:string})=>request<{document:ClinicalDocument}>(`${base(id)}/documents`,{method:'POST',body:JSON.stringify(input)}),
  openDocument:(id:string,docId:string)=>request<{url:string;filename:string;mime:string}>(`${base(id)}/documents/${encodeURIComponent(docId)}`),
  export:(id:string)=>request<ClinicalExportPackage>(`${base(id)}/export`),
};
