import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { MealLog } from '../../types';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import { Icon, Mark } from '../shared/Icon';
import { MealReviewPanel } from '../crm/MealReviewPanel';
import { MealLogModal } from '../patient/MealLogModal';
import { buildShowroomPatient, filterShowroomPatients } from './showroom-model';
import { NvBadge, NvButton, NvState } from './primitives';
import { PAGE_LABELS, ShowroomDetail, ShowroomOverview, type ShowroomPage } from './ShowroomPanels';
import { resolveCrmEntry, type CrmEntry } from '../crm/crm-entry';
import { ProfessionalActions } from './ProfessionalActions';
import { MealThumbnail, PatientOverview } from './PatientOverview';
import { NutrigoMessages } from './NutrigoMessages';
import { ShowroomPatientEdit, ShowroomPatients, followFromDirectory } from './ShowroomPatients';
import { ShowroomPatientRecord } from './ShowroomPatientRecord';
import { SelectedPatientContext } from './SelectedPatientContext';
import { ShowroomMeals } from './ShowroomMeals';
import { ShowroomMealPlan } from './ShowroomMealPlan';
import { ShowroomConsultations } from './ShowroomConsultations';
import { ShowroomAgenda } from './ShowroomAgenda';
import { ShowroomGoals } from './ShowroomGoals';
import { ShowroomGrocery } from './ShowroomGrocery';
import { ShowroomProgress } from './ShowroomProgress';
import { ShowroomPatientDiary } from './ShowroomPatientDiary';
import { ShowroomPatientAgenda } from './ShowroomPatientAgenda';
import { ShowroomPatientPlan } from './ShowroomPatientPlan';
import { ShowroomHealthyMenu } from './ShowroomHealthyMenu';
import { AssignedRecipes, RecipeCatalog } from './RecipeCatalog';
import { MealPlanEditor, PublishedDatedPlan } from './MealPlanVersions';
import { ShowroomExercise } from './ShowroomExercise';
import { ShowroomResources } from './ShowroomResources';
import { ShowroomPatientOnboarding } from './ShowroomPatientOnboarding';
import { ShowroomWorkCenter, type WorkCenterModule } from './ShowroomWorkCenter';
import { PATIENT_MORE, PATIENT_SURFACES, PATIENT_TABS, PRO_MORE, PRO_TABS, tabBarState } from './showroom-nav';
import { buildAppHref, hasResourceHash, resolveAppLocation, type AppRole } from './app-location';
import { unreadCount } from './message-receipts';
import { buildConsultAlerts } from './consult-alerts';
import { ConsultAlertStrip, ShowroomConsultAlerts } from './ShowroomConsultAlerts';
import { buildShowroomReminders, reminderPage } from './showroom-reminders';
import { buildCalendarWeek, resolveCalendarMeals, WeeklyPlanCalendar } from './WeeklyPlanCalendar';
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';
import '@fontsource/poppins/latin-800.css';
import './nutrigo.css';
import './patient-dashboard.css';
import './professional-dashboard.css';
import './weekly-plan-calendar.css';
import './clinic-professional.css';
import './app-shell.css';
import './nutrigo-parity.css';
import './nutrigo-fidelity.css';

const OperationalCrm = lazy(() => import('../crm/CrmDashboard').then(({ CrmDashboard }) => ({ default: CrmDashboard })));

const WORK_CENTER_PAGES: WorkCenterModule[] = ['reciente', 'guardado', 'seguimiento', 'paneles', 'videollamadas'];
const isWorkCenterPage = (page: ShowroomPage): page is WorkCenterModule => WORK_CENTER_PAGES.includes(page as WorkCenterModule);

type NutrigoShowroomProps = {
  darkMode: boolean;
  onToggleTheme: () => void;
  lockedRole?: AppRole | null;
  allowRoleSwitch?: boolean;
  onSignOut?: () => void;
};

