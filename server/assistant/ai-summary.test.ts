import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import type { AssistantAnswer } from '../../src/types/assistant.js';
import { isFreeOpenRouterModel } from '../ai/cost-policy.js';
import { resolveAiProvider } from '../ai/provider.js';
import { createRateLimits } from '../security/http.js';
import { buildAssistantAiContext, withAiSummary } from './ai-summary.js';

const answer: AssistantAnswer = {
  intent: 'attention_today', question: '¿Cómo viene Ana Pérez Ficticia, tel 11 5555-0000?',
  summary: 'Hay 2 pacientes con algo para mirar hoy.',
  cards: [
    { patient_id: 'uuid-ana', patient_name: 'Ana Pérez Ficticia', priority: 'alta', reason: 'Consulta hoy · 1 mensaje sin leer', action: { label: 'Abrir consultas', href: '/crm/ficha?paciente=uuid-ana' } },
    { patient_id: 'uuid-bruno', patient_name: 'Bruno Gómez Ficticio', priority: 'media', reason: 'Sin registros en los últimos 7 días', action: { label: 'Abrir ficha', href: '/crm/ficha?paciente=uuid-bruno' } },
  ],
  sources: ['Bandeja del consultorio (pendientes actuales)'], notice: 'aviso', generated_at: '2026-10-10T12:00:00.000Z', source: 'supabase',
};

describe('Asistente: contexto mínimo para el modelo gratuito', () => {
  it('no envía nombres, teléfonos, ids, enlaces ni la pregunta libre; sólo referencias y motivos', () => {
    const context = buildAssistantAiContext(answer);
    const text = JSON.stringify(context);
    expect(text).not.toMatch(/Ana|Pérez|Bruno|Gómez|5555|uuid-|\/crm\/|¿Cómo viene/);
    expect(context).toEqual({
      intent: 'attention_today', total_cards: 2,
      cards: [
        { ref: 'P1', priority: 'alta', reason: 'Consulta hoy · 1 mensaje sin leer' },
        { ref: 'P2', priority: 'media', reason: 'Sin registros en los últimos 7 días' },
      ],
    });
  });

  it('el modelo sugerido por Facundo cumple la regla de sólo modelos :free', () => {
    expect(isFreeOpenRouterModel('google/gemma-4-31b-it:free')).toBe(true);
    expect(resolveAiProvider({ OPENROUTER_API_KEY: 'clave-de-prueba', OPENROUTER_MODEL: 'google/gemma-4-31b-it:free' })?.model).toBe('google/gemma-4-31b-it:free');
    expect(resolveAiProvider({ OPENROUTER_API_KEY: 'clave-de-prueba', OPENROUTER_MODEL: 'google/gemma-4-31b-it' })).toBeNull();
  });
});

describe('Asistente: resumen redactado con IA y respaldo por reglas', () => {
  it('en modo real usa la redacción del modelo y lo indica', async () => {
    const generate = vi.fn(async () => 'Hoy conviene empezar por P1, que tiene consulta y un mensaje sin leer; después P2.');
    const result = await withAiSummary(answer, { mode: 'live', generate });
    expect(generate).toHaveBeenCalledOnce();
    expect(JSON.stringify(generate.mock.calls[0])).not.toMatch(/Ana|Bruno|uuid-/);
    expect(result.summary_by).toBe('ia');
    // Las referencias se muestran con el nombre de pila, sólo en el navegador de la profesional.
    expect(result.summary).toBe('Hoy conviene empezar por Ana, que tiene consulta y un mensaje sin leer; después Bruno.');
    expect(result.cards).toEqual(answer.cards);
  });

  it('si el modelo falla, inventa riesgos o se extiende, conserva el resumen por reglas', async () => {
    for (const generate of [
      vi.fn(async () => { throw new Error('timeout'); }),
      vi.fn(async () => 'P2 tiene riesgo de abandono.'),
      vi.fn(async () => 'x'.repeat(601)),
      vi.fn(async () => 'P7 necesita atención.'),
    ]) {
      const result = await withAiSummary(answer, { mode: 'live', generate });
      expect(result.summary).toBe(answer.summary);
      expect(result.summary_by).toBe('reglas');
    }
  });

  it('en modo demo, deshabilitado o sin tarjetas no llama al modelo', async () => {
    const generate = vi.fn(async () => 'texto');
    expect((await withAiSummary(answer, { mode: 'demo', generate })).summary_by).toBe('reglas');
    expect((await withAiSummary(answer, { mode: 'disabled', generate })).summary_by).toBe('reglas');
    expect((await withAiSummary({ ...answer, intent: 'mood', cards: [] }, { mode: 'live', generate })).summary_by).toBe('reglas');
    expect(generate).not.toHaveBeenCalled();
  });

  it('la ruta del asistente comparte el límite de generaciones de IA por usuaria', async () => {
    const limits = createRateLimits({ enabled: () => true, aiLimit: 1 });
    const app = new Hono();
    app.use('/api/*', async (c, next) => { c.set('auth', { userId: 'nutri-ficticia' }); await next(); });
    app.use('/api/*', limits.protected);
    app.post('/api/crm/assistant', c => c.json({ ok: true }));
    expect((await app.request('/api/crm/assistant', { method: 'POST' })).status).toBe(200);
    expect((await app.request('/api/crm/assistant', { method: 'POST' })).status).toBe(429);
  });
});
