/** Columnas del directorio de pacientes que la profesional puede mostrar u ocultar, y la densidad de las filas. */
export const DIRECTORY_COLUMNS = [
  { id: 'status', label: 'Estado', width: 'minmax(115px,.8fr)' },
  { id: 'focus', label: 'Próximo foco', width: 'minmax(140px,.9fr)' },
  { id: 'weekly', label: 'Registro semanal', width: 'minmax(155px,1fr)' },
  { id: 'lastVisit', label: 'Última consulta', width: 'minmax(120px,.8fr)' },
  { id: 'connection', label: 'Conexión', width: 'minmax(120px,.8fr)' },
] as const;
export type DirectoryColumnId = (typeof DIRECTORY_COLUMNS)[number]['id'];
export type DirectoryDensity = 'comfortable' | 'compact';

export interface DirectoryLayout { hidden: DirectoryColumnId[]; density: DirectoryDensity }
/** Las columnas sumadas después del diseño original arrancan ocultas; se activan desde «Columnas y densidad». */
export const DEFAULT_DIRECTORY_LAYOUT: DirectoryLayout = { hidden: ['lastVisit', 'connection'], density: 'comfortable' };
export const DIRECTORY_LAYOUT_KEY = 'plan-v:directorio:columnas';

const PATIENT_WIDTH = 'minmax(180px,1.2fr)';
const ACTIONS_WIDTH = 'minmax(225px,1.35fr)';

export function isColumnVisible(layout: DirectoryLayout, id: DirectoryColumnId) {
  return !layout.hidden.includes(id);
}

/** Paciente y Acciones siempre están; el resto según lo elegido. */
export function directoryGridTemplate(layout: DirectoryLayout): string {
  const middle = DIRECTORY_COLUMNS.filter((column) => isColumnVisible(layout, column.id)).map((column) => column.width);
  return [PATIENT_WIDTH, ...middle, ACTIONS_WIDTH].join(' ');
}

export function toggleDirectoryColumn(layout: DirectoryLayout, id: DirectoryColumnId): DirectoryLayout {
  const hidden = layout.hidden.includes(id) ? layout.hidden.filter((item) => item !== id) : [...layout.hidden, id];
  return { ...layout, hidden };
}

/** Lee lo guardado en el navegador; cualquier dato raro vuelve a lo de siempre. */
export function parseDirectoryLayout(raw: string | null): DirectoryLayout {
  if (!raw) return DEFAULT_DIRECTORY_LAYOUT;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return DEFAULT_DIRECTORY_LAYOUT;
    const { hidden, density } = value as { hidden?: unknown; density?: unknown };
    const known = new Set<string>(DIRECTORY_COLUMNS.map((column) => column.id));
    return {
      hidden: Array.isArray(hidden) ? [...new Set(hidden.filter((id): id is DirectoryColumnId => typeof id === 'string' && known.has(id)))] : DEFAULT_DIRECTORY_LAYOUT.hidden,
      density: density === 'compact' ? 'compact' : 'comfortable',
    };
  } catch { return DEFAULT_DIRECTORY_LAYOUT; }
}

export function loadDirectoryLayout(storage: Pick<Storage, 'getItem'> | null = typeof window === 'undefined' ? null : window.localStorage): DirectoryLayout {
  try { return parseDirectoryLayout(storage?.getItem(DIRECTORY_LAYOUT_KEY) ?? null); } catch { return DEFAULT_DIRECTORY_LAYOUT; }
}
export function saveDirectoryLayout(layout: DirectoryLayout, storage: Pick<Storage, 'setItem'> | null = typeof window === 'undefined' ? null : window.localStorage) {
  try { storage?.setItem(DIRECTORY_LAYOUT_KEY, JSON.stringify(layout)); } catch { /* La elección sigue activa durante esta visita. */ }
}
