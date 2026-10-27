import { useState } from 'react';
import type { Patient } from '../../types';
import { CarePanel } from './CarePanel';
import { useCare } from './useCare';
import { ProfessionalMeasurements } from './ProfessionalMeasurements';
import { ClinicalPatientWorkspace } from './ClinicalPatientWorkspace';
import { GoalEditor } from './ShowroomGoals';
import { getGoalSnapshot,GOAL_STATUS_LABELS } from '../crm/crm-goals';
import { buildJourneySummary } from '../patient/journey-summary';
import { formatMetricDate } from './measurement-format';
import { NvState } from './primitives';

/** Lo que cuelga debajo de la solapa Mediciones: todas las medidas con correcciones e importación, métodos clínicos y registros compartidos. */
export function PanelPatientMedicionesExtra({patientId,patientName}:{patientId:string;patientName:string}){
  const {data}=useCare(patientId,true);
  const [advanced,setAdvanced]=useState(false),[evaluations,setEvaluations]=useState(false),[reviews,setReviews]=useState(false);
  return <div className="pn-record-evolution">
    <details className="pn-record-card" onToggle={event=>setAdvanced(event.currentTarget.open)}><summary>Todas las medidas, correcciones e importación de balanza</summary>{advanced&&<ProfessionalMeasurements patientId={patientId} patientName={patientName}/>}</details>
    <details className="pn-record-card" onToggle={event=>setEvaluations(event.currentTarget.open)}><summary>Evaluaciones clínicas y métodos del consultorio</summary>{data&&!data.consented.includes('care_relationship')&&<p>Permiso de atención pendiente.</p>}{evaluations&&data?.consented.includes('care_relationship')&&<ClinicalPatientWorkspace patientId={patientId} mode="mediciones"/>}</details>
    <details className="pn-record-card" onToggle={event=>setReviews(event.currentTarget.open)}><summary>Registros compartidos por revisar</summary>{reviews&&<CarePanel patientId={patientId} mode="professional"/>}</details>
  </div>;
}

/** Objetivo con su avance declarado y los hábitos de la semana. Pasan a la solapa Objetivos y hábitos. */
export function PanelPatientObjetivos({patient,now,onChanged}:{patient:Patient;now:Date;onChanged:(patient:Patient)=>void}){
  const {data,error,reload}=useCare(patient.id,true);
  const [editingGoal,setEditingGoal]=useState(false);
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires'}).format(now),since=new Date(Date.parse(`${today}T12:00:00Z`)-6*86400000).toISOString().slice(0,10);
  if(error)return <NvState kind="error" title="No pudimos cargar los objetivos" description={error} action={<button type="button" onClick={reload}>Reintentar objetivos</button>}/>;
  if(!data)return <NvState kind="loading" title="Consultando objetivos…" description="Cargando los datos autorizados de la paciente."/>;
  const goal=getGoalSnapshot(patient),journey=buildJourneySummary({meal_logs:[],habit_logs:patient.habit_logs.filter(h=>h.patient_id===patient.id)},now);
  const activityDays=new Set(data.records.filter(r=>r.patient_id===patient.id&&r.data.kind==='activity'&&r.recorded_on>=since&&r.recorded_on<=today).map(r=>r.recorded_on)).size;
  return <div className="pn-record-evolution"><div className="pn-record-overview"><div className="pn-record-main-column">
    <section className="pn-record-card"><header><h3>Objetivos</h3><button type="button" onClick={()=>setEditingGoal(true)}>Actualizar</button></header><h4>{patient.goal||'Todavía sin objetivo definido'}</h4><div className="pn-record-goal-progress" role="progressbar" aria-label="Avance declarado del objetivo" aria-valuenow={goal.progress} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${goal.progress}%`}}/></div><p>{goal.progress}% · {GOAL_STATUS_LABELS[goal.status]}</p><small>Avance registrado por la profesional; no se calcula a partir del peso.</small><details><summary>Historial del objetivo</summary>{goal.history.length?goal.history.map(entry=><article key={entry.id}><b>{entry.goal} · {entry.progress}%</b><p>{entry.note||'Sin nota profesional'}</p><small>{formatMetricDate(entry.updated_at.slice(0,10))}</small></article>):<p>Sin cambios registrados.</p>}</details></section>
  </div><aside className="pn-record-side-column">
    <section className="pn-record-card"><header><h3>Hábitos de la semana</h3></header><div className="pn-record-habit-stats">{[['Agua',patient.weekly_registration?.water_average!=null?`${patient.weekly_registration.water_average.toLocaleString('es-AR')} vasos/día registrado`:'Sin registro'],['Sueño',journey.sleepAverageMinutes!==null?`${(journey.sleepAverageMinutes/60).toLocaleString('es-AR',{maximumFractionDigits:1})} h promedio`:'Sin registro'],['Actividad',data.consented.includes('care_relationship')?`${activityDays} días con actividad registrada`:'Permiso de atención pendiente'],['Energía',patient.energy||'Sin registro']].map(([label,value])=><div key={label}><small>{label}</small><b>{value}</b></div>)}</div><small>Últimos siete días. La energía es el último registro de la paciente.</small></section>
  </aside></div>
    {editingGoal&&<GoalEditor patient={patient} onClose={()=>setEditingGoal(false)} onSaved={updated=>{onChanged(updated);setEditingGoal(false);}}/>}
  </div>;
}
