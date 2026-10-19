import { expect,it } from 'vitest';
import type { Measurement } from '../../types/care';
import type { ClinicalWorkspaceRecord } from '../../types/clinical-workspace';
import { recordMetric,recordLabSeries } from './panel-record-data';
it('un gráfico de ficha no mezcla unidades, fechas futuras ni otra paciente',()=>{
  const measurement=(patient_id:string,value_numeric:number,unit:string,captured_on:string)=>({patient_id,kind:'weight',value_numeric,unit,captured_on,created_at:captured_on}) as Measurement;
  const rows=[measurement('p',65,'kg','2026-10-01'),measurement('p',140,'lb','2026-10-02'),measurement('p',90,'kg','2026-10-21'),measurement('otra',40,'kg','2026-10-19')];
  const value=recordMetric(rows,'p','weight','2026-10-19');
  expect(value).toMatchObject({unit:'lb',count:1,otherUnits:1,last:{value:140}});
  expect(recordMetric([], 'p','weight','2026-10-19')).toBeNull();
});
it('laboratorio conserva rangos originales y separa unidad y comparadores',()=>{
  const record=(date:string,unit:string,operator='' as ''|'<'|'>',value=14)=>({id:date+unit,patient_id:'p',recorded_on:date,created_at:date,data:{kind:'laboratory',document_id:'d',values:[{id:'v',name:'Ferritina',unit,operator,value,raw_value:operator+value,range_text:'Rango original',reviewed:true}]}}) as ClinicalWorkspaceRecord;
  const groups=recordLabSeries([record('2026-10-01','ng/ml'),record('2026-10-02','ng/ml','<',12),record('2026-10-03','µg/L')],'p','2026-10-19');
  expect(groups).toHaveLength(2);
  expect(groups.find(g=>g.unit==='ng/ml')?.points).toEqual([{date:'2026-10-01',value:14}]);
  expect(groups.every(g=>g.latest.range_text==='Rango original')).toBe(true);
});
import {recordLaboratoryText} from './panel-record-data';
it('la tabla no pierde un comparador agregado a mano ni lo duplica en el texto original',()=>{
 expect(recordLaboratoryText({raw_value:'20',operator:'<'})).toBe('< 20');
 expect(recordLaboratoryText({raw_value:'<20',operator:'<'})).toBe('<20');
 expect(recordLaboratoryText({raw_value:'Negativo',operator:''})).toBe('Negativo');
});
