import type { AssetCategory } from '../assets/types.js';
import type { PrivacyRetentionRule } from '../../src/types/privacy.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Working periods for the piloto — not a legal opinion. */
export const RETENTION_RULES: Record<AssetCategory, { delayMs: number; workingPeriod: string }> = {
  meal_photo: { delayMs: 0, workingPeriod: '3 años o hasta retiro' },
  clinical_document: { delayMs: 0, workingPeriod: '10 años o hasta retiro' },
  body_progress: { delayMs: 30 * DAY_MS, workingPeriod: 'hasta retiro + 30 días de cola' },
  chat_attachment: { delayMs: 0, workingPeriod: 'hasta retiro' },
};

export function purgeDelayMs(category: string, now = Date.now()): number {
  if (category === 'body_progress') return RETENTION_RULES.body_progress.delayMs;
  if (category === 'meal_photo') return RETENTION_RULES.meal_photo.delayMs;
  if (category === 'clinical_document') return RETENTION_RULES.clinical_document.delayMs;
  if (category === 'chat_attachment') return RETENTION_RULES.chat_attachment.delayMs;
  return 0;
}

export function purgeRunAfter(category: string, now = new Date()): string {
  return new Date(now.getTime() + purgeDelayMs(category, now.getTime())).toISOString();
}

export function retentionRulesForExport(): PrivacyRetentionRule[] {
  return (Object.entries(RETENTION_RULES) as Array<[AssetCategory, { delayMs: number; workingPeriod: string }]>).map(
    ([category, rule]) => ({
      category,
      working_period: rule.workingPeriod,
      purge_delay_after_withdraw: category === 'body_progress' ? '30 days' : 'immediate',
    }),
  );
}
