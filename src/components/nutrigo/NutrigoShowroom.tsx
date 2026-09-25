import { useCallback, useEffect, useRef, useState } from 'react';
import type { MealLog } from '../../types';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import { Icon, Mark } from '../shared/Icon';
import { MealReviewPanel } from '../crm/MealReviewPanel';
import { MealLogModal } from '../patient/MealLogModal';
import { buildShowroomPatient, filterShowroomPatients } from './showroom-model';
import { NvBadge, NvButton, NvState } from './primitives';
import { PAGE_LABELS, ShowroomDetail, type ShowroomPage } from './ShowroomPanels';
import type { CrmEntry } from '../crm/crm-entry';
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
import { ShowroomExercise } from './ShowroomExercise';
import { ShowroomResources } from './ShowroomResources';
import { ShowroomPatientOnboarding } from './ShowroomPatientOnboarding';
import { ShowroomWorkCenter, type WorkCenterModule } from './ShowroomWorkCenter';
import { PATIENT_MORE, PATIENT_SURFACES, PATIENT_TABS, PLAN_SUBPAGES, PRO_MORE, PRO_SURFACES, PRO_TABS, tabBarState } from './showroom-nav';
import { buildAppHref, hasResourceHash, resolveAppLocation, type AppRole } from './app-location';
import { unreadCount } from './message-receipts';
import { buildConsultAlerts } from './consult-alerts';
import { ConsultAlertStrip, ShowroomConsultAlerts } from './ShowroomConsultAlerts';
import { buildShowroomReminders, reminderPage } from './showroom-reminders';
import { buildCalendarWeek, resolveCalendarMeals, WeeklyPlanCalendar } from './WeeklyPlanCalendar';
import { activityWhen, buildRecentActivity } from './recent-activity';
import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-500.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-700.css';
import './nutrigo.css';
import './patient-dashboard.css';
import './professional-dashboard.css';
import './weekly-plan-calendar.css';
import './clinic-professional.css';
import './app-shell.css';
import './nutrigo-parity.css';
import './nutrigo-fidelity.css';
import './shell-fig.css';
import './figma-mobile-dashboard.css';
import { NV_ICONS, NvIcon, type NvIconName } from './NvIcon';
import { CaretDown, CaretUp } from '@phosphor-icons/react';
import figmaListIcon from '../../assets/figma-mobile/navbar-imgIconList.svg';


const WORK_CENTER_PAGES: WorkCenterModule[] = ['reciente', 'guardado', 'seguimiento', 'paneles', 'videollamadas'];
const isWorkCenterPage = (page: ShowroomPage): page is WorkCenterModule => WORK_CENTER_PAGES.includes(page as WorkCenterModule);
const MOBILE_PAGE_LABELS: Partial<Record<ShowroomPage, string>> = {
  plan: 'Plan',
  diario: 'Diario',
  seguimiento: 'Seguimiento',
  videollamadas: 'Video',
  recetas: 'Menú',
  compras: 'Compras',
};

type NutrigoShowroomProps = {
  darkMode: boolean;
  onToggleTheme: () => void;
  lockedRole?: AppRole | null;
  allowRoleSwitch?: boolean;
  onSignOut?: () => void;
  userName?: string;
};

