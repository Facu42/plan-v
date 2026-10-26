import { describe, it, expect } from 'vitest';
import { planPrintHtml, type PlanPrintCopy } from './PlanPrintDocument';
const copy = { patientName:'Prueba', professionalName:'', demo:true, brand:{name:'Mi consultorio', contact:'', logo:''}, version:{version:1,period_start:'2026-10-12',period_end:'2026-10-20',items:[{id:'a',for_date:'2026-10-12',slot:'Desayuno',components:[{id:'c',kind:'food',quantity:1,measure:'taza',grams:200,food_revision:1,food_snapshot:{name:'Leche',source:'manual',portions:[{name:'taza',grams:200}],nutrients:{}}}]}]} } as unknown as PlanPrintCopy;
const all = {logo:true,caseras:true,compras:true,recetas:true,hoja:true};
describe('Opciones del documento',()=>{
  it('retira la marca y los colores al apagar logo',()=>{expect(planPrintHtml({...copy,options:{...all,logo:false}})).not.toContain('Mi consultorio');});
  it('retira las medidas caseras',()=>{expect(planPrintHtml({...copy,options:{...all,caseras:false}})).not.toContain('taza');});
  it('no inventa gramos cuando falta una equivalencia',()=>{
    const unknown=JSON.parse(JSON.stringify(copy)) as PlanPrintCopy;
    const food=unknown.version.items[0].components![0];
    if(food.kind==='food') food.food_snapshot!.portions=[];
    const html=planPrintHtml({...unknown,options:{...all,caseras:false}});
    expect(html).toContain('Cantidad sin confirmar');expect(html).not.toContain('NaN');expect(html).not.toContain('1 g');
  });
  it('incluye compras sólo si se pide',()=>{expect(planPrintHtml({...copy,options:all})).toContain('Lista de compras');expect(planPrintHtml({...copy,options:{...all,compras:false}})).not.toContain('Lista de compras');});
  it('oculta pasos de recetas conservando el título',()=>{
    const recipeCopy = {...copy,version:{...copy.version,items:[{id:'r',for_date:'2026-10-12',slot:'Desayuno',recipe:{title:'Ensalada',yield_portions:1,nutrition:'unknown',ingredients:[],steps:['Mezclar con cuidado']},portions:1}]} } as unknown as PlanPrintCopy;
    expect(planPrintHtml({...recipeCopy,options:all})).toContain('Mezclar con cuidado');
    const off=planPrintHtml({...recipeCopy,options:{...all,recetas:false}});
    expect(off).toContain('Ensalada');expect(off).not.toContain('Mezclar con cuidado');
  });
  it('marca los saltos de semana sólo si se pide',()=>{expect(planPrintHtml({...copy,options:all})).toContain('data-week-break="true"');expect(planPrintHtml({...copy,options:{...all,hoja:false}})).not.toContain('data-week-break="true"');});
});
