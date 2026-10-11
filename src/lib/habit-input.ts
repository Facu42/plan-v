export const HABIT_LIMITS = { water: 8, rest: 1440, steps: 100000 } as const;

export function parseHabitInput(value: string, kind: keyof typeof HABIT_LIMITS): number | null {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 && number <= HABIT_LIMITS[kind] ? number : null;
}
