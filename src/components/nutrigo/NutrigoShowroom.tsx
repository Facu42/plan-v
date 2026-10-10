import { ProfessionalModules, PlannedModulesNav } from './ProfessionalModules';
import { ModelCatalog } from './ModelCatalog';
import { FoodCatalog } from './FoodCatalog';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MealLog } from '../../types';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import { Icon, Mark } from '../shared/Icon';
import { MealReviewPanel } from '../crm/MealReviewPanel';
import { MealLogModal } from '../patient/MealLogModal';
import { buildShowroomPatient, filterShowroomPatients } from './showroom-model';
import { NvBadge, NvState } from './primitives';
import { FirstSteps } from './FirstSteps';
import { PAGE_LABELS, ShowroomDetail, type ShowroomPage } from './ShowroomPanels';
import type { CrmEntry } from '../crm/crm-entry';
import { MealThumbnail, PatientOverview } from './PatientOverview';
import { NutrigoMessages } from './NutrigoMessages';
import { ShowroomPatientEdit, ShowroomPatients, followFromDirectory, type DirectoryAction } from './ShowroomPatients';
import { ProfessionalPatientWorkspace } from './ProfessionalPatientWorkspace';
import { ProfessionalWorkQueue } from './ProfessionalWorkQueue';
import { ProfessionalPlans } from './ProfessionalPlans';
import { ProfessionalLibrary } from './ProfessionalLibrary';
import { canLeaveWorkspace } from './unsaved-changes';
import './professional-workspace.css';
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
import { ShowroomPrivacy } from './ShowroomPrivacy';
import { ShowroomWorkCenter, type WorkCenterModule } from './ShowroomWorkCenter';
import { PATIENT_MORE, PATIENT_SURFACES, PATIENT_TABS, PLAN_SUBPAGES, PRO_TABS, proMore, proSurfaces, tabBarState } from './showroom-nav';
import { appPath, buildAppHref, contentIdentity, hasResourceHash, isAdminPath, resolveAppLocation, type AppRole } from './app-location';
import { unreadCount } from './message-receipts';
import { buildConsultAlerts } from './consult-alerts';
import { ShowroomCobranzas } from './ShowroomCobranzas';
import { ShowroomServicio } from './ShowroomServicio';
import { ShowroomPagos } from './ShowroomPagos';
import { PatientFeeNotice } from './PatientFeeNotice';
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
import './figma-source.css';
import './patient-figma-front.css';
import './motion.css';
import { NV_ICONS, NvIcon, type NvIconName } from './NvIcon';
import { CaretDown, CaretUp, LockSimple } from '@phosphor-icons/react';
import { FigmaDetailContext, FigmaPatientFooter, FigmaPlanCard, PATIENT_FIGMA_NODES, type FigmaDetail } from './FigmaPatientFront';
import { NutrigoPatientApp } from '../../features/nutrigo/PatientApp';


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
  const [figmaDetail, setFigmaDetail] = useState<FigmaDetail | null>(null);
  const topbarRef = useRef<HTMLElement>(null);
  const [selectedId, setSelectedId] = useState(() => typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('paciente') ?? '');
  const [page, setPage] = useState<ShowroomPage>(initialLocation.page);
  const [workspaceRevision, setWorkspaceRevision] = useState(0);
  const previousLocation = useRef(typeof window === 'undefined' ? '' : window.location.href);
  // Panel del servicio: el menú lo muestra sólo si la API confirma que es administrador. En demo (sin sesión) se pide con ?admin=1 o la ruta /admin.
  const [adminAudience] = useState(() => typeof window !== 'undefined' && (new URLSearchParams(window.location.search).get('admin') === '1' || isAdminPath(window.location.pathname)));
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    if (lockedRole === 'patient') { setIsAdmin(false); return; }
    let active = true;
    api.getAdminMe(adminAudience ? 'admin' : undefined).then((result) => { if (active) setIsAdmin(result.admin === true); }).catch(() => { if (active) setIsAdmin(false); });
    return () => { active = false; };
  }, [lockedRole, adminAudience]);
  const [pendingModule, setPendingModule] = useState('');
  const [query, setQuery] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState<boolean | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  // Cajón de navegación móvil: el archivo abre el menú desde la barra superior.
  const [menuOpen, setMenuOpen] = useState(false);
  const [compactHeader, setCompactHeader] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 799px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 799px)');
    const update = () => { setCompactHeader(media.matches); setProfileOpen(false); };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(() => !lockedRole && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('onboarding') === '1');
  const [professionalIntro, setProfessionalIntro] = useState(false);
  const [directoryAction, setDirectoryAction] = useState<DirectoryAction | null>(null);
  const [introInviteBusy, setIntroInviteBusy] = useState(false);
  const [introInviteError, setIntroInviteError] = useState('');
  const introInviteRequest = useRef(0);
  useEffect(() => () => { introInviteRequest.current += 1; }, []);
  const closeProfessionalIntro = useCallback(() => {
    introInviteRequest.current += 1;
    setProfessionalIntro(false);
    setIntroInviteBusy(false);
    setIntroInviteError('');
  }, []);
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
    const syncLocation = (event?: Event) => {
      if (event && !canLeaveWorkspace()) { window.history.pushState(window.history.state, '', previousLocation.current); return; }
      closeProfessionalIntro();
      const next = resolveAppLocation({ pathname: window.location.pathname, hash: window.location.hash, lockedRole });
      setRole(next.role);
      setPage(next.page);
      setSelectedId(next.role === 'pro' ? new URLSearchParams(window.location.search).get('paciente') ?? '' : '');
      if (hasResourceHash(window.location.hash)) {
        setPendingModule('');
        setQuery('');
        setMoreOpen(false);
      }
      if (next.role === 'pro' && /\/(recursos|guardado)\/?$/.test(window.location.pathname)) {
        const url = new URL(window.location.href); url.searchParams.set('biblioteca', 'recursos');
        window.history.replaceState(window.history.state, '', url);
      }
      const href = buildAppHref(window.location.href, next.role, next.page, { keepHash: ['recursos', 'biblioteca'].includes(next.page) && hasResourceHash(window.location.hash) });
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (next.replace && href !== current) window.history.replaceState(window.history.state, '', href);
      previousLocation.current = window.location.href;
      setWorkspaceRevision((value) => value + 1);
    };
    syncLocation();
    window.addEventListener('hashchange', syncLocation);
    window.addEventListener('popstate', syncLocation);
    return () => {
      window.removeEventListener('hashchange', syncLocation);
      window.removeEventListener('popstate', syncLocation);
    };
  }, [lockedRole, closeProfessionalIntro]);
  const selected = role === 'patient' || !selectedId ? activePatients[0] : activePatients.find((p) => p.id === selectedId);
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
  const selectPatient = (id: string) => {
    if (id !== selected?.id && !canLeaveWorkspace()) return false;
    closeProfessionalIntro();
    setSelectedId(id);
    setDayIndex(-1);
    if (role === 'pro' && typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('paciente', id);
      window.history.replaceState(window.history.state, '', url);
      previousLocation.current = window.location.href;
    }
    return true;
  };
  const navigate = (requested: ShowroomPage, nextQuery = '') => {
    const target = role === 'pro' ? resolveAppLocation({ pathname: appPath(role, requested), lockedRole: role }).page : requested;
    if (!canLeaveWorkspace()) return;
    closeProfessionalIntro();
    if (typeof window !== 'undefined') {
      let href = buildAppHref(window.location.href, role, target);
      if (role === 'pro' && ['recursos', 'guardado'].includes(requested)) {
        const url = new URL(href, window.location.origin); url.searchParams.set('biblioteca', 'recursos'); href = url.pathname + url.search;
      }
      window.history.pushState({ ...window.history.state, planVPage: target }, '', href);
      previousLocation.current = window.location.href;
    }
    setPage(target); setPendingModule(''); setQuery(nextQuery); setMoreOpen(false); setMenuOpen(false); setRecordEditing(false); setMealSlot(null);
  };
  const switchRole = (target: AppRole) => {
    if (!demoSwitch || !canLeaveWorkspace()) return;
    closeProfessionalIntro();
    setDirectoryAction(null);
    setRole(target);
    setDayIndex(-1);
    if (typeof window !== 'undefined') {
      window.history.pushState({ planVPage: 'inicio' }, '', buildAppHref(window.location.href, target, 'inicio'));
    }
    setPage('inicio'); setPendingModule(''); setQuery(''); setMoreOpen(false); setMenuOpen(false); setRecordEditing(false); setMealSlot(null);
  };
  const currentDay = buildCalendarWeek(now)[dayIndex];
  const meals = p ? resolveCalendarMeals(p, now, dayIndex) : [];
  const pageTitle = pendingModule || (page === 'inicio' ? role === 'patient' ? `Hola, ${preferredName || p?.name.split(' ')[0] || 'bienvenida'}` : 'Tu consultorio' : PAGE_LABELS[page]);
  const libraryRecipeTitle = role === 'pro' && page === 'biblioteca' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('biblioteca') !== 'recursos' && !hasResourceHash(window.location.hash) ? 'Recetas' : undefined;
  const tabs = role === 'patient' ? PATIENT_TABS : PRO_TABS;
  const moreItems = role === 'patient' ? PATIENT_MORE : proMore(isAdmin === true);
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
    if (!canLeaveWorkspace()) return;
    if (target.module === 'pacientes') { navigate('pacientes'); return; }
    if (target.module === 'fichas' && target.tab === 'comidas') { selectPatient(target.patientId); navigate('diario'); return; }
    if (target.module === 'fichas' && target.tab === 'plan') { selectPatient(target.patientId); navigate('plan'); return; }
    if (target.module === 'fichas' && target.tab === 'consultas') { selectPatient(target.patientId); navigate('consultas'); return; }
    if (target.module === 'fichas' && (!target.tab || target.tab === 'resumen')) { selectPatient(target.patientId); navigate('ficha'); return; }
    if (target.module === 'objetivos') { selectPatient(target.patientId); navigate('objetivos'); return; }
    if (target.module === 'seguimiento') { selectPatient(target.patientId); navigate('seguimiento'); return; }
    if (target.module === 'agenda') { selectPatient(target.patientId); navigate('agenda'); return; }
    if (target.module === 'reciente' || target.module === 'guardado' || target.module === 'paneles' || target.module === 'videollamadas') { navigate(target.module); return; }
    if (target.patientId) selectPatient(target.patientId);
    navigate('inicio');
  };

  const openWorkHref = (href: string) => {
    if (!canLeaveWorkspace()) return;
    const url = new URL(href, window.location.origin);
    if (url.origin !== window.location.origin || !url.pathname.startsWith('/crm/')) return;
    window.history.pushState(window.history.state, '', url);
    previousLocation.current = url.href;
    const next = resolveAppLocation({ pathname: url.pathname, hash: url.hash, lockedRole: 'pro' });
    setSelectedId(url.searchParams.get('paciente') ?? ''); setPage(next.page);
    setWorkspaceRevision((value) => value + 1); setMoreOpen(false); setMenuOpen(false); setRecordEditing(false);
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

  const surfaces = role === 'patient' ? PATIENT_SURFACES : proSurfaces(isAdmin === true);
  const planGroupOpen = planOpen ?? (page === 'plan' || page === 'compras');
  const footer = role === 'patient' ? <FigmaPatientFooter year={now.getFullYear()} onContact={() => navigate('mensajes')} /> : <footer className="nv-footer"><p>© {now.getFullYear()} Plan V · <a href="/legal/privacidad.html" target="_blank" rel="noreferrer">Privacidad</a> · <a href="/legal/terminos.html" target="_blank" rel="noreferrer">Términos</a></p></footer>;
  const displayName = role === 'pro' ? userName || 'Tu consultorio' : p?.name ?? 'Paciente';
  const userInitials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join('');
  const navButton = (item: (typeof surfaces)[number]) => <button type="button" key={item.id} aria-current={!pendingModule && page === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}>{item.id in NV_ICONS ? <NvIcon name={item.id as NvIconName} size={20} /> : item.id === 'recetas' ? <NvIcon name="menu" size={20} /> : <Icon name={item.icon} size={20} />}{item.label}{item.id === 'mensajes' && messageUnread > 0 && <small>{messageUnread > 9 ? '9+' : messageUnread}</small>}</button>;

  const accountMenu = () => (
<div className="nv-header-menu">
          <ShowroomConsultAlerts key={alertAudience} audience={alertAudience} alerts={consultAlerts} reminders={habitReminders} patientId={selected?.id} onOpen={(alert) => { if (role === 'pro') selectPatient(alert.patientId); navigate('agenda'); }} onManage={role === 'pro' ? (alert) => { selectPatient(alert.patientId); navigate('consultas'); } : undefined} onOpenReminder={openReminder} onOpenCare={(notice) => { if (role === 'pro') selectPatient(notice.patient_id); navigate(notice.target); }} />
          <div className="nv-user">
            <span className="nv-user-avatar" aria-hidden="true">{userInitials}</span>
            <span className="nv-user-name"><strong>{displayName}</strong><small>{role === 'pro' ? 'Nutricionista' : 'Paciente'}</small></span>
            <button type="button" className="nv-user-caret" aria-label="Opciones de la cuenta" aria-expanded={profileOpen} aria-controls="nv-user-menu" onClick={() => setProfileOpen((open) => !open)}><CaretDown size={16} aria-hidden="true" /></button>
            {profileOpen && <div className="nv-user-menu" id="nv-user-menu">
              {demoSwitch && <div className="nv-role-switch" aria-label="Cambiar de rol"><button type="button" aria-pressed={role === 'patient'} onClick={() => { setProfileOpen(false); switchRole('patient'); }}>Paciente</button><button type="button" aria-pressed={role === 'pro'} onClick={() => { setProfileOpen(false); switchRole('pro'); }}>Nutricionista</button></div>}
              <button type="button" className="nv-theme" onClick={() => { setProfileOpen(false); onToggleTheme(); }}><Icon name={darkMode ? 'sun' : 'moon'} size={18} />{darkMode ? 'Tema claro' : 'Tema oscuro'}</button>
              {role === 'patient' && selected && <button type="button" onClick={() => { setProfileOpen(false); setPrivacyOpen(true); }}><LockSimple size={18} aria-hidden="true" />Tus datos</button>}
              {role === 'patient' && <button type="button" onClick={() => { setProfileOpen(false); navigate('pagos'); }}><Icon name="wallet" size={18} />Mis pagos</button>}
              {role === 'pro' && <button type="button" onClick={() => { setProfileOpen(false); setProfessionalIntro(true); }}><NvIcon name="ingreso" size={18} />Primeros pasos</button>}
              {!lockedRole && role === 'patient' && <button type="button" onClick={() => { setProfileOpen(false); setOnboardingOpen(true); }}><NvIcon name="ingreso" size={18} />Ingreso</button>}
              {onSignOut && <button type="button" onClick={() => { if (canLeaveWorkspace()) onSignOut(); }}><NvIcon name="salir" size={18} />Cerrar sesión</button>}
            </div>}
          </div>
        </div>
  );

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

  if (role === 'patient' && p) return <NutrigoPatientApp key={`${p.id}:${page}`} patient={p} page={page} query={query} now={now} onNavigate={navigate} onSignOut={onSignOut ? () => { if (canLeaveWorkspace()) onSignOut(); } : undefined} onEditIntake={()=>setOnboardingOpen(true)} onConfirm={confirmAppointment} onReschedule={rescheduleAppointment} demoRoleSwitch={demoSwitch?()=>switchRole('pro'):undefined}/>;

  const firstSteps = <FirstSteps
    patientName={selected?.name}
    busy={introInviteBusy}
    error={introInviteError}
    onStart={() => { setDirectoryAction('create'); navigate('pacientes'); }}
    onExplore={() => navigate('pacientes')}
    onInvite={selected && selected.has_account === false ? async () => {
      if (introInviteBusy) return;
      const requestId = ++introInviteRequest.current;
      setIntroInviteBusy(true); setIntroInviteError('');
      try {
        const { invite } = await api.patientInvite(selected.id);
        if (introInviteRequest.current !== requestId) return;
        setDirectoryAction({ share: { name: selected.name, invite } });
        navigate('pacientes');
      } catch (reason) {
        if (introInviteRequest.current === requestId) setIntroInviteError(reason instanceof Error ? reason.message : 'No pudimos preparar la invitación.');
      } finally { if (introInviteRequest.current === requestId) setIntroInviteBusy(false); }
    } : undefined}
    onPlan={selected ? () => { setProfessionalIntro(false); openOperation({ module: 'fichas', patientId: selected.id, tab: 'plan' }); } : undefined}
  />;

  return <FigmaDetailContext.Provider value={setFigmaDetail}><div className={`nv-app${page === 'inicio' ? ' nv-home' : ''}${role === 'patient' ? ' nv-patient' : ' nv-pro'}${darkMode ? ' nv-dark' : ''}${menuOpen ? ' nv-menu-open' : ''}${professionalIntro ? ' nv-professional-onboarding' : ''}${page === 'mensajes' ? ' nv-messaging' : ''}${page === 'ficha' ? ' nv-record' : ''}${page === 'diario' && role === 'pro' ? ' nv-food-diary' : ''}${page === 'plan' && role === 'pro' ? ' nv-meal-plan' : ''}${page === 'consultas' && role === 'pro' ? ' nv-consultation-page' : ''}${page === 'agenda' && role === 'pro' ? ' nv-agenda-page' : ''}${page === 'objetivos' && role === 'pro' ? ' nv-goals-page' : ''}${isWorkCenterPage(page) && role === 'pro' ? ' nv-work-center-page' : ''}${page === 'compras' ? ' nv-grocery-page' : ''}${page === 'progreso' ? ' nv-progress-page' : ''}${page === 'diario' && role === 'patient' ? ' nv-patient-diary' : ''}${page === 'plan' && role === 'patient' ? ' nv-patient-plan' : ''}${page === 'agenda' && role === 'patient' ? ' nv-patient-agenda' : ''}${page === 'recetas' ? ' nv-healthy-menu' : ''}${page === 'ejercicio' ? ' nv-exercise-page' : ''}${page === 'recursos' ? ' nv-resources-page' : ''}${(page === 'cobranzas' && role === 'pro') || (page === 'pagos' && role === 'patient') || (page === 'servicio' && role === 'pro') ? ' nv-fees-page' : ''}`}>
    <a className="nv-skip" href="#nv-main">Ir al contenido</a>
    <aside className="nv-sidebar" id="nv-drawer" ref={drawerRef} tabIndex={-1} inert={compactHeader && !menuOpen} aria-label={role === 'patient' ? 'Tu espacio' : 'Consultorio'}>
      <a className="nv-brand" href={buildAppHref(typeof window === 'undefined' ? 'https://plan.v/app/inicio' : window.location.href, role, 'inicio')} onClick={(event) => { event.preventDefault(); navigate('inicio'); }}><Mark /><span>Plan V<small>{role === 'pro' ? 'Consultorio' : 'Mi espacio'}</small></span></a>
      <nav data-figma-node="2:4499">{role === 'pro' ? <>
        {[
          {title:'Consultorio',ids:['inicio','pacientes','agenda','cobranzas']},
          {title:'Acompañamiento',ids:['seguimiento','mensajes']},
          {title:'Planes y alimentos',ids:['plan','alimentos','modelos']},
          {title:'Herramientas',ids:['biblioteca','servicio']},
        ].map(group=><div className="pm-nav-group" key={group.title}><p>{group.title}</p>{surfaces.filter(item=>group.ids.includes(item.id)&&item.id!=='biblioteca').map(navButton)}
          {group.title==='Herramientas'&&<button type="button" aria-current={page==='biblioteca'&&typeof window!=='undefined'&&(new URLSearchParams(window.location.search).get('biblioteca')==='recursos'||hasResourceHash(window.location.hash))?'page':undefined} onClick={()=>openWorkHref('/crm/biblioteca?biblioteca=recursos')}><Icon name="pin" size={20}/>Biblioteca</button>}
          {group.title==='Planes y alimentos'&&<button type="button" aria-current={page==='biblioteca'&&typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('biblioteca')!=='recursos'?'page':undefined} onClick={()=>openWorkHref('/crm/biblioteca?biblioteca=recetas')}><NvIcon name="menu" size={20}/>Recetas</button>}
        </div>)}
        <div className="pm-nav-group"><button type="button" aria-current={page==='desarrollo'&&typeof window!=='undefined'&&!new URLSearchParams(window.location.search).get('modulo')?'page':undefined} onClick={()=>openWorkHref('/crm/desarrollo')}><Icon name="grid" size={19}/>Todas las funciones</button></div>
        <PlannedModulesNav selectedId={page==='desarrollo'&&typeof window!=='undefined'?new URLSearchParams(window.location.search).get('modulo')??undefined:undefined} onOpen={openWorkHref}/>
      </> : surfaces.filter((item) => !['compras', 'pagos'].includes(item.id)).map((item) => item.id === 'plan' && role === 'patient' ? <div key="plan" className={`nv-nav-sub${planGroupOpen ? ' nv-open' : ''}`}>
        <button type="button" className="nv-nav-sub-head" aria-expanded={planGroupOpen} onClick={() => setPlanOpen(!planGroupOpen)}><NvIcon name="plan" size={20} /><span>{item.label}</span>{planGroupOpen ? <CaretUp size={14} aria-hidden="true" /> : <CaretDown size={14} aria-hidden="true" />}</button>
        {planGroupOpen && <div className="nv-nav-sub-items">{PLAN_SUBPAGES.map((sub) => <button type="button" key={sub.id} aria-current={!pendingModule && page === sub.id ? 'page' : undefined} onClick={() => navigate(sub.id)}>{sub.label}</button>)}</div>}
      </div> : navButton(item))}</nav>
      {role === 'patient' && <FigmaPlanCard onOpen={() => navigate('plan')} />}
      {compactHeader && menuOpen && <div className="nv-mobile-account">{accountMenu()}</div>}
      {onSignOut && <button type="button" className="nv-logout" onClick={() => { if (canLeaveWorkspace()) onSignOut(); }}><NvIcon name="salir" size={20} />Cerrar sesión</button>}
    </aside>
    <div className="nv-workspace">
      <header className="nv-topbar" ref={topbarRef}>
        <a className="nv-brand" href={buildAppHref(typeof window === 'undefined' ? 'https://plan.v/app/inicio' : window.location.href, role, 'inicio')} onClick={(event) => { event.preventDefault(); navigate('inicio'); }}><Mark /><span>Plan V</span></a>
        <h1 className="nv-topbar-title" aria-label={figmaDetail?.title ?? libraryRecipeTitle ?? PAGE_LABELS[page]}>
          <span className="nv-topbar-label-desktop">{figmaDetail?.title ?? libraryRecipeTitle ?? PAGE_LABELS[page]}</span>
          <span className="nv-topbar-label-mobile" aria-hidden="true">{figmaDetail?.title ?? libraryRecipeTitle ?? MOBILE_PAGE_LABELS[page] ?? PAGE_LABELS[page]}</span>
        </h1>
        <div className="nv-desktop-account">{!compactHeader && accountMenu()}</div>
        <button type="button" className="nv-button nv-ghost nv-menu-toggle" ref={menuButtonRef} aria-label={menuOpen ? 'Cerrar el menú' : 'Abrir el menú'} aria-expanded={menuOpen} aria-controls="nv-drawer" onClick={() => setMenuOpen((open) => !open)}><Icon name="list" size={20} /></button>
      </header>
      <div className="nv-content-layout">
        {/* Cambiar de pantalla o paciente desmonta los datos y formularios anteriores. */}
        <main key={`${contentIdentity(role,page,selected?.id)}:${workspaceRevision}`} id="nv-main" tabIndex={-1} className="nv-main" data-figma-node={role === 'patient' ? (figmaDetail?.nodes ?? PATIENT_FIGMA_NODES[page])?.[compactHeader ? 1 : 0] : undefined}>
          {role === 'pro' && page !== 'modelos' && page !== 'alimentos' && !(page === 'biblioteca' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('biblioteca') !== 'recursos' && !hasResourceHash(window.location.hash)) && <nav className="nv-clinic-shortcuts" aria-label="Accesos del consultorio">
            <button type="button" aria-current={page === 'pacientes' ? 'page' : undefined} onClick={() => navigate('pacientes')}><Icon name="users" size={18} />Pacientes</button>
            <button type="button" aria-current={page === 'ficha' ? 'page' : undefined} disabled={!selected} onClick={() => navigate('ficha')}><Icon name="contact" size={18} />Ficha</button>
            <button type="button" aria-current={page === 'plan' ? 'page' : undefined} disabled={!selected} onClick={() => navigate('plan')}><NvIcon name="plan" size={18} />Plan</button>
            <label><span>Paciente</span><select aria-label="Paciente del consultorio" value={selected?.id ?? ''} onChange={(event) => selectPatient(event.target.value)} disabled={!activePatients.length}>{!selected && <option value="" disabled>{activePatients.length ? 'Elegí un paciente' : 'Sin pacientes activos'}</option>}{activePatients.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
          </nav>}
          {role === 'pro' && selected && ['consultas','objetivos','progreso'].includes(page) && <SelectedPatientContext patient={selected} onRecord={() => navigate('ficha')} />}

          {(!figmaDetail && (showHeading || (['pacientes', 'recetas'].includes(page) && !pendingModule))) ? (
          <div className="nv-page-head">
            {showHeading && <div><h1>{pageTitle}{role === 'patient' ? <span>! 👋</span> : <span className="nv-title-dot">.</span>}</h1>{page === 'inicio' && <p>{role === 'patient' ? 'Empecemos nuestro camino para cuidar tu salud.' : 'Pacientes, planes y pendientes del consultorio.'}</p>}</div>}
            {role === 'patient' && page === 'inicio' && <form className="nv-search np-dashboard-search" onSubmit={(e) => { e.preventDefault(); navigate('plan', query); }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></svg>
              <input type="search" aria-label="Buscar en mi plan" placeholder="Buscar en mi plan…" value={query} onChange={(e) => setQuery(e.target.value)} />
              <button type="submit" aria-label="Buscar comidas en mi plan"><Icon name="arrow" size={16} /></button>
            </form>}
            {['pacientes', 'recetas'].includes(page) && !pendingModule && <label className="nv-search"><Icon name="list" size={16} /><input type="search" aria-label={page === 'pacientes' ? 'Buscar pacientes' : page === 'recetas' ? 'Buscar preparaciones' : page === 'recursos' ? 'Buscar recursos y guardados' : 'Buscar comidas'} placeholder={page === 'pacientes' ? 'Buscar pacientes…' : page === 'recetas' ? 'Buscar preparaciones…' : page === 'recursos' ? 'Buscar recursos y guardados…' : 'Buscar comidas…'} value={query} onChange={(e) => setQuery(e.target.value)} /></label>}
          </div>
          ) : null}
          {professionalIntro && role === 'pro' ? firstSteps : page === 'mensajes' && p ? <NutrigoMessages patient={p} patients={role === 'pro' ? activePatients.map((person) => buildShowroomPatient(person, now)) : [p]} role={role} onSelect={(id) => { selectPatient(id); setDayIndex(-1); }} onNavigate={navigate} /> : <>
{page === 'desarrollo' && role === 'pro' ? <ProfessionalModules selectedId={typeof window === 'undefined' ? undefined : new URLSearchParams(window.location.search).get('modulo') ?? undefined} onOpen={openWorkHref} /> : page === 'modelos' && role === 'pro' ? <ModelCatalog patients={activePatients} onOpenHref={openWorkHref} /> : page === 'alimentos' && role === 'pro' ? <FoodCatalog /> : page === 'servicio' && role === 'pro' ? (isAdmin ? <ShowroomServicio /> : isAdmin === null ? <NvState kind="loading" title="Cargando…" description="Estamos verificando tu acceso." /> : <NvState title="No tenés permiso para ver esta pantalla" description="El Panel del servicio es sólo para quien administra Plan V." />) : page === 'cobranzas' && role === 'pro' ? <ShowroomCobranzas initialSelectedId={selectedId || undefined} /> : page === 'pagos' && role === 'patient' && p ? <ShowroomPagos patientId={p.id} /> : page === 'pacientes' && role === 'pro' ? <ShowroomPatients patients={patients} query={query} initialAction={directoryAction} onActionConsumed={() => setDirectoryAction(null)} onChanged={addPatient} onFollow={(id) => openOperation(followFromDirectory(id))} onRecord={(id) => openOperation({ module: 'fichas', patientId: id, tab: 'resumen' })} onPlan={(id) => openOperation({ module: 'fichas', patientId: id, tab: 'plan' })} /> : role === 'pro' && (page === 'inicio' || page === 'seguimiento') ? <ProfessionalWorkQueue patients={activePatients} mode={page} onOpen={openWorkHref} /> : role === 'pro' && page === 'plan' ? <ProfessionalPlans professionalName={userName} patient={selected} patients={activePatients} onOpen={openWorkHref} /> : role === 'pro' && page === 'biblioteca' ? <ProfessionalLibrary onOpenHref={openWorkHref} patient={selected} patients={activePatients} onOpenPatient={(id) => { if (selectPatient(id)) navigate('ficha'); }} query={query} onQueryChange={setQuery} onNavigate={navigate} /> : !p ? role === 'pro' && selectedId && activePatients.length > 0 ? <NvState title="Paciente no disponible" description="Elegí un paciente activo del consultorio para abrir su ficha o su plan." /> : role === 'pro' ? firstSteps : <NvState title="Sin pacientes activos" description="Todavía no hay datos para mostrar." /> : pendingModule ? <NvState title={`${pendingModule} · diseño pendiente`} description="El módulo actual sigue disponible en la aplicación. Esta vista todavía no lo reemplaza." /> : page === 'ficha' && role === 'pro' ? <ProfessionalPatientWorkspace professionalName={userName} onOpenHref={openWorkHref} patient={selected!} patients={activePatients} onSelect={selectPatient} onEdit={() => setRecordEditing(true)} onOpen={openOperation} onReview={setReviewLog} onNavigate={navigate} now={now} /> : page === 'diario' && role === 'pro' ? <ShowroomMeals patient={selected!} patients={activePatients} query={query} onSelect={(id) => { selectPatient(id); setDayIndex(-1); }} onReview={setReviewLog} /> : page === 'diario' && role === 'patient' ? <ShowroomPatientDiary patient={p} patientId={p.id} query={query} now={now} onLogMeal={(slot = 'Almuerzo') => setMealSlot(slot)} /> : page === 'recetas' ? <ShowroomHealthyMenu patient={p} query={query} onNavigate={navigate} role={role} /> : page === 'recursos' ? <ShowroomResources professional={role === 'pro'} patientId={p.id} query={query} onQueryChange={setQuery} assignments={selected?.resource_assignments} onNavigate={navigate} onMarkRead={role === 'patient' ? markResourceRead : undefined} /> : page === 'plan' && role === 'pro' ? <ShowroomMealPlan patient={selected!} patients={activePatients} query={query} now={now} onSelect={(id) => { selectPatient(id); setDayIndex(-1); }} onChanged={addPatient} /> : page === 'plan' && role === 'patient' ? <ShowroomPatientPlan patient={p} now={now} query={query} onShopping={() => navigate('compras')} /> : page === 'consultas' && role === 'pro' ? <ShowroomConsultations patient={selected!} patients={activePatients} now={now} onSelect={(id) => { selectPatient(id); setDayIndex(-1); }} onChanged={addPatient} /> : page === 'agenda' && role === 'pro' ? <ShowroomAgenda patients={activePatients} now={now} focusPatient={selected} onManage={(id) => { if (selectPatient(id)) navigate('consultas'); }} onNavigatePatient={(id, target) => { if (selectPatient(id)) navigate(target === 'consultas' ? 'consultas' : target); }} /> : isWorkCenterPage(page) && role === 'pro' ? <ShowroomWorkCenter module={page} patients={activePatients} now={now} onOpenPatient={(id) => { if (selectPatient(id)) navigate('ficha'); }} onOpenMeals={(id) => { if (selectPatient(id)) navigate('diario'); }} onOpenConsultations={(id) => { selectPatient(id); navigate('consultas'); }} /> : page === 'objetivos' && role === 'pro' ? <ShowroomGoals patient={selected!} patients={activePatients} onSelect={(id) => { selectPatient(id); setDayIndex(-1); }} onChanged={addPatient} onOpenPatient={(id) => { selectPatient(id); navigate('ficha'); }} /> : page === 'pacientes' ? <ShowroomPatients patients={patients} query={query} initialAction={directoryAction} onActionConsumed={() => setDirectoryAction(null)} onChanged={addPatient} onFollow={(id) => openOperation(followFromDirectory(id))} onRecord={(id) => openOperation({ module: 'fichas', patientId: id, tab: 'resumen' })} onPlan={(id) => openOperation({ module: 'fichas', patientId: id, tab: 'plan' })} /> : page === 'inicio' ? <>{role === 'patient' && <PatientFeeNotice patientId={p.id} onOpen={() => navigate('pagos')} />}<PatientOverview patient={p} onNavigate={navigate} audience={role === 'pro' ? 'professional' : 'patient'} /></> : page === 'progreso' ? <ShowroomProgress patient={p} professional={role === 'pro'} /> : page === 'ejercicio' ? <ShowroomExercise patient={p} now={now} professional={role === 'pro'} /> : page === 'compras' ? <ShowroomGrocery patient={p} readOnly={role === 'pro'} /> : page === 'agenda' && role === 'patient' ? <ShowroomPatientAgenda patient={p} now={now} onMessage={() => navigate('mensajes')} onNavigate={navigate} onReschedule={rescheduleAppointment} onConfirm={confirmAppointment} /> : <ShowroomDetail page={page} patient={p} query={query} />}
          </>}
          {!(compactHeader && page === 'inicio') && footer}
        </main>

        {compactHeader && page === 'inicio' && footer}
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
    {privacyOpen && selected && role === 'patient' && <ShowroomPrivacy patientId={selected.id} onClose={() => setPrivacyOpen(false)} onDeleted={() => { setPrivacyOpen(false); onSignOut?.(); }} />}
    {recordEditing && selected && <ShowroomPatientEdit patient={selected} onClose={() => setRecordEditing(false)} onSaved={(updated) => { addPatient(updated); setRecordEditing(false); }} />}
    {reviewLog && selected && <div className="modal-backdrop review-backdrop"><MealReviewPanel patient={selected} log={reviewLog} onClose={() => setReviewLog(null)} /></div>}
    {mealSlot && selected && role === 'patient' && <MealLogModal key={`${selected.id}:${mealSlot}`} patient={selected} defaultSlot={mealSlot} close={() => setMealSlot(null)} />}
  </div></FigmaDetailContext.Provider>;
}
