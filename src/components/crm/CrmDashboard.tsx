import { useRef, useState } from 'react';
import { api, type PatientInvite } from '../../api/client';
import {
  pendingReviewCount,
  scoreBand,
  gaugeLabel,
  UP_NEXT_CTA,
  STAGE_RAIL,
  useAppStore,
} from '../../store/useAppStore';
import type { MealLog, Patient } from '../../types';
import { Icon, Mark, ScoreRing } from '../shared/Icon';
import { CRM_MENU_SECTIONS, CrmModuleView, type CrmModule } from './CrmModuleView';
import { MealReviewPanel } from './MealReviewPanel';
import { CrmMenuEditor } from './CrmMenuEditor';
import { CrmMealsHabitsTab } from './CrmMealsHabitsTab';
import { CrmAppointmentsTab } from './CrmAppointmentsTab';
import { CrmPatientContactCard } from './CrmPatientContactCard';
import { CrmBillingControl } from './CrmBillingControl';
import { CrmPatientCreateDialog } from './CrmPatientCreateDialog';
import { resolveNextStepTarget } from './next-step-target';
import { resolveCommandMessageAction, visibleBrief } from './crm-interactions';
import { resolveCrmEntry, type CrmEntry } from './crm-entry';

const RAIL_LABELS = ['Evaluación inicial', 'Ritmo semanal', 'Plan B', 'Revisión'] as const;

