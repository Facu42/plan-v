import type { WeeklyRegistration } from '../../src/types/weekly-registration.js';
import { argentinaToday, shiftIsoDate } from './derive.js';

type Input = {
  meals: readonly {id:string;logged_at:string;status:string}[];
  habits: readonly {date:string;hydration:number;hydration_declared?:boolean;energy?:string|null;sleep_minutes?:number|null;steps?:number|null}[];
  pendingCare:number;
};
export function deriveWeeklyRegistration(input:Input, now=new Date()):WeeklyRegistration {
  const end=argentinaToday(now),start=shiftIsoDate(end,-6);
  const days=new Set<string>();
  let meals_logged=0,meals_pending=0,water_days=0,water_total=0;
  let allPending=0;
  for(const meal of input.meals) {
    if(meal.status==='pending_review') allPending++;
    const at=new Date(meal.logged_at);if(Number.isNaN(at.getTime()))continue;
    const date=argentinaToday(at);if(date<start||date>end)continue;
    days.add(date);meals_logged++;if(meal.status==='pending_review')meals_pending++;
  }
  for(const habit of input.habits) {
    if(habit.date<start||habit.date>end)continue;
    const water=habit.hydration_declared===true||habit.hydration>0;
    if(water||habit.energy!=null||habit.sleep_minutes!=null||habit.steps!=null) days.add(habit.date);
    if(water){water_days++;water_total+=habit.hydration;}
  }
  return {start,end,recorded_days:days.size,meals_logged,meals_pending,water_days,water_average:water_days?Math.round(water_total/water_days*10)/10:null,pending_review:allPending+input.pendingCare};
}
