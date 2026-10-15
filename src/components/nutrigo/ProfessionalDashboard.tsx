import { useState } from 'react';
import type { Patient } from '../../types';
import type { ShowroomPage } from './ShowroomPanels';
import { buildProfessionalSummary, upcomingAppointmentDate } from './professional-summary';
import './professional-home.css';

const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es-AR').trim();

type Props = {
  patients: Patient[];
  selectedId: string;
  onSelectPatient: (id: string) => void;
  onNavigate: (page: ShowroomPage) => void;
  now?: Date;
};

export function ProfessionalDashboard({ patients, selectedId, onSelectPatient, onNavigate, now = new Date() }: Props) {
  const [query, setQuery] = useState('');
  const [onlyPending, setOnlyPending] = useState(false);
  const active = patients.filter((patient) => !patient.archived_at);
  const summary = buildProfessionalSummary(active, now);
  const pendingFor = (patient: Patient) => patient.meal_logs.filter(
    (log) => log.patient_id === patient.id && log.status === 'pending_review',
  ).length;
  const firstPending = [...active].sort((a, b) => pendingFor(b) - pendingFor(a))[0];
  const openReviews = () => {
    if (firstPending && pendingFor(firstPending) > 0) onSelectPatient(firstPending.id);
    onNavigate('diario');
  };
  const prioritized = active.filter((patient) =>
    (!onlyPending || pendingFor(patient) > 0)
    && normalizeSearch(`${patient.name} ${patient.goal}`).includes(normalizeSearch(query)),
  ).sort((a, b) => pendingFor(b) - pendingFor(a) || a.adherence_score - b.adherence_score);
  const appointments = active.map((patient) => ({ patient, at: upcomingAppointmentDate(patient.appointment, now) }))
    .filter((entry): entry is { patient: Patient; at: Date } => Boolean(entry.at))
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  const messages = active.flatMap((patient) => patient.messages.filter((message) => message.patient_id === patient.id && message.from === 'patient')
    .map((message) => ({ patient, message }))).sort(
    (a, b) => Date.parse(b.message.sent_at) - Date.parse(a.message.sent_at),
  ).slice(0, 3);
  const openPatient = (patient: Patient, page: ShowroomPage) => {
    onSelectPatient(patient.id);
    onNavigate(page);
  };

  return <div className="pv-pro-home">
    <section className="pv-pro-home-kpis" aria-label="Resumen del consultorio">
      <button type="button" onClick={() => onNavigate('pacientes')}>
        <span className="pv-pro-kpi-icon pv-pro-lime" aria-hidden="true">◎</span>
        <span>Pacientes activos</span><strong>{summary.active}</strong>
      </button>
      <button type="button" onClick={openReviews}>
        <span className="pv-pro-kpi-icon pv-pro-orange" aria-hidden="true">◷</span>
        <span>Comidas por revisar</span><strong>{summary.pending}</strong>
      </button>
      <button type="button" onClick={() => onNavigate('agenda')}>
        <span className="pv-pro-kpi-icon pv-pro-yellow" aria-hidden="true">▦</span>
        <span>Consultas programadas</span><strong>{summary.appointments}</strong>
      </button>
      <button type="button" onClick={() => onNavigate('seguimiento')}>
        <span className="pv-pro-kpi-icon pv-pro-lime" aria-hidden="true">↗</span>
        <span>Adherencia media</span><strong>{summary.adherence === null ? '—' : `${summary.adherence}%`}</strong>
      </button>
    </section>

    <div className="pv-pro-home-columns">
      <div className="pv-pro-home-primary">
        <section className="pv-pro-card">
          <header><div><h2>Seguimiento de pacientes</h2><p>Comidas pendientes y adherencia registrada</p></div><button type="button" onClick={() => onNavigate('pacientes')}>Ver pacientes</button></header>
          <div className="pv-pro-patient-tools"><label>Buscar paciente<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre u objetivo" /></label><label className="pv-pro-pending-toggle"><input type="checkbox" checked={onlyPending} onChange={(event) => setOnlyPending(event.target.checked)} /> Sólo por revisar</label></div>
          {prioritized.length ? <ul className="pv-pro-patient-list">{prioritized.slice(0, 6).map((patient) => <li key={patient.id}>
            <button type="button" onClick={() => openPatient(patient, 'ficha')}>
              <span className="pv-pro-avatar" aria-hidden="true">{patient.initials}</span>
              <span className="pv-pro-patient-info"><strong>{patient.name}</strong><small>{patient.goal}</small></span>
              <span className="pv-pro-patient-progress"><strong>{patient.adherence_score}%</strong><small>adherencia</small></span>
              <span className="pv-pro-patient-pending">{pendingFor(patient) ? `${pendingFor(patient)} por revisar` : 'Al día'}</span>
            </button>
          </li>)}</ul> : <p className="pv-pro-empty">{active.length ? 'No hay pacientes con ese filtro.' : 'Todavía no hay pacientes activos.'}</p>}
        </section>

        <section className="pv-pro-card">
          <header><div><h2>Accesos de trabajo</h2><p>Continuá con las tareas del consultorio</p></div></header>
          <div className="pv-pro-shortcuts">
            <button type="button" onClick={() => onNavigate('plan')}>Plan de comidas</button>
            <button type="button" onClick={openReviews}>Revisar comidas</button>
            <button type="button" onClick={() => onNavigate('mensajes')}>Mensajes</button>
            <button type="button" onClick={() => onNavigate('consultas')}>Consultas</button>
          </div>
        </section>
      </div>

      <aside className="pv-pro-home-aside">
        <section className="pv-pro-card">
          <header><div><h2>Próximas consultas</h2><p>Agenda de pacientes activos</p></div><button type="button" onClick={() => onNavigate('agenda')}>Ver agenda</button></header>
          {appointments.length ? <ul className="pv-pro-appointments">{appointments.slice(0, 4).map(({ patient, at }) => <li key={patient.id}>
            <button type="button" onClick={() => openPatient(patient, 'consultas')}>
              <span className="pv-pro-avatar" aria-hidden="true">{patient.initials}</span>
              <span><strong>{patient.name}</strong><small>{at.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })} · {at.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</small></span>
            </button>
          </li>)}</ul> : <p className="pv-pro-empty">No hay consultas programadas.</p>}
        </section>
        <section className="pv-pro-card">
          <header><div><h2>Mensajes recientes</h2><p>Consultas de tus pacientes</p></div><button type="button" onClick={() => onNavigate('mensajes')}>Ver mensajes</button></header>
          {messages.length ? <ul className="pv-pro-messages">{messages.map(({ patient, message }) => <li key={message.id}>
            <button type="button" onClick={() => openPatient(patient, 'mensajes')}>
              <span className="pv-pro-avatar" aria-hidden="true">{patient.initials}</span>
              <span><strong>{patient.name}</strong><small>{message.text}</small></span>
            </button>
          </li>)}</ul> : <p className="pv-pro-empty">No hay mensajes de pacientes.</p>}
        </section>
        {active.length > 0 && <label className="pv-pro-selected">Paciente en seguimiento
          <select value={selectedId} onChange={(event) => onSelectPatient(event.target.value)}>
            {active.map((patient) => <option value={patient.id} key={patient.id}>{patient.name}</option>)}
          </select>
        </label>}
      </aside>
    </div>
  </div>;
}

