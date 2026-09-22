import { NUTRIGO_SURFACES, type NutrigoSurfaceId } from './nutrigo-surfaces';

/** Facu, 2026-09-22: "exacto al .fig, copy en espanol".
 *  Layout AND skin come from the pack. The earlier Plan V pastel deviation is withdrawn.
 *  Hexes are sampled pixel-wise from design/nutrigo-exports/, not estimated.
 *  Canonical note: design/nutrigo-fidelity.md. Figma MCP was not used (OAuth 403). */
export const NV_VISUAL_LAW = {
  colors: ['verde', 'lima-claro', 'ambar', 'naranja', 'carbon'] as const,
  accent: '#C2E66E',
  accentSoft: '#DFF9A2',
  gold: '#FFCB65',
  coral: '#FFA257',
  ink: '#272932',
  muted: '#8F9195',
  bg: '#F9F4F2',
  border: '#EEEEEF',
  type: 'Poppins',
  notType: ['Inter', 'Fraunces'] as const,
  copyLanguage: 'es' as const,
  cardRadius: [16, 24] as const,
  nav: 'pill',
  qaDir: 'design/nutrigo-exports',
  law: 'design/nutrigo-fidelity.md',
  figmaFileKey: 'OTolnKfsxUFjaZOhhdb04i',
  figmaUrl: 'https://www.figma.com/design/OTolnKfsxUFjaZOhhdb04i/Nutrigo---Nutrition---Diet-Dashboard',
  excludedSurface: 'exercise' as const satisfies NutrigoSurfaceId,
};

/** Eleven fidelity screens. Exercise stays in the product and out of this pass. */
export const NUTRIGO_FIDELITY_SURFACES = NUTRIGO_SURFACES.filter(
  (surface) => surface.id !== NV_VISUAL_LAW.excludedSurface,
);

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

/** Desktop PNGs from Figma Cloud OTolnKfsxUFjaZOhhdb04i. Not Facu visual approval. */
export const NUTRIGO_REFERENCE_PNGS = {
  dashboard: 'design/nutrigo-exports/01-dashboard.png',
  calendar: 'design/nutrigo-exports/02-calendar.png',
  messages: 'design/nutrigo-exports/03-messages.png',
  'healthy-menu': 'design/nutrigo-exports/04-healthy-menu.png',
  'recipe-details': 'design/nutrigo-exports/05-recipe-details.png',
  'meal-plan': 'design/nutrigo-exports/06-meal-plan.png',
  grocery: 'design/nutrigo-exports/07-grocery.png',
  'food-diary': 'design/nutrigo-exports/08-food-diary.png',
  progress: 'design/nutrigo-exports/09-progress.png',
  insights: 'design/nutrigo-exports/10-insight.png',
  'insight-details': 'design/nutrigo-exports/11-insight-details.png',
} as const satisfies Record<Exclude<NutrigoSurfaceId, 'exercise'>, string>;

export const NUTRIGO_REFERENCE_PNG_MISSING: readonly NutrigoSurfaceId[] = [];
