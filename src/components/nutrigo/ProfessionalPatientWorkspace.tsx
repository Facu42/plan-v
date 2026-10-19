import { useEffect, useState } from 'react';
import type { MealLog, Patient } from '../../types';
import type { CrmEntry } from '../crm/crm-entry';
import { api } from '../../api/client';
import { careApi } from '../../api/care';
import { consultationsApi } from '../../api/consultations';
import { useAppStore } from '../../store/useAppStore';
import { ShowroomPatientRecord } from './ShowroomPatientRecord';
import { ShowroomIntakeReview } from './ShowroomIntakeReview';
import { NutritionTargetPanel } from './ShowroomNutritionTarget';
import { ShowroomMeals } from './ShowroomMeals';
import { ShowroomProgress } from './ShowroomProgress';
import { ProfessionalMeasurements } from './ProfessionalMeasurements';
import { ShowroomGoals } from './ShowroomGoals';
import { MealPlanEditor } from './MealPlanVersions';
import { ShowroomConsultations } from './ShowroomConsultations';
import { NutrigoMessages } from './NutrigoMessages';
import { ShowroomCobranzas } from './ShowroomCobranzas';
import { buildShowroomPatient } from './showroom-model';
import { canLeaveWorkspace } from './unsaved-changes';
import { healthFactLabel } from './intake-review';
import type { ProfessionalIntakeView } from '../../types/intake';
import { NvButton,NvState } from './primitives';
import { ClinicalPatientWorkspace } from './ClinicalPatientWorkspace';
import type { ShowroomPage } from './ShowroomPanels';
import './professional-workspace.css';
import { ProfessionalLedgerSummary } from './ProfessionalLedgerSummary';
import { CarePanel } from './CarePanel';
import { ShowroomGrocery } from './ShowroomGrocery';
import { ShowroomMealPlan } from './ShowroomMealPlan';
import { ConsultationNotes,ConsultationCompletionPanel } from './ConsultationNotes';
import { PatientImportedHistory } from './PatientImportedHistory';
import { RECORD_PRIMARY_TABS, RECORD_PLAN_TABS, recordPrimaryTab, recordTab, appointmentRecordSummary, type RecordTab } from './patient-record-sections';
import { PanelPatientHeader } from './PanelPatientHeader';
import { PanelPatientOverview } from './PanelPatientOverview';
import { PanelPatientFoodDiary } from './PanelPatientFoodDiary';
import { PanelPatientEvolution } from './PanelPatientEvolution';
import { PanelPatientLaboratory } from './PanelPatientLaboratory';
import './panel-patient-record.css';

export { RECORD_TABS, recordTab } from './patient-record-sections';
export type { RecordTab } from './patient-record-sections';

export function CompletedConsultationCount({patientId}:{patientId:string}){
  const [value,setValue]=useState<{patientId:string;count:number|null;error:boolean}>({patientId,count:null,error:false});
  useEffect(()=>{let controller=new AbortController();setValue({patientId,count:null,error:false});const load=()=>{controller.abort();controller=new AbortController();const signal=controller.signal;void consultationsApi.completions(patientId,0,1,signal).then(view=>{if(!signal.aborted)setValue({patientId,count:view.total_completed,error:false});}).catch(()=>{if(!signal.aborted)setValue({patientId,count:null,error:true});});};const changed=(event:Event)=>{if((event as CustomEvent<{patientId:string}>).detail?.patientId===patientId)load();};load();window.addEventListener('plan-v:consultation-completion-changed',changed);return()=>{controller.abort();window.removeEventListener('plan-v:consultation-completion-changed',changed);};},[patientId]);
  return <span>{value.patientId!==patientId||value.count===null?(value.error?'No disponible':'Consultando…'):value.count}</span>;
}

