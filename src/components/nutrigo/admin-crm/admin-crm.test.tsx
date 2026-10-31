import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AdminCrm } from './AdminCrm';
import { CobrosView, NutrisView, PacientesView, ResumenView, SaludView, SeguridadView } from './centro-views';
import type { CentroCobros, CentroNutri, CentroPacientes, CentroResumen, CentroSalud, CentroSeguridad } from '../../../types/centro';

vi.mock('../../../api/client', () => ({
  api: {
    getCentroResumen: () => new Promise(() => undefined),
    getCentroNutris: () => new Promise(() => undefined),
    getCentroPacientes: () => new Promise(() => undefined),
    getCentroCobros: () => new Promise(() => undefined),
    getCentroSalud: () => new Promise(() => undefined),
    getCentroSeguridad: () => new Promise(() => undefined),
  },
  ApiError: class ApiError extends Error { constructor(public status: number, message: string) { super(message); } },
}));

const resumen: CentroResumen = {
  nutris_activas: 2,
  nutris_prueba: 1,
  nutris_vencidas: 0,
  nutris_total: 3,
  pacientes_activos: 11,
  ingresos_mes: 50000,
  mrr: 50000,
  precio_mensual: 25000,
  altas_recientes: [{ id: 'n1', name: 'Ana Gómez', email: 'ana@x.test', created_at: '2026-10-20T10:00:00Z', state: 'activa' }],
  alertas: [{ tone: 'green', title: 'Nada urgente', sub: 'Las cuentas del servicio están al día.' }],
  spark_altas: [0, 1, 0, 0, 1, 0, 0, 1],
  spark_ingresos: [0, 0, 0, 0, 0, 0, 0, 50000],
};

const nutris: CentroNutri[] = [{
  id: 'n1', display_name: 'Ana Gómez', email: 'ana@x.test', created_at: '2026-09-01T10:00:00Z',
  last_sign_in_at: '2026-10-28T10:00:00Z', is_test: false, patients_active: 4, patients_total: 5,
  state: 'activa', until: '2027-01-15', days_left: 76, precio_mensual: 25000,
}];

const pacientes: CentroPacientes = {
  activos: 4, total: 5, consultorios: 1,
  por_nutri: [{ nutritionist_id: 'n1', name: 'Ana Gómez', activos: 4, total: 5 }],
};

const cobros: CentroCobros = {
  mrr: 25000, cobrado_mes: 25000, vencidos: 0, en_gracia: 0, precio_mensual: 25000,
  cuentas: [{ id: 'n1', name: 'Ana Gómez', state: 'activa', until: '2027-01-15', days_left: 76, cobrado_mes: 25000 }],
  pagos_mes: [{ id: 'p1', nutritionist_id: 'n1', nutritionist_name: 'Ana Gómez', amount: 25000, paid_on: '2026-10-12', method: 'transferencia', status: 'confirmed' }],
};

const salud: CentroSalud = {
  api: { status: 'ok', supabase: true, sha: 'abc1234', mode: 'production' },
  worker: 'external',
  jobs: { queued: 1, leased: 0, dead: 0, succeeded: 4, failed: 0 },
  errores_recientes: [],
  migraciones: { available: true, count: 80, latest: '20261029120000', note: '' },
  integraciones_faltantes: 0,
};

const seguridad: CentroSeguridad = {
  mfa_enforce: false,
  admins: [{ user_id: 'a1', name: 'Facundo', email: 'facu@x.test', created_at: '2026-01-01T00:00:00Z' }],
  cuentas: [{ id: 'n1', name: 'Ana Gómez', email: 'ana@x.test', role: 'nutri', mfa: 'sin_alta' }],
  advertencias: [{ tone: 'gold', title: 'El interruptor de MFA está apagado', sub: 'El centro de mando igual pide el segundo paso.' }],
};

describe('centro de mando en /admin', () => {
  it('arma el armazón Nutridash con las seis secciones reales', () => {
    const html = renderToStaticMarkup(createElement(AdminCrm, { adminName: 'Facundo' }));
    for (const id of ['app', 'sidebar', 'topbar', 'view']) expect(html).toContain(`id="${id}"`);
    expect(html).toContain('class="nd-admin-crm"');
    expect(html).toContain('Centro de mando');
    for (const label of ['Resumen', 'Nutris', 'Pacientes', 'Cobros', 'Salud', 'Seguridad']) expect(html).toContain(label);
    expect(html).not.toContain('Pipeline');
    expect(html).not.toContain('Bandeja');
    expect(html).not.toContain('Automatizaciones');
    expect(html).not.toContain('Datos de ejemplo');
    expect(html).toContain('Datos reales');
    expect(html).toContain('Facundo');
  });

  it('las vistas muestran datos reales y nunca datos clínicos', () => {
    const pages = [
      renderToStaticMarkup(createElement(ResumenView, { data: resumen, adminName: 'Facundo' })),
      renderToStaticMarkup(createElement(NutrisView, { data: nutris })),
      renderToStaticMarkup(createElement(PacientesView, { data: pacientes })),
      renderToStaticMarkup(createElement(CobrosView, { data: cobros })),
      renderToStaticMarkup(createElement(SaludView, { data: salud })),
      renderToStaticMarkup(createElement(SeguridadView, { data: seguridad })),
    ].join('\n');
    expect(pages).toContain('Nutris activas');
    expect(pages).toContain('Ana Gómez');
    expect(pages).toContain('Solo conteos');
    expect(pages).toContain('Cobrado este mes');
    expect(pages).toContain('Worker');
    expect(pages).toContain('MFA_ENFORCE');
    expect(pages).not.toMatch(/peso|síntoma|diagnóstico|Pipeline|Bandeja|Datos de ejemplo/);
  });
});
