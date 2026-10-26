import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PanelPlanesVista } from './PanelPlanes';
import type { FilaPlan } from './planes-lista';

const sofia: FilaPlan = {
  id: 'pat-sofia', nombre: 'Sofía R.', iniciales: 'SR', tono: 'mint', titulo: '1.800 kcal por día',
  objetivo: 'Bajar 3 kg', estado: 'Publicado', clase: 'p-conf', semana: '2 de 2', accion: 'Abrir plan',
};
const ana: FilaPlan = {
  id: 'pat-ana', nombre: 'Ana', iniciales: 'AN', tono: 'peach', titulo: 'Sin plan todavía',
  objetivo: 'Sin objetivo cargado', estado: 'Sin plan', clase: 'p-bad', semana: '—', accion: 'Crear plan',
};

const acciones = {
  onVista: vi.fn(), onRecetas: vi.fn(), onConsulta: vi.fn(), onOrden: vi.fn(), onFiltro: vi.fn(),
  onLimpiar: vi.fn(), onEditor: vi.fn(), onAsistente: vi.fn(), onReintentar: vi.fn(),
};

function vista(extra: Partial<Parameters<typeof PanelPlanesVista>[0]> = {}) {
  return renderToStaticMarkup(<PanelPlanesVista
    vista="lista" nombre="Sofía" filas={[sofia, ana]} consulta="" orden="nombre" filtro="todos"
    aviso="" error={false} tareas={[ana]} {...acciones} {...extra}
  />);
}

describe('planes, la entrada', () => {
  it('dibuja la navegación, el listado y la columna de la derecha como el boceto', () => {
    const html = vista();
    expect(html).toContain('id="s-planes"');
    expect(html).toContain('aria-label="Secciones de Planes"');
    expect(html).toContain('Todos los planes');
    expect(html).toContain('Plan de Sofía');
    expect(html).toContain('Recetas');
    expect(html).toContain('Plantillas');
    expect(html).toContain('Equivalencias');
    expect(html).toContain('Planes de tus pacientes');
    expect(html).toContain('2 pacientes');
    expect(html).toContain('Buscar paciente, plan u objetivo…');
    expect(html).toContain('Nombre A–Z');
    expect(html).toContain('Necesitan atención primero');
    expect(html).toContain('Por vencer');
    expect(html).toContain('Sofía R.');
    expect(html).toContain('1.800 kcal por día');
    expect(html).toContain('Abrir plan de Sofía R.');
    expect(html).toContain('Crear plan para Ana');
    expect(html).toContain('Tu próxima acción');
    expect(html).toContain('Crear su primer plan');
    expect(html).toContain('Pedidos de cambio');
    expect(html).toContain('No hay pedidos pendientes.');
    expect(html).toContain('Crear con el asistente');
    expect(html).toContain('Elegir paciente y empezar');
    expect(vista({ onArmar: vi.fn() })).toContain('Armar con IA');
    expect(html).not.toContain('siguen en Planes');
    expect(html).not.toContain('Vence el viernes');
    expect(html).not.toContain('meal-plan-form');
  });

  it('sin coincidencias muestra el vacío del boceto y sin pacientes un vacío honesto', () => {
    expect(vista({ consulta: 'zzzz' })).toContain('No hay planes con esta búsqueda');
    expect(vista({ consulta: 'zzzz' })).toContain('Limpiar búsqueda y filtros');
    const html = vista({ filas: [], tareas: [] });
    expect(html).toContain('Todavía no hay pacientes');
    expect(html).toContain('0 pendientes');
    expect(html).toContain('No hay pendientes.');
  });

  it('las plantillas y las equivalencias quedan para después, y el plan muestra el editor', () => {
    expect(vista({ vista: 'plan', editor: <p>Semana del plan</p> })).toContain('Semana del plan');
    expect(vista({ vista: 'plan', editor: <p>Semana del plan</p> })).toContain('pux-plan');
    expect(vista({ vista: 'plantillas' })).toContain('Las plantillas de Planes quedan para una pasada aparte.');
    expect(vista({ vista: 'equivalencias' })).toContain('La calculadora de equivalencias sigue en su módulo.');
    expect(vista({ aviso: 'Próximamente. El armado con el asistente llega en la parte 3.', error: true })).toContain('No se pudo leer el estado de los planes.');
  });
});
