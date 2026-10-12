import { request } from './client';
import type { ConsultationCommand,ConsultationSession,ConsultationView } from '../types/consultations';
import { consultationBase64 } from '../lib/consultation-capture';
const base=(id:string)=>`/api/patients/${encodeURIComponent(id)}/consultations`;
export const consultationsApi={
 list:(id:string,professional=true,offset=0,signal?:AbortSignal)=>request<ConsultationView&{has_more:boolean}>(`${base(id)}?audience=${professional?'pro':'patient'}&offset=${offset}&limit=50`,{signal}),
 command:(id:string,input:ConsultationCommand)=>request<{session:ConsultationSession}>(base(id),{method:'POST',body:JSON.stringify(input)}),
 chunk:(id:string,sessionId:string,index:number,clientId:string,audio:Uint8Array)=>request(`${base(id)}/${encodeURIComponent(sessionId)}/chunks`,{method:'POST',body:JSON.stringify({index,client_id:clientId,audio:consultationBase64(audio),mime:'audio/wav',consent_version:'ai_consultation.v1'})}),
};
