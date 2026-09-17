export const ONBOARDING_STEPS = [
  'invite',
  'how',
  'privacy',
  'profile',
  'intent',
  'allergies',
  'habits',
  'review',
  'ready',
] as const;
export type OnboardingStep = typeof ONBOARDING_STEPS[number];
export type IntakeServerStep = 'start' | 'privacy' | 'profile' | 'intent' | 'allergies' | 'habits' | 'review';
export type HealthChoice = 'unknown' | 'none' | 'reported';

export type OnboardingDraft = {
  preferredName: string;
  consentSharing: boolean;
  patientIntent: string;
  allergiesState: HealthChoice;
  allergyItems: string;
  restrictionsState: HealthChoice;
  restrictionItems: string;
  hydration: number | null;
  sleepHours: number | null;
  energy: 'Baja' | 'Media' | 'Alta' | null;
};

export type OnboardingContext = {
  patientId: string;
  fullName: string;
  preferredName: string;
  goal: string;
  nutritionist: string;
  appointmentWhen: string | null;
  hasPublishedPlan: boolean;
};

export type ConsentCatalogEntry = {
  purpose: string;
  text_version: string;
  title?: string;
  text: string;
  text_hash: string;
  required: boolean;
};

export type IntakeSnapshot = {
  intake: {
    revision: number;
    status: string;
    step?: string;
    payload: Record<string, unknown>;
    submitted_at?: string | null;
  };
  consents: Array<{ purpose: string; decision: string }>;
};

export const EMPTY_ONBOARDING_DRAFT: OnboardingDraft = {
  preferredName: '',
  consentSharing: false,
  patientIntent: '',
  allergiesState: 'unknown',
  allergyItems: '',
  restrictionsState: 'unknown',
  restrictionItems: '',
  hydration: null,
  sleepHours: null,
  energy: null,
};

export function preferredNameFromFullName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] ?? '';
}

export function buildOnboardingContext(patient: {
  id: string;
  name: string;
  goal: string;
  appointment: { when: string } | null;
  weekPlan: unknown[];
}, nutritionist = 'Verónica Trenti'): OnboardingContext {
  return {
    patientId: patient.id,
    fullName: patient.name,
    preferredName: preferredNameFromFullName(patient.name),
    goal: patient.goal.trim() || 'Todavía no hay un objetivo publicado.',
    nutritionist,
    appointmentWhen: patient.appointment?.when ?? null,
    hasPublishedPlan: patient.weekPlan.length > 0,
  };
}

export function createOnboardingDraft(context: OnboardingContext): OnboardingDraft {
  return { ...EMPTY_ONBOARDING_DRAFT, preferredName: context.preferredName };
}

export function onboardingStepIndex(step: OnboardingStep) {
  return ONBOARDING_STEPS.indexOf(step);
}

export function nextOnboardingStep(step: OnboardingStep): OnboardingStep | null {
  const index = onboardingStepIndex(step);
  return index < 0 || index >= ONBOARDING_STEPS.length - 1 ? null : ONBOARDING_STEPS[index + 1];
}

export function prevOnboardingStep(step: OnboardingStep): OnboardingStep | null {
  const index = onboardingStepIndex(step);
  return index <= 0 ? null : ONBOARDING_STEPS[index - 1];
}

