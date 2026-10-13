import {isSupabaseEnabled,privilegedDb} from '../db/supabase-client.js';
import {schedulingDbError} from './repository.js';
import {syncGoogleBooking,syncGoogleAppointment,type GoogleWriteGuard} from './providers.js';
import type {SchedulingBooking,SchedulingSettings} from '../../src/types/scheduling.js';
function writeGuard(db:ReturnType<typeof privilegedDb>,kind:'booking'|'appointment',target:string,token:string,revision:number,profileRevision:()=>number|null){
 let issued=false;
 const check=async(epoch:string,issue:boolean)=>{
  const r=await db.rpc('scheduling_guard_google_write',{kind,target,token,expected_revision:revision,expected_epoch:epoch,issue,profile_revision:profileRevision()});schedulingDbError(r.error);
  if(r.data===true&&issue)issued=true;return r.data===true;
 };
 const guard:GoogleWriteGuard={authorize:epoch=>check(epoch,false),beforeWrite:epoch=>check(epoch,true)};
 return {guard,get issued(){return issued;},async uncertain(){const r=await db.rpc('scheduling_mark_google_uncertain',{kind,target,token});schedulingDbError(r.error);}};
}
async function runManualAppointments(limit:number){
 const db=privilegedDb();let completed=0;
 for(let n=0;n<Math.min(limit,10);n++){
  const claim=await db.rpc('scheduling_claim_appointment_sync');schedulingDbError(claim.error);
  const j=claim.data as {appointment_id:string;run_token:string;revision:number}|null;if(!j)break;
  let profileRevision:number|null=null;const fence=writeGuard(db,'appointment',j.appointment_id,j.run_token,j.revision,()=>profileRevision);
  try{
   const row=await db.from('appointments').select('id,nutritionist_id,patient_id,starts_at,duration_min,channel,status').eq('id',j.appointment_id).single();schedulingDbError(row.error);const a=row.data!;
   const [profile,patient]=await Promise.all([db.from('scheduling_profiles').select('config,revision').eq('nutritionist_id',a.nutritionist_id).single(),db.from('patients').select('deactivated_at,anonymized_at').eq('id',a.patient_id).eq('nutritionist_id',a.nutritionist_id).single()]);schedulingDbError(profile.error);schedulingDbError(patient.error);profileRevision=profile.data!.revision;
   const config=profile.data!.config as SchedulingSettings;if(!config.google_enabled||patient.data?.deactivated_at||patient.data?.anonymized_at)throw new Error('disconnected_or_withdrawn');
   const meet=await syncGoogleAppointment({...a,revision:j.revision},config,fence.guard);
   const finish=await db.rpc('scheduling_complete_appointment_sync',{aid:j.appointment_id,token:j.run_token,expected_revision:j.revision,meet,failure:null});schedulingDbError(finish.error);
   if(finish.data)completed++;else if(fence.issued)await fence.uncertain();
  }catch{
   if(fence.issued)await fence.uncertain();
   else{const fail=await db.rpc('scheduling_complete_appointment_sync',{aid:j.appointment_id,token:j.run_token,expected_revision:j.revision,meet:null,failure:'No se pudo sincronizar. Revisá la conexión y reintentá desde el equipo.'});schedulingDbError(fail.error);}
  }
 }
 return completed;
}
export async function runSchedulingSyncJobs(limit=2){
 if(!isSupabaseEnabled())return 0;const db=privilegedDb();let completed=0;
 for(let index=0;index<Math.min(limit,10);index++){
  const r=await db.rpc('scheduling_claim_sync_job');schedulingDbError(r.error);const j=r.data as {id:string;booking_id:string;revision:number;run_token:string}|null;if(!j)break;
  let profileRevision:number|null=null;const fence=writeGuard(db,'booking',j.id,j.run_token,j.revision,()=>profileRevision);
  try{
   const b=await db.from('scheduling_bookings').select('*').eq('id',j.booking_id).single();schedulingDbError(b.error);const booking=b.data as SchedulingBooking;if(booking.revision!==j.revision)throw new Error('stale_booking');
   const p=await db.from('scheduling_profiles').select('config,revision').eq('nutritionist_id',booking.nutritionist_id).single();schedulingDbError(p.error);profileRevision=p.data!.revision;const config=p.data!.config as SchedulingSettings;if(!config.google_enabled)throw new Error('disconnected');
   const meet=await syncGoogleBooking(booking,config,true,fence.guard);
   const finished=await db.rpc('scheduling_complete_sync_job',{job:j.id,token:j.run_token,meet,failure:null});schedulingDbError(finished.error);if(finished.data)completed++;else if(fence.issued)await fence.uncertain();
  }catch{
   if(fence.issued)await fence.uncertain();
   else{const failed=await db.rpc('scheduling_complete_sync_job',{job:j.id,token:j.run_token,meet:null,failure:'No se pudo sincronizar. Revisá la conexión y la reserva antes de reintentar.'});schedulingDbError(failed.error);}
  }
 }
 return completed+await runManualAppointments(limit);
}
