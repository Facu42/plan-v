import { useState } from 'react';
import { api } from '../../api/client';
import {
  pendingReviewCount,
  scoreBand,
  gaugeLabel,
  UP_NEXT_CTA,
  STAGE_RAIL,
  useAppStore,
} from '../../store/useAppStore';
import type { MealLog, Patient } from '../../types';
import { Icon, Mark, ScoreRing, MacroBar } from '../shared/Icon';

const RAIL_LABELS = ['Evaluación inicial', 'Ritmo de la semana', 'Plan B', 'Revisión'] as const;

function MealReviewPanel({ patient, log, onClose }: { patient: Patient; log: MealLog; onClose: () => void }) {
  const refreshPatient = useAppStore((s) => s.refreshPatient);
  const [busy, setBusy] = useState(false);

  const act = async (status: 'confirmed' | 'adjusted') => {
    setBusy(true);
    try {
      await api.updateMeal(patient.id, log.id, { status });
      await refreshPatient(patient.id);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="review-panel">
      <div className="review-head">
        <h3>Revisar comida · {log.slot}</h3>
        <button type="button" onClick={onClose} aria-label="Cerrar">×</button>
      </div>
      {log.photo_url && <img src={log.photo_url} alt="Comida del paciente" className="review-photo" />}
      {log.description && !log.photo_url && <p className="review-desc">“{log.description}”</p>}
      <div className="food-tags">{log.foods.map((f) => <span key={f.name}>{f.name}</span>)}</div>
      {log.macros && <MacroBar macros={log.macros} />}
      <p className="review-note"><strong>Nota IA (solo vos):</strong> {log.note_for_nutri}</p>
      <p className="review-confidence">Confianza: {(log.confidence * 100).toFixed(0)}% · {log.confidence < 0.45 ? 'No suma al gauge' : 'Estimación usable'}</p>
      <div className="review-actions">
        <button type="button" className="primary-button" disabled={busy} onClick={() => act('confirmed')}>
          <Icon name="check" size={16} />Confirmar
        </button>
        <button type="button" className="soft-button" disabled={busy} onClick={() => act('adjusted')}>
          <Icon name="edit" size={16} />Ajustar y confirmar
        </button>
      </div>
    </div>
  );
}

export function CrmDashboard() {
  const { patients, selectCrmPatient, refreshPatient } = useAppStore();
  const [selectedId, setSelectedId] = useState(patients[0]?.id ?? 'pat-sofia');
  const selected = patients.find((p) => p.id === selectedId)!;
  const [sent, setSent] = useState(false);
  const [draft, setDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [reviewLog, setReviewLog] = useState<MealLog | null>(null);

  const stageIdx = STAGE_RAIL.indexOf(selected.stage);
  const brief = selected.brief;
  const pending = selected.meal_logs.filter((l) => l.status === 'pending_review');

  const pickPatient = (id: string) => {
    setSelectedId(id);
    selectCrmPatient(id);
    setSent(false);
    setDraft('');
    setReviewLog(null);
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

  return (
    <main className="reference-stage">
      <section className="reference-frame">
        <header className="crm-appbar">
          <div className="crm-product">
            <span className="grid-dot">⠿</span><Mark /><b>Plan V</b><i /><span>Centro profesional</span>
          </div>
          <div className="crm-tools">
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
            <p>Mi trabajo</p>
            <div className="menu-group">
              <button type="button" className="menu-current"><Icon name="sparkle" size={15} />Centro de ritmo</button>
              <button type="button"><Icon name="trend" size={15} />Seguimiento</button>
              <button type="button"><Icon name="calendar" size={15} />Agenda</button>
            </div>
            <p>Pacientes</p>
            <div className="menu-group">
              <button type="button"><Icon name="users" size={15} />Todos <span className="menu-badge">{patients.length}</span></button>
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
              {patients.map((patient) => (
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
                  </span>
                  <span className={`person-score score-${scoreBand(patient.adherence_score)}`}>{patient.adherence_score}</span>
                  {pendingReviewCount(patient) > 0 && <span className="pending-dot">{pendingReviewCount(patient)}</span>}
                </button>
              ))}
            </div>
          </section>

          <section className="crm-workspace">
            <div className="crm-commandbar">
              <button type="button" className="command-primary" onClick={generateBrief} disabled={generating}>
                <Icon name={generating ? 'loader' : 'sparkle'} size={14} className={generating ? 'spin' : ''} />
                {generating ? 'Generando…' : 'Actualizar copiloto'}
              </button>
              <button type="button"><Icon name="plus" size={14} />Nuevo paciente</button>
              <button type="button"><Icon name="message" size={14} />Mensaje</button>
            </div>

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

            <section className="rhythm-rail">
              <div className="rail-progress">
                {RAIL_LABELS.map((label, i) => (
                  <i key={label} className={i < stageIdx ? 'rail-done' : i === stageIdx ? 'rail-active' : ''}>{label}</i>
                ))}
              </div>
            </section>

            <nav className="record-tabs">
              <button type="button" className="active">Resumen</button>
              <button type="button">Comidas y hábitos</button>
              <button type="button">Plan</button>
              <button type="button">Consultas</button>
            </nav>

            {pending.length > 0 && (
              <section className="pending-banner">
                <Icon name="camera" size={16} />
                <span>{pending.length} comida{pending.length > 1 ? 's' : ''} pendiente{pending.length > 1 ? 's' : ''} de revisión</span>
                <button type="button" onClick={() => setReviewLog(pending[0])}>Revisar ahora</button>
              </section>
            )}

            <section className="crm-card-grid">
              <article className="crm-card contact-card">
                <h3>Ficha breve</h3>
                <dl>
                  <div><dt>Objetivo actual</dt><dd>{selected.goal}</dd></div>
                  <div><dt>Horario sensible</dt><dd>{selected.sensitive_hours}</dd></div>
                  <div><dt>Plan B favorito</dt><dd>{selected.plan_b}</dd></div>
                  <div><dt>Próximo foco</dt><dd>{selected.next_focus}</dd></div>
                </dl>
              </article>

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
                        <textarea value={draft || brief.draft_message || ''} onChange={(e) => setDraft(e.target.value)} rows={3} />
                      </div>
                    )}
                    <div className="task-actions">
                      {brief.suggested_action === 'mensaje' ? (
                        <button type="button" className="dark-action" onClick={sendDraft}>
                          {sent ? <><Icon name="check" size={14} />Enviado</> : UP_NEXT_CTA.mensaje}
                        </button>
                      ) : (
                        <button type="button" className="dark-action">{UP_NEXT_CTA[brief.suggested_action]}</button>
                      )}
                      <button type="button">Marcar luego</button>
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
                    <button type="button" className="subtle-action">Abrir videollamada <Icon name="arrow" size={14} /></button>
                  </>
                ) : <p>Sin turno cargado.</p>}
              </article>
            </section>
          </section>
        </div>
      </section>

      {reviewLog && (
        <div className="modal-backdrop review-backdrop">
          <MealReviewPanel patient={selected} log={reviewLog} onClose={() => setReviewLog(null)} />
        </div>
      )}
    </main>
  );
}
