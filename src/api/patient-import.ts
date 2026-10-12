import { request,type PatientInvite } from './client';
import type { ImportBatch,ImportBatchInput,ImportContact,ImportedHistory } from '../types/patient-import';
export const patientImportApi={
  invite:(patientId:string)=>request<{invite:PatientInvite}>(`/api/patient-imports/patients/${encodeURIComponent(patientId)}/invite`,{method:'POST',body:'{}'}),
  contacts:(signal?:AbortSignal)=>request<{contacts:ImportContact[]}>('/api/patient-imports/contacts',{signal}),
  list:(signal?:AbortSignal)=>request<{batches:ImportBatch[]}>('/api/patient-imports',{signal}),
  prepare:(input:ImportBatchInput)=>request<{batch:ImportBatch}>('/api/patient-imports',{method:'POST',body:JSON.stringify(input)}),
  commit:(input:ImportBatchInput)=>request<{batch:ImportBatch}>(`/api/patient-imports/${encodeURIComponent(input.id)}/commit`,{method:'POST',body:JSON.stringify(input)}),
  history:(patientId:string,signal?:AbortSignal)=>request<{history:ImportedHistory[]}>(`/api/patients/${encodeURIComponent(patientId)}/imported-history`,{signal}),
};
