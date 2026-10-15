import {request as apiRequest} from './client';
// OAuth callback cookies and booking tokens use the narrow web-origin proxy.
const request = <T>(path:string,init?:RequestInit)=>apiRequest<T>(path,init,'');
import type {SchedulingSettings,SchedulingBooking,PublicSchedulingPage,PublicBookingInput,PublicBookingReceipt,BookingChange,SchedulingSlot} from '../types/scheduling';
export type SchedulingWorkspaceSnapshot={profile:{nutritionist_id:string;config:SchedulingSettings;revision:number};connections:{google:boolean;mercadopago:boolean};available:{google:boolean;mercadopago:boolean};bookings:SchedulingBooking[];transfers:Array<{id:string;booking_id:string;amount_minor:number;reference:string}>;has_more:boolean};
const json=(method:string,data:unknown)=>({method,body:JSON.stringify(data)}),base=(slug:string)=>`/api/public/scheduling/${encodeURIComponent(slug)}`,manage=(slug:string,id:string)=>`${base(slug)}/bookings/${encodeURIComponent(id)}`;
export const schedulingApi={
 workspace:(offset=0,signal?:AbortSignal)=>request<SchedulingWorkspaceSnapshot>(`/api/scheduling?offset=${offset}`,{signal}),
 save:(expected_revision:number,config:SchedulingSettings)=>request('/api/scheduling/settings',json('PUT',{expected_revision,config})),
 change:(id:string,input:BookingChange)=>request(`/api/scheduling/bookings/${encodeURIComponent(id)}/change`,json('POST',input)),
 connection:(provider:'google'|'mercadopago')=>request<{url:string}>(`/api/scheduling/connections/${provider}/start`,{method:'POST',credentials:'include'}),
 disconnect:(provider:'google'|'mercadopago')=>request(`/api/scheduling/connections/${provider}`,{method:'DELETE'}),
 sync:(id:string)=>request(`/api/scheduling/bookings/${encodeURIComponent(id)}/sync`,{method:'POST'}),
 reconcile:(id:string)=>request<{checked:number}>(`/api/scheduling/bookings/${encodeURIComponent(id)}/reconcile`,{method:'POST'}),
 reviewTransfer:(id:string,decision:'confirm'|'reject')=>request(`/api/scheduling/transfers/${encodeURIComponent(id)}/review`,json('POST',{decision})),
 page:(slug:string,signal?:AbortSignal)=>request<PublicSchedulingPage>(base(slug),{signal}),
 slots:(slug:string,typeId:string,date:string,signal?:AbortSignal)=>request<{slots:SchedulingSlot[]}>(`${base(slug)}/slots?type_id=${encodeURIComponent(typeId)}&date=${encodeURIComponent(date)}`,{signal}),
 book:(slug:string,input:PublicBookingInput)=>request<{booking:PublicBookingReceipt;token:string}>(`${base(slug)}/bookings`,json('POST',input)),
 receipt:(slug:string,id:string,token:string)=>request<{booking:PublicBookingReceipt}>(manage(slug,id),{headers:{'x-booking-token':token}}),
 manage:(slug:string,id:string,token:string,input:BookingChange)=>request<{booking:PublicBookingReceipt}>(`${manage(slug,id)}/change`,{...json('POST',input),headers:{'x-booking-token':token}}),
 checkout:(slug:string,id:string,token:string,mode:'deposit'|'full')=>request<{url:string}>(`${manage(slug,id)}/checkout`,{...json('POST',{mode}),headers:{'x-booking-token':token}}),
 transfer:(slug:string,id:string,token:string,data:{id:string;amount_minor:number;reference:string})=>request(`${manage(slug,id)}/transfer`,{...json('POST',data),headers:{'x-booking-token':token}}),
};