export function NutrigoShowroom({ darkMode, onToggleTheme, lockedRole = null, allowRoleSwitch = false, onSignOut }: NutrigoShowroomProps) {
  const patients = useAppStore((s) => s.patients);
  const addPatient = useAppStore((s) => s.addPatient);
  const activePatients = filterShowroomPatients(patients);
  const demoSwitch = allowRoleSwitch && !lockedRole;
  const initialLocation = typeof window === 'undefined'
    ? { role: (lockedRole ?? 'patient') as AppRole, page: 'inicio' as ShowroomPage }
    : resolveAppLocation({ pathname: window.location.pathname, hash: window.location.hash, lockedRole });
  const [role, setRole] = useState<AppRole>(initialLocation.role);
  const topbarRef = useRef<HTMLElement>(null);
  const [selectedId, setSelectedId] = useState(activePatients[0]?.id ?? '');
  const [page, setPage] = useState<ShowroomPage>(initialLocation.page);
  const [pendingModule, setPendingModule] = useState('');
  const [query, setQuery] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(() => !lockedRole && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('onboarding') === '1');
  useEffect(() => {
    const header = topbarRef.current;
    if (!header) return;
    const update = () => (header.closest('.nv-app') as HTMLElement | null)?.style.setProperty('--nv-topbar-offset', `${header.getBoundingClientRect().height}px`);
    update(); const observer = new ResizeObserver(update); observer.observe(header);
    return () => observer.disconnect();
  }, [role, onboardingOpen]);
  const [preferredName, setPreferredName] = useState('');
  const [dayIndex, setDayIndex] = useState(-1);
  const [now] = useState(() => new Date());
  const [operation, setOperation] = useState<CrmEntry | null>(null);
  const [entryError, setEntryError] = useState('');
  const [recordEditing, setRecordEditing] = useState(false);
  const [reviewLog, setReviewLog] = useState<MealLog | null>(null);
  const [mealSlot, setMealSlot] = useState<string | null>(null);
  const returnFocus = useRef<HTMLButtonElement>(null);
  const didOpen = useRef(false);
  useEffect(() => {
    const syncLocation = () => {
      const next = resolveAppLocation({ pathname: window.location.pathname, hash: window.location.hash, lockedRole });
      setRole(next.role);
      setPage(next.page);
      if (hasResourceHash(window.location.hash)) {
        setPendingModule('');
        setQuery('');
        setMoreOpen(false);
      }
      const href = buildAppHref(window.location.href, next.role, next.page, { keepHash: next.page === 'recursos' && hasResourceHash(window.location.hash) });
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (next.replace && href !== current) window.history.replaceState(window.history.state, '', href);
    };
    syncLocation();
    window.addEventListener('hashchange', syncLocation);
    window.addEventListener('popstate', syncLocation);
    return () => {
      window.removeEventListener('hashchange', syncLocation);
      window.removeEventListener('popstate', syncLocation);
    };
  }, [lockedRole]);
  useEffect(() => {
    if (operation) { didOpen.current = true; returnFocus.current?.focus(); }
    else if (didOpen.current) document.getElementById('nv-main')?.focus();
  }, [operation]);
  const selected = activePatients.find((p) => p.id === selectedId) ?? activePatients[0];
  const p = selected ? buildShowroomPatient(selected, now) : null;
  useEffect(() => {
    if (lockedRole !== 'patient' || !selected?.id) return;
    const controller = new AbortController();
    api.getIntake(selected.id, { signal: controller.signal }).then((result) => {
      if (!controller.signal.aborted && result.intake.status === 'draft') setOnboardingOpen(true);
    }).catch(() => {
      // El ingreso tiene recuperación explícita: un fallo no debe ocultarlo al paciente.
      if (!controller.signal.aborted) setOnboardingOpen(true);
    });
    return () => controller.abort();
  }, [lockedRole, selected?.id]);
  const markResourceRead = useCallback(async (resourceId: string) => {
    if (!selected?.id) return;
    const { patient } = await api.markResourceRead(selected.id, resourceId);
    addPatient(patient);
  }, [addPatient, selected?.id]);
  const navigate = (target: ShowroomPage) => {
    if (typeof window !== 'undefined') {
      const href = buildAppHref(window.location.href, role, target);
      window.history.pushState({ ...window.history.state, planVPage: target }, '', href);
    }
    setPage(target); setPendingModule(''); setQuery(''); setMoreOpen(false); setRecordEditing(false); setMealSlot(null);
  };
  const switchRole = (target: AppRole) => {
    if (!demoSwitch) return;
    setRole(target);
    setDayIndex(-1);
    if (typeof window !== 'undefined') {
      window.history.pushState({ planVPage: 'inicio' }, '', buildAppHref(window.location.href, target, 'inicio'));
    }
    setPage('inicio'); setPendingModule(''); setQuery(''); setMoreOpen(false); setRecordEditing(false); setMealSlot(null);
  };
  const pickPatient = (id: string) => { setSelectedId(id); setDayIndex(-1); navigate('inicio'); };
  const currentDay = buildCalendarWeek(now)[dayIndex];
  const meals = p ? resolveCalendarMeals(p, now, dayIndex) : [];
  const pageTitle = pendingModule || (page === 'inicio' ? role === 'patient' ? `Hola, ${preferredName || p?.name.split(' ')[0] || 'bienvenida'}` : 'Mi consultorio' : PAGE_LABELS[page]);
  const tabs = role === 'patient' ? PATIENT_TABS : PRO_TABS;
  const moreItems = role === 'patient' ? PATIENT_MORE : PRO_MORE;
  const { moreCurrent } = tabBarState(page, tabs, moreItems);
  const showHeading = page === 'inicio' || page === 'pacientes';
  const messageUnread = role === 'patient' && p
    ? unreadCount(p.messages, 'patient')
    : role === 'pro'
      ? activePatients.reduce((sum, person) => sum + unreadCount(person.messages.filter((message) => message.patient_id === person.id && Boolean(message.sent_at)), 'pro'), 0)
      : 0;
  const consultAlerts = role === 'patient' && selected
    ? buildConsultAlerts([selected], now)
    : role === 'pro'
      ? buildConsultAlerts(activePatients, now)
      : [];
  const alertAudience = role === 'patient' ? 'patient' : 'pro';
  const habitReminders = p ? buildShowroomReminders(p, now) : [];
  const nextHabitReminder = habitReminders.find((reminder) => reminder.state !== 'done' && reminder.kind !== 'consulta') ?? null;
  const openReminder = (reminder: (typeof habitReminders)[number]) => navigate(reminderPage(reminder.kind));
  const rescheduleAppointment = async (day: string, time: string) => {
    if (!selected) return;
    const result = await api.rescheduleAppointment(selected.id, { day, time });
    addPatient(result.patient);
  };
  const confirmAppointment = async (reply: 'attending' | 'needs_change') => {
    if (!selected) return;
    const result = await api.confirmAppointment(selected.id, reply);
    addPatient(result.patient);
  };
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMoreOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  const openOperation = (target: CrmEntry) => {
    if (target.module === 'pacientes') { navigate('pacientes'); return; }
    if (target.module === 'fichas' && target.tab === 'comidas') { setSelectedId(target.patientId); navigate('diario'); return; }
    if (target.module === 'fichas' && target.tab === 'plan') { setSelectedId(target.patientId); navigate('plan'); return; }
    if (target.module === 'fichas' && target.tab === 'consultas') { setSelectedId(target.patientId); navigate('consultas'); return; }
    if (target.module === 'fichas' && (!target.tab || target.tab === 'resumen')) { setSelectedId(target.patientId); navigate('ficha'); return; }
    if (target.module === 'objetivos') { setSelectedId(target.patientId); navigate('objetivos'); return; }
    if (target.module === 'seguimiento') { setSelectedId(target.patientId); navigate('seguimiento'); return; }
    if (target.module === 'agenda') { setSelectedId(target.patientId); navigate('agenda'); return; }
    const entry = resolveCrmEntry(patients, target);
    if (!entry) { setEntryError('Este paciente ya no está activo. Elegí otro paciente.'); return; }
    setEntryError('');
    setMoreOpen(false);
    setOperation(entry);
  };

  const closeOnboarding = (next?: ShowroomPage) => {
    setOnboardingOpen(false);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (url.searchParams.has('onboarding')) {
        url.searchParams.delete('onboarding');
        window.history.replaceState(window.history.state, '', url);
      }
    }
    if (next) navigate(next);
  };

  if (operation) return <div className={`plan-v-app${darkMode ? ' dark' : ''}`}>
    <header className="nv-operation-bar">
      <button type="button" ref={returnFocus} onClick={() => setOperation(null)}>← Volver al consultorio</button>
      <span>Herramienta operativa · datos demo · se conserva la paciente seleccionada</span>
    </header>
    <Suspense fallback={<div role="status" className="loading-card">Cargando CRM…</div>}>
      <OperationalCrm initialEntry={operation} darkMode={darkMode} onToggleTheme={onToggleTheme} />
    </Suspense>
  </div>;

  if (onboardingOpen && p) return <div className={`nv-app nv-patient nv-onboarding${darkMode ? ' nv-dark' : ''}`}>
    <ShowroomPatientOnboarding
      key={p.id}
      patient={p}
      darkMode={darkMode}
      onToggleTheme={onToggleTheme}
      onExit={() => closeOnboarding()}
      onFinished={(next, result) => {
        setPreferredName(result.preferredName);
        closeOnboarding(next);
      }}
    />
  </div>;

  return <div className={`nv-app${role === 'patient' ? ' nv-patient' : ' nv-pro'}${darkMode ? ' nv-dark' : ''}${page === 'mensajes' ? ' nv-messaging' : ''}${page === 'ficha' ? ' nv-record' : ''}${page === 'diario' && role === 'pro' ? ' nv-food-diary' : ''}${page === 'plan' && role === 'pro' ? ' nv-meal-plan' : ''}${page === 'consultas' && role === 'pro' ? ' nv-consultation-page' : ''}${page === 'agenda' && role === 'pro' ? ' nv-agenda-page' : ''}${page === 'objetivos' && role === 'pro' ? ' nv-goals-page' : ''}${isWorkCenterPage(page) && role === 'pro' ? ' nv-work-center-page' : ''}${page === 'compras' && role === 'patient' ? ' nv-grocery-page' : ''}${page === 'progreso' ? ' nv-progress-page' : ''}${page === 'diario' && role === 'patient' ? ' nv-patient-diary' : ''}${page === 'plan' && role === 'patient' ? ' nv-patient-plan' : ''}${page === 'agenda' && role === 'patient' ? ' nv-patient-agenda' : ''}${page === 'recetas' && role === 'patient' ? ' nv-healthy-menu' : ''}${page === 'ejercicio' ? ' nv-exercise-page' : ''}${page === 'recursos' && role === 'patient' ? ' nv-resources-page' : ''}`}>
    <a className="nv-skip" href="#nv-main">Ir al contenido</a>
    <aside className="nv-sidebar" aria-label={role === 'patient' ? 'Tu espacio' : 'Consultorio'}>
      <a className="nv-brand" href={buildAppHref(typeof window === 'undefined' ? 'https://plan.v/app/inicio' : window.location.href, role, 'inicio')} onClick={(event) => { event.preventDefault(); navigate('inicio'); }}><Mark /><span>Plan V<small>Mi espacio</small></span></a>
      <span className="nv-nav-group">{role === 'patient' ? 'Mi app' : 'Mi consultorio'}</span>
      <nav>{(role === 'patient' ? PATIENT_SURFACES : [...PRO_TABS, ...PRO_MORE]).map((item) => <button type="button" key={item.id} aria-current={!pendingModule && page === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}><Icon name={item.icon} size={18} />{item.label}{item.id === 'mensajes' && messageUnread > 0 && <small>{messageUnread > 9 ? '9+' : messageUnread}</small>}</button>)}</nav>
      {!lockedRole && role === 'patient' && <><span className="nv-nav-group">Consultorio</span>
      <nav><button type="button" onClick={() => setOnboardingOpen(true)}><Icon name="sparkle" size={18} />Ingreso</button></nav></>}
    </aside>
    <div className="nv-workspace">
      <header className="nv-topbar" ref={topbarRef}>
        <a className="nv-brand" href={buildAppHref(typeof window === 'undefined' ? 'https://plan.v/app/inicio' : window.location.href, role, 'inicio')} onClick={(event) => { event.preventDefault(); navigate('inicio'); }}><Mark /><span>Plan V</span></a>
        <span className="nv-topbar-title">{PAGE_LABELS[page]}</span>
        {demoSwitch ? (
          <div className="nv-role-switch" aria-label="Cambiar de rol"><button type="button" aria-pressed={role === 'patient'} onClick={() => switchRole('patient')}>Paciente</button><button type="button" aria-pressed={role === 'pro'} onClick={() => switchRole('pro')}>Nutricionista</button></div>
        ) : (
          <span className="nv-role-badge">{role === 'pro' ? 'Consultorio' : 'Mi espacio'}</span>
        )}
