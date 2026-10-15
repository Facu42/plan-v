import { useState } from 'react';
import type { Patient, TimelineEvent } from '../../types';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import { Icon, type IconName } from '../shared/Icon';
import { NvBadge, NvButton, NvState } from './primitives';
import { buildAgendaEntries } from './ShowroomAgenda';
import { secureMeetUrl } from './ShowroomConsultations';
import { RESOURCE_GUIDES, resourceAssignmentDateLabel } from './ShowroomResources';
import './showroom-work-center.css';

export type WorkCenterModule = 'reciente' | 'guardado' | 'seguimiento' | 'paneles' | 'videollamadas';

type WorkCenterProps = {
  module: WorkCenterModule;
  patients: Patient[];
  now: Date;
  onOpenPatient: (patientId: string) => void;
  onOpenMeals: (patientId: string) => void;
  onOpenConsultations: (patientId: string) => void;
};

const MODULES: Record<WorkCenterModule, { title: string; subtitle: string; icon: IconName }> = {
  reciente: { title: 'Actividad reciente', subtitle: 'Últimos movimientos disponibles en las fichas activas.', icon: 'history' },
  guardado: { title: 'Guardado y recursos', subtitle: 'Planes B y guías editoriales asignadas a pacientes.', icon: 'pin' },
  seguimiento: { title: 'Centro de seguimiento', subtitle: 'Priorización por adherencia y comidas pendientes.', icon: 'sparkle' },
  paneles: { title: 'Paneles del consultorio', subtitle: 'Indicadores agregados del acompañamiento activo.', icon: 'grid' },
  videollamadas: { title: 'Videollamadas programadas', subtitle: 'Próximos encuentros virtuales y accesos seguros.', icon: 'video' },
};

export function buildTrackingSummary(patients: Patient[]) {
  const pendingMeals = patients.reduce((total, patient) => total + patient.meal_logs.filter((meal) => meal.status === 'pending_review').length, 0);
  const appointments = patients.filter((patient) => patient.appointment).length;
  const videoAppointments = patients.filter((patient) => patient.appointment?.channel === 'video').length;
  const averageAdherence = patients.length ? Math.round(patients.reduce((total, patient) => total + patient.adherence_score, 0) / patients.length) : 0;
  return { patients: patients.length, pendingMeals, appointments, videoAppointments, averageAdherence, attention: patients.filter((patient) => patient.adherence_score < 70).length };
}

export function rankPatientsForFollowUp(patients: Patient[]) {
  return patients.map((patient) => ({
    patient,
    pendingMeals: patient.meal_logs.filter((meal) => meal.status === 'pending_review').length,
  })).sort((a, b) => a.patient.adherence_score - b.patient.adherence_score || b.pendingMeals - a.pendingMeals || a.patient.name.localeCompare(b.patient.name, 'es-AR'));
}

export function buildRecentActivity(patients: Patient[]): Array<{ patient: Patient; event: TimelineEvent }> {
  const rank = (label: string) => label.toLocaleUpperCase('es-AR') === 'HOY' ? 0 : label.toLocaleUpperCase('es-AR') === 'AYER' ? 1 : 2;
  return patients.flatMap((patient, patientIndex) => patient.timeline.slice(0, 3).map((event, eventIndex) => ({ patient, event, patientIndex, eventIndex })))
    .sort((a, b) => rank(a.event.atLabel) - rank(b.event.atLabel) || a.patientIndex - b.patientIndex || a.eventIndex - b.eventIndex)
    .map(({ patient, event }) => ({ patient, event }));
}

function Header({ module, count }: { module: WorkCenterModule; count: number }) {
  const config = MODULES[module];
  return <header className="nvw-header"><div><span className="nv-icon-tile"><Icon name={config.icon} size={20} /></span><div><h2>{config.title}</h2><p>{config.subtitle}</p></div></div><NvBadge tone="green">{count} pacientes activos</NvBadge></header>;
}

export type RecentRecency = 'all' | 'today' | 'yesterday' | 'older';

const recentRank = (label: string) => label.toLocaleUpperCase('es-AR') === 'HOY' ? 0 : label.toLocaleUpperCase('es-AR') === 'AYER' ? 1 : 2;

