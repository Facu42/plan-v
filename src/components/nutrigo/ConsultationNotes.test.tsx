import { describe,it,expect,vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConsultationCompletionPanel,ConsultationNotes } from './ConsultationNotes';
import { consultationsApi } from '../../api/consultations';
vi.mock('../../api/consultations',()=>({consultationsApi:{list:vi.fn(),command:vi.fn(),completions:vi.fn(),completeAppointment:vi.fn()}}));
vi.mock('./primitives',()=>({NvButton:({children,...props}:{children:React.ReactNode})=><button {...props}>{children}</button>}));
vi.mock('./unsaved-changes',()=>({useUnsavedChanges:()=>{},canLeaveWorkspace:()=>true}));
describe('consulta realizada exige confirmación separada',()=>{
 it('ofrece el control en las notas y explica qué acciones no completan una consulta',()=>{
  const html=renderToStaticMarkup(<ConsultationNotes patientId="patient-a"/>);
  expect(html).toContain('Confirmación de consultas realizadas');expect(html).toContain('La asistencia, el paso del horario y el cierre de una grabación no la confirman.');
  expect(html).not.toContain('0 consultas confirmadas');expect(consultationsApi.completeAppointment).not.toHaveBeenCalled();expect(consultationsApi.command).not.toHaveBeenCalled();
 });
 it('no muestra una consulta como realizada mientras está cargando',()=>{const html=renderToStaticMarkup(<ConsultationCompletionPanel patientId="patient-a"/>);expect(html).toContain('Consultando turnos y confirmaciones');expect(html).not.toContain('Consulta realizada</');});
});
