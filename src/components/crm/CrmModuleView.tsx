import type { Patient } from '../../types';
import { Icon, type IconName } from '../shared/Icon';
import { resolveModulePatientAction } from './crm-module-actions';
import { CrmObjectivesView } from './CrmObjectivesView';
import { CrmPatientsView } from './CrmPatientsView';

export type CrmModule = 'inicio' | 'reciente' | 'guardado' | 'seguimiento' | 'paneles' | 'actividades' | 'pacientes' | 'fichas' | 'videollamadas' | 'agenda' | 'objetivos';

export const CRM_MENU_SECTIONS: Array<{ title?: string; items: Array<{ id: CrmModule; label: string; icon: IconName }> }> = [
  { items: [
    { id: 'inicio', label: 'Inicio', icon: 'home' },
    { id: 'reciente', label: 'Reciente', icon: 'history' },
    { id: 'guardado', label: 'Guardado', icon: 'pin' },
  ] },
  { title: 'Mi trabajo', items: [
    { id: 'seguimiento', label: 'Centro de seguimiento', icon: 'sparkle' },
    { id: 'paneles', label: 'Paneles', icon: 'grid' },
    { id: 'actividades', label: 'Actividades', icon: 'list' },
  ] },
  { title: 'Pacientes', items: [
    { id: 'pacientes', label: 'Pacientes', icon: 'users' },
    { id: 'fichas', label: 'Fichas', icon: 'contact' },
  ] },
  { title: 'Seguimiento', items: [
    { id: 'videollamadas', label: 'Videollamadas', icon: 'video' },
    { id: 'agenda', label: 'Agenda', icon: 'calendar' },
  ] },
  { title: 'Resultados', items: [
    { id: 'objetivos', label: 'Objetivos', icon: 'target' },
  ] },
];

const MODULE_COPY: Record<Exclude<CrmModule, 'fichas'>, { title: string; subtitle: string; icon: IconName }> = {
  inicio: { title: 'Inicio', subtitle: 'Resumen operativo del consultorio', icon: 'home' },
  reciente: { title: 'Reciente', subtitle: 'Últimas fichas con movimiento', icon: 'history' },
  guardado: { title: 'Guardado', subtitle: 'Planes B y focos listos para reutilizar', icon: 'pin' },
  seguimiento: { title: 'Centro de seguimiento', subtitle: 'Pacientes ordenados por necesidad de atención', icon: 'sparkle' },
  paneles: { title: 'Paneles', subtitle: 'Indicadores del acompañamiento activo', icon: 'grid' },
  actividades: { title: 'Actividades', subtitle: 'Registro reciente de comidas, hábitos y mensajes', icon: 'list' },
  pacientes: { title: 'Pacientes', subtitle: 'Directorio completo de pacientes activos', icon: 'users' },
  videollamadas: { title: 'Videollamadas', subtitle: 'Consultas virtuales programadas', icon: 'video' },
  agenda: { title: 'Agenda', subtitle: 'Próximas consultas y duración', icon: 'calendar' },
  objetivos: { title: 'Objetivos', subtitle: 'Metas y adherencia de cada paciente', icon: 'target' },
};

function PatientList({ module, patients, detail, onOpenPatient, onOpenAppointments }: { module: CrmModule; patients: Patient[]; detail: (patient: Patient) => string; onOpenPatient: (id: string) => void; onOpenAppointments: (id: string) => void }) {
  return (
    <div className="module-patient-list">
      {patients.map((patient) => {
        const action = resolveModulePatientAction(module, Boolean(patient.appointment));
        return <article className="module-patient-row" key={patient.id}>
          <span className={`crm-avatar person-${patient.tone}`}>{patient.initials}</span>
          <span className="module-patient-copy">
            <b>{patient.name}</b>
            <small>{detail(patient)}</small>
          </span>
          <span className={`module-score ${patient.adherence_score < 70 ? 'needs-attention' : ''}`}>{patient.adherence_score}</span>
          <button type="button" onClick={() => action.target === 'appointments' ? onOpenAppointments(patient.id) : onOpenPatient(patient.id)}>{action.label}</button>
        </article>
      })}
    </div>
  );
}

