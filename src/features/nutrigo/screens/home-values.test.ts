import { describe, expect, it } from 'vitest';
import { dayOfIso, cleanAmount, daysBefore, litresLabel, monthYearLabel, percentLabel, portionsLabel, safePercent, weekDays, weightChangeLabel } from './home-values';

describe('safePercent', () => {
  it('acota a 0-100 y nunca devuelve NaN ni Infinity', () => {
    expect(safePercent(50, 200)).toBe(25);
    expect(safePercent(500, 200)).toBe(100);
    expect(safePercent(-5, 200)).toBe(0);
    expect(safePercent(Number.NaN, 200)).toBeNull();
    expect(safePercent(10, Number.NaN)).toBeNull();
    expect(safePercent(Number.POSITIVE_INFINITY, 200)).toBeNull();
    expect(safePercent(10, 0)).toBeNull();
    expect(safePercent(null, 10)).toBeNull();
    expect(safePercent(undefined, 10)).toBeNull();
  });
});

describe('percentLabel', () => {
  it('muestra el porcentaje real aunque pase de 100 y tope razonable', () => {
    expect(percentLabel(180, 100)).toBe('180%');
    expect(percentLabel(37.4, 100)).toBe('37%');
    expect(percentLabel(0, 100)).toBe('0%');
    expect(percentLabel(5000, 10)).toBe('+999%');
  });
  it('sin dato o sin referencia muestra raya', () => {
    expect(percentLabel(null, 100)).toBe('—');
    expect(percentLabel(10, 0)).toBe('—');
    expect(percentLabel(Number.NaN, 100)).toBe('—');
    expect(percentLabel(-3, 100)).toBe('0%');
  });
});

describe('litresLabel', () => {
  it('un vaso son 250 ml y se muestran hasta dos decimales', () => {
    expect(litresLabel(5)).toBe('1,25');
    expect(litresLabel(3)).toBe('0,75');
    expect(litresLabel(8)).toBe('2');
    expect(litresLabel(0)).toBe('0');
  });
  it('valores inválidos o negativos se muestran como 0', () => {
    expect(litresLabel(Number.NaN)).toBe('0');
    expect(litresLabel(-4)).toBe('0');
    expect(litresLabel(Number.POSITIVE_INFINITY)).toBe('0');
  });
});

describe('portionsLabel', () => {
  it('concuerda el singular y el plural', () => {
    expect(portionsLabel(1)).toBe('1 porción');
    expect(portionsLabel(0.5)).toBe('0,5 porciones');
    expect(portionsLabel(1.25)).toBe('1,25 porciones');
    expect(portionsLabel(2)).toBe('2 porciones');
  });
});

describe('weekDays', () => {
  it('escritorio: lunes a sábado con hoy dentro', () => {
    const days = weekDays('2026-10-07', 6);
    expect(days.map(day => day.id)).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10']);
    expect(days.map(day => day.label)).toEqual(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']);
  });
  it('escritorio en domingo: corre la ventana para que hoy se vea', () => {
    const days = weekDays('2026-10-11', 6);
    expect(days.map(day => day.id)).toContain('2026-10-11');
    expect(days[days.length - 1].label).toBe('Dom');
  });
  it('celular: domingo a sábado y cruza el límite de mes sin desfasarse', () => {
    const days = weekDays('2026-10-31', 7);
    expect(days.map(day => day.id)).toEqual(['2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31']);
    expect(days.map(day => day.day)).toEqual([25, 26, 27, 28, 29, 30, 31]);
    expect(weekDays('2026-12-30', 7).map(day => day.id)).toContain('2027-01-02');
  });
  it('fecha inválida no rompe', () => {
    expect(weekDays('no-es-fecha', 6)).toEqual([]);
  });
});

describe('monthYearLabel', () => {
  it('sale de la fecha de Buenos Aires, no de la zona del navegador', () => {
    expect(monthYearLabel('2026-10-31')).toEqual({ month: 'Octubre', year: '2026' });
    expect(monthYearLabel('2027-01-01')).toEqual({ month: 'Enero', year: '2027' });
  });
});

describe('daysBefore', () => {
  it('resta días sobre el calendario', () => {
    expect(daysBefore('2026-10-07', 6)).toBe('2026-10-01');
    expect(daysBefore('2026-10-03', 6)).toBe('2026-09-27');
    expect(daysBefore('2027-01-02', 6)).toBe('2026-12-27');
  });
});

describe('weightChangeLabel', () => {
  it('describe la variación desde el inicio', () => {
    expect(weightChangeLabel(72, 74, 'kg')).toBe('−2 kg desde el inicio');
    expect(weightChangeLabel(75.5, 74, 'kg')).toBe('+1,5 kg desde el inicio');
  });
  it('sin cambio o con cambio menor al decimal mostrado dice sin cambios', () => {
    expect(weightChangeLabel(74, 74, 'kg')).toBe('Sin cambios desde el inicio');
    expect(weightChangeLabel(74.02, 74, 'kg')).toBe('Sin cambios desde el inicio');
  });
  it('datos inválidos no muestran NaN', () => {
    expect(weightChangeLabel(Number.NaN, 74, 'kg')).toBe('Primer registro');
  });
});

describe('cleanAmount', () => {
  it('descarta lo que no es un número finito y no negativo', () => {
    expect(cleanAmount(5)).toBe(5);
    expect(cleanAmount(0)).toBe(0);
    for (const bad of [-1, Number.NaN, Number.POSITIVE_INFINITY, null, undefined]) expect(cleanAmount(bad)).toBeNull();
  });
});
describe('dayOfIso', () => {
  it('toma el día de Buenos Aires y no rompe con fechas inválidas', () => {
    expect(dayOfIso('2026-10-01T01:00:00Z')).toBe('2026-09-30');
    expect(dayOfIso('2026-10-01T00:30:00-03:00')).toBe('2026-10-01');
    expect(dayOfIso('no es fecha')).toBeNull();
    expect(dayOfIso(undefined)).toBeNull();
  });
});
