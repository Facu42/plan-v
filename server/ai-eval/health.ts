import { CareError } from '../care/errors.js';
import { getIntakeRecord } from '../intake/memory.js';
import { IntakeRepositoryError, readIntakeBundle } from '../intake/repository.js';
import type { EvalHealth } from '../../src/types/ai-eval.js';

export async function loadEvalHealth(patientId: string, persistent: boolean): Promise<EvalHealth> {
  try {
    const payload = persistent
      ? (await readIntakeBundle(patientId)).intake.payload
      : getIntakeRecord(patientId).payload;
    return {
      allergies: { state: payload.allergies.state, items: [...payload.allergies.items] },
      restrictions: { state: payload.restrictions.state, items: [...payload.restrictions.items] },
      cooking_time_minutes: payload.cooking_time_minutes ?? null,
    };
  } catch (error) {
    if (error instanceof IntakeRepositoryError) throw new CareError(error.status, error.message);
    throw error;
  }
}
