import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PatientMealPlan } from '../../types/plans';
import type { ShowroomPatient } from './showroom-model';
import { buildWeekTable, matchesPlanSearch, monthWeeks, planWeek, ShowroomPatientPlan, weekdayPlural } from './ShowroomPatientPlan';

const patient = {
  id: 'p1', name: 'Ana', initials: 'AR',
  todayPlan: [{ slot: 'Almuerzo', title: 'Pollo con vegetales', time: '13:00' }],
  weekPlan: [
    { day: 'Lunes', meals: [{ slot: 'Almuerzo', title: 'Pollo con vegetales' }, { slot: 'Cena', title: 'Omelette de verduras' }] },
    { day: 'Miércoles', meals: [{ slot: 'Merienda', title: 'Yogur con fruta' }] },
  ],
} as ShowroomPatient;
const monday = new Date(2026, 8, 14, 12);

const published: PatientMealPlan = {
  id: 'plan-1', timezone: 'America/Argentina/Buenos_Aires', version: 2,
  period_start: '2026-09-16', period_end: '2026-09-17', published_at: '2026-09-15T12:00:00.000Z',
  items: [{
    id: 'i1', for_date: '2026-09-16', slot: 'Almuerzo', recipe_id: null, recipe_version: null, recipe_title: null, recipe: null,
    free_text: 'Bowl de lentejas', portions: null, public_note: '',
  }],
};

describe('Plan semanal paciente Nutrigo (tabla del .fig)', () => {
  it('arma la semana de lunes a domingo con fechas reales y marca hoy', () => {
    const week = planWeek(new Date(2026, 8, 16, 9));
    expect(week.map((day) => day.day)).toEqual(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']);
    expect(week.map((day) => day.isoDate)).toEqual(['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20']);
    expect(week.filter((day) => day.isToday).map((day) => day.day)).toEqual(['Miércoles']);
    expect(planWeek(monday, 1)[0].isoDate).toBe('2026-09-21');
  });

  it('numera las semanas del mes con la regla del jueves', () => {
    const weeks = monthWeeks(2026, 8);
    expect(weeks.map((date) => date.getDate())).toEqual([31, 7, 14, 21]);
    expect(weeks[0].getMonth()).toBe(7);
  });

  it('usa el plan semanal por día y columnas fijas del archivo sin inventar comidas', () => {
    const table = buildWeekTable(patient.weekPlan, null, planWeek(monday));
    expect(table.columns.map((column) => column.slot)).toEqual(['Desayuno', 'Almuerzo', 'Merienda', 'Cena']);
    expect(table.rows[0].cells.Almuerzo?.title).toBe('Pollo con vegetales');
    expect(table.rows[0].cells.Desayuno).toBeUndefined();
    expect(table.rows[2].cells.Merienda?.title).toBe('Yogur con fruta');
    expect(table.total).toBe(3);
  });

  it('dentro del período publicado manda la copia fechada y deja vacíos reales', () => {
    const table = buildWeekTable(patient.weekPlan, published, planWeek(monday));
    const wednesday = table.rows[2];
    const thursday = table.rows[3];
    expect(wednesday.dated).toBe(true);
    expect(wednesday.cells.Almuerzo).toMatchObject({ title: 'Bowl de lentejas', source: 'dated' });
    expect(wednesday.cells.Merienda).toBeUndefined();
    expect(thursday.dated).toBe(true);
    expect(Object.keys(thursday.cells)).toEqual([]);
    expect(table.rows[0].cells.Almuerzo?.source).toBe('template');
  });

  it('agrega Colación o Extra sólo cuando existen', () => {
    const table = buildWeekTable([{ day: 'Lunes', meals: [{ slot: 'Colación', title: 'Fruta' }] }], null, planWeek(monday));
    expect(table.columns.map((column) => column.slot)).toEqual(['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena']);
  });

  it('busca por título o momento ignorando acentos', () => {
    expect(matchesPlanSearch({ slot: 'Almuerzo', title: 'Pollo con vegetales', source: 'template' }, 'VEGETALES')).toBe(true);
    expect(matchesPlanSearch({ slot: 'Colación', title: 'Fruta', source: 'template' }, 'colacion')).toBe(true);
    expect(matchesPlanSearch({ slot: 'Cena', title: 'Sopa', source: 'template' }, 'yogur')).toBe(false);
    expect(weekdayPlural('Sábado')).toBe('sábados');
    expect(weekdayPlural('Lunes')).toBe('lunes');
  });

  it('renderiza barra, selector de semana y la tabla de siete filas por cuatro momentos', () => {
    const html = renderToStaticMarkup(<ShowroomPatientPlan patient={patient} now={monday} query="" />);
    expect(html).toContain('Tu plan semanal');
    expect(html).toContain('Septiembre');
    expect(html).toContain('Semana 3');
    expect(html).toContain('Buscar comidas');
    expect(html).toContain('Filtrar');
    expect(html).toContain('Lista de compras');
    expect(html.match(/data-plan-day=/g)).toHaveLength(7);
    expect(html.match(/role="columnheader"/g)).toHaveLength(5);
    expect(html).toContain('Pollo con vegetales');
    expect(html).toContain('Sin indicación');
    expect(html).not.toMatch(/\b(kcal|gramos|proteína|carbohidratos)\b/i);
  });

  it('atenúa lo que no coincide con la búsqueda sin sacar días', () => {
    const html = renderToStaticMarkup(<ShowroomPatientPlan patient={patient} now={monday} query="yogur" />);
    expect(html.match(/data-plan-day=/g)).toHaveLength(7);
    expect(html.match(/data-dim="true"/g)).toHaveLength(2);
  });

  it('muestra un vacío honesto cuando no hay plan', () => {
    const html = renderToStaticMarkup(<ShowroomPatientPlan patient={{ ...patient, todayPlan: [], weekPlan: [] }} now={monday} query="" />);
    expect(html).toContain('Tu plan está en preparación');
    expect(html).not.toContain('data-plan-day');
  });
});
