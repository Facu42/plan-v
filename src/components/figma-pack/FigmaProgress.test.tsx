import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { CareSnapshot } from '../../types/care';
import type { ShowroomPatient } from '../nutrigo/showroom-model';
import { FigmaPatientIdentity } from './FigmaPatientIdentity';
import { FigmaProgressProvider } from './FigmaProgress';
import Progress from './screens/Progress';
import ProgressTablet from './screens/ProgressTablet';
import ProgressMobile from './screens/ProgressMobile';

const state = vi.hoisted(() => ({ snapshot: null as CareSnapshot | null }));
vi.mock('../nutrigo/useCare', () => ({ useCare: () => ({ data: state.snapshot, error: '', reload: () => {} }) }));

const days = Array.from({ length: 7 }, (_, index) => ({
  date: `2026-09-${String(17 + index).padStart(2, '0')}`, label: `Día ${index + 1}`,
  hydration: index + 1, sleepMinutes: index % 2 ? null : 420, mealLogIds: index === 5 ? ['meal-1'] : [],
  reviewedMeals: index === 5 ? 1 : 0, pendingMeals: 0, energy: null, isToday: index === 6,
}));
const patient = {
  id: 'p-progress', name: 'Ana Pérez', initials: 'AP',
  journey: { days, hydrationAverage: 4 },
  logs: [{ id: 'meal-1', status: 'confirmed', macros: { kcal: 410 }, logged_at: '2026-09-22T12:00:00Z' }],
} as unknown as ShowroomPatient;
const render = (Screen: typeof Progress) => renderToStaticMarkup(<FigmaPatientIdentity patient={patient}><FigmaProgressProvider patient={patient}><Screen /></FigmaProgressProvider></FigmaPatientIdentity>);

describe('Figma patient progress', () => {
  it.each([['escritorio', Progress], ['tablet', ProgressTablet], ['móvil', ProgressMobile]])('shows real measurements and habits in %s', (_, Screen) => {
    state.snapshot = { records: [
      { id: 'w-1', patient_id: patient.id, recorded_on: '2026-09-15', created_at: '2026-09-15T12:00:00Z', reviewed_at: null, data: { kind: 'weight', value: 81, unit: 'kg', origin: 'patient', note: '' } },
      { id: 'w-2', patient_id: patient.id, recorded_on: '2026-09-22', created_at: '2026-09-22T12:00:00Z', reviewed_at: null, data: { kind: 'weight', value: 79, unit: 'kg', origin: 'patient', note: '' } },
      { id: 'waist-1', patient_id: patient.id, recorded_on: '2026-09-22', created_at: '2026-09-22T12:00:00Z', reviewed_at: null, data: { kind: 'waist', value: 82, unit: 'cm', origin: 'patient', note: '' } },
    ], consented: ['measurement'], preferences: { weight: false, waist: false, activity: false, water: false, water_interval: 120, rest: false, rest_time: '22:30' }, replacements: [], source: 'memory' };
    const html = render(Screen);
    expect(html).toContain('79 kg');
    expect(html).toContain('82 cm');
    expect(html).toContain('410');
    expect(html).toContain('vasos por día');
    expect(html).not.toContain('85 kg');
    expect(html).not.toContain('21,615');
  });

  it('shows an honest empty state without a target weight', () => {
    state.snapshot = { records: [], consented: [], preferences: { weight: false, waist: false, activity: false, water: false, water_interval: 120, rest: false, rest_time: '22:30' }, replacements: [], source: 'memory' };
    const html = render(ProgressMobile);
    expect(html).toContain('Sin registros de peso');
    expect(html).toContain('Sin fotos registradas');
    expect(html).toContain('Meta de peso');
    expect(html).not.toContain('65 kg');
  });

  it('uses the latest saved measurement when two entries share a date', () => {
    state.snapshot = { records: [
      { id: 'new-weight', patient_id: patient.id, recorded_on: '2026-09-22', created_at: '2026-09-22T17:00:00Z', reviewed_at: null, data: { kind: 'weight', value: 77.2, unit: 'kg', origin: 'patient', note: '' } },
      { id: 'old-weight', patient_id: patient.id, recorded_on: '2026-09-22', created_at: '2026-09-22T12:00:00Z', reviewed_at: null, data: { kind: 'weight', value: 77.6, unit: 'kg', origin: 'patient', note: '' } },
      { id: 'new-waist', patient_id: patient.id, recorded_on: '2026-09-22', created_at: '2026-09-22T17:00:00Z', reviewed_at: null, data: { kind: 'waist', value: 81.5, unit: 'cm', origin: 'patient', note: '' } },
      { id: 'old-waist', patient_id: patient.id, recorded_on: '2026-09-22', created_at: '2026-09-22T12:00:00Z', reviewed_at: null, data: { kind: 'waist', value: 82, unit: 'cm', origin: 'patient', note: '' } },
    ], consented: ['measurement'], preferences: { weight: false, waist: false, activity: false, water: false, water_interval: 120, rest: false, rest_time: '22:30' }, replacements: [], source: 'memory' };
    const html = render(ProgressMobile);
    expect(html).toMatch(/Peso actual <strong>77,2 kg<\/strong>/);
    expect(html).toContain('81,5 cm');
  });
});