const NAME_PATTERN = /^[\p{L}]+(?:[ '\-][\p{L}]+)*$/u;

export function normalizePreferredName(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

export function parseDeclaredItems(value: string): string[] {
  return value.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 30);
}

export function healthFactFromDraft(state: HealthChoice, items: string) {
  return {
    state,
    items: state === 'reported' ? parseDeclaredItems(items) : [],
  };
}

export function draftToIntakePayload(draft: OnboardingDraft) {
  return {
    preferred_name: normalizePreferredName(draft.preferredName),
    patient_intent: draft.patientIntent.trim(),
    allergies: healthFactFromDraft(draft.allergiesState, draft.allergyItems),
    restrictions: healthFactFromDraft(draft.restrictionsState, draft.restrictionItems),
    hydration_glasses: draft.hydration,
    sleep_hours: draft.sleepHours,
    energy: draft.energy,
  };
}

export function intakeStepForUi(step: OnboardingStep): IntakeServerStep {
  if (step === 'invite' || step === 'how') return 'start';
  if (step === 'ready') return 'review';
  return step;
}

export function resumeOnboardingStep(status: string, serverStep?: string): OnboardingStep {
  if (status === 'submitted' || status === 'reviewed') return 'ready';
  switch (serverStep) {
    case 'privacy': return 'privacy';
    case 'profile': return 'profile';
    case 'intent': return 'intent';
    case 'allergies': return 'allergies';
    case 'habits': return 'habits';
    case 'review': return 'review';
    default: return 'invite';
  }
}

function factState(value: unknown): HealthChoice {
  return value === 'none' || value === 'reported' || value === 'unknown' ? value : 'unknown';
}

export function intakeToDraft(snapshot: IntakeSnapshot, context: OnboardingContext): OnboardingDraft {
  const payload = snapshot.intake.payload ?? {};
  const allergies = (payload.allergies ?? {}) as { state?: string; items?: string[] };
  const restrictions = (payload.restrictions ?? {}) as { state?: string; items?: string[] };
  return {
    preferredName: String(payload.preferred_name ?? context.preferredName),
    consentSharing: snapshot.consents.some((event) => event.purpose === 'care_relationship' && event.decision === 'granted'),
    patientIntent: String(payload.patient_intent ?? ''),
    allergiesState: factState(allergies.state),
    allergyItems: Array.isArray(allergies.items) ? allergies.items.join(', ') : '',
    restrictionsState: factState(restrictions.state),
    restrictionItems: Array.isArray(restrictions.items) ? restrictions.items.join(', ') : '',
    hydration: typeof payload.hydration_glasses === 'number' ? payload.hydration_glasses : null,
    sleepHours: typeof payload.sleep_hours === 'number' ? payload.sleep_hours : null,
    energy: payload.energy === 'Baja' || payload.energy === 'Media' || payload.energy === 'Alta' ? payload.energy : null,
  };
}

export function stepFieldError(step: OnboardingStep, draft: OnboardingDraft): string | null {
  if (step === 'privacy' && !draft.consentSharing) {
    return 'Para continuar hace falta el consentimiento de atención. Las fotos corporales siguen siendo opcionales.';
  }
  if (step === 'profile') {
    const name = normalizePreferredName(draft.preferredName);
    if (name.length < 2 || name.length > 40 || !NAME_PATTERN.test(name)) {
      return 'Escribí un nombre de 2 a 40 letras.';
    }
  }
  if (step === 'allergies') {
    if (draft.allergiesState === 'reported' && parseDeclaredItems(draft.allergyItems).length === 0) {
      return 'Si hay alimentos a evitar, escribilós. Vacío no significa “no tengo”.';
    }
    if (draft.restrictionsState === 'reported' && parseDeclaredItems(draft.restrictionItems).length === 0) {
      return 'Si hay una restricción, escribilá. Si no sabés, elegí “No lo sé”.';
    }
  }
  return null;
}

export function canLeaveOnboardingStep(step: OnboardingStep, draft: OnboardingDraft) {
  return stepFieldError(step, draft) === null;
}

export type OnboardingFinish = {
  preferredName: string;
  consentSharing: true;
  habitsSkipped: boolean;
};

export function finishOnboarding(draft: OnboardingDraft): OnboardingFinish | null {
  if (!canLeaveOnboardingStep('privacy', draft) || !canLeaveOnboardingStep('profile', draft) || !canLeaveOnboardingStep('allergies', draft)) {
    return null;
  }
  return {
    preferredName: normalizePreferredName(draft.preferredName),
    consentSharing: true,
    habitsSkipped: draft.hydration === null && draft.sleepHours === null && draft.energy === null,
  };
}

export function careConsentFromCatalog(catalog: ConsentCatalogEntry[]): ConsentCatalogEntry | undefined {
  return catalog.find((entry) => entry.purpose === 'care_relationship');
}

export function isPersistUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('501') || message.includes('016b') || message.includes('Ingreso persistente');
}
