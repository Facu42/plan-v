import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  borradorPlantilla,
  estadoInstagram,
  estadoMail,
  estadoWhatsApp,
  evaluarActivacion,
  ltvRealizado,
  resumenDeNumeros,
  riesgoDias,
  riesgosDe,
  seguimientoSiCambia,
  sumarDias,
} from './hub-ops.js';

const hoy = '2026-11-03';

describe('riesgo, valor de vida y activación', () => {
  it('marca sin login, pocas pacientes y pago rechazado, y saltea las cuentas de prueba', () => {
    const rows = riesgosDe({
      today: hoy,
      diasSinLogin: 14,
      pagosRechazados: new Set(['n2']),
      cuentas: [
        { id: 'n1', nombre: 'Ana', last_sign_in_at: null, created_at: '2026-10-01', patients_active: 0, is_test: false },
        { id: 'n2', nombre: 'Luz', last_sign_in_at: '2026-11-02T10:00:00Z', created_at: '2026-11-01', patients_active: 8, is_test: false },
        { id: 'n3', nombre: 'Prueba', last_sign_in_at: null, created_at: '2026-01-01', patients_active: 0, is_test: true },
      ],
    });
    expect(rows.map((row) => `${row.nutritionist_id}:${row.motivo}`).sort()).toEqual(['n1:pocos_pacientes', 'n1:sin_login', 'n2:pago_rechazado']);
    expect(riesgoDias({ HUB_RIESGO_DIAS: '400' })).toBe(14);
    expect(riesgoDias({ HUB_RIESGO_DIAS: '21' })).toBe(21);
  });

  it('el valor de vida queda vacío si no se leyeron los pagos y es cero si no hay cobros aprobados', () => {
    expect(ltvRealizado({ disponible: false, pagos: [] }).pesos).toBeNull();
    expect(ltvRealizado({ disponible: true, pagos: [{ nutritionist_id: 'n1', status: 'rejected', amount_cents: 1000 }] })).toMatchObject({ pesos: 0, nutris: 0 });
    expect(ltvRealizado({
      disponible: true,
      pagos: [
        { nutritionist_id: 'n1', status: 'approved', amount_cents: 10_000 },
        { nutritionist_id: 'n1', status: 'approved', amount_cents: 10_000 },
        { nutritionist_id: 'n2', status: 'approved', amount_cents: 20_000 },
      ],
    }).pesos).toBe(200);
  });

  it('una cuenta nueva no se marca trabada y una vieja con un paso pendiente sí', () => {
    const nueva = evaluarActivacion({ nombre: 'Ana Gómez', pacientes: 0, planes: false, cobro: false, pagina: false, creada: '2026-11-01', today: hoy });
    expect(nueva.trabada).toBe(false);
    expect(nueva.pasos.find((paso) => paso.id === 'perfil')?.estado).toBe('hecho');
    const vieja = evaluarActivacion({ nombre: 'Ana Gómez', pacientes: 0, planes: null, cobro: null, pagina: null, creada: '2026-10-01', today: hoy });
    expect(vieja.trabada).toBe(true);
    expect(vieja.pasos.find((paso) => paso.id === 'plan')?.estado).toBe('sin_dato');
  });

  it('el seguimiento sale al pasar a demo, prueba o paga, y el resumen no se hace pasar por IA', () => {
    expect(seguimientoSiCambia('lead')).toBeNull();
    expect(seguimientoSiCambia('demo')).toMatchObject({ title: 'Escribirle en 3 días', days: 3 });
    expect(sumarDias('2026-11-03', 3)).toBe('2026-11-06');
    const resumen = resumenDeNumeros({ altas: 1, churn: 0, trialsPorVencer: 0, riesgos: 0, pagosFallidos: null, mrr: null });
    expect(resumen.origen).toBe('numeros');
    expect(resumen.texto).not.toMatch(/la IA dijo|el modelo/i);
    expect(borradorPlantilla('Hola')).toMatch(/Gracias por escribirnos/);
  });

  it('WhatsApp y el mail quedan apagados sin credenciales e Instagram queda preparado', () => {
    expect(estadoWhatsApp({}).estado).toBe('apagado');
    expect(estadoWhatsApp({
      WHATSAPP_ACCESS_TOKEN: 't', WHATSAPP_PHONE_ID: '1', WHATSAPP_BUSINESS_ID: '2',
      WHATSAPP_ENABLED: 'true', WHATSAPP_APP_SECRET: 's', WHATSAPP_VERIFY_TOKEN: 'v',
    }).estado).toBe('listo');
    expect(estadoMail({}).estado).toBe('apagado');
    expect(estadoMail({ BREVO_API_KEY: 'k', BREVO_SENDER_EMAIL: 'hola@x.test', HUB_INBOX_EMAIL_SECRET: 's' }).estado).toBe('listo');
    expect(estadoInstagram().estado).toBe('preparado');
  });

  it('la migración nueva tiene seguridad por fila y no borra tablas', () => {
    const sql = readFileSync(new URL('../../supabase/migrations/20261103233000_platform_hub_ops.sql', import.meta.url), 'utf8');
    expect(sql).toMatch(/enable row level security/i);
    expect(sql).toMatch(/is_platform_admin/);
    expect(sql).toMatch(/auth\.uid\(\)/);
    expect(sql.split('\n').some((line) => /^\s*drop table/i.test(line))).toBe(false);
    expect(sql).not.toMatch(/\bDRAFT\b|DO NOT APPLY|NO CORRER/);
  });
});
