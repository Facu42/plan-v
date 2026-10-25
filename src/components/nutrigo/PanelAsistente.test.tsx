import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PortfolioAnswer } from '../../types/portfolio';
import { PanelAsistenteVista, type TurnoAsistente } from './PanelAsistente';
import { fuentesDe, nombresDePropuestas, propuestasDe, textoIdeas, textoPermiso } from './asistente-presentacion';

const respuesta = (parcial: Partial<PortfolioAnswer> = {}): PortfolioAnswer => ({
  answer: 'Cartera activa: 2 pacientes. En los últimos 30 días hay 6 comidas registradas.',
  proposals: [{ patient_id: 'sofia', text: 'Sumar una vianda los días de guardia.', source_ids: [] }],
  general_proposals: ['  ', 'Mirar la semana antes de cambiar el plan.'],
  sources: [{
    patient_id: 'sofia', name: 'Sofía Gómez', meal_count: 6, previous_meal_count: 4,
    pending_review: 1, adherence: null, source_ids: ['comida-1'],
  }],
  excluded_without_consent: 1,
  mode: 'local',
  ...parcial,
});

describe('propuestas del asistente', () => {
  it('no muestra propuestas si la IA está apagada o la respuesta es local', () => {
    expect(propuestasDe(respuesta(), false)).toEqual([]);
    expect(propuestasDe(respuesta({ mode: 'ai' }), false)).toEqual([]);
    expect(propuestasDe(respuesta(), true)).toEqual([]);
  });

  it('con la IA prendida conserva el texto y no inventa una ficha para una idea general', () => {
    const ideas = propuestasDe(respuesta({ mode: 'ai' }), true);
    expect(ideas.map(idea => idea.texto)).toEqual([
      'Sumar una vianda los días de guardia.',
      'Mirar la semana antes de cambiar el plan.',
    ]);
    expect(ideas[0].ficha).toContain('seccion=resumen');
    expect(ideas[0].ficha).toContain('paciente=sofia');
    expect(ideas[1].ficha).toBeNull();
  });

  it('pone el nombre de la fuente en la propuesta de esa paciente', () => {
    const fuentes = fuentesDe(respuesta(), [{ id: 'sofia', name: 'Sofía Gómez', initials: 'SG', tone: 'mint' }]);
    const [propia] = nombresDePropuestas(propuestasDe(respuesta({ mode: 'ai' }), true), fuentes);
    expect(propia.nombre).toBe('Sofía Gómez');
    expect(fuentes[0]).toMatchObject({ registros: 6, iniciales: 'SG', ficha: expect.stringContaining('seccion=alimentario') });
  });

  it('dice quién quedó afuera y que nada se manda solo', () => {
    expect(textoPermiso(0)).toContain('Quien no dio permiso queda afuera');
    expect(textoPermiso(1)).toContain('1 paciente no dio permiso');
    expect(textoPermiso(2)).toContain('2 pacientes no dieron permiso');
    expect(textoIdeas(false, false, '')).toContain('Nada se manda solo');
    expect(textoIdeas(true, false, 'Sin cupo.')).toContain('no trajo propuestas');
  });
});

function turno(parcial: Partial<TurnoAsistente> = {}): TurnoAsistente {
  return {
    clave: 't1',
    pregunta: 'Resumen de la cartera',
    respuesta: 'En 30 días hay 6 comidas.',
    aviso: '',
    excluidas: 0,
    propuestas: [],
    fuentes: [{ id: 'sofia', nombre: 'Sofía Gómez', registros: 6, iniciales: 'SG', fondo: '#D6EBA3', ficha: '/crm/ficha?paciente=sofia&seccion=alimentario' }],
    ...parcial,
  };
}

function pantalla(turnos: TurnoAsistente[] = [turno()]) {
  return renderToStaticMarkup(<PanelAsistenteVista
    pregunta=""
    propuestasOn={false}
    turnos={turnos}
    estado="lista"
    ocupado={false}
    error=""
    aviso=""
    acciones={null}
    onPregunta={() => {}}
    onConsultar={() => {}}
    onSugerencia={() => {}}
    onToggle={() => {}}
    onFicha={() => {}}
    onFuente={() => {}}
    onRevisar={() => {}}
  />);
}

describe('pantalla del asistente', () => {
  it('copia el cuerpo del boceto y no inventa el gasto ni un envío', () => {
    const html = pantalla();
    expect(html).toContain('id="s-asistente"');
    expect(html).toContain('data-mk="1"');
    expect(html).toContain('Conversación');
    expect(html).toContain('Consultar');
    expect(html).toContain('¿Qué comidas están por revisar?');
    expect(html).toContain('Gasto de este mes');
    expect(html).toContain('Sin dato');
    expect(html).toContain('US$ 5');
    expect(html).toContain('Propuestas');
    expect(html).toContain('Prender');
    expect(html).toContain('6 registros · ficha');
    expect(html).not.toContain('WhatsApp');
    expect(html).not.toContain('US$ 0,40');
    expect(html).not.toContain('US$ 1,40');
    expect(html).not.toContain('Enviar');
    expect(html).not.toContain('Paula');
  });

  it('deja la propuesta para revisar, con ficha y sin mandarla', () => {
    const html = pantalla([turno({
      propuestas: [{ clave: 'p1', texto: 'Sumar una vianda.', ficha: '/crm/ficha?paciente=sofia&seccion=resumen', nombre: 'Sofía Gómez' }],
    })]);
    expect(html).toContain('Propuesta para revisar.');
    expect(html).toContain('Abrir ficha');
    expect(html).toContain('Marcar revisada');
    expect(html).not.toContain('Enviar');
  });

  it('una idea general no abre una ficha inventada', () => {
    const html = pantalla([turno({
      propuestas: [{ clave: 'g0', texto: 'Mirar la semana.', ficha: null, nombre: null }],
    })]);
    expect(html).toContain('Mirar la semana.');
    expect(html).toContain('Marcar revisada');
    expect(html).not.toContain('Abrir ficha');
  });
});
