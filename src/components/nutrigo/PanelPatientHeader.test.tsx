import { renderToStaticMarkup } from 'react-dom/server';
import { expect,it,vi } from 'vitest';
import type { Patient } from '../../types';
import { PanelPatientHeader } from './PanelPatientHeader';
const patient={id:'p',name:'Ana',initials:'AA',tone:'mint',appointment:{meet_url:'javascript:alert(1)'}} as Patient;
it('conserva acciones de ficha sin inventar edad o abrir enlaces inseguros',()=>{
  const render=(p:Patient)=>renderToStaticMarkup(<PanelPatientHeader patient={p} onSection={vi.fn()} onOpen={vi.fn()} onEdit={vi.fn()}/>);
  const html=render(patient);for(const label of ['Volver a Pacientes','Editar datos de Ana','Escribir','Grabar consulta','Iniciar consulta'])expect(html).toContain(label);
  expect(html).not.toContain('javascript:');expect(html).not.toContain('años');
  const valid=render({...patient,appointment:{...patient.appointment!,meet_url:'https://meet.example.com/consulta'}});
  expect(valid).toContain('href="https://meet.example.com/consulta"');expect(valid).toContain('noopener noreferrer');
});
