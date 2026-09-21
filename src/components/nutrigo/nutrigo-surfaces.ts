import type { ShowroomPage } from './ShowroomPanels';

/** Canonical Nutrigo frame widths. 320 is Plan V extra. Not Facu visual approval. */
export const NUTRIGO_VIEWPORTS = {
  desktop: 1440,
  tablet: 800,
  mobile: 390,
  narrow: 320,
} as const;

export type NutrigoSurfaceId =
  | 'dashboard'
  | 'calendar'
  | 'messages'
  | 'healthy-menu'
  | 'recipe-details'
  | 'meal-plan'
  | 'grocery'
  | 'food-diary'
  | 'progress'
  | 'exercise'
  | 'insights'
  | 'insight-details';

export type NutrigoSurface = {
  id: NutrigoSurfaceId;
  frame: string;
  page: ShowroomPage;
  css: readonly string[];
  emptyTitle: string;
};

/** Twelve Nutrigo patient surfaces. CRM eleven modules stay out of this list. */
export const NUTRIGO_SURFACES: readonly NutrigoSurface[] = [
  { id: 'dashboard', frame: 'Dashboard', page: 'inicio', css: ['patient-dashboard.css', 'nutrigo.css'], emptyTitle: 'Tu plan está en camino' },
  { id: 'calendar', frame: 'Calendar', page: 'agenda', css: ['showroom-patient-agenda.css'], emptyTitle: 'Sin consulta programada' },
  { id: 'messages', frame: 'Messages', page: 'mensajes', css: ['messages.css'], emptyTitle: 'Empezá la conversación' },
  { id: 'healthy-menu', frame: 'Healthy Menu', page: 'recetas', css: ['showroom-healthy-menu.css'], emptyTitle: 'Tu menú está en preparación' },
  { id: 'recipe-details', frame: 'Recipe Details', page: 'recetas', css: ['recipe-catalog.css'], emptyTitle: 'Todavía no hay recetas publicadas para vos' },
  { id: 'meal-plan', frame: 'Meal Plan', page: 'plan', css: ['showroom-patient-plan.css', 'meal-plan-versions.css'], emptyTitle: 'Tu plan está en preparación' },
  { id: 'grocery', frame: 'Grocery List', page: 'compras', css: ['showroom-grocery.css'], emptyTitle: 'Sin lista para generar' },
  { id: 'food-diary', frame: 'Food Diary', page: 'diario', css: ['showroom-patient-diary.css'], emptyTitle: 'Sin registros esta semana' },
  { id: 'progress', frame: 'Progress', page: 'progreso', css: ['showroom-progress.css'], emptyTitle: 'Sin comidas registradas esta semana' },
  { id: 'exercise', frame: 'Exercise', page: 'ejercicio', css: ['showroom-exercise.css'], emptyTitle: 'Todavía no hay una rutina asignada' },
  { id: 'insights', frame: 'Insights', page: 'recursos', css: ['showroom-resources.css'], emptyTitle: 'Sin coincidencias' },
  { id: 'insight-details', frame: 'Insight Details', page: 'recursos', css: ['showroom-resources.css'], emptyTitle: 'Sin coincidencias' },
];

export const NUTRIGO_PARITY_NOT_VISUAL_APPROVAL =
  'PV-37 layout/state contracts are not Facu visual approval.';