export function CrmDashboard({ darkMode, onToggleTheme, initialEntry }: { darkMode: boolean; onToggleTheme: () => void; initialEntry?: CrmEntry }) {
  const { patients, addPatient, selectCrmPatient, refreshPatient } = useAppStore();
  const activePatients = patients.filter((patient) => !patient.archived_at);
  const [entry] = useState(() => resolveCrmEntry(patients, initialEntry));
  const [selectedId, setSelectedId] = useState(entry?.patientId ?? '');
  const selected = patients.find((p) => p.id === selectedId);
  const [sent, setSent] = useState(false);
  const [draft, setDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [reviewLog, setReviewLog] = useState<MealLog | null>(null);
  const [activeModule, setActiveModule] = useState<CrmModule>(entry?.module ?? 'fichas');
  const [activeTab, setActiveTab] = useState<'resumen' | 'comidas' | 'plan' | 'consultas'>(entry?.tab ?? 'resumen');
  const [createOpen, setCreateOpen] = useState(false);
  const [inviteNotice, setInviteNotice] = useState<string | null>(null);
  const [menuFocus, setMenuFocus] = useState<{ day: string; slot: string | null } | null>(null);
  const [appointmentEdit, setAppointmentEdit] = useState(false);
  const messageDraftRef = useRef<HTMLTextAreaElement>(null);

  if (!selected) return <div className="loading-card" role="status"><h2>Paciente no disponible</h2><p>Volvé al directorio para elegir un paciente activo.</p></div>;

  const stageIdx = STAGE_RAIL.indexOf(selected.stage);
  const brief = visibleBrief(selected.brief, selected.briefDismissed);
  const pending = selected.meal_logs.filter((l) => l.status === 'pending_review');

  const pickPatient = (id: string) => {
    setSelectedId(id);
    selectCrmPatient(id);
    setSent(false);
    setDraft('');
    setReviewLog(null);
    setActiveModule('fichas');
    setActiveTab('resumen');
    setMenuFocus(null);
    setAppointmentEdit(false);
  };

  const openAppointmentsForPatient = (id: string) => {
    setSelectedId(id);
    selectCrmPatient(id);
    setSent(false);
    setDraft('');
    setReviewLog(null);
    setActiveModule('fichas');
    setActiveTab('consultas');
    setMenuFocus(null);
    setAppointmentEdit(true);
  };

  const patientCreated = (patient: Patient, invite: PatientInvite) => {
    addPatient(patient);
    setSelectedId(patient.id);
    setActiveModule('fichas');
    setActiveTab('resumen');
    setCreateOpen(false);
    setInviteNotice(`${patient.name} fue incorporada. Invitación de un uso a ${invite.email}${invite.expires_at ? ' con vencimiento' : ' guardada'}.`);
  };

  const generateBrief = async () => {
    setGenerating(true);
    try {
      const { brief: b } = await api.generateBrief(selected.id);
      if (b.draft_message) setDraft(b.draft_message);
      await refreshPatient(selected.id);
    } finally {
      setGenerating(false);
    }
  };

  const sendDraft = async () => {
    const text = draft || brief?.draft_message;
    if (!text) return;
    await api.sendMessage(selected.id, text, 'vero', true);
    setSent(true);
    await refreshPatient(selected.id);
  };

  const dismissBrief = async () => {
    await api.dismissBrief(selected.id);
    setDraft('');
    setSent(false);
    await refreshPatient(selected.id);
  };

  const openNextStep = () => {
    if (!brief?.suggested_action) return;
    const target = resolveNextStepTarget(selected, brief.suggested_action);
    if (target?.kind === 'menu') {
      setMenuFocus({ day: target.day, slot: target.slot });
      setAppointmentEdit(false);
      setActiveTab('plan');
    } else if (target?.kind === 'appointment') {
      setAppointmentEdit(true);
      setMenuFocus(null);
      setActiveTab('consultas');
    }
  };

  const focusMessageDraft = () => {
    resolveCommandMessageAction();
    setActiveTab('resumen');
    setMenuFocus(null);
    setAppointmentEdit(false);
    window.setTimeout(() => {
      messageDraftRef.current?.focus();
      messageDraftRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 0);
  };

  const openTab = (tab: 'resumen' | 'comidas' | 'plan' | 'consultas') => {
    setActiveTab(tab);
    if (tab !== 'plan') setMenuFocus(null);
    if (tab !== 'consultas') setAppointmentEdit(false);
  };

  return (
    <main className="reference-stage">
      <section className="reference-frame">
        <header className="crm-appbar">
          <div className="crm-product">
            <span className="grid-dot">⠿</span><Mark /><b>Plan V</b><i /><span>Centro profesional</span>
          </div>
          <div className="crm-tools">
            <button type="button" className="crm-theme-toggle" aria-label={darkMode ? 'Usar tema claro' : 'Usar tema oscuro'} aria-pressed={darkMode} onClick={onToggleTheme}>
              <Icon name={darkMode ? 'sun' : 'moon'} size={15} />
            </button>
            <button type="button" className="ai-status-pill" title="Estado de IA">
              <Icon name="sparkle" size={14} /> Copiloto IA
            </button>
            <button type="button" aria-label="Notificaciones"><Icon name="bell" size={15} /></button>
            <button type="button" className="crm-avatar">VT</button>
          </div>
        </header>

        <div className="crm-body">
          <aside className="crm-menu">
            <div className="crm-menu-heading"><h2>Menú</h2><button type="button"><Icon name="arrow" size={14} /></button></div>
            <div className="crm-menu-sections">
              {CRM_MENU_SECTIONS.map((section, sectionIndex) => (
                <section className="menu-section" key={section.title ?? `main-${sectionIndex}`}>
                  {section.title && <p className="menu-section-title">{section.title}</p>}
                  <div className="menu-group">
                    {section.items.map((item) => (
                      <button
                        type="button"
                        className={activeModule === item.id ? 'menu-current' : ''}
                        aria-current={activeModule === item.id ? 'page' : undefined}
                        onClick={() => setActiveModule(item.id)}
                        key={item.id}
                      >
                        <Icon name={item.icon} size={15} />
                        <span className="menu-label">{item.label}</span>
                        {item.id === 'pacientes' && <span className="menu-badge">{activePatients.length}</span>}
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </aside>

          <section className="crm-worklist">
            <div className="worklist-head">
              <h2>Mi seguimiento</h2>
              <button type="button" className="refresh-ai-btn" onClick={generateBrief} disabled={generating}>
                <Icon name={generating ? 'loader' : 'sparkle'} size={15} className={generating ? 'spin' : ''} />
              </button>
            </div>
            <p className="worklist-label">HOY</p>
            <div className="worklist-scroll">
              {activePatients.map((patient) => (
                <button
                  type="button"
                  className={`work-person ${selected.id === patient.id ? 'selected' : ''}`}
                  key={patient.id}
                  onClick={() => pickPatient(patient.id)}
                >
                  <span className={`crm-avatar person-${patient.tone}`}>{patient.initials}</span>
                  <span className="person-copy">
                    <b>{patient.name}</b>
                    <small>{patient.brief?.up_next_title ?? patient.adherence_why}</small>
                    <em>{patient.status} · {patient.time}</em>
                    <span className={`billing-chip billing-${patient.billing_status}`}>
                      {patient.billing_status === 'active' ? 'Activo' : patient.billing_status === 'pending' ? 'Pendiente' : patient.billing_status === 'waived' ? 'Exceptuado' : 'Vencido'}
                    </span>
                  </span>
                  <span className={`person-score score-${scoreBand(patient.adherence_score)}`}>{patient.adherence_score}</span>
                  {pendingReviewCount(patient) > 0 && <span className="pending-dot">{pendingReviewCount(patient)}</span>}
                </button>
              ))}
            </div>
          </section>

          <section className="crm-workspace">
            {activeModule === 'fichas' ? <>
            <div className="crm-commandbar">
              <button type="button" className="command-primary" onClick={generateBrief} disabled={generating}>
                <Icon name={generating ? 'loader' : 'sparkle'} size={14} className={generating ? 'spin' : ''} />
                {generating ? 'Generando…' : 'Actualizar copiloto'}
              </button>
              <button type="button" onClick={() => setCreateOpen(true)}><Icon name="plus" size={14} />Nuevo paciente</button>
              <button type="button" onClick={focusMessageDraft}><Icon name="message" size={14} />Mensaje</button>
            </div>

            {inviteNotice && (
              <div className="patient-create-notice" role="status">
                <Icon name="check" size={15} />
                <span>{inviteNotice}</span>
                <button type="button" onClick={() => setInviteNotice(null)} aria-label="Cerrar aviso">×</button>
              </div>
            )}

            <header className="patient-record">
              <span className={`record-avatar person-${selected.tone}`}>{selected.initials}</span>
              <div className="record-name">
                <h1>{selected.name}</h1>
                <div><span>Paciente</span><span>{selected.status}</span></div>
              </div>
              <div className="record-meta">
                <span><small>Objetivo</small>{selected.goal}</span>
                <span><small>Estado</small>{selected.status}</span>
                <span><small>Próxima consulta</small>{selected.appointment?.when ?? '—'}</span>
                <span className="owner"><i>VT</i><small>Profesional</small>Verónica</span>
              </div>
            </header>

            <CrmBillingControl patient={selected} />

            <section className="rhythm-rail" aria-label="Etapa del acompañamiento">
              <div className="process-rail">
                <div className="process-summary">
                  <strong>Proceso de acompañamiento</strong>
                  <small>Activo · {selected.time}</small>
                </div>
                <ol className="rail-progress">
                  {RAIL_LABELS.map((label, i) => {
                    const state = i < stageIdx ? 'rail-done' : i === stageIdx ? 'rail-active' : '';
                    return (
                      <li key={label} className={state} aria-current={i === stageIdx ? 'step' : undefined}>
                        <span className="rail-step-index">{i < stageIdx ? <Icon name="check" size={10} /> : i + 1}</span>
                        <span className="rail-step-label">{label}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </section>

            <nav className="record-tabs">
              <button type="button" className={activeTab === 'resumen' ? 'active' : ''} onClick={() => openTab('resumen')}>Resumen</button>
              <button type="button" className={activeTab === 'comidas' ? 'active' : ''} onClick={() => openTab('comidas')}>Comidas y hábitos</button>
              <button type="button" className={activeTab === 'plan' ? 'active' : ''} onClick={() => openTab('plan')}>Plan</button>
              <button type="button" className={activeTab === 'consultas' ? 'active' : ''} onClick={() => openTab('consultas')}>Consultas</button>
            </nav>

            {activeTab === 'plan' && <CrmMenuEditor patient={selected} initialDay={menuFocus?.day} initialSlot={menuFocus?.slot} />}
            {activeTab === 'comidas' && <CrmMealsHabitsTab patient={selected} onReviewMeal={setReviewLog} />}
            {activeTab === 'consultas' && <CrmAppointmentsTab patient={selected} startEditing={appointmentEdit} />}
            {activeTab === 'resumen' && (<>
            {pending.length > 0 && (
              <section className="pending-banner">
                <Icon name="camera" size={16} />
                <span>{pending.length} comida{pending.length > 1 ? 's' : ''} pendiente{pending.length > 1 ? 's' : ''} de revisión</span>
                <button type="button" onClick={() => setReviewLog(pending[0])}>Revisar ahora</button>
              </section>
            )}

            <section className="crm-card-grid">
              <CrmPatientContactCard patient={selected} />

              <article className="crm-card next-card">
                <div className="card-heading">
                  <h3>Próximo paso · IA</h3>
                  <button type="button" onClick={generateBrief} disabled={generating} aria-label="Regenerar">
                    <Icon name={generating ? 'loader' : 'sparkle'} size={15} className={generating ? 'spin' : ''} />
                  </button>
                </div>
                {brief?.suggested_action ? (
                  <>
                    <div className="next-sequence">
                      {brief.suggested_action === 'mensaje' ? 'Mensaje · el nutri confirma' : brief.suggested_action === 'ajuste_menu' ? 'Menú · no se reescribe solo' : 'Turno · no se agenda solo'}
                    </div>
                    <div className="next-task">
                      <span><Icon name={brief.suggested_action === 'turno' ? 'video' : brief.suggested_action === 'ajuste_menu' ? 'leaf' : 'message'} size={16} /></span>
                      <div>
                        <b>{brief.up_next_title}</b>
                        <small>{pendingReviewCount(selected) > 0 ? `${pendingReviewCount(selected)} foto(s) sin revisar` : 'Hoy'}</small>
                      </div>
                    </div>
                    <p>{brief.up_next_body}</p>
                    {brief.suggested_action === 'mensaje' && (
                      <div className="draft-box">
                        <label>Borrador sugerido (editá antes de enviar)</label>
                        <textarea ref={messageDraftRef} value={draft || brief.draft_message || ''} onChange={(e) => setDraft(e.target.value)} rows={3} />
                      </div>
                    )}
                    <div className="task-actions">
                      {brief.suggested_action === 'mensaje' ? (
                        <button type="button" className="dark-action" onClick={sendDraft}>
                          {sent ? <><Icon name="check" size={14} />Enviado</> : UP_NEXT_CTA.mensaje}
                        </button>
                      ) : (
                        <button type="button" className="dark-action" onClick={openNextStep}>{UP_NEXT_CTA[brief.suggested_action]}</button>
                      )}
                      <button type="button" onClick={dismissBrief}>Marcar luego</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="next-sequence">Sin acción urgente</div>
                    <p>Nada accionable hoy según el copiloto. Podés regenerar con el botón ✦.</p>
                    <button type="button" className="soft-button" onClick={generateBrief} disabled={generating}>Generar sugerencia</button>
                  </>
                )}
              </article>

              <article className="crm-card score-card">
                <div className="card-heading"><h3>Adherencia · 7 días</h3></div>
                <ScoreRing score={selected.adherence_score} label={gaugeLabel(selected.adherence_score)} />
                <ul>{selected.adherence_why.split('. ').filter(Boolean).map((line) => (
                  <li key={line}><i />{line.replace(/\.$/, '')}</li>
                ))}</ul>
              </article>

              <article className="crm-card plan-card">
                <div className="card-heading"><h3>Plan de hoy</h3></div>
                {selected.todayPlan.map((row) => <p key={row.slot}><b>{row.slot}</b> · {row.title}</p>)}
              </article>

              <article className="crm-card timeline-card wide">
                <div className="card-heading"><h3>Línea de tiempo</h3></div>
                {selected.timeline.map((ev) => (
                  <div className="timeline-entry" key={ev.id}>
                    <span>{ev.atLabel}</span>
                    <p><b>{ev.title}</b><small>{ev.body}</small></p>
                  </div>
                ))}
                {pending.map((log) => (
                  <div className="timeline-entry pending-entry" key={log.id}>
                    <span>REV</span>
                    <p>
                      <b>{log.slot} · pendiente</b>
                      <small>{log.foods.map((f) => f.name).join(', ')}</small>
                      <button type="button" className="inline-review" onClick={() => setReviewLog(log)}>Revisar</button>
                    </p>
                  </div>
                ))}
              </article>

              <article className="crm-card connections-card">
                <div className="card-heading"><h3>Próxima consulta</h3><Icon name="video" size={15} /></div>
                {selected.appointment ? (
                  <>
                    <p className="appointment-time">{selected.appointment.when} <span>{selected.appointment.duration} min</span></p>
                    {selected.appointment.meet_url ? (
                      <a className="subtle-action appointment-link" href={selected.appointment.meet_url} target="_blank" rel="noopener noreferrer">
                        Abrir videollamada <Icon name="arrow" size={14} />
                      </a>
                    ) : (
                      <button type="button" className="subtle-action" onClick={() => openTab('consultas')}>
                        Preparar consulta <Icon name="arrow" size={14} />
                      </button>
                    )}
                  </>
                ) : <p>Sin turno cargado.</p>}
              </article>
            </section>
            </>)}
            </> : (
              <CrmModuleView
                module={activeModule}
                patients={activeModule === 'pacientes' ? patients : activePatients}
                onOpenPatient={pickPatient}
                onOpenAppointments={openAppointmentsForPatient}
                onCreatePatient={() => setCreateOpen(true)}
              />
            )}
          </section>
        </div>
      </section>

      {createOpen && (
        <CrmPatientCreateDialog onClose={() => setCreateOpen(false)} onCreated={patientCreated} />
      )}

      {reviewLog && (
        <div className="modal-backdrop review-backdrop">
          <MealReviewPanel patient={selected} log={reviewLog} onClose={() => setReviewLog(null)} />
        </div>
      )}
    </main>
  );
}
