import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { BillingBoard } from '../../types/fees';
import { desdeDelPeriodo, PanelCobranzasV29 } from './PanelCobranzasV29';

const board: BillingBoard = {
  settings: { default_fee: null, alias: 'alias', payment_link: '', instructions: '' },
  patients: [
    { patient_id: '1', full_name: 'Camila Torres', fee: { amount: 54000, first_due_on: '2026-10-01', program_name: 'Mensual' }, charges: [{ id: 'c', due_on: '2026-10-01', amount: 54000, status: 'open' }], payments: [] },
    { patient_id: '2', full_name: 'Lucía Fernández', fee: { amount: 30000, first_due_on: '2026-10-25', program_name: 'Seguimiento' }, charges: [{ id: 'd', due_on: '2026-10-25', amount: 30000, status: 'open' }], payments: [] },
  ],
};
const props = { board, today: '2026-10-21', periodo: 'mes' as const, filtro: 'todos' as const, error: '', cargando: false, onFiltro: vi.fn(), onAbrir: vi.fn(), onRecordar: vi.fn(), onReintentar: vi.fn() };

describe('Cobranzas con el HTML del boceto v29', () => {
  it('arma las mismas piezas del boceto con datos reales', () => {
    const html = renderToStaticMarkup(<PanelCobranzasV29 {...props} />);
    for (const clase of ['id="s-cobranzas"', 'id="cwrap"', 'fxtiles cob4', 'fxdk', 'fxtb', 'fxr', 'fxtl', 'fxstk']) expect(html).toContain(clase);
    for (const texto of ['Por cobrar este mes', 'Vencido', 'Programas activos', 'Ingresos por mes', 'Movimientos', 'Cuotas vencidas', 'Vencen esta semana', 'Cómo te pagan', 'Camila Torres', 'Lucía Fernández']) expect(html).toContain(texto);
    expect(html).not.toContain('Sofía');
  });

  it('sin datos no inventa movimientos ni vencidos', () => {
    const html = renderToStaticMarkup(<PanelCobranzasV29 {...props} board={{ ...board, patients: [] }} />);
    expect(html).toContain('Nadie debe');
    expect(html).toContain('No hay cuotas vencidas.');
    expect(html).toContain('Todavía no hay cobros en este período.');
  });

  it('muestra el aviso de error con Reintentar si no hay tablero', () => {
    const html = renderToStaticMarkup(<PanelCobranzasV29 {...props} board={null} error="No pudimos cargar las cobranzas." />);
    expect(html).toContain('Reintentar');
  });

  it('calcula desde cuándo cuenta cada período', () => {
    expect(desdeDelPeriodo('2026-10-21', 'mes')).toBe('2026-10-01');
    expect(desdeDelPeriodo('2026-10-21', 'trimestre')).toBe('2026-08-01');
    expect(desdeDelPeriodo('2026-02-03', 'trimestre')).toBe('2025-12-01');
    expect(desdeDelPeriodo('2026-10-21', 'anio')).toBe('2026-01-01');
  });
});
