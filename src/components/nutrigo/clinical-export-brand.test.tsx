import type { ButtonHTMLAttributes, MouseEvent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClinicalExportPackage } from '../../api/clinical-workspace';
import type { ClinicBrand, ClinicalWorkspaceSnapshot } from '../../types/clinical-workspace';

const mocks=vi.hoisted(()=>({
  export:vi.fn(),build:vi.fn(),download:vi.fn(),
  buttons:new Map<string,ButtonHTMLAttributes<HTMLButtonElement>>(),
}));
vi.mock('../../api/clinical-workspace',()=>({clinicalWorkspaceApi:{export:mocks.export}}));
vi.mock('../../lib/clinical-pdf',()=>({buildClinicalPdf:mocks.build,downloadClinicalPdf:mocks.download}));
vi.mock('./primitives',async(importOriginal)=>{
  const original=await importOriginal<typeof import('./primitives')>();
  return {...original,NvButton:(props:ButtonHTMLAttributes<HTMLButtonElement>)=>{
    if(typeof props.children==='string')mocks.buttons.set(props.children,props);
    return <button {...props}/>;
  }};
});
import { ExportWorkspace } from './ClinicalPatientWorkspace';

const id='10000000-0000-4000-a000-000000000091';
const oldBrand:ClinicBrand={name:'Marca anterior',contact:'Contacto anterior',license:'Vieja',logo:null};
const newBrand:ClinicBrand={name:'Marca actual',contact:'Contacto actual',license:'Nueva',logo:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg=='};
const snapshot=(brand:ClinicBrand|null):ClinicalWorkspaceSnapshot=>({brand,records:[],documents:[],references:[]});
const pkg=(brand:ClinicBrand|null):ClinicalExportPackage=>({
  patient:{id,name:'Paciente ficticia actual',goal:'Objetivo vigente',initials:'PF',tone:'mint',status:'Activa',
    billing_status:'waived',billing_until:null,stage:'plan',sensitive_hours:'',plan_b:'',next_focus:'',
    adherence_score:0,adherence_why:'',time:'Hoy',hydration:0,energy:null,sleep_minutes:null,appointment:null,
    habit_logs:[],todayPlan:[],weekPlan:[],brief:null,timeline:[],meal_logs:[],messages:[]},snapshot:snapshot(brand),
  intake:{status:'reviewed',revision:1,payload:{}},clinical_notes:[],measurements:[],imported_history:[],imported_measurements:[],consented:[],
});
function render(brand:ClinicBrand|null){
  renderToStaticMarkup(<ExportWorkspace patientId={id} snapshot={snapshot(brand)} onChanged={vi.fn()}/>);
  const action=mocks.buttons.get('Descargar ficha PDF');
  expect(action).toBeDefined();
  return action!;
}
async function click(action:ButtonHTMLAttributes<HTMLButtonElement>){
  expect(action.disabled).toBeFalsy();
  await action.onClick?.({} as MouseEvent<HTMLButtonElement>);
}
beforeEach(()=>{
  mocks.export.mockReset();mocks.build.mockReset().mockResolvedValue(new Uint8Array([37,80,68,70,45]));
  mocks.download.mockReset();mocks.buttons.clear();
});
describe('descarga clínica con configuración vigente',()=>{
  it('el botón real consulta la ficha autorizada y usa marca, logo y paciente de esa respuesta',async()=>{
    const action=render(oldBrand);mocks.export.mockResolvedValue(pkg(newBrand));
    await click(action);
    expect(mocks.export).toHaveBeenCalledExactlyOnceWith(id);
    expect(mocks.build).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({brand:newBrand,patientName:'Paciente ficticia actual',privateNotes:false}));
    expect(mocks.download).toHaveBeenCalledOnce();
  });
  it('una marca retirada después de abrir la pantalla impide generar y descargar con la anterior',async()=>{
    const action=render(oldBrand);mocks.export.mockResolvedValue(pkg(null));
    await click(action);
    expect(mocks.export).toHaveBeenCalledExactlyOnceWith(id);
    expect(mocks.build).not.toHaveBeenCalled();expect(mocks.download).not.toHaveBeenCalled();
  });
  it('una marca creada después de abrir la pantalla puede consultarse aunque el snapshot inicial no tenga firma',async()=>{
    const action=render(null);mocks.export.mockResolvedValue(pkg(newBrand));
    await click(action);
    expect(mocks.export).toHaveBeenCalledExactlyOnceWith(id);
    expect(mocks.build).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({brand:newBrand}));
    expect(mocks.buttons.get('Guardar pedido y descargar PDF')?.disabled).toBeFalsy();
  });
  it('una respuesta sin marca válida no recupera el logo ni la firma guardados en la pantalla',async()=>{
    const action=render(oldBrand);mocks.export.mockResolvedValue(pkg({...newBrand,logo:'https://example.test/logo.png'}));
    await click(action);
    expect(mocks.build).not.toHaveBeenCalled();expect(mocks.download).not.toHaveBeenCalled();
  });
  it('la pérdida de autorización en la consulta reciente no permite descargar datos cacheados',async()=>{
    const action=render(oldBrand);mocks.export.mockRejectedValue(new Error('Acceso retirado'));
    await click(action);
    expect(mocks.export).toHaveBeenCalledExactlyOnceWith(id);
    expect(mocks.build).not.toHaveBeenCalled();expect(mocks.download).not.toHaveBeenCalled();
  });
});
