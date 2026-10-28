import { useEffect,useRef,useState,type CSSProperties } from 'react';
import type { MealLog,Patient } from '../../types';
import type { PatientMealPage } from '../../types/patient-meals';
import { crmWorkApi } from '../../api/crm-work';
import { nutritionTargetApi } from '../../api/nutrition-target';
import { plansApi } from '../../api/plans';
import type { PatientMealPlan } from '../../types/plans';
import { nutrientesDelPlan } from './ficha-plan-nutrientes';
import { PanelV29Icon } from './PanelV29Icon';
import { caloriasPorDia, contraElPlan, cuandoComio, fechaArgentina, ESTADO_DE_COMIDA, planillaDeComidas, promedioDeMacros } from './ficha-alimentario';
import { PanelFichaPedirRegistro } from './PanelFichaPedirRegistro';
import { AvisoBoceto } from './panel-v29-boceto';
import { FxCols, FxKv, FxPanel, FxRing } from './ficha-fx';
import { inicialDelDia } from './ficha-objetivos';
import { numero } from './ficha-presentacion';
import { homeDay } from '../../lib/panel-home';
import { ShowroomMeals } from './ShowroomMeals';

// Mismos degradados por momento que dibuja el boceto en cada comida.
const FONDOS:Record<string,string>={Desayuno:'linear-gradient(135deg,#E9F3C9,#C9DD8F)',Colación:'linear-gradient(135deg,#E9F3C9,#C9DD8F)',Almuerzo:'linear-gradient(135deg,#DDEBDF,#A9CDB1)',Merienda:'linear-gradient(135deg,#FBE7BE,#F2C77A)',Cena:'linear-gradient(135deg,#F6DCCF,#E6B39C)',Extra:'linear-gradient(135deg,#E9F3C9,#C9DD8F)'};
export function PanelPatientFoodDiary({patient,onReview,onSelect,now}:{patient:Patient;onReview:(meal:MealLog)=>void;onSelect:(id:string)=>void;now:Date}){
  const [days,setDays]=useState<7|30|undefined>(7),[status,setStatus]=useState<'all'|'pending_review'|'reviewed'>('all');
  const [result,setResult]=useState<{key:string;page:PatientMealPage}|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[revision,setRevision]=useState(0),[details,setDetails]=useState(false),[pidiendo,setPidiendo]=useState(false),[aviso,setAviso]=useState('');
  const [meta,setMeta]=useState<{kcal:number;protein_g:number;carbs_g:number;fat_g:number}|null>(null);
  useEffect(()=>{const abort=new AbortController();setMeta(null);nutritionTargetApi.get(patient.id,true,abort.signal).then(res=>{const r=(res.published??res.target)?.result;if(!abort.signal.aborted&&r)setMeta({kcal:r.kcal,protein_g:r.protein_g,carbs_g:r.carbs_g,fat_g:r.fat_g});}).catch(()=>undefined);return()=>abort.abort();},[patient.id]);
  const [planPublicado,setPlanPublicado]=useState<PatientMealPlan|null>(null);
  useEffect(()=>{const abort=new AbortController();setPlanPublicado(null);plansApi.published(patient.id,abort.signal).then(res=>{if(!abort.signal.aborted)setPlanPublicado(res.plan);}).catch(()=>undefined);return()=>abort.abort();},[patient.id]);
  const key=`${patient.id}:${days}:${status}:${revision}`;const currentKey=useRef(key);currentKey.current=key;
  const controller=useRef<AbortController|null>(null),gate=useRef(false);
  async function load(offset=0,signal?:AbortSignal){
    if(gate.current)return;gate.current=true;setLoading(true);setError('');const owner=key;
    try{const next=await crmWorkApi.patientMeals(patient.id,{days,status,offset,limit:50},signal);
      if(signal?.aborted||currentKey.current!==owner)return;
      if(next.patient_id!==patient.id||next.logs.some(log=>log.patient_id!==patient.id))throw Error('Respuesta de otra paciente');
      setResult(old=>({key:owner,page:{...next,logs:offset&&old?.key===owner?[...new Map([...old.page.logs,...next.logs].map(log=>[log.id,log])).values()]:next.logs}}));
    }catch{if(!signal?.aborted&&currentKey.current===owner)setError('No pudimos consultar los registros. Reintentá para ver el período completo.');}
    finally{if(!signal?.aborted&&currentKey.current===owner){gate.current=false;setLoading(false);}}
  }
  useEffect(()=>{controller.current?.abort();gate.current=false;const abort=new AbortController();controller.current=abort;setResult(null);void load(0,abort.signal);return()=>{abort.abort();gate.current=false;};},[key,patient.meal_logs]);
  useEffect(()=>{const changed=()=>setRevision(n=>n+1);window.addEventListener('plan-v:care-changed',changed);return()=>window.removeEventListener('plan-v:care-changed',changed);},[]);
  const page=result?.key===key?result.page:null;
  const logs=page?.logs??[],hoy=homeDay(now),promedio=promedioDeMacros(logs);
  const porRevisar=patient.weekly_registration?.pending_review;
  const hora=(iso:string,opciones:Intl.DateTimeFormatOptions)=>new Date(iso).toLocaleString('es-AR',{timeZone:'America/Argentina/Buenos_Aires',...opciones});
  const periodo=days===7?'últimos 7 días':days===30?'último mes':'todo el historial';
  const letraDelDia=(d:string)=>new Date(`${d}T12:00:00Z`).toLocaleDateString('es-AR',{weekday:'short',timeZone:'UTC'}).replace('.','').replace(/^./,c=>c.toUpperCase());
  const macros=promedio?[['Proteínas',promedio.protein_g,4,'k'],['Carbohidratos',promedio.carbs_g,4,''],['Grasas',promedio.fat_g,9,'o']] as const:[];
  const totalKcal=macros.reduce((suma,[,g,k])=>suma+g*k,0)||1;
  const semana=caloriasPorDia(logs,hoy);
  const registro=patient.weekly_registration;
  const descargar=()=>{const url=URL.createObjectURL(new Blob([planillaDeComidas(logs)],{type:'text/csv;charset=utf-8'})),enlace=document.createElement('a');enlace.href=url;enlace.download=`registro-alimentario-${patient.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}-${hoy}.csv`;document.body.append(enlace);enlace.click();enlace.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);setAviso(`Descargaste ${logs.length} ${logs.length===1?'comida':'comidas'}.`);};
  return <section className="pn-record-diary" aria-label="Registro alimentario de la paciente">
    {error&&<p role="alert">{error} <button type="button" onClick={()=>void load(page?.next_offset??0,controller.current?.signal)}>Reintentar registros</button></p>}
    <div className="fx" data-mk="1" style={{gridTemplateColumns:'1.6fr 1fr'}}>
      <div className="c"><FxPanel titulo="Registro de comidas" meta={periodo} alCambiarMeta={()=>setDays(actual=>actual===7?30:actual===30?undefined:7)} grande derecha={<><div className="tabs" aria-label="Estado de las comidas">{([['all','Todo'],['pending_review',porRevisar?`Por revisar · ${porRevisar}`:'Por revisar']] as const).map(([value,label])=><button type="button" key={value} className={status===value?'on':undefined} aria-pressed={status===value} onClick={()=>setStatus(value)}>{label}</button>)}</div><button type="button" className="sbtn cbtn" disabled={!logs.length} onClick={descargar}><PanelV29Icon name="dl" size={13}/>Descargar</button><button type="button" className="sbtn k cbtn" onClick={()=>setPidiendo(true)}><PanelV29Icon name="plus" size={13}/>Pedir registro</button></>}>
        <div className="fxs fxtb tall"><table><thead><tr><th>Cuándo</th><th>Qué comió</th><th>Estimado</th><th>Contra el plan</th><th></th></tr></thead><tbody>{logs.map(log=><tr key={log.id}><td><div className="fxwhen"><b>{log.slot}</b><small className="num">{cuandoComio(log.logged_at,now)}</small></div></td><td><div className="who">{log.photo_url?<img className="photo" style={{width:32,height:32,objectFit:'cover'}} src={log.photo_url} alt="" loading="lazy"/>:<span className="photo" style={{width:32,height:32,'--g':FONDOS[log.slot]??FONDOS.Extra} as CSSProperties}><PanelV29Icon name="fork" size={14}/></span>}<b>{log.description||log.foods.map(food=>food.name).join(', ')||'Sin descripción'}</b></div></td><td className="num" style={{color:'var(--ink2)'}}>{log.macros?`~${Math.round(log.macros.kcal)} kcal`:'Sin estimación'}{log.nutrition_origin==='ai_estimate'&&<small style={{display:'block',color:'var(--ink3)'}}>Estimado por IA</small>}</td><td>{(()=>{const veredicto=contraElPlan(log,planPublicado?nutrientesDelPlan(planPublicado,fechaArgentina(log.logged_at),log.slot):null);return veredicto?<span className={`pill ${veredicto.clase}`}>{veredicto.texto}</span>:<span style={{color:'var(--ink3)'}} title="El plan no indica calorías para esta comida o la comida no tiene estimación">—</span>;})()}</td><td>{log.status==='pending_review'?<button type="button" className="sbtn k cbtn" onClick={()=>onReview(log)}><PanelV29Icon name="check" size={13}/>Confirmar</button>:<span role="button" tabIndex={0} title="Ver revisión" style={{color:'var(--ink3)',fontSize:11.5,cursor:'pointer'}} onClick={()=>onReview(log)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onReview(log);}}}>{ESTADO_DE_COMIDA[log.status].texto}</span>}</td></tr>)}</tbody></table></div>
        {!page&&loading?<p role="status" className="fxhint">Consultando registros…</p>:page?.logs.length===0?<p className="fxhint">No hay comidas en este período y estado.</p>:null}
        {page?.has_more&&<button type="button" className="sbtn cbtn" disabled={loading} onClick={()=>void load(page.next_offset!,controller.current?.signal)}>{loading?'Consultando…':'Cargar más registros'}</button>}
        {page&&<small className="fxhint">{page.logs.length} registros cargados{page.has_more?' · hay más en este período':''}</small>}
      </FxPanel></div>
      <div className="c">
        <FxPanel titulo="Calorías por día" meta={meta?`meta ${numero(meta.kcal)}`:'estimadas, últimos 7 días'}>{semana.promedio===null?<div className="fxhint">{page?'Sin estimaciones de calorías en estos registros.':'Consultando…'}</div>:<FxCols valores={semana.valores} rotulos={semana.dias.map(inicialDelDia)} max={Math.max(...semana.valores)*1.15} alto={120} promedio={semana.promedio} tope={numero(semana.valores[6]!)}/>}</FxPanel>
        <FxPanel titulo={days===7?"Promedio de la semana":"Promedio de los días registrados"} meta={promedio&&page&&!page.has_more?`${numero(promedio.kcal)} kcal · ${promedio.dias} ${promedio.dias===1?'día':'días'}`:undefined}>{!page?<div className="fxhint">Consultando el período…</div>:page.has_more?<div className="fxhint">Cargá los registros restantes para calcular el período completo.</div>:!promedio?<div className="fxhint">No hay estimaciones nutricionales en los registros de este período.</div>:<><div className="fxmacros">{macros.map(([nombre,g,k,clase])=>{const objetivo=meta?(nombre==='Proteínas'?meta.protein_g:nombre==='Carbohidratos'?meta.carbs_g:meta.fat_g):null;const pct=objetivo?Math.round(g/objetivo*100):Math.round(g*k/totalKcal*100);return <div key={nombre}><span><b>{nombre}</b><small className="num">{objetivo?`${numero(g)} de ${numero(objetivo)} g`:`${pct}% · ${numero(g)} g`}</small></span><span className={`fxb${clase?` ${clase}`:''}`}><i style={{width:`${Math.min(100,pct)}%`}}/></span></div>;})}</div></>}</FxPanel>
        <FxPanel titulo="Registro de la semana" meta={registro?`${registro.meals_logged} comidas`:undefined} grande derecha={<button className="lnk" type="button" onClick={()=>setPidiendo(true)}>Pedir</button>}>{!registro?<div className="fxhint">Resumen semanal no disponible.</div>:<div className="fxsplit"><FxRing pct={Math.round(registro.recorded_days/7*100)} texto={`${registro.recorded_days}/7`} tamano={58}/><FxKv filas={[['Días con registro',`${registro.recorded_days} de 7`],['Comidas cargadas',String(registro.meals_logged)],['Por revisar',String(registro.pending_review)]]}/></div>}</FxPanel>
        <div className="fxai"><PanelV29Icon name="spark" size={14}/><span><b>Lo que ve la IA:</b> todavía no hay observaciones sobre este registro.</span></div>
      </div>
    </div>
    <details className="pn-record-card" onToggle={event=>setDetails(event.currentTarget.open)}><summary>Hábitos, actividad y vista anterior</summary>{details&&<ShowroomMeals patient={{...patient,meal_logs:page?.logs??[]}} query="" onSelect={onSelect} onReview={onReview} now={now}/>}</details>
    {pidiendo&&<PanelFichaPedirRegistro patient={patient} onClose={()=>setPidiendo(false)} onSent={texto=>{setPidiendo(false);setAviso(texto);}}/>}
    {aviso&&<AvisoBoceto key={aviso} texto={aviso}/>}
  </section>;
}
