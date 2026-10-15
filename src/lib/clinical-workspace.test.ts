import { describe,expect,it } from 'vitest';
import { parseLaboratoryPages,parseSegmentalPages,compareSegmental,bariatricSummary,kerrSummary,intakeExportLines } from './clinical-workspace';
import { clinicalWorkspaceInputSchema } from '../types/clinical-workspace';
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
  it('la extracción queda pendiente de revisión y no interpreta diagnósticos',()=>{
    expect(parseLaboratoryPages([{page:1,text:'Glucosa 95 mg/dL 70-110'}])[0].reviewed).toBe(false);
    expect(parseLaboratoryPages([{page:1,text:'Diagnóstico: diabetes\nResultado: normal'}])).toEqual([]);
  });
  it('sólo reconoce bioimpedancia con componente, segmento y unidad declarados',()=>{
    expect(parseSegmentalPages([{page:1,text:'Brazo derecho 2 kg\nMasa muscular\nBrazo izquierdo 2,5 kg\nAgua\nTronco 21 L'}])).toEqual([
      {segment:'arm_left',component:'muscle',value:2.5,unit:'kg',original:'Página 1: Brazo izquierdo 2,5 kg'},
      {segment:'trunk',component:'water',value:21,unit:'L',original:'Página 1: Tronco 21 L'},
    ]);
  });
  it('Kerr incompleto no declara una suma y pesos inválidos no producen porcentajes',()=>{
    expect(kerrSummary({muscle:30},70).complete).toBe(false);
    expect(kerrSummary({skin:4,adipose:15,muscle:30,bone:10,residual:11},70)).toEqual({complete:true,total_kg:70,difference_kg:0});
    expect(()=>bariatricSummary(0,80,null)).toThrow();
  });
  it('rechaza componentes con unidades incompatibles y duplicados ambiguos',()=>{
    const row={segment:'arm_right',component:'muscle',value:2.4,unit:'kg',original:'Valor del equipo'};
    const input={id:crypto.randomUUID(),recorded_on:'2026-10-01',note:'',reviewed:true,data:{kind:'segmental',reference_id:crypto.randomUUID(),document_id:null,device:'Equipo declarado',values:[row]}};
    expect(clinicalWorkspaceInputSchema.safeParse(input).success).toBe(true);
    expect(clinicalWorkspaceInputSchema.safeParse({...input,data:{...input.data,values:[{...row,unit:'ohm'}]}}).success).toBe(false);
    expect(clinicalWorkspaceInputSchema.safeParse({...input,data:{...input.data,values:[row,row]}}).success).toBe(false);
    expect(clinicalWorkspaceInputSchema.safeParse({...input,data:{...input.data,values:[{...row,unit:'%',value:101}]}}).success).toBe(false);
  });
  it('exporta el ingreso en español sin JSON ni nombres internos',()=>{
    const lines=intakeExportLines({preferred_name:'Sofi',patient_intent:'Regular horarios',phone:'+54 11 0000',allergies:{state:'reported',items:['Maní']},restrictions:{state:'unknown',items:[]},hydration_glasses:0,sleep_hours:8,energy:'Media',conditions_note:'Declaración ficticia',prefers_to_discuss:true});
    expect(lines).toContain('Nombre preferido: Sofi');expect(lines).toContain('Alergias declaradas: Maní');expect(lines).toContain('Restricciones declaradas: Sin informar');expect(lines).toContain('Agua declarada: 0 vasos por día');
    expect(lines.join('\n')).not.toMatch(/preferred_name|patient_intent|conditions_note|\{|\}/);
    expect(intakeExportLines({allergies:{state:'none',items:[]}})).toContain('Alergias declaradas: Declaró que no tiene');
  });
});
