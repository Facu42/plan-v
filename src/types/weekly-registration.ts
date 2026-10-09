export type WeeklyRegistration = {
  start: string; end: string; recorded_days: number;
  meals_logged: number; meals_pending: number;
  water_days: number; water_average: number | null;
  pending_review: number;
};
