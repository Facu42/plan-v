import { CONSENT_CATALOG, type ConsentPurpose } from '../intake/consent.js';
import { getIntakeRecord, listConsentEvents } from '../intake/memory.js';
import { readIntakeBundle } from '../intake/repository.js';
import { CareError } from './errors.js';

export async function currentCareConsents(patientId: string, persistent: boolean) {
  const bundle = persistent ? await readIntakeBundle(patientId) : { intake: getIntakeRecord(patientId), consents: listConsentEvents(patientId) };
  const latest = new Map<string, typeof bundle.consents[number]>();
  for (const entry of bundle.consents) latest.set(entry.purpose, entry);
  const consented = CONSENT_CATALOG.filter((text) => {
    const last = latest.get(text.purpose);
    return last?.decision === 'granted' && last.text_version === text.text_version && last.text_hash === text.text_hash;
  }).map((text) => text.purpose);
  return { ...bundle, consented };
}

export async function requireCareConsent(patientId: string, persistent: boolean, purpose: ConsentPurpose) {
  const bundle = await currentCareConsents(patientId, persistent);
  if (!bundle.consented.includes(purpose)) {
    throw new CareError(403, `Activá el permiso «${CONSENT_CATALOG.find((item) => item.purpose === purpose)?.title}» antes de continuar.`);
  }
  return bundle;
}
