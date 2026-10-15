import { lazy, Suspense, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import type { ShowroomPage } from '../nutrigo/ShowroomPanels';
import type { ShowroomPatient } from '../nutrigo/showroom-model';
import { FigmaDashboardProvider } from './FigmaDashboardMetrics';
import type { DashboardHabitPatch } from './FigmaDashboardCheckIn';
import { FigmaCalendarProvider } from './FigmaCalendar';
import { FigmaMealPlanProvider } from './FigmaMealPlan';
import { FigmaMessagesProvider } from './FigmaMessages';
import { FigmaHealthyMenuProvider } from './FigmaHealthyMenu';
import { FigmaFoodDiaryProvider } from './FigmaFoodDiary';
import { FigmaProgressProvider } from './FigmaProgress';
import { FigmaExerciseDialog, FigmaExerciseProvider } from './FigmaExercise';
import { FigmaInsightsProvider } from './FigmaInsights';
import { buildResourceShareUrl, resourceGuideIdFromHash } from '../nutrigo/ShowroomResources';
import type { ResourceAssignment } from '../../types';
import { FigmaPatientIdentity } from './FigmaPatientIdentity';
import { figmaFrameDimensions } from './frame-dimensions';
import './figma-pack.css';
import './figma-patient-actions.css';
import './figma-fidelity.css';

const screens = {
  Dashboard: lazy(() => import('./screens/Dashboard')),
  DashboardTablet: lazy(() => import('./screens/DashboardTablet')),
  DashboardMobile: lazy(() => import('./screens/DashboardMobile')),
  Calendar: lazy(() => import('./screens/Calendar')),
  CalendarTablet: lazy(() => import('./screens/CalendarTablet')),
  CalendarMobile: lazy(() => import('./screens/CalendarMobile')),
  Messages: lazy(() => import('./screens/Messages')),
  MessagesTablet: lazy(() => import('./screens/MessagesTablet')),
  MessagesMobile: lazy(() => import('./screens/MessagesMobile')),
  HealthyMenu: lazy(() => import('./screens/HealthyMenu')),
  HealthyMenuTablet: lazy(() => import('./screens/HealthyMenuTablet')),
  HealthyMenuMobile: lazy(() => import('./screens/HealthyMenuMobile')),
  RecipeDetails: lazy(() => import('./screens/RecipeDetails')),
  RecipeDetailsTablet: lazy(() => import('./screens/RecipeDetailsTablet')),
  RecipeDetailsMobile: lazy(() => import('./screens/RecipeDetailsMobile')),
  MealPlan: lazy(() => import('./screens/MealPlan')),
  MealPlanTablet: lazy(() => import('./screens/MealPlanTablet')),
  MealPlanMobile: lazy(() => import('./screens/MealPlanMobile')),
  GroceryList: lazy(() => import('./screens/GroceryList')),
  GroceryListTablet: lazy(() => import('./screens/GroceryListTablet')),
  GroceryListMobile: lazy(() => import('./screens/GroceryListMobile')),
  FoodDiary: lazy(() => import('./screens/FoodDiary')),
  FoodDiaryTablet: lazy(() => import('./screens/FoodDiaryTablet')),
  FoodDiaryMobile: lazy(() => import('./screens/FoodDiaryMobile')),
  Progress: lazy(() => import('./screens/Progress')),
  ProgressTablet: lazy(() => import('./screens/ProgressTablet')),
  ProgressMobile: lazy(() => import('./screens/ProgressMobile')),
  Exercise: lazy(() => import('./screens/Exercise')),
  ExerciseTablet: lazy(() => import('./screens/ExerciseTablet')),
  ExerciseMobile: lazy(() => import('./screens/ExerciseMobile')),
  Insights: lazy(() => import('./screens/Insights')),
  InsightsTablet: lazy(() => import('./screens/InsightsTablet')),
  InsightsMobile: lazy(() => import('./screens/InsightsMobile')),
  InsightDetails: lazy(() => import('./screens/InsightDetails')),
  InsightDetailsTablet: lazy(() => import('./screens/InsightDetailsTablet')),
  InsightDetailsMobile: lazy(() => import('./screens/InsightDetailsMobile')),
} as const;
type ScreenName = keyof typeof screens;
type Detail = 'recipe' | 'insight' | null;
type Variant = '' | 'Tablet' | 'Mobile';

const navItems: { label: string; page: ShowroomPage }[] = [
  { label: 'Inicio', page: 'inicio' },
  { label: 'Calendario', page: 'agenda' },
  { label: 'Mensajes', page: 'mensajes' },
  { label: 'Menú saludable', page: 'recetas' },
  { label: 'Plan de comidas', page: 'plan' },
  { label: 'Diario de comidas', page: 'diario' },
  { label: 'Progreso', page: 'progreso' },
  { label: 'Ejercicios', page: 'ejercicio' },
  { label: 'Consejos de salud', page: 'recursos' },
];
const pageScreen: Partial<Record<ShowroomPage, string>> = {
  inicio: 'Dashboard', agenda: 'Calendar', mensajes: 'Messages',
  recetas: 'HealthyMenu', plan: 'MealPlan', compras: 'GroceryList',
  diario: 'FoodDiary', progreso: 'Progress', ejercicio: 'Exercise',
  recursos: 'Insights',
};
const getVariant = (): Variant => {
  if (typeof window === 'undefined') return '';
  return window.innerWidth < 700 ? 'Mobile' : window.innerWidth < 1100 ? 'Tablet' : '';
};
const getViewport = () => typeof window === 'undefined'
  ? { width: 1440, height: 900 }
  : { width: window.innerWidth, height: window.innerHeight };

function headerIconKind(item: Element): 'search' | 'messages' | 'account' | 'back' | null {
  if (item.closest('[data-name="User Profile"]')) return 'account';
  const id = item.getAttribute('data-node-id') ?? '';
  if (/(?:453:12781)$/.test(id)) return 'back';
  if (/(?:2:4463|2:4478|418:13854|453:12768)$/.test(id)) return 'search';
  if (/(?:2:4464|2:4479|33:1659|418:13855|453:12769)$/.test(id)) return 'messages';
  return null;
}

export function FigmaPatientScreens({
  page, patient, now, resourceAssignments, demoMode = false, onNavigate, onConfirmAppointment, onRescheduleAppointment, onLogActivity, onUpdateHabits, onLogMeal, onMarkResourceRead, onSignOut,
}: {
  page: ShowroomPage;
  patient: ShowroomPatient;
  now?: Date;
  resourceAssignments?: ResourceAssignment[];
  demoMode?: boolean;
  onNavigate: (page: ShowroomPage) => void;
  onConfirmAppointment?: (reply: 'attending' | 'needs_change') => Promise<void> | void;
  onRescheduleAppointment?: (day: string, time: string) => Promise<void> | void;
  onLogActivity?: (entry: { activity: string; duration_minutes: number; intensity: 'suave' | 'moderada' | 'intensa'; note?: string }) => Promise<void> | void;
  onUpdateHabits?: (patch: DashboardHabitPatch) => Promise<void>;
  onLogMeal?: (slot?: string) => void;
  onMarkResourceRead?: (resourceId: string) => Promise<void>;
  onSignOut?: () => void;
}) {
  const [variant, setVariant] = useState<Variant>(getVariant);
  const [viewport, setViewport] = useState(getViewport);
  const [calendarRows, setCalendarRows] = useState(5);
  const initialInsightId = page === 'recursos' && typeof window !== 'undefined' ? resourceGuideIdFromHash(window.location.hash) : null;
  const [detail, setDetail] = useState<Detail>(initialInsightId ? 'insight' : null);
  const [selectedInsightId, setSelectedInsightId] = useState<string | null>(initialInsightId);
  const [selectedMenuKey, setSelectedMenuKey] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const previousPage = useRef(page);
  const rootRef = useRef<HTMLDivElement>(null);
  const base = detail === 'recipe' ? 'RecipeDetails' : detail === 'insight' ? 'InsightDetails' : pageScreen[page] ?? 'Dashboard';
  const screenName = `${base}${variant}` as ScreenName;
  const Screen = screens[screenName] ?? screens.Dashboard;
  const frame = figmaFrameDimensions[screenName];
  const frameHeight = frame.height + (base === 'Calendar' ? (calendarRows - 5) * 120 : 0);
  const scale = Math.min(1, viewport.width / frame.width, variant === '' ? viewport.height / figmaFrameDimensions.Dashboard.height : 1);
  useEffect(() => {
    const update = () => { setVariant(getVariant()); setViewport(getViewport()); };
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  useEffect(() => { if (previousPage.current === page) return; previousPage.current = page; setDetail(null); setSelectedMenuKey(null); setSelectedInsightId(null); setMenuOpen(false); setSearchOpen(false); setAccountOpen(false); }, [page]);
  useEffect(() => {
    if (page !== 'recursos') return;
    const sync = () => { const id = resourceGuideIdFromHash(window.location.hash); setSelectedInsightId(id); setDetail(id ? 'insight' : null); };
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => { window.removeEventListener('popstate', sync); window.removeEventListener('hashchange', sync); };
  }, [page]);
  useEffect(() => {
    if (!menuOpen && !searchOpen && !accountOpen) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); setSearchOpen(false); setAccountOpen(false); }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen, searchOpen, accountOpen]);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const makeNavAccessible = () => {
      root.querySelectorAll<HTMLElement>('[data-name="Button Icon"]').forEach((item) => {
        const kind = headerIconKind(item);
        if (!kind) return;
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', kind === 'search' ? 'Buscar secciones' : kind === 'messages' ? 'Abrir mensajes' : kind === 'back' ? 'Volver' : 'Abrir cuenta');
        if (kind === 'search' || kind === 'account') item.setAttribute('aria-expanded', String(kind === 'search' ? searchOpen : accountOpen));
        item.classList.add('figma-notification-button');
      });
      root.querySelectorAll<HTMLElement>('[data-node-id="2:4491"][data-name="Input-search"]').forEach((item) => {
        item.setAttribute('role', 'button');
        item.tabIndex = 0;
        item.setAttribute('aria-label', 'Buscar secciones');
        item.setAttribute('aria-expanded', String(searchOpen));
        item.classList.add('figma-header-search');
      });
      root.querySelectorAll<HTMLElement>('[data-name="Back Button"]').forEach((item) => {
        if (!detail) return;
        item.setAttribute('role', 'button'); item.tabIndex = 0;
        item.setAttribute('aria-label', 'Volver');
        item.classList.add('figma-detail-back');
      });
      root.querySelectorAll<HTMLElement>('[data-name="Promotional Banner"] [data-name="Button"]').forEach((item) => {
        item.setAttribute('role', 'button');
        item.tabIndex = 0;
        item.setAttribute('aria-label', 'Enviar mensaje a la nutricionista');
        item.classList.add('figma-promo-action');
      });
      const moreDestinations: { container: string; page: ShowroomPage; label: string }[] = [
        { container: 'Widget Weight Data', page: 'progreso', label: 'Abrir progreso' },
        { container: 'Widget Calories Intake', page: 'diario', label: 'Abrir diario de comidas' },
        { container: 'Widget Recommended Menu', page: 'recetas', label: 'Abrir menú saludable' },
        { container: 'Widget Recommended Exercises', page: 'ejercicio', label: 'Abrir ejercicios' },
        { container: 'Section Recent Activity', page: 'agenda', label: 'Abrir calendario' },
        { container: 'Section Meal Plan', page: 'plan', label: 'Abrir plan de comidas' },
      ];
      root.querySelectorAll<HTMLElement>('[data-name="Button More"]').forEach((item) => {
        if (item.closest('[role="button"], button')) return;
        const destination = moreDestinations.find(({ container }) => item.closest(`[data-name="${container}"]`));
        if (!destination) return;
        item.setAttribute('role', 'button'); item.tabIndex = 0;
        item.setAttribute('aria-label', destination.label);
        item.dataset.figmaPage = destination.page;
        item.classList.add('figma-section-more');
      });
      root.querySelectorAll<HTMLElement>('[data-name="Button Nav"]').forEach((item) => {
        item.setAttribute('role', 'button');
        item.tabIndex = 0;
        if (variant === 'Mobile') {
          const back = item.querySelector('[data-name="Icon/ArrowLeft"]');
          item.setAttribute('aria-label', back ? 'Volver' : 'Abrir navegación');
          if (!back) item.setAttribute('aria-expanded', String(menuOpen));
        } else if (item.parentElement?.getAttribute('data-name') === 'Menu Nav') {
          const entries = [...item.parentElement.querySelectorAll(':scope > [data-name="Button Nav"]')];
          const destination = navItems[entries.indexOf(item)];
          if (destination) {
            item.setAttribute('aria-label', destination.label);
            if (page === destination.page) item.setAttribute('aria-current', 'page');
          }
        } else if (/;(?:2:4519|408:17363)$/.test(item.getAttribute('data-node-id') ?? '')) {
          item.setAttribute('aria-label', 'Cerrar sesión');
        }
      });
      root.querySelectorAll<HTMLElement>('[data-name="SubMenu"]').forEach((item) => {
        const items = item.parentElement ? [...item.parentElement.querySelectorAll(':scope > [data-name="SubMenu"]')] : [];
        const index = items.indexOf(item);
        if (index < 0 || index > 1) return;
        item.setAttribute('role', 'button'); item.tabIndex = 0;
        item.setAttribute('aria-label', index === 0 ? 'Plan de comidas' : 'Lista de compras');
        if (page === (index === 0 ? 'plan' : 'compras')) item.setAttribute('aria-current', 'page');
      });
    };
    const observer = new MutationObserver(makeNavAccessible);
    observer.observe(root, { childList: true, subtree: true });
    makeNavAccessible();
    return () => observer.disconnect();
  }, [screenName, variant, menuOpen, detail, searchOpen, accountOpen]);
  const go = (target: ShowroomPage) => {
    setDetail(null);
    setSelectedMenuKey(null);
    setSelectedInsightId(null);
    setMenuOpen(false);
    setSearchOpen(false);
    setAccountOpen(false);
    if (page === 'recursos' && typeof window !== 'undefined' && window.location.hash.startsWith('#recurso=')) { const url = new URL(window.location.href); url.hash = ''; window.history.replaceState(window.history.state, '', url); }
    onNavigate(target);
  };
  const selectInsight = (id: string | null) => {
    setSelectedInsightId(id);
    setDetail(id ? 'insight' : null);
    if (typeof window === 'undefined') return;
    if (id) window.history.pushState({ ...window.history.state, planVResourceOpen: true }, '', buildResourceShareUrl(id, window.location.href));
    else {
      const url = new URL(window.location.href);
      url.hash = '';
      window.history.replaceState(window.history.state, '', url);
    }
  };
  const onScreenClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const headerIcon = target.closest('[data-name="Button Icon"]');
    const iconKind = headerIcon && headerIconKind(headerIcon);
    if (target.closest('.figma-header-search')) { setSearchOpen(true); setAccountOpen(false); return; }
    if (iconKind === 'messages') { go('mensajes'); return; }
    if (iconKind === 'search') { setSearchOpen(true); setAccountOpen(false); return; }
    if (iconKind === 'account') { setAccountOpen((value) => !value); setSearchOpen(false); return; }
    if (iconKind === 'back') { if (detail === 'insight') selectInsight(null); else { setDetail(null); setSelectedMenuKey(null); } return; }
    if (target.closest('[data-name="Promotional Banner"] [data-name="Button"]')) { go('mensajes'); return; }
    const sectionMore = target.closest<HTMLElement>('.figma-section-more');
    if (sectionMore?.dataset.figmaPage) { go(sectionMore.dataset.figmaPage as ShowroomPage); return; }
    const submenu = target.closest('[data-name="SubMenu"]');
    if (submenu) {
      const group = submenu.parentElement;
      const items = group ? [...group.querySelectorAll(':scope > [data-name="SubMenu"]')] : [];
      const index = items.indexOf(submenu);
      if (index === 0) { go('plan'); return; }
      if (index === 1) { go('compras'); return; }
    }
    const nav = target.closest('[data-name="Button Nav"]');
    if (nav) {
      if (variant === 'Mobile') {
        if (nav.querySelector('[data-name="Icon/ArrowLeft"]')) {
          if (detail === 'insight') selectInsight(null);
          else if (detail) { setDetail(null); setSelectedMenuKey(null); }
          else go('inicio');
        } else setMenuOpen(true);
        return;
      }
      const list = nav.parentElement;
      const listName = list?.getAttribute('data-name');
      if (listName === 'Menu Nav') {
        const entries = list ? [...list.querySelectorAll(':scope > [data-name="Button Nav"]')] : [];
        const index = entries.indexOf(nav);
        if (index >= 0 && index < navItems.length) { go(navItems[index].page); return; }
      }
      if (/;(?:2:4519|408:17363)$/.test(nav.getAttribute('data-node-id') ?? '')) { onSignOut?.(); return; }
    }
    if (detail && target.closest('[data-name="Back Button"]')) {
      if (detail === 'insight') selectInsight(null);
      else { setDetail(null); setSelectedMenuKey(null); }
      return;
    }
  };

  const onScreenKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.key === 'Enter' || event.key === ' ') && (event.target as HTMLElement).matches('[data-name="Button Nav"], [data-name="SubMenu"], .figma-header-search, .figma-notification-button, .figma-promo-action, .figma-section-more, .figma-detail-back')) {
      event.preventDefault();
      (event.target as HTMLElement).click();
    }
  };

  return <div ref={rootRef} id="figma-pack-root" className={`figma-screen-host figma-${variant || 'desktop'}`} onClick={onScreenClick} onKeyDown={onScreenKeyDown}>
    <div className="figma-stage" style={{ width: frame.width * scale, height: frameHeight * scale }}>
      <div className="figma-frame" style={{ width: frame.width, height: frameHeight, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <Suspense fallback={<div className="figma-screen-loading" role="status">Cargando pantalla…</div>}>
          <FigmaPatientIdentity patient={patient}>
            {base === 'MealPlan'
              ? <FigmaMealPlanProvider patient={patient} onShopping={() => go('compras')}><Screen /></FigmaMealPlanProvider>
              : base === 'Dashboard'
                ? <FigmaDashboardProvider patient={patient} onNavigate={go} onUpdateHabits={onUpdateHabits}><Screen /></FigmaDashboardProvider>
                : base === 'Calendar'
                  ? <FigmaCalendarProvider patient={patient} onNavigate={go} onRowCount={setCalendarRows} onConfirmAppointment={onConfirmAppointment} onRescheduleAppointment={onRescheduleAppointment} onLogActivity={onLogActivity}><Screen /></FigmaCalendarProvider>
                : base === 'Messages'
                  ? <FigmaMessagesProvider key={patient.id} patient={patient} onNavigate={go}><Screen /></FigmaMessagesProvider>
                : page === 'recetas'
                  ? <FigmaHealthyMenuProvider key={patient.id} patient={patient} demoMode={demoMode} selectedKey={selectedMenuKey} onSelect={(key) => { setSelectedMenuKey(key); setDetail(key ? 'recipe' : null); }} onNavigate={go}><Screen /></FigmaHealthyMenuProvider>
                : base === 'FoodDiary'
                  ? <FigmaFoodDiaryProvider key={patient.id} patient={patient} now={now} onLogMeal={onLogMeal ?? (() => {})}><Screen /></FigmaFoodDiaryProvider>
                : base === 'Progress'
                  ? <FigmaProgressProvider key={patient.id} patient={patient}><Screen /></FigmaProgressProvider>
                : base === 'Exercise'
                  ? <FigmaExerciseProvider key={patient.id} patient={patient} now={now} onLogActivity={onLogActivity ?? (() => {})}><Screen /><FigmaExerciseDialog /></FigmaExerciseProvider>
                : page === 'recursos'
                  ? <FigmaInsightsProvider key={patient.id} patientId={patient.id} assignments={resourceAssignments} selectedId={selectedInsightId} onSelect={selectInsight} onNavigate={go} onMarkRead={onMarkResourceRead}><Screen /></FigmaInsightsProvider>
                : <Screen />}
          </FigmaPatientIdentity>
        </Suspense>
      </div>
    </div>
    {menuOpen && <><button type="button" className="figma-mobile-backdrop" aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} /><div className="figma-mobile-menu" role="dialog" aria-modal="true" aria-label="Secciones del paciente">
      <button type="button" className="figma-mobile-menu-close" onClick={() => setMenuOpen(false)}>Cerrar ×</button>
      {navItems.map((item) => <button type="button" key={item.page} aria-current={page === item.page ? 'page' : undefined} onClick={() => go(item.page)}>{item.label}</button>)}
      <button type="button" aria-current={page === 'compras' ? 'page' : undefined} onClick={() => go('compras')}>Lista de compras</button>
      {onSignOut && <button type="button" onClick={onSignOut}>Cerrar sesión</button>}
    </div></>}
    {searchOpen && <div className="figma-patient-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}><section role="dialog" aria-modal="true" aria-label="Buscar en Plan V" className="figma-patient-action-dialog"><header><h2>Buscar en Plan V</h2><button type="button" onClick={() => setSearchOpen(false)} aria-label="Cerrar búsqueda">×</button></header><input autoFocus type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Buscar una sección" aria-label="Buscar una sección" /><div className="figma-patient-search-results">{[...navItems, { label: 'Lista de compras', page: 'compras' as ShowroomPage }].filter((item) => item.label.toLocaleLowerCase('es-AR').includes(searchQuery.trim().toLocaleLowerCase('es-AR'))).map((item) => <button type="button" key={item.page} onClick={() => go(item.page)}>{item.label}<span>→</span></button>)}</div></section></div>}
    {accountOpen && <div className="figma-patient-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setAccountOpen(false); }}><section role="dialog" aria-modal="true" aria-label="Mi cuenta" className="figma-patient-action-dialog"><header><h2>Mi cuenta</h2><button type="button" onClick={() => setAccountOpen(false)} aria-label="Cerrar cuenta">×</button></header><p>{patient.name}</p><button type="button" onClick={() => go('agenda')}>Mis consultas</button><button type="button" onClick={() => go('mensajes')}>Mis mensajes</button>{onSignOut && <button type="button" onClick={onSignOut}>Cerrar sesión</button>}</section></div>}
  </div>;
}
