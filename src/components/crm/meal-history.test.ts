import { describe, expect, it } from 'vitest';
import type { MealLog } from '../../types';
import { groupMealLogsForReview } from './meal-history';

function log(id: string, status: MealLog['status'], loggedAt: string): MealLog {
  return {
    id,
    patient_id: 'pat-1',
    slot: 'Cena',
    photo_url: null,
    description: null,
    foods: [],
    macros: null,
    confidence: 0.5,
    note_for_nutri: '',
    status,
    logged_at: loggedAt,
  };
}

describe('groupMealLogsForReview', () => {
  it('splits pending from reviewed and sorts newest first inside each group', () => {
    const logs = [
      log('old-confirmed', 'confirmed', '2026-09-01T12:00:00.000Z'),
      log('new-pending', 'pending_review', '2026-09-05T12:00:00.000Z'),
      log('old-pending', 'pending_review', '2026-09-02T12:00:00.000Z'),
      log('new-adjusted', 'adjusted', '2026-09-04T12:00:00.000Z'),
    ];

    const grouped = groupMealLogsForReview(logs);

    expect(grouped.pending.map((l) => l.id)).toEqual(['new-pending', 'old-pending']);
    expect(grouped.reviewed.map((l) => l.id)).toEqual(['new-adjusted', 'old-confirmed']);
  });

  it('does not mutate the input array', () => {
    const logs = [log('a', 'confirmed', '2026-09-01T12:00:00.000Z'), log('b', 'pending_review', '2026-09-02T12:00:00.000Z')];
    groupMealLogsForReview(logs);
    expect(logs.map((l) => l.id)).toEqual(['a', 'b']);
  });
});