export function filterRecentActivity(items: Array<{ patient: Patient; event: TimelineEvent }>, patientId: string, recency: RecentRecency) {
  return items.filter(({ patient, event }) => {
    const matchesPatient = patientId === 'all' || patient.id === patientId;
    const rank = recentRank(event.atLabel);
    const matchesRecency = recency === 'all'
      || (recency === 'today' && rank === 0)
      || (recency === 'yesterday' && rank === 1)
      || (recency === 'older' && rank === 2);
    return matchesPatient && matchesRecency;
  });
}

export function paginateRecentActivity<T>(items: T[], page: number, pageSize: number) {
  const shown = Math.max(1, page) * pageSize;
  return { items: items.slice(0, shown), hasMore: items.length > shown };
}

const RECENT_RECENCY: Array<{ id: RecentRecency; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'today', label: 'Hoy' },
  { id: 'yesterday', label: 'Ayer' },
  { id: 'older', label: 'Anteriores' },
];
const RECENT_PAGE_SIZE = 8;

function Recent({ patients, onOpenPatient }: Pick<WorkCenterProps, 'patients' | 'onOpenPatient'>) {
  const [patientId, setPatientId] = useState('all');
  const [recency, setRecency] = useState<RecentRecency>('all');
  const [page, setPage] = useState(1);
  const all = buildRecentActivity(patients);
  const filtered = filterRecentActivity(all, patientId, recency);
  const { items, hasMore } = paginateRecentActivity(filtered, page, RECENT_PAGE_SIZE);
  const withActivity = patients.filter((patient) => patient.timeline.length > 0);
  const choose = (nextPatient: string, nextRecency: RecentRecency) => { setPatientId(nextPatient); setRecency(nextRecency); setPage(1); };
  return <section className="nvw-panel"><div className="nvw-panel-head"><div><h3>Movimientos de las fichas</h3><p>Se respeta el orden provisto por cada ficha; no se reconstruye una cronología clínica global.</p></div><NvBadge>{filtered.length} movimientos</NvBadge></div>
    <div className="nvw-filters" aria-label="Filtros de actividad reciente">
      <div role="group" aria-label="Paciente">
        <button type="button" aria-pressed={patientId === 'all'} onClick={() => choose('all', recency)}>Todas las pacientes</button>
        {withActivity.map((patient) => <button type="button" key={patient.id} aria-pressed={patientId === patient.id} onClick={() => choose(patient.id, recency)}>{patient.name}</button>)}
      </div>
      <div role="group" aria-label="Recencia">{RECENT_RECENCY.map((option) => <button type="button" key={option.id} aria-pressed={recency === option.id} onClick={() => choose(patientId, option.id)}>{option.label}</button>)}</div>
    </div>
    {items.length ? <><div className="nvw-activity">{items.map(({ patient, event }) => <button type="button" key={`${patient.id}-${event.id}`} onClick={() => onOpenPatient(patient.id)}><span className={`nv-avatar person-${patient.tone}`}>{patient.initials}</span><span><small>{event.atLabel} · {patient.name}</small><strong>{event.title}</strong><p>{event.body || 'Sin detalle adicional'}</p></span><Icon name="chevron" size={16} /></button>)}</div>
      {hasMore && <div className="nvw-more"><NvButton className="nv-ghost" onClick={() => setPage((current) => current + 1)}>Ver más movimientos <Icon name="chevron" size={14} /></NvButton></div>}</>
      : <NvState title="Sin actividad en este filtro" description="Ajustá la paciente o la recencia para volver a ver movimientos." />}</section>;
}

