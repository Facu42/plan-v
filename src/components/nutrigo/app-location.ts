import type { ShowroomPage } from './ShowroomPanels';
import { PATIENT_SURFACES, PRO_HIDDEN_PAGES, PRO_SURFACES } from './showroom-nav';

export type AppRole = 'patient' | 'pro';

export const PATIENT_PAGES: ShowroomPage[] = PATIENT_SURFACES.map((item) => item.id);
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
  if (recurso && isAllowedPage(role, 'recursos')) return 'recursos';
  return isAllowedPage(role, token) ? token : 'inicio';
}

export function resolveAppLocation(input: LocationInput): ResolvedLocation {
  const locked = input.lockedRole ?? null;
  const parsed = parseAppPath(input.pathname);
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
  if (!options?.keepHash) url.hash = '';
  return `${url.pathname}${url.search}${url.hash}`;
}
