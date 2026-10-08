import type { ShowroomPage } from './ShowroomPanels';
import { PATIENT_SURFACES, PRO_HIDDEN_PAGES, PRO_SURFACES } from './showroom-nav';

export type AppRole = 'patient' | 'pro';
/** La primera alta cambia la selección, pero conserva el formulario y su enlace del directorio. */
export function contentIdentity(role:AppRole,page:ShowroomPage,patientId?:string) {
  return `${role}:${page}:${page==='modelos'?'catalogo':page==='pacientes'?'directorio':patientId??''}`;
}

export const PATIENT_PAGES: ShowroomPage[] = [...PATIENT_SURFACES.map((item) => item.id), 'ficha'];
export const PRO_PAGES: ShowroomPage[] = [...PRO_SURFACES.map((item) => item.id), ...PRO_HIDDEN_PAGES];

const PAGES: Record<AppRole, Set<ShowroomPage>> = {
  patient: new Set(PATIENT_PAGES),
  pro: new Set(PRO_PAGES),
};

export function surfaceFor(role: AppRole): 'app' | 'crm' {
  return role === 'patient' ? 'app' : 'crm';
}

export function roleFromSurface(surface: 'app' | 'crm'): AppRole {
  return surface === 'crm' ? 'pro' : 'patient';
}

export function isAllowedPage(role: AppRole, page: string): page is ShowroomPage {
  return PAGES[role].has(page as ShowroomPage);
}

export function appPath(role: AppRole, page: ShowroomPage): string {
  const safe = isAllowedPage(role, page) ? page : 'inicio';
  return `/${surfaceFor(role)}/${safe}`;
}

export function parseAppPath(pathname: string): { surface: 'app' | 'crm'; page: string } | null {
  const match = /^\/(app|crm)(?:\/([^/?#]+))?\/?$/.exec(pathname);
  if (!match) return null;
  return { surface: match[1] as 'app' | 'crm', page: match[2] ?? 'inicio' };
}

export function isAdminPath(pathname: string): boolean {
  return /^\/admin\/?$/.test(pathname);
}

export function hasResourceHash(hash: string): boolean {
  return /^#recurso=/.test(hash);
}

export type LocationInput = {
  pathname: string;
  hash?: string;
  lockedRole?: AppRole | null;
};

export type ResolvedLocation = {
  role: AppRole;
  page: ShowroomPage;
  path: string;
  replace: boolean;
};

function pageFor(role: AppRole, token: string, recurso: boolean): ShowroomPage {
  if (role === 'pro') {
    if (recurso || token === 'recetas' || token === 'recursos' || token === 'guardado') return 'biblioteca';
    if (token === 'reciente' || token === 'paneles') return 'inicio';
    if (token === 'videollamadas') return 'agenda';
  }
  if (recurso && isAllowedPage(role, 'recursos')) return 'recursos';
  return isAllowedPage(role, token) ? token : 'inicio';
}

export function resolveAppLocation(input: LocationInput): ResolvedLocation {
  const locked = input.lockedRole ?? null;
  // /admin abre el Panel del servicio (la pantalla misma verifica que sea administrador).
  const parsed = isAdminPath(input.pathname) ? { surface: 'crm' as const, page: 'servicio' } : parseAppPath(input.pathname);
  const recurso = hasResourceHash(input.hash ?? '');
  const role = locked ?? (parsed ? roleFromSurface(parsed.surface) : 'patient');
  const surfaceOk = !locked || !parsed || parsed.surface === surfaceFor(role);
  const token = surfaceOk ? (parsed?.page ?? 'inicio') : 'inicio';
  const page = pageFor(role, token, recurso && surfaceOk);
  const path = appPath(role, page);
  return { role, page, path, replace: input.pathname !== path };
}

export function buildAppHref(originHref: string, role: AppRole, page: ShowroomPage, options?: { keepHash?: boolean }): string {
  const url = new URL(originHref);
  url.pathname = appPath(role, page);
  url.searchParams.delete('design');
  if (role === 'patient') url.searchParams.delete('paciente');
  if (!options?.keepHash) url.hash = '';
  if (role === 'pro') {
    if (page !== 'ficha') url.searchParams.delete('seccion');
    if (page !== 'plan') url.searchParams.delete('propuesta');
    if (page !== 'biblioteca') url.searchParams.delete('biblioteca');
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
