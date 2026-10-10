import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { CrmFeedResponse } from '../../types/crm-feed';
import { CarteraFeedView, groupFeedByDay } from './CarteraFeed';

const feed: CrmFeedResponse = {
  from: '2026-10-04', to: '2026-10-10', source: 'memory',
  items: [
    { id: 'meal:m2', kind: 'meal', patient_id: 'p2', patient_name: 'Bea', date: '2026-10-09', at: '2026-10-10T01:30:00Z', slot: 'Cena', status: 'confirmed', href: '/crm/ficha?paciente=p2&seccion=registros' },
    { id: 'water:p1:2026-10-09', kind: 'water', patient_id: 'p1', patient_name: 'Ana', date: '2026-10-09', at: '2026-10-09T20:00:00Z', glasses: 5, href: '/crm/ficha?paciente=p1&seccion=registros' },
    { id: 'meal:m1', kind: 'meal', patient_id: 'p1', patient_name: 'Ana', date: '2026-10-09', at: '2026-10-09T15:00:00Z', slot: 'Almuerzo', status: 'pending_review', href: '/crm/ficha?paciente=p1&seccion=registros' },
    { id: 'meal:m0', kind: 'meal', patient_id: 'p1', patient_name: 'Ana', date: '2026-10-07', at: '2026-10-07T15:00:00Z', slot: 'Desayuno', status: 'adjusted', href: '/crm/ficha?paciente=p1&seccion=registros' },
  ],
};
const patients = [{ id: 'p1', name: 'Ana' }, { id: 'p2', name: 'Bea' }];
const render = (props: Partial<Parameters<typeof CarteraFeedView>[0]> = {}) => renderToStaticMarkup(
  <CarteraFeedView feed={feed} loading={false} error="" patients={patients} days={7} status="all" patientId="" onChange={vi.fn()} onOpen={vi.fn()} {...props} />);

describe('novedades de la cartera', () => {
  it('agrupa por día y, dentro de cada día, por paciente', () => {
    const days = groupFeedByDay(feed.items);
    expect(days.map((day) => day.date)).toEqual(['2026-10-09', '2026-10-07']);
    expect(days[0].patients.map((patient) => patient.name)).toEqual(['Bea', 'Ana']);
    expect(days[0].meals).toBe(2);
    expect(days[0].pending).toBe(1);
  });

  it('cada día resume comidas, pendientes y agua, y abre el detalle por paciente', () => {
    const html = render();
    expect(html).toContain('Novedades de la cartera');
    expect(html).toContain('2 comidas · 1 por revisar · agua de 1 paciente');
    expect(html).toContain('Almuerzo');
    expect(html).toContain('Por revisar');
    expect(html).toContain('Revisada');
    expect(html).toContain('5 vasos de agua');
    expect(html).toContain('aria-label="Abrir la ficha de Ana"');
  });

  it('desde cada paciente se puede escribirle sin salir a buscarla', () => {
    const html = render();
    expect(html).toContain('href="/crm/ficha?paciente=p1&amp;seccion=mensajes"');
    expect(html).toContain('aria-label="Escribirle a Ana"');
  });

  it('ofrece filtros de período, revisión y paciente', () => {
    const html = render();
    for (const text of ['Últimos 7 días', 'Últimos 14 días', 'Últimos 30 días', 'Todas', 'Por revisar', 'Revisadas', 'Todas las pacientes', 'Bea']) expect(html).toContain(text);
  });

  it('sin registros en el período lo dice sin culpar a la paciente, y muestra el error si la consulta falla', () => {
    expect(render({ feed: { ...feed, items: [] } })).toContain('Sin registros en este período');
    expect(render({ feed: { ...feed, items: [] } })).not.toMatch(/incumpl/i);
    expect(render({ feed: null, error: 'No pudimos consultar las novedades.' })).toContain('No pudimos consultar las novedades.');
  });
});
