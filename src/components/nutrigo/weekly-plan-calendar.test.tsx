import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { buildCalendarWeek, resolveCalendarMeals, WeeklyPlanCalendar } from './WeeklyPlanCalendar';

const now = new Date(2026, 8, 11, 23, 30);
const plan = {
  todayPlan: [{ slot: 'Almuerzo', title: 'Indicación de hoy', time: '13:00' }],
  weekPlan: [
    { day: 'Viernes', meals: [{ slot: 'Cena', title: 'Plantilla viernes' }] },
    { day: 'Lunes', meals: [{ slot: 'Almuerzo', title: 'Plantilla lunes' }] },
  ],
};

describe('Calendario semanal del menú', () => {
  it('muestra los siete días locales, de lunes a domingo, aunque no tengan plan', () => {
    const days = buildCalendarWeek(now);
    expect(days.map((day) => day.day)).toEqual(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']);
    expect(days.map((day) => day.date.getDate())).toEqual([7, 8, 9, 10, 11, 12, 13]);
    expect(days.filter((day) => day.isToday).map((day) => day.day)).toEqual(['Viernes']);
    expect(now.getDate()).toBe(11);
  });

  it('mantiene la semana al cruzar el año y cuando hoy es domingo', () => {
    const days = buildCalendarWeek(new Date(2027, 0, 3, 0, 5));
    expect(days[0].isoDate).toBe('2026-12-28');
    expect(days[6].isoDate).toBe('2027-01-03');
    expect(days[6].isToday).toBe(true);
  });

  it('conserva el calendario local en años bisiestos', () => {
    expect(buildCalendarWeek(new Date(2028, 1, 29))[1].isoDate).toBe('2028-02-29');
  });

  it('resuelve el día por su nombre, no por la posición del plan incompleto', () => {
    expect(resolveCalendarMeals(plan, now, 0)).toEqual([{ slot: 'Almuerzo', title: 'Plantilla lunes', time: '' }]);
  });

  it('no sustituye un día sin plan por las comidas de hoy', () => {
    expect(resolveCalendarMeals(plan, now, 5)).toEqual([]);
    expect(resolveCalendarMeals(plan, now, 2)).toEqual([]);
  });

  it('Hoy y la fecha actual abren el mismo plan diario sin inventar horarios', () => {
    expect(resolveCalendarMeals(plan, now, -1)).toEqual(plan.todayPlan);
    expect(resolveCalendarMeals(plan, now, 4)).toEqual(plan.todayPlan);
  });

  it('cambia el contenido con el paciente sin conservar comidas del anterior', () => {
    expect(resolveCalendarMeals({ todayPlan: [], weekPlan: [] }, now, 0)).toEqual([]);
  });

  it('identifica selección, fecha actual y fechas completas de manera accesible', () => {
    const html = renderToStaticMarkup(<WeeklyPlanCalendar now={now} selectedIndex={5} onSelect={() => {}} />);
    expect(html.match(/class="nw-day"/g)).toHaveLength(7);
    expect(html).toContain('aria-label="Ver sábado, 12 de septiembre de 2026"');
    expect(html).toContain('aria-current="date"');
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(html).toMatch(/datetime="2026-09-12"/i);
    expect(html).toContain('Volver a hoy');
  });
});
