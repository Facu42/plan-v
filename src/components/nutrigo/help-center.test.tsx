import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HelpCenter } from './HelpCenter';
import { filterGuides, guideBySlug, HELP_GUIDES, HELP_START, HELP_TOPICS, HELP_FAQ } from './help-center-model';
import { panelNavCurrent } from './PanelNavigation';
import { isAllowedPage } from './app-location';

describe('Centro de ayuda v29', () => {
  it('busca en título, pasos y error, normalizando espacios y mayúsculas', () => {
    expect(filterGuides('  INVITACIONES  ', 'todas').map(g => g.title)).toEqual(['Pacientes e invitaciones']);
    expect(filterGuides('invitación', 'todas').map(g => g.title)).toEqual(expect.arrayContaining(['Tu primera paciente', 'Pacientes e invitaciones']));
    expect(filterGuides('XLSX', 'todas').map(g => g.title)).toContain('Importar una cartera');
    expect(filterGuides('conciliación', 'todas').map(g => g.title)).toContain('Agenda y cobranzas');
    expect(filterGuides('zzzz', 'todas')).toEqual([]);
    expect(filterGuides('slug', 'todas').map(g => g.slug)).toContain('alta');
    expect(filterGuides('reseña', 'todas').map(g => g.slug)).toContain('resenas-google');
    expect(HELP_START.every(slug => guideBySlug(slug))).toBe(true);
  });
  it('combina tema y búsqueda y conserva destinos del panel', () => {
    for (const [topic] of HELP_TOPICS.slice(1)) expect(filterGuides('', topic).every(g => g.topic === topic)).toBe(true);
    expect(filterGuides('XLSX', 'mensajes')).toEqual([]);
    for (const item of [...HELP_GUIDES, ...HELP_FAQ]) {
      expect(item.href).toMatch(/^\/crm\//);
      expect(isAllowedPage('pro', new URL(item.href, 'https://plan.v').pathname.split('/')[2])).toBe(true);
    }
    expect(panelNavCurrent('/crm/ayuda', '/crm/desarrollo?modulo=ayuda')).toBe(true);
    expect(isAllowedPage('pro', 'ayuda')).toBe(true);
    expect(isAllowedPage('patient', 'ayuda')).toBe(false);
  });
  it('renderiza las dos columnas del boceto sin cifras de consultas inventadas', () => {
    const html = renderToStaticMarkup(<HelpCenter onOpen={vi.fn()} />);
    for (const text of ['Temas', 'Preguntas frecuentes', 'Pedir ayuda a Nutridash', 'Abrir apartado', 'sxguide']) expect(html).toContain(text);
    expect(html).not.toMatch(/\d+ consultas este mes/);
    expect(html).toContain('Sin medición de consultas');
    expect(html).not.toMatch(/gmail\.com|facundorodriguez/i);
  });
});
