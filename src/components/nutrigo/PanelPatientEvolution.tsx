import { useState } from 'react';
import type { Patient } from '../../types';
import { useCare } from './useCare';
import { recordMetric } from './panel-record-data';
import { MetricChart } from './MetricChart';
import { MeasurementEntryDialog } from './MeasurementEntryDialog';
import { ProfessionalMeasurements } from './ProfessionalMeasurements';
import { ClinicalPatientWorkspace } from './ClinicalPatientWorkspace';
import { GoalEditor } from './ShowroomGoals';
import { getGoalSnapshot,GOAL_STATUS_LABELS } from '../crm/crm-goals';
import { buildJourneySummary } from '../patient/journey-summary';
import { formatMetricDate,formatMetricValue,formatChange } from './measurement-format';
import { NvState } from './primitives';
import { Icon } from '../shared/Icon';
import type { RecordTab } from './patient-record-sections';
const METRICS=[['weight','Peso'],['body_fat_pct','Grasa'],['waist','Cintura'],['muscle_mass','Músculo']] as const;
export function PanelPatientEvolution({patient,now,onSection,onChanged}:{patient:Patient;now:Date;onSection:(tab:RecordTab)=>void;onChanged:(patient:Patient)=>void}){
  const {data,error,reload}=useCare(patient.id,true);
  const [metric,setMetric]=useState<typeof METRICS[number][0]>('weight'),[entering,setEntering]=useState(false),[editingGoal,setEditingGoal]=useState(false),[advanced,setAdvanced]=useState(false),[evaluations,setEvaluations]=useState(false),[limit,setLimit]=useState(40);
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires'}).format(now),since=new Date(Date.parse(`${today}T12:00:00Z`)-6*86400000).toISOString().slice(0,10);
  if(error)return <NvState kind="error" title="No pudimos cargar la evolución" description={error} action={<button type="button" onClick={reload}>Reintentar evolución</button>}/>;
  if(!data)return <NvState kind="loading" title="Consultando evolución…" description="Cargando las mediciones autorizadas de la paciente."/>;
  const canMeasure=data.consented.includes('measurement'),canPhotos=data.consented.includes('body_progress');
  const measures=canMeasure?data.measurements.filter(m=>m.patient_id===patient.id&&m.captured_on<=today):[];
  const summary=recordMetric(measures,patient.id,metric,today);
  const dates=[...new Set(measures.map(m=>m.captured_on))].sort().reverse();
  const photoCount=canPhotos?data.records.filter(r=>r.patient_id===patient.id&&r.data.kind==='body_photo').length:0;
  const goal=getGoalSnapshot(patient),journey=buildJourneySummary({meal_logs:[],habit_logs:patient.habit_logs.filter(h=>h.patient_id===patient.id)},now);
  const activityDays=new Set(data.records.filter(r=>r.patient_id===patient.id&&r.data.kind==='activity'&&r.recorded_on>=since&&r.recorded_on<=today).map(r=>r.recorded_on)).size;
  return <div className="pn-record-evolution"><div className="pn-record-overview"><div className="pn-record-main-column">
    <section className="pn-record-card pn-record-weight"><header><h3>Peso y composición corporal</h3><div className="pn-record-ranges" aria-label="Métrica de evolución">{METRICS.map(([id,label])=><button type="button" key={id} aria-pressed={metric===id} onClick={()=>setMetric(id)}>{label}</button>)}</div></header>{!canMeasure?<p>Permiso de medidas pendiente.</p>:!summary?<p>Todavía no hay mediciones de {METRICS.find(([id])=>id===metric)?.[1].toLocaleLowerCase('es-AR')}.</p>:<><div className="pn-record-current"><b>{formatMetricValue(summary.last.value,summary.unit)}</b><small>{formatChange(summary.changeFromFirst,summary.unit)} desde el primer registro</small></div><MetricChart points={[...summary.history].reverse().map(row=>({date:row.date,value:row.value}))} unit={summary.unit} label={`Evolución de ${METRICS.find(([id])=>id===metric)?.[1]}`}/><div className="pn-record-chart-dates"><span>{formatMetricDate(summary.first.date)}</span><span>{formatMetricDate(summary.last.date)}</span></div>{summary.otherUnits>0&&<small>{summary.otherUnits} registros en otra unidad se conservan sin mezclarlos.</small>}</>}</section>
    <section className="pn-record-card"><header><h3>Mediciones</h3><button type="button" disabled={!canMeasure} onClick={()=>setEntering(true)}><Icon name="plus" size={14}/>Nueva medición</button></header><div className="pn-record-table-scroll"><table><thead><tr><th>Fecha</th>{[['weight','Peso'],['body_fat_pct','Grasa'],['muscle_mass','Músculo'],['waist','Cintura'],['hip','Cadera']].map(([kind,label])=><th key={kind}>{label}</th>)}<th>Por</th></tr></thead><tbody>{dates.slice(0,limit).map(date=>{const rows=measures.filter(m=>m.captured_on===date).sort((a,b)=>b.created_at.localeCompare(a.created_at));return <tr key={date}><td>{formatMetricDate(date)}</td>{['weight','body_fat_pct','muscle_mass','waist','hip'].map(kind=>{const value=rows.find(m=>m.kind===kind);return <td key={kind}>{value?formatMetricValue(value.value_numeric,value.unit):'—'}</td>;})}<td>{[...new Set(rows.map(m=>m.source==='professional'?'Consultorio':'Paciente'))].join(' · ')}</td></tr>;})}</tbody></table></div>{dates.length===0&&<p>Todavía no hay mediciones autorizadas.</p>}{dates.length>limit&&<button type="button" onClick={()=>setLimit(n=>n+40)}>Ver mediciones anteriores</button>}</section>
  </div><aside className="pn-record-side-column">
    <section className="pn-record-card"><header><h3>Objetivos</h3><button type="button" onClick={()=>setEditingGoal(true)}>Actualizar</button></header><h4>{patient.goal||'Todavía sin objetivo definido'}</h4><div className="pn-record-goal-progress" role="progressbar" aria-label="Avance declarado del objetivo" aria-valuenow={goal.progress} aria-valuemin={0} aria-valuemax={100}><i style={{width:`${goal.progress}%`}}/></div><p>{goal.progress}% · {GOAL_STATUS_LABELS[goal.status]}</p><small>Avance registrado por la profesional; no se calcula a partir del peso.</small><details><summary>Historial del objetivo</summary>{goal.history.length?goal.history.map(entry=><article key={entry.id}><b>{entry.goal} · {entry.progress}%</b><p>{entry.note||'Sin nota profesional'}</p><small>{formatMetricDate(entry.updated_at.slice(0,10))}</small></article>):<p>Sin cambios registrados.</p>}</details></section>
    <section className="pn-record-card"><header><h3>Hábitos de la semana</h3></header><div className="pn-record-habit-stats">{[['Agua',patient.weekly_registration?.water_average!=null?`${patient.weekly_registration.water_average.toLocaleString('es-AR')} vasos/día registrado`:'Sin registro'],['Sueño',journey.sleepAverageMinutes!==null?`${(journey.sleepAverageMinutes/60).toLocaleString('es-AR',{maximumFractionDigits:1})} h promedio`:'Sin registro'],['Actividad',`${activityDays} días con actividad registrada`],['Energía',patient.energy||'Sin registro']].map(([label,value])=><div key={label}><small>{label}</small><b>{value}</b></div>)}</div><small>Últimos siete días. La energía es el último registro de la paciente.</small></section>
    <section className="pn-record-card pn-record-photos"><Icon name="camera" size={24}/><div><h3>Fotos de progreso</h3><p>{canPhotos?`${photoCount} fotos privadas`:'Permiso de fotos pendiente'}</p></div><button type="button" onClick={()=>onSection('archivos')}>Ver archivos</button></section>
  </aside></div>
    <details className="pn-record-card" onToggle={event=>setAdvanced(event.currentTarget.open)}><summary>Todas las medidas, correcciones e importación de balanza</summary>{advanced&&<ProfessionalMeasurements patientId={patient.id} patientName={patient.name}/>}</details>
    <details className="pn-record-card" onToggle={event=>setEvaluations(event.currentTarget.open)}><summary>Evaluaciones clínicas y métodos del consultorio</summary>{evaluations&&<ClinicalPatientWorkspace patientId={patient.id} mode="mediciones"/>}</details>
    {entering&&<MeasurementEntryDialog patientId={patient.id} patientName={patient.name} onClose={()=>setEntering(false)}/>}
    {editingGoal&&<GoalEditor patient={patient} onClose={()=>setEditingGoal(false)} onSaved={updated=>{onChanged(updated);setEditingGoal(false);}}/>}
  </div>;
}
