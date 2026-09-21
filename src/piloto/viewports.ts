/** Layout smoke widths for two-role routes. Not Nutrigo visual approval (PV-37). */
export const PILOTO_VIEWPORTS = {
  mobile: 390,
  desktop: 1440,
} as const;

export const TWO_ROLE_SMOKE_PAGES = {
  patient: ['inicio', 'plan', 'diario', 'mensajes', 'agenda'] as const,
  pro: ['inicio', 'pacientes', 'diario', 'agenda', 'mensajes', 'plan'] as const,
};
