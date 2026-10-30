import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ProfessionalRecipe } from '../../types/recipes';
import { PanelPlanRecetasVista, recetasVisibles } from './PanelPlanRecetas';

export const recetaEjemplo: ProfessionalRecipe = {
  id: 'recipe-a', title: 'Arroz con pollo', status: 'draft', created_at: '2026-10-29', published: null,
  current: { id: 'v1', version: 1, yield_portions: 2, steps: ['Cocinar y servir.'], nutrient_source: '', published_at: null,
    ingredients: [{ id: 'i1', name: 'Arroz integral', quantity: 150, unit: 'g' }],
    card: { category: 'Almuerzo', culinary_categories: [], prep_minutes: 20, macro_status: 'unavailable', macros: null, cover_status: 'none', cover_url: null, cover_alt: '' },
  },
};
const actions = { onFiltro: vi.fn(), onConsulta: vi.fn(), onSeleccionar: vi.fn(), onEditar: vi.fn(), onPublicar: vi.fn(), onCompartir: vi.fn(), onAgregar: vi.fn(), onReintentar: vi.fn() };
const dibujar = (recipe: ProfessionalRecipe = recetaEjemplo) => renderToStaticMarkup(<PanelPlanRecetasVista recetas={[recipe]} elegida={recipe} filtro="Todas" consulta="" cargando={false} ocupado={false} error="" aviso="" pacienteNombre="Sofía" puedeCompartir puedeAgregar {...actions}/>);

describe('Recetas en Planes, v29', () => {
  it('mantiene lista, búsqueda, tarjeta y detalle del boceto sin inventar imágenes ni nutrientes', () => {
    const html = dibujar();
    for (const clase of ['fx pfx', 'fxs prgrid', 'prc on', 'fxp g pfs', 'r29-search', 'mnum', 'fxkv', 'pul', 'macts pbot']) expect(html).toContain(`class="${clase}"`);
    expect(html).toContain('Buscar receta o ingrediente');
    expect(html).toContain('150 g · Arroz integral');
    expect(html).toContain('Sin foto');
    expect(html).toContain('Sin dato');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('450 kcal');
    expect(html).toContain('Publicar borrador');
    expect(html).toMatch(/disabled=""[^>]*>Compartir en su app/);
    expect(html).toMatch(/disabled=""[^>]*>Agregar al plan de Sofía/);
  });
  it('no infiere sin gluten o vegetariana a partir del nombre/ingredientes', () => {
    expect(recetasVisibles([recetaEjemplo], 'Sin gluten', '')).toEqual([]);
    expect(recetasVisibles([recetaEjemplo], 'Vegetariana', '')).toEqual([]);
    expect(recetasVisibles([recetaEjemplo], 'Rápida', '').length).toBe(1);
    expect(recetasVisibles([recetaEjemplo], 'Todas', 'integral').length).toBe(1);
    expect(recetasVisibles([recetaEjemplo], 'Todas', 'pollo').length).toBe(1);
  });
  it('compartir o agregar se habilita solo con versión publicada y destino válido', () => {
    const published = { ...recetaEjemplo, status: 'published' as const, published: { ...recetaEjemplo.current, published_at: '2026-10-29' } };
    const html = dibujar(published);
    expect(html).not.toMatch(/disabled=""[^>]*>Compartir en su app/);
    expect(html).not.toMatch(/disabled=""[^>]*>Agregar al plan de Sofía/);
  });
});