function Saved({ patients, onOpenPatient }: Pick<WorkCenterProps, 'patients' | 'onOpenPatient'>) {
  const addPatient = useAppStore((state) => state.addPatient);
  const [resourceId, setResourceId] = useState(RESOURCE_GUIDES[0].id);
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  const [saving, setSaving] = useState(false);
  const resource = RESOURCE_GUIDES.find((guide) => guide.id === resourceId) ?? RESOURCE_GUIDES[0];
  const saved = patients.filter((patient) => patient.plan_b.trim());
  const allSelected = patients.length > 0 && selectedPatientIds.length === patients.length;
  const togglePatient = (patientId: string) => {
    setSelectedPatientIds((current) => current.includes(patientId)
      ? current.filter((id) => id !== patientId)
      : [...current, patientId]);
    setFeedback('');
  };
  const assign = async () => {
    if (!selectedPatientIds.length || saving) return;
    setSaving(true);
    setFeedback('');
    try {
      const result = await api.assignResource(resourceId, selectedPatientIds);
      result.patients.forEach(addPatient);
      const assigned = result.assigned_count;
      const existing = result.existing_count;
      const assignedText = assigned === 1 ? '1 asignación creada.' : assigned > 1 ? `${assigned} asignaciones creadas.` : 'No se crearon asignaciones nuevas.';
      const existingText = existing ? ` ${existing} ya existía${existing === 1 ? '' : 'n'}.` : '';
      setFeedback(`${assignedText}${existingText}`);
    } catch {
      setFeedback('No se pudieron asignar los recursos.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="nvw-saved-layout">
    <section className="nvw-resource-assignment" aria-label="Asignar recursos">
      <div className="nvw-panel-head"><div><h3>Asignar recursos</h3><p>Elegí una guía operativa y uno o varios pacientes.</p></div><NvBadge>{RESOURCE_GUIDES.length} guías</NvBadge></div>
      <div className="nvw-resource-picker" aria-label="Guías disponibles">{RESOURCE_GUIDES.map((guide) => <button type="button" key={guide.id} aria-pressed={resourceId === guide.id} onClick={() => { setResourceId(guide.id); setFeedback(''); }}><span className="nv-icon-tile"><Icon name={guide.icon} size={17} /></span><span><strong>{guide.title}</strong><small>{guide.category} · {guide.minutes} min</small></span></button>)}</div>
      <div className="nvw-assignment-body">
        <article className="nvw-resource-preview"><span>{resource.eyebrow}</span><h4>{resource.title}</h4><p>{resource.summary}</p><small>Contenido editorial operativo · no es una indicación clínica.</small></article>
        <section className="nvw-patient-checklist" aria-label="Pacientes para asignar"><header><div><strong>Pacientes</strong><small>{selectedPatientIds.length} seleccionados</small></div><button type="button" onClick={() => setSelectedPatientIds(allSelected ? [] : patients.map((patient) => patient.id))}>{allSelected ? 'Quitar todos' : 'Seleccionar todos'}</button></header><div>{patients.map((patient) => {
          const assignment = patient.resource_assignments?.find((item) => item.resource_id === resourceId);
          return <label key={patient.id}><input type="checkbox" aria-label={`Seleccionar ${patient.name}`} checked={selectedPatientIds.includes(patient.id)} onChange={() => togglePatient(patient.id)} /><span className={`nv-avatar person-${patient.tone}`}>{patient.initials}</span><span><strong>{patient.name}</strong><small>{assignment?.read_at ? `Leído · ${resourceAssignmentDateLabel(assignment.read_at)}` : assignment ? `Asignado ${resourceAssignmentDateLabel(assignment.assigned_at)} · pendiente` : 'No asignado'}</small></span></label>;
        })}</div></section>
      </div>
      <footer className="nvw-assignment-footer"><p role="status" aria-live="polite">{feedback}</p><NvButton disabled={!selectedPatientIds.length || saving} onClick={() => void assign()}>{saving ? 'Asignando…' : `Asignar a ${selectedPatientIds.length || 0}`} <Icon name="arrow" size={15} /></NvButton></footer>
    </section>
    <section className="nvw-plan-b"><div className="nvw-panel-head"><div><h3>Planes B guardados</h3><p>Alternativas personales registradas en las fichas.</p></div><NvBadge tone="gold">{saved.length}</NvBadge></div>{saved.length ? <div className="nvw-card-grid">{saved.map((patient) => <article className="nvw-saved-card" key={patient.id}><header><span className={`nv-avatar person-${patient.tone}`}>{patient.initials}</span><div><strong>{patient.name}</strong><small>Alternativa personal</small></div><Icon name="pin" size={17} /></header><p>{patient.plan_b}</p><div><NvBadge tone="gold">Plan B</NvBadge><NvButton onClick={() => onOpenPatient(patient.id)}>Abrir ficha</NvButton></div></article>)}</div> : <NvState title="Sin Planes B guardados" description="Las alternativas personales registradas en las fichas aparecerán acá." />}</section>
  </div>;
}

export type FollowUpBand = 'all' | 'attention' | 'stable' | 'strong';
export type FollowUpPending = 'all' | 'with' | 'without';

export function filterFollowUpRows(rows: { patient: Patient; pendingMeals: number }[], band: FollowUpBand, pending: FollowUpPending) {
  return rows.filter(({ patient, pendingMeals }) => {
    const matchesBand = band === 'all'
      || (band === 'attention' && patient.adherence_score < 70)
      || (band === 'stable' && patient.adherence_score >= 70 && patient.adherence_score < 85)
      || (band === 'strong' && patient.adherence_score >= 85);
    const matchesPending = pending === 'all' || (pending === 'with' ? pendingMeals > 0 : pendingMeals === 0);
    return matchesBand && matchesPending;
  });
}

const FOLLOW_UP_BANDS: Array<{ id: FollowUpBand; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'attention', label: 'Necesitan atención' },
  { id: 'stable', label: 'Seguimiento estable' },
  { id: 'strong', label: 'En buen ritmo' },
];
const FOLLOW_UP_PENDING: Array<{ id: FollowUpPending; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'with', label: 'Con pendientes' },
  { id: 'without', label: 'Sin pendientes' },
];

function FollowUp({ patients, onOpenPatient, onOpenMeals }: Pick<WorkCenterProps, 'patients' | 'onOpenPatient' | 'onOpenMeals'>) {
  const [band, setBand] = useState<FollowUpBand>('all');
  const [pending, setPending] = useState<FollowUpPending>('all');
  const ranked = rankPatientsForFollowUp(patients);
  const rows = filterFollowUpRows(ranked, band, pending);
  return <>
    <div className="nvw-filters" aria-label="Filtros del centro de seguimiento">
      <div role="group" aria-label="Banda de adherencia">{FOLLOW_UP_BANDS.map((option) => <button type="button" key={option.id} aria-pressed={band === option.id} onClick={() => setBand(option.id)}>{option.label}</button>)}</div>
      <div role="group" aria-label="Revisiones pendientes">{FOLLOW_UP_PENDING.map((option) => <button type="button" key={option.id} aria-pressed={pending === option.id} onClick={() => setPending(option.id)}>{option.label}</button>)}</div>
      <NvBadge>{rows.length} de {ranked.length}</NvBadge>
    </div>
    {rows.length ? <div className="nvw-follow-list">{rows.map(({ patient, pendingMeals }) => <article key={patient.id}><span className={`nv-avatar person-${patient.tone}`}>{patient.initials}</span><div className="nvw-follow-copy"><div><strong>{patient.name}</strong><NvBadge tone={patient.adherence_score < 70 ? 'gold' : 'green'}>{patient.adherence_score}% adherencia</NvBadge></div><p>{patient.brief?.up_next_title ?? (patient.next_focus || 'Sin próximo foco definido')}</p><small>{pendingMeals ? `${pendingMeals} comida${pendingMeals === 1 ? '' : 's'} pendiente${pendingMeals === 1 ? '' : 's'} de revisión` : 'Sin comidas pendientes de revisión'}</small></div><div className="nvw-actions">{pendingMeals > 0 && <NvButton onClick={() => onOpenMeals(patient.id)}>Revisar comidas</NvButton>}<button type="button" onClick={() => onOpenPatient(patient.id)}>Abrir ficha</button></div></article>)}</div>
      : <NvState title="Sin pacientes en este filtro" description="Ajustá la banda de adherencia o las revisiones pendientes para volver a ver resultados." />}
  </>;
}

function Panels({ patients, onOpenPatient }: Pick<WorkCenterProps, 'patients' | 'onOpenPatient'>) {
  const summary = buildTrackingSummary(patients);
  const bands = [
    { label: 'Necesitan atención', count: patients.filter((patient) => patient.adherence_score < 70).length, tone: 'attention' },
    { label: 'Seguimiento estable', count: patients.filter((patient) => patient.adherence_score >= 70 && patient.adherence_score < 85).length, tone: 'stable' },
    { label: 'En buen ritmo', count: patients.filter((patient) => patient.adherence_score >= 85).length, tone: 'strong' },
  ];
  const attention = rankPatientsForFollowUp(patients).filter(({ patient }) => patient.adherence_score < 70);
  return <><section className="nvw-stats" aria-label="Indicadores del consultorio"><article><Icon name="users" size={18} /><small>Pacientes activos</small><strong>{summary.patients}</strong></article><article><Icon name="camera" size={18} /><small>Comidas pendientes</small><strong>{summary.pendingMeals}</strong></article><article><Icon name="trend" size={18} /><small>Adherencia media</small><strong>{summary.averageAdherence}%</strong></article><article><Icon name="calendar" size={18} /><small>Próximas consultas</small><strong>{summary.appointments}</strong></article></section><div className="nvw-panel-layout"><section className="nvw-panel"><div className="nvw-panel-head"><div><h3>Distribución de seguimiento</h3><p>Bandas derivadas de la adherencia actual registrada.</p></div></div><div className="nvw-distribution">{bands.map((band) => <article key={band.label}><div><span>{band.label}</span><strong>{band.count}</strong></div><span className={`nvw-bar ${band.tone}`}><i style={{ width: `${patients.length ? Math.round((band.count / patients.length) * 100) : 0}%` }} /></span></article>)}</div></section><section className="nvw-panel"><div className="nvw-panel-head"><div><h3>Atención prioritaria</h3><p>Pacientes con adherencia menor a 70%.</p></div></div>{attention.length ? <div className="nvw-priority">{attention.map(({ patient }) => <button type="button" key={patient.id} onClick={() => onOpenPatient(patient.id)}><span className={`nv-avatar person-${patient.tone}`}>{patient.initials}</span><span><strong>{patient.name}</strong><small>{patient.adherence_score}% · {patient.next_focus || 'Sin próximo foco'}</small></span><Icon name="chevron" size={15} /></button>)}</div> : <NvState title="Sin alertas de adherencia" description="No hay pacientes por debajo del umbral de seguimiento." />}</section></div></>;
}

function VideoCalls({ patients, now, onOpenConsultations }: Pick<WorkCenterProps, 'patients' | 'now' | 'onOpenConsultations'>) {
  const entries = buildAgendaEntries(patients, now).filter((entry) => entry.appointment.channel === 'video');
  return entries.length ? <div className="nvw-video-grid">{entries.map((entry) => { const safeUrl = secureMeetUrl(entry.appointment.meet_url); return <article key={entry.patient.id}><header><span className={`nv-avatar person-${entry.patient.tone}`}>{entry.patient.initials}</span><div><strong>{entry.patient.name}</strong><small>{entry.date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}</small></div><NvBadge tone="green">Video</NvBadge></header><div className="nvw-video-time"><Icon name="clock" size={18} /><span><strong>{entry.appointment.when.split(' · ')[1]}</strong><small>{entry.appointment.duration} minutos</small></span></div><div className="nvw-video-actions">{safeUrl && <a href={safeUrl} target="_blank" rel="noopener noreferrer">Abrir videollamada</a>}<NvButton onClick={() => onOpenConsultations(entry.patient.id)}>Gestionar consulta</NvButton></div></article>; })}</div> : <NvState title="Sin videollamadas programadas" description="Las próximas consultas virtuales aparecerán acá." />;
}

export function ShowroomWorkCenter(props: WorkCenterProps) {
  return <section className={`nvw-work-center nvw-${props.module}`} aria-label={MODULES[props.module].title}>
    <Header module={props.module} count={props.patients.length} />
    {props.module === 'reciente' ? <Recent patients={props.patients} onOpenPatient={props.onOpenPatient} />
      : props.module === 'guardado' ? <Saved patients={props.patients} onOpenPatient={props.onOpenPatient} />
        : props.module === 'seguimiento' ? <FollowUp patients={props.patients} onOpenPatient={props.onOpenPatient} onOpenMeals={props.onOpenMeals} />
          : props.module === 'paneles' ? <Panels patients={props.patients} onOpenPatient={props.onOpenPatient} />
            : <VideoCalls patients={props.patients} now={props.now} onOpenConsultations={props.onOpenConsultations} />}
  </section>;
}
