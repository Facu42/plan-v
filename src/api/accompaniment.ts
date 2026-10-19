import {request} from './client';
import type {AccompanimentDays,AccompanimentMealPage,AccompanimentMetrics,AssistantSpend} from '../types/accompaniment';
import type {MessageSettings,SaveMessageSettings} from '../types/message-settings';
export const accompanimentApi={
 metrics:(days:AccompanimentDays,signal?:AbortSignal)=>request<AccompanimentMetrics&{source:'memory'|'supabase'}>(`/api/crm/accompaniment/metrics?days=${days}`,{signal}),
 meals:(query:{days:7|30;status:'all'|'pending_review'|'reviewed';patient_id?:string;offset?:number},signal?:AbortSignal)=>request<AccompanimentMealPage>(`/api/crm/accompaniment/meals?${new URLSearchParams(Object.entries(query).filter(([,value])=>value!==undefined&&value!=='').map(([key,value])=>[key,String(value)]))}`,{signal}),
 spend:(signal?:AbortSignal)=>request<AssistantSpend>('/api/crm/accompaniment/spend',{signal}),
 reminders:(request_id:string,patient_ids:string[])=>request<{request_id:string;results:Array<{id:string;status:'sent'|'skipped'|'failed';reason?:string}>}>('/api/crm/accompaniment/reminders',{method:'POST',body:JSON.stringify({request_id,patient_ids})}),
};
export const messageToolsApi={
 load:(signal?:AbortSignal)=>request<MessageSettings>('/api/crm/message-settings',{signal}),
 save:(input:SaveMessageSettings)=>request<MessageSettings>('/api/crm/message-settings',{method:'PUT',body:JSON.stringify(input)}),
};
