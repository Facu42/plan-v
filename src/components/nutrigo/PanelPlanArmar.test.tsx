import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { OpcionesImpresion } from './PanelPlanAsistente';
import { PanelPlanArmar } from './PanelPlanArmar';

const sofia = {
  id: 'pat-sofia', name: 'Sofía R.', initials: 'SR', tone: 'mint' as const,
  goal: 'Regularidad', plan_b: 'Tostada', next_focus: 'Cenas', sensitive_hours: 'Después de las 20:30',
};

describe('armar un plan con IA', () => {
  it('muestra el pedido, la ficha y el tope, sin un gasto inventado', () => {
    const html = renderToStaticMarkup(<PanelPlanArmar
      pacientes={[sofia]} pacienteId="pat-sofia" kcal={1800} hoy="2026-10-26" armando={false}
      onPaciente={vi.fn()} onAviso={vi.fn()} onCrear={vi.fn()}
    />);
    expect(html).toContain('Un plan pensado para Sofía');
    expect(html).toContain('Cambiar paciente');
    expect(html).toContain('Dictar pedido');
    expect(html).toContain('Adjuntar referencia');
    expect(html).toContain('Tipo de alimentación');
    expect(html).toContain('Necesidades clínicas');
    expect(html).toContain('Agregar');
    expect(html).toContain('Incluir en el plan');
    expect(html).toContain('Crear propuesta del plan');
    expect(html).toContain('No usar');
    expect(html).toContain('Uso de IA este mes');
    expect(html).toContain('Cargando…');
    expect(html).toContain('sin verificar');
    expect(html).not.toContain('US$ 1,20');
    expect(html).not.toContain('US$ 1.20');
    expect(html).toContain('no recibe nada hasta que lo publiques');
  });
});

describe('opciones del PDF', () => {
  it('separa descargar e imprimir y muestra los interruptores', () => {
    const html = renderToStaticMarkup(<OpcionesImpresion
      opciones={{ logo: true, caseras: true, compras: true, recetas: false, hoja: true }}
      onCambio={vi.fn()} onDescargar={vi.fn()} onImprimir={vi.fn()}
    />);
    expect(html).toContain('Logo y colores del consultorio');
    expect(html).toContain('Medidas caseras');
    expect(html).toContain('Lista de compras');
    expect(html).toContain('Recetas del plan');
    expect(html).toContain('Una semana por hoja');
    expect(html).toContain('Descargar PDF');
    expect(html).toContain('Imprimir');
    expect(html).not.toContain('todavía no cambian el PDF');
    expect(html).not.toContain('Abrir PDF / imprimir');
  });
});
