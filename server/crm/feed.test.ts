import { describe, expect, it } from 'vitest';
import { buildFeed, feedQuerySchema } from './feed.js';

const patients = [{ id: 'p1', name: 'Ana' }, { id: 'p2', name: 'Bea' }];
const meals = [
  { id: 'm1', patient_id: 'p1', slot: 'Almuerzo', status: 'pending_review', logged_at: '2026-10-09T15:00:00Z' },
  { id: 'm2', patient_id: 'p2', slot: 'Cena', status: 'confirmed', logged_at: '2026-10-10T01:30:00Z' },
  { id: 'm3', patient_id: 'p1', slot: 'Desayuno', status: 'adjusted', logged_at: '2026-09-01T12:00:00Z' },
  { id: 'm4', patient_id: 'otra', slot: 'Cena', status: 'confirmed', logged_at: '2026-10-09T23:00:00Z' },
];
const habits = [
  { patient_id: 'p1', date: '2026-10-09', hydration: 5, logged_at: '2026-10-09T20:00:00Z' },
  { patient_id: 'p2', date: '2026-10-08', hydration: 0, logged_at: '2026-10-08T20:00:00Z' },
];

describe('novedades de la cartera', () => {
  it('junta comidas y agua del período, por fecha de Argentina, de lo nuevo a lo viejo y sólo de pacientes propias', () => {
    const feed = buildFeed(patients, meals, habits, { days: 7, status: 'all' }, '2026-10-10');
    expect(feed.from).toBe('2026-10-04');
    expect(feed.items.map((item) => item.id)).toEqual(['meal:m2', 'water:p1:2026-10-09', 'meal:m1']);
    // 01:30 UTC del 10/10 es el 9/10 a la noche en Argentina.
    expect(feed.items[0]).toMatchObject({ kind: 'meal', date: '2026-10-09', patient_name: 'Bea', slot: 'Cena', status: 'confirmed' });
  });

  it('no muestra un día sin vasos como si fuera un registro de agua', () => {
    const feed = buildFeed(patients, meals, habits, { days: 7, status: 'all' }, '2026-10-10');
    expect(feed.items.some((item) => item.id === 'water:p2:2026-10-08')).toBe(false);
  });

  it('filtra por revisión: pendientes, o revisadas (confirmadas o ajustadas), y deja afuera el agua', () => {
    const pending = buildFeed(patients, meals, habits, { days: 30, status: 'pending_review' }, '2026-10-10');
    expect(pending.items.map((item) => item.id)).toEqual(['meal:m1']);
    const reviewed = buildFeed(patients, meals, habits, { days: 30, status: 'reviewed' }, '2026-10-10');
    expect(reviewed.items.map((item) => item.id)).toEqual(['meal:m2']);
  });

  it('filtra por paciente y lleva el enlace a la ficha', () => {
    const feed = buildFeed(patients, meals, habits, { days: 7, status: 'all', patient_id: 'p1' }, '2026-10-10');
    expect(feed.items.every((item) => item.patient_id === 'p1')).toBe(true);
    expect(feed.items[0].href).toBe('/crm/ficha?paciente=p1&seccion=registros');
  });

  it('valida la consulta: sólo 7, 14 o 30 días y estados conocidos', () => {
    expect(feedQuerySchema.parse({})).toEqual({ days: 7, status: 'all' });
    expect(feedQuerySchema.safeParse({ days: '5' }).success).toBe(false);
    expect(feedQuerySchema.safeParse({ status: 'approved' }).success).toBe(false);
    expect(feedQuerySchema.safeParse({ nutritionist_id: 'x' }).success).toBe(false);
  });
});
