import { describe, expect, it } from 'vitest';
import type { Patient } from '../../types';
import type { PatientRowPreview } from '../../types/patient-preview';
import {
  avanceDe, barrasDeLaSemana, contarFiltros, encabezadoPacientes, estadoDe, filtrarPacientes, graficoDeAvance, graficoDePeso, metaEnKg,
  necesitaAtencion, pacienteDesde, planPorVencer, proximaConsulta, serieDePeso, ultimoRegistro,
} from './pacientes-presentacion';

const AHORA = new Date('2026-10-27T15:00:00Z'); // martes 27, 12:00 en Buenos Aires
const HOY = '2026-10-27';
const semana = { start: '2026-10-21', end: '2026-10-27', recorded_days: 5, meals_logged: 12, meals_pending: 0, water_days: 3, water_average: 6, pending_review: 0 };
const base = {
  id: 'a', name: 'Ana', initials: 'A', tone: 'mint', status: 'En ritmo', billing_status: 'active', billing_until: null, stage: 'seguimiento', goal: 'Bajar a 65 kg',
  sensitive_hours: '', plan_b: '', next_focus: '', adherence_score: 85, adherence_why: '', time: '', hydration: 0, energy: null, sleep_minutes: null,
  appointment: null, appointment_history: [{ id: 'h', when: '', dateId: '2026-10-01', duration: 30, channel: 'video', action: 'elapsed', actor: 'system', at: '2026-10-01T15:00:00Z' }],
  weekly_registration: semana, habit_logs: [], todayPlan: [], weekPlan: [], brief: null, timeline: [], messages: [], meal_logs: [],
} as unknown as Patient;
const con = (extra: Partial<Patient>): Patient => ({ ...base, ...extra });
const plan = (status: PatientRowPreview['plan']['status'], period_end: string | null): PatientRowPreview => ({ patient_id: 'a', can_open: true, latest_weight: null, plan: { status, period_start: null, period_end, has_draft: status === 'draft' } });

describe('pacientes v29: solapas y estado', () => {
  it('Necesitan atención suma lo pendiente de revisar y la adherencia baja con registros, no la falta de registros', () => {
    expect(necesitaAtencion(con({ weekly_registration: { ...semana, pending_review: 2 } }))).toBe(true);
    expect(necesitaAtencion(con({ adherence_score: 48 }))).toBe(true);
    expect(necesitaAtencion(con({ adherence_score: 0, weekly_registration: { ...semana, recorded_days: 0 } }))).toBe(false);
    expect(necesitaAtencion(con({ adherence_score: 40, archived_at: '2026-09-01' }))).toBe(false);
  });
  it('Plan por vencer cuenta solo planes vigentes que terminan en siete días o menos', () => {
    expect(planPorVencer(plan('published', '2026-10-30'), HOY)).toBe(true);
    expect(planPorVencer(plan('published', '2026-11-10'), HOY)).toBe(false);
    expect(planPorVencer(plan('published', '2026-10-20'), HOY)).toBe(false);
    expect(planPorVencer(plan('draft', '2026-10-30'), HOY)).toBe(false);
    expect(planPorVencer(undefined, HOY)).toBe(false);
  });
  it('la cantidad de «Plan por vencer» espera a tener el plan de cada una', () => {
    const lista = [base, con({ id: 'b' })];
    expect(contarFiltros(lista, {}, HOY).vencer).toBeNull();
    expect(contarFiltros(lista, { a: plan('published', '2026-10-29'), b: { ...plan('none', null), patient_id: 'b' } }, HOY).vencer).toBe(1);
  });
  it('Primera vez es quien tiene turno y ninguna consulta hecha; Inactivas, quien está archivada o desactivada', () => {
    const nueva = con({ id: 'n', appointment_history: [], appointment: { when: 'x', duration: 30, channel: 'video' } });
    const lista = [base, nueva, con({ id: 'x', archived_at: '2026-09-01' }), con({ id: 'y', deactivated_at: '2026-09-01' })];
    const cuenta = contarFiltros(lista, {}, HOY);
    expect([cuenta.todas, cuenta.primera, cuenta.inactivas]).toEqual([2, 1, 2]);
    expect(filtrarPacientes(lista, '', 'inactivas', {}, HOY, 'name', AHORA).map(p => p.id)).toEqual(['x', 'y']);
    expect(filtrarPacientes(lista, 'ana', 'todas', {}, HOY, 'name', AHORA)).toHaveLength(2);
  });
  it('el estado sigue el orden de las solapas y la cuota sale aparte', () => {
    expect(estadoDe(base, undefined, null, HOY)).toMatchObject({ texto: 'Activa', pill: 'p-conf', cuota: '' });
    expect(estadoDe(con({ goal_status: 'completed' }), undefined, null, HOY).texto).toBe('En objetivo');
    expect(estadoDe(con({ has_account: false }), undefined, null, HOY).texto).toBe('Acceso pendiente');
    expect(estadoDe(con({ adherence_score: 50 }), undefined, null, HOY).texto).toBe('Atención');
    expect(estadoDe(base, plan('draft', null), null, HOY).texto).toBe('Plan por aprobar');
    expect(estadoDe(con({ archived_at: '2026-09-01' }), undefined, null, HOY).texto).toBe('Archivada');
  });
});

