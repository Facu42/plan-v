/** Layout smoke widths for two-role routes. Not Nutrigo visual approval. */
export const PILOTO_VIEWPORTS = {
  mobile: 390,
  desktop: 1440,
} as const;

export { NUTRIGO_VIEWPORTS, NUTRIGO_SURFACES, NUTRIGO_PARITY_NOT_VISUAL_APPROVAL } from '../components/nutrigo/nutrigo-surfaces';

export const TWO_ROLE_SMOKE_PAGES = {
  patient: ['inicio', 'plan', 'diario', 'mensajes', 'agenda'] as const,
  pro: ['inicio', 'pacientes', 'diario', 'agenda', 'mensajes', 'plan'] as const,
};
