import { useState } from 'react';
import type { ShowroomPatient } from './showroom-model';
import { FigmaAsset } from './FigmaPatientFront';
import { MealThumbnail } from './PatientOverview';

/** 371:10102..10108: the plan's four slots; checkmarks come from actual logs. */
export function FigmaDailyMeals({ meals, patient, date, today, onPlan, onDiary, onRecord }: {
 meals: ShowroomPatient['todayPlan']; patient: ShowroomPatient; date: string; today: boolean;
 onPlan: () => void; onDiary: () => void; onRecord: (slot: string) => void;
}) {
 const [collapsed, setCollapsed] = useState<Record<string,boolean>>({});
 const slots = meals.length ? meals : ['Desayuno','Almuerzo','Merienda','Cena'].map(slot=>({slot,title:'Sin comida publicada',time:''}));
 return <div className="fp-daily-meals">{slots.map((meal,index)=>{
  const recorded = patient.logs.some(log=>{
   const logged = new Date(log.logged_at);
   if (Number.isNaN(logged.getTime())) return false;
   const iso = `${logged.getFullYear()}-${String(logged.getMonth()+1).padStart(2,'0')}-${String(logged.getDate()).padStart(2,'0')}`;
   return iso===date && log.slot===meal.slot;
  });
  const closed = collapsed[meal.slot]===true;
  return <section key={meal.slot} className={`fp-daily-meal fp-daily-meal-${index%4}`} aria-label={meal.slot}>
   <header><div className="fp-daily-meal-label"><button type="button" role="checkbox" aria-checked={recorded} disabled={!today && !recorded} aria-label={recorded ? `Ver registro de ${meal.slot}` : `Registrar ${meal.slot}`} onClick={()=>recorded?onDiary():onRecord(meal.slot)}>{recorded ? <FigmaAsset name="home-meal-check" size={22} /> : <span className="fp-meal-unchecked" aria-hidden="true" />}</button><span>{meal.slot}</span></div>
    <span className="fp-daily-meal-energy"><FigmaAsset name="home-fire" size={14} />— kcal</span>
    <button type="button" className="fp-daily-collapse" aria-expanded={!closed} aria-label={`${closed?'Mostrar':'Ocultar'} ${meal.slot}`} onClick={()=>setCollapsed(prev=>({...prev,[meal.slot]:!closed}))}><FigmaAsset name="home-meal-up" size={16} className={closed?'fp-is-collapsed':''} /></button>
   </header>
   {!closed && <button type="button" className="fp-daily-meal-body" onClick={onPlan} aria-label={`Ver ${meal.slot} en mi plan`}><MealThumbnail slot={meal.slot} /><span><strong>{meal.title}</strong><span className="fp-daily-nutrients">{[['home-rail-bread','C'],['home-rail-fish','P'],['home-rail-drop','G']].map(([name,label])=><span key={name}><FigmaAsset name={name} size={12} /><small>{label}</small> —</span>)}</span></span></button>}
  </section>;
 })}</div>;
}
