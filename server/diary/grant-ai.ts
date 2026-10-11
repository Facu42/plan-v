import { consentTextByPurpose } from '../intake/consent.js';
import { appendConsent } from '../intake/memory.js';

/** El modo demo y las pruebas que esperan una estimación tienen que dejar el permiso otorgado. */
export function grantMealAiConsent(patientId: string) {
  const text = consentTextByPurpose('ai_meal_analysis');
  appendConsent(patientId, {
    purpose: text.purpose,
    text_version: text.text_version,
    text_hash: text.text_hash,
    decision: 'granted',
    actor_id: patientId,
  });
}
