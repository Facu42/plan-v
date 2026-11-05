import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { UsoIAVista } from './AjustesUsoIA';
import { borradorDeOpcion, Consumo, cuerpoDeBorrador, Modelos, mesLegible, usd } from './admin-crm/AdminIA';
import type { AdminAiUsage, AiModelBoard } from '../../types/ai-usage';

vi.mock('../../api/client', () => ({
  api: { saveAdminAiModel: vi.fn(), clearAdminAiModel: vi.fn() },
  ApiError: class ApiError extends Error { constructor(public status: number, message: string) { super(message); } },
}));

const usage: AdminAiUsage = {
  month: '2026-11',
  totals: { calls: 12, credits: 30, cost_usd_micros: 1_500_000, unassigned_cost_usd_micros: 200_000 },
  features: [{ feature: 'recipe_draft', label: 'Recetas', calls: 12, cost_usd_micros: 1_500_000 }],
  consultorios: [{ organization: 'Consultorio Sur', nutris: 2, credits: 3400, allowance: 3400, percent: 100, cost_usd_micros: 1_500_000 }],
  nutris: [{ nutritionist_id: 'n1', name: 'Ana Gómez', plan_code: 'pro', organization: 'Consultorio Sur', credits: 30, allowance: 1500, percent: 2, calls: 12, cost_usd_micros: 1_500_000, by_feature: [{ feature: 'recipe_draft', label: 'Recetas', calls: 12, cost_usd_micros: 1_500_000 }] }],
};
const board: AiModelBoard = {
  features: [
    { feature: 'recipe_draft', label: 'Recetas', current: null },
    { feature: 'menu_draft', label: 'Planes semanales', current: { feature: 'menu_draft', model: 'openai/gpt-5.6-luna', input_usd_per_mtok: 0.2, output_usd_per_mtok: 1.2, updated_by: 'a@b.c', updated_at: '' } },
  ],
  options: [
    { model: 'openrouter/free', label: 'Gratis (OpenRouter)', input_usd_per_mtok: 0, output_usd_per_mtok: 0, note: 'Con topes diarios.' },
    { model: 'openai/gpt-5.6-luna', label: 'GPT-5.6 Luna', input_usd_per_mtok: 0.2, output_usd_per_mtok: 1.2, note: 'Barato.' },
  ],
};

describe('barra de uso de IA en Ajustes', () => {
  const html = (uso: Parameters<typeof UsoIAVista>[0]['uso'], error = '') => renderToStaticMarkup(<UsoIAVista uso={uso} error={error} onReintentar={() => undefined} />);

  it('muestra solo el porcentaje y la renovación, sin créditos, modelos ni costos', () => {
    const out = html({ month: '2026-11', percent: 42, level: 'ok', renews_on: '2026-12-01' });
    expect(out).toContain('42%');
    expect(out).toContain('aria-valuenow="42"');
    expect(out).toContain('width:42%');
    expect(out).toContain('Se renueva el 1 de diciembre.');
    expect(out).not.toMatch(/crédito|modelo|USD|\$/i);
  });

  it('avisa cuando se acerca y cuando se pasa, y la barra nunca supera el 100%', () => {
    const cerca = html({ month: '2026-11', percent: 85, level: 'near', renews_on: '2026-12-01' });
    expect(cerca).toContain('Estás cerca del uso previsto para este mes.');
    const pasado = html({ month: '2026-11', percent: 130, level: 'over', renews_on: '2026-12-01' });
    expect(pasado).toContain('Pasaste el uso previsto para tu plan este mes.');
    expect(pasado).toContain('aria-valuenow="100"');
    expect(pasado).toContain('width:100%');
    expect(pasado).toContain('class="o"');
  });

  it('mientras carga y si falla muestra un texto corto, con reintento', () => {
    expect(html(null)).toContain('Cargando…');
    const fallo = html(null, 'No pudimos cargar.');
    expect(fallo).toContain('No pudimos cargar.');
    expect(fallo).toContain('Reintentar');
  });
});

describe('Uso de IA en el panel del administrador', () => {
  it('lista el consumo por función, consultorio y nutri con costos en dólares', () => {
    const out = renderToStaticMarkup(<Consumo usage={usage} />);
    for (const texto of ['noviembre de 2026', 'Ana Gómez', 'Consultorio Sur', 'Pro', usd(1_500_000), 'sin nutri', 'Por consultorio', 'Por nutri']) expect(out).toContain(texto);
  });

  it('sin usos muestra un texto en vez de una tabla vacía', () => {
    const out = renderToStaticMarkup(<Consumo usage={{ ...usage, features: [], consultorios: [], nutris: [], totals: { ...usage.totals, calls: 0 } }} />);
    expect(out.match(/Todavía no hay usos este mes/g)).toHaveLength(2);
  });

  it('cada función tiene su selector de modelo y sus dos precios', () => {
    const out = renderToStaticMarkup(<Modelos board={board} onChange={() => undefined} />);
    for (const label of ['Recetas', 'Planes semanales']) {
      expect(out).toContain(`aria-label="Modelo de ${label}"`);
      expect(out).toContain(`aria-label="Precio de entrada de ${label}"`);
      expect(out).toContain(`aria-label="Precio de salida de ${label}"`);
    }
    expect(out).toContain('Hoy: modelo gratuito de siempre');
    expect(out).toContain('Hoy: openai/gpt-5.6-luna');
    expect(out).toContain('Volver al gratuito');
    expect(out).toContain('Otro (escribir el id)');
  });

  it('al elegir un modelo de la lista completa los precios; «otro» deja escribir el id', () => {
    expect(borradorDeOpcion(board.options, 'openai/gpt-5.6-luna')).toEqual({ model: 'openai/gpt-5.6-luna', input: '0.2', output: '1.2' });
    expect(borradorDeOpcion(board.options, '')).toEqual({ model: '' });
  });

  it('el pedido de guardado lleva números y el id sin espacios', () => {
    expect(cuerpoDeBorrador({ model: ' openai/gpt-5.6-luna ', input: '0.2', output: '1.2' })).toEqual({ model: 'openai/gpt-5.6-luna', input_usd_per_mtok: 0.2, output_usd_per_mtok: 1.2 });
  });

  it('formatea mes y dólares', () => {
    expect(mesLegible('2026-11')).toBe('noviembre de 2026');
    expect(usd(2_500_000)).toMatch(/2,50/);
  });
});
