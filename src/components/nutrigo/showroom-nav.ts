import type { IconName } from '../shared/Icon';
import type { ShowroomPage } from './ShowroomPanels';

export type ShellTab = { id: ShowroomPage; icon: IconName; label: string };

/** Destinos de primer nivel del pack Nutrigo (detalle de receta y de guía se abren dentro). */
export const PATIENT_SURFACES: ShellTab[] = [
  { id: 'inicio', icon: 'home', label: 'Inicio' },
  { id: 'agenda', icon: 'calendar', label: 'Agenda' },
  { id: 'mensajes', icon: 'message', label: 'Mensajes' },
  { id: 'recetas', icon: 'leaf', label: 'Menú' },
  { id: 'plan', icon: 'list', label: 'Plan' },
  { id: 'compras', icon: 'check', label: 'Compras' },
  { id: 'diario', icon: 'history', label: 'Diario' },
  { id: 'progreso', icon: 'trend', label: 'Progreso' },
  { id: 'ejercicio', icon: 'heart', label: 'Ejercicio' },
  { id: 'recursos', icon: 'pin', label: 'Recursos' },
];

/** El grupo desplegable del Navbar (84:2994): Meal Plan abre Meal Plan y Grocery List. */
export const PLAN_SUBPAGES: ShellTab[] = [
  { id: 'plan', icon: 'list', label: 'Plan semanal' },
  { id: 'compras', icon: 'check', label: 'Compras' },
];

export const PATIENT_TABS: ShellTab[] = [
  { id: 'inicio', icon: 'home', label: 'Inicio' },
  { id: 'plan', icon: 'list', label: 'Plan' },
  { id: 'diario', icon: 'history', label: 'Diario' },
  { id: 'mensajes', icon: 'message', label: 'Mensajes' },
];

export const PATIENT_MORE: ShellTab[] = PATIENT_SURFACES.filter((surface) => !PATIENT_TABS.some((tab) => tab.id === surface.id));

export const PRO_TABS: ShellTab[] = [
  { id: 'inicio', icon: 'home', label: 'Inicio' },
  { id: 'pacientes', icon: 'users', label: 'Pacientes' },
  { id: 'diario', icon: 'history', label: 'Diario' },
  { id: 'agenda', icon: 'calendar', label: 'Agenda' },
];

/** Menú del nutricionista: primero los destinos que dibuja la Navbar del archivo (12:793), en su orden; después las pantallas propias de Plan V. */
export const PRO_SURFACES: ShellTab[] = [
  { id: 'inicio', icon: 'home', label: 'Inicio' },
  { id: 'agenda', icon: 'calendar', label: 'Agenda' },
  { id: 'mensajes', icon: 'message', label: 'Mensajes' },
  { id: 'recetas', icon: 'leaf', label: 'Menú' },
  { id: 'plan', icon: 'list', label: 'Plan' },
  { id: 'compras', icon: 'check', label: 'Compras' },
  { id: 'diario', icon: 'history', label: 'Diario' },
  { id: 'progreso', icon: 'trend', label: 'Progreso' },
  { id: 'ejercicio', icon: 'heart', label: 'Ejercicio' },
  { id: 'recursos', icon: 'pin', label: 'Recursos' },
  { id: 'pacientes', icon: 'users', label: 'Pacientes' },
  { id: 'ficha', icon: 'contact', label: 'Ficha' },
  { id: 'consultas', icon: 'video', label: 'Consultas' },
  { id: 'objetivos', icon: 'target', label: 'Objetivos' },
  { id: 'seguimiento', icon: 'sparkle', label: 'Seguimiento' },
];

export const PRO_MORE: ShellTab[] = PRO_SURFACES.filter((surface) => !PRO_TABS.some((tab) => tab.id === surface.id));

/** Siguen abriendo por enlace directo, fuera del menú. */
export const PRO_HIDDEN_PAGES: ShowroomPage[] = ['reciente', 'guardado', 'paneles', 'videollamadas'];

export const PATIENT_CRM_PAGES: ShowroomPage[] = ['ficha', 'pacientes', 'consultas', 'objetivos', 'reciente', 'guardado', 'seguimiento', 'paneles', 'videollamadas'];

export function tabBarState(page: ShowroomPage, tabs: ShellTab[], more: ShellTab[]) {
  const onPrimary = tabs.some((tab) => tab.id === page);
  const onMore = more.some((tab) => tab.id === page);
  return { onPrimary, onMore, moreCurrent: !onPrimary && onMore };
}
