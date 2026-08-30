import { useMemo, useState, type ReactNode } from 'react';
import { patients, scoreBand, gaugeLabel, UP_NEXT_CTA, STAGE_RAIL, type PatientSeed } from '../seed';

type IconName = 'arrow' | 'bell' | 'calendar' | 'camera' | 'check' | 'chevron' | 'clock' | 'drop' | 'heart' | 'leaf' | 'message' | 'moon' | 'plus' | 'sparkle' | 'sun' | 'trend' | 'users' | 'video';

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  const paths: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4M17 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01" /></>,
    camera: <><path d="M4 7h4l1.5-2h5L16 7h4a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a1 1 0 0 1 1-1Z" /><circle cx="12" cy="13" r="3.5" /></>,
    check: <path d="m5 12 4.2 4.2L19 6.5" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></>,
    drop: <path d="M12 3.5S6.5 10.1 6.5 14A5.5 5.5 0 0 0 12 19.5a5.5 5.5 0 0 0 5.5-5.5C17.5 10.1 12 3.5 12 3.5Z" />,
    heart: <path d="M20.8 8.8c0 5.7-8.8 10.6-8.8 10.6S3.2 14.5 3.2 8.8A4.5 4.5 0 0 1 12 7.4a4.5 4.5 0 0 1 8.8 1.4Z" />,
    leaf: <><path d="M20 4C10.5 4 5 8.5 5 15c0 2.2 1.8 4 4 4C15.5 19 20 13.5 20 4Z" /><path d="M4 20c3-4.5 6.5-7 11-9" /></>,
    message: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.4 8.4 0 0 1-3-.6L4 20l1.4-4A7.2 7.2 0 0 1 4 11.5 7.5 7.5 0 0 1 12 4a7.5 7.5 0 0 1 8 7.5Z" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" /></>,
    moon: <path d="M20 15.4A8.3 8.3 0 0 1 8.6 4 8.3 8.3 0 1 0 20 15.4Z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    sparkle: <><path d="m12 2 1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2Z" /><path d="m19 16 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    trend: <><path d="M4 17 10 11l4 4 6-7" /><path d="M15 8h5v5" /></>,
    users: <><path d="M16 21v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 19.5V21" /><circle cx="10" cy="7" r="3.5" /><path d="M17 11.2a3.5 3.5 0 0 0 0-6.4M20 21v-1.5a4.5 4.5 0 0 0-2.6-4.1" /></>,
    video: <><rect x="3" y="6" width="13" height="12" rx="3" /><path d="m16 10 5-3v10l-5-3" /></>,
  };
  return <svg {...props}>{paths[name]}</svg>;
}

function Mark() { return <div className="brand-mark" aria-label="Plan V"><span>V</span><i /></div>; }

function ScoreRing({ score, label }: { score: number; label: string }) {
  const filled = Math.round((Math.max(0, Math.min(100, score)) / 100) * 36);
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const angle = (i / 36) * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const inner = 42;
    const outer = 54;
    const x1 = (60 + inner * Math.cos(rad)).toFixed(1);
    const y1 = (60 + inner * Math.sin(rad)).toFixed(1);
    const x2 = (60 + outer * Math.cos(rad)).toFixed(1);
    const y2 = (60 + outer * Math.sin(rad)).toFixed(1);
    return <line key={i} className={i < filled ? 'tick-on' : 'tick-off'} x1={x1} y1={y1} x2={x2} y2={y2} />;
  });
  return <div className="score-ring"><svg className="score-ticks" viewBox="0 0 120 120" aria-hidden="true">{ticks}</svg><strong>{score}</strong><span>{label}</span></div>;
}

const RAIL_LABELS = ['Evaluación inicial', 'Ritmo de la semana', 'Plan B', 'Revisión'] as const;


