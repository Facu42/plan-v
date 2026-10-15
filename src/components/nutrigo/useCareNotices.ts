import { useEffect, useState } from 'react';
import { careApi, careErrorMessage } from '../../api/care';
import { dueCareReminders, type CareSnapshot, type CareAlert } from '../../types/care';
import { useCare } from './useCare';

export type CareNotice = { id:string; patient_id:string; title:string; detail:string; target:'ficha'|'diario'|'progreso'|'ejercicio'|'plan'|'inicio'; patient_name?:string };
export function patientCareNotices(patientId:string,snapshot:CareSnapshot,now:Date):CareNotice[] {
  const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires'}).format(now);
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'America/Argentina/Buenos_Aires',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(p=>[p.type,p.value]));
  const minute=Number(parts.hour)*60+Number(parts.minute);
  const entries:CareNotice[]=dueCareReminders(snapshot.records,snapshot.preferences,date).map(r=>({...r,id:`${patientId}:${r.id}`,patient_id:patientId,target:r.id.startsWith('activity:')?'ejercicio':'progreso'}));
  const prefs=snapshot.preferences;
  if(prefs.water&&minute>=540&&minute<1260){const slot=Math.floor((minute-540)/prefs.water_interval);entries.push({id:`${patientId}:water:${date}:${slot}`,patient_id:patientId,title:'Una pausa para tomar agua',detail:'Tu recordatorio de hidratación. Podés registrar tus vasos desde Inicio.',target:'inicio'});}
  const [h,m]=prefs.rest_time.split(':').map(Number);
  if(prefs.rest&&minute>=h*60+m)entries.push({id:`${patientId}:rest:${date}`,patient_id:patientId,title:'Momento de descansar',detail:'Hacé una pausa y prepará tu descanso.',target:'inicio'});
  for(const recipe of snapshot.replacements.filter(r=>r.published_at))entries.push({id:`${patientId}:recipe:${recipe.id}`,patient_id:patientId,title:'Tu nutricionista compartió una alternativa',detail:recipe.recipe.title,target:'plan'});
  return entries;
}
export function useCareNotices(patientId:string,professional:boolean) {
  const {data,error:patientError}=useCare(professional?'':patientId);
  const [now,setNow]=useState(()=>new Date());
  const [alerts,setAlerts]=useState<CareAlert[]>([]);const [error,setError]=useState('');
  useEffect(()=>{const timer=window.setInterval(()=>setNow(new Date()),30000);return()=>window.clearInterval(timer);},[]);
  useEffect(()=>{
    if(!professional)return;
    const c=new AbortController();let loading=false;
    const load=async()=>{if(loading)return;loading=true;try{const result=await careApi.alerts(c.signal);if(!c.signal.aborted){setAlerts(result.alerts);setError('');}}catch(e){if(!c.signal.aborted)setError(careErrorMessage(e));}finally{loading=false;}};
    void load();const timer=window.setInterval(()=>void load(),15000);window.addEventListener('plan-v:care-changed',load);
    return()=>{c.abort();window.clearInterval(timer);window.removeEventListener('plan-v:care-changed',load);};
  },[professional]);
  return {notices:professional?alerts:data?patientCareNotices(patientId,data,now):[],error:professional?error:patientError,hasPreferences:Boolean(data)};
}
