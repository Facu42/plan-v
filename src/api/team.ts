import {request} from './client';
import type {SchedulingBooking,BookingChange} from '../types/scheduling';
import type {PatientLedger,PaymentInput,PaymentDecision,ChargeInput} from '../types/fees';
import type {OrganizationView,CareLinkView} from '../types/orgs';
export type Workplace={nutritionist_id:string;name:string;owner:boolean};
export type ContactCard={id:string;name:string;email:string;phone:string;revision:number};
export type TeamOperations={contacts:ContactCard[];has_more_contacts:boolean;bookings:SchedulingBooking[];has_more:boolean;transfers:Array<{id:string;booking_id:string;amount_minor:number;reference:string}>};
export type ExistingAppointment={id:string;patient_id:string;name:string;starts_at:string;duration_min:number;channel:'video'|'presencial';status:string;meet_url:string|null;google_sync_status:string;booking_id:string|null};
export type SharedClinical={patient:{id:string;name:string;goal:string;status:string};intake:Record<string,unknown>|null;notes:Array<{id:string;body:string;created_at:string}>;can_add_note:boolean};
export type SharedNotesPage={notes:Array<{id:string;body:string;created_at:string;version:number}>;has_more:boolean;next_before_version:number|null};
const json=(method:string,data:unknown)=>({method,body:JSON.stringify(data)}),base=(nid:string)=>`/api/team/${encodeURIComponent(nid)}`;
export const teamApi={
 workplaces:()=>request<{workplaces:Workplace[]}>('/api/team'),
 accept:(token:string)=>request('/api/team/accept',json('POST',{token})),
 invite:(nid:string,email:string)=>request<{token:string;expires_in_days:number}>(`${base(nid)}/invites`,json('POST',{email})),
 members:(nid:string)=>request<{members:Array<{user_id:string;email:string;revoked:boolean}>}>(`${base(nid)}/members`),
 revoke:(nid:string,userId:string)=>request(`${base(nid)}/members/${encodeURIComponent(userId)}`,{method:'DELETE'}),
 operations:(nid:string,offset=0)=>request<TeamOperations>(`${base(nid)}/operations?offset=${offset}`),
 contacts:(nid:string,c:ContactCard)=>request(`${base(nid)}/contacts/${encodeURIComponent(c.id)}`,json('PUT',{name:c.name,email:c.email,phone:c.phone,expected_revision:c.revision})),
 change:(nid:string,id:string,p:BookingChange)=>request(`${base(nid)}/bookings/${encodeURIComponent(id)}/change`,json('POST',p)),
 reviewTransfer:(nid:string,id:string,decision:'confirm'|'reject')=>request(`${base(nid)}/transfers/${encodeURIComponent(id)}/review`,json('POST',{decision})),
 syncAppointment:(nid:string,id:string)=>request(`${base(nid)}/appointments/${encodeURIComponent(id)}/sync`,{method:'POST'}),
 appointments:(nid:string,offset=0)=>request<{appointments:ExistingAppointment[];has_more_appointments:boolean}>(`${base(nid)}/appointments?offset=${offset}`),
 schedule:(nid:string,patient_id:string,appointment:{day:string;time:string;duration:number;channel:'video'|'presencial';timezone:'America/Argentina/Buenos_Aires'}|null)=>request(`${base(nid)}/appointments`,json('POST',{patient_id,appointment})),
 ledger:(nid:string,pid:string)=>request<{ledger:PatientLedger}>(`${base(nid)}/contacts/${encodeURIComponent(pid)}/ledger`),
 payment:(nid:string,pid:string,p:PaymentInput&{client_id:string;note:string})=>request(`${base(nid)}/contacts/${encodeURIComponent(pid)}/payments`,json('POST',p)),
 charge:(nid:string,pid:string,p:ChargeInput&{client_id:string})=>request(`${base(nid)}/contacts/${encodeURIComponent(pid)}/charges`,json('POST',p)),
 reviewPayment:(nid:string,id:string,decision:PaymentDecision)=>request(`${base(nid)}/payments/${encodeURIComponent(id)}/review`,json('POST',{decision})),
 orgs:()=>request<{organizations:OrganizationView[]}>('/api/orgs'),
 createOrg:(name:string,slug:string)=>request('/api/orgs',json('POST',{name,slug})),
 inviteProfessional:(id:string,nutritionist_id:string)=>request(`/api/orgs/${id}/members`,json('POST',{nutritionist_id,role:'member'})),
 inviteProfessionalByEmail:(organization_id:string,email:string)=>request('/api/team/professional-invitations',json('POST',{organization_id,email})),
 professionals:(organizationId:string,signal?:AbortSignal)=>request<{professionals:Array<{nutritionist_id:string;name:string;status:'active'|'invited';is_self:boolean}>}>(`/api/team/professionals/${encodeURIComponent(organizationId)}`,{signal}),
 acceptOrg:(id:string)=>request(`/api/orgs/${id}/members/accept`,{method:'POST'}),
 links:(pid:string)=>request<{links:CareLinkView[]}>(`/api/patients/${pid}/care-links`),
 assign:(pid:string,nutritionist_id:string,organization_id:string,role:'delegate'|'observer')=>request(`/api/patients/${pid}/care-links`,json('POST',{nutritionist_id,organization_id,role})),
 revokeAssignment:(pid:string,id:string)=>request(`/api/patients/${pid}/care-links/${id}`,{method:'DELETE'}),
 shared:(offset=0)=>request<{patients:Array<{id:string;name:string}>}>(`/api/team/shared?offset=${offset}`),
 clinical:(pid:string)=>request<SharedClinical>(`/api/team/shared/${pid}`),
 sharedNotes:(pid:string,beforeVersion?:number,signal?:AbortSignal)=>request<SharedNotesPage>(`/api/team/shared/${encodeURIComponent(pid)}/notes?limit=50${beforeVersion==null?'':`&before_version=${beforeVersion}`}`,{signal}),
 addNote:(pid:string,note:string)=>request(`/api/team/shared/${pid}/notes`,json('POST',{note})),
};