<ShowroomConsultAlerts key={alertAudience} audience={alertAudience} alerts={consultAlerts} reminders={habitReminders} patientId={selected?.id} onOpen={(alert) => { if (role === 'pro') setSelectedId(alert.patientId); navigate('agenda'); }} onManage={role === 'pro' ? (alert) => { setSelectedId(alert.patientId); navigate('consultas'); } : undefined} onOpenReminder={openReminder} onOpenCare={(notice) => { if (role === 'pro') setSelectedId(notice.patient_id); navigate(notice.target); }} />
        <NvButton className="nv-ghost nv-theme" aria-label={darkMode ? 'Usar tema claro' : 'Usar tema oscuro'} onClick={onToggleTheme}><Icon name={darkMode ? 'sun' : 'moon'} size={19} /></NvButton>
        {onSignOut && <NvButton className="nv-ghost" onClick={() => onSignOut()}>Salir</NvButton>}
      </header>
      <div className="nv-content-layout">
        <main id="nv-main" tabIndex={-1} className="nv-main">
          {role === 'pro' && selected && ['diario','plan','consultas','objetivos','progreso'].includes(page) && <SelectedPatientContext patient={selected} onRecord={() => navigate('ficha')} />}
          {entryError && <p role="alert">{entryError}</p>}
          {page === 'inicio' && <ConsultAlertStrip audience={alertAudience} alerts={consultAlerts} reminder={nextHabitReminder} onOpen={(alert) => { if (role === 'pro') setSelectedId(alert.patientId); navigate('agenda'); }} onOpenReminder={openReminder} />}
          {(showHeading || (['pacientes', 'plan', 'diario', 'recetas', 'recursos'].includes(page) && !pendingModule)) ? (
          <div className="nv-page-head">
            {showHeading && <div><h1>{pageTitle}<span className="nv-title-dot">.</span></h1>{page === 'inicio' && <p>{role === 'patient' ? 'Tu acompañamiento nutricional, con datos que ya están publicados.' : 'Agenda, revisión y seguimiento de cada paciente, sin perder el contexto.'}</p>}</div>}
            {role === 'patient' && page === 'inicio' && <form className="nv-search np-dashboard-search" onSubmit={(e) => { e.preventDefault(); navigate('plan'); }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
              <input type="search" aria-label="Buscar en mi plan" placeholder="Buscar en mi plan…" value={query} onChange={(e) => setQuery(e.target.value)} />
              <button type="submit" aria-label="Buscar comidas en mi plan"><Icon name="arrow" size={16} /></button>
            </form>}
            {['pacientes', 'plan', 'diario', 'recetas', 'recursos'].includes(page) && !pendingModule && <label className="nv-search"><Icon name="list" size={16} /><input type="search" aria-label={page === 'pacientes' ? 'Buscar pacientes' : page === 'recetas' ? 'Buscar preparaciones' : page === 'recursos' ? 'Buscar recursos y guardados' : 'Buscar comidas'} placeholder={page === 'pacientes' ? 'Buscar pacientes…' : page === 'recetas' ? 'Buscar preparaciones…' : page === 'recursos' ? 'Buscar recursos y guardados…' : 'Buscar comidas…'} value={query} onChange={(e) => setQuery(e.target.value)} /></label>}
          </div>
          ) : null}
          {page === 'mensajes' && p ? <NutrigoMessages patient={p} patients={role === 'pro' ? activePatients.map((person) => buildShowroomPatient(person, now)) : [p]} role={role} onSelect={(id) => { setSelectedId(id); setDayIndex(-1); }} onNavigate={navigate} /> : <>
          {role === 'pro' && !['ficha', 'diario', 'plan', 'consultas', 'agenda', 'objetivos', 'progreso', 'ejercicio'].includes(page) && !isWorkCenterPage(page) && <ProfessionalActions patients={patients} selectedId={selected?.id ?? ''} onSelect={pickPatient} onOpen={openOperation} showMetrics={page === 'inicio'} />}
{!p ? <NvState title="Sin pacientes activos" description="Agregá o restaurá un paciente desde la aplicación actual." /> : pendingModule ? <NvState title={`${pendingModule} · diseño pendiente`} description="El módulo actual sigue disponible en la aplicación. Esta vista todavía no lo reemplaza." /> : page === 'ficha' && role === 'pro' ? <ShowroomPatientRecord patient={selected!} patients={activePatients} onSelect={(id) => { setSelectedId(id); setDayIndex(-1); }} onEdit={() => setRecordEditing(true)} onOpen={openOperation} /> : page === 'diario' && role === 'pro' ? <ShowroomMeals patient={selected!} patients={activePatients} query={query} onSelect={(id) => { setSelectedId(id); setDayIndex(-1); }} onReview={setReviewLog} /> : page === 'diario' && role === 'patient' ? <ShowroomPatientDiary patient={p} patientId={p.id} query={query} now={now} onLogMeal={(slot = 'Almuerzo') => setMealSlot(slot)} /> : page === 'recetas' && role === 'patient' ? <><ShowroomHealthyMenu patient={p} query={query} onNavigate={navigate} /><AssignedRecipes patientId={p.id} query={query} /></> : page === 'recursos' && role === 'patient' ? <ShowroomResources patientId={p.id} query={query} assignments={selected?.resource_assignments} onNavigate={navigate} onMarkRead={markResourceRead} /> : page === 'plan' && role === 'pro' ? <><ShowroomMealPlan patient={selected!} patients={activePatients} query={query} onSelect={(id) => { setSelectedId(id); setDayIndex(-1); }} onChanged={addPatient} /><RecipeCatalog patientId={selected!.id} /><MealPlanEditor patientId={selected!.id} /></> : page === 'plan' && role === 'patient' ? <><ShowroomPatientPlan patient={p} now={now} query={query} onShopping={() => navigate('compras')} /><PublishedDatedPlan patientId={p.id} query={query} /></> : page === 'consultas' && role === 'pro' ? <ShowroomConsultations patient={selected!} patients={activePatients} now={now} onSelect={(id) => { setSelectedId(id); setDayIndex(-1); }} onChanged={addPatient} /> : page === 'agenda' && role === 'pro' ? <ShowroomAgenda patients={activePatients} now={now} focusPatient={selected} onManage={(id) => { setSelectedId(id); navigate('consultas'); }} onNavigatePatient={(id, target) => { setSelectedId(id); navigate(target === 'consultas' ? 'consultas' : target); }} /> : isWorkCenterPage(page) && role === 'pro' ? <ShowroomWorkCenter module={page} patients={activePatients} now={now} onOpenPatient={(id) => { setSelectedId(id); navigate('ficha'); }} onOpenMeals={(id) => { setSelectedId(id); navigate('diario'); }} onOpenConsultations={(id) => { setSelectedId(id); navigate('consultas'); }} /> : page === 'objetivos' && role === 'pro' ? <ShowroomGoals patient={selected!} patients={activePatients} onSelect={(id) => { setSelectedId(id); setDayIndex(-1); }} onChanged={addPatient} onOpenPatient={(id) => { setSelectedId(id); navigate('ficha'); }} /> : page === 'pacientes' ? <ShowroomPatients patients={patients} query={query} onChanged={addPatient} onFollow={(id) => openOperation(followFromDirectory(id))} /> : page === 'inicio' ? <>{role === 'pro' && <div className="nv-context-banner"><span><Icon name="users" size={18} /> Seguimiento de <strong>{p.name}</strong></span><NvButton className="nv-ghost" onClick={() => navigate('pacientes')}>Ver pacientes <Icon name="arrow" size={16} /></NvButton></div>}{role === 'patient' ? <PatientOverview patient={p} onNavigate={navigate} /> : <ShowroomOverview patient={p} onNavigate={navigate} />}</> : page === 'progreso' ? <ShowroomProgress patient={p} professional={role === 'pro'} /> : page === 'ejercicio' ? <ShowroomExercise patient={p} now={now} professional={role === 'pro'} /> : page === 'compras' && role === 'patient' ? <ShowroomGrocery patient={p} /> : page === 'agenda' && role === 'patient' ? <ShowroomPatientAgenda patient={p} now={now} onMessage={() => navigate('mensajes')} onNavigate={navigate} onReschedule={rescheduleAppointment} onConfirm={confirmAppointment} /> : <ShowroomDetail page={page} patient={p} query={query} />}
          </>}
        </main>
        {p && page !== 'mensajes' && page !== 'ficha' && page !== 'compras' && page !== 'progreso' && page !== 'diario' && page !== 'plan' && page !== 'agenda' && page !== 'recetas' && page !== 'ejercicio' && page !== 'recursos' && page !== 'pacientes' && !(role === 'pro' && (page === 'consultas' || page === 'objetivos' || isWorkCenterPage(page))) && <aside className="nv-daily" aria-label={role === 'pro' ? 'Mi seguimiento' : 'Mi día'}>
          <div className="nv-person"><span className="nv-avatar">{role === 'pro' ? 'VT' : p.initials}</span><div><strong>{role === 'pro' ? 'Verónica Trenti' : p.name}</strong><small>{role === 'pro' ? 'Nutricionista' : 'Mi plan de acompañamiento'}</small></div><Icon name="leaf" size={18} /></div>
          {role === 'pro' && <section className="nv-worklist"><header><h2>Mi seguimiento</h2><NvBadge>{activePatients.length}</NvBadge></header>{activePatients.map((person) => <button type="button" key={person.id} aria-pressed={p.id === person.id} onClick={() => pickPatient(person.id)}><span className="nv-avatar">{person.initials}</span><span><strong>{person.name}</strong><small>{person.status}</small></span><b>{person.adherence_score}%</b></button>)}</section>}
          <WeeklyPlanCalendar now={now} selectedIndex={dayIndex} onSelect={setDayIndex} />
          <header className="nv-daily-heading" aria-live="polite"><h2>{currentDay ? `${currentDay.day} ${currentDay.date.getDate()}` : role === 'pro' ? 'Menú del paciente · hoy' : 'Tu menú de hoy'}</h2><Icon name="list" size={17} /></header>
          <p className="nw-plan-note">{currentDay && !currentDay.isToday ? 'Indicaciones del plan semanal para este día. No es un historial por fecha.' : role === 'pro' ? 'Indicaciones de hoy para este paciente.' : 'Tus indicaciones para hoy.'}</p>
          <div className="nv-agenda-meals">{meals.map((meal, i) => <button type="button" key={meal.slot} onClick={() => navigate('plan')}><span className="nv-meal-meta"><NvBadge tone={i % 2 ? 'gold' : 'green'}>{meal.slot}</NvBadge><small>{meal.time}</small></span><span className="nv-meal-body"><MealThumbnail slot={meal.slot} /><strong>{meal.title}</strong><Icon name="chevron" size={15} /></span></button>)}</div>
          {meals.length > 0 && <p className="np-data-note">Imágenes ilustrativas de Plan V.</p>}
          {!meals.length && <p className="nv-caption">Todavía no hay comidas asignadas.</p>}
          <div className="nv-next-visit"><span className="nv-icon-tile"><Icon name="calendar" /></span><small>PRÓXIMA CONSULTA</small><strong>{p.appointment?.when ?? 'Por coordinar'}</strong><NvButton className="nv-ghost" onClick={() => navigate('agenda')}>Ver consulta <Icon name="arrow" size={15} /></NvButton></div>
        </aside>}
      </div>
    </div>
    <nav className="nv-tabbar" aria-label="Secciones principales">
      {tabs.map((tab) => <button key={tab.id} type="button" aria-current={!pendingModule && page === tab.id ? 'page' : undefined} onClick={() => navigate(tab.id)}><span className="nv-tab-icon"><Icon name={tab.icon} size={22} />{tab.id === 'mensajes' && messageUnread > 0 && <b className="nv-tab-unread" aria-label={`${messageUnread} sin leer`}>{messageUnread > 9 ? '9+' : messageUnread}</b>}</span><span>{tab.label}</span></button>)}
      <button type="button" aria-current={moreCurrent ? 'page' : undefined} aria-expanded={moreOpen} aria-controls="nv-more-sheet" onClick={() => setMoreOpen(true)}><span className="nv-tab-icon"><Icon name="grid" size={22} />{role === 'pro' && messageUnread > 0 && <b className="nv-tab-unread" aria-label={`${messageUnread} sin leer`}>{messageUnread > 9 ? '9+' : messageUnread}</b>}</span><span>Más</span></button>
    </nav>
    {moreOpen && <div className="nv-more" role="presentation" onClick={() => setMoreOpen(false)}>
      <div className="nv-more-sheet" id="nv-more-sheet" role="dialog" aria-modal="true" aria-labelledby="nv-more-title" onClick={(event) => event.stopPropagation()}>
        <h2 id="nv-more-title">{role === 'patient' ? 'Tu espacio' : 'Más secciones'}</h2>
        <div className="nv-more-grid">{moreItems.map((item) => <button type="button" key={item.id} aria-current={page === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}><Icon name={item.icon} size={20} /><span>{item.label}</span></button>)}{role === 'patient' && !lockedRole && <button type="button" onClick={() => { setMoreOpen(false); setOnboardingOpen(true); }}><Icon name="sparkle" size={20} /><span>Ingreso</span></button>}</div>
      </div>
    </div>}
    {recordEditing && selected && <ShowroomPatientEdit patient={selected} onClose={() => setRecordEditing(false)} onSaved={(updated) => { addPatient(updated); setRecordEditing(false); }} />}
    {reviewLog && selected && <div className="modal-backdrop review-backdrop"><MealReviewPanel patient={selected} log={reviewLog} onClose={() => setReviewLog(null)} /></div>}
    {mealSlot && selected && role === 'patient' && <MealLogModal key={`${selected.id}:${mealSlot}`} patient={selected} defaultSlot={mealSlot} close={() => setMealSlot(null)} />}
  </div>;
}