const meals = [
  { time: '08:00', title: 'Desayuno', detail: 'Yogur griego, granola y frutas', icon: 'sun' as IconName, state: 'Hecho', tone: 'yellow' },
  { time: '13:30', title: 'Almuerzo', detail: 'Bowl tibio de pollo y vegetales', icon: 'leaf' as IconName, state: 'En 1 h 20 min', tone: 'green' },
  { time: '17:30', title: 'Merienda', detail: 'Tostada con huevo y palta', icon: 'heart' as IconName, state: 'Después', tone: 'coral' },
  { time: '21:00', title: 'Cena', detail: 'Elegí tu versión favorita', icon: 'moon' as IconName, state: 'Plan B listo', tone: 'lilac' },
];

function PatientHome({ openPhoto }: { openPhoto: () => void }) {
  const [hydration, setHydration] = useState(5);
  const [checkIn, setCheckIn] = useState<string | null>(null);
  const [selectedMeal, setSelectedMeal] = useState('Almuerzo');
  const rhythmMessage = useMemo(() => hydration >= 7 ? 'Tu ritmo está cuidado. Seguí escuchándote.' : hydration >= 5 ? 'Vas bien. Un vaso más acompaña tu tarde.' : 'Hagamos una pausa breve para tomar agua.', [hydration]);

  return <main className="patient-shell">
    <header className="patient-topbar"><div className="brand-lockup"><Mark /><span>Plan V</span></div><button className="round-button" aria-label="Ver recordatorios"><Icon name="bell" size={18} /><b /></button></header>
    <section className="patient-hello"><p className="eyebrow">Miércoles, 30 de agosto</p><h1>Buen día, Sofi <span>✦</span></h1><p>Hoy no hace falta hacerlo perfecto. Solo elegir lo que te haga bien.</p></section>
    <section className="pulse-card" aria-label="Tu ritmo de hoy"><div className="pulse-copy"><span className="pulse-label"><i /> Tu ritmo de hoy</span><strong>En equilibrio</strong><p>{rhythmMessage}</p></div><div className="pulse-orbit" aria-hidden="true"><div className="orbit orbit-1" /><div className="orbit orbit-2" /><div className="orbit orbit-3" /><div className="pulse-core"><Icon name="heart" size={23} /></div><span className="orbit-tag tag-water"><Icon name="drop" size={13} /> {hydration}/8</span><span className="orbit-tag tag-meals"><Icon name="check" size={13} /> 1/4</span></div><div className="pulse-footer"><span>Comidas</span><div className="pulse-track"><i /><i className="empty" /><i className="empty" /><i className="empty" /></div><span>Un paso a la vez</span></div></section>
    <section className="today-heading section-heading"><div><p className="eyebrow">Tu día, a tu manera</p><h2>¿Qué te toca ahora?</h2></div><button className="text-button">Ver menú <Icon name="arrow" size={15} /></button></section>
    <section className="meal-list" aria-label="Comidas de hoy">{meals.map((meal) => <button key={meal.title} className={`meal-row ${selectedMeal === meal.title ? 'active' : ''}`} onClick={() => setSelectedMeal(meal.title)}><time>{meal.time}</time><span className={`meal-icon ${meal.tone}`}><Icon name={meal.icon} size={18} /></span><span className="meal-copy"><b>{meal.title}</b><small>{meal.detail}</small></span><span className={`meal-state ${meal.state === 'Hecho' ? 'done' : ''}`}>{meal.state === 'Hecho' && <Icon name="check" size={13} />}{meal.state}</span><Icon name="chevron" size={17} /></button>)}</section>
    <section className="patient-actions"><button className="photo-action" onClick={openPhoto}><span><Icon name="camera" size={21} /></span><strong>Registrar una comida</strong><small>Una foto y dos toques</small><Icon name="arrow" size={18} /></button><div className="water-action"><span className="water-icon"><Icon name="drop" size={21} /></span><div><strong>Un vaso de agua</strong><small>{hydration} de 8 registrados</small></div><button aria-label="Registrar vaso de agua" onClick={() => setHydration((value) => Math.min(value + 1, 8))}><Icon name="plus" size={18} /></button></div></section>
    <section className="checkin-card"><div><span className="mini-icon coral"><Icon name="sparkle" size={16} /></span><p className="eyebrow">Chequeo breve</p><h3>¿Cómo viene tu energía?</h3></div><div className="feeling-options">{['Baja', 'Tranquila', 'Con energía'].map((feeling, index) => <button className={checkIn === feeling ? 'selected' : ''} key={feeling} onClick={() => setCheckIn(feeling)}><span>{['◔', '◡', '◒'][index]}</span>{feeling}</button>)}</div>{checkIn && <p className="checkin-feedback">Registrado. Verónica lo verá en tu próximo resumen.</p>}</section>
    <section className="message-card"><div className="avatar avatar-vero">VT</div><div><p className="eyebrow">De Verónica · hoy</p><p>“Me encantó cómo venís encontrando opciones simples para tus almuerzos.”</p></div><button aria-label="Responder a Verónica"><Icon name="message" size={19} /></button></section>
    <nav className="patient-nav" aria-label="Navegación del paciente"><button className="current"><Icon name="heart" size={18} /><span>Hoy</span></button><button><Icon name="calendar" size={18} /><span>Mi plan</span></button><button className="nav-plus" onClick={openPhoto}><Icon name="camera" size={21} /></button><button><Icon name="trend" size={18} /><span>Mi camino</span></button><button><Icon name="message" size={18} /><span>Mensajes</span></button></nav>
  </main>;
}

