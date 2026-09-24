import type { MealLog } from '../../types';

export type GroupedMealLogs = {
  pending: MealLog[];
  reviewed: MealLog[];
};

function newestFirst(a: MealLog, b: MealLog): number {
  return b.logged_at.localeCompare(a.logged_at);
}

export function groupMealLogsForReview(logs: readonly MealLog[]): GroupedMealLogs {
  const pending: MealLog[] = [];
  const reviewed: MealLog[] = [];
  for (const log of logs) {
    if (log.status === 'pending_review') pending.push(log);
    else reviewed.push(log);
  }
  return {
    pending: pending.sort(newestFirst),
    reviewed: reviewed.sort(newestFirst),
  };
}
