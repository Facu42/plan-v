import type { Measurement } from '../../types/care';
import type { ClinicalWorkspaceRecord, LaboratoryValue } from '../../types/clinical-workspace';
import { summarizeMetric, type MetricKind } from '../../lib/body-metrics';
export function recordMetric(rows:readonly Measurement[],patientId:string,kind:MetricKind,today:string,days?:number){
  const since=days?new Date(Date.parse(`${today}T12:00:00Z`)-days*86400000).toISOString().slice(0,10):'';
  return summarizeMetric(rows.filter(row=>row.patient_id===patientId&&row.kind===kind&&row.captured_on<=today&&row.captured_on>=since).map(row=>({value:row.value_numeric,unit:row.unit,captured_on:row.captured_on,created_at:row.created_at})));
}
export type RecordLabSeries={key:string;name:string;unit:string;latest:LaboratoryValue;date:string;values:Array<{date:string;value:LaboratoryValue}>;points:Array<{date:string;value:number}>};
export function recordLabSeries(records:readonly ClinicalWorkspaceRecord[],patientId:string,today:string):RecordLabSeries[]{
  const groups=new Map<string,RecordLabSeries>();
  for(const record of [...records].filter(r=>r.patient_id===patientId&&r.recorded_on<=today).sort((a,b)=>a.recorded_on.localeCompare(b.recorded_on)||a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id))){
    if(record.data.kind!=='laboratory')continue;
    for(const value of record.data.values){
      const key=`${value.name.trim().toLocaleLowerCase('es-AR')}:${value.unit.trim().toLocaleLowerCase('es-AR')}`;
      const group=groups.get(key)??{key,name:value.name,unit:value.unit,latest:value,date:record.recorded_on,values:[],points:[]};
      group.values=group.values.filter(v=>v.date!==record.recorded_on);group.values.push({date:record.recorded_on,value});
      group.latest=value;group.date=record.recorded_on;groups.set(key,group);
    }
  }
  return [...groups.values()].map(group=>({...group,points:group.values.filter(row=>row.value.operator===''&&row.value.value!==null).map(row=>({date:row.date,value:row.value.value!}))}));
}
