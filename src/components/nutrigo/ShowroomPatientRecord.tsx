import type { MealLog, Patient, Stage } from '../../types';
import type { CrmEntry } from '../crm/crm-entry';
import { getGoalSnapshot, GOAL_STATUS_LABELS } from '../crm/crm-goals';
import { Icon } from '../shared/Icon';
import { NvBadge, NvButton, NvMetric, NvState } from './primitives';
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
  const appointmentWhen = patient.appointment?.when ?? 'Sin consulta programada';
  const appointmentNote = patient.appointment
    ? `${patient.appointment.duration} min · ${patient.appointment.channel}`
    : 'Podés gestionarla desde Consultas.';
  const recordTitle = patient.name.replace(/\s*\.$/, '');

  return <section className="nr-record" aria-labelledby="nr-record-title">
    <header className="nr-page-head">
      <div>
        <h1 id="nr-record-title">Ficha de {recordTitle}<span className="nv-title-dot">.</span></h1>
        <p>
          <NvBadge>{patient.status}</NvBadge>
          <span>{STAGE_LABELS[patient.stage]}</span>
          <span>{BILLING_LABELS[patient.billing_status]}</span>
        </p>
      </div>
      <div className="nr-page-tools">
        {onSelect && <label className="nr-patient-select">Paciente
          <select aria-label="Paciente de la ficha" value={patient.id} onChange={(event) => onSelect(event.target.value)}>
            {patients.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
        </label>}
        <NvButton className="nv-soft" onClick={onEdit}><Icon name="edit" size={14} />Editar datos de ficha</NvButton>
      </div>
    </header>

    <div className="nr-metrics" aria-label="Indicadores de la ficha">
      <NvMetric label="Objetivo actual" value={`${goal.progress}%`} note={patient.goal || 'Objetivo por definir'} icon="target" />
      <NvMetric label="Adherencia · 7 días" value={`${patient.adherence_score}%`} note={patient.time || 'Sin actualización registrada'} icon="check" tone="coral" />
      <NvMetric label="Próxima consulta" value={appointmentWhen} note={appointmentNote} icon="calendar" tone="gold" onOpen={() => open('consultas')} />
      <NvMetric label="Etapa" value={STAGE_LABELS[patient.stage]} note={GOAL_STATUS_LABELS[goal.status]} icon="contact" />
    </div>

    <div className="nr-layout">
      <div className="nr-column">
        <nav className="nr-actions" aria-label="Acciones de la ficha">
          <NvButton className="nv-ghost" onClick={() => open('comidas')}><Icon name="camera" size={15} />Revisar comidas</NvButton>
          <NvButton className="nv-ghost" onClick={() => open('plan')}><Icon name="list" size={15} />Editar plan</NvButton>
          <NvButton className="nv-ghost" onClick={() => open('consultas')}><Icon name="calendar" size={15} />Gestionar consultas</NvButton>
        </nav>
        <ShowroomIntakeReview patientId={patient.id} />
        <CarePanel patientId={patient.id} mode="professional" />
        <div className="nr-notes-grid">
          <section className="nr-panel nr-notes" aria-labelledby="nr-notes-title">
            <header>
              <div>
                <h2 id="nr-notes-title">Notas de objetivos</h2>
                <p>Privado</p>
              </div>
            </header>
            {goal.history.length ? <ol>{goal.history.slice(0, 5).map((entry) => <li key={entry.id}>
              <div><strong>{entry.goal}</strong><NvBadge tone="gold">{entry.progress}%</NvBadge></div>
              <p>{entry.note || 'Sin nota profesional'}</p>
              <small>{GOAL_STATUS_LABELS[entry.status]} · {readableDate(entry.updated_at)}</small>
            </li>)}</ol> : <NvState title="Sin notas de objetivos" description="Todavía no hay cambios documentados en el objetivo." />}
          </section>
          <section className="nr-panel nr-meal-notes" aria-labelledby="nr-meal-notes-title">
            <header>
              <div>
                <h2 id="nr-meal-notes-title">Observaciones de comidas</h2>
                <p>Solo profesional</p>
              </div>
            </header>
            {notes.length ? <ol>{notes.slice(0, 5).map((log) => <li key={log.id}>
              <div><strong>{log.slot}</strong><NvBadge tone={log.status === 'pending_review' ? 'gold' : 'green'}>{MEAL_STATUS[log.status]}</NvBadge></div>
              <p>{log.note_for_nutri}</p>
              <small>{readableDate(log.logged_at)} · confianza {Math.round(log.confidence * 100)}%</small>
            </li>)}</ol> : <NvState title="Sin observaciones de comidas" description="No hay notas profesionales asociadas a los registros de este paciente." />}
          </section>
        </div>
      </div>

      <aside className="nr-rail" aria-label="Contexto de la ficha">
        <div className="nr-person">
          <span className="nv-avatar nr-avatar">{patient.initials}</span>
          <div>
            <strong>{patient.name}</strong>
            <small>Ficha profesional</small>
          </div>
        </div>
        <section className="nr-visit">
          <span className="nv-icon-tile"><Icon name="calendar" size={16} /></span>
          <small>Próxima consulta</small>
          <strong>{appointmentWhen}</strong>
          <p>{appointmentNote}</p>
          <NvButton className="nv-ghost" onClick={() => open('consultas')}>Ver consulta <Icon name="arrow" size={14} /></NvButton>
        </section>
        <section className="nr-panel nr-private" aria-label="Información profesional privada">
          <header>
            <div>
              <h2>Información profesional privada</h2>
              <p>Solo visible para profesionales. No se comparte con el paciente.</p>
            </div>
          </header>
          <dl>
            <div><dt>Horario sensible</dt><dd>{patient.sensitive_hours || 'Sin dato cargado'}</dd></div>
            <div><dt>Plan B</dt><dd>{patient.plan_b || 'Sin dato cargado'}</dd></div>
            <div><dt>Próximo foco</dt><dd>{patient.next_focus || 'Sin dato cargado'}</dd></div>
            <div><dt>Lectura de adherencia</dt><dd>{patient.adherence_why || 'Sin observación profesional'}</dd></div>
          </dl>
        </section>
        <section className="nr-panel nr-timeline" aria-labelledby="nr-timeline-title">
          <header>
            <div>
              <h2 id="nr-timeline-title">Línea de tiempo</h2>
              <p>Historial</p>
            </div>
            <NvBadge>{timeline.length}</NvBadge>
          </header>
          {timeline.length ? <ol>{timeline.map((event) => <li key={event.id}>
            <time>{event.atLabel}</time>
            <span><strong>{event.title}</strong><small>{event.body}</small></span>
          </li>)}</ol> : <NvState title="Sin eventos registrados" description="Los cambios y acciones profesionales aparecerán acá." />}
        </section>
      </aside>
    </div>
  </section>;
}