function NutritionistDashboard() {
  const [selected, setSelected] = useState(patients[0]);
  const [sent, setSent] = useState(false);
  return <main className="pro-shell"><aside className="pro-sidebar"><div className="pro-brand"><Mark /><div><b>Plan V</b><small>Espacio profesional</small></div></div><nav className="pro-nav"><button className="current"><Icon name="sparkle" size={18} />Centro de ritmo</button><button><Icon name="users" size={18} />Pacientes <span>24</span></button><button><Icon name="calendar" size={18} />Agenda</button><button><Icon name="leaf" size={18} />Planes y recursos</button><button><Icon name="message" size={18} />Mensajes <span className="notification">3</span></button></nav><div className="pro-sidebar-foot"><div className="avatar avatar-vero">VT</div><div><b>Verónica Trenti</b><small>Nutricionista</small></div><Icon name="chevron" size={16} /></div></aside><section className="pro-main"><header className="pro-header"><div><p className="eyebrow">Miércoles, 30 de agosto</p><h1>Centro de ritmo</h1><p>Hoy, tu atención puede hacer la diferencia en <b>3 pacientes.</b></p></div><div className="pro-header-actions"><button className="round-button"><Icon name="bell" size={18} /><b /></button><button className="primary-button"><Icon name="plus" size={17} />Nuevo paciente</button></div></header><section className="overview-grid"><article className="overview-card attention"><span className="overview-icon"><Icon name="heart" size={19} /></span><div><strong>3</strong><p>requieren atención</p></div><small>ver ahora <Icon name="arrow" size={14} /></small></article><article className="overview-card"><span className="overview-icon mint"><Icon name="trend" size={19} /></span><div><strong>81%</strong><p>planes sostenibles</p></div><small className="positive">+6% esta semana</small></article><article className="overview-card"><span className="overview-icon yellow"><Icon name="calendar" size={19} /></span><div><strong>4</strong><p>consultas hoy</p></div><small>primera · 14:30</small></article></section><section className="focus-layout"><div className="priority-panel"><div className="section-heading"><div><p className="eyebrow">Tu ronda de 5 minutos</p><h2>Prioridades de hoy</h2></div><button className="text-button">Ver todos <Icon name="arrow" size={15} /></button></div><div className="priority-list">{patients.map((patient, index) => <button className={`priority-row ${selected.name === patient.name ? 'selected' : ''}`} key={patient.name} onClick={() => { setSelected(patient); setSent(false); }}><span className={`avatar ${patient.tone}`}>{patient.initials}</span><span className="priority-patient"><b>{patient.name}</b><small>{patient.brief?.up_next_title ?? patient.adherence_why}</small></span><span className={`priority-state state-${index}`}>{patient.status}</span><time>{patient.time}</time><Icon name="chevron" size={16} /></button>)}</div></div><aside className="agenda-card"><div className="agenda-head"><span className="mini-icon lilac"><Icon name="video" size={16} /></span><div><p className="eyebrow">Próxima consulta</p><h3>14:30 · Camila D.</h3></div><button aria-label="Abrir agenda"><Icon name="chevron" size={16} /></button></div><p>Revisión de semana 4 · 45 min</p><button className="soft-button"><Icon name="video" size={16} />Abrir preparación</button></aside></section><section className="pro-bottom-grid"><article className="week-card"><div className="section-heading"><div><p className="eyebrow">Panorama general</p><h2>La semana en una mirada</h2></div><button className="filter-button">Esta semana <Icon name="chevron" size={15} /></button></div><div className="week-visual"><div className="chart-axis"><span>Lu</span><span>Ma</span><span>Mi</span><span>Ju</span><span>Vi</span><span>Sa</span><span>Do</span></div><div className="chart-bars">{[48, 62, 56, 73, 67, 52, 70].map((height, index) => <i key={index} style={{ height: `${height}%` }} className={index === 2 ? 'today' : ''} />)}</div></div><div className="week-legend"><span><i /> Regularidad de comidas</span><b>Mejoró un 12%</b></div></article><article className="note-card"><span className="mini-icon coral"><Icon name="sparkle" size={16} /></span><p className="eyebrow">Lectura asistida · {selected.name}</p><h3>{selected.brief?.up_next_title ?? selected.adherence_why}</h3><p>En los últimos 4 días, cambió su rutina nocturna. La foto de cena se cargó tarde y reportó menor energía al día siguiente.</p><div className="suggestion"><Icon name="message" size={16} /><span><b>Sugerencia</b><small>Preguntar por organización nocturna y ofrecer su Plan B.</small></span></div><button className={sent ? 'sent-button' : 'primary-button'} onClick={() => setSent(true)}>{sent ? <><Icon name="check" size={16} />Mensaje preparado</> : <><Icon name="message" size={16} />Preparar mensaje</>}</button><small className="clinical-note">Requiere tu revisión antes de enviar.</small></article></section></section></main>;
}

