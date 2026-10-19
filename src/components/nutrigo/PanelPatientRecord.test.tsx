import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {PublishedRecordPlan} from './PanelPatientPlan';
import {assertRecordFile} from './PanelPatientFiles';
import type {PatientMealPlan} from '../../types/plans';
it('la ficha respeta fecha, orden de momentos, etiquetas y contenido publicado',()=>{
 const plan={id:'p',version:3,meal_times:{Desayuno:'08:15'},meal_labels:{Desayuno:'Primera comida'},items:[{id:'d',for_date:'2026-10-19',slot:'Cena',free_text:'Cena publicada',portions:1,public_note:''},{id:'b',for_date:'2026-10-19',slot:'Desayuno',free_text:'Desayuno publicado',portions:2,public_note:'Indicación confirmada'},{id:'other',for_date:'2026-10-20',slot:'Desayuno',free_text:'Otro día privado',portions:1,public_note:''}]} as unknown as PatientMealPlan;
 const html=renderToStaticMarkup(<PublishedRecordPlan plan={plan} date="2026-10-19"/>);
 expect(html.indexOf('Desayuno publicado')).toBeLessThan(html.indexOf('Cena publicada'));
 expect(html).toContain('Primera comida');expect(html).toContain('08:15');expect(html).toContain('Indicación confirmada');expect(html).not.toContain('Otro día privado');
 expect(renderToStaticMarkup(<PublishedRecordPlan plan={plan} date="2026-10-21"/>)).toContain('Sin comidas indicadas');
});
it('la carga privada rechaza tipos no admitidos, archivos vacíos, rutas y exceso de tamaño',()=>{
 const file={name:'estudio.pdf',type:'application/pdf',size:1000};expect(()=>assertRecordFile(file)).not.toThrow();
 for(const change of [{type:'application/javascript'},{name:'estudio.exe'},{name:'../estudio.pdf'},{size:0},{size:21*1024*1024}])expect(()=>assertRecordFile({...file,...change})).toThrow();
});
