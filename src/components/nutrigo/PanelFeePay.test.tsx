import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PanelCobranzasView } from './PanelCobranzas';
import { PanelFeePayDialog } from './PanelFeePay';
import { PublicMonthlyFeeView } from './PublicMonthlyFee';
import { PagosScreen } from './ShowroomPagos';
import type { BillingBoard, PatientLedgerView } from '../../types/fees';

const board: BillingBoard = {
  settings: { default_fee: null, alias: '', payment_link: '', instructions: '' },
  patients: [{
    patient_id: 'marina', full_name: 'Marina López', fee: { amount: 28000, first_due_on: '2026-10-01' },
    charges: [{ id: 'c1', due_on: '2026-10-01', amount: 28000, status: 'open' }],
    payments: [],
  }],
};

const ledger: PatientLedgerView = {
  patient_id: 'marina',
  fee: { amount: 28000, first_due_on: '2026-10-01' },
  charges: [{ id: 'c1', due_on: '2026-10-01', amount: 28000, status: 'open' }],
  payments: [],
  payment_info: { nutritionist_name: 'Ana', alias: '', payment_link: '', instructions: '' },
};

describe('pago único en las pantallas', () => {
  it('en Cobranzas se ofrece desde la fila y no si hay débito activo', () => {
    const html = renderToStaticMarkup(<PanelCobranzasView board={board} today="2026-10-21" filter="todos" reminders={false} onFilter={vi.fn()} onExport={vi.fn()} onOpen={vi.fn()} onRemind={vi.fn()} onRetry={vi.fn()} error="" loading={false} onFeePay={vi.fn()} />);
    expect(html).toContain('Cobrar este mes');
    expect(html).not.toContain('WhatsApp');
    expect(html).not.toContain('wa.me');
    const blocked = renderToStaticMarkup(<PanelCobranzasView board={board} today="2026-10-21" filter="todos" reminders={false} onFilter={vi.fn()} onExport={vi.fn()} onOpen={vi.fn()} onRemind={vi.fn()} onRetry={vi.fn()} error="" loading={false} onFeePay={vi.fn()} feeBlocked={['marina']} />);
    expect(blocked).not.toContain('Cobrar este mes');
  });

  it('el cuadro deja copiar el enlace del mes elegido', () => {
    const html = renderToStaticMarkup(<PanelFeePayDialog name="Marina López" options={[{ due_on: '2026-10-01', amount: 28000, title: 'Cuota de octubre 2026' }]} busy={false} notice="Enlace generado." link="https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=uno" onClose={vi.fn()} onCreate={vi.fn()} onCopy={vi.fn()} />);
    expect(html).toContain('Cuota de octubre 2026');
    expect(html).toContain('Copiar enlace');
    expect(html).toContain('No es un débito automático');
    expect(html).not.toContain('WhatsApp');
  });

  it('la página pública y Pagos ofrecen pagar este mes', () => {
    const publicHtml = renderToStaticMarkup(<PublicMonthlyFeeView busy={false} notice="" onSubmit={vi.fn()} />);
    expect(publicHtml).toContain('Cuota del mes');
    expect(publicHtml).toContain('Pagar este mes');
    expect(publicHtml).not.toContain('WhatsApp');
    const pagos = renderToStaticMarkup(<PagosScreen ledger={ledger} onLedger={vi.fn()} today="2026-10-21" monthlyPay={{ title: 'Cuota de octubre 2026', amount: 28000, busy: false, notice: '', onPay: vi.fn() }} />);
    expect(pagos).toContain('Pagar este mes');
    expect(pagos).toContain('Cuota de octubre 2026');
  });
});
