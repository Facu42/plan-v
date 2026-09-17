export const ONBOARDING_STEPS = ['invite', 'how', 'privacy', 'profile', 'habits', 'ready'] as const;
export type OnboardingStep = typeof ONBOARDING_STEPS[number];

export type OnboardingDraft = {
  preferredName: string;
  consentSharing: boolean;
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

export const EMPTY_ONBOARDING_DRAFT: OnboardingDraft = {
  preferredName: '',
  consentSharing: false,
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

export function canLeaveOnboardingStep(step: OnboardingStep, draft: OnboardingDraft) {
  if (step === 'privacy') return draft.consentSharing;
  if (step === 'profile') {
    const name = normalizePreferredName(draft.preferredName);
    return name.length >= 2 && name.length <= 40 && NAME_PATTERN.test(name);
  }
  return true;
}

export type OnboardingFinish = {
  preferredName: string;
  consentSharing: true;
  habitsSkipped: boolean;
};

export function finishOnboarding(draft: OnboardingDraft): OnboardingFinish | null {
  if (!draft.consentSharing) return null;
  const preferredName = normalizePreferredName(draft.preferredName);
  if (!canLeaveOnboardingStep('profile', { ...draft, preferredName })) return null;
  return {
    preferredName,
    consentSharing: true,
    habitsSkipped: draft.hydration === null && draft.sleepHours === null && draft.energy === null,
  };
}
