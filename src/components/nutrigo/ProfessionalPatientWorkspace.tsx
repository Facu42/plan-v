import { useEffect, useRef, useState } from 'react';
import type { MealLog, Patient } from '../../types';
import type { CrmEntry } from '../crm/crm-entry';
import { consultationsApi } from '../../api/consultations';
import { useAppStore } from '../../store/useAppStore';
import { NutritionTargetPanel } from './ShowroomNutritionTarget';
import { ShowroomConsultations } from './ShowroomConsultations';
import { NutrigoMessages } from './NutrigoMessages';
import { buildShowroomPatient } from './showroom-model';
import { canLeaveWorkspace } from './unsaved-changes';
import { NvButton,NvState } from './primitives';
import type { ShowroomPage } from './ShowroomPanels';
import './professional-workspace.css';
import { ShowroomGrocery } from './ShowroomGrocery';
import { ShowroomMealPlan } from './ShowroomMealPlan';
import { ConsultationNotes,ConsultationCompletionPanel } from './ConsultationNotes';
import { RECORD_PRIMARY_TABS, RECORD_PLAN_TABS, recordPrimaryTab, recordTab, appointmentRecordSummary, type RecordTab } from './patient-record-sections';
import {PanelPatientHistory} from './PanelPatientHistory';
import { PanelPatientHeader } from './PanelPatientHeader';
import { PanelPatientOverview } from './PanelPatientOverview';
import { PanelPatientFoodDiary } from './PanelPatientFoodDiary';
import { PanelPatientEvolution } from './PanelPatientEvolution';
import {PanelPatientBilling} from './PanelPatientBilling';
import { PanelPatientFiles } from './PanelPatientFiles';
export {PlanSafetySummary} from './PlanSafetySummary';
import { PanelPatientPlan } from './PanelPatientPlan';
import { PanelPatientLaboratory } from './PanelPatientLaboratory';
import './panel-patient-record.css';

export { RECORD_TABS, recordTab } from './patient-record-sections';
export type { RecordTab } from './patient-record-sections';

export function CompletedConsultationCount({patientId}:{patientId:string}){
  const [value,setValue]=useState<{patientId:string;count:number|null;error:boolean}>({patientId,count:null,error:false});
  useEffect(()=>{let controller=new AbortController();setValue({patientId,count:null,error:false});const load=()=>{controller.abort();controller=new AbortController();const signal=controller.signal;void consultationsApi.completions(patientId,0,1,signal).then(view=>{if(!signal.aborted)setValue({patientId,count:view.total_completed,error:false});}).catch(()=>{if(!signal.aborted)setValue({patientId,count:null,error:true});});};const changed=(event:Event)=>{if((event as CustomEvent<{patientId:string}>).detail?.patientId===patientId)load();};load();window.addEventListener('plan-v:consultation-completion-changed',changed);return()=>{controller.abort();window.removeEventListener('plan-v:consultation-completion-changed',changed);};},[patientId]);
  return <span>{value.patientId!==patientId||value.count===null?(value.error?'No disponible':'Consultando…'):value.count}</span>;
}

