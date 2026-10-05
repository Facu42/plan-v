import { describe, expect, it } from 'vitest';
import { parseHabitInput } from './habit-input';
import { habitUpdateInputSchema } from '../../server/schemas';

describe('el formulario de hábitos coincide con el contrato del servidor', () => {
  it.each(['', ' ', '-1', '1.5', '9', '30', 'NaN'])('rechaza agua inválida: %s', value => {
    expect(parseHabitInput(value, 'water')).toBeNull();
  });
  it.each(['0', '1', '8'])('permite guardar agua dentro del límite: %s', value => {
    const hydration = parseHabitInput(value, 'water');
    expect(habitUpdateInputSchema.safeParse({ hydration }).success).toBe(true);
  });
  it('conserva el límite de descanso y rechaza minutos incompletos', () => {
    expect(habitUpdateInputSchema.safeParse({ sleep_minutes: parseHabitInput('1440', 'rest') }).success).toBe(true);
    expect(parseHabitInput('1441', 'rest')).toBeNull();
    expect(parseHabitInput('0.5', 'rest')).toBeNull();
  });
});
