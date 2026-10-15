import { renderToStaticMarkup } from 'react-dom/server';
import { describe,expect,it } from 'vitest';
import { PlanPrintDocument } from './PlanPrintDocument';
import type { PlanVersionView } from '../../types/plans';
const version={id:'v1',version:1,status:'published',period_start:'2026-10-12',period_end:'2026-10-12',published_at:'2026-10-12T00:00:00Z',meal_labels:{Desayuno:'Primera comida'},items:[{id:'i1',for_date:'2026-10-12',slot:'Desayuno',free_text:'Indicación',public_note:''}]} as PlanVersionView;
describe('Documento con marca del consultorio',()=>{
  it('usa el logo incorporado y el contacto sin insertar recursos externos',()=>{
    const html=renderToStaticMarkup(<PlanPrintDocument version={version} patientName="Paciente ficticia" professionalName="Profesional" demo={false} brand={{name:'Consultorio propio',contact:'Contacto de prueba',logo:'data:image/png;base64,AAAA'}}/>);
    expect(html).toContain('Consultorio propio');expect(html).toContain('Contacto de prueba');expect(html).toContain('data:image/png;base64,AAAA');expect(html).toContain('Primera comida');
  });
  it('escapa los textos de la marca y mantiene la identidad original si no se configura',()=>{
    const html=renderToStaticMarkup(<PlanPrintDocument version={version} patientName="Paciente ficticia" professionalName="" demo={false} brand={{name:'<script>bad()</script>',contact:'<img onerror=bad()>',logo:''}}/>);
    expect(html).not.toContain('<script>');expect(html).toContain('&lt;script&gt;');
    expect(renderToStaticMarkup(<PlanPrintDocument version={version} patientName="" professionalName="" demo={false}/>)).toContain('Plan V · Nutrición');
  });
});
