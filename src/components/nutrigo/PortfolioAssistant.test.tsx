import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ASSISTANT_SUGGESTIONS, type AssistantAnswer } from '../../types/assistant';
import { AssistantThread, PortfolioAssistant } from './PortfolioAssistant';
import { isAllowedPage } from './app-location';
import { PROFESSIONAL_MODULES } from './professional-modules';

const answer: AssistantAnswer = {
  intent: 'attention_today', question: '¿Qué pacientes necesitan atención hoy?',
  summary: 'Hay 2 pacientes para mirar hoy.',
  cards: [
    { patient_id: 'p-1', patient_name: 'Ana Ficticia', priority: 'alta', reason: 'Consulta hoy', action: { label: 'Abrir consultas', href: '/crm/ficha?paciente=p-1&seccion=consultas' } },
    { patient_id: 'p-2', patient_name: 'Bruno Ficticio', priority: 'media', reason: '2 comidas por revisar', action: { label: 'Revisar registros', href: '/crm/ficha?paciente=p-2&seccion=registros' } },
  ],
  sources: ['Bandeja del consultorio'], notice: 'El asistente usa sólo los datos de tu consultorio. Verificá siempre antes de actuar: nada se envía ni se agenda solo.',
  generated_at: '2026-10-10T12:00:00.000Z', source: 'memory',
};

describe('Asistente IA de la cartera (pantalla)', () => {
  it('estado inicial: saludo, cuatro preguntas sugeridas, campo y aviso de verificación', () => {
    const html = renderToStaticMarkup(<PortfolioAssistant professionalName="Lic. Prueba" onOpen={vi.fn()} />);
    expect(html).toContain('Asistente IA');
    expect(html).toContain('Hola, Lic. Prueba');
    for (const suggestion of ASSISTANT_SUGGESTIONS) expect(html).toContain(suggestion);
    expect(ASSISTANT_SUGGESTIONS).toHaveLength(4);
    expect(html).toContain('Preguntale al asistente sobre tus pacientes');
    expect(html).toContain('Verificá siempre antes de actuar');
  });

  it('muestra «Pensando…», la respuesta con tarjetas priorizadas y enlaces reales a la ficha', () => {
    const thinking = renderToStaticMarkup(<AssistantThread turns={[{ id: 't1', question: answer.question, status: 'loading' }]} onOpen={vi.fn()} onRetry={vi.fn()} />);
    expect(thinking).toContain('Pensando…');
    const html = renderToStaticMarkup(<AssistantThread turns={[{ id: 't1', question: answer.question, status: 'done', answer }]} onOpen={vi.fn()} onRetry={vi.fn()} />);
    expect(html).toContain('Pacientes a mirar');
    expect(html).toContain('Ana Ficticia');
    expect(html).toContain('Alta');
    expect(html).toContain('Media');
    expect(html).toContain('Consulta hoy');
    expect(html).toContain('href="/crm/ficha?paciente=p-1&amp;seccion=consultas"');
    expect(html).toContain('Fuentes: Bandeja del consultorio');
    expect(html).not.toMatch(/Enviar mensaje|Agendar ahora/);
  });

  it('respuesta sin pacientes y error con reintento', () => {
    const empty = renderToStaticMarkup(<AssistantThread turns={[{ id: 't1', question: 'x', status: 'done', answer: { ...answer, cards: [], summary: 'Plan V todavía no registra el ánimo.' } }]} onOpen={vi.fn()} onRetry={vi.fn()} />);
    expect(empty).toContain('Plan V todavía no registra el ánimo.');
    expect(empty).not.toContain('Pacientes a mirar');
    const failed = renderToStaticMarkup(<AssistantThread turns={[{ id: 't1', question: 'x', status: 'error', error: 'Sin conexión' }]} onOpen={vi.fn()} onRetry={vi.fn()} />);
    expect(failed).toContain('No pudimos responder');
    expect(failed).toContain('Reintentar');
  });

  it('el apartado pasa a estar disponible en /crm/asistente y sólo para profesionales', () => {
    expect(isAllowedPage('pro', 'asistente')).toBe(true);
    expect(isAllowedPage('patient', 'asistente')).toBe(false);
    expect(PROFESSIONAL_MODULES.find(m => m.id === 'asistente-ia')?.href).toBe('/crm/asistente');
  });
});
