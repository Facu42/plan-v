import { useEffect,useState } from 'react';
import type { Patient,MealLog } from '../../types';
import type { ProfessionalIntakeView } from '../../types/intake';
import type { ClinicalWorkspaceSnapshot } from '../../types/clinical-workspace';
import type { ConsultationView } from '../../types/consultations';
import { api } from '../../api/client';
import { clinicalWorkspaceApi } from '../../api/clinical-workspace';
import { consultationsApi } from '../../api/consultations';
import { useCare } from './useCare';
import { recordMetric,recordLabSeries } from './panel-record-data';
import { MetricChart } from './MetricChart';
import { formatChange,formatMetricDate,formatMetricValue } from './measurement-format';
import { latestBmi } from '../../lib/measurement-bmi';
import { buildJourneySummary } from '../patient/journey-summary';
import { healthFactLabel } from './intake-review';
import { ProfessionalLedgerSummary } from './ProfessionalLedgerSummary';
import { Icon } from '../shared/Icon';
import type { RecordTab } from './patient-record-sections';

export function PanelPatientOverview({patient,now,onSection,onReview}:{patient:Patient;now:Date;onSection:(tab:RecordTab)=>void;onReview:(meal:MealLog)=>void}) {
  const {data:care,error:careError,reload}=useCare(patient.id,true);
  const [related,setRelated]=useState<{key:string;intake:ProfessionalIntakeView|null;clinical:ClinicalWorkspaceSnapshot|null;notes:ConsultationView|null;errors:string[]}|null>(null);
  const [revision,setRevision]=useState(0),[range,setRange]=useState<90|180|undefined>(180);
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires'}).format(now);
  const canCare=!careError&&(care?.consented.includes('care_relationship')??false),canDocs=!careError&&(care?.consented.includes('clinical_document')??false);
  const key=`${patient.id}:${Boolean(care)}:${canCare}:${canDocs}:${revision}`;
  useEffect(()=>{const refresh=()=>setRevision(n=>n+1);window.addEventListener('plan-v:care-changed',refresh);return()=>window.removeEventListener('plan-v:care-changed',refresh);},[]);
  useEffect(()=>{
    if(!care)return;
    const controller=new AbortController();setRelated(null);
    void Promise.allSettled([api.getProfessionalIntake(patient.id,{signal:controller.signal}),canDocs?clinicalWorkspaceApi.snapshot(patient.id,controller.signal):Promise.resolve(null),canCare?consultationsApi.list(patient.id,true,0,controller.signal):Promise.resolve(null)]).then(([intake,clinical,notes])=>{
      if(controller.signal.aborted)return;
      setRelated({key,intake:intake.status==='fulfilled'?intake.value:null,clinical:clinical.status==='fulfilled'?clinical.value:null,notes:notes.status==='fulfilled'?notes.value:null,errors:[intake.status==='rejected'?'antecedentes':null,clinical.status==='rejected'?'laboratorio':null,notes.status==='rejected'?'notas':null].filter((x):x is string=>Boolean(x))});
    });return()=>controller.abort();
  },[key]);
  const current=related?.key===key?related:null;
  const measurements=(careError?[]:care?.measurements??[]).filter(m=>m.patient_id===patient.id&&m.captured_on<=today);
  const weight=recordMetric(measurements,patient.id,'weight',today,range);
  const bmi=latestBmi(measurements,null);
  const labs=canDocs?recordLabSeries(current?.clinical?.records??[],patient.id,today):[];
  const notes=canCare?current?.notes:null;
  const note=notes?.sessions.filter(session=>session.draft.trim()).sort((a,b)=>b.started_at.localeCompare(a.started_at))[0]??null;
  const shared=notes?.shared.slice().sort((a,b)=>b.published_at.localeCompare(a.published_at))[0];
  const journey=buildJourneySummary({meal_logs:patient.meal_logs.filter(m=>m.patient_id===patient.id),habit_logs:patient.habit_logs.filter(h=>h.patient_id===patient.id)},now);
  const pending=patient.meal_logs.filter(meal=>meal.patient_id===patient.id&&meal.status==='pending_review').sort((a,b)=>b.logged_at.localeCompare(a.logged_at));
  const composition=[['Grasa corporal','body_fat_pct'],['Masa muscular','muscle_mass'],['Cintura','waist']] as const;
  return <div className="pn-record-overview">
    <div className="pn-record-main-column">
      <section className="pn-record-card pn-record-weight"><header><h3>Peso</h3>{weight?.changeFromFirst!==null&&weight&&<span className="pn-record-chip">{formatChange(weight.changeFromFirst,weight.unit)} desde el primer registro</span>}<div className="pn-record-ranges" aria-label="Período del peso">{([[90,'3 meses'],[180,'6 meses'],[undefined,'Todo']] as const).map(([days,label])=><button type="button" key={label} aria-pressed={range===days} onClick={()=>setRange(days)}>{label}</button>)}</div></header>
        {careError?<p role="alert">{careError} <button type="button" onClick={reload}>Reintentar medidas</button></p>:!care?<p role="status">Consultando mediciones…</p>:!care.consented.includes('measurement')?<p>Permiso de medidas pendiente.</p>:!weight?<p>Todavía no hay mediciones en este período.</p>:<><div className="pn-record-current"><b>{formatMetricValue(weight.last.value,weight.unit)}</b><small>{formatMetricDate(weight.last.date)}</small></div><MetricChart points={[...weight.history].reverse().map(row=>({date:row.date,value:row.value}))} unit={weight.unit} label="Evolución del peso"/><div className="pn-record-chart-dates"><span>{formatMetricDate(weight.first.date)}</span><span>{formatMetricDate(weight.last.date)}</span></div>{weight.otherUnits>0&&<small>Hay {weight.otherUnits} registros en otra unidad que no se mezclan.</small>}</>}
        <footer><span>Objetivo: {patient.goal||'Todavía sin definir'}</span><button type="button" onClick={()=>onSection('evolucion')}>Ver evolución <Icon name="arrow" size={14}/></button></footer>
      </section>
      <div className="pn-record-composition">{composition.map(([label,kind])=>{const metric=recordMetric(measurements,patient.id,kind,today);return <article key={kind}><small>{label}</small><b>{metric?formatMetricValue(metric.last.value,metric.unit):'Sin dato'}</b><span>{metric?formatChange(metric.changeFromPrevious,metric.unit):'Sin medición autorizada'}</span></article>;})}<article><small>IMC</small><b>{bmi?bmi.bmi.toLocaleString('es-AR',{maximumFractionDigits:1}):'Sin dato'}</b><span>{bmi?'Calculado con peso y altura':'Necesita peso y altura'}</span></article></div>
      <section className="pn-record-card"><header><h3>Comidas por revisar</h3><button type="button" onClick={()=>onSection('alimentario')}>Ver todas <Icon name="arrow" size={14}/></button></header><div className="pn-record-meals">{pending.slice(0,3).map(meal=><button type="button" key={meal.id} onClick={()=>onReview(meal)} aria-label={`Revisar ${meal.slot} del ${formatMetricDate(meal.logged_at.slice(0,10))}`}>{meal.photo_url&&care?.consented.includes('meal_photo')?<img src={meal.photo_url} alt="" loading="lazy"/>:<span className="pn-record-meal-placeholder"><Icon name="camera" size={24}/></span>}<span><small>{meal.slot} · {new Date(meal.logged_at).toLocaleDateString('es-AR',{timeZone:'America/Argentina/Buenos_Aires'})}</small><b>{meal.description||'Comida sin descripción'}</b><i>Por revisar</i></span></button>)}</div>{pending.length===0&&<p>No hay comidas pendientes de revisión.</p>}</section>
      <details className="pn-record-card pn-record-private"><summary>Datos profesionales y seguimiento</summary><dl>{[['Horario sensible',patient.sensitive_hours],['Plan B',patient.plan_b],['Próximo foco',patient.next_focus],['Observación de seguimiento',patient.adherence_why]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||'Sin dato cargado'}</dd></div>)}</dl><h4>Historial</h4>{patient.timeline.length?<ul>{patient.timeline.slice(0,8).map(event=><li key={event.id}><small>{event.atLabel}</small><b>{event.title}</b><p>{event.body}</p></li>)}</ul>:<p>Sin eventos registrados.</p>}<h4>Notas de objetivos</h4>{patient.goal_history?.length?<ul>{patient.goal_history.slice(0,5).map(goal=><li key={goal.id}><b>{goal.goal} · {goal.progress}%</b><p>{goal.note||'Sin nota profesional'}</p></li>)}</ul>:<p>Sin notas de objetivos.</p>}<h4>Observaciones de comidas</h4>{patient.meal_logs.filter(meal=>meal.patient_id===patient.id&&meal.note_for_nutri.trim()).slice(0,5).map(meal=><button type="button" key={meal.id} onClick={()=>onReview(meal)}>{meal.slot}: {meal.note_for_nutri}</button>)}</details>
    </div>
    <div className="pn-record-side-column">
      <section className="pn-record-card pn-record-note"><header><span><Icon name="mic" size={15}/>Nota de la última consulta</span></header><p>{!care?'Consultando permisos…':!canCare?'Permiso de atención pendiente.':!current?'Consultando notas…':note?note.draft:shared?.summary||'Todavía no hay una nota de consulta.'}</p>{note&&<small>Borrador privado · revisalo antes de compartir</small>}<button type="button" className="pn-record-note-action" onClick={()=>onSection('notas')}>{note?'Revisar y aprobar':'Ver notas de consulta'}<Icon name="arrow" size={14}/></button></section>
      <section className="pn-record-card"><header><h3>Adherencia</h3><span>{patient.weekly_registration?`${patient.weekly_registration.recorded_days} de 7 días registrados`:'Resumen no disponible'}</span></header><div className="pn-record-week" aria-label="Comidas registradas en los últimos siete días">{journey.days.map(day=><div key={day.date}><b style={{height:`${Math.max(3,Math.min(day.mealLogIds.length,6)*9)}px`}}/><small>{day.label}</small><span>{day.mealLogIds.length}</span></div>)}</div><small>La altura indica cantidad de comidas cargadas, sin suponer cumplimiento.</small></section>
      <section className="pn-record-card"><header><h3>Laboratorio</h3><button type="button" onClick={()=>onSection('laboratorio')}>Ver estudios <Icon name="arrow" size={14}/></button></header>{!canDocs?<p>Permiso de estudios pendiente.</p>:!current?<p role="status">Consultando laboratorio…</p>:labs.length?<dl className="pn-record-lab-list">{labs.slice(0,4).map(lab=><div key={lab.key}><dt>{lab.name}</dt><dd><b>{lab.latest.raw_value} {lab.unit}</b><small>Rango del informe: {lab.latest.range_text||'Sin informar'}</small></dd></div>)}</dl>:<p>Todavía no hay valores de laboratorio revisados.</p>}</section>
      <section className="pn-record-card"><header><h3>Datos clave</h3><button type="button" onClick={()=>onSection('historia')}>Ver historia</button></header><dl className="pn-record-key-data">{[['Objetivo',patient.goal||'Sin definir'],['Alergias',current?.intake?healthFactLabel(current.intake.intake.payload.allergies,'alergias'):'Sin dato actualizado'],['Restricciones',current?.intake?healthFactLabel(current.intake.intake.payload.restrictions,'restricciones'):'Sin dato actualizado'],['Plan de hoy',patient.todayPlan.length?`${patient.todayPlan.length} momentos configurados`:'Sin plan cargado']].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
      <ProfessionalLedgerSummary patientId={patient.id} onOpen={()=>onSection('cobros')}/>
      {current&&current.errors.length>0&&<p role="alert">No pudimos actualizar {current.errors.join(', ')}. <button type="button" onClick={()=>setRevision(n=>n+1)}>Reintentar resumen</button></p>}
    </div>
  </div>;
}
