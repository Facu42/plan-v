import { describe, expect, it } from 'vitest';
import type { CrmWorkItem } from '../../src/types/crm-work.js';
import type { WeeklyRegistration } from '../../src/types/weekly-registration.js';
import { answerPortfolioQuestion, classifyQuestion, type PortfolioPatient } from './portfolio.js';

const now = new Date('2026-10-10T12:00:00-03:00');
const weekly = (recorded_days: number): WeeklyRegistration => ({
  start: '2026-10-04', end: '2026-10-10', recorded_days, meals_logged: recorded_days, meals_pending: 0,
  water_days: 0, water_average: null, pending_review: 0,
});
const item = (kind: CrmWorkItem['kind'], patient_id: string, title: string, extra: Partial<CrmWorkItem> = {}): CrmWorkItem => ({
  id: `${kind}:${patient_id}:${title}`, kind, patient_id, patient_name: `Nombre ${patient_id}`, status: 'pending_review',
  updated_at: '2026-10-10T10:00:00.000Z', href: `/crm/ficha?paciente=${patient_id}`, title, ...extra,
});

const patients: PortfolioPatient[] = [
  { id: 'p-ana', name: 'Ana Ficticia', weekly: weekly(6), brief: null },
  { id: 'p-bruno', name: 'Bruno Ficticio', weekly: weekly(0), brief: null },
  { id: 'p-carla', name: 'Carla Ficticia', weekly: weekly(2), brief: { suggested_action: 'ajuste_menu', up_next_title: 'Ajustar el menú' } },
  { id: 'p-dario', name: 'Darío Ficticio', weekly: null, brief: null },
];

describe('asistente de cartera: clasificación de preguntas', () => {
  it('reconoce las cuatro preguntas sugeridas y variantes sin tildes', () => {
    expect(classifyQuestion('¿Qué pacientes necesitan atención hoy?')).toBe('attention_today');
    expect(classifyQuestion('Resumime la adherencia de mi cartera')).toBe('adherence');
    expect(classifyQuestion('¿A quién debería contactar esta semana?')).toBe('contact_week');
    expect(classifyQuestion('¿Quién tiene el ánimo más bajo?')).toBe('mood');
    expect(classifyQuestion('quien tiene el animo mas bajo')).toBe('mood');
    expect(classifyQuestion('a quien le escribo')).toBe('contact_week');
    expect(classifyQuestion('¿Cuál es la capital de Francia?')).toBe('unsupported');
  });
});

describe('asistente de cartera: respuestas con datos del consultorio', () => {
  it('atención hoy: prioriza consultas, ingresos y mensajes sobre registros y propuestas, con enlace real', () => {
    const answer = answerPortfolioQuestion({
      question: '¿Qué pacientes necesitan atención hoy?', patients, now,
      workItems: [
        item('meal', 'p-ana', 'Revisar comida · Almuerzo'),
        item('meal', 'p-ana', 'Revisar comida · Cena'),
        item('appointment', 'p-bruno', 'Consulta de hoy', { href: '/crm/ficha?paciente=p-bruno&seccion=consultas', status: 'scheduled' }),
        item('message', 'p-bruno', 'Mensaje sin leer', { href: '/crm/mensajes?paciente=p-bruno', status: 'unread' }),
        item('meal', 'p-ajeno', 'Revisar comida · Almuerzo'),
      ],
    });
    expect(answer.intent).toBe('attention_today');
    expect(answer.cards.map(card => card.patient_id)).toEqual(['p-bruno', 'p-ana', 'p-carla']);
    const [bruno, ana, carla] = answer.cards;
    expect(bruno.priority).toBe('alta');
    expect(bruno.reason).toBe('Consulta hoy · 1 mensaje sin leer');
    expect(bruno.action).toEqual({ label: 'Abrir consultas', href: '/crm/ficha?paciente=p-bruno&seccion=consultas' });
    expect(ana).toMatchObject({ priority: 'media', reason: '2 comidas por revisar', patient_name: 'Ana Ficticia' });
    expect(carla).toMatchObject({ priority: 'media', reason: 'Sugerencia del copiloto: Ajustar el menú' });
    expect(carla.action.href).toBe('/crm/ficha?paciente=p-carla');
    // Un pendiente de otro consultorio nunca se convierte en tarjeta.
    expect(JSON.stringify(answer)).not.toContain('p-ajeno');
    expect(answer.notice).toMatch(/Verificá siempre antes de actuar/);
  });

  it('adherencia: resume días con registros sin tratar la falta de datos como riesgo ni diagnóstico', () => {
    const answer = answerPortfolioQuestion({ question: 'Resumime la adherencia de mi cartera', patients, workItems: [], now });
    expect(answer.intent).toBe('adherence');
    expect(answer.summary).toContain('1 paciente registró 5 días o más');
    expect(answer.summary).toContain('1 registró entre 1 y 4 días');
    expect(answer.summary).toContain('1 no registró');
    expect(answer.summary).toContain('1 sin dato disponible');
    expect(answer.cards.map(card => [card.patient_id, card.reason])).toEqual([
      ['p-bruno', 'Sin registros en los últimos 7 días'],
      ['p-carla', 'Registró 2 de los últimos 7 días'],
    ]);
    const text = JSON.stringify(answer).toLocaleLowerCase('es-AR');
    expect(text).not.toMatch(/riesgo|abandono|incumpl|diagn/);
  });

  it('contactar esta semana: propone abrir la conversación sin enviar nada', () => {
    const answer = answerPortfolioQuestion({
      question: '¿A quién debería contactar esta semana?', patients, now,
      workItems: [item('appointment', 'p-ana', 'Consulta para reprogramar', { status: 'needs_change', href: '/crm/ficha?paciente=p-ana&seccion=consultas' })],
    });
    expect(answer.intent).toBe('contact_week');
    expect(answer.cards.map(card => card.patient_id)).toEqual(['p-ana', 'p-bruno']);
    expect(answer.cards[0]).toMatchObject({ priority: 'alta', reason: 'Pidió reprogramar la consulta' });
    expect(answer.cards[1]).toMatchObject({ priority: 'media', reason: 'Sin registros en los últimos 7 días',
      action: { label: 'Abrir conversación', href: '/crm/mensajes?paciente=p-bruno' } });
    expect(answer.notice).toMatch(/nada se envía ni se agenda solo/i);
  });

  it('ánimo: dice con honestidad que Plan V no registra ánimo y no inventa pacientes', () => {
    const answer = answerPortfolioQuestion({ question: '¿Quién tiene el ánimo más bajo?', patients, workItems: [], now });
    expect(answer.intent).toBe('mood');
    expect(answer.cards).toEqual([]);
    expect(answer.summary).toMatch(/todavía no registra el ánimo/);
  });

  it('pregunta fuera de alcance y consultorio vacío responden sin tarjetas', () => {
    expect(answerPortfolioQuestion({ question: 'Contame un chiste', patients, workItems: [], now })).toMatchObject({ intent: 'unsupported', cards: [] });
    const empty = answerPortfolioQuestion({ question: '¿Qué pacientes necesitan atención hoy?', patients: [], workItems: [], now });
    expect(empty.cards).toEqual([]);
    expect(empty.summary).toMatch(/no tenés pacientes activos/);
  });
});
