import { request } from './client';
import type { OrganizerItem,OrganizerJob,OrganizerProposal } from '../types/document-organizer';
const path=(patientId:string)=>`/api/patients/${encodeURIComponent(patientId)}/document-organizer`;
export const documentOrganizerApi={
 list:(patientId:string,sourceHash:string,signal?:AbortSignal)=>request<{jobs:OrganizerJob[]}>(`${path(patientId)}?source_hash=${sourceHash}`,{signal}),
 prepare:(patientId:string,items:OrganizerItem[],requestKey:string,signal?:AbortSignal)=>request<{job:OrganizerJob}>(path(patientId),{method:'POST',body:JSON.stringify({request_key:requestKey,items}),signal}),
 read:(patientId:string,jobId:string,signal?:AbortSignal)=>request<{job:OrganizerJob}>(`${path(patientId)}/${encodeURIComponent(jobId)}`,{signal}),
 review:(patientId:string,job:OrganizerJob,choices:OrganizerProposal[],signal?:AbortSignal)=>request<{job:OrganizerJob}>(`${path(patientId)}/${encodeURIComponent(job.id)}/review`,{method:'POST',body:JSON.stringify({revision:job.revision,choices}),signal}),
};
function canonical(value:unknown):unknown{if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>[k,canonical(v)]));return value;}
export async function organizerSourceHash(items:OrganizerItem[]):Promise<string>{const bytes=new TextEncoder().encode(JSON.stringify(canonical(items)));const result=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(result)].map(x=>x.toString(16).padStart(2,'0')).join('');}
