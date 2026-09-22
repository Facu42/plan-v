import { NUTRIGO_SURFACES, type NutrigoSurfaceId } from './nutrigo-surfaces';

/** Inventory rail widths at 1440. Not Facu visual approval. */
export const NUTRIGO_FIDELITY_RAILS = {
  dashboard: 325,
  calendar: 325,
  'healthy-menu': 345,
  insights: 305,
} as const;

export const NUTRIGO_NO_GLOBAL_RAIL: readonly NutrigoSurfaceId[] = [
  'messages',
  'recipe-details',
  'meal-plan',
  'grocery',
  'food-diary',
  'progress',
  'exercise',
  'insight-details',
];

export const NUTRIGO_FIDELITY_NOT_VISUAL_APPROVAL =
  'NV-FIDELITY shell contracts are not Facu visual approval. PLANV_NUTRIGO_VISUAL stays unset.';

/** The .fig lives on Facu’s PC. This clone has the inventory, not kit PNG exports. */
export const NUTRIGO_REFERENCE_PNG_MISSING: readonly NutrigoSurfaceId[] =
  NUTRIGO_SURFACES.map((surface) => surface.id);
