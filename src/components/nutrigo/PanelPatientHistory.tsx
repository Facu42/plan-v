import {useCare} from './useCare';
import {ShowroomIntakeReview} from './ShowroomIntakeReview';
import {PatientImportedHistory} from './PatientImportedHistory';
import {PlanSafetySummary} from './PlanSafetySummary';
import {formatMetricDate,formatMetricValue} from './measurement-format';
export function PanelPatientHistory({patientId,now}:{patientId:string;now:Date}){
 const {data,error,reload}=useCare(patientId,true),allowed=!error&&(data?.consented.includes('measurement')??false);
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires'}).format(now);
 const measurements=allowed?(data?.measurements??[]).filter(row=>row.patient_id===patientId&&row.captured_on<=today).sort((a,b)=>a.captured_on.localeCompare(b.captured_on)||b.created_at.localeCompare(a.created_at)):[];
 const firstDate=measurements[0]?.captured_on;
 return <div className="pn-record-history-grid"><div><ShowroomIntakeReview patientId={patientId}/><section className="pn-record-card"><header><h3>Datos del primer día</h3>{firstDate&&<small>{formatMetricDate(firstDate)}</small>}</header><p>Primera fecha con mediciones autorizadas. Los valores que no se cargaron ese día quedan sin dato.</p>{error?<p role="alert">{error} <button type="button" onClick={reload}>Reintentar medidas iniciales</button></p>:!data?<p role="status">Consultando medidas iniciales…</p>:!allowed?<p>Permiso de medidas pendiente.</p>:<div className="pn-record-initial-stats">{[['weight','Peso inicial'],['height','Altura'],['waist','Cintura'],['body_fat_pct','Grasa']].map(([kind,label])=>{const value=measurements.find(row=>row.captured_on===firstDate&&row.kind===kind);return <div key={kind}><small>{label}</small><b>{value?formatMetricValue(value.value_numeric,value.unit):'Sin dato'}</b></div>;})}</div>}</section></div><div><PatientImportedHistory patientId={patientId}/><PlanSafetySummary patientId={patientId}/></div></div>;
}
