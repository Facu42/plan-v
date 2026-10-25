import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { foodInputSchema, SARA2_SOURCE, type Food } from '../../types/foods';
import { PanelAlimentosVista } from './PanelAlimentos';

function alimento(nombre: string, extras: Partial<Food> = {}): Food {
  const { expected_revision: _, ...base } = foodInputSchema.parse({
    id: extras.id ?? 'a0000000-0000-4000-8000-000000000001',
    expected_revision: 0,
    name: nombre,
    kind: 'food',
    source: 'Rótulo del envase',
    category: extras.category ?? 'Propios',
    nutrients: { kcal: 180, protein: 8, carbs: null, fat: 4 },
    portions: [{ name: 'Porción', grams: 80 }],
  });
  return { ...base, owner_id: 'nutri-a', revision: 1, updated_at: '2026-10-25T00:00:00Z', ...extras };
}

const acciones = {
  onVer: vi.fn(), onPorcion: vi.fn(), onGrupo: vi.fn(), onEditar: vi.fn(), onCerrar: vi.fn(),
  onGuardarNuevo: vi.fn(), onGuardarEdicion: vi.fn(), onReintentar: vi.fn(),
};

describe('alimentos, el dibujo', () => {
  const propio = alimento('Tarta de verdura');
  const sara = alimento('Avena arrollada', { id: 'b0000000-0000-4000-8000-000000000002', owner_id: null, source: SARA2_SOURCE, category: 'Cereales', portions: [] });

  const vista = (extra: Partial<Parameters<typeof PanelAlimentosVista>[0]> = {}) => renderToStaticMarkup(<PanelAlimentosVista
    lista={[sara, propio]} total={2} estado="lista" elegido={sara} porcion="100" grupo={[sara]} grupoEstado="lista" grupoHayMas={false}
    dialog={null} toast="" errorForm="" guardando={false} {...acciones} {...extra}
  />);

  it('muestra el catálogo, la energía y los macros, y SARA 2 no se edita', () => {
    const html = vista();
    expect(html).toContain('id="s-alimentos"');
    expect(html).toContain('Catálogo');
    expect(html).toContain('Avena arrollada');
    expect(html).toContain('SARA 2');
    expect(html).toContain('Esta porción');
    expect(html).toContain('100 g');
    expect(html).toContain('1 taza (30 g)');
    expect(html).toContain('1 cucharada (10 g)');
    expect(html).toContain('SARA 2 · Cereales');
    expect(html).toContain('Avena arrollada · por 100 g · SARA 2');
    expect(html).not.toContain('Ministerio de Salud');
    expect(html).toContain('Proteínas');
    expect(html).toContain('Carbohidratos');
    expect(html).toContain('Sin dato');
    expect(html).toContain('Grasas');
    expect(html).toContain('class="sxmac"');
    expect(html).toContain('class="fxdk"');
    expect(html).toContain('No se edita');
    expect(html).toContain('Mismo grupo · Cereales');
    expect(html).toContain('SARA 2 se consulta. Para otro valor, creá un alimento propio.');
    expect(html).not.toContain('WhatsApp');
  });

  it('un alimento propio se edita y el alta no pide datos que el boceto no dibuja', () => {
    const html = vista({ elegido: propio, grupo: [propio], dialog: { kind: 'nuevo' } });
    expect(html).toContain('Editar');
    expect(html).toContain('1 taza (30 g)');
    expect(html).toContain('1 cucharada (10 g)');
    expect(html).toContain('Porción (80 g)');
    expect(html).toContain('Rótulo del envase · Propios');
    expect(html).toContain('Nuevo alimento');
    expect(html).toContain('Queda entre los tuyos. SARA 2 no se toca.');
    expect(html).toContain('Medida casera');
    expect(html).toContain('Gramos');
    expect(html).not.toContain('Micronutrientes');
    expect(html).not.toContain('WhatsApp');
  });

  it('mientras carga el grupo no arrastra el conteo del alimento anterior', () => {
    const html = vista({ elegido: propio, grupo: [sara, sara], grupoEstado: 'cargando' });
    expect(html).toContain('Cargando el grupo…');
    expect(html).toContain('>—<');
    expect(html).not.toContain('2 alimentos');
  });

  it('sin resultados lo dice y no inventa un alimento', () => {
    const html = vista({ lista: [], total: 0, elegido: null, grupo: [], grupoEstado: 'oculto' });
    expect(html).toContain('Ningún alimento con ese texto.');
    expect(html).toContain('Sin elección');
    expect(html).not.toContain('Avena arrollada');
  });
});
