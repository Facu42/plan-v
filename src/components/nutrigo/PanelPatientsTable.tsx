import { Fragment, useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import type { Patient } from '../../types';
import type { BillingBoard } from '../../types/fees';
import type { PatientQuickPreview, PatientRowPreview } from '../../types/patient-preview';
import { crmWorkApi } from '../../api/crm-work';
import { formatPesos, summarizeLedger } from '../../fees';
import { Icon, type IconName } from '../shared/Icon';
import { DIRECTORY_COLUMNS, directoryGridTemplate, isColumnVisible, type DirectoryLayout } from './directory-columns';
import { RECORD_TABS } from './patient-record-sections';
import { daysAgoText, lastVisit } from './directory-last-visit';
import './panel-patients.css';

const SECTION_ICONS: Record<string,IconName> = { resumen:'grid',historia:'contact',evolucion:'trend',notas:'edit',plan:'list',semanal:'calendar',compras:'list',alimentario:'camera',chat:'message',archivos:'pin',laboratorio:'drop',planificacion:'target',consultas:'calendar',cobros:'wallet' };
const href = (patientId: string, section: string) => `/crm/ficha?${new URLSearchParams({paciente:patientId,seccion:section})}`;
function placePatientMenu(details: HTMLDetailsElement) {
  const menu=details.querySelector<HTMLElement>('.pn-row-menu')!;
  if(!details.open){if(menu.matches(':popover-open'))menu.hidePopover();return;}
  if(!menu.matches(':popover-open'))menu.showPopover();
  const rect=details.querySelector('summary')!.getBoundingClientRect();
  menu.style.top=`${Math.max(12,Math.min(rect.bottom+6,window.innerHeight-menu.offsetHeight-16))}px`;
  menu.style.left=`${Math.max(16,Math.min(rect.right-276,window.innerWidth-292))}px`;
}
function Link({to,onOpen,children,className=''}:{to:string;onOpen?: (href:string)=>void;children:ReactNode;className?:string}) {
  const open=(event:MouseEvent<HTMLAnchorElement>)=>{if(!onOpen||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button)return;event.preventDefault();onOpen(to);};
  return <a href={to} onClick={open} className={className}>{children}</a>;
}
export function PatientWeekSummary({patient}:{patient:Patient}) {
  const week=patient.weekly_registration;
  return <div className="nv-directory-weekly pn-week-summary">{week ? <><strong>{week.recorded_days} de 7 días</strong><small>{week.meals_logged} comidas registradas</small><small>{week.water_average===null?'Agua sin registrar':`Promedio: ${week.water_average.toLocaleString('es-AR')} vasos/día registrado`}</small>{week.pending_review>0&&<small>{week.pending_review} por revisar</small>}</> : <small>Resumen no disponible</small>}</div>;
}
export function PatientQuickPreviewView({patient,preview,onOpen}:{patient:Patient;preview:PatientQuickPreview;onOpen?: (href:string)=>void}) {
  if(!preview.can_open)return <div className="pn-preview-archived"><Icon name="history"/><p>Restaurá la ficha desde Más opciones para volver a trabajar con su historia.</p></div>;
  const weight=preview.latest_weight;
  const fee=preview.sections.find(s=>s.id==='cobros')?.summary;
  const plan=preview.sections.find(s=>s.id==='plan')?.summary;
  const hasAdherence=(patient.weekly_registration?.recorded_days??0)>0||patient.adherence_score>0;
  const alerts=[hasAdherence&&patient.adherence_score<70?`Adherencia registrada: ${patient.adherence_score}%`:null,patient.has_account===false?'Todavía no vinculó su cuenta a la app':null,preview.plan.status==='none'?'Sin plan publicado ni borrador':null,fee?.startsWith('Debe ')?fee:null].filter(Boolean);
  return <div className="pn-preview-content"><div className="pn-preview-context"><div className="pn-preview-stats">{[['Próxima consulta',patient.appointment?.when||'Sin turno'],['Adherencia',hasAdherence?`${patient.adherence_score}% registrada`:'Sin registros'],['Peso',weight?`${weight.value.toLocaleString('es-AR')} ${weight.unit}`:'Sin dato autorizado'],['Cuota',fee||'Sin dato']].map(([label,value])=><div key={label}><small>{label}</small><b>{value}</b></div>)}</div>
    {alerts.map(alert=><p className="pn-preview-alert" key={alert}><Icon name="bell" size={16}/>{alert}</p>)}<section className="pn-preview-last"><h3>Lo último de la consulta</h3><p>{preview.last_consultation?.summary||'Todavía no hay un resumen publicado de la consulta.'}</p>{preview.last_consultation&&<small>{preview.last_consultation.date.slice(0,10).split('-').reverse().join('/')}</small>}</section><PatientWeekSummary patient={patient}/></div>
    <div className="pn-preview-destinations"><header><h3>Ir directo a</h3><div>{patient.has_account!==false&&<Link to={`/crm/mensajes?${new URLSearchParams({paciente:patient.id})}`} onOpen={onOpen} className="pn-preview-button"><Icon name="message" size={15}/>Escribir</Link>}<Link to={href(patient.id,'plan')} onOpen={onOpen} className="pn-preview-button">Armar plan</Link><Link to={href(patient.id,'resumen')} onOpen={onOpen} className="pn-preview-button pn-preview-primary">Abrir ficha completa<Icon name="arrow" size={15}/></Link></div></header>
    <div className="pn-preview-links">{RECORD_TABS.map(([id,label])=><Link key={id} to={href(patient.id,id)} onOpen={onOpen}><span><Icon name={SECTION_ICONS[id]??'grid'} size={18}/></span><div><b>{label}</b><small>{preview.sections.find(s=>s.id===id)?.summary||'Sin dato'}{id==='plan'&&plan&&preview.plan.has_draft?' · con borrador':''}</small></div><Icon name="chevron" size={14}/></Link>)}</div></div></div>;
}
function QuickPreview({patient,open,onLoaded,onOpen,revision}:{patient:Patient;open:boolean;onLoaded:(value:PatientQuickPreview)=>void;onOpen?: (href:string)=>void;revision:number}) {
  const [mounted,setMounted]=useState(open);
  const [data,setData]=useState<PatientQuickPreview|null>(null);
  const [error,setError]=useState('');const [retry,setRetry]=useState(0);
  const loaded=useRef(onLoaded);loaded.current=onLoaded;
  useEffect(()=>{if(open){setMounted(true);return;}const timer=window.setTimeout(()=>{setMounted(false);setData(null);setError('');},300);return()=>window.clearTimeout(timer);},[open]);
  useEffect(()=>{
    if(!open)return;
    const controller=new AbortController();setData(null);setError('');
    crmWorkApi.patientPreview(patient.id,controller.signal).then(value=>{if(controller.signal.aborted)return;if(value.patient_id!==patient.id)throw Error('No pudimos identificar el resumen.');setData(value);loaded.current(value);}).catch(()=>{if(!controller.signal.aborted)setError('No pudimos cargar el resumen. Reintentá para consultar los datos.');});
    return()=>controller.abort();
  },[patient.id,open,retry,revision]);
  return <div className={`pn-quick-preview${open?' pn-open':''}`} aria-hidden={!open}><div className="pn-quick-inner" inert={!open}>{mounted&&<section role="region" aria-label={`Resumen de ${patient.name}`} className="pn-quick-body">{error?<div role="alert"><p>{error}</p><button type="button" className="pn-preview-button" onClick={()=>setRetry(n=>n+1)}>Reintentar resumen</button></div>:data?<PatientQuickPreviewView patient={patient} preview={data} onOpen={onOpen}/>:<p role="status">Consultando el resumen de {patient.name}…</p>}</section>}</div></div>;
}

export function PanelPatientsTable({patients,layout,billing,billingError=false,renderActions,onOpen}:{patients:Patient[];layout:DirectoryLayout;billing?:BillingBoard|null;billingError?:boolean;renderActions:(patient:Patient)=>ReactNode;onOpen?: (href:string)=>void}) {
  const [expanded,setExpanded]=useState<string|null>(null);
  const [previews,setPreviews]=useState<Record<string,PatientRowPreview>>({});
  const [rowError,setRowError]=useState(false);
  const [revision,setRevision]=useState(0);
  const rows=useRef(new Map<string,HTMLDivElement>());
  const show=(id:typeof DIRECTORY_COLUMNS[number]['id'])=>isColumnVisible(layout,id);
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires'}).format(new Date());
  const columns=directoryGridTemplate(layout);
  const rowIds=patients.map(p=>p.id).join('\n');
  const rowStates=patients.map(p=>`${p.id}:${p.archived_at??''}:${p.deactivated_at??''}`).join('\n');
  useEffect(()=>{
    const controller=new AbortController();setRowError(false);
    const ids=rowIds.split('\n').filter(Boolean);
    void (async()=>{
      for(let i=0;i<ids.length;i+=50){
        const batch=ids.slice(i,i+50);
        const result=await crmWorkApi.patientRows(batch,controller.signal);
        if(controller.signal.aborted)return;
        if(result.patients.length!==batch.length||result.patients.some(p=>!batch.includes(p.patient_id)))throw Error('Resumen inválido');
        setPreviews(current=>({...current,...Object.fromEntries(result.patients.map(p=>[p.patient_id,p]))}));
      }
    })().catch(()=>{if(!controller.signal.aborted)setRowError(true);});
    return()=>controller.abort();
  },[rowIds,rowStates,revision]);
  useEffect(()=>{
    const refresh=()=>{setPreviews({});setRevision(n=>n+1);};
    const closeMenus=(event:Event)=>{if(event.target instanceof Element&&event.target.closest('.pn-row-menu'))return;document.querySelectorAll<HTMLDetailsElement>('.pn-row-options[open]').forEach(menu=>{if(!menu.contains(event.target as Node))menu.open=false;});};
    const repositionMenus=()=>document.querySelectorAll<HTMLDetailsElement>('.pn-row-options[open]').forEach(placePatientMenu);
    window.addEventListener('focus',refresh);window.addEventListener('plan-v:care-changed',refresh);
    document.addEventListener('pointerdown',closeMenus);document.addEventListener('scroll',repositionMenus,true);
    return()=>{window.removeEventListener('focus',refresh);window.removeEventListener('plan-v:care-changed',refresh);document.removeEventListener('pointerdown',closeMenus);document.removeEventListener('scroll',repositionMenus,true);};
  },[]);
  useEffect(()=>{if(expanded&&!patients.some(p=>p.id===expanded))setExpanded(null);},[patients,expanded]);
  useEffect(()=>{
    const escape=(event:KeyboardEvent)=>{if(event.key!=='Escape'||!expanded||(event.target instanceof Element&&event.target.closest('[role="dialog"],.pn-row-options[open]')))return;event.preventDefault();setExpanded(null);rows.current.get(expanded)?.focus();};
    document.addEventListener('keydown',escape);return()=>document.removeEventListener('keydown',escape);
  },[expanded]);
  const toggle=(id:string)=>setExpanded(value=>value===id?null:id);
  return <div className="nv-directory-scroll pn-patients-scroll">{rowError&&<p role="alert">No pudimos cargar plan y peso. <button type="button" onClick={()=>setRevision(n=>n+1)}>Reintentar columnas</button></p>}<div role="table" aria-label="Pacientes del directorio" className={`pn-patients-table${layout.density==='compact'?' pn-density-compact':''}`} style={{'--pn-dir-cols':columns,'--pn-mobile-cols':`minmax(0,1.35fr) ${show('focus')?'minmax(72px,.8fr) ':''}${show('adherence')?'minmax(58px,.6fr) ':''}32px`} as CSSProperties}>
    <div role="row" className="pn-patient-head"><span role="columnheader">Paciente</span>{DIRECTORY_COLUMNS.filter(c=>show(c.id)).map(c=><span key={c.id} role="columnheader" className={`pn-col-${c.id}`}>{c.label}</span>)}<span role="columnheader"><span className="pn-actions-label">Acciones</span></span></div>
    {patients.map((patient,index)=>{const open=expanded===patient.id,preview=patient.archived_at?undefined:previews[patient.id],weight=preview?.latest_weight;const ledger=billing?.patients.find(l=>l.patient_id===patient.id);const fee=ledger?summarizeLedger(ledger,today):null;const last=lastVisit(patient.appointment_history,today);
      const cells:Record<typeof DIRECTORY_COLUMNS[number]['id'],ReactNode>={
        focus:<><b>{patient.appointment?.when||'Sin turno'}</b><small>{patient.next_focus||'Sin foco anotado'}</small></>,
        plan:<><b>{preview?({none:'Sin plan',draft:'Borrador',published:'Publicado',scheduled:'Programado'}[preview.plan.status]):'—'}</b><small>{preview?.plan.period_end?`Hasta ${preview.plan.period_end.split('-').reverse().join('/')}`:preview?'Sin período definido':'Consultando…'}</small></>,
        adherence:patient.weekly_registration?.recorded_days||patient.adherence_score>0?<div className="pn-adherence"><span><i style={{width:`${Math.max(0,Math.min(100,patient.adherence_score))}%`}}/></span><b>{patient.adherence_score}%</b></div>:<small>Sin registros</small>,
        weight:weight?<><b>{weight.value.toLocaleString('es-AR')} {weight.unit}</b><small>{weight.captured_on.split('-').reverse().join('/')}</small></>:<small>{preview?'Sin dato':'—'}</small>,
        status:<span className={`pn-status ${fee?.owed?'pn-status-alert':''}`}>{fee?fee.owed?`Debe ${formatPesos(fee.owed)}`:fee.pending_reports?'Por confirmar':fee.state==='sin_cuota'?'Sin cuota':'Al día':billingError?'No disponible':'Consultando…'}</span>,
        connection:<span className={`pn-status ${patient.has_account===false?'pn-status-alert':patient.has_account==null?'pn-status-unknown':''}`}>{patient.archived_at?'Archivada':patient.has_account===false?'Pendiente':patient.has_account===true?'Activa':'Sin dato'}</span>,
        weekly:<PatientWeekSummary patient={patient}/>,lastVisit:last?<><b>{daysAgoText(last.daysAgo)}</b><small>{last.dateId.split('-').reverse().join('/')}</small></>:<small>Sin consultas registradas</small>,
      };
      return <Fragment key={patient.id}><div role="row" className={`pn-patient-row${open?' pn-selected':''}`} tabIndex={0} aria-expanded={open} aria-label={`Ver resumen de ${patient.name}`} ref={element=>{if(element)rows.current.set(patient.id,element);else rows.current.delete(patient.id);}} style={{'--pn-row-delay':`${Math.min(index,7)*28}ms`} as CSSProperties} onClick={event=>{if((event.target as Element).closest('button,a,summary,details,input,select'))return;toggle(patient.id);}} onKeyDown={event=>{if(event.target!==event.currentTarget)return;if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle(patient.id);}}}>
        <span role="cell"><button type="button" tabIndex={-1} className="pn-patient-toggle" onClick={()=>toggle(patient.id)} aria-label={`Desplegar resumen de ${patient.name}`} aria-expanded={open}><span className={`pn-patient-avatar pn-tone-${patient.tone}`}>{patient.initials}</span><span><b>{patient.name}</b><small>{patient.goal||'Objetivo por definir'}</small></span><Icon name="chevron" size={16} className="pn-row-arrow"/></button></span>
        {DIRECTORY_COLUMNS.filter(c=>show(c.id)).map(c=><span key={c.id} role="cell" className={`pn-col-${c.id}`}>{cells[c.id]}</span>)}
        <span role="cell" className="pn-actions-cell"><details className="pn-row-options" name="pn-patient-actions" onToggle={event=>{if(event.target===event.currentTarget)placePatientMenu(event.currentTarget);}} onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();event.stopPropagation();event.currentTarget.open=false;event.currentTarget.querySelector<HTMLElement>('summary')?.focus();}}}><summary aria-label={`Más opciones de ${patient.name}`}><Icon name="list" size={18}/></summary><div className="pn-row-menu" popover="manual">{renderActions(patient)}<PatientWeekSummary patient={patient}/></div></details></span>
      </div><div role="row" className="pn-preview-row"><div role="cell" aria-colspan={DIRECTORY_COLUMNS.filter(c=>show(c.id)).length+2}><QuickPreview key={`${patient.id}:${patient.archived_at??''}:${revision}`} patient={patient} open={open} revision={revision} onLoaded={value=>setPreviews(current=>({...current,[patient.id]:value}))} onOpen={onOpen}/></div></div></Fragment>;
    })}
  </div></div>;
}
