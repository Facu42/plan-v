import {PROFESSIONAL_MODULES,plannedModuleHref,type ProfessionalModule} from './professional-modules';
import {Icon} from '../shared/Icon';
import {NvButton} from './primitives';
import './professional-modules.css';

export function PlannedModulesNav({onOpen,selectedId}:{onOpen:(href:string)=>void;selectedId?:string}){
  return <details className="pm-nav-future" open={Boolean(selectedId)}><summary><Icon name="clock" size={17}/><span>En preparación</span><span className="pm-nav-count">{PROFESSIONAL_MODULES.filter(m=>!m.href).length}</span></summary>
    <div>{PROFESSIONAL_MODULES.filter(m=>!m.href).map(m=><button key={m.id} type="button" aria-current={selectedId===m.id?'page':undefined} onClick={()=>onOpen(plannedModuleHref(m.id))}><Icon name={m.icon} size={17}/><span>{m.title}</span></button>)}</div>
  </details>;
}

function ModuleDetail({module:m,onOpen}:{module:ProfessionalModule;onOpen:(href:string)=>void}){
  return <article className="pm-module-detail" aria-label={m.title}>
    <header><span className="pm-module-icon"><Icon name={m.icon} size={23}/></span><div><h2>{m.title}</h2><p className={`pm-status ${m.href?'pm-ready':''}`}>{m.href?'Disponible · con ampliaciones previstas':'En preparación'}</p></div>{m.href&&<NvButton onClick={()=>onOpen(m.href!)}>{['mediciones','planificacion'].includes(m.id)?'Elegir paciente':'Abrir módulo'} <Icon name="arrow" size={15}/></NvButton>}</header>
    {['mediciones','planificacion'].includes(m.id)&&<p className="pm-module-note">Este apartado se abre desde la ficha. Elegí un paciente para continuar.</p>}
    {m.current.length>0&&<section><h3>Funciones disponibles</h3><ul>{m.current.map(text=><li key={text}>{text}</li>)}</ul></section>}
    {m.next.length>0&&<section><h3>{m.href?'Por completar':'Alcance previsto'}</h3><ul>{m.next.map(text=><li key={text}>{text}</li>)}</ul></section>}
    {!m.href&&<p className="pm-module-note">Este apartado todavía no permite realizar acciones. Acá podés consultar lo que vamos a desarrollar.</p>}
  </article>;
}

export function ProfessionalModules({selectedId,onOpen}:{selectedId?:string;onOpen:(href:string)=>void}){
  const selected=PROFESSIONAL_MODULES.find(m=>m.id===selectedId);
  return <section className="pm-modules" aria-label="Funciones del consultorio">
    <header className="pm-page-head"><div><h2>{selected?'Funciones del apartado':'Todas las funciones del consultorio'}</h2><p>Funciones presentes en esta versión de desarrollo y próximos apartados del plan.</p></div>{selected&&<NvButton className="nv-ghost" onClick={()=>onOpen('/crm/desarrollo')}>Ver todas las funciones</NvButton>}</header>
    {selected?<ModuleDetail module={selected} onOpen={onOpen}/>:<>
      <p className="pm-module-note">«Disponible» indica que el recorrido está implementado en esta versión. La publicación en producción se comprueba por separado.</p>
      {[...new Set(PROFESSIONAL_MODULES.map(m=>m.group))].map(group=><section className="pm-module-group" key={group}><h3>{group}</h3><div>{PROFESSIONAL_MODULES.filter(m=>m.group===group).map(m=><details key={m.id} className="pm-module-row"><summary><Icon name={m.icon} size={19}/><strong>{m.title}</strong><span className={`pm-status ${m.href?'pm-ready':''}`}>{m.href?'Disponible':'En preparación'}</span><Icon name="chevron" size={16}/></summary><ModuleDetail module={m} onOpen={onOpen}/></details>)}</div></section>)}
    </>}
  </section>;
}
