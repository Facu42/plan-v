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

export const PRO_MORE: ShellTab[] = [
  { id: 'ficha', icon: 'contact', label: 'Ficha' },
  { id: 'plan', icon: 'list', label: 'Plan' },
  { id: 'consultas', icon: 'video', label: 'Consultas' },
  { id: 'objetivos', icon: 'target', label: 'Objetivos' },
  { id: 'progreso', icon: 'trend', label: 'Progreso' },
  { id: 'ejercicio', icon: 'heart', label: 'Ejercicio' },
  { id: 'mensajes', icon: 'message', label: 'Mensajes' },
  { id: 'reciente', icon: 'history', label: 'Reciente' },
  { id: 'guardado', icon: 'pin', label: 'Guardado' },
  { id: 'seguimiento', icon: 'sparkle', label: 'Seguimiento' },
  { id: 'paneles', icon: 'grid', label: 'Paneles' },
  { id: 'videollamadas', icon: 'video', label: 'Videollamadas' },
];

export const PATIENT_CRM_PAGES: ShowroomPage[] = ['ficha', 'pacientes', 'consultas', 'objetivos', 'reciente', 'guardado', 'seguimiento', 'paneles', 'videollamadas'];

export function tabBarState(page: ShowroomPage, tabs: ShellTab[], more: ShellTab[]) {
  const onPrimary = tabs.some((tab) => tab.id === page);
  const onMore = more.some((tab) => tab.id === page);
  return { onPrimary, onMore, moreCurrent: !onPrimary && onMore };
}
