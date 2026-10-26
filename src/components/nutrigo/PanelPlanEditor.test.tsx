import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { ProfessionalMealPlan } from '../../types/plans';
import { PanelPlanEditor } from './PanelPlanEditor';

const paciente = {
  id: 'pat-sofia', name: 'Sofía R.', initials: 'SR', tone: 'mint' as const,
  goal: 'Comer con más regularidad', plan_b: 'Tostada', next_focus: 'Cenas', sensitive_hours: 'Después de las 20:30',
};

function editor(plan: ProfessionalMealPlan | null) {
  return renderToStaticMarkup(<PanelPlanEditor
    paciente={paciente}
    pacientes={[paciente]}
    planes={{ 'pat-sofia': plan }}
    plan={plan}
    cargando={false}
    hoy="2026-10-26"
    onElegir={vi.fn()}
    onPlan={vi.fn()}
    onAviso={vi.fn()}
  />);
}

describe('editor del plan', () => {
  it('sin plan muestra las cuatro formas de empezar', () => {
    const html = editor(null);
    expect(html).toContain('todavía no tiene plan');
    expect(html).toContain('Armar con el asistente');
    expect(html).toContain('Elegir plantilla');
    expect(html).toContain('Elegir paciente');
    expect(html).toContain('Empezar vacío');
    expect(html).toContain('Lo que ya sabés de Sofía');
    expect(html).toContain('Comer con más regularidad');
  });

  it('con plan muestra la semana, las pestañas y duplicar día', () => {
    const plan = {
      id: '11111111-1111-4111-8111-111111111111',
      patient_id: 'pat-sofia',
      timezone: 'America/Argentina/Buenos_Aires',
      created_at: '2026-10-01T12:00:00Z',
      published: null,
      current: {
        id: 'ver',
        version: 1,
        status: 'draft' as const,
        period_start: '2026-10-26',
        period_end: '2026-11-01',
        published_at: null,
        nutrition_target: { kcal: 1800, protein_g: 90, carbs_g: 180, fat_g: 50, revision: 1, published_at: '2026-10-01T12:00:00Z' },
        items: [{
          id: 'item-1', for_date: '2026-10-26', slot: 'Almuerzo' as const, recipe_id: 'rec-1', recipe_version: 1,
          recipe_title: 'Pollo al horno', recipe: null, free_text: null, portions: 1, public_note: '',
        }],
      },
    };
    const html = editor(plan);
    expect(html).toContain('Comidas');
    expect(html).toContain('Indicaciones');
    expect(html).toContain('Compras');
    expect(html).toContain('Versiones');
    expect(html).toContain('Entrega');
    expect(html).toContain('Comidas del día');
    expect(html).toContain('Duplicar día');
    expect(html).toContain('Cambiar plato de Almuerzo');
    expect(html).toContain('Pollo al horno');
    expect(html).toContain('1.800 kcal');
    expect(html).toContain('Asistente IA');
    expect(html).toContain('Asistente del plan');
    expect(html).toContain('Ajustar con IA');
    expect(html).toContain('Compartir con Sofía');
    expect(html).toContain('En su app');
    expect(html).toContain('Por mail');
    expect(html).toContain('PDF descargable');
    expect(html).toContain('Impreso');
    expect(html).toContain('Compartir ahora');
    expect(html).toContain('Gestión del plan');
    expect(html).toContain('Asistente con IA');
    expect(html).toContain('Programar publicación');
    expect(html).toContain('Ver como Sofía');
    expect(html).toContain('Historial de cambios');
    expect(html).toContain('Pedile un cambio');
    expect(html).toContain('Cambios en');
    expect(html).not.toContain('Abrir PDF / imprimir');
    expect(html).toContain('Vista del resumen');
    expect(html).toContain('Análisis');
    expect(html).toContain('App');
    expect(html).toContain('PDF');
    expect(html).not.toContain('parte 3');
    expect(html).toContain('Guardar como plantilla');
    expect(html).toContain('Copiar a otra paciente');
    expect(html).toContain('Ajustar metas');
    expect(html).not.toMatch(/>Más</);
    expect(html).not.toContain('<details');
    expect(html).toContain('Sin cuidados cargados');
    expect(html).not.toContain('meal-plan-form');
    const semanas = botonesSemana(html);
    expect(semanas).toContain('>1<');
    expect(semanas).not.toContain('>2<');
    expect(lugarDeLasSemanas(html)).toBe('arriba');
  });

  it('un plan de cuatro semanas muestra los cuatro círculos juntos', () => {
    const plan = {
      id: '11111111-1111-4111-8111-111111111111',
      patient_id: 'pat-sofia',
      timezone: 'America/Argentina/Buenos_Aires',
      created_at: '2026-10-01T12:00:00Z',
      published: null,
      current: {
        id: 'ver',
        version: 1,
        status: 'draft' as const,
        period_start: '2026-10-26',
        period_end: '2026-11-22',
        published_at: null,
        items: [{
          id: 'item-1', for_date: '2026-10-26', slot: 'Almuerzo' as const, recipe_id: null, recipe_version: null,
          recipe_title: null, recipe: null, free_text: 'Ensalada', portions: null, public_note: '',
        }],
      },
    };
    const html = editor(plan);
    const semanas = botonesSemana(html);
    expect(semanas).toContain('>1<');
    expect(semanas).toContain('>2<');
    expect(semanas).toContain('>3<');
    expect(semanas).toContain('>4<');
    expect(semanas).not.toContain('>5<');
    expect(lugarDeLasSemanas(html)).toBe('arriba');
  });
});

function lugarDeLasSemanas(html: string) {
  const semana = html.indexOf('aria-label="Elegir semana"');
  const vista = html.indexOf('aria-label="Vista de las comidas"');
  const dia = html.indexOf('aria-label="Elegir día"');
  return semana >= 0 && semana < vista && vista < dia ? 'arriba' : 'abajo';
}

function botonesSemana(html: string) {
  const inicio = html.indexOf('aria-label="Elegir semana"');
  return html.slice(inicio, html.indexOf('</div>', inicio));
}
