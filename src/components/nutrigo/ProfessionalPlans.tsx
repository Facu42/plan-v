import { useState } from 'react';
import type { Patient } from '../../types';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import { MealPlanEditor } from './MealPlanVersions';
import { PlanSafetySummary } from './ProfessionalPatientWorkspace';
import { ProfessionalWorkQueue } from './ProfessionalWorkQueue';
import { NvButton, NvState } from './primitives';

export function ProfessionalPlans({ patient, patients, onOpen }: { patient?: Patient; patients: Patient[]; onOpen: (href: string) => void }) {
  const [queueOpen, setQueueOpen] = useState(() => typeof window === 'undefined' || !new URLSearchParams(window.location.search).has('propuesta'));
  const addPatient = useAppStore((store) => store.addPatient);
  return <section className="pw-record" aria-label="Planes del consultorio"><header className="pw-work-head"><div><h2>Planes alimentarios</h2><p>Armado manual y propuestas de IA con revisión profesional.</p></div><NvButton className="nv-soft" aria-expanded={queueOpen} onClick={() => setQueueOpen((open) => !open)}>{queueOpen ? 'Ocultar bandeja de IA' : 'Ver bandeja de IA'}</NvButton></header>
    {queueOpen && <ProfessionalWorkQueue patients={patients} mode="planes" initialKind="ai_menu" onOpen={onOpen} />}
    {patient ? <><div className="pw-draft-heading"><h3>Plan de {patient.name}</h3><a href={`/crm/ficha?paciente=${encodeURIComponent(patient.id)}`} className="nv-button nv-soft" onClick={(event) => { event.preventDefault(); onOpen(event.currentTarget.getAttribute('href')!); }}>Abrir ficha</a></div><PlanSafetySummary key={`safety:${patient.id}`} patientId={patient.id} /><MealPlanEditor key={patient.id} patientId={patient.id} onChanged={() => void api.getPatient(patient.id).then(({ patient: updated }) => addPatient(updated)).catch(() => undefined)} /></> : <NvState title="Elegí un paciente para preparar su plan" description="Podés seleccionarlo desde el encabezado o abrir una propuesta pendiente." />}
  </section>;
}
