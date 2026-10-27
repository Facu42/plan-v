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
import { RECORD_PLAN_TABS, recordTab, appointmentRecordSummary, type RecordTab } from './patient-record-sections';
import {PanelPatientHistory} from './PanelPatientHistory';
import { FichaSolapas, PanelFichaCabecera } from './PanelFichaCabecera';
import { FxKv, FxPanel } from './ficha-fx';
import { PanelFichaResumen } from './PanelFichaResumen';
import { conteoDeSolapas, seccionDe, solapaDe } from './ficha-presentacion';
import { pendientesDeFicha } from './ficha-pendientes';
import { useFichaData } from './use-ficha-data';
import { usePatientTags } from './use-patient-tags';
import { homeDay } from '../../lib/panel-home';
import { PanelPatientFoodDiary } from './PanelPatientFoodDiary';
import { PanelPatientMedicionesExtra } from './PanelPatientEvolution';
import { PanelFichaMediciones } from './PanelFichaMediciones';
import { PanelFichaHistoria } from './PanelFichaHistoria';
import { PanelFichaObjetivos } from './PanelFichaObjetivos';
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
  const datos=useFichaData(patient);
  const etiquetas=usePatientTags(patient.id);
  const solapa=solapaDe(tab);
  useEffect(()=>{const nav=tabsRef.current,active=nav?.querySelector<HTMLElement>('[aria-current=page]');if(!nav||!active)return;const delta=active.getBoundingClientRect().left-nav.getBoundingClientRect().left-(nav.clientWidth-active.offsetWidth)/2;nav.scrollLeft+=delta;},[tab]);
  useEffect(()=>{
    let active=true;setReadyId(null);setRefreshError('');
    const refresh=()=>{void refreshPatient(patient.id).then(()=>{if(active){setRefreshError('');setReadyId(patient.id);}}).catch(()=>{if(active)setRefreshError('No pudimos actualizar la ficha. Reintentá para consultar sus datos.');});};
    refresh();window.addEventListener('plan-v:care-changed',refresh);
    return ()=>{active=false;window.removeEventListener('plan-v:care-changed',refresh);};
  },[patient.id,refreshPatient,patientRevision]);
  const change = (next: RecordTab) => {
    if (next === tab) return;
    const url = new URL(window.location.href); url.searchParams.set('seccion', next);
    const focusTab=document.activeElement instanceof Element&&Boolean(document.activeElement.closest('.ftabs'));
    onOpenHref(url.pathname + url.search);
    if(focusTab)requestAnimationFrame(()=>tabsRef.current?.querySelector<HTMLElement>('[aria-current=page]')?.focus({preventScroll:true}));
  };
  const p = buildShowroomPatient(patient, now);
  const appointments = appointmentRecordSummary(patient.appointment_history);
  const phone = (patient as Patient & { phone?: string | null }).phone;
  const pendientes = pendientesDeFicha(patient, datos, homeDay(now));
  const conteo = conteoDeSolapas({ comidas: pendientes.comidas, notaPorAprobar: pendientes.notaPorAprobar, alterados: pendientes.alterados.length });
  const contacto = <FxPanel titulo="Datos y contacto"><label className="fxsel">Paciente<select aria-label="Paciente de la ficha" value={patient.id} onChange={event=>onSelect(event.target.value)}>{patients.map(person=><option key={person.id} value={person.id}>{person.name}</option>)}</select></label><FxKv filas={[['Teléfono',phone||'Sin teléfono registrado'],['Próxima consulta',patient.appointment?.when||'Sin consulta programada'],['Consultas realizadas',<CompletedConsultationCount key="hechas" patientId={patient.id}/>],['Asistencias confirmadas',String(appointments.confirmed)]]}/></FxPanel>;
  return <div className="scr" id="s-ficha" aria-label={`Espacio de ${patient.name}`}>
    <PanelFichaCabecera patient={patient} now={now} datos={datos} etiquetasPropias={etiquetas.tags} onGuardarEtiquetas={etiquetas.guardar} onBack={()=>onOpenHref('/crm/pacientes')} onChat={()=>change('chat')} onAgendar={()=>onOpenHref('/crm/agenda')} onEdit={onEdit} onConsulta={()=>change('consultas')}/>
    <FichaSolapas ref={tabsRef} activa={solapa} conteo={conteo} onChange={next=>change(seccionDe(next))}/>
    {refreshError && <p role="alert">{refreshError}</p>}
    <div id="fwrap" style={{flex:1,minHeight:0,display:'flex',flexDirection:'column'}}>
    {readyId!==patient.id?<NvState kind={refreshError?'error':'loading'} title={refreshError?'No pudimos cargar la ficha':'Cargando ficha…'} description={refreshError||'Consultando los datos actualizados de la paciente.'} action={refreshError&&<NvButton onClick={()=>setPatientRevision(n=>n+1)}>Reintentar ficha</NvButton>}/>
    :tab==='resumen'?<PanelFichaResumen key={patient.id} patient={patient} now={now} datos={datos} ir={next=>change(seccionDe(next))}>{contacto}</PanelFichaResumen>
    :tab==='evolucion'?<PanelFichaMediciones key={patient.id} patient={patient} now={now} datos={datos} ir={next=>change(seccionDe(next))}><div className="pw-record pn-record"><div className="pw-record-content"><PanelPatientMedicionesExtra patientId={patient.id} patientName={patient.name}/></div></div></PanelFichaMediciones>
    :tab==='planificacion'?<PanelFichaObjetivos key={patient.id} patient={patient} now={now} datos={datos} onChanged={addPatient}><div className="pw-record pn-record"><div className="pw-record-content"><NutritionTargetPanel patientId={patient.id} patientName={patient.name} onOpenPlan={() => change('plan')} /></div></div></PanelFichaObjetivos>
    :<div className="pw-record pn-record"><div key={`${patient.id}:${tab}`} className="pw-record-content">
      {solapa==='plan'&&<nav className="pn-record-plan-tabs" aria-label="Secciones del plan">{RECORD_PLAN_TABS.filter(([id])=>id!=='planificacion').map(([id,label])=><button type="button" key={id} aria-current={id===tab?'page':undefined} onClick={()=>change(id)}>{label}</button>)}</nav>}
      {tab === 'historia' && <PanelFichaHistoria key={patient.id} patient={patient} now={now} datos={datos}><details id="hc-respuestas" className="pn-record-card" open><summary>Respuestas del formulario, datos importados y primer día</summary><PanelPatientHistory patientId={patient.id} now={now}/></details></PanelFichaHistoria>}
      {tab === 'notas' && <ConsultationNotes patientId={patient.id} showCompletions={false}/>}
      {tab === 'alimentario' && <PanelPatientFoodDiary patient={patient} now={now} onReview={onReview} onSelect={onSelect}/>}
      {tab === 'plan' && <PanelPatientPlan patientId={patient.id} patientName={patient.name} professionalName={professionalName} now={now} onSection={change} onChanged={()=>void refreshPatient(patient.id)}/>}
      {tab === 'semanal' && <ShowroomMealPlan patient={patient} patients={patients} query="" onSelect={onSelect} onChanged={addPatient} now={now} />}
      {tab === 'compras' && <ShowroomGrocery patient={p} readOnly />}
      {tab === 'archivos' && <PanelPatientFiles key={patient.id} patientId={patient.id}/>}
      {tab === 'laboratorio' && <PanelPatientLaboratory key={patient.id} patientId={patient.id} now={now} ir={next=>change(seccionDe(next))}/>}
      {tab === 'consultas' && <div className="pn-record-diary-grid"><div className="pn-record-main-column"><ShowroomConsultations embedded patient={patient} now={now} onSelect={onSelect} onChanged={addPatient}/><button type="button" onClick={()=>change('notas')}>Ver notas de consulta</button></div><aside className="pn-record-side-column"><ConsultationCompletionPanel patientId={patient.id}/></aside></div>}
      {tab === 'chat' && <div className="pn-record-chat-scope"><NutrigoMessages embedded patient={p} patients={patients.map((person) => buildShowroomPatient(person, now))} role="pro" onSelect={onSelect} onNavigate={onNavigate} /></div>}
      {tab === 'cobros' && <PanelPatientBilling key={patient.id} patientId={patient.id} onOpen={()=>onOpenHref('/crm/cobranzas')}/>}
    </div></div>}
    </div>
  </div>;
}
