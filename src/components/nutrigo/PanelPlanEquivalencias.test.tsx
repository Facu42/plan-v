import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { foodInputSchema, type Food } from '../../types/foods';
import type { ExchangeGroup } from '../../types/nutrition-capabilities';
import { calcularEquivalencias, PanelPlanEquivalenciasVista } from './PanelPlanEquivalencias';

function comida(id: string, kcal: number | null, ml = false): Food {
  const { expected_revision: _, ...base } = foodInputSchema.parse({ id, expected_revision: 0, name: ml ? 'Leche' : 'Arroz', kind: 'food', source: 'Etiqueta revisada', nutrients: { kcal }, portions: [{ name: 'Taza', grams: 150 }] });
  return { ...base, revision: 1, owner_id: 'nutri', updated_at: '2026-10-29', ...(ml ? { composition: { dataset: 'sara2-2022-v1', source_sha256: 'x', record_id: 'r', basis: { amount: 100, unit: 'ml' }, carbohydrates: 'available', source_page: 1 } as const } : {}) };
}
const origen = comida('a0000000-0000-4000-8000-000000000001', 100);
const destino = comida('a0000000-0000-4000-8000-000000000002', 50, true);
const grupo = { id: 'g', name: 'Grupo revisado', reference: 'Etiqueta de los alimentos', revision: 1, owner_id: 'nutri', updated_at: '2026-10-29', items: [{ food: origen, grams: 100 }, { food: destino, grams: null, quantity: 200, unit: 'ml' }] } as ExchangeGroup;

describe('equivalencias v29 con referencias reales', () => {
  it('calcula misma energía y conserva g y ml sin suponer densidad ni medidas caseras', () => {
    const r = calcularEquivalencias(origen, 150, [origen, destino]);
    expect(r?.energia).toBe(150);
    expect(r?.alternativas).toHaveLength(1);
    expect(r?.alternativas[0]).toMatchObject({ quantity: 300, unit: 'ml', kcal: 150, casera: '—' });
  });
  it('no calcula con cantidades inválidas o energía ausente; no inventa alternativas de energía cero', () => {
    for (const q of [0, -1, NaN, Infinity, 100001]) expect(calcularEquivalencias(origen, q, [destino])).toBeNull();
    expect(calcularEquivalencias({ ...origen, nutrients: { ...origen.nutrients, kcal: null } }, 100, [destino])).toBeNull();
    expect(calcularEquivalencias(origen, 100, [comida(destino.id, 0), comida('a0000000-0000-4000-8000-000000000003', null)])?.alternativas).toEqual([]);
  });
  it('una porción pequeña no se convierte en cero por el redondeo del boceto', () => {
    expect(calcularEquivalencias(origen, 1, [destino])?.alternativas[0].quantity).toBe(2);
  });
  it('copia las columnas, clases y advertencia del boceto, con grupos propios y sin switch ficticio', () => {
    const html = renderToStaticMarkup(<PanelPlanEquivalenciasVista grupos={[grupo]} grupoId="g" alimentoId={origen.id} cantidad="150" estado="lista" onGrupo={vi.fn()} onAlimento={vi.fn()} onCantidad={vi.fn()} onEditar={vi.fn()} onReintentar={vi.fn()} />);
    for (const s of ['class="fx pfx"', 'class="peqin"', 'class="peqk"', 'id="peg"', 'id="peqf"', 'id="peqg"', 'class="fxs fxtb tall"', 'La equivalencia compara energía dentro de un grupo.', '300 ml', 'Últimos cambios en los planes', 'En la app de la paciente', 'Grupos']) expect(html).toContain(s);
    expect(html).toMatch(/role="switch" disabled="" aria-checked="false"/);
    expect(html).not.toContain('Arroz por quinoa');
    expect(html).not.toContain('Tu plan · almuerzo');
  });
  it('sin grupos explica el vacío y permite crear uno sin mostrar resultados inventados', () => {
    const html = renderToStaticMarkup(<PanelPlanEquivalenciasVista grupos={[]} grupoId="" alimentoId="" cantidad="150" estado="lista" onGrupo={vi.fn()} onAlimento={vi.fn()} onCantidad={vi.fn()} onEditar={vi.fn()} onReintentar={vi.fn()} />);
    expect(html).toContain('Todavía no hay grupos revisados.');
    expect(html).toContain('Crear grupo');
    expect(html).not.toContain('kcal</td>');
  });
});
