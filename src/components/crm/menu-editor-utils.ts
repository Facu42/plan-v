export const MENU_SLOTS = ['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena', 'Extra'] as const;

export function availableSlotsForDay(existingSlots: readonly string[]): string[] {
  return MENU_SLOTS.filter((slot) => !existingSlots.includes(slot));
}
