import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { BillingBoard, PatientLedger } from '../../types/fees';
import { chargeLinkText, chargeTitle } from '../../fees';
import { CobranzasScreen, PatientPanel } from './ShowroomCobranzas';

const TODAY = '2026-09-30';
const marina: PatientLedger = {
  patient_id: 'marina',
  fee: { amount: 30000, first_due_on: '2026-08-10', program_name: 'Plan mensual' },
  charges: [
    { id: 'c1', due_on: '2026-08-10', amount: 30000, status: 'open', kind: 'fee', concept: '' },
    { id: 'c2', due_on: '2026-09-20', amount: 18000, status: 'open', kind: 'extra', concept: 'Consulta de control' },
  ],
  payments: [],
};
const board: BillingBoard = {
  settings: { default_fee: 30000, alias: 'vero.nutricion', payment_link: 'https://mpago.la/abc', instructions: '' },
  programs: [{ id: 'p1', name: 'Plan mensual', amount: 30000 }, { id: 'p2', name: 'Plan trimestral', amount: 80000 }],
  patients: [{ ...marina, full_name: 'Marina Gil' }],
};

describe('texto del link de pago', () => {
  const base = { patientName: 'Marina Gil', title: 'Consulta de control', amount: 18000, dueOn: '2026-09-20', alias: 'vero.nutricion', paymentLink: 'https://mpago.la/abc' };

  it('arma un mensaje con el concepto, el monto, el vencimiento y el link', () => {
    const text = chargeLinkText(base)!;
    for (const part of ['Hola Marina', 'Consulta de control', '18.000', '20/09/2026', 'https://mpago.la/abc', 'vero.nutricion']) expect(text).toContain(part);
  });
  it('sin link usa el alias, y sin ninguno de los dos no hay nada que copiar', () => {
    const text = chargeLinkText({ ...base, paymentLink: '' })!;
    expect(text).toContain('vero.nutricion');
    expect(text).not.toContain('https://');
    expect(chargeLinkText({ ...base, paymentLink: '', alias: '' })).toBeNull();
  });
  it('nunca copia un link que no sea https', () => {
    expect(chargeLinkText({ ...base, paymentLink: 'javascript:alert(1)', alias: '' })).toBeNull();
  });
  it('el título de un cobro es su concepto, o «Cuota mensual» si es de la cuota', () => {
    expect(chargeTitle({ kind: 'extra', concept: 'Taller' })).toBe('Taller');
    expect(chargeTitle({ kind: 'fee', concept: '' })).toBe('Cuota mensual');
    expect(chargeTitle({})).toBe('Cuota mensual');
  });
});

describe('panel de cobros por paciente', () => {
  const panel = (initialTool?: 'cobro' | 'programa') => renderToStaticMarkup(
    <PatientPanel patient={{ ...marina, full_name: 'Marina Gil' }} settings={board.settings} programs={board.programs} onPrograms={vi.fn()} onLedger={vi.fn()} onBack={vi.fn()} today={TODAY} initialTool={initialTool} />,
  );

  it('ofrece Nuevo cobro, Asignar programa y Copiar link', () => {
    const html = panel();
    for (const text of ['Nuevo cobro', 'Asignar programa', 'Copiar link']) expect(html).toContain(text);
  });
  it('muestra el concepto de cada cobro y el programa de la cuota', () => {
    const html = panel();
    expect(html).toContain('Consulta de control');
    expect(html).toContain('Cuota mensual');
    expect(html).toContain('Plan mensual');
  });
  it('el formulario de Nuevo cobro pide concepto, monto y vencimiento', () => {
    const html = panel('cobro');
    for (const text of ['Concepto', 'Monto ($)', 'Vence el', 'Crear cobro']) expect(html).toContain(text);
  });
  it('Asignar programa lista los programas y deja crear uno nuevo', () => {
    const html = panel('programa');
    for (const text of ['Plan trimestral', 'Nombre del programa', 'Guardar programa', 'Asignar', 'Quitar programa']) expect(html).toContain(text);
  });
  it('sin link ni alias avisa por qué no se puede copiar', () => {
    const html = renderToStaticMarkup(<PatientPanel patient={{ ...marina, full_name: 'Marina Gil' }} settings={{ ...board.settings, alias: '', payment_link: '' }} onLedger={vi.fn()} onBack={vi.fn()} today={TODAY} />);
    expect(html).toContain('Cargá tu link o alias en «Datos de cobro»');
  });
  it('la pantalla completa lleva los programas al panel', () => {
    const html = renderToStaticMarkup(<CobranzasScreen board={board} onBoard={vi.fn()} today={TODAY} initialSelectedId="marina" initialTool="programa" />);
    expect(html).toContain('Plan trimestral');
  });
});
