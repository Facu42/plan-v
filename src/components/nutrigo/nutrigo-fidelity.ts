import { NUTRIGO_SURFACES, type NutrigoSurfaceId } from './nutrigo-surfaces';

/** Facu, 2026-09-22: "exacto al .fig, copy en espanol".
 *  Layout AND skin come from the pack. The earlier Plan V pastel deviation is withdrawn.
 *  These values are READ FROM THE FILE over the Figma MCP (node 12:792), not sampled
 *  from a screenshot. The keys are the .fig's own variable names.
 *  Canonical note: design/nutrigo-fidelity.md. */
export const NV_VISUAL_LAW = {
  source: 'figma-mcp' as const,
  colors: {
    Green: '#C2E66E',
    'Green-Light': '#DFF9A2',
    Saffron: '#FFCB65',
    'Saffron-Light': '#FFE6B5',
    Orange: '#FFA257',
    'Orange-10': '#FFE1C9',
    'Green-Subtle': '#EDFFC4',
    'Saffron-Subtle': '#FFEDC9',
    'Orange-Subtle': '#FFF2E8',
    'Green-Dark': '#73A107',
    Black: '#272932',
    Heading: '#212738',
    'Gray-30': '#52545B',
    'Gray-20': '#8A8C90',
    'Gray-10': '#BEBFC2',
    'Gray-Line': '#E1E1E2',
    'Gray-BG': '#EEEEEF',
    'Gray-BG-Subtle': '#F6F6F7',
    'Cream-BG': '#F9F4F2',
    'Pure White': '#FFFFFF',
    White: '#FEFCFB',
  },
  accent: '#C2E66E',
  shadow: '0 4px 12px rgba(176, 176, 176, 0.14)',
  type: 'Poppins',
  notType: ['Inter', 'Fraunces'] as const,
  copyLanguage: 'es' as const,
  /** Escala del archivo: tamano en px -> altura de linea. */
  typeScale: { 26: 1.08, 22: 1.08, 18: 1.2, 16: 1.24, 14: 1.25, 12: 1.3, 11: 1.24 } as const,
  /** Parrafo largo del archivo: 14 a 1.4, distinto del 14 a 1.25 de las etiquetas. */
  paragraphScale: { 14: 1.4, 12: 1.5, 11: 1.6 } as const,
  cardRadius: [16, 24] as const,
  nav: 'pill',
  qaDir: 'design/nutrigo-exports',
  law: 'design/nutrigo-fidelity.md',
  figmaFileKey: 'OTolnKfsxUFjaZOhhdb04i',
  figmaUrl: 'https://www.figma.com/design/OTolnKfsxUFjaZOhhdb04i/Nutrigo---Nutrition---Diet-Dashboard',
  excludedSurface: 'exercise' as const satisfies NutrigoSurfaceId,
};

/** Medidas del frame 12:792 "01. Dashboard (Desktop)" a 1440. */
export const NUTRIGO_FRAME = {
  width: 1440,
  sidebar: 223,
  content: 892,
  rail: 325,
  contentPad: 28,
  cardPad: 16,
  sectionGap: 20,
} as const;

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