export function CrmModuleView({ module, patients, onOpenPatient, onOpenAppointments, onCreatePatient }: { module: Exclude<CrmModule, 'fichas'>; patients: Patient[]; onOpenPatient: (id: string) => void; onOpenAppointments: (id: string) => void; onCreatePatient: () => void }) {
  const copy = MODULE_COPY[module];
  const pending = patients.reduce((total, patient) => total + patient.meal_logs.filter((log) => log.status === 'pending_review').length, 0);
  const average = patients.length ? Math.round(patients.reduce((total, patient) => total + patient.adherence_score, 0) / patients.length) : 0;
  const attention = patients.filter((patient) => patient.adherence_score < 70);
  const recent = patients.slice(0, 4);
  const activities = patients.flatMap((patient) => patient.timeline.slice(0, 2).map((event) => ({ patient, event }))).slice(0, 8);
  const scheduled = patients.filter((patient) => patient.appointment);
  const videoAppointments = scheduled.filter((patient) => patient.appointment?.channel === 'video');

  let content;
  if (module === 'inicio' || module === 'paneles') {
    content = (
      <>
        <section className="module-metrics" aria-label="Indicadores">
          <article><Icon name="users" size={18} /><small>Pacientes activos</small><strong>{patients.length}</strong></article>
          <article><Icon name="camera" size={18} /><small>Fotos por revisar</small><strong>{pending}</strong></article>
          <article><Icon name="trend" size={18} /><small>Adherencia media</small><strong>{average}%</strong></article>
          <article><Icon name="calendar" size={18} /><small>Próximas consultas</small><strong>{scheduled.length}</strong></article>
        </section>
        <section className="module-panel-card">
          <h3>Necesitan atención</h3>
          <PatientList module={module} patients={attention.length ? attention : recent} detail={(patient) => patient.brief?.up_next_title ?? patient.adherence_why} onOpenPatient={onOpenPatient} onOpenAppointments={onOpenAppointments} />
        </section>
      </>
    );
  } else if (module === 'actividades') {
    content = (
      <section className="module-panel-card">
        <h3>Actividad reciente</h3>
        <div className="module-activity-list">
          {activities.map(({ patient, event }) => (
            <button type="button" onClick={() => onOpenPatient(patient.id)} key={`${patient.id}-${event.id}`}>
              <span>{event.atLabel}</span><b>{patient.name} · {event.title}</b><small>{event.body}</small>
            </button>
          ))}
        </div>
      </section>
    );
  } else if (module === 'videollamadas' || module === 'agenda') {
    content = (
      <section className="module-panel-card">
        <h3>{module === 'agenda' ? 'Próximas consultas' : 'Consultas virtuales'}</h3>
        {(module === 'agenda' ? patients : videoAppointments).length ? (
          <PatientList
            module={module}
            patients={module === 'agenda' ? [...patients].sort((a, b) => Number(Boolean(b.appointment)) - Number(Boolean(a.appointment))) : videoAppointments}
            detail={(patient) => patient.appointment ? `${patient.appointment.when} · ${patient.appointment.duration} min · ${patient.appointment.channel === 'video' ? 'Videollamada' : 'Presencial'}` : 'Sin turno cargado'}
            onOpenPatient={onOpenPatient}
            onOpenAppointments={onOpenAppointments}
          />
        ) : <p className="module-empty">No hay consultas virtuales programadas.</p>}
      </section>
    );
  } else if (module === 'objetivos') {
    content = <CrmObjectivesView patients={patients} onOpenPatient={onOpenPatient} />;
  } else if (module === 'pacientes') {
    content = <CrmPatientsView patients={patients} onOpenPatient={onOpenPatient} onCreatePatient={onCreatePatient} />;
  } else {
    const rows = module === 'reciente' ? recent : module === 'seguimiento' ? [...patients].sort((a, b) => a.adherence_score - b.adherence_score) : patients;
    const detail = module === 'guardado'
      ? (patient: Patient) => `Plan B: ${patient.plan_b}`
      : module === 'seguimiento'
          ? (patient: Patient) => patient.brief?.up_next_title ?? patient.next_focus
          : (patient: Patient) => `${patient.status} · ${patient.stage}`;
    content = (
      <section className="module-panel-card">
        <h3>{module === 'guardado' ? 'Planes guardados' : copy.title}</h3>
        <PatientList module={module} patients={rows} detail={detail} onOpenPatient={onOpenPatient} onOpenAppointments={onOpenAppointments} />
      </section>
    );
  }

  return (
    <div className="crm-module-view">
      <header className="module-view-header">
        <span><Icon name={copy.icon} size={20} /></span>
        <div><p className="eyebrow">Plan V</p><h1>{copy.title}</h1><p>{copy.subtitle}</p></div>
      </header>
      {content}
    </div>
  );
}
