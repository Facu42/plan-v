import { describe, expect, it } from 'vitest';
import { availableSlotsForDay, MENU_SLOTS } from './menu-editor-utils';

describe('availableSlotsForDay', () => {
  it('returns every slot when the day has no meals', () => {
    expect(availableSlotsForDay([])).toEqual([...MENU_SLOTS]);
  });

  it('filters out slots already planned that day', () => {
    expect(availableSlotsForDay(['Almuerzo', 'Cena'])).toEqual(['Desayuno', 'Colación', 'Merienda', 'Extra']);
  });

  it('returns an empty list when the day is full', () => {
    expect(availableSlotsForDay([...MENU_SLOTS])).toEqual([]);
  });
});
