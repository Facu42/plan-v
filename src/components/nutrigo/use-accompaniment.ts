import {useEffect,useState} from 'react';
import {accompanimentApi} from '../../api/accompaniment';
import type {AccompanimentDays,AccompanimentMetrics} from '../../types/accompaniment';

export function useAccompaniment(days:AccompanimentDays){
 const [data,setData]=useState<AccompanimentMetrics|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[version,setVersion]=useState(0);
 const reload=()=>setVersion(value=>value+1);
 useEffect(()=>{
  const controller=new AbortController();setData(null);setError('');setLoading(true);
  accompanimentApi.metrics(days,controller.signal).then(value=>{if(!controller.signal.aborted)setData(value);}).catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:'No pudimos consultar los registros.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return()=>controller.abort();
 },[days,version]);
 useEffect(()=>{const clear=()=>{setData(null);reload();};const timer=window.setInterval(clear,30000);window.addEventListener('focus',clear);window.addEventListener('plan-v:care-changed',clear);return()=>{clearInterval(timer);window.removeEventListener('focus',clear);window.removeEventListener('plan-v:care-changed',clear);};},[]);
 return {data,error,loading,reload};
}
export const accompanimentDate=(day:string)=>new Date(`${day.slice(0,10)}T12:00:00Z`).toLocaleDateString('es-AR',{day:'numeric',month:'short',timeZone:'America/Argentina/Buenos_Aires'});
export const patientHref=(id:string,section='resumen')=>`/crm/ficha?paciente=${encodeURIComponent(id)}&seccion=${section}`;
