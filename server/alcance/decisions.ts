import { CareError } from '../care/errors.js';
import { ALCANCE_DECISIONS, ALCANCE_VERSION, type AlcanceSnapshot } from '../../src/types/alcance.js';

export const ALCANCE_OUT_MESSAGE = 'Esa capacidad quedó fuera de alcance hasta evidencia de uso.';
export const ALCANCE_UNINSTALLED_MESSAGE = 'Esa capacidad de alcance no está instalada.';

/** Reads the env flag. PV-39 never copies this into the alcance snapshot. */
export function nutrigoVisualApproved(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.PLANV_NUTRIGO_VISUAL === '1';
}

export function evaluateAlcance(env: NodeJS.ProcessEnv = process.env): AlcanceSnapshot {
  void nutrigoVisualApproved(env);
  return {
    version: ALCANCE_VERSION,
    numbered_plan: 'PV-01…PV-39',
    last_ticket: 'PV-39',
    nutrigo_visual_approved: false,
    decisions: ALCANCE_DECISIONS.map((row) => ({ ...row })),
  };
}

export function alcanceOutOfScope(): never {
  throw new CareError(501, ALCANCE_OUT_MESSAGE);
}

export function alcanceDbError(error: { code?: string; message?: string } | null): never {
  if (error && ['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error.code ?? '')) {
    throw new CareError(501, ALCANCE_UNINSTALLED_MESSAGE);
  }
  alcanceOutOfScope();
}
