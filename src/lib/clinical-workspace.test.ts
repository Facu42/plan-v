import { describe,expect,it } from 'vitest';
import { parseLaboratoryPages,compareSegmental,bariatricSummary } from './clinical-workspace';
describe('datos clínicos revisables',()=>{
  it('extrae analito, operador, unidad y rango con página original sin diagnosticar',()=>{
    const rows=parseLaboratoryPages([{page:2,text:'Hemoglobina 12,3 g/dL 11,5 - 15,5\nGlucosa < 100 mg/dL 70 - 110\nComentario sin valor'}]);
    expect(rows).toHaveLength(2);expect(rows[0]).toMatchObject({name:'Hemoglobina',value:12.3,unit:'g/dL',range_text:'11,5 - 15,5',page:2});expect(rows[1].operator).toBe('<');
  });
  it('compara únicamente el mismo segmento, componente y unidad',()=>{
    const before=[{segment:'arm_right',component:'muscle',value:2,unit:'kg'}];
    expect(compareSegmental(before,[{...before[0],value:2.5}])[0].delta).toBe(0.5);
    expect(compareSegmental(before,[{...before[0],unit:'%',value:20}])[0].delta).toBeNull();
  });
  it('calcula cambios de peso y no inventa una referencia de exceso',()=>{
    expect(bariatricSummary(120,90,null)).toEqual({lost_kg:30,total_loss_pct:25,excess_loss_pct:null});
    expect(bariatricSummary(120,90,60).excess_loss_pct).toBe(50);
    expect(bariatricSummary(90,100,100).excess_loss_pct).toBeNull();
  });
});