function ReferenceDashboard() {
  const [selected, setSelected] = useState<PatientSeed>(patients[0]);
  const [sent, setSent] = useState(false);
  const stageIdx = STAGE_RAIL.indexOf(selected.stage);
  const brief = selected.brief;

  return <main className="reference-stage">
    <section className="reference-frame">
      <header className="crm-appbar">
        <div className="crm-product"><span className="grid-dot">⠿</span><Mark /><b>Plan V</b><i /><span>Centro profesional</span></div>
        <div className="crm-tools"><button aria-label="Buscar"><Icon name="clock" size={15} /></button><button aria-label="Tareas"><Icon name="check" size={15} /></button><button aria-label="Crear"><Icon name="plus" size={15} /></button><button aria-label="Notificaciones"><Icon name="bell" size={15} /></button><button className="crm-avatar">VT</button></div>
      </header>

      <div className="crm-body">
        <aside className="crm-menu">
          <div className="crm-menu-heading"><h2>Menú</h2><button><Icon name="arrow" size={14} /></button></div>
          <div className="menu-group"><button><Icon name="heart" size={15} />Inicio</button><button><Icon name="clock" size={15} />Reciente</button><button><Icon name="sparkle" size={15} />Guardado</button></div>
          <p>Mi trabajo</p>
          <div className="menu-group"><button className="menu-current"><Icon name="sparkle" size={15} />Centro de ritmo</button><button><Icon name="trend" size={15} />Seguimiento</button><button><Icon name="calendar" size={15} />Agenda</button></div>
          <p>Pacientes</p>
          <div className="menu-group"><button><Icon name="users" size={15} />Todos</button><button><Icon name="heart" size={15} />Requieren atención</button><button><Icon name="leaf" size={15} />Planes activos</button></div>
          <p>Recursos</p>
          <div className="menu-group"><button><Icon name="message" size={15} />Mensajes</button><button><Icon name="video" size={15} />Videollamadas</button></div>
        </aside>

        <section className="crm-worklist">
          <div className="worklist-head"><h2>Mi seguimiento</h2><div><button aria-label="Actualizar"><Icon name="clock" size={15} /></button><button aria-label="Calendario"><Icon name="calendar" size={15} /></button><button aria-label="Buscar"><Icon name="trend" size={15} /></button></div></div>
          <p className="worklist-label">HOY</p>
          <div className="worklist-scroll">{patients.map((patient) => <button className={`work-person ${selected.id === patient.id ? 'selected' : ''}`} key={patient.id} onClick={() => { setSelected(patient); setSent(false); }}><span className={`crm-avatar person-${patient.tone}`}>{patient.initials}</span><span className="person-copy"><b>{patient.name}</b><small>{patient.brief?.up_next_title ?? patient.adherence_why}</small><em>{patient.status} · {patient.time}</em></span><span className={`person-score score-${scoreBand(patient.adherence_score)}`}>{patient.adherence_score}</span></button>)}</div>
        </section>

        <section className="crm-workspace">
          <div className="crm-commandbar"><button><Icon name="check" size={14} />Guardar</button><button className="command-primary"><Icon name="plus" size={14} />Nuevo registro</button><button><Icon name="heart" size={14} />Plan</button><button><Icon name="clock" size={14} />Actualizar</button><button><Icon name="message" size={14} />Mensaje</button><button className="command-more">•••</button></div>
          <header className="patient-record"><span className={`record-avatar person-${selected.tone}`}>{selected.initials}</span><div className="record-name"><h1>{selected.name}</h1><div><span>Paciente</span><span>Plan flexible</span></div></div><div className="record-meta"><span><small>Objetivo</small>{selected.goal}</span><span><small>Estado</small>{selected.status}</span><span><small>Próxima consulta</small>{selected.appointment?.when ?? '—'}</span><span className="owner"><i>VT</i><small>Profesional</small>Verónica</span></div></header>
          <section className="rhythm-rail"><div className="rail-progress">{RAIL_LABELS.map((label, i) => <i key={label} className={i < stageIdx ? 'rail-done' : i === stageIdx ? 'rail-active' : ''}>{label}</i>)}</div></section>
          <nav className="record-tabs"><button className="active">Resumen</button><button>Comidas y hábitos</button><button>Plan</button><button>Consultas</button></nav>
          <section className="crm-card-grid">
            <article className="crm-card contact-card"><h3>Ficha breve</h3><dl><div><dt>Objetivo actual</dt><dd>{selected.goal}</dd></div><div><dt>Horario sensible</dt><dd>{selected.sensitive_hours}</dd></div><div><dt>Plan B favorito</dt><dd>{selected.plan_b}</dd></div><div><dt>Próximo foco</dt><dd>{selected.next_focus}</dd></div></dl></article>
            <article className="crm-card next-card"><div className="card-heading"><h3>Próximo paso</h3><button><Icon name="clock" size={15} /></button></div>
              {brief ? <>
                <div className="next-sequence">{brief.suggested_action === 'mensaje' ? 'Mensaje · el nutri confirma' : brief.suggested_action === 'ajuste_menu' ? 'Menú · no se reescribe solo' : 'Turno · no se agenda solo'}</div>
                <div className="next-task"><span><Icon name={brief.suggested_action === 'turno' ? 'video' : brief.suggested_action === 'ajuste_menu' ? 'leaf' : 'message'} size={16} /></span><div><b>{brief.up_next_title}</b><small>{selected.pendingReviewCount > 0 ? `${selected.pendingReviewCount} foto${selected.pendingReviewCount > 1 ? 's' : ''} en pending_review` : 'Hoy'}</small></div></div>
                <p>{brief.up_next_body}</p>
                <div className="task-actions"><button className="dark-action" onClick={() => setSent(true)}>{sent ? <><Icon name="check" size={14} />Preparado</> : UP_NEXT_CTA[brief.suggested_action]}</button><button>Marcar luego</button></div>
              </> : <>
                <div className="next-sequence">Sin brief</div>
                <p>Nada accionable hoy. El copiloto no fabrica un Up next.</p>
              </>}
            </article>
            <article className="crm-card score-card"><div className="card-heading"><h3>Adherencia · 7 días</h3><button>•••</button></div><ScoreRing score={selected.adherence_score} label={gaugeLabel(selected.adherence_score)} /><ul>{selected.adherence_why.split('. ').filter(Boolean).map((line) => <li key={line}><i />{line.replace(/\.$/, '')}</li>)}</ul></article>
            <article className="crm-card plan-card"><div className="card-heading"><h3>Plan de hoy</h3><button><Icon name="plus" size={15} /></button></div>{selected.todayPlan.map((row) => <p key={row.slot}><b>{row.slot}</b> · {row.title}</p>)}<button className="subtle-action">Ver alternativas <Icon name="arrow" size={14} /></button></article>
            <article className="crm-card timeline-card"><div className="card-heading"><h3>Línea de tiempo</h3><button><Icon name="plus" size={15} /></button></div><div className="timeline-search"><Icon name="trend" size={13} />Buscar actividad</div>{selected.timeline.map((ev) => <div className="timeline-entry" key={ev.id}><span>{ev.atLabel}</span><p><b>{ev.title}</b><small>{ev.body}</small></p></div>)}</article>
            <article className="crm-card connections-card"><div className="card-heading"><h3>Para la próxima consulta</h3><button><Icon name="video" size={15} /></button></div>{selected.appointment ? <><p className="appointment-time">{selected.appointment.when} <span>{selected.appointment.duration} min</span></p><div className="consultation-note"><Icon name="sparkle" size={15} /><p><b>Prep note</b>{brief?.suggested_action === 'turno' ? brief.up_next_body : 'El modelo no agenda solo. Vero confirma el turno.'}</p></div><button className="subtle-action">Abrir preparación <Icon name="arrow" size={14} /></button></> : <p>Sin turno cargado.</p>}</article>
          </section>
        </section>
      </div>
    </section>
  </main>;
}

