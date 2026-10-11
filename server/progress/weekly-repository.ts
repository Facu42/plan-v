import { getRequestDb } from '../db/supabase-client.js';
import { listCareRecords } from '../care/repository.js';
import { deriveWeeklyRegistration } from './weekly-registration.js';
import type { Patient } from '../store.js';
import type { WeeklyRegistration } from '../../src/types/weekly-registration.js';

export async function withWeeklyRegistration<T extends Patient>(patients:T[],persistent:boolean):Promise<Array<T & {weekly_registration:WeeklyRegistration|null}>> {
  if(!patients.length)return [];
  if(persistent){
    const {data,error}=await getRequestDb().rpc('get_weekly_registrations',{patient_ids:patients.map(p=>p.id)});
    // An unavailable aggregate must never be represented as zero activity.
    if(error)return patients.map(p=>({...p,weekly_registration:null}));
    const summaries=data as Record<string,WeeklyRegistration>;
    return patients.map(p=>({...p,weekly_registration:summaries[p.id]??null}));
  }
  const records=await listCareRecords(null,false);
  return patients.map(p=>({...p,weekly_registration:deriveWeeklyRegistration({
    meals:p.meal_logs,habits:p.habit_logs,
    pendingCare:records.filter(r=>r.patient_id===p.id&&!r.reviewed_at&&r.data.kind!=='payment').length,
  })}));
}
