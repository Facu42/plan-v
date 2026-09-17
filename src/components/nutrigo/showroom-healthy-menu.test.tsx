import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ShowroomPatient } from './showroom-model';
import { buildHealthyMenu, ShowroomHealthyMenu } from './ShowroomHealthyMenu';

const patient = {
  id: 'p1', name: 'Ana', initials: 'AR', todayPlan: [],
  weekPlan: [
    { day: 'Lunes', meals: [{ slot: 'Almuerzo', title: 'Pollo con vegetales' }, { slot: 'Cena', title: 'Omelette de verduras' }] },
    { day: 'Miércoles', meals: [{ slot: 'Almuerzo', title: 'Pollo con vegetales' }, { slot: 'Merienda', title: 'Yogur con fruta' }] },
  ],
} as unknown as ShowroomPatient;

describe('Menú saludable paciente Nutrigo', () => {
  it('deriva preparaciones únicas del plan publicado sin crear recetas', () => {
    const menu = buildHealthyMenu(patient);
    expect(menu.items).toHaveLength(3);
    expect(menu.totalAssignments).toBe(4);
    expect(menu.slots).toEqual(['Almuerzo', 'Cena', 'Merienda']);
    expect(menu.items[0]).toMatchObject({
      title: 'Pollo con vegetales', occurrences: 2,
      days: ['Lunes', 'Miércoles'], slots: ['Almuerzo'],
    });
  });

  it('muestra sólo datos publicados y explica el alcance limitado', () => {
    const html = renderToStaticMarkup(<ShowroomHealthyMenu patient={patient} query="" onNavigate={() => undefined} />);
    expect(html).toContain('Preparaciones de tu plan');
    expect(html).toContain('Pollo con vegetales');
    expect(html).toContain('2 veces esta semana');
    expect(html).toContain('Imagen ilustrativa');
    expect(html).toContain('No son recetas completas');
    expect(html).not.toMatch(/ingredientes|preparación|porción|kcal|proteína|carbohidrato|grasa/i);
  });

  it('filtra con la búsqueda global sin mezclar otros datos', () => {
    const html = renderToStaticMarkup(<ShowroomHealthyMenu patient={patient} query="yogur" onNavigate={() => undefined} />);
    expect(html).toContain('Yogur con fruta');
    expect(html).not.toContain('Pollo con vegetales');
    expect(html).not.toContain('Omelette de verduras');
  });

  it('presenta un vacío honesto si no hay plan publicado', () => {
    const html = renderToStaticMarkup(<ShowroomHealthyMenu patient={{ ...patient, weekPlan: [] }} query="" onNavigate={() => undefined} />);
    expect(html).toContain('Tu menú está en preparación');
    expect(html).not.toContain('Preparaciones disponibles');
  });
});
