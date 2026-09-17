import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ShowroomPatient } from './showroom-model';
import { ShowroomPatientOnboarding } from './ShowroomPatientOnboarding';

const patient = {
  id: 'sofia',
  name: 'Sofía Ruiz',
  goal: 'Comer con más regularidad',
  appointment: { when: 'Jueves · 14:30' },
  weekPlan: [{ day: 'Lunes', meals: [] }],
} as unknown as ShowroomPatient;

describe('pantallas de ingreso del paciente', () => {
  it('abre con la invitación del consultorio y no pide peso ni fotos', () => {
    const html = renderToStaticMarkup(
      <ShowroomPatientOnboarding patient={patient} darkMode={false} onToggleTheme={vi.fn()} onExit={vi.fn()} onFinished={vi.fn()} />,
    );
    expect(html).toContain('Tu nutricionista te espera en Plan V');
    expect(html).toContain('Verónica Trenti');
    expect(html).toContain('Sofía Ruiz');
    expect(html).toContain('Continuar');
    expect(html).not.toContain('Peso');
    expect(html).not.toContain('foto corporal');
  });
});
