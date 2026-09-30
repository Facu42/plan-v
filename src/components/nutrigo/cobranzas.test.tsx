import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { BillingBoard, PatientLedger, PatientLedgerView } from '../../types/fees';
import { boardTotals, buildBoardRows, feeErrorMessage, filterBoardRows, parsePesos, replaceLedger } from './cobranzas-utils';
import { CobranzasScreen, PatientPanel } from './ShowroomCobranzas';
import { PagosScreen } from './ShowroomPagos';
import { FeeNoticeView, feeNoticeText } from './PatientFeeNotice';
import { summarizeLedger } from '../../fees';
import { isAllowedPage } from './app-location';
import { PAGE_LABELS } from './ShowroomPanels';

const TODAY = '2026-09-30';
const payment = (over: Partial<PatientLedger['payments'][number]> = {}) => ({ id: 'pay1', amount: 30000, paid_on: '2026-09-12', method: 'transferencia' as const, note: '', status: 'confirmed' as const, reported_by_patient: false, created_at: '2026-09-12T10:00:00Z', ...over });

const sofia: PatientLedger = { patient_id: 'sofia', fee: { amount: 30000, first_due_on: '2026-09-10' }, charges: [{ id: 'c-s1', due_on: '2026-09-10', amount: 30000, status: 'open' }], payments: [payment()] };
const marina: PatientLedger = {
  patient_id: 'marina', fee: { amount: 30000, first_due_on: '2026-08-10' },
  charges: [{ id: 'c-m1', due_on: '2026-08-10', amount: 30000, status: 'open' }, { id: 'c-m2', due_on: '2026-09-10', amount: 30000, status: 'open' }],
  payments: [payment({ id: 'rep1', status: 'reported', reported_by_patient: true, amount: 30000, note: 'Transferí ayer' }), payment({ id: 'old1', status: 'voided', amount: 999 })],
};
const lucia: PatientLedger = { patient_id: 'lucia', fee: null, charges: [], payments: [] };
const board: BillingBoard = {
  settings: { default_fee: 30000, alias: 'vero.nutricion', payment_link: '', instructions: '' },
  patients: [{ ...lucia, full_name: 'Lucía Paz' }, { ...sofia, full_name: 'Sofía Ruiz' }, { ...marina, full_name: 'Marina Gil' }],
};

describe('Cobranzas: helpers', () => {
  it('ordena deudores, por vencer, al día y sin cuota, y calcula los totales', () => {
    const rows = buildBoardRows(board, TODAY);
    expect(rows.map((row) => row.patient.patient_id)).toEqual(['marina', 'sofia', 'lucia']);
    expect(boardTotals(rows)).toEqual({ collected: 30000, owed: 60000, debtors: 1, pending: 1 });
    expect(filterBoardRows(rows, 'deben').map((row) => row.patient.patient_id)).toEqual(['marina']);
    expect(filterBoardRows(rows, 'por_vencer')).toHaveLength(0);
  });
  it('reemplaza la cuenta de un paciente sin perder su nombre', () => {
    const next = replaceLedger(board, { ...lucia, fee: { amount: 1000, first_due_on: TODAY } });
    expect(next.patients.find((patient) => patient.patient_id === 'lucia')).toMatchObject({ full_name: 'Lucía Paz', fee: { amount: 1000 } });
  });
  it('lee el mensaje de error JSON de la API y valida montos', () => {
    expect(feeErrorMessage(new Error('{"error":"Monto inválido"}'))).toBe('Monto inválido');
    expect(feeErrorMessage(new Error('Sin conexión'))).toBe('Sin conexión');
    expect(feeErrorMessage('x', 'Fallback')).toBe('Fallback');
    expect(parsePesos('25.000')).toBe(25000);
    expect(parsePesos('0')).toBeNull();
    expect(parsePesos('10,5')).toBeNull();
  });
});