export function ProfessionalPatientWorkspace({ patient, patients, onSelect, onEdit, onOpen, onOpenHref, onReview, onNavigate, now, professionalName }: {
  patient: Patient; patients: Patient[]; professionalName?: string; onSelect: (id: string) => void; onEdit: () => void;
  onOpen: (entry: CrmEntry) => void; onOpenHref: (href: string) => void; onReview: (meal: MealLog) => void; onNavigate: (page: ShowroomPage) => void; now: Date;
}) {
  const tab = recordTab(typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('seccion'));
  const addPatient = useAppStore((store) => store.addPatient);
  const refreshPatient = useAppStore(store => store.refreshPatient);
  const [refreshError,setRefreshError] = useState('');
  const [readyId,setReadyId]=useState<string|null>(null);
  const [patientRevision,setPatientRevision]=useState(0);
  const tabsRef=useRef<HTMLElement>(null);
  useEffect(()=>{const nav=tabsRef.current,active=nav?.querySelector<HTMLElement>('[aria-current=page]');if(!nav||!active)return;const delta=active.getBoundingClientRect().left-nav.getBoundingClientRect().left-(nav.clientWidth-active.offsetWidth)/2;nav.scrollLeft+=delta;},[tab]);
  const [contextOpen,setContextOpen] = useState(false);
  useEffect(()=>{
    let active=true;setReadyId(null);setRefreshError('');
    const refresh=()=>{void refreshPatient(patient.id).then(()=>{if(active){setRefreshError('');setReadyId(patient.id);}}).catch(()=>{if(active)setRefreshError('No pudimos actualizar la ficha. Reintentá para consultar sus datos.');});};
    refresh();window.addEventListener('plan-v:care-changed',refresh);
    return ()=>{active=false;window.removeEventListener('plan-v:care-changed',refresh);};
  },[patient.id,refreshPatient,patientRevision]);
  const change = (next: RecordTab) => {
    if (next === tab) return;
    const url = new URL(window.location.href); url.searchParams.set('seccion', next);
    const focusTab=document.activeElement instanceof Element&&Boolean(document.activeElement.closest('.pw-tabs'));
    onOpenHref(url.pathname + url.search);
    if(focusTab)requestAnimationFrame(()=>tabsRef.current?.querySelector<HTMLElement>('[aria-current=page]')?.focus({preventScroll:true}));
  };
  const p = buildShowroomPatient(patient, now);
  const appointments = appointmentRecordSummary(patient.appointment_history);
  const phone = (patient as Patient & { phone?: string | null }).phone;
  return <section className="pw-record pn-record" aria-label={`Espacio de ${patient.name}`}>
    <PanelPatientHeader patient={patient} onSection={change} onOpen={onOpenHref} onEdit={onEdit}/>
    <details className="pn-record-context" onToggle={event=>setContextOpen(event.currentTarget.open)}><summary>Datos y contacto</summary><label>Paciente<select aria-label="Paciente de la ficha" value={patient.id} onChange={event=>onSelect(event.target.value)}>{patients.map(person=><option key={person.id} value={person.id}>{person.name}</option>)}</select></label><dl className="pw-record-contact"><div><dt>Teléfono</dt><dd>{phone || 'Sin teléfono registrado'}</dd></div><div><dt>Próxima consulta</dt><dd>{patient.appointment?.when || 'Sin consulta programada'}</dd></div><div><dt>Consultas realizadas</dt><dd>{contextOpen?<CompletedConsultationCount patientId={patient.id}/>: '—'}</dd></div><div><dt>Asistencias confirmadas</dt><dd>{appointments.confirmed}</dd></div></dl></details>
    <nav ref={tabsRef} className="pw-tabs" aria-label="Secciones de la ficha">{RECORD_PRIMARY_TABS.map(([id, label]) => <button type="button" key={id} aria-current={id === recordPrimaryTab(tab) ? 'page' : undefined} onClick={() => change(id)}>{label}</button>)}</nav>
    {refreshError && <p role="alert">{refreshError}</p>}
    {readyId!==patient.id?<NvState kind={refreshError?'error':'loading'} title={refreshError?'No pudimos cargar la ficha':'Cargando ficha…'} description={refreshError||'Consultando los datos actualizados de la paciente.'} action={refreshError&&<NvButton onClick={()=>setPatientRevision(n=>n+1)}>Reintentar ficha</NvButton>}/>:<div key={`${patient.id}:${tab}`} className="pw-record-content">
      {recordPrimaryTab(tab)==='plan'&&<nav className="pn-record-plan-tabs" aria-label="Secciones del plan">{RECORD_PLAN_TABS.map(([id,label])=><button type="button" key={id} aria-current={id===tab?'page':undefined} onClick={()=>change(id)}>{label}</button>)}</nav>}
      {tab === 'resumen' && <PanelPatientOverview patient={patient} now={now} onSection={change} onReview={onReview}/>}
      {tab === 'historia' && <PanelPatientHistory patientId={patient.id} now={now}/>}
      {tab === 'notas' && <ConsultationNotes patientId={patient.id} showCompletions={false}/>}
      {tab === 'planificacion' && <NutritionTargetPanel patientId={patient.id} patientName={patient.name} onOpenPlan={() => change('plan')} />}
      {tab === 'evolucion' && <PanelPatientEvolution patient={patient} now={now} onSection={change} onChanged={addPatient}/>}
      {tab === 'alimentario' && <PanelPatientFoodDiary patient={patient} now={now} onReview={onReview} onSelect={onSelect}/>}
      {tab === 'plan' && <PanelPatientPlan patientId={patient.id} patientName={patient.name} professionalName={professionalName} now={now} onSection={change} onChanged={()=>void refreshPatient(patient.id)}/>}
      {tab === 'semanal' && <ShowroomMealPlan patient={patient} patients={patients} query="" onSelect={onSelect} onChanged={addPatient} now={now} />}
      {tab === 'compras' && <ShowroomGrocery patient={p} readOnly />}
      {tab === 'archivos' && <PanelPatientFiles key={patient.id} patientId={patient.id}/>}
      {tab === 'laboratorio' && <PanelPatientLaboratory key={patient.id} patientId={patient.id} now={now}/>}
      {tab === 'consultas' && <div className="pn-record-diary-grid"><div className="pn-record-main-column"><ShowroomConsultations embedded patient={patient} now={now} onSelect={onSelect} onChanged={addPatient}/><button type="button" onClick={()=>change('notas')}>Ver notas de consulta</button></div><aside className="pn-record-side-column"><ConsultationCompletionPanel patientId={patient.id}/></aside></div>}
      {tab === 'chat' && <div className="pn-record-chat-scope"><NutrigoMessages embedded patient={p} patients={patients.map((person) => buildShowroomPatient(person, now))} role="pro" onSelect={onSelect} onNavigate={onNavigate} /></div>}
      {tab === 'cobros' && <PanelPatientBilling key={patient.id} patientId={patient.id} onOpen={()=>onOpenHref('/crm/cobranzas')}/>}
    </div>}
  </section>;
}
