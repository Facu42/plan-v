import type { MealLog, Patient, Stage } from '../../types';
import type { CrmEntry } from '../crm/crm-entry';
import { getGoalSnapshot, GOAL_STATUS_LABELS } from '../crm/crm-goals';
import { Icon } from '../shared/Icon';
import { NvBadge, NvButton, NvProgress, NvState } from './primitives';
import { ShowroomIntakeReview } from './ShowroomIntakeReview';
import { CarePanel } from './CarePanel';
import './showroom-patient-record.css';

const STAGE_LABELS: Record<Stage, string> = { ingreso: 'Ingreso', plan: 'Plan', seguimiento: 'Seguimiento', alta: 'Alta' };
const BILLING_LABELS = { active: 'Acceso activo', pending: 'Cobranza pendiente', waived: 'Acceso exceptuado', past_due: 'Acceso vencido' } as const;
const MEAL_STATUS = { pending_review: 'En revisión', confirmed: 'Confirmada', adjusted: 'Ajustada' } as const;

function readableDate(value: string | null | undefined): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export function professionalMealNotes(patient: Pick<Patient, 'id' | 'meal_logs'>): MealLog[] {
  return patient.meal_logs
    .filter((log) => log.patient_id === patient.id && Boolean(log.note_for_nutri.trim()))
    .sort((a, b) => b.logged_at.localeCompare(a.logged_at));
}

export function ShowroomPatientRecord({ patient, patients = [patient], onSelect, onEdit, onOpen }: {
  patient: Patient;
  patients?: Patient[];
  onSelect?: (id: string) => void;
  onEdit: () => void;
  onOpen: (entry: CrmEntry) => void;
}) {
  const goal = getGoalSnapshot(patient);
  const notes = professionalMealNotes(patient);
  const timeline = patient.timeline.slice(0, 8);
  const open = (tab: 'comidas' | 'plan' | 'consultas') => onOpen({ patientId: patient.id, module: 'fichas', tab });

  return <section className="nr-record" aria-labelledby="nr-record-title">
    <header className="nr-hero">
      <span className="nv-avatar nr-avatar">{patient.initials}</span>
      <div className="nr-identity"><p>Ficha profesional</p><h2 id="nr-record-title">Ficha de {patient.name}</h2><div><NvBadge>{patient.status}</NvBadge><span>{STAGE_LABELS[patient.stage]}</span><span>{BILLING_LABELS[patient.billing_status]}</span></div></div>
      {onSelect && <label className="nr-patient-select">Paciente<select aria-label="Paciente de la ficha" value={patient.id} onChange={(event) => onSelect(event.target.value)}>{patients.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>}
      <NvButton className="nv-soft" onClick={onEdit}><Icon name="edit" size={14} />Editar datos de ficha</NvButton>
    </header>

    <nav className="nr-actions" aria-label="Acciones de la ficha">
      <NvButton className="nv-soft" onClick={() => open('comidas')}><Icon name="camera" size={15} />Revisar comidas</NvButton>
      <NvButton className="nv-soft" onClick={() => open('plan')}><Icon name="list" size={15} />Editar plan</NvButton>
      <NvButton className="nv-soft" onClick={() => open('consultas')}><Icon name="calendar" size={15} />Gestionar consultas</NvButton>
    </nav>

    <div className="nr-summary-grid">
      <article className="nr-card nr-goal">
        <header><div><span className="nr-kicker">Objetivo actual</span><h3>{patient.goal || 'Objetivo por definir'}</h3></div><NvBadge tone="gold">{GOAL_STATUS_LABELS[goal.status]}</NvBadge></header>
        <strong>{goal.progress}%</strong><NvProgress value={goal.progress} label={`Avance del objetivo de ${patient.name}`} /><small>Actualizado: {readableDate(goal.updatedAt)}</small>
      </article>
      <article className="nr-card nr-appointment">
        <header><span className="nr-icon"><Icon name="calendar" size={19} /></span><span className="nr-kicker">Próxima consulta</span></header>
        <h3>{patient.appointment?.when ?? 'Sin consulta programada'}</h3>
        <p>{patient.appointment ? `${patient.appointment.duration} min · ${patient.appointment.channel}` : 'Podés gestionarla desde Consultas.'}</p>
      </article>
      <article className="nr-card nr-adherence">
        <header><span className="nr-icon"><Icon name="target" size={19} /></span><span className="nr-kicker">Adherencia · 7 días</span></header>
        <strong>{patient.adherence_score}%</strong><NvProgress value={patient.adherence_score} label={`Adherencia de ${patient.name}`} /><small>{patient.time || 'Sin actualización registrada'}</small>
      </article>
    </div>

    <CarePanel patientId={patient.id} mode="professional" />

    <section className="nr-private" aria-label="Información profesional privada">
      <header><div><span className="nr-lock"><Icon name="pin" size={15} /></span><div><h3>Información profesional privada</h3><p>Solo visible para profesionales. No se comparte con el paciente.</p></div></div></header>
      <dl>
        <div><dt>Horario sensible</dt><dd>{patient.sensitive_hours || 'Sin dato cargado'}</dd></div>
        <div><dt>Plan B</dt><dd>{patient.plan_b || 'Sin dato cargado'}</dd></div>
        <div><dt>Próximo foco</dt><dd>{patient.next_focus || 'Sin dato cargado'}</dd></div>
        <div><dt>Lectura de adherencia</dt><dd>{patient.adherence_why || 'Sin observación profesional'}</dd></div>
      </dl>
    </section>

    <ShowroomIntakeReview patientId={patient.id} />

    <div className="nr-history-grid">
      <section className="nr-card nr-timeline">
        <header><div><span className="nr-kicker">Historial</span><h3>Línea de tiempo</h3></div><NvBadge>{timeline.length}</NvBadge></header>
        {timeline.length ? <ol>{timeline.map((event) => <li key={event.id}><time>{event.atLabel}</time><span><strong>{event.title}</strong><small>{event.body}</small></span></li>)}</ol> : <NvState title="Sin eventos registrados" description="Los cambios y acciones profesionales aparecerán acá." />}
      </section>
      <section className="nr-card nr-notes">
        <header><div><span className="nr-kicker">Privado</span><h3>Notas de objetivos</h3></div><Icon name="target" size={17} /></header>
        {goal.history.length ? <ol>{goal.history.slice(0, 5).map((entry) => <li key={entry.id}><div><strong>{entry.goal}</strong><NvBadge tone="gold">{entry.progress}%</NvBadge></div><p>{entry.note || 'Sin nota profesional'}</p><small>{GOAL_STATUS_LABELS[entry.status]} · {readableDate(entry.updated_at)}</small></li>)}</ol> : <NvState title="Sin notas de objetivos" description="Todavía no hay cambios documentados en el objetivo." />}
      </section>
      <section className="nr-card nr-meal-notes">
        <header><div><span className="nr-kicker">Solo profesional</span><h3>Observaciones de comidas</h3></div><Icon name="camera" size={17} /></header>
        {notes.length ? <ol>{notes.slice(0, 5).map((log) => <li key={log.id}><div><strong>{log.slot}</strong><NvBadge tone={log.status === 'pending_review' ? 'gold' : 'green'}>{MEAL_STATUS[log.status]}</NvBadge></div><p>{log.note_for_nutri}</p><small>{readableDate(log.logged_at)} · confianza {Math.round(log.confidence * 100)}%</small></li>)}</ol> : <NvState title="Sin observaciones de comidas" description="No hay notas profesionales asociadas a los registros de este paciente." />}
      </section>
    </div>
  </section>;
}