export function NutrigoShowroom({ darkMode, onToggleTheme, lockedRole = null, allowRoleSwitch = false, onSignOut, userName }: NutrigoShowroomProps) {
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
  const [planOpen, setPlanOpen] = useState<boolean | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  // Cajón de navegación móvil: el archivo abre el menú desde la barra superior.
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
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
  const [recordEditing, setRecordEditing] = useState(false);
  const [reviewLog, setReviewLog] = useState<MealLog | null>(null);
  const [mealSlot, setMealSlot] = useState<string | null>(null);
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
    setPage(target); setPendingModule(''); setQuery(''); setMoreOpen(false); setMenuOpen(false); setRecordEditing(false); setMealSlot(null);
  };
  const switchRole = (target: AppRole) => {
    if (!demoSwitch) return;
    setRole(target);
    setDayIndex(-1);
    if (typeof window !== 'undefined') {
      window.history.pushState({ planVPage: 'inicio' }, '', buildAppHref(window.location.href, target, 'inicio'));
    }
    setPage('inicio'); setPendingModule(''); setQuery(''); setMoreOpen(false); setMenuOpen(false); setRecordEditing(false); setMealSlot(null);
  };
  const pickPatient = (id: string) => { setSelectedId(id); setDayIndex(-1); navigate('inicio'); };
  const currentDay = buildCalendarWeek(now)[dayIndex];
  const meals = p ? resolveCalendarMeals(p, now, dayIndex) : [];
  const pageTitle = pendingModule || (page === 'inicio' ? role === 'patient' ? `Hola, ${preferredName || p?.name.split(' ')[0] || 'bienvenida'}` : p?.name.split(' ')[0] ?? 'Inicio' : PAGE_LABELS[page]);
  const tabs = role === 'patient' ? PATIENT_TABS : PRO_TABS;
  const moreItems = role === 'patient' ? PATIENT_MORE : PRO_MORE;
  const { moreCurrent } = tabBarState(page, tabs, moreItems);
  const showHeading = page === 'inicio';
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
  useEffect(() => {
    if (!menuOpen) return;
    drawerRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const openOperation = (target: CrmEntry) => {
    if (target.module === 'pacientes') { navigate('pacientes'); return; }
    if (target.module === 'fichas' && target.tab === 'comidas') { setSelectedId(target.patientId); navigate('diario'); return; }
    if (target.module === 'fichas' && target.tab === 'plan') { setSelectedId(target.patientId); navigate('plan'); return; }
    if (target.module === 'fichas' && target.tab === 'consultas') { setSelectedId(target.patientId); navigate('consultas'); return; }
    if (target.module === 'fichas' && (!target.tab || target.tab === 'resumen')) { setSelectedId(target.patientId); navigate('ficha'); return; }
    if (target.module === 'objetivos') { setSelectedId(target.patientId); navigate('objetivos'); return; }
    if (target.module === 'seguimiento') { setSelectedId(target.patientId); navigate('seguimiento'); return; }
    if (target.module === 'agenda') { setSelectedId(target.patientId); navigate('agenda'); return; }
    if (target.module === 'reciente' || target.module === 'guardado' || target.module === 'paneles' || target.module === 'videollamadas') { navigate(target.module); return; }
    if (target.patientId) setSelectedId(target.patientId);
    navigate('inicio');
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

  const surfaces = role === 'patient' ? PATIENT_SURFACES : PRO_SURFACES;
  const planGroupOpen = planOpen ?? (page === 'plan' || page === 'compras');
  const displayName = role === 'pro' ? userName || 'Verónica Trenti' : p?.name ?? 'Paciente';
  const userInitials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join('');
  const navButton = (item: (typeof surfaces)[number]) => <button type="button" key={item.id} aria-current={!pendingModule && page === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}>{item.id in NV_ICONS ? <NvIcon name={item.id as NvIconName} size={20} /> : item.id === 'recetas' ? <NvIcon name="menu" size={20} /> : <Icon name={item.icon} size={20} />}{item.label}{item.id === 'mensajes' && messageUnread > 0 && <small>{messageUnread > 9 ? '9+' : messageUnread}</small>}</button>;

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

  return <div className={`nv-app${page === 'inicio' ? ' nv-home' : ''}${role === 'patient' ? ' nv-patient' : ' nv-pro'}${darkMode ? ' nv-dark' : ''}${menuOpen ? ' nv-menu-open' : ''}${page === 'mensajes' ? ' nv-messaging' : ''}${page === 'ficha' ? ' nv-record' : ''}${page === 'diario' && role === 'pro' ? ' nv-food-diary' : ''}${page === 'plan' && role === 'pro' ? ' nv-meal-plan' : ''}${page === 'consultas' && role === 'pro' ? ' nv-consultation-page' : ''}${page === 'agenda' && role === 'pro' ? ' nv-agenda-page' : ''}${page === 'objetivos' && role === 'pro' ? ' nv-goals-page' : ''}${isWorkCenterPage(page) && role === 'pro' ? ' nv-work-center-page' : ''}${page === 'compras' ? ' nv-grocery-page' : ''}${page === 'progreso' ? ' nv-progress-page' : ''}${page === 'diario' && role === 'patient' ? ' nv-patient-diary' : ''}${page === 'plan' && role === 'patient' ? ' nv-patient-plan' : ''}${page === 'agenda' && role === 'patient' ? ' nv-patient-agenda' : ''}${page === 'recetas' ? ' nv-healthy-menu' : ''}${page === 'ejercicio' ? ' nv-exercise-page' : ''}${page === 'recursos' ? ' nv-resources-page' : ''}`}>
    <a className="nv-skip" href="#nv-main">Ir al contenido</a>
    <aside className="nv-sidebar" id="nv-drawer" ref={drawerRef} tabIndex={-1} aria-label={role === 'patient' ? 'Tu espacio' : 'Consultorio'}>
      <a className="nv-brand" href={buildAppHref(typeof window === 'undefined' ? 'https://plan.v/app/inicio' : window.location.href, role, 'inicio')} onClick={(event) => { event.preventDefault(); navigate('inicio'); }}><Mark /><span>Plan V<small>Mi espacio</small></span></a>
      <nav>{surfaces.filter((item) => item.id !== 'compras').map((item) => item.id === 'plan' ? <div key="plan" className={`nv-nav-sub${planGroupOpen ? ' nv-open' : ''}`}>
        <button type="button" className="nv-nav-sub-head" aria-expanded={planGroupOpen} onClick={() => setPlanOpen(!planGroupOpen)}><NvIcon name="plan" size={20} /><span>{item.label}</span>{planGroupOpen ? <CaretUp size={14} aria-hidden="true" /> : <CaretDown size={14} aria-hidden="true" />}</button>
        {planGroupOpen && <div className="nv-nav-sub-items">{PLAN_SUBPAGES.map((sub) => <button type="button" key={sub.id} aria-current={!pendingModule && page === sub.id ? 'page' : undefined} onClick={() => navigate(sub.id)}>{sub.label}</button>)}</div>}
      </div> : navButton(item))}</nav>
      {!lockedRole && role === 'patient' && <><span className="nv-nav-group">Consultorio</span>
      <nav><button type="button" onClick={() => setOnboardingOpen(true)}><NvIcon name="ingreso" size={20} />Ingreso</button></nav></>}
      {onSignOut && <button type="button" className="nv-logout" onClick={() => onSignOut()}><NvIcon name="salir" size={20} />Cerrar sesión</button>}
      <div className="nv-mobile-tools" aria-label="Cuenta y avisos">
        <ShowroomConsultAlerts key={`drawer:${alertAudience}`} audience={alertAudience} alerts={consultAlerts} reminders={habitReminders} patientId={selected?.id} onOpen={(alert) => { if (role === 'pro') setSelectedId(alert.patientId); navigate('agenda'); }} onManage={role === 'pro' ? (alert) => { setSelectedId(alert.patientId); navigate('consultas'); } : undefined} onOpenReminder={openReminder} onOpenCare={(notice) => { if (role === 'pro') setSelectedId(notice.patient_id); navigate(notice.target); }} />
        <span className="nv-mobile-account-name">{displayName}</span>
        {demoSwitch && <div className="nv-role-switch" aria-label="Cambiar de rol"><button type="button" aria-pressed={role === 'patient'} onClick={() => switchRole('patient')}>Paciente</button><button type="button" aria-pressed={role === 'pro'} onClick={() => switchRole('pro')}>Nutricionista</button></div>}
        <button type="button" className="nv-mobile-theme" onClick={onToggleTheme}><Icon name={darkMode ? 'sun' : 'moon'} size={18} />{darkMode ? 'Tema claro' : 'Tema oscuro'}</button>
      </div>
    </aside>
    <div className="nv-workspace">
      <header className="nv-topbar" ref={topbarRef}>
        <a className="nv-brand" href={buildAppHref(typeof window === 'undefined' ? 'https://plan.v/app/inicio' : window.location.href, role, 'inicio')} onClick={(event) => { event.preventDefault(); navigate('inicio'); }}><Mark /><span className="nv-figma-bowl" aria-hidden="true"><i /><i /></span><span>Plan V</span></a>
        <h1 className="nv-topbar-title" aria-label={PAGE_LABELS[page]}>
          <span className="nv-topbar-label-desktop">{PAGE_LABELS[page]}</span>
          <span className="nv-topbar-label-mobile" aria-hidden="true">{MOBILE_PAGE_LABELS[page] ?? PAGE_LABELS[page]}</span>
        </h1>
        <div className="nv-header-menu">
          <ShowroomConsultAlerts key={alertAudience} audience={alertAudience} alerts={consultAlerts} reminders={habitReminders} patientId={selected?.id} onOpen={(alert) => { if (role === 'pro') setSelectedId(alert.patientId); navigate('agenda'); }} onManage={role === 'pro' ? (alert) => { setSelectedId(alert.patientId); navigate('consultas'); } : undefined} onOpenReminder={openReminder} onOpenCare={(notice) => { if (role === 'pro') setSelectedId(notice.patient_id); navigate(notice.target); }} />
          <div className="nv-user">
            <span className="nv-user-avatar" aria-hidden="true">{userInitials}</span>
            <span className="nv-user-name"><strong>{displayName}</strong><small>{role === 'pro' ? 'Nutricionista' : 'Paciente'}</small></span>
            <button type="button" className="nv-user-caret" aria-label="Opciones de la cuenta" aria-expanded={profileOpen} aria-controls="nv-user-menu" onClick={() => setProfileOpen((open) => !open)}><CaretDown size={16} aria-hidden="true" /></button>
            {profileOpen && <div className="nv-user-menu" id="nv-user-menu">
              {demoSwitch && <div className="nv-role-switch" aria-label="Cambiar de rol"><button type="button" aria-pressed={role === 'patient'} onClick={() => { setProfileOpen(false); switchRole('patient'); }}>Paciente</button><button type="button" aria-pressed={role === 'pro'} onClick={() => { setProfileOpen(false); switchRole('pro'); }}>Nutricionista</button></div>}
              <button type="button" className="nv-theme" onClick={() => { setProfileOpen(false); onToggleTheme(); }}><Icon name={darkMode ? 'sun' : 'moon'} size={18} />{darkMode ? 'Tema claro' : 'Tema oscuro'}</button>
              {onSignOut && <button type="button" onClick={() => onSignOut()}><NvIcon name="salir" size={18} />Cerrar sesión</button>}
            </div>}
          </div>
        </div>
        <button type="button" className="nv-button nv-ghost nv-menu-toggle" ref={menuButtonRef} aria-label={menuOpen ? 'Cerrar el menú' : 'Abrir el menú'} aria-expanded={menuOpen} aria-controls="nv-drawer" onClick={() => setMenuOpen((open) => !open)}><Icon name="list" size={20} /><img className="nv-figma-list" src={figmaListIcon} alt="" width="24" height="24" /></button>
      </header>
      <div className="nv-content-layout">
        <main id="nv-main" tabIndex={-1} className="nv-main">
          {role === 'pro' && selected && ['consultas','objetivos','progreso'].includes(page) && <SelectedPatientContext patient={selected} onRecord={() => navigate('ficha')} />}
          {page === 'inicio' && <ConsultAlertStrip audience={alertAudience} alerts={consultAlerts} reminder={nextHabitReminder} onOpen={(alert) => { if (role === 'pro') setSelectedId(alert.patientId); navigate('agenda'); }} onOpenReminder={openReminder} />}
          {(showHeading || (['pacientes', 'recetas'].includes(page) && !pendingModule)) ? (
          <div className="nv-page-head">
            {showHeading && <div><h1>{pageTitle}<span className="nv-title-dot">.</span></h1>{page === 'inicio' && <p>{role === 'patient' ? 'Tu acompañamiento nutricional, con datos que ya están publicados.' : 'Seguimiento del paciente con lo que registró y lo que tiene publicado.'}</p>}</div>}
            {role === 'pro' && page === 'inicio' && <label className="nv-search np-dashboard-search nv-patient-picker"><Icon name="users" size={18} /><select aria-label="Paciente en seguimiento" value={selected?.id ?? ''} onChange={(e) => pickPatient(e.target.value)} disabled={!activePatients.length}>{!activePatients.length && <option value="">Sin pacientes activos</option>}{activePatients.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>}
            {role === 'patient' && page === 'inicio' && <form className="nv-search np-dashboard-search" onSubmit={(e) => { e.preventDefault(); navigate('plan'); }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
              <input type="search" aria-label="Buscar en mi plan" placeholder="Buscar en mi plan…" value={query} onChange={(e) => setQuery(e.target.value)} />
              <button type="submit" aria-label="Buscar comidas en mi plan"><Icon name="arrow" size={16} /></button>
            </form>}
            {['pacientes', 'recetas'].includes(page) && !pendingModule && <label className="nv-search"><Icon name="list" size={16} /><input type="search" aria-label={page === 'pacientes' ? 'Buscar pacientes' : page === 'recetas' ? 'Buscar preparaciones' : page === 'recursos' ? 'Buscar recursos y guardados' : 'Buscar comidas'} placeholder={page === 'pacientes' ? 'Buscar pacientes…' : page === 'recetas' ? 'Buscar preparaciones…' : page === 'recursos' ? 'Buscar recursos y guardados…' : 'Buscar comidas…'} value={query} onChange={(e) => setQuery(e.target.value)} /></label>}
          </div>
          ) : null}
          {page === 'mensajes' && p ? <NutrigoMessages patient={p} patients={role === 'pro' ? activePatients.map((person) => buildShowroomPatient(person, now)) : [p]} role={role} onSelect={(id) => { setSelectedId(id); setDayIndex(-1); }} onNavigate={navigate} /> : <>
{!p ? <NvState title="Sin pacientes activos" description="Agregá o restaurá un paciente desde la aplicación actual." /> : pendingModule ? <NvState title={`${pendingModule} · diseño pendiente`} description="El módulo actual sigue disponible en la aplicación. Esta vista todavía no lo reemplaza." /> : page === 'ficha' && role === 'pro' ? <ShowroomPatientRecord patient={selected!} patients={activePatients} onSelect={(id) => { setSelectedId(id); setDayIndex(-1); }} onEdit={() => setRecordEditing(true)} onOpen={openOperation} /> : page === 'diario' && role === 'pro' ? <ShowroomMeals patient={selected!} patients={activePatients} query={query} onSelect={(id) => { setSelectedId(id); setDayIndex(-1); }} onReview={setReviewLog} /> : page === 'diario' && role === 'patient' ? <ShowroomPatientDiary patient={p} patientId={p.id} query={query} now={now} onLogMeal={(slot = 'Almuerzo') => setMealSlot(slot)} /> : page === 'recetas' ? <ShowroomHealthyMenu patient={p} query={query} onNavigate={navigate} role={role} /> : page === 'recursos' ? <ShowroomResources patientId={p.id} query={query} onQueryChange={setQuery} assignments={selected?.resource_assignments} onNavigate={navigate} onMarkRead={role === 'patient' ? markResourceRead : undefined} /> : page === 'plan' && role === 'pro' ? <ShowroomMealPlan patient={selected!} patients={activePatients} query={query} now={now} onSelect={(id) => { setSelectedId(id); setDayIndex(-1); }} onChanged={addPatient} /> : page === 'plan' && role === 'patient' ? <ShowroomPatientPlan patient={p} now={now} query={query} onShopping={() => navigate('compras')} /> : page === 'consultas' && role === 'pro' ? <ShowroomConsultations patient={selected!} patients={activePatients} now={now} onSelect={(id) => { setSelectedId(id); setDayIndex(-1); }} onChanged={addPatient} /> : page === 'agenda' && role === 'pro' ? <ShowroomAgenda patients={activePatients} now={now} focusPatient={selected} onManage={(id) => { setSelectedId(id); navigate('consultas'); }} onNavigatePatient={(id, target) => { setSelectedId(id); navigate(target === 'consultas' ? 'consultas' : target); }} /> : isWorkCenterPage(page) && role === 'pro' ? <ShowroomWorkCenter module={page} patients={activePatients} now={now} onOpenPatient={(id) => { setSelectedId(id); navigate('ficha'); }} onOpenMeals={(id) => { setSelectedId(id); navigate('diario'); }} onOpenConsultations={(id) => { setSelectedId(id); navigate('consultas'); }} /> : page === 'objetivos' && role === 'pro' ? <ShowroomGoals patient={selected!} patients={activePatients} onSelect={(id) => { setSelectedId(id); setDayIndex(-1); }} onChanged={addPatient} onOpenPatient={(id) => { setSelectedId(id); navigate('ficha'); }} /> : page === 'pacientes' ? <ShowroomPatients patients={patients} query={query} onChanged={addPatient} onFollow={(id) => openOperation(followFromDirectory(id))} /> : page === 'inicio' ? <PatientOverview patient={p} onNavigate={navigate} audience={role === 'pro' ? 'professional' : 'patient'} /> : page === 'progreso' ? <ShowroomProgress patient={p} professional={role === 'pro'} /> : page === 'ejercicio' ? <ShowroomExercise patient={p} now={now} professional={role === 'pro'} /> : page === 'compras' ? <ShowroomGrocery patient={p} readOnly={role === 'pro'} /> : page === 'agenda' && role === 'patient' ? <ShowroomPatientAgenda patient={p} now={now} onMessage={() => navigate('mensajes')} onNavigate={navigate} onReschedule={rescheduleAppointment} onConfirm={confirmAppointment} /> : <ShowroomDetail page={page} patient={p} query={query} />}
          </>}
          <footer className="nv-footer"><p>Copyright © {now.getFullYear()} Plan V</p></footer>
        </main>
        {p && page !== 'mensajes' && page !== 'ficha' && page !== 'compras' && page !== 'progreso' && page !== 'diario' && page !== 'plan' && page !== 'agenda' && page !== 'recetas' && page !== 'ejercicio' && page !== 'recursos' && page !== 'pacientes' && !(role === 'pro' && (page === 'consultas' || page === 'objetivos' || isWorkCenterPage(page))) && <aside className="nv-daily" aria-label={role === 'pro' ? 'Paciente en seguimiento' : 'Mi día'}>
          <div className="nv-person"><span className="nv-avatar">{p.initials}</span><div><strong>{p.name}</strong><small>{role === 'pro' ? 'Paciente en seguimiento' : 'Mi plan de acompañamiento'}</small></div><Icon name="leaf" size={18} /></div>
          <WeeklyPlanCalendar now={now} selectedIndex={dayIndex} onSelect={setDayIndex} />
          <div className="nv-agenda-meals">{meals.map((meal, i) => <button type="button" key={meal.slot} onClick={() => navigate('plan')}><span className="nv-meal-meta"><b className={`nv-meal-chip nv-meal-chip-${i % 4}`}>{meal.slot}</b>{meal.time && <small className={`nv-meal-info nv-meal-info-${i % 4}`}><Icon name="clock" size={14} />{meal.time}</small>}<Icon name="chevron" size={16} /></span><span className="nv-meal-body"><MealThumbnail slot={meal.slot} /><strong>{meal.title}</strong></span></button>)}</div>
          {!meals.length && <p className="nv-caption">Todavía no hay comidas asignadas.</p>}
          {page === 'inicio' && <section className="nv-recent" aria-label="Actividad reciente">
            <header><h2>Actividad reciente</h2></header>
            {(() => { const items = buildRecentActivity(p, now, role === 'pro' ? 'professional' : 'patient'); return items.length
              ? <ol>{items.map((item) => <li key={item.id}><span className="nv-icon-tile"><Icon name={item.icon} size={15} /></span><div><small>{activityWhen(item.at, now)}</small><p>{item.text}</p></div></li>)}</ol>
              : <p className="nv-caption">{role === 'pro' ? 'Todavía no registró nada esta semana.' : 'Todavía no registraste nada esta semana.'}</p>; })()}
          </section>}
        </aside>}
      </div>
    </div>
    {menuOpen && <div className="nv-drawer-scrim" role="presentation" onClick={() => { setMenuOpen(false); menuButtonRef.current?.focus(); }} />}
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
