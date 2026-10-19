import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { BillingBoard } from '../../types/fees';
import { formatPesos } from '../../fees';
import { PanelCobranzasView } from './PanelCobranzas';

const board: BillingBoard = {
  settings: { default_fee: null, alias: 'alias.largo', payment_link: 'https://pago.example/consulta', instructions: '' },
  patients: [{ patient_id: '1', full_name: 'Camila Torres de los Remedios', fee: { amount: 54000, first_due_on: '2026-10-01', program_name: 'Mensual' }, charges: [{ id: 'c', due_on: '2026-10-01', amount: 54000, status: 'open' }], payments: [] }],
};

describe('Cobranzas del boceto', () => {
  it('muestra cobrado, vencido, recordar y movimientos reales', () => {
    const html = renderToStaticMarkup(<PanelCobranzasView board={board} today="2026-10-21" filter="todos" reminders onFilter={vi.fn()} onExport={vi.fn()} onOpen={vi.fn()} onRemind={vi.fn()} onRetry={vi.fn()} error="" loading={false} />);
    for (const label of ['Cobranzas', 'Cobrado', 'Por cobrar', 'Vencido', 'Cuotas vencidas', 'Recordar', 'Movimientos', 'Camila Torres de los Remedios', '6 meses']) expect(html).toContain(label);
    expect(html).not.toContain('wa.me');
    expect(html).not.toContain('WhatsApp');
    expect(html).not.toContain('Débito automático');
    expect(html).toContain('escribirle por el chat');
    expect(html).toContain('aria-label="Ver cobranzas de Camila Torres de los Remedios"');
    expect(html).toContain('class="p5-moves"');
    expect(html).not.toContain('Sofía');
  });

  it('no inventa movimientos cuando no hay datos', () => {
    const html = renderToStaticMarkup(<PanelCobranzasView board={{ settings: { default_fee: null, alias: '', payment_link: '', instructions: '' }, patients: [] }} today="2026-10-21" filter="todos" reminders={false} onFilter={vi.fn()} onExport={vi.fn()} onOpen={vi.fn()} onRemind={vi.fn()} onRetry={vi.fn()} error="" loading={false} />);
    expect(html).toContain('Todavía no hay movimientos.');
    expect(html).toContain('No hay cuotas vencidas.');
    expect(html).toContain(formatPesos(0));
  });
});