function PhotoModal({ close }: { close: () => void }) {
  const [confirmed, setConfirmed] = useState(false);
  if (confirmed) return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="photo-modal photo-success"><button className="modal-close" onClick={close} aria-label="Cerrar">×</button><span><Icon name="check" size={30} /></span><p className="eyebrow">Comida registrada</p><h2>¡Listo, Sofi!</h2><p>Quedó como estimación. Verónica lo revisa cuando corresponda.</p><button className="primary-button" onClick={close}>Volver a mi día</button></div></div>;
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Registrar comida"><div className="photo-modal"><button className="modal-close" onClick={close} aria-label="Cerrar">×</button><div className="modal-camera"><div className="camera-grid" /><span><Icon name="camera" size={28} /></span><p>Tu almuerzo</p></div><p className="eyebrow">Lectura asistida</p><h2>Esto es lo que vemos</h2><p className="modal-description">Pollo, quinoa, vegetales asados y palta. ¿Se parece a tu plato?</p><div className="food-tags"><span>Proteína presente</span><span>Vegetales</span><span>Fibra</span></div><p className="modal-note">Podés ajustar alimentos o porciones antes de guardar. Estimación, pendiente de Verónica. No es una medida exacta.</p><button className="primary-button wide" onClick={() => setConfirmed(true)}><Icon name="check" size={17} />Sí, guardar comida</button><button className="link-button">Ajustar detalles</button></div></div>;
}

export function PlanVExperience() {
  const [view, setView] = useState<'patient' | 'pro'>('patient');
  const [photoOpen, setPhotoOpen] = useState(false);
  return <div className="plan-v-app"><div className="prototype-switch" role="group" aria-label="Cambiar vista de demostración"><span>Vista</span><button onClick={() => setView('patient')} className={view === 'patient' ? 'active' : ''}>Paciente</button><button onClick={() => setView('pro')} className={view === 'pro' ? 'active' : ''}>Nutricionista</button></div>{view === 'patient' ? <PatientHome openPhoto={() => setPhotoOpen(true)} /> : <ReferenceDashboard />}{photoOpen && <PhotoModal close={() => setPhotoOpen(false)} />}</div>;
}
