import { describe, expect, it } from 'vitest';
import { evaluatePilotoActa, environmentLiveFlags, PILOTO_ACTA_VERSION, type PilotoActaEvidence } from './acta.js';

const syntheticPass: PilotoActaEvidence = {
  demoCircuit: true,
  pgliteTwoNutritionists: true,
  viewportContracts: true,
  errorSimulation: true,
  railwayThisBranch: false,
  disposableLiveAuth: false,
  physicalPwa: false,
  evalReviewedByNutritionist: false,
  legalRetentionConfirmed: false,
  mercadoPagoLive: false,
  nutrigoVisualApproved: false,
  sqlAppliedOnHostedPatients: false,
};

describe('PV-33 acta de salida (piloto-acta.v1)', () => {
  it('en este entorno emite GO sintético / NO-GO live y no pide cobros ni visual', () => {
    const acta = evaluatePilotoActa({ ...syntheticPass, ...environmentLiveFlags() });
    expect(acta.version).toBe(PILOTO_ACTA_VERSION);
    expect(acta.verdict).toBe('go-synthetic-no-go-live');
    expect(acta.liveBlockers.some((reason) => /Railway/.test(reason))).toBe(true);
    expect(acta.liveBlockers.some((reason) => /JWT/.test(reason))).toBe(true);
    expect(acta.liveBlockers.some((reason) => /physical Android/.test(reason))).toBe(true);
    expect(acta.liveBlockers.some((reason) => /not an automated clinical gate/.test(reason))).toBe(true);
    expect(acta.notes.some((note) => /Mercado Pago is P1/.test(note))).toBe(true);
    expect(acta.notes.some((note) => /not visual sign-off/.test(note))).toBe(true);
    expect(acta.notes.some((note) => /Numbered plan PV-01…PV-39 is covered in code/.test(note))).toBe(true);
    expect(JSON.stringify(acta)).not.toMatch(/eval\.v1 is a clinical gate/i);
  });

  it('las banderas live del entorno default son falsas (no se inventan secretos ni re-point)', () => {
    const flags = environmentLiveFlags({
      APP_MODE: 'test',
      DISPOSABLE_DATABASE_URL: undefined,
      DISPOSABLE_SUPABASE_URL: undefined,
      PLANV_LIVE_AUTH: undefined,
      PLANV_RAILWAY_THIS_BRANCH: undefined,
    });
    expect(flags).toMatchObject({
      railwayThisBranch: false,
      disposableLiveAuth: false,
      physicalPwa: false,
      evalReviewedByNutritionist: false,
      legalRetentionConfirmed: false,
      mercadoPagoLive: false,
      nutrigoVisualApproved: false,
      sqlAppliedOnHostedPatients: false,
    });
  });

  it('falla cerrado si falta el circuito sintético', () => {
    expect(evaluatePilotoActa({ ...syntheticPass, demoCircuit: false }).verdict).toBe('no-go');
    expect(evaluatePilotoActa({ ...syntheticPass, pgliteTwoNutritionists: false }).verdict).toBe('no-go');
  });

  it('SQL en el proyecto con patients es no-go aunque el resto pase', () => {
    const acta = evaluatePilotoActa({ ...syntheticPass, sqlAppliedOnHostedPatients: true });
    expect(acta.verdict).toBe('no-go');
    expect(acta.liveBlockers[0]).toMatch(/hosted project that already has patients/);
  });

  it('go-live exige Railway + Auth descartable + PWA física + revisión humana + retención; no MP ni visual', () => {
    const acta = evaluatePilotoActa({
      ...syntheticPass,
      railwayThisBranch: true,
      disposableLiveAuth: true,
      physicalPwa: true,
      evalReviewedByNutritionist: true,
      legalRetentionConfirmed: true,
      mercadoPagoLive: false,
      nutrigoVisualApproved: false,
    });
    expect(acta.verdict).toBe('go-live');
    expect(acta.liveBlockers).toEqual([]);
  });
});
