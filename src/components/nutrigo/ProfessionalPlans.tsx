import { useState } from 'react';
import type { Patient } from '../../types';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import { MealPlanEditor } from './MealPlanVersions';
import { PlanSafetySummary } from './ProfessionalPatientWorkspace';
import { ProfessionalWorkQueue } from './ProfessionalWorkQueue';
import { NvButton, NvState } from './primitives';

export function ProfessionalPlans({ showDirectory = false, patient, patients, professionalName, onOpen }: { showDirectory?: boolean; patient?: Patient; patients: Patient[]; professionalName?: string; onOpen: (href: string) => void }) {
  const [queueOpen, setQueueOpen] = useState(false);
  const addPatient = useAppStore((store) => store.addPatient);
  if (showDirectory) return <section className="pn-plan-directory"><h2>Todos los planes</h2><p>Elegí una paciente para revisar o armar su plan.</p>{patients.length ? <ul>{patients.map(person => <li key={person.id}><span><strong>{person.name}</strong><small>{person.goal}</small></span><a className="nv-button nv-soft" href={`/crm/plan?paciente=${encodeURIComponent(person.id)}`} onClick={event => { if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return; event.preventDefault(); onOpen(event.currentTarget.getAttribute('href')!); }}>Armar o editar</a></li>)}</ul> : <NvState title="Todavía no hay pacientes" description="Sumá una paciente desde Pacientes para preparar su plan." />}</section>;
  return <section className="pw-record" aria-label="Planes del consultorio"><header className="pw-work-head"><div><h2>Planes alimentarios</h2><p>Armado manual y propuestas de IA con revisión profesional.</p></div><NvButton className="nv-soft" aria-expanded={queueOpen} onClick={() => setQueueOpen((open) => !open)}>{queueOpen ? 'Ocultar bandeja de IA' : 'Ver bandeja de IA'}</NvButton></header>
    {patient ? <><div className="pw-draft-heading"><h3>Plan de {patient.name}</h3><a href={`/crm/ficha?paciente=${encodeURIComponent(patient.id)}`} className="nv-button nv-soft" onClick={(event) => { event.preventDefault(); onOpen(event.currentTarget.getAttribute('href')!); }}>Abrir ficha</a></div><PlanSafetySummary key={`safety:${patient.id}`} patientId={patient.id} /><MealPlanEditor key={patient.id} patientId={patient.id} patientName={patient.name} professionalName={professionalName} onChanged={() => void api.getPatient(patient.id).then(({ patient: updated }) => addPatient(updated)).catch(() => undefined)} /></> : <NvState title="Elegí un paciente para preparar su plan" description="Podés seleccionarlo desde el encabezado o abrir una propuesta pendiente." />}
    {queueOpen && <ProfessionalWorkQueue patients={patients} mode="planes" initialKind="ai_menu" onOpen={onOpen} />}
  </section>;
}
