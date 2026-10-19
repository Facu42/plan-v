import {useEffect,useState} from 'react';
import {api} from '../../api/client';
import {careApi} from '../../api/care';
import {crmWorkApi} from '../../api/crm-work';
import type {PatientQuickPreview} from '../../types/patient-preview';
import {accompanimentDate} from './use-accompaniment';

type Context={id:string;adherence:number|null;goal:string|null;focus:string|null;weight:PatientQuickPreview['latest_weight'];plan:PatientQuickPreview['plan']};
/** No se reutiliza la ficha cacheada del chat para mostrar datos de salud. */
export function MessagePatientContext({patientId,onPlan}:{patientId:string;onPlan:()=>void}){
 const [data,setData]=useState<Context|null>(null),[error,setError]=useState(''),[version,setVersion]=useState(0);
 useEffect(()=>{
  const current=new AbortController();setData(null);setError('');
  async function load(){try{
   const [preview,full]=await Promise.all([crmWorkApi.patientPreview(patientId,current.signal),api.getPatient(patientId,{signal:current.signal})]);
   const permissions=await careApi.snapshot(patientId,true,current.signal);
   const canCare=permissions.consented.includes('care_relationship'),score=full.patient.adherence_score;
   if(!current.signal.aborted)setData({id:patientId,adherence:canCare&&Number.isFinite(score)&&score>=0&&score<=100?score:null,goal:canCare?full.patient.goal:null,focus:canCare?full.patient.next_focus:null,weight:permissions.consented.includes('measurement')?preview.latest_weight:null,plan:preview.plan});
  }catch{if(!current.signal.aborted){setData(null);setError('No pudimos consultar los datos de la ficha.');}}}void load();return()=>current.abort();
 },[patientId,version]);
 useEffect(()=>{const refresh=()=>{setData(null);setVersion(n=>n+1);};const timer=window.setInterval(refresh,30000);window.addEventListener('focus',refresh);window.addEventListener('plan-v:care-changed',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);window.removeEventListener('plan-v:care-changed',refresh);};},[]);
 const context=data?.id===patientId?data:null;
 return <section className="pn-message-context" aria-label="Datos de la ficha">{error?<div role="alert"><p>{error}</p><button onClick={()=>setVersion(n=>n+1)}>Reintentar ficha</button></div>:!context?<p role="status">Consultando ficha y permisos…</p>:<><div className="pn-message-context-metrics"><div><small>Adherencia</small><b>{context.adherence===null?'Sin dato compartido':`${context.adherence}%`}</b></div><div><small>Peso</small><b>{context.weight?`${context.weight.value} ${context.weight.unit}`:'Sin dato compartido'}</b>{context.weight&&<small>{accompanimentDate(context.weight.captured_on)}</small>}</div></div>{context.goal&&<p><b>Objetivo:</b> {context.goal}</p>}{context.focus&&<p><b>Próximo foco:</b> {context.focus}</p>}<div className="pn-message-current-plan"><h4>Plan actual</h4><p>{context.plan.status==='published'?'Plan publicado':context.plan.status==='scheduled'?'Plan programado':context.plan.status==='draft'?'Borrador privado':'Sin plan publicado'}</p>{context.plan.period_start&&context.plan.period_end&&<small>{accompanimentDate(context.plan.period_start)} → {accompanimentDate(context.plan.period_end)}</small>}<button onClick={onPlan}>Ver plan</button></div></>}</section>;
}
