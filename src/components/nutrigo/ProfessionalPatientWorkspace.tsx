import { useEffect, useState, type MouseEvent } from 'react';
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
import { NvButton } from './primitives';
import { ClinicalPatientWorkspace } from './ClinicalPatientWorkspace';
import type { ShowroomPage } from './ShowroomPanels';
import './professional-workspace.css';
import { ProfessionalLedgerSummary } from './ProfessionalLedgerSummary';
import { CarePanel } from './CarePanel';
import { ShowroomGrocery } from './ShowroomGrocery';
import { ShowroomMealPlan } from './ShowroomMealPlan';
import { ConsultationNotes,ConsultationCompletionPanel } from './ConsultationNotes';
import { PatientImportedHistory } from './PatientImportedHistory';
import { RECORD_MORE, RECORD_PRIMARY, recordTab, appointmentRecordSummary, type RecordTab } from './patient-record-sections';
import { ArrowRight } from '@phosphor-icons/react';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { BlurFade, LevelBar, NumberTicker } from './pro-motion';

const TAB_EASE = [0.23, 1, 0.32, 1] as const;

function fechaCorta(value?: string | null) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

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
  useEffect(()=>{
    const refresh=()=>{void refreshPatient(patient.id).then(()=>setRefreshError('')).catch(()=>setRefreshError('No pudimos actualizar el resumen semanal. Recargá para consultar los pendientes.'));};
    window.addEventListener('plan-v:care-changed',refresh);
    return ()=>window.removeEventListener('plan-v:care-changed',refresh);
  },[patient.id,refreshPatient]);
  const change = (next: RecordTab) => {
    if (next === tab) return;
    const url = new URL(window.location.href); url.searchParams.set('seccion', next);
    onOpenHref(url.pathname + url.search);
  };
  const p = buildShowroomPatient(patient, now);
  const appointments = appointmentRecordSummary(patient.appointment_history);
  const phone = (patient as Patient & { phone?: string | null }).phone;
  const reduce = useReducedMotion();
  const nameParts = patient.name.trim().split(/\s+/);
  const restName = nameParts.slice(1).join(' ');
  const splitName = restName.length > 2;
  const firstName = splitName ? nameParts[0] : patient.name;
  const history = (patient.appointment_history ?? []).slice(0, 4);
  const openPatientList = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onOpenHref('/crm/pacientes');
  };
  return <section className="pw-record pv-sheet" aria-label={`Espacio de ${patient.name}`}>
    <div className="pv-sheet-grid">
      <aside className="pv-side">
        <BlurFade>
          <p className="pv-crumbs"><a href="/crm/pacientes" onClick={openPatientList}>Todos los pacientes</a><span aria-hidden="true">→</span><span>{patient.name}</span></p>
          <div className="pv-identity">
            <span className="pv-avatar" aria-hidden="true">{patient.initials}</span>
            <h2 title={patient.name}><span>{firstName}</span>{splitName && <span>{restName}</span>}</h2>
          </div>
        </BlurFade>
        <BlurFade delay={0.04}>
          <article className="pv-idcard">
            <header><strong translate="no">{patient.id}</strong><time>{fechaCorta(patient.created_at)}</time></header>
            <dl>
              <div><dt>Teléfono</dt><dd>{phone || 'Sin teléfono registrado'}</dd></div>
              <div><dt>Próxima consulta</dt><dd>{patient.appointment?.when || 'Sin consulta programada'}</dd></div>
              <div><dt>Consultas realizadas</dt><dd><CompletedConsultationCount patientId={patient.id}/></dd></div>
              <div><dt>Asistencias</dt><dd>{appointments.confirmed.toLocaleString('es-AR')}</dd></div>
              <div><dt>Estado</dt><dd>{patient.archived_at ? 'Archivada' : patient.status}</dd></div>
            </dl>
          </article>
        </BlurFade>
        <BlurFade delay={0.08}>
          <div className="pv-mini">
            <article><h3>Alergias</h3><p>Sin dato cargado</p></article>
            <article><h3>Intolerancias</h3><p>Sin dato cargado</p></article>
            <article className="pv-mini-wide"><h3>Objetivo</h3><p>{patient.goal?.trim() || 'Sin objetivo'}</p></article>
          </div>
        </BlurFade>
        <BlurFade delay={0.12}>
          <ul className="pv-history">
            {(history.length ? history : [{ id: 'proxima', when: patient.appointment?.when || 'Sin consulta programada', action: 'scheduled' as const }]).map((row) => <li key={row.id}>
              <span className={`pv-dot pv-dot-${row.action === 'confirmed' ? 'lime' : row.action === 'cancelled' ? 'orange' : 'saffron'}`} aria-hidden="true" />
              <div><strong>{row.when}</strong><small>{row.action === 'confirmed' ? 'Confirmada' : row.action === 'cancelled' ? 'Cancelada' : 'Consulta'}</small></div>
              <a href={`/crm/ficha?paciente=${encodeURIComponent(patient.id)}&seccion=consultas`} aria-label={`Abrir consultas de ${patient.name}`} onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; event.preventDefault(); change('consultas'); }}><ArrowRight size={16} aria-hidden="true" /></a>
            </li>)}
          </ul>
          <NvButton className="nv-soft" onClick={onEdit}>Editar datos de ficha</NvButton>
        </BlurFade>
      </aside>
      <div className="pv-sheet-main">
        <BlurFade delay={0.05}>
          <h2 className="pv-sheet-title">{patient.appointment ? patient.appointment.when : (patient.goal?.trim() || 'Seguimiento')}</h2>
          <LayoutGroup id={`pv-tabs-${patient.id}`}>
            <nav className="pw-tabs" aria-label="Secciones de la ficha">
              {RECORD_PRIMARY.map(([id, label]) => <a key={id} href={`/crm/ficha?paciente=${encodeURIComponent(patient.id)}&seccion=${id}`} aria-current={id === tab ? 'page' : undefined} onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; event.preventDefault(); change(id); }}>{label}{id === tab && <motion.span className="pv-tab-line" layoutId="pv-tab-line" transition={{ duration: reduce ? 0.12 : 0.34, ease: TAB_EASE }} />}</a>)}
              <details className="pw-more">
                <summary aria-current={RECORD_MORE.some(([id]) => id === tab) ? 'page' : undefined}>Más de esta paciente</summary>
                <div>{RECORD_MORE.map(([id, label]) => <a key={id} href={`/crm/ficha?paciente=${encodeURIComponent(patient.id)}&seccion=${id}`} aria-current={id === tab ? 'page' : undefined} onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; event.preventDefault(); change(id); }}>{label}</a>)}</div>
              </details>
            </nav>
          </LayoutGroup>
          {tab === 'resumen' && <div className="pv-meters" aria-label="Medidas de la paciente">
            <article><header>Peso</header><strong>Sin dato</strong><LevelBar value={null} label={`Peso de ${patient.name}`} /><small>Todavía no hay un peso cargado</small></article>
            <article><header>IMC</header><strong>Sin dato</strong><LevelBar value={null} label={`IMC de ${patient.name}`} /><small>Hace falta el peso y la talla</small></article>
            <article><header>Cintura</header><strong>Sin dato</strong><LevelBar value={null} label={`Cintura de ${patient.name}`} /><small>Todavía no hay una medida</small></article>
            <article><header>Adherencia</header><strong><NumberTicker value={patient.adherence_score} />%</strong><LevelBar value={patient.adherence_score} label={`Adherencia de ${patient.name}`} /><small>{patient.adherence_why || 'Sin observación'}</small></article>
          </div>}
        </BlurFade>
    {refreshError && <p role="alert">{refreshError}</p>}
    <div key={`${patient.id}:${tab}`} className="pw-record-content">
      {tab === 'resumen' && <><ShowroomPatientRecord patient={patient} patients={patients} onSelect={onSelect} onEdit={onEdit} onOpen={onOpen} summaryOnly /><ProfessionalLedgerSummary patientId={patient.id} onOpen={() => change('cobros')} /></>}
      {tab === 'historia' && <><ShowroomIntakeReview patientId={patient.id} /><PatientImportedHistory patientId={patient.id} /></>}
      {tab === 'notas' && <ConsultationNotes patientId={patient.id} />}
      {tab === 'planificacion' && <NutritionTargetPanel patientId={patient.id} patientName={patient.name} onOpenPlan={() => change('plan')} />}
      {tab === 'evolucion' && <><ShowroomMeals patient={patient} query="" onSelect={onSelect} onReview={onReview} now={now} /><ShowroomProgress patient={p} professional /><ProfessionalMeasurements patientId={patient.id} patientName={patient.name} /><ClinicalPatientWorkspace patientId={patient.id} mode="mediciones"/><ShowroomGoals patient={patient} patients={patients} onSelect={onSelect} onChanged={addPatient} onOpenPatient={onSelect} showNutritionTarget={false} /></>}
      {tab === 'alimentario' && <ShowroomMeals patient={patient} query="" onSelect={onSelect} onReview={onReview} now={now} />}
      {tab === 'plan' && <><PlanSafetySummary patientId={patient.id} /><MealPlanEditor key={patient.id} patientId={patient.id} patientName={patient.name} professionalName={professionalName} onChanged={() => void api.getPatient(patient.id).then(({ patient: updated }) => addPatient(updated)).catch(() => undefined)} /></>}
      {tab === 'semanal' && <ShowroomMealPlan patient={patient} patients={patients} query="" onSelect={onSelect} onChanged={addPatient} now={now} />}
      {tab === 'compras' && <ShowroomGrocery patient={p} readOnly />}
      {tab === 'archivos' && <><CarePanel patientId={patient.id} mode="files" /><ClinicalPatientWorkspace patientId={patient.id} mode="exportacion"/></>}
      {tab === 'laboratorio' && <><CarePanel patientId={patient.id} mode="laboratory" /><ClinicalPatientWorkspace patientId={patient.id} mode="laboratorio"/></>}
      {tab === 'consultas' && <><ShowroomConsultations patient={patient} now={now} onSelect={onSelect} onChanged={addPatient} /><ConsultationCompletionPanel patientId={patient.id}/></>}
      {tab === 'chat' && <NutrigoMessages patient={p} patients={patients.map((person) => buildShowroomPatient(person, now))} role="pro" onSelect={onSelect} onNavigate={onNavigate} />}
      {tab === 'cobros' && <ShowroomCobranzas initialSelectedId={patient.id} />}
    </div>
      </div>
    </div>
  </section>;
}
