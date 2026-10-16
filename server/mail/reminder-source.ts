import type { SupabaseClient } from '@supabase/supabase-js';
import { privilegedDb } from '../db/supabase-client.js';
import { consentTextByPurpose } from '../intake/consent.js';
import type { DueAppointment } from './reminders.js';
type Row=Record<string,unknown>;
async function all(query:(from:number,to:number)=>PromiseLike<{data:unknown;error:unknown}>):Promise<Row[]> {
 const rows:Row[]=[];
 for(let from=0;;from+=250){const result=await query(from,from+249);if(result.error||!Array.isArray(result.data))throw new Error('Reminder source unavailable');rows.push(...result.data);if(result.data.length<250)return rows;}
}
/** Metadata and current consent only. No clinical fields, no truncation, no implicit email opt-in. */
export async function listDueAppointments(from:string,to:string,db:SupabaseClient=privilegedDb(),onlyId?:string):Promise<DueAppointment[]> {
 const appointments=await all((start,end)=>{let q=db.from('appointments').select('id,starts_at,channel,meet_url,patient_id,nutritionist_id').eq('status','scheduled').gte('starts_at',from).lt('starts_at',to);if(onlyId)q=q.eq('id',onlyId);return q.order('starts_at').order('id').range(start,end);});
 const due:DueAppointment[]=[],care=consentTextByPurpose('care_relationship');
 for(let start=0;start<appointments.length;start+=100){
  const rows=appointments.slice(start,start+100),ids=[...new Set(rows.map(r=>r.patient_id))],clinics=[...new Set(rows.map(r=>r.nutritionist_id))];
  const [patients,professionals,consents]=await Promise.all([
   all((offset,end)=>db.from('patients').select('id,full_name,user_id,nutritionist_id,archived_at,deactivated_at,anonymized_at').in('id',ids).order('id').range(offset,end)),
   all((offset,end)=>db.from('nutritionists').select('id,display_name').in('id',clinics).order('id').range(offset,end)),
   all((offset,end)=>db.from('consent_events').select('patient_id,purpose,decision,text_version,text_hash,sequence').in('patient_id',ids).eq('purpose','care_relationship').order('sequence').order('id').range(offset,end)),
  ]);
  const userIds=patients.map(p=>p.user_id).filter(Boolean);
  const preferences=userIds.length?await all((offset,end)=>db.from('notification_preferences').select('user_id,email').in('user_id',userIds).eq('email',true).order('user_id').range(offset,end)):[];
  const opted=new Set(preferences.map(p=>p.user_id)),latest=new Map(consents.map(c=>[c.patient_id,c]));
  for(const row of rows){
   const p=patients.find(p=>p.id===row.patient_id),n=professionals.find(n=>n.id===row.nutritionist_id),consent=latest.get(row.patient_id);
   if(!p?.user_id||!n||p.nutritionist_id!==row.nutritionist_id||p.archived_at||p.deactivated_at||p.anonymized_at||!opted.has(p.user_id)
     ||consent?.decision!=='granted'||consent.text_version!==care.text_version||consent.text_hash!==care.text_hash)continue;
   const account=await db.auth.admin.getUserById(String(p.user_id));if(account.error)throw new Error('Reminder account unavailable');
   const email=account.data.user?.email_confirmed_at?account.data.user.email??null:null;if(!email)continue;
   due.push({id:String(row.id),starts_at:String(row.starts_at),channel:row.channel==='video'?'video':'presencial',meet_url:row.meet_url?String(row.meet_url):null,patient_name:String(p.full_name??''),patient_email:email,nutritionist_name:String(n.display_name??'')});
  }
 }
 return due;
}
export async function isReminderCurrentlyAllowed(appointment:DueAppointment):Promise<boolean> {
 const until=new Date(Date.parse(appointment.starts_at)+1000).toISOString();
 const current=await listDueAppointments(appointment.starts_at,until,privilegedDb(),appointment.id);
 return current.some(a=>a.id===appointment.id&&a.starts_at===appointment.starts_at&&a.patient_email===appointment.patient_email);
}
