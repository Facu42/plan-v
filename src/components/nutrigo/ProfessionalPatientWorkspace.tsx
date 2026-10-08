import { useEffect, useState } from 'react';
import type { MealLog, Patient } from '../../types';
import type { CrmEntry } from '../crm/crm-entry';
import { api } from '../../api/client';
import { careApi } from '../../api/care';
import { useAppStore } from '../../store/useAppStore';
import { ShowroomPatientRecord } from './ShowroomPatientRecord';
import { ShowroomIntakeReview } from './ShowroomIntakeReview';
import { NutritionTargetPanel } from './ShowroomNutritionTarget';
import { ShowroomMeals } from './ShowroomMeals';
import { ShowroomProgress } from './ShowroomProgress';
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
import type { ShowroomPage } from './ShowroomPanels';
import './professional-workspace.css';
import { ProfessionalLedgerSummary } from './ProfessionalLedgerSummary';

export const RECORD_TABS = [
  ['resumen', 'Resumen'], ['ingreso', 'Ingreso y antecedentes'], ['registros', 'Registros y evolución'],
  ['planificacion', 'Planificación'], ['plan', 'Plan alimentario'], ['consultas', 'Consultas'], ['mensajes', 'Mensajes'], ['cobros', 'Cobros'],
] as const;
export type RecordTab = typeof RECORD_TABS[number][0];
export function recordTab(value: string | null): RecordTab {
  return RECORD_TABS.some(([id]) => id === value) ? value as RecordTab : 'resumen';
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
  const change = (next: RecordTab) => {
    if (next === tab) return;
    const url = new URL(window.location.href); url.searchParams.set('seccion', next);
    onOpenHref(url.pathname + url.search);
  };
  const p = buildShowroomPatient(patient, now);
  return <section className="pw-record" aria-label={`Espacio de ${patient.name}`}>
    <header className="pw-record-head"><div><p>Ficha del paciente</p><h2>{patient.name}</h2><span>{patient.goal || 'Objetivo por definir'}</span></div><NvButton className="nv-soft" onClick={onEdit}>Editar datos de ficha</NvButton></header>
    <nav className="pw-tabs" aria-label="Secciones de la ficha">{RECORD_TABS.map(([id, label]) => <button type="button" key={id} aria-current={id === tab ? 'page' : undefined} onClick={() => change(id)}>{label}</button>)}</nav>
    <div key={`${patient.id}:${tab}`} className="pw-record-content">
      {tab === 'resumen' && <><ShowroomPatientRecord patient={patient} patients={patients} onSelect={onSelect} onEdit={onEdit} onOpen={onOpen} summaryOnly /><ProfessionalLedgerSummary patientId={patient.id} onOpen={() => change('cobros')} /></>}
      {tab === 'ingreso' && <ShowroomIntakeReview patientId={patient.id} />}
      {tab === 'planificacion' && <NutritionTargetPanel patientId={patient.id} patientName={patient.name} onOpenPlan={() => change('plan')} />}
      {tab === 'registros' && <><ShowroomMeals patient={patient} query="" onSelect={onSelect} onReview={onReview} now={now} /><ShowroomProgress patient={p} professional /><ShowroomGoals patient={patient} patients={patients} onSelect={onSelect} onChanged={addPatient} onOpenPatient={onSelect} showNutritionTarget={false} /></>}
      {tab === 'plan' && <><PlanSafetySummary patientId={patient.id} /><MealPlanEditor key={patient.id} patientId={patient.id} patientName={patient.name} professionalName={professionalName} onChanged={() => void api.getPatient(patient.id).then(({ patient: updated }) => addPatient(updated)).catch(() => undefined)} /></>}
      {tab === 'consultas' && <ShowroomConsultations patient={patient} now={now} onSelect={onSelect} onChanged={addPatient} />}
      {tab === 'mensajes' && <NutrigoMessages patient={p} patients={patients.map((person) => buildShowroomPatient(person, now))} role="pro" onSelect={onSelect} onNavigate={onNavigate} />}
      {tab === 'cobros' && <ShowroomCobranzas initialSelectedId={patient.id} />}
    </div>
  </section>;
}