describe('Pantalla Cobranzas del nutricionista', () => {
  it('muestra resumen, estados, filtros y datos de cobro', () => {
    const html = renderToStaticMarkup(<CobranzasScreen board={board} onBoard={vi.fn()} today={TODAY} />);
    for (const text of ['Cobrado este mes', 'Total adeudado', 'Pacientes que deben', 'Avisos por confirmar', 'Debe desde 10/08', 'Al día', 'Sin cuota', 'Marina Gil', 'Aviso de pago', 'Datos de cobro', 'vero.nutricion', 'Elegí un paciente']) expect(html).toContain(text);
    expect(html).toContain('aria-label="Filtrar pacientes"');
    expect(html).toContain('para saber cómo abonarte');
    expect(html.indexOf('Marina Gil')).toBeLessThan(html.indexOf('Sofía Ruiz'));
    expect(html.indexOf('Sofía Ruiz')).toBeLessThan(html.indexOf('Lucía Paz'));
  });
  it('mantiene el estado vacío cuando no hay pacientes', () => {
    const html = renderToStaticMarkup(<CobranzasScreen board={{ ...board, patients: [] }} onBoard={vi.fn()} today={TODAY} />);
    expect(html).toContain('Todavía no hay pacientes');
  });
  it('el panel del paciente lista avisos, cuotas, historial y recordatorio', () => {
    const html = renderToStaticMarkup(<CobranzasScreen board={board} onBoard={vi.fn()} today={TODAY} initialSelectedId="marina" />);
    expect(html).toContain('Cobranzas de Marina Gil');
    for (const text of ['Confirmar', 'Rechazar', 'Registrar pago', 'Cambiar cuota', 'Quitar cuota', 'Perdonar', 'Vencida', 'Anulado', 'Recordar por WhatsApp', 'https://wa.me/', 'Transferí ayer']) expect(html).toContain(text);
    expect(html).toContain('value="60000"');
  });
  it('no ofrece recordatorio ni anular si no corresponde', () => {
    const html = renderToStaticMarkup(<PatientPanel patient={{ ...board.patients[1] }} settings={board.settings} onLedger={vi.fn()} onBack={vi.fn()} today={TODAY} />);
    expect(html).not.toContain('Recordar por WhatsApp');
    expect(html).toContain('Anular');
    expect(html).toContain('Pagada');
  });
  it('registra la página en el menú y en la URL del nutricionista', () => {
    expect(isAllowedPage('pro', 'cobranzas')).toBe(true);
    expect(isAllowedPage('patient', 'cobranzas')).toBe(false);
    expect(isAllowedPage('patient', 'pagos')).toBe(true);
    expect(PAGE_LABELS.cobranzas).toBe('Cobranzas');
  });
});

const view = (ledger: PatientLedger, info: PatientLedgerView['payment_info'] = { nutritionist_name: 'Vero Trenti', alias: 'vero.nutricion', payment_link: 'https://mpago.la/abc', instructions: 'Avisame por acá' }): PatientLedgerView => ({ ...ledger, payment_info: info });

describe('Pantalla Pagos de la paciente', () => {
  it('muestra la deuda, cómo pagar y el formulario Ya pagué', () => {
    const html = renderToStaticMarkup(<PagosScreen ledger={view(marina)} onLedger={vi.fn()} today={TODAY} />);
    for (const text of ['Debés', 'desde el 10/08/2026', 'Vero Trenti', 'vero.nutricion', 'Copiar', 'Pagar con link', 'Avisame por acá', 'Ya pagué', 'Avisar que pagué']) expect(html).toContain(text);
    expect(html).toContain('A confirmar por tu nutricionista');
    expect(html).not.toContain('Anulado');
    expect(html).toContain('href="https://mpago.la/abc"');
  });
  it('muestra al día y sin datos de pago con calma', () => {
    const html = renderToStaticMarkup(<PagosScreen ledger={view(sofia, null)} onLedger={vi.fn()} today={TODAY} />);
    expect(html).toContain('Estás al día');
    expect(html).toContain('todavía no cargó los datos de pago');
    expect(html).toContain('Confirmado');
  });
  it('sin cuota ni pagos muestra un estado vacío', () => {
    const html = renderToStaticMarkup(<PagosScreen ledger={view(lucia)} onLedger={vi.fn()} today={TODAY} />);
    expect(html).toContain('Todavía no tenés una cuota');
    expect(html).not.toContain('Avisar que pagué');
  });
});

describe('Aviso de cuota en Inicio', () => {
  it('avisa deuda y vencimiento próximo, y calla si está al día', () => {
    expect(feeNoticeText(summarizeLedger(marina, TODAY))).toMatch(/^Tenés una cuota pendiente de/);
    const soon: PatientLedger = { ...sofia, charges: [{ id: 'n', due_on: '2026-10-03', amount: 30000, status: 'open' }], payments: [] };
    expect(feeNoticeText(summarizeLedger(soon, TODAY))).toBe('Tu próxima cuota vence el 03/10');
    expect(feeNoticeText(summarizeLedger(sofia, TODAY))).toBeNull();
    expect(renderToStaticMarkup(<FeeNoticeView ledger={sofia} today={TODAY} onOpen={vi.fn()} />)).toBe('');
    expect(renderToStaticMarkup(<FeeNoticeView ledger={marina} today={TODAY} onOpen={vi.fn()} />)).toContain('Ver pagos');
  });
});