describe('pacientes v29: lo que dibuja cada fila', () => {
  it('escribe la próxima consulta como el boceto', () => {
    const turno = (starts_at: string) => con({ appointment: { when: '', duration: 30, channel: 'video', starts_at } });
    expect(proximaConsulta(turno('2026-10-27T20:30:00Z'), AHORA)).toBe('Hoy 17:30');
    expect(proximaConsulta(turno('2026-10-28T12:00:00Z'), AHORA)).toBe('Mañana 9:00');
    expect(proximaConsulta(turno('2026-10-30T13:00:00Z'), AHORA)).toBe('Vie 30, 10:00');
    expect(proximaConsulta(turno('2026-11-10T13:00:00Z'), AHORA)).toBe('10/11');
    expect(proximaConsulta(base, AHORA)).toBe('Sin turno');
  });
  it('dice cuándo fue el último registro, o que no hay', () => {
    expect(ultimoRegistro(base, AHORA)).toEqual({ texto: 'sin registros', viejo: true });
    const comida = (logged_at: string) => con({ meal_logs: [{ logged_at } as Patient['meal_logs'][number]] });
    expect(ultimoRegistro(comida('2026-10-27T12:10:00Z'), AHORA)).toEqual({ texto: 'hoy, 9:10', viejo: false });
    expect(ultimoRegistro(comida('2026-10-26T12:10:00Z'), AHORA)).toEqual({ texto: 'ayer', viejo: false });
    expect(ultimoRegistro(comida('2026-10-22T12:10:00Z'), AHORA)).toEqual({ texto: 'hace 5 días', viejo: true });
  });
  it('el avance sale de la ficha y no inventa lo que falta', () => {
    expect(avanceDe(con({ goal_progress: 61.4 }), undefined)).toEqual({ pct: 61, texto: '61 %' });
    expect(avanceDe(con({ goal_progress: 61 }), { ...plan('none', null), latest_weight: { value: 68.4, unit: 'kg', captured_on: HOY } })?.texto).toBe('61 % · 68,4 kg');
    expect(avanceDe(base, undefined)).toBeNull();
    expect(avanceDe(con({ goal: '', goal_progress: 10 }), undefined)).toBeNull();
  });
  it('la línea de arriba cuenta activas, adherencia, objetivos del año y quienes no registraron', () => {
    const lista = [base, con({ id: 'b', adherence_score: 45 }), con({ id: 'c', adherence_score: 0, weekly_registration: { ...semana, recorded_days: 0 } }), con({ id: 'd', goal_status: 'completed', goal_updated_at: '2026-03-02T12:00:00Z' }), con({ id: 'e', archived_at: '2026-01-01' })];
    expect(encabezadoPacientes(lista, AHORA)).toEqual({ sufijo: '· 4 activas', cuando: 'Adherencia promedio 72 % · 1 llegó a su objetivo este año · 1 sin registrar esta semana' });
    expect(encabezadoPacientes([], AHORA)).toEqual({ sufijo: '· 0 activas', cuando: 'Adherencia promedio sin dato · 0 llegaron a su objetivo este año · 0 sin registrar esta semana' });
  });
});

