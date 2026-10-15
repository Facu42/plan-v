import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ShowroomPatient } from '../../components/nutrigo/showroom-model';
import { WellbeingForm } from './WellbeingForm';

vi.mock('../../store/useAppStore', () => ({ useAppStore: (select: (value: { addPatient: () => void }) => unknown) => select({ addPatient: () => undefined }) }));

const day = (extra: Record<string, unknown> = {}) => ({ date: '2026-10-15', label: 'mié', isToday: true, hydration: 0, energy: null, sleepMinutes: null, steps: null, symptoms: [], reviewedMeals: 0, pendingMeals: 0, mealLogIds: [], ...extra });
const render = (today: Record<string, unknown>) => renderToStaticMarkup(<WellbeingForm patient={{ id: 'p1', journey: { days: [day({ isToday: false }), day(today)] } } as unknown as ShowroomPatient} onClose={() => undefined} />);
const pressed = (html: string, label: string) => new RegExp(`aria-pressed="true"[^>]*>${label}<`).test(html);

describe('cómo me siento hoy', () => {
  it('ofrece las tres energías y los ocho síntomas en español, sin nada marcado si no hay registro', () => {
    const html = render({});
    for (const label of ['Con energía', 'Normal', 'Sin energía', 'Hinchazón', 'Acidez', 'Estreñimiento', 'Diarrea', 'Náuseas', 'Dolor de cabeza', 'Cansancio', 'Ganas de picar']) expect(html).toContain(`>${label}<`);
    expect(html).not.toContain('aria-pressed="true"');
    expect(html).toContain('Guardar registro');
  });

  it('muestra marcado lo que ya registró hoy', () => {
    const html = render({ energy: 'Baja', symptoms: ['acidez', 'cansancio'] });
    expect(pressed(html, 'Sin energía')).toBe(true);
    expect(pressed(html, 'Acidez')).toBe(true);
    expect(pressed(html, 'Cansancio')).toBe(true);
    expect(pressed(html, 'Con energía')).toBe(false);
    expect(pressed(html, 'Hinchazón')).toBe(false);
  });

  it('una energía vieja en texto libre no se marca como ninguna opción', () => {
    expect(render({ energy: 'Tranquila' })).not.toContain('aria-pressed="true"');
  });
});
