export const ALCANCE_VERSION = 'alcance.v1' as const;

export const ALCANCE_FEATURES = ['grocery_budget', 'activity_import', 'native_video'] as const;
export type AlcanceFeature = (typeof ALCANCE_FEATURES)[number];

export const ALCANCE_STATUSES = ['in', 'out'] as const;
export type AlcanceStatus = (typeof ALCANCE_STATUSES)[number];

export type AlcanceDecision = {
  feature: AlcanceFeature;
  status: AlcanceStatus;
  kept: string;
  evidence: string;
  blocked: string;
};

export type AlcanceSnapshot = {
  version: typeof ALCANCE_VERSION;
  numbered_plan: 'PV-01…PV-39';
  last_ticket: 'PV-39';
  nutrigo_visual_approved: false;
  decisions: AlcanceDecision[];
};

/** Product decision: no grocery spend, no wearable import, no native WebRTC. */
export const ALCANCE_DECISIONS: AlcanceDecision[] = [
  {
    feature: 'grocery_budget',
    status: 'out',
    kept: 'Lista operativa con cantidades y unidades (PV-21). Sin precios ni supermercado.',
    evidence: 'Grocery y PV-21 no registran gasto. No hay evidencia de uso de presupuesto.',
    blocked: 'presupuesto, gastos, precios, moneda, supermercado',
  },
  {
    feature: 'activity_import',
    status: 'out',
    kept: 'Actividad autodeclarada y rutinas con habilitación de servidor (PV-35).',
    evidence: 'No hay adaptador ni consentimiento de wearables. Sin calorías inferidas.',
    blocked: 'Fitbit, Apple Health, Google Fit, importación de pasos o calorías',
  },
  {
    feature: 'native_video',
    status: 'out',
    kept: 'Turno video con meet_url HTTPS. Abrir enlace o no-op.',
    evidence: 'mvp-v0 y Consultas usan meet_url pegado. No hay WebRTC ni sala propia.',
    blocked: 'WebRTC, sala nativa, grabación, Calendly, proveedor de video',
  },
];
