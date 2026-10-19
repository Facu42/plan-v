import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import type { PatientQuickPreview } from '../../types/patient-preview';
import { PATIENT_RECORD_SECTION_IDS } from '../../types/patient-preview';
import { DEFAULT_DIRECTORY_LAYOUT } from './directory-columns';
import { PanelPatientsTable, PatientQuickPreviewView } from './PanelPatientsTable';
const patient = { id:'p/a',name:'María de los Ángeles Rodríguez Fernández',initials:'MR',tone:'mint',goal:'Organizar las comidas',adherence_score:85,appointment:null,weekly_registration:null } as Patient;
const preview: PatientQuickPreview = { patient_id:patient.id,generated_at:'2026-10-19T15:00:00Z',source:'memory',can_open:true,latest_weight:{value:64,unit:'kg',captured_on:'2026-10-18'},plan:{status:'published',period_start:'2026-10-19',period_end:'2026-10-25',has_draft:false},last_consultation:{summary:'Acordamos organizar meriendas.',date:'2026-10-18'},sections:PATIENT_RECORD_SECTION_IDS.map(id=>({id,summary:`Dato de ${id}`})) };
describe('tabla de pacientes y resumen bajo la fila',()=>{
  it('conserva columnas reales y una apertura accesible por fila',()=>{
    const html=renderToStaticMarkup(<PanelPatientsTable patients={[patient]} layout={DEFAULT_DIRECTORY_LAYOUT} renderActions={()=> <button>Editar</button>} onOpen={vi.fn()} />);
    expect(html).toContain('aria-label="Ver resumen de María de los Ángeles Rodríguez Fernández"');
    expect(html).toContain('aria-expanded="false"');
    for(const label of ['Paciente','Próxima consulta','Plan','Adherencia','Peso','Cuota','App','Editar'])expect(html).toContain(label);
  });
  it('ofrece un acceso por cada sección existente y enlaces con paciente y sección correctos',()=>{
    const html=renderToStaticMarkup(<PatientQuickPreviewView patient={patient} preview={preview} onOpen={vi.fn()} />);
    for(const id of PATIENT_RECORD_SECTION_IDS)expect(html).toContain(`paciente=p%2Fa&amp;seccion=${id}`);
    expect(html).toContain('Abrir ficha completa');expect(html).toContain('Armar plan');expect(html).toContain('Escribir');
    expect(html).toContain('Acordamos organizar meriendas.');
  });
  it('no ofrece enlaces clínicos de una ficha archivada hasta restaurarla',()=>{
    const html=renderToStaticMarkup(<PatientQuickPreviewView patient={{...patient,archived_at:'2026-10-19'}} preview={{...preview,can_open:false}} onOpen={vi.fn()} />);
    expect(html).toContain('Restaurá la ficha');
    expect(html).not.toContain('href="/crm/ficha');
  });
  it('distingue falta de registros de una adherencia registrada de cero',()=>{
    const render=(registered:boolean)=>renderToStaticMarkup(<PatientQuickPreviewView patient={{...patient,adherence_score:0,weekly_registration:registered?{start:'2026-10-13',end:'2026-10-19',recorded_days:3,meals_logged:3,meals_pending:0,water_days:0,pending_review:0,water_average:null}:null}} preview={preview}/>);
    expect(render(false)).toContain('Sin registros');
    expect(render(false)).not.toContain('Adherencia registrada: 0%');
    expect(render(true)).toContain('Adherencia registrada: 0%');
  });
});
