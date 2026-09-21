/** Executable piloto exit acta. Not a clinical gate and not a live GO. */

export const PILOTO_ACTA_VERSION = 'piloto-acta.v1' as const;

export type ActaVerdict = 'go-synthetic-no-go-live' | 'go-live' | 'no-go';

export type PilotoActaEvidence = {
  demoCircuit: boolean;
  pgliteTwoNutritionists: boolean;
  viewportContracts: boolean;
  errorSimulation: boolean;
  railwayThisBranch: boolean;
  disposableLiveAuth: boolean;
  physicalPwa: boolean;
  /** Human review of eval.v1 by the licensed nutritionist — not an automated clinical gate. */
  evalReviewedByNutritionist: boolean;
  legalRetentionConfirmed: boolean;
  mercadoPagoLive: boolean;
  nutrigoVisualApproved: boolean;
  sqlAppliedOnHostedPatients: boolean;
};

export type PilotoActa = {
  version: typeof PILOTO_ACTA_VERSION;
  verdict: ActaVerdict;
  liveBlockers: string[];
  notes: string[];
};

const LIVE_REQUIRED: Array<keyof PilotoActaEvidence> = [
  'railwayThisBranch',
  'disposableLiveAuth',
  'physicalPwa',
  'evalReviewedByNutritionist',
  'legalRetentionConfirmed',
];

const LIVE_BLOCKER_LABEL: Record<(typeof LIVE_REQUIRED)[number], string> = {
  railwayThisBranch: 'Railway public API is not this branch (still PR #1 unless Facu re-points)',
  disposableLiveAuth: 'Live two-role JWT on an empty disposable Supabase is missing',
  physicalPwa: 'Add-to-Home on a physical Android and iPhone is not accredited',
  evalReviewedByNutritionist: 'Verónica still reviews eval.v1 (human review, not an automated clinical gate)',
  legalRetentionConfirmed: 'Retention periods are working hypotheses until privacy/legal confirms them',
};

export function environmentLiveFlags(env: NodeJS.ProcessEnv = process.env): Pick<
  PilotoActaEvidence,
  | 'railwayThisBranch'
  | 'disposableLiveAuth'
  | 'physicalPwa'
  | 'evalReviewedByNutritionist'
  | 'legalRetentionConfirmed'
  | 'mercadoPagoLive'
  | 'nutrigoVisualApproved'
  | 'sqlAppliedOnHostedPatients'
> {
  return {
    railwayThisBranch: env.PLANV_RAILWAY_THIS_BRANCH === '1',
    disposableLiveAuth: Boolean(
      env.DISPOSABLE_SUPABASE_URL
      && env.VITE_SUPABASE_ANON_KEY
      && env.RLS_JWT_NUTRI_A
      && env.RLS_JWT_NUTRI_B
      && env.PLANV_LIVE_AUTH === '1',
    ),
    physicalPwa: env.PLANV_PHYSICAL_PWA === '1',
    evalReviewedByNutritionist: env.PLANV_EVAL_REVIEWED === '1',
    legalRetentionConfirmed: env.PLANV_RETENTION_LEGAL === '1',
    mercadoPagoLive: env.PLANV_MP_LIVE === '1',
    nutrigoVisualApproved: env.PLANV_NUTRIGO_VISUAL === '1',
    sqlAppliedOnHostedPatients: env.PLANV_SQL_ON_HOSTED_PATIENTS === '1',
  };
}

export function evaluatePilotoActa(evidence: PilotoActaEvidence): PilotoActa {
  const notes: string[] = [
    'Mercado Pago is P1 (PV-32); a free piloto may waive billing without live payments.',
    'Nutrigo visual approval is P1 (PV-37); 390/1440 here are layout contracts, not visual sign-off.',
    'eval.v1 is a synthetic publish check, not a clinical gate.',
  ];

  if (evidence.sqlAppliedOnHostedPatients) {
    return {
      version: PILOTO_ACTA_VERSION,
      verdict: 'no-go',
      liveBlockers: ['SQL/RLS/buckets were applied on the hosted project that already has patients'],
      notes,
    };
  }

  const synthetic = evidence.demoCircuit
    && evidence.pgliteTwoNutritionists
    && evidence.viewportContracts
    && evidence.errorSimulation;

  if (!synthetic) {
    return {
      version: PILOTO_ACTA_VERSION,
      verdict: 'no-go',
      liveBlockers: LIVE_REQUIRED.map((key) => LIVE_BLOCKER_LABEL[key]),
      notes: [
        ...notes,
        'Synthetic two-role circuit, viewport contracts or error simulation did not pass.',
      ],
    };
  }

  const liveBlockers = LIVE_REQUIRED
    .filter((key) => !evidence[key])
    .map((key) => LIVE_BLOCKER_LABEL[key]);

  if (liveBlockers.length === 0) {
    return { version: PILOTO_ACTA_VERSION, verdict: 'go-live', liveBlockers, notes };
  }

  return {
    version: PILOTO_ACTA_VERSION,
    verdict: 'go-synthetic-no-go-live',
    liveBlockers,
    notes,
  };
}
