import type { ButtonHTMLAttributes, EffectCallback, FormEvent, MouseEvent, ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClinicalExportPackage } from '../../api/clinical-workspace';
import type { ClinicBrand, ClinicalWorkspaceSnapshot } from '../../types/clinical-workspace';
const mocks=vi.hoisted(()=>({
  export:vi.fn(),save:vi.fn(),build:vi.fn(),download:vi.fn(),
  buttons:new Map<string,ButtonHTMLAttributes<HTMLButtonElement>>(),
  forms:[] as Array<{children:ReactNode;onSubmit:(event:FormEvent)=>unknown}>,
  effects:[] as EffectCallback[],seeds:[] as unknown[],updates:[] as unknown[],
}));
vi.mock('react',async importOriginal=>{
  const original=await importOriginal<typeof import('react')>();
  return {...original,useState:(initial:unknown)=>{
    const [state,setState]=original.useState(mocks.seeds.length?mocks.seeds.shift():initial);
    return [state,(value:unknown)=>{mocks.updates.push(value);setState(value);}];
  },useEffect:(effect:EffectCallback,deps?:unknown[])=>{
    mocks.effects.push(effect);original.useEffect(effect,deps);
  },useLayoutEffect:(effect:EffectCallback,deps?:unknown[])=>{
    mocks.effects.push(effect);original.useLayoutEffect(effect,deps);
  }};
});
vi.mock('react/jsx-runtime',async importOriginal=>{
  const original=await importOriginal<typeof import('react/jsx-runtime')>();
  const collect=(type:unknown,props:unknown)=>{
    const form=props as {children:ReactNode;onSubmit?:(event:FormEvent)=>unknown};
    if(type==='form'&&form?.onSubmit)mocks.forms.push({children:form.children,onSubmit:form.onSubmit});
  };
  return {...original,jsx:(...args:Parameters<typeof original.jsx>)=>{collect(args[0],args[1]);return original.jsx(...args);},jsxs:(...args:Parameters<typeof original.jsxs>)=>{collect(args[0],args[1]);return original.jsxs(...args);}};
});
vi.mock('react/jsx-dev-runtime',async importOriginal=>{
  const original=await importOriginal<typeof import('react/jsx-dev-runtime')>();
  return {...original,jsxDEV:(...args:Parameters<typeof original.jsxDEV>)=>{
    const props=args[1] as {children:ReactNode;onSubmit?:(event:FormEvent)=>unknown};
    if(args[0]==='form'&&props.onSubmit)mocks.forms.push({children:props.children,onSubmit:props.onSubmit});
    return original.jsxDEV(...args);
  }};
});
vi.mock('../../api/clinical-workspace',()=>({clinicalWorkspaceApi:{export:mocks.export,save:mocks.save}}));
vi.mock('../../lib/clinical-pdf',()=>({buildClinicalPdf:mocks.build,downloadClinicalPdf:mocks.download}));
vi.mock('./primitives',async importOriginal=>{
  const original=await importOriginal<typeof import('./primitives')>();
  return {...original,NvButton:(props:ButtonHTMLAttributes<HTMLButtonElement>)=>{
    if(typeof props.children==='string')mocks.buttons.set(props.children,props);
    return <button {...props}/>;
  }};
});
import { ExportWorkspace } from './ClinicalPatientWorkspace';
import { canLeaveWorkspace } from './unsaved-changes';
const patientA='10000000-0000-4000-a000-000000000091',patientB='10000000-0000-4000-a000-000000000092';
const brand:ClinicBrand={name:'Consultorio ficticio',contact:'Contacto ficticio',license:'Registro ficticio',logo:null};
const snapshot:ClinicalWorkspaceSnapshot={brand,records:[],documents:[],references:[]};
const pkg:ClinicalExportPackage={patient:{id:patientA,name:'Paciente ficticia A',initials:'PA',tone:'mint',status:'Activa',billing_status:'waived',billing_until:null,stage:'plan',goal:'',sensitive_hours:'',plan_b:'',next_focus:'',adherence_score:0,adherence_why:'',time:'Hoy',hydration:0,energy:null,sleep_minutes:null,appointment:null,habit_logs:[],todayPlan:[],weekPlan:[],brief:null,timeline:[],meal_logs:[],messages:[]},snapshot,intake:{status:'reviewed',revision:1,payload:{}},clinical_notes:[],measurements:[],imported_history:[],imported_measurements:[],consented:[]};
let cleanups:Array<()=>void>=[];
function unmount(){for(const cleanup of cleanups.splice(0).reverse())cleanup();}
function render(patientId=patientA,onChanged:()=>void=vi.fn()){
  mocks.forms.length=0;mocks.effects.length=0;
  renderToStaticMarkup(<ExportWorkspace patientId={patientId} snapshot={snapshot} onChanged={onChanged}/>);
  // Ejecutar los effects reales como al confirmar montaje; sus cleanups simulan cierre.
  cleanups.push(...mocks.effects.map(effect=>effect()).filter((cleanup):cleanup is ()=>void=>typeof cleanup==='function'));
  return mocks.buttons.get('Descargar ficha PDF')!;
}
function click(action:ButtonHTMLAttributes<HTMLButtonElement>){return action.onClick?.({} as MouseEvent<HTMLButtonElement>);}
function hasText(value:unknown,text:string):boolean{
  if(value===text)return true;if(Array.isArray(value))return value.some(child=>hasText(child,text));
  return Boolean(value&&typeof value==='object'&&'props'in value&&hasText((value as {props:{children?:unknown}}).props.children,text));
}
function orderForm(){return mocks.forms.find(form=>hasText(form.children,'Guardar pedido y descargar PDF'))!;}
function deferred<T>(){let resolve!:(value:T)=>void;const promise=new Promise<T>(done=>{resolve=done;});return{promise,resolve};}
beforeEach(()=>{
  mocks.export.mockReset().mockResolvedValue(pkg);mocks.save.mockReset().mockResolvedValue({record:{id:'Pedido ficticio'}});
  mocks.build.mockReset().mockResolvedValue(new Uint8Array([37,80,68,70,45]));mocks.download.mockReset();
  mocks.buttons.clear();mocks.forms.length=0;mocks.effects.length=0;mocks.seeds.length=0;mocks.updates.length=0;
  vi.stubGlobal('window',{addEventListener:vi.fn(),removeEventListener:vi.fn(),confirm:vi.fn(()=>true)});
});
afterEach(()=>{unmount();vi.unstubAllGlobals();});
describe('lifecycle de descarga clínica',()=>{
  it('cerrar mientras la API responde impide construir o descargar datos después del cierre',async()=>{
    const api=deferred<ClinicalExportPackage>();mocks.export.mockReturnValue(api.promise);
    const pending=click(render());unmount();api.resolve(pkg);await pending;
    expect(mocks.build).not.toHaveBeenCalled();expect(mocks.download).not.toHaveBeenCalled();
  });
  it('A cambia a B mientras se construye el PDF y el resultado tardío de A no se descarga',async()=>{
    const build=deferred<Uint8Array>();mocks.build.mockReturnValue(build.promise);
    const pending=click(render());await vi.waitFor(()=>expect(mocks.build).toHaveBeenCalledOnce());
    unmount();render(patientB);build.resolve(new Uint8Array([37,80,68,70,45]));await pending;
    expect(mocks.export).toHaveBeenCalledExactlyOnceWith(patientA);expect(mocks.download).not.toHaveBeenCalled();
  });
  it('el pedido guardado descarga antes de refrescar la ficha y no cancela su propia operación',async()=>{
    mocks.seeds.push('Glucosa','','',false,false,'');const events:string[]=[];
    mocks.save.mockImplementation(async()=>{events.push('save');return{record:{id:'Pedido ficticio'}};});
    mocks.export.mockImplementation(async()=>{events.push('export');return pkg;});
    mocks.build.mockImplementation(async()=>{events.push('build');return new Uint8Array([37,80,68,70,45]);});
    mocks.download.mockImplementation(()=>events.push('download'));
    render(patientA,()=>{events.push('refresh');unmount();});
    await orderForm().onSubmit({preventDefault:vi.fn()} as unknown as FormEvent);
    expect(events).toEqual(['save','export','build','download','refresh']);expect(mocks.save).toHaveBeenCalledOnce();
  });
  it('si falla el PDF, conserva el pedido guardado y comunica ese resultado sin refrescar ni borrar campos',async()=>{
    mocks.seeds.push('Glucosa','','',false,false,'');const refresh=vi.fn();
    mocks.build.mockRejectedValue(new Error('Fuente de PDF no disponible'));
    render(patientA,refresh);await orderForm().onSubmit({preventDefault:vi.fn()} as unknown as FormEvent);
    expect(mocks.save).toHaveBeenCalledOnce();expect(mocks.download).not.toHaveBeenCalled();expect(refresh).not.toHaveBeenCalled();
    expect(mocks.updates.some(value=>typeof value==='string'&&value.includes('El pedido quedó guardado'))).toBe(true);
  });
  it('una operación ocupada registra el bloqueo real de navegación de la ficha',()=>{
    mocks.seeds.push('','','',false,true,'');render();
    expect(canLeaveWorkspace(()=>true)).toBe(false);
  });
  it('dos clics antes de repintar usan una sola consulta y descarga',async()=>{
    const api=deferred<ClinicalExportPackage>();mocks.export.mockReturnValue(api.promise);const action=render();
    const first=click(action),second=click(action);api.resolve(pkg);await Promise.all([first,second]);
    expect(mocks.export).toHaveBeenCalledExactlyOnceWith(patientA);expect(mocks.download).toHaveBeenCalledOnce();
  });
});
