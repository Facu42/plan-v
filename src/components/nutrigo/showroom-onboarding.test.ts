import { describe, expect, it } from 'vitest';
import {
  buildOnboardingContext,
  canLeaveOnboardingStep,
  createOnboardingDraft,
  finishOnboarding,
  nextOnboardingStep,
  ONBOARDING_STEPS,
  prevOnboardingStep,
  resumeOnboardingStep,
  intakeToDraft,
} from './showroom-onboarding';

const patient = {
  id: 'sofia',
  name: 'Sofía Ruiz',
  goal: '  Comer con más regularidad  ',
  appointment: { when: 'Jueves · 14:30' },
  weekPlan: [{ day: 'Lunes' }],
};

describe('ingreso del paciente', () => {
  it('arma el contexto publicado y no inventa un objetivo vacío', () => {
    const context = buildOnboardingContext(patient);
    expect(context.preferredName).toBe('Sofía');
    expect(context.goal).toBe('Comer con más regularidad');
    expect(context.appointmentWhen).toBe('Jueves · 14:30');
    expect(context.hasPublishedPlan).toBe(true);
    expect(ONBOARDING_STEPS).toEqual(['invite', 'how', 'privacy', 'profile', 'intent', 'allergies', 'habits', 'review', 'ready']);
  });

  it('exige consentimiento y un nombre usable antes de avanzar', () => {
    const draft = createOnboardingDraft(buildOnboardingContext(patient));
    expect(canLeaveOnboardingStep('invite', draft)).toBe(true);
    expect(canLeaveOnboardingStep('privacy', draft)).toBe(false);
    expect(canLeaveOnboardingStep('privacy', { ...draft, consentSharing: true })).toBe(true);
    expect(canLeaveOnboardingStep('profile', { ...draft, preferredName: 'S' })).toBe(false);
    expect(canLeaveOnboardingStep('profile', { ...draft, preferredName: ' Sofía ' })).toBe(true);
    expect(nextOnboardingStep('invite')).toBe('how');
    expect(prevOnboardingStep('invite')).toBeNull();
    expect(nextOnboardingStep('ready')).toBeNull();
  });

  it('retoma la etapa guardada y conserva datos autodeclarados', () => {
    expect(resumeOnboardingStep('draft', 'allergies')).toBe('allergies');
    expect(resumeOnboardingStep('submitted', 'review')).toBe('ready');
    expect(resumeOnboardingStep('reviewed', 'review')).toBe('ready');
    const draft = intakeToDraft({ intake: { revision: 4, status: 'draft', payload: { preferred_name: 'Sofi', allergies: { state: 'reported', items: ['maní'] } } }, consents: [] }, buildOnboardingContext(patient));
    expect(draft.preferredName).toBe('Sofi');
    expect(draft.allergyItems).toBe('maní');
    expect(draft.consentSharing).toBe(false);
    expect(draft.restrictionsState).toBe('unknown');
  });

  it('no cierra el ingreso sin consentimiento y marca hábitos salteados', () => {
    const draft = createOnboardingDraft(buildOnboardingContext(patient));
    expect(finishOnboarding(draft)).toBeNull();
    expect(finishOnboarding({ ...draft, consentSharing: true, preferredName: 'Sofi' })).toEqual({
      preferredName: 'Sofi',
      consentSharing: true,
      habitsSkipped: true,
    });
    expect(finishOnboarding({ ...draft, consentSharing: true, preferredName: 'Sofi', hydration: 4 })?.habitsSkipped).toBe(false);
  });
});