describe('pacientes v29: detalle', () => {
  it('saca la meta en kilos del objetivo escrito', () => {
    expect(metaEnKg('Bajar a 65 kg')).toBe(65); expect(metaEnKg('Mantener 62,5 kg')).toBe(62.5); expect(metaEnKg('Comer ordenado')).toBeNull();
  });
  it('arma la serie de peso con las últimas diez mediciones y descarta las futuras', () => {
    const medida = (n: number, dia: string) => ({ kind: 'weight' as const, captured_on: dia, created_at: `${dia}T10:00:00Z`, value_numeric: n });
    const medidas = [...Array.from({ length: 12 }, (_, k) => medida(70 - k, `2026-09-${String(k + 1).padStart(2, '0')}`)), medida(50, '2026-12-01'), { ...medida(99, '2026-09-20'), kind: 'waist' as const }];
    const serie = serieDePeso(medidas, HOY);
    expect(serie).toHaveLength(10); expect(serie[0]!.fecha).toBe('2026-09-03'); expect(serie[9]!.valor).toBe(59);
  });
  it('el gráfico de peso muestra la variación, el objetivo y se sostiene con una sola medición o ninguna', () => {
    const g = graficoDePeso([{ fecha: '2026-09-01', valor: 69.6 }, { fecha: '2026-10-01', valor: 68.4 }], 'Bajar a 65 kg');
    expect(g.actual).toBe('68,4'); expect(g.variacion).toEqual({ texto: '−1,2 kg', sube: false }); expect(g.meta?.kg).toBe(65); expect(g.pie).toBe('últimas 2 mediciones · objetivo 65 kg');
    expect(graficoDePeso([{ fecha: '2026-09-01', valor: 70 }], '').variacion).toBeNull();
    const vacio = graficoDePeso([], 'Comer ordenado');
    expect(vacio).toMatchObject({ ultimo: null, actual: '—', curva: '', pie: 'sin mediciones' });
    expect(`${g.curva}${g.area}`).not.toMatch(/NaN/);
  });
  it('el medio círculo dice cuánto falta solo si hay peso y objetivo en kilos', () => {
    expect(graficoDeAvance(61, 'Bajar a 65 kg', 68.4).pie).toBe('faltan 3,4 kg');
    expect(graficoDeAvance(61, 'Comer ordenado', 68.4).pie).toBe('comer ordenado');
    expect(graficoDeAvance(0, 'Bajar a 65 kg', 68.4)).toMatchObject({ pie: 'falta la primera medición', fin: null });
  });
  it('las barras cuentan comidas de los últimos siete días contra cuatro por día', () => {
    const comidas = ['2026-10-27T12:00:00Z', '2026-10-27T15:00:00Z', '2026-10-27T18:00:00Z', '2026-10-27T21:00:00Z', '2026-10-26T15:00:00Z', '2026-10-10T15:00:00Z'].map(logged_at => ({ logged_at }));
    const { barras, total, promedio } = barrasDeLaSemana(comidas, AHORA);
    expect(barras).toHaveLength(7); expect(total).toBe(5);
    expect(barras[6]).toMatchObject({ letra: 'M', hoy: true, alto: 100, comidas: 4, nivel: '' });
    expect(barras[5]).toMatchObject({ alto: 25, nivel: 'lo' }); expect(promedio).toBe(18);
  });
  it('dice desde cuándo es paciente', () => {
    expect(pacienteDesde('2026-03-05T12:00:00Z', AHORA)).toBe('marzo'); expect(pacienteDesde('2025-06-05T12:00:00Z', AHORA)).toBe('junio 2025');
    expect(pacienteDesde('2026-10-27T13:00:00Z', AHORA)).toBe('hoy'); expect(pacienteDesde(undefined, AHORA)).toBe('Sin dato');
  });
});
