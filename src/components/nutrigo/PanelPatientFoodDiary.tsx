import { useEffect,useRef,useState } from 'react';
import type { MealLog,Patient } from '../../types';
import type { PatientMealPage } from '../../types/patient-meals';
import { crmWorkApi } from '../../api/crm-work';
import { Icon } from '../shared/Icon';
import { ShowroomMeals } from './ShowroomMeals';

export function PanelPatientFoodDiary({patient,onReview,onSelect,now}:{patient:Patient;onReview:(meal:MealLog)=>void;onSelect:(id:string)=>void;now:Date}){
  const [days,setDays]=useState<7|30|undefined>(7),[status,setStatus]=useState<'all'|'pending_review'|'reviewed'>('all');
  const [result,setResult]=useState<{key:string;page:PatientMealPage}|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[revision,setRevision]=useState(0),[details,setDetails]=useState(false);
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
  const macroLogs=page?.logs.filter(log=>log.macros)??[];
  const totals=macroLogs.reduce((sum,log)=>({kcal:sum.kcal+log.macros!.kcal,protein_g:sum.protein_g+log.macros!.protein_g,carbs_g:sum.carbs_g+log.macros!.carbs_g,fat_g:sum.fat_g+log.macros!.fat_g}),{kcal:0,protein_g:0,carbs_g:0,fat_g:0});
  const recordedDays=new Set(macroLogs.map(log=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires'}).format(new Date(log.logged_at)))).size;
  return <section className="pn-record-diary" aria-label="Registro alimentario de la paciente"><header className="pn-record-diary-tools"><div className="pn-record-plan-tabs" aria-label="Período de registros">{([[7,'Últimos 7 días'],[30,'Mes'],[undefined,'Todo']] as const).map(([value,label])=><button type="button" key={label} aria-pressed={days===value} onClick={()=>setDays(value)}>{label}</button>)}</div><label>Estado<select value={status} onChange={event=>setStatus(event.target.value as typeof status)}><option value="all">Todos</option><option value="pending_review">Por revisar</option><option value="reviewed">Revisadas</option></select></label></header>
    {error&&<p role="alert">{error} <button type="button" onClick={()=>void load(page?.next_offset??0,controller.current?.signal)}>Reintentar registros</button></p>}
    <div className="pn-record-diary-grid"><section className="pn-record-card pn-record-diary-list"><div className="pn-record-table-scroll"><table><thead><tr><th>Día</th><th>Comida</th><th>Qué comió</th><th>Estimado</th><th>Estado</th><th>Revisión</th></tr></thead><tbody>{page?.logs.map(log=><tr key={log.id}><td><b>{new Date(log.logged_at).toLocaleDateString('es-AR',{day:'numeric',month:'short',timeZone:'America/Argentina/Buenos_Aires'})}</b><small>{new Date(log.logged_at).toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit',timeZone:'America/Argentina/Buenos_Aires'})}</small></td><td>{log.slot}</td><td><div className="pn-record-diary-food">{log.photo_url?<img src={log.photo_url} alt="" loading="lazy"/>:<span><Icon name="camera" size={18}/></span>}<b>{log.description||log.foods.map(food=>food.name).join(', ')||'Sin descripción'}</b></div></td><td>{log.macros?`${Math.round(log.macros.kcal)} kcal`:'Sin estimación'}{log.nutrition_origin==='ai_estimate'&&<small>Estimado por IA</small>}</td><td><span className={`pn-record-chip${log.status==='pending_review'?' pn-record-pending':''}`}>{log.status==='pending_review'?'Por revisar':log.status==='adjusted'?'Ajustada':'Revisada'}</span></td><td><button type="button" onClick={()=>onReview(log)}>{log.status==='pending_review'?'Revisar':'Ver revisión'}</button></td></tr>)}</tbody></table></div>
      {!page&&loading?<p role="status">Consultando registros…</p>:page?.logs.length===0?<p>No hay comidas en este período y estado.</p>:null}
      {page?.has_more&&<button type="button" disabled={loading} onClick={()=>void load(page.next_offset!,controller.current?.signal)}>{loading?'Consultando…':'Cargar más registros'}</button>}
      {page&&<small>{page.logs.length} registros cargados{page.has_more?' · hay más en este período':''}</small>}
    </section><aside className="pn-record-side-column"><section className="pn-record-card"><header><h3>Promedio de los días registrados</h3></header>{!page?<p>Consultando el período…</p>:page.has_more?<p>Cargá los registros restantes para calcular el período completo.</p>:!recordedDays?<p>No hay estimaciones nutricionales en los registros de este período.</p>:<><dl className="pn-record-key-data">{([['Calorías','kcal','kcal'],['Proteínas','protein_g','g'],['Carbohidratos','carbs_g','g'],['Grasas','fat_g','g']] as const).map(([label,id,unit])=><div key={id}><dt>{label}</dt><dd>{Math.round(totals[id]/recordedDays).toLocaleString('es-AR')} {unit}</dd></div>)}</dl><small>{recordedDays} días con estimación · filtro de estado: {status==='all'?'todos':status==='reviewed'?'revisados':'por revisar'}. Puede incluir estimaciones sin revisión.</small></>}</section><section className="pn-record-card"><header><h3>Comidas cargadas</h3></header><p>{patient.weekly_registration?`${patient.weekly_registration.recorded_days} de 7 días · ${patient.weekly_registration.meals_logged} comidas esta semana`:'Resumen semanal no disponible.'}</p><small>Los totales semanales vienen del servidor, independientes de la página cargada.</small></section></aside></div>
    <details className="pn-record-card" onToggle={event=>setDetails(event.currentTarget.open)}><summary>Hábitos, actividad y vista anterior</summary>{details&&<ShowroomMeals patient={{...patient,meal_logs:page?.logs??[]}} query="" onSelect={onSelect} onReview={onReview} now={now}/>}</details>
  </section>;
}
