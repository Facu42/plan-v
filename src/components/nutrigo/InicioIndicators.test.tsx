import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import type { BillingBoard } from '../../types/fees';
import { InicioIndicatorsView, variationText } from './InicioIndicators';

const withHistory = (...ids: string[]) => ({ appointment_history: ids.map((dateId) => ({ id: dateId, when: '', dateId, duration: 30, channel: '', action: 'elapsed' as const, actor: 'system' as const, at: '' })) }) as unknown as Patient;
const board = { settings: {}, patients: [{ payments: [{ id: 'a', amount: 28000, paid_on: '2026-10-05', method: 'efectivo', note: '', status: 'confirmed', reported_by_patient: false, created_at: '' }] }] } as unknown as BillingBoard;
const render = (props: Partial<Parameters<typeof InicioIndicatorsView>[0]> = {}) => renderToStaticMarkup(
  <InicioIndicatorsView patients={[withHistory('2026-10-05'), withHistory('2026-09-01', '2026-10-08')]} board={board} boardError={false} days={7} onDays={vi.fn()} todayId="2026-10-10" {...props} />);

describe('indicadores de Inicio', () => {
  it('muestra consultas (primeras y de seguimiento) e ingresos con su comparación', () => {
    const html = render();
    expect(html).toContain('Consultas');
    expect(html).toContain('2');
    expect(html).toContain('1 primera · 1 de seguimiento');
    expect(html).toContain('Sin datos en el período anterior');
    expect(html).toContain('1 paciente pagó');
    expect(html).toContain('28.000');
  });
  it('ofrece 7, 30 y 90 días', () => {
    const html = render();
    for (const days of [7, 30, 90]) expect(html).toContain(`Últimos ${days} días`);
  });
  it('si los cobros no cargan lo dice y no muestra un cero', () => {
    const html = render({ board: null, boardError: true });
    expect(html).toContain('Sin dato');
    expect(html).toContain('No pudimos consultar los cobros');
  });
  it('redacta la variación en español', () => {
    expect(variationText({ kind: 'up', delta: 2 }, '3')).toBe('↑ +2 contra el período anterior (3)');
    expect(variationText({ kind: 'down', delta: -1 }, '4')).toBe('↓ −1 contra el período anterior (4)');
    expect(variationText({ kind: 'same', delta: 0 }, '2')).toBe('↔ Igual que el período anterior (2)');
  });
});
