import { generateReplacementDraft } from './menu-draft.js';
import { buildMenuJobContext } from './context.js';
import type { CareData } from '../../src/types/care.js';
import type { IntakePayload } from '../intake/payload.js';
import type { Patient } from '../../src/types/index.js';

export async function generateReplacement(
  request: Extract<CareData, { kind: 'menu_request' }>,
  intake: IntakePayload,
  weekPlan: Patient['weekPlan'],
) {
  const context = buildMenuJobContext({
    intake,
    request: { target: request.target, reason: request.reason, replacement: request.replacement },
    weekPlan,
  });
  return generateReplacementDraft(context);
}
