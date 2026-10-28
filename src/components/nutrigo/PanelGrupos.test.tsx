import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PanelGrupos, gruposConCantidad, pacientesDelGrupo } from './PanelGrupos';

const pacientes = [{ id: 'a', name: 'Ana Gómez' }, { id: 'b', name: 'Bea Ruiz' }, { id: 'c', name: 'Cora Paz' }];
const grupos = [{ label: 'Running', patient_ids: ['a', 'c'] }, { label: 'Celíacas', patient_ids: ['b', 'zzz'] }];

describe('grupos de pacientes', () => {
  it('filtra por grupo sin distinguir mayúsculas y devuelve todas sin grupo', () => {
    expect(pacientesDelGrupo(pacientes, grupos, 'running').map(p => p.id)).toEqual(['a', 'c']);
    expect(pacientesDelGrupo(pacientes, grupos, null)).toHaveLength(3);
    expect(pacientesDelGrupo(pacientes, grupos, 'Inexistente')).toEqual([]);
  });

  it('cuenta solo a las pacientes disponibles y saca los grupos vacíos', () => {
    expect(gruposConCantidad(grupos, new Set(['a', 'b']))).toEqual([{ label: 'Running', cantidad: 1 }, { label: 'Celíacas', cantidad: 1 }]);
    expect(gruposConCantidad(grupos, new Set(['a']))).toEqual([{ label: 'Running', cantidad: 1 }]);
  });

  it('dibuja el cajón del boceto con «Todas» y cada grupo con su cantidad', () => {
    const html = renderToStaticMarkup(<PanelGrupos pacientes={pacientes} grupos={[{ label: 'Running', cantidad: 2 }]} actual="running" total={3} onVer={() => undefined} onCrear={async () => true} onClose={() => undefined} />);
    expect(html).toContain('Grupos de pacientes');
    expect(html).toContain('aria-label="Todas · 3" aria-checked="false"');
    expect(html).toContain('aria-label="Running · 2" aria-checked="true"');
    expect(html).toContain('placeholder="Por ejemplo: Taller de cocina"');
    expect(html).toContain('Sumar al nuevo grupo');
    expect(html).toContain('Ana Gómez');
    expect(html).toContain('Ver este grupo');
  });
});
