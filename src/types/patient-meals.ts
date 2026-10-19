import type { MealLog } from './index';
export type PatientMealQuery={offset?:number;limit?:number;days?:7|30;status?:'all'|'pending_review'|'reviewed'};
export type PatientMealPage={patient_id:string;logs:MealLog[];has_more:boolean;next_offset:number|null;source:'memory'|'supabase'};
