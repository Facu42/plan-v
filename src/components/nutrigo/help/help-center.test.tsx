import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { HELP_ARTICLES, HELP_CATEGORIES } from './help-articles';
import { helpResultLabel, searchHelp } from './help-search';
import { HelpCenter } from './HelpCenter';
import { PROFESSIONAL_MODULES } from '../professional-modules';
import { buildAppHref, isAllowedPage, resolveAppLocation } from '../app-location';
import { PAGE_LABELS } from '../ShowroomPanels';

describe('Contenido del Centro de ayuda', () => {
  it('tiene categorías y artículos coherentes, sin identificadores repetidos', () => {
    const categoryIds = HELP_CATEGORIES.map(category => category.id);
    const articleIds = HELP_ARTICLES.map(article => article.id);
    expect(new Set(categoryIds).size).toBe(categoryIds.length);
    expect(new Set(articleIds).size).toBe(articleIds.length);
    for (const category of HELP_CATEGORIES) expect(HELP_ARTICLES.some(article => article.category === category.id)).toBe(true);
    for (const article of HELP_ARTICLES) {
      expect(categoryIds).toContain(article.category);
      expect(article.title.length).toBeGreaterThan(8);
      expect(article.summary.length).toBeGreaterThan(20);
      expect(article.steps.length).toBeGreaterThanOrEqual(2);
      for (const related of article.related) expect(articleIds).toContain(related);
    }
  });

  it('cada artículo lleva a una pantalla que existe en el consultorio', () => {
    for (const article of HELP_ARTICLES) {
      const url = new URL(article.goTo.href, 'https://plan-v.test');
      const location = resolveAppLocation({ pathname: url.pathname, lockedRole: 'pro' });
      expect(url.pathname.startsWith('/crm/'), article.id).toBe(true);
      expect(location.page, article.id).not.toBe('desarrollo');
      expect(isAllowedPage('pro', location.page), article.id).toBe(true);
    }
  });

  it('no describe funciones que el plan todavía marca como «en preparación»', () => {
    const planned = PROFESSIONAL_MODULES.filter(module => !module.href && module.id !== 'ayuda').map(module => module.title);
    const text = HELP_ARTICLES.map(article => [article.title, article.summary, ...article.steps, article.tip ?? ''].join(' ')).join(' ');
    for (const title of planned) expect(text, title).not.toContain(title);
    expect(text).not.toMatch(/Academy|Mercado Pago|Meta Ads|pixel/i);
  });

  it('el módulo «Centro de ayuda» pasa a estar disponible y la ruta es sólo del consultorio', () => {
    const module = PROFESSIONAL_MODULES.find(item => item.id === 'ayuda');
    expect(module?.href).toBe('/crm/ayuda');
    expect(module?.current.length).toBeGreaterThan(0);
    expect(isAllowedPage('pro', 'ayuda')).toBe(true);
    expect(isAllowedPage('patient', 'ayuda')).toBe(false);
    expect(PAGE_LABELS.ayuda).toBe('Centro de ayuda');
  });

  it('el parámetro del artículo no viaja a otras pantallas', () => {
    const origin = 'https://plan-v.test/crm/ayuda?articulo=como-registro-un-paciente';
    expect(buildAppHref(origin, 'pro', 'ayuda')).toContain('articulo=');
    expect(buildAppHref(origin, 'pro', 'pacientes')).not.toContain('articulo');
  });
});

describe('Búsqueda de artículos', () => {
  it('encuentra sin distinguir tildes, mayúsculas ni formas del verbo', () => {
    expect(searchHelp('TURNO').map(article => article.id)).toContain('turno-editar-cancelar');
    expect(searchHelp('cancelar').map(article => article.id)).toContain('turno-editar-cancelar');
    expect(searchHelp('invitacion').map(article => article.id)).toContain('paciente-nuevo-invitar');
  });

  it('exige todas las palabras y ordena primero lo que coincide con el título', () => {
    const results = searchHelp('cancelar turno');
    expect(results[0].id).toBe('turno-editar-cancelar');
    expect(searchHelp('cancelar turno pizza')).toEqual([]);
    expect(searchHelp('   ')).toEqual([]);
  });

  it('informa la cantidad con singular y plural', () => {
    expect(helpResultLabel(1, 'turno')).toBe('1 resultado para «turno»');
    expect(helpResultLabel(3, 'plan')).toBe('3 resultados para «plan»');
    expect(helpResultLabel(0, 'zzz')).toBe('Sin resultados para «zzz»');
  });
});

describe('Pantalla del Centro de ayuda', () => {
  it('sin búsqueda muestra el encabezado, el buscador y las categorías con sus preguntas', () => {
    const html = renderToStaticMarkup(<HelpCenter onNavigate={vi.fn()} />);
    expect(html).toContain('¿En qué te damos una mano?');
    expect(html).toContain('type="search"');
    for (const category of HELP_CATEGORIES) expect(html).toContain(category.title);
    expect(html).toContain('¿Cómo edito, reagendo o cancelo un turno?');
  });

  it('con búsqueda muestra la cantidad y tarjetas con categoría, pregunta y respuesta breve', () => {
    const html = renderToStaticMarkup(<HelpCenter onNavigate={vi.fn()} initialQuery="turno" />);
    expect(html).toMatch(/\d+ resultados? para «turno»/);
    expect(html).toContain('Agenda y turnos');
    expect(html).toContain('¿Cómo edito, reagendo o cancelo un turno?');
  });

  it('sin coincidencias explica qué hacer en vez de mostrar una lista vacía', () => {
    const html = renderToStaticMarkup(<HelpCenter onNavigate={vi.fn()} initialQuery="zzzzqq" />);
    expect(html).toContain('Sin resultados para «zzzzqq»');
    expect(html).toContain('Probá con otras palabras');
  });

  it('abre un artículo con ruta, pasos numerados, relacionados y botón a la pantalla', () => {
    const html = renderToStaticMarkup(<HelpCenter onNavigate={vi.fn()} initialArticleId="turno-editar-cancelar" />);
    expect(html).toContain('<ol');
    expect(html).toContain('Centro de ayuda');
    expect(html).toContain('Agenda y turnos');
    expect(html).toContain('Artículos relacionados');
    expect(html).toContain('Ir a la agenda');
  });

  it('un artículo inexistente vuelve a la portada con un aviso claro', () => {
    const html = renderToStaticMarkup(<HelpCenter onNavigate={vi.fn()} initialArticleId="no-existe" />);
    expect(html).toContain('No encontramos ese artículo');
    expect(html).toContain('¿En qué te damos una mano?');
  });
});
