import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { WorkspaceSearchResponse } from '../../types/search';
import { GlobalSearch, SearchResultsPanel, MIN_SEARCH_LENGTH, planSearch } from './GlobalSearch';

const data: WorkspaceSearchResponse = {
  query: 'lu',
  patients: [{ id: 'p-1', name: 'Lucía F.', href: '/crm/ficha?paciente=p-1' }],
  recipes: [{ id: 'r-1', title: 'Lentejas con arroz', href: '/crm/biblioteca?biblioteca=recetas' }],
  foods: [{ id: 'f-1', name: 'Lentejas secas', detail: 'Legumbres', own: false, href: '/crm/alimentos' }],
  totals: { patients: 1, recipes: 1, foods: 14 },
  source: 'supabase',
};
const noop = { onPick: vi.fn(), onRetry: vi.fn() };

describe('Buscador global de la barra superior', () => {
  it('renderiza el campo con el texto de ayuda y sin panel hasta que se escribe', () => {
    const html = renderToStaticMarkup(<GlobalSearch onOpenPatient={vi.fn()} onOpenHref={vi.fn()} />);
    expect(html).toContain('Buscar pacientes, recetas, alimentos…');
    expect(html).toContain('type="search"');
    expect(html).not.toContain('aria-label="Resultados de la búsqueda"');
  });

  it('agrupa los resultados por tipo e incluye los artículos de ayuda', () => {
    const help = [{ id: 'turno-editar-cancelar', title: '¿Cómo edito, reagendo o cancelo un turno?' }];
    const html = renderToStaticMarkup(<SearchResultsPanel query="lu" state={{ status: 'ready', data, help }} {...noop} />);
    for (const heading of ['Pacientes', 'Recetas', 'Alimentos', 'Ayuda']) expect(html).toContain(`>${heading}`);
    expect(html).toContain('Lucía F.');
    expect(html).toContain('Lentejas con arroz');
    expect(html).toContain('Lentejas secas');
    expect(html).toContain('¿Cómo edito, reagendo o cancelo un turno?');
    expect(html).toContain('14 en total');
  });

  it('omite los grupos vacíos y dice cuándo no hay ninguna coincidencia', () => {
    const onlyPatients = renderToStaticMarkup(<SearchResultsPanel query="lu" state={{ status: 'ready', data: { ...data, recipes: [], foods: [], totals: { patients: 1, recipes: 0, foods: 0 } }, help: [] }} {...noop} />);
    expect(onlyPatients).toContain('Pacientes');
    expect(onlyPatients).not.toContain('Recetas');
    const none = renderToStaticMarkup(<SearchResultsPanel query="zzz" state={{ status: 'ready', data: { ...data, patients: [], recipes: [], foods: [], totals: { patients: 0, recipes: 0, foods: 0 } }, help: [] }} {...noop} />);
    expect(none).toContain('Sin resultados para «zzz»');
  });

  it('distingue carga, error y consulta demasiado corta; el error no dice que no hay resultados', () => {
    expect(renderToStaticMarkup(<SearchResultsPanel query="lu" state={{ status: 'loading' }} {...noop} />)).toContain('Buscando…');
    const failed = renderToStaticMarkup(<SearchResultsPanel query="lu" state={{ status: 'error' }} {...noop} />);
    expect(failed).toContain('No pudimos buscar');
    expect(failed).toContain('Reintentar');
    expect(failed).not.toContain('Sin resultados');
    expect(renderToStaticMarkup(<SearchResultsPanel query="l" state={{ status: 'short' }} {...noop} />)).toContain('al menos 2 letras');
  });

  it('decide cuándo consultar al servidor: no con una letra ni con espacios', () => {
    expect(MIN_SEARCH_LENGTH).toBe(2);
    expect(planSearch('')).toEqual({ status: 'idle' });
    expect(planSearch(' l ')).toEqual({ status: 'short' });
    expect(planSearch('  lu  ')).toEqual({ status: 'query', q: 'lu' });
  });
});
