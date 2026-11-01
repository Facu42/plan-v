import { describe,it,expect,vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConsultationCompletionPanel,ConsultationNotes,EstadoDelAudio,estadoDelAudio } from './ConsultationNotes';
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

describe('estado del audio de la consulta',()=>{
 const vacio={grabacion:false,ia:false,pendientes:0,tareas:[] as {kind:'chunk'|'summary';status:string}[]};
 it('dice cuando falta el permiso y cuando ya está',()=>{
  expect(estadoDelAudio(vacio).permiso).toContain('falta la autorización');
  expect(estadoDelAudio({...vacio,grabacion:true,ia:false}).permiso).toContain('falta la autorización');
  expect(estadoDelAudio({...vacio,grabacion:true,ia:true}).permiso).toContain('permitió grabar y transcribir');
 });
 it('separa subida, transcripción, audio borrado y audio conservado',()=>{
  expect(estadoDelAudio({...vacio,grabacion:true,ia:true}).subida).toContain('no hay una subida');
  expect(estadoDelAudio({...vacio,pendientes:1}).subida).toContain('se está subiendo');
  expect(estadoDelAudio({...vacio,tareas:[{kind:'chunk',status:'uploading'}]}).subida).toContain('se está subiendo');
  expect(estadoDelAudio({...vacio,tareas:[{kind:'chunk',status:'queued'}]}).transcripcion).toContain('se está transcribiendo');
  expect(estadoDelAudio({...vacio,tareas:[{kind:'chunk',status:'running'}]}).transcripcion).toContain('se está transcribiendo');
  expect(estadoDelAudio({...vacio,tareas:[{kind:'chunk',status:'succeeded'}]}).audio).toContain('se borró');
  expect(estadoDelAudio({...vacio,tareas:[{kind:'chunk',status:'cancelled'}]}).audio).toContain('se borró');
  expect(estadoDelAudio({...vacio,tareas:[{kind:'chunk',status:'failed'}]}).audio).toContain('sigue guardado');
  expect(estadoDelAudio(vacio).audio).toContain('todavía no hay audio');
  expect(estadoDelAudio({...vacio,tareas:[{kind:'chunk',status:'succeeded'},{kind:'chunk',status:'failed'}]}).audio).toContain('sigue guardado');
 });
 it('el botón de reintento aparece solo si hay un trabajo fallido',()=>{
  const fallido=renderToStaticMarkup(<EstadoDelAudio grabacion ia pendientes={0} tareas={[{kind:'chunk',status:'failed'}]} onReintentar={()=>{}} />);
  expect(fallido).toContain('Reintentar');
  expect(fallido).toContain('sigue guardado');
  const borrado=renderToStaticMarkup(<EstadoDelAudio grabacion ia pendientes={0} tareas={[{kind:'chunk',status:'succeeded'}]} />);
  expect(borrado).toContain('se borró');
  expect(borrado).not.toContain('Reintentar');
  expect(renderToStaticMarkup(<ConsultationNotes patientId="patient-a"/>)).toContain('Estado del audio');
 });
});