export function PlanSafetySummary({ patientId }: { patientId: string }) {
  const [view, setView] = useState<ProfessionalIntakeView | null>(null);
  const [consented, setConsented] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setView(null); setError('');
    Promise.all([api.getProfessionalIntake(patientId, { signal: controller.signal }), careApi.snapshot(patientId, true, controller.signal)]).then(([result, care]) => {
      if (!controller.signal.aborted) { setView(result); setConsented(care.consented); }
    }).catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'No pudimos consultar los antecedentes.'); });
    return () => controller.abort();
  }, [patientId, revision]);
  return <section className="pw-safety" aria-label="Datos vigentes para preparar el plan">
    <h3>Antes de preparar el plan</h3>
    {error ? <div role="alert"><p>{error}</p><NvButton onClick={() => setRevision((value) => value + 1)}>Reintentar antecedentes</NvButton></div>
      : !view ? <p role="status">Consultando alergias y permisos…</p> : <dl>
        <div><dt>Alergias</dt><dd>{healthFactLabel(view.intake.payload.allergies, 'alergias')}</dd></div>
        <div><dt>Restricciones</dt><dd>{healthFactLabel(view.intake.payload.restrictions, 'restricciones')}</dd></div>
        <div><dt>Ingreso</dt><dd>{view.intake.status === 'reviewed' ? 'Revisado' : 'Pendiente de revisión'}</dd></div>
        <div><dt>Permisos vigentes</dt><dd>{consented.map((purpose) => (({ care_relationship: 'Atención', meal_photo: 'Fotos de comidas', clinical_document: 'Estudios', measurement: 'Medidas', body_progress: 'Fotos corporales', ai_meal_analysis: 'IA de comidas', ai_menu_draft: 'IA de menús', ai_followup: 'IA de seguimiento' } as Record<string, string>)[purpose] ?? purpose)).join(' · ') || 'Sin permisos otorgados'}</dd></div>
      </dl>}
  </section>;
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
    onOpenHref(url.pathname + url.search);
  };
  const p = buildShowroomPatient(patient, now);
  const appointments = appointmentRecordSummary(patient.appointment_history);
  const phone = (patient as Patient & { phone?: string | null }).phone;
  return <section className="pw-record pn-record" aria-label={`Espacio de ${patient.name}`}>
    <PanelPatientHeader patient={patient} onSection={change} onOpen={onOpenHref} onEdit={onEdit}/>
    <details className="pn-record-context" onToggle={event=>setContextOpen(event.currentTarget.open)}><summary>Datos y contacto</summary><label>Paciente<select aria-label="Paciente de la ficha" value={patient.id} onChange={event=>onSelect(event.target.value)}>{patients.map(person=><option key={person.id} value={person.id}>{person.name}</option>)}</select></label><dl className="pw-record-contact"><div><dt>Teléfono</dt><dd>{phone || 'Sin teléfono registrado'}</dd></div><div><dt>Próxima consulta</dt><dd>{patient.appointment?.when || 'Sin consulta programada'}</dd></div><div><dt>Consultas realizadas</dt><dd>{contextOpen?<CompletedConsultationCount patientId={patient.id}/>: '—'}</dd></div><div><dt>Asistencias confirmadas</dt><dd>{appointments.confirmed}</dd></div></dl></details>
    <nav className="pw-tabs" aria-label="Secciones de la ficha">{RECORD_PRIMARY_TABS.map(([id, label]) => <button type="button" key={id} aria-current={id === recordPrimaryTab(tab) ? 'page' : undefined} onClick={() => change(id)}>{label}</button>)}</nav>
    {refreshError && <p role="alert">{refreshError}</p>}
    {readyId!==patient.id?<NvState kind={refreshError?'error':'loading'} title={refreshError?'No pudimos cargar la ficha':'Cargando ficha…'} description={refreshError||'Consultando los datos actualizados de la paciente.'} action={refreshError&&<NvButton onClick={()=>setPatientRevision(n=>n+1)}>Reintentar ficha</NvButton>}/>:<div key={`${patient.id}:${tab}`} className="pw-record-content">
      {recordPrimaryTab(tab)==='plan'&&<nav className="pn-record-plan-tabs" aria-label="Secciones del plan">{RECORD_PLAN_TABS.map(([id,label])=><button type="button" key={id} aria-current={id===tab?'page':undefined} onClick={()=>change(id)}>{label}</button>)}</nav>}
      {tab === 'resumen' && <PanelPatientOverview patient={patient} now={now} onSection={change} onReview={onReview}/>}
      {tab === 'historia' && <div className="pn-record-history-grid"><ShowroomIntakeReview patientId={patient.id}/><div><PatientImportedHistory patientId={patient.id}/><PlanSafetySummary patientId={patient.id}/></div></div>}
      {tab === 'notas' && <ConsultationNotes patientId={patient.id} showCompletions={false}/>}
      {tab === 'planificacion' && <NutritionTargetPanel patientId={patient.id} patientName={patient.name} onOpenPlan={() => change('plan')} />}
      {tab === 'evolucion' && <PanelPatientEvolution patient={patient} now={now} onSection={change} onChanged={addPatient}/>}
      {tab === 'alimentario' && <PanelPatientFoodDiary patient={patient} now={now} onReview={onReview} onSelect={onSelect}/>}
      {tab === 'plan' && <><PlanSafetySummary patientId={patient.id} /><MealPlanEditor key={patient.id} patientId={patient.id} patientName={patient.name} professionalName={professionalName} onChanged={() => void api.getPatient(patient.id).then(({ patient: updated }) => addPatient(updated)).catch(() => undefined)} /></>}
      {tab === 'semanal' && <ShowroomMealPlan patient={patient} patients={patients} query="" onSelect={onSelect} onChanged={addPatient} now={now} />}
      {tab === 'compras' && <ShowroomGrocery patient={p} readOnly />}
      {tab === 'archivos' && <><CarePanel patientId={patient.id} mode="files" /><ClinicalPatientWorkspace patientId={patient.id} mode="exportacion"/></>}
      {tab === 'laboratorio' && <PanelPatientLaboratory key={patient.id} patientId={patient.id} now={now}/>}
      {tab === 'consultas' && <><ShowroomConsultations patient={patient} now={now} onSelect={onSelect} onChanged={addPatient} /><ConsultationCompletionPanel patientId={patient.id}/></>}
      {tab === 'chat' && <NutrigoMessages patient={p} patients={patients.map((person) => buildShowroomPatient(person, now))} role="pro" onSelect={onSelect} onNavigate={onNavigate} />}
      {tab === 'cobros' && <ShowroomCobranzas initialSelectedId={patient.id} />}
    </div>}
  </section>;
}
