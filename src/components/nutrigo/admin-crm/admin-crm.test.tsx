import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AdminCrm } from './AdminCrm';
import { CobrosView, NutrisView, PacientesView, ResumenView, SaludView, SeguridadView } from './centro-views';
import { BandejaView, ConexionesView, FacturacionView, InicioView, PipelineView } from './hub-views';
import { ActivacionView, CobranzaView, RiesgoView } from './hub-ops-views';
import type { HubFacturacion, HubInicio } from '../../../types/hub';
import { PlanesPrecios } from './PlanesPrecios';
import type { CentroCobros, CentroNutri, CentroPacientes, CentroResumen, CentroSalud, CentroSeguridad } from '../../../types/centro';

vi.mock('../../../api/client', () => ({
  api: {
    getCentroResumen: () => new Promise(() => undefined),
    getCentroNutris: () => new Promise(() => undefined),
    getCentroPacientes: () => new Promise(() => undefined),
    getCentroCobros: () => new Promise(() => undefined),
    getCentroSalud: () => new Promise(() => undefined),
    getCentroSeguridad: () => new Promise(() => undefined),
    getPlanes: () => new Promise(() => undefined),
    getHubInicio: () => new Promise(() => undefined),
    getHubNutris: () => new Promise(() => undefined),
    getHubFicha: () => new Promise(() => undefined),
    getHubLeads: () => new Promise(() => undefined),
    getHubFacturacion: () => new Promise(() => undefined),
    getHubBandeja: () => new Promise(() => undefined),
    getHubConexiones: () => new Promise(() => undefined),
    getHubRiesgo: () => new Promise(() => undefined),
    getHubCobranza: () => new Promise(() => undefined),
    getHubActivacion: () => new Promise(() => undefined),
    cobranzaHub: () => new Promise(() => undefined),
    sugerirHubRespuesta: () => new Promise(() => undefined),
    enviarHubRespuesta: () => new Promise(() => undefined),
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
  it('arma el armazón Nutridash con las secciones reales', () => {
    const html = renderToStaticMarkup(createElement(AdminCrm, { adminName: 'Facundo' }));
    for (const id of ['app', 'sidebar', 'topbar', 'view']) expect(html).toContain(`id="${id}"`);
    expect(html).toContain('class="nd-admin-crm"');
    expect(html).toContain('Centro de mando');
    for (const label of ['Inicio', 'Nutris', 'Pipeline', 'Facturación', 'Bandeja', 'Conexiones', 'Riesgo', 'Cobranza', 'Activación', 'Planes y precios', 'Salud', 'Seguridad']) expect(html).toContain(label);
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

  it('la pantalla de precios muestra el plan oculto, el historial y el botón del degradé', () => {
    const html = renderToStaticMarkup(createElement(PlanesPrecios, {
      onSaved: () => undefined,
      data: {
        editable: true,
        testers: ['facu@nutridash.test'],
        changes: [{ id: 'c1', plan_code: 'arranque', actor_email: 'facu@nutridash.test', monthly_pesos: 24900, annual_pesos: 239040, founder_monthly_pesos: 14940, founder_annual_pesos: 179280, active: true, created_at: '2026-11-02T18:00:00Z' }],
        plans: [
          { code: 'arranque', name: 'Arranque', monthly_pesos: 24900, annual_pesos: 239040, founder_monthly_pesos: 14940, founder_annual_pesos: 179280, active: true, listed: true },
          { code: 'prueba', name: 'Prueba', monthly_pesos: 100, annual_pesos: 100, founder_monthly_pesos: 100, founder_annual_pesos: 100, active: true, listed: false },
        ],
      },
    }));
    expect(html).toContain('Planes y precios');
    expect(html).toContain('Oculto. No usa el cupo de fundadora.');
    expect(html).toContain('facu@nutridash.test');
    expect(html).toContain('nd-btn is-action');
    expect(html).toContain('value="100"');
  });

  it('el inicio y las conexiones no inventan números ni dan por conectado un canal', () => {
    const inicio: HubInicio = {
      mrr_pesos: 25000,
      mrr_nota: 'Sale del precio del servicio por las cuentas activas. Todavía no se leen las suscripciones de Mercado Pago.',
      cobrado_mes_pesos: 25000,
      cobrado_nota: 'Pagos manuales confirmados de este mes. Todavía no se leen los cobros de Mercado Pago.',
      trials_activos: 1,
      trials_por_vencer: 1,
      churn_mes: 0,
      altas_nuevas: 2,
      alertas: [{ tone: 'gold', title: 'No se leen los pagos de Mercado Pago', sub: 'La tabla de cobros de la plataforma no respondió. No mostramos un cero inventado.' }],
      riesgos: [{ nutritionist_id: 'n1', nombre: 'Ana Gómez', motivo: 'sin_login', detalle: 'Hace 20 días que no entra.' }],
      resumen: { origen: 'numeros', texto: 'Hoy el ingreso recurrente es de 25000 pesos.', acciones: ['Mirar las cuentas con riesgo de baja.'], nota: 'Este texto sale de los números del día.' },
    };
    const facturacion: HubFacturacion = {
      suscripciones_disponibles: false,
      suscripciones_nota: 'No se pudo leer Mercado Pago. No mostramos un cero en su lugar.',
      suscripciones: [],
      webhooks_disponibles: false,
      webhooks_ok: null,
      webhooks_fallidos: null,
      webhooks_nota: 'No se pudo leer el historial de avisos de Mercado Pago.',
      pagos_fallidos: [],
      reembolsos: [],
      pagos_nota: 'No se pudo leer Mercado Pago. No mostramos un cero en su lugar.',
      afip: { estado: 'proximamente', texto: 'AFIP queda como placeholder. Todavía no hay facturación electrónica.' },
      cobros,
    };
    const html = [
      renderToStaticMarkup(createElement(InicioView, { data: inicio })),
      renderToStaticMarkup(createElement(ConexionesView, { data: { nota: 'WhatsApp y el mail quedan apagados si faltan las credenciales.', conectores: [
        { id: 'whatsapp', nombre: 'WhatsApp Business', detalle: 'Faltan las credenciales.', estado: 'apagado' },
        { id: 'instagram', nombre: 'Instagram', detalle: 'Preparado, todavía no envía.', estado: 'preparado' },
        { id: 'email', nombre: 'Email', detalle: 'Falta el secreto de entrada.', estado: 'apagado' },
      ] } })),
      renderToStaticMarkup(createElement(FacturacionView, { data: facturacion })),
    ].join('\n');
    expect(html).toContain('Ingreso recurrente');
    expect(html).toContain('Hoy en el negocio');
    expect(html).toContain('Sale de los números, sin modelo');
    expect(html).toContain('Riesgo de baja');
    expect(html).toContain('Apagado');
    expect(html).toContain('Preparado');
    expect(html).toContain('Próximamente');
    expect(html).toContain('AFIP queda como placeholder');
    expect(html).toContain('No mostramos un cero');
    expect(html).not.toContain('Datos de ejemplo');
  });

  it('el pipeline se puede arrastrar, la bandeja deja el envío en manos del admin y la cobranza no inventa el valor de vida', () => {
    const html = [
      renderToStaticMarkup(createElement(PipelineView, {
        leads: [{ id: 'l1', name: 'Lola Ruiz', contact: '@lola', source: 'wa', stage: 'demo', next_step: 'Pasar la demo', nutritionist_id: null, created_at: '2026-11-01T10:00:00Z', updated_at: '2026-11-01T10:00:00Z' }],
        disponible: true, nota: '', onCreate: () => undefined, onStage: () => undefined, busy: false, error: '',
        seguimientos: [{ id: 's1', lead_id: 'l1', title: 'Escribirle en 3 días', due_on: '2026-11-04', done: false, created_at: '2026-11-01T10:00:00Z' }],
      })),
      renderToStaticMarkup(createElement(BandejaView, {
        data: { disponible: true, nota: 'Canales apagados.', hilos: [{ id: 'h1', channel: 'email', contact_name: 'Mia', contact_handle: 'mia@x.test', status: 'abierto', lead_id: null, nutritionist_id: null, updated_at: '2026-11-01T10:00:00Z', messages: [{ id: 'm1', thread_id: 'h1', direction: 'in', body: 'Quiero el plan.', sent_at: '2026-11-01T10:00:00Z' }], borrador: { body: 'Gracias por escribirnos.', origen: 'plantilla' } }] },
        onAnotar: () => undefined, onLead: () => undefined, onSugerir: () => undefined, onEnviar: () => undefined, busy: false, error: '',
      })),
      renderToStaticMarkup(createElement(RiesgoView, { items: [{ nutritionist_id: 'n1', nombre: 'Ana Gómez', motivo: 'pago_rechazado', detalle: 'Mercado Pago rechazó un cobro.' }], dias: 14, nota: 'Sale del último ingreso.', onFiltrar: () => undefined })),
      renderToStaticMarkup(createElement(CobranzaView, {
        data: { mrr_pesos: null, mrr_nota: 'No se pudo leer Mercado Pago.', churn_mes: 0, churn_nota: 'Bajas reales.', ltv_pesos: null, ltv_nutris: null, ltv_nota: 'No se pudieron leer los pagos.', pagos_fallidos: [], avisos: [], mail: { listo: false, nota: 'El aviso está apagado.' }, releer: { listo: false, nota: 'Falta la clave.' } },
        busy: false, error: '', onAviso: () => undefined, onReleer: () => undefined,
      })),
      renderToStaticMarkup(createElement(ActivacionView, {
        data: { disponible: true, nota: 'Sin la base, plan, cobro y página quedan sin dato.', filas: [{ nutritionist_id: 'n1', nombre: 'Ana Gómez', creada: '2026-10-01', trabada: true, pasos: [{ id: 'perfil', label: 'Perfil', estado: 'hecho' }, { id: 'paciente', label: 'Primer paciente', estado: 'pendiente' }, { id: 'plan', label: 'Primer plan', estado: 'sin_dato' }, { id: 'cobro', label: 'Cobro', estado: 'sin_dato' }, { id: 'pagina', label: 'Página pública', estado: 'sin_dato' }] }] },
      })),
    ].join('\n');
    expect(html).toContain('draggable="true"');
    expect(html).toContain('Escribirle en 3 días');
    expect(html).toContain('Sugerir respuesta');
    expect(html).toContain('Borrador fijo, la IA está apagada');
    expect(html).toContain('Enviar');
    expect(html).toContain('Sin dato');
    expect(html).toContain('trabada');
    expect(html).not.toContain('Datos de ejemplo');
  });
});
