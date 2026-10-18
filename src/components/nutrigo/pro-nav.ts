import type { IconName } from '../shared/Icon';
import type { ShowroomPage } from './ShowroomPanels';
import { hasResourceHash } from './app-location';

export type ProNavItem = {
  id: string;
  label: string;
  href: string;
  icon: IconName;
  soon?: boolean;
  current: (page: ShowroomPage, search: URLSearchParams, hash: string) => boolean;
};

export type ProNavGroup = { title: string; items: ProNavItem[] };

const modulo = (search: URLSearchParams, id: string) => search.get('modulo') === id;

/** Gestión, Acompañamiento, Plan y Recursos, en ese orden. Las rutas viejas siguen válidas. */
export const PRO_NAV_GROUPS: ProNavGroup[] = [
  {
    title: 'Gestión',
    items: [
      { id: 'inicio', label: 'Inicio', href: '/crm/inicio', icon: 'home', current: (page) => page === 'inicio' },
      { id: 'pacientes', label: 'Pacientes', href: '/crm/pacientes', icon: 'users', current: (page) => page === 'pacientes' },
      { id: 'agenda', label: 'Agenda', href: '/crm/agenda', icon: 'calendar', current: (page) => page === 'agenda' },
      { id: 'cobranzas', label: 'Cobranzas', href: '/crm/cobranzas', icon: 'wallet', current: (page) => page === 'cobranzas' },
      { id: 'pagina-publica', label: 'Página pública', href: '/crm/desarrollo?modulo=pagina-publica', icon: 'contact', soon: true, current: (page, search) => page === 'desarrollo' && modulo(search, 'pagina-publica') },
    ],
  },
  {
    title: 'Acompañamiento',
    items: [
      { id: 'asistente', label: 'Asistente IA', href: '/crm/desarrollo?modulo=asistente-ia', icon: 'sparkle', current: (page, search) => page === 'desarrollo' && modulo(search, 'asistente-ia') },
      { id: 'seguimiento', label: 'Seguimiento', href: '/crm/seguimiento', icon: 'sparkle', current: (page) => page === 'seguimiento' },
      { id: 'mensajes', label: 'Mensajes', href: '/crm/mensajes', icon: 'message', current: (page) => page === 'mensajes' },
      { id: 'progreso', label: 'Progreso', href: '/crm/progreso-global', icon: 'trend', current: (page) => page === 'progreso-global' },
    ],
  },
  {
    title: 'Plan',
    items: [
      { id: 'planes', label: 'Planes', href: '/crm/plan', icon: 'list', current: (page) => page === 'plan' },
      { id: 'alimentos', label: 'Alimentos', href: '/crm/alimentos', icon: 'leaf', current: (page) => page === 'alimentos' },
      { id: 'recetas', label: 'Recetas', href: '/crm/biblioteca?biblioteca=recetas', icon: 'leaf', current: (page, search, hash) => page === 'biblioteca' && search.get('biblioteca') !== 'recursos' && !hasResourceHash(hash) },
      { id: 'equivalencias', label: 'Equivalencias', href: '/crm/desarrollo?modulo=equivalencias', icon: 'list', current: (page, search) => page === 'desarrollo' && modulo(search, 'equivalencias') },
      { id: 'modelos', label: 'Modelos', href: '/crm/modelos', icon: 'list', current: (page) => page === 'modelos' },
      { id: 'ejercicio', label: 'Ejercicio', href: '/crm/ejercicio', icon: 'heart', current: (page) => page === 'ejercicio' },
    ],
  },
  {
    title: 'Recursos',
    items: [
      { id: 'biblioteca', label: 'Biblioteca', href: '/crm/biblioteca?biblioteca=recursos', icon: 'pin', current: (page, search, hash) => page === 'biblioteca' && (search.get('biblioteca') === 'recursos' || hasResourceHash(hash)) },
      { id: 'ayuda', label: 'Centro de ayuda', href: '/crm/desarrollo?modulo=ayuda', icon: 'message', current: (page, search) => page === 'desarrollo' && modulo(search, 'ayuda') },
    ],
  },
];

export const PRO_MOBILE_IDS = ['inicio', 'pacientes', 'seguimiento', 'agenda'] as const;

export function proNavItems(): ProNavItem[] {
  return PRO_NAV_GROUPS.flatMap((group) => group.items);
}

export function rememberPatient(href: string, patientId?: string | null): string {
  if (!patientId) return href;
  const url = new URL(href, 'https://planv.local');
  if (!url.searchParams.has('paciente')) url.searchParams.set('paciente', patientId);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function proLocation(): { page: ShowroomPage; search: URLSearchParams; hash: string } {
  if (typeof window === 'undefined') return { page: 'inicio', search: new URLSearchParams(), hash: '' };
  const page = window.location.pathname.split('/').filter(Boolean)[1] as ShowroomPage;
  return { page, search: new URLSearchParams(window.location.search), hash: window.location.hash };
}
