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
  onboardingReview,
  draftToIntakePayload,
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
    expect(ONBOARDING_STEPS).toEqual(['invite', 'privacy', 'profile', 'allergies', 'review']);
    expect(context.nutritionist).toBe('Tu nutricionista');
  });

  it('exige consentimiento y un nombre usable antes de avanzar', () => {
    const draft = createOnboardingDraft(buildOnboardingContext(patient));
    expect(canLeaveOnboardingStep('invite', draft)).toBe(true);
    expect(canLeaveOnboardingStep('privacy', draft)).toBe(false);
    expect(canLeaveOnboardingStep('privacy', { ...draft, consentSharing: true })).toBe(true);
    expect(canLeaveOnboardingStep('profile', { ...draft, preferredName: 'S' })).toBe(false);
    expect(canLeaveOnboardingStep('profile', { ...draft, preferredName: ' Sofía ' })).toBe(true);
    expect(nextOnboardingStep('invite')).toBe('privacy');
    expect(prevOnboardingStep('invite')).toBeNull();
    expect(nextOnboardingStep('ready')).toBeNull();
  });

  it('retoma la etapa guardada y conserva datos autodeclarados', () => {
    expect(resumeOnboardingStep('draft', 'allergies')).toBe('allergies');
    expect(resumeOnboardingStep('draft', 'intent')).toBe('profile');
    expect(resumeOnboardingStep('draft', 'habits')).toBe('allergies');
    expect(resumeOnboardingStep('submitted', 'review')).toBe('ready');
    expect(resumeOnboardingStep('reviewed', 'review')).toBe('ready');
    const draft = intakeToDraft({ intake: { revision: 4, status: 'draft', payload: { preferred_name: 'Sofi', allergies: { state: 'reported', items: ['maní'] } } }, consents: [] }, buildOnboardingContext(patient));
    expect(draft.preferredName).toBe('Sofi');
    expect(draft.allergyItems).toBe('maní');
    expect(draft.consentSharing).toBe(false);
    expect(draft.restrictionsState).toBe('unknown');
  });

  it('conserva los campos del flujo anterior y los muestra completos antes de enviar', () => {
    const payload = { preferred_name: 'Sofi', patient_intent: 'Ordenar mis comidas', allergies: { state: 'reported', items: ['maní'] }, restrictions: { state: 'reported', items: ['lácteos'] }, hydration_glasses: 0, sleep_hours: 7, energy: 'Media' };
    const draft = intakeToDraft({ intake: { revision: 8, status: 'draft', step: 'habits', payload }, consents: [{ purpose: 'care_relationship', decision: 'granted' }] }, buildOnboardingContext(patient));
    expect(draftToIntakePayload(draft)).toEqual(payload);
    expect(onboardingReview(draft).map(row => row.value)).toEqual(['Sofi', 'Otorgado.', 'Ordenar mis comidas', 'maní', 'lácteos', '0 vasos', '7 h', 'Media']);
    expect(onboardingReview({ ...draft, hydration: null })[5].value).toBe('Sin responder.');
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
