import { describe, expect, it } from 'vitest';
import type { Patient } from '../../types';
import { animoDeQuincena, habitosDeLaSemana, inicialDelDia, objetivoDe, sintomasDeQuincena, textoDeDias, ultimosDias } from './ficha-objetivos';

const registro = (date: string, extra: Record<string, unknown>) => ({ patient_id: 'p1', date, hydration: 0, ...extra });
const paciente = (logs: unknown[], extra: Partial<Patient> = {}) => ({ id: 'p1', name: 'Sofía', goal: 'Bajar a 66,5 kg', goal_progress: 40, habit_logs: logs, ...extra }) as unknown as Patient;
const HOY = '2026-10-27';

describe('ficha-objetivos', () => {
  it('arma los últimos días del más viejo al más nuevo', () => {
    expect(ultimosDias(HOY, 3)).toEqual(['2026-10-25', '2026-10-26', '2026-10-27']);
    expect(inicialDelDia(HOY)).toBe('M');
  });

  it('el objetivo es el declarado por la profesional y queda entre 0 y 100', () => {
    expect(objetivoDe(paciente([])).titulo).toBe('Bajar a 66,5 kg');
    expect(objetivoDe(paciente([], { goal_progress: 140 })).pct).toBeLessThanOrEqual(100);
  });

  it('sin registros los hábitos dicen «—» y no inventan ceros', () => {
    const h = habitosDeLaSemana(paciente([]), new Set(), HOY, true);
    expect(h.map(x => x.nombre)).toEqual(['Agua', 'Sueño', 'Actividad', 'Energía']);
    expect(h[0]!.valor).toBe('—');
    expect(h[1]!.pct).toBeNull();
    expect(h[3]!.valor).toBe('—');
    expect(h[2]!.valor).toBe('0');
  });

  it('promedia lo registrado y cuenta los días con actividad', () => {
    const logs = [registro('2026-10-26', { hydration: 6, sleep_minutes: 420, energy: 'Alta' }), registro('2026-10-27', { hydration: 8, sleep_minutes: 360, energy: 'Baja' })];
    const h = habitosDeLaSemana(paciente(logs), new Set(['2026-10-26', '2026-10-27']), HOY, true);
    expect(h[0]!.valor).toBe('7');
    expect(h[1]!.valor).toBe('6,5');
    expect(h[2]!.valor).toBe('2');
    expect(h[3]!.valor).toBe('sin energía');
  });

  it('sin permiso de atención la actividad no se muestra', () => {
    const h = habitosDeLaSemana(paciente([]), new Set(['2026-10-27']), HOY, false);
    expect(h[2]!.valor).toBe('—');
    expect(h[2]!.pct).toBeNull();
  });

  it('la energía de la quincena deja vacío el día sin registro', () => {
    const a = animoDeQuincena(paciente([registro('2026-10-27', { energy: 'Alta' }), registro('2026-10-20', { energy: 'Media' })]), HOY);
    expect(a.valores).toHaveLength(14);
    expect(a.valores[13]).toBe(3);
    expect(a.registrados).toBe(2);
    expect(a.promedio).toBe(2.5);
    expect(animoDeQuincena(paciente([]), HOY).promedio).toBeNull();
  });

  it('los síntomas se ordenan del más repetido al menos y callan los que no aparecen', () => {
    expect(sintomasDeQuincena(paciente([]), HOY)).toEqual([]);
    const logs = [registro('2026-10-27', { symptoms: ['hinchazon'] }), registro('2026-10-26', { symptoms: ['hinchazon', 'cansancio'] })];
    const s = sintomasDeQuincena(paciente(logs), HOY);
    expect(s[0]!.cantidad).toBe(2);
    expect(s.length).toBeGreaterThan(0);
    expect(textoDeDias(1)).toBe('1 día');
    expect(textoDeDias(2)).toBe('2 días');
  });
});
