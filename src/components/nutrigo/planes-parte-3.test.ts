import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../api/error';
import { plansApi } from '../../api/plans';
import type { AiJobEnqueueInput, AiJobView } from '../../types/ai-jobs';
import { emptyGuidance } from '../../types/plan-guidance';
import type { PlanItemView, PlanVersionView, ProfessionalMealPlan } from '../../types/plans';
import { textoListaCompras } from './PanelPlanEditor';
import {
  AVISO_PROGRAMAR, bloqueoAlPublicar, borradorDistinto, guardarPropuestaComoBorrador,
  pedirPropuesta, periodoAsistente, publicarPlanRevisado,
} from './planes-parte-3';

const PLAN_ID = '11111111-1111-4111-8111-111111111111';

function item(texto = 'Pollo al horno'): PlanItemView {
  return {
    id: 'item-1', for_date: '2026-10-26', slot: 'Almuerzo', recipe_id: null, recipe_version: null,
    recipe_title: null, recipe: null, free_text: texto, portions: null, public_note: '',
  };
}

function version(status: PlanVersionView['status'], texto = 'Pollo al horno'): PlanVersionView {
  return {
    id: 'ver', version: 2, revision: '22222222-2222-4222-8222-222222222222', status,
    period_start: '2026-10-26', period_end: '2026-11-01', published_at: status === 'draft' ? null : '2026-10-26T12:00:00.000Z',
    items: [item(texto)],
  };
}

function plan(status: PlanVersionView['status'], extra: Partial<ProfessionalMealPlan> = {}): ProfessionalMealPlan {
  const current = version(status);
  return {
    id: PLAN_ID, patient_id: 'pat-sofia', timezone: 'America/Argentina/Buenos_Aires',
    created_at: '2026-10-01T12:00:00.000Z', current,
    published: status === 'draft' ? null : { ...current, status: 'published', version: 1 },
    ...extra,
  };
}

describe('publicar el plan revisado', () => {
  it('publica el borrador una sola vez y avisa que la paciente ya puede verlo', async () => {
    const actual = plan('draft');
    const publicado = plan('published');
    const publish = vi.fn(async () => ({ plan: publicado, source: 'memory' }));
    const resultado = await publicarPlanRevisado({
      plan: actual, vacias: 0, cantidad: 1, revisado: true, hoy: '2026-10-26', publish,
    });
    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith(PLAN_ID, 2, actual.current);
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.aviso).toBe('Plan publicado. La paciente ya puede ver la versión revisada.');
  });

  it('si el período empieza más adelante, avisa que sigue el plan anterior', async () => {
    const actual = plan('draft');
    const publicado = plan('scheduled', { scheduled: version('scheduled') });
    publicado.current = version('scheduled');
    const publish = vi.fn(async () => ({ plan: publicado, source: 'memory' }));
    const resultado = await publicarPlanRevisado({
      plan: actual, vacias: 0, cantidad: 1, revisado: true, hoy: '2026-10-20', publish,
    });
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.aviso).toContain('sigue con el plan anterior');
  });

  it('un conflicto de versión no dice que se publicó', async () => {
    const publish = vi.fn(async () => {
      throw new ApiError(409, 'El borrador cambió. Revisá la versión actual antes de publicar.');
    });
    const resultado = await publicarPlanRevisado({
      plan: plan('draft'), vacias: 0, cantidad: 1, revisado: true, hoy: '2026-10-26', publish,
    });
    expect(publish).toHaveBeenCalledTimes(1);
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.aviso).toBe('El borrador cambió. Revisá la versión actual antes de publicar.');
  });

  it('una alergia declarada frena la publicación', async () => {
    const publish = vi.fn(async () => {
      throw new ApiError(409, 'El plan incluye un alimento declarado como alergia o restricción. Revisalo antes de publicar.');
    });
    const resultado = await publicarPlanRevisado({
      plan: plan('draft'), vacias: 0, cantidad: 1, revisado: true, hoy: '2026-10-26', publish,
    });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.aviso).toContain('alergia');
  });

  it('sin la marca de revisado no llama a publicar', async () => {
    const publish = vi.fn();
    const resultado = await publicarPlanRevisado({
      plan: plan('draft'), vacias: 0, cantidad: 1, revisado: false, hoy: '2026-10-26', publish,
    });
    expect(publish).not.toHaveBeenCalled();
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.aviso).toBe('Marcá que revisaste el plan completo antes de publicar.');
  });

  it('un plan ya publicado, sin borrador nuevo, no se vuelve a publicar', async () => {
    const publish = vi.fn();
    const resultado = await publicarPlanRevisado({
      plan: plan('published'), vacias: 0, cantidad: 1, revisado: true, hoy: '2026-10-26', publish,
    });
    expect(publish).not.toHaveBeenCalled();
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) expect(resultado.aviso).toContain('No hay cambios nuevos');
  });
});

describe('asistente', () => {
  it('pide la propuesta de la semana visible y no publica', async () => {
    const publicar = vi.spyOn(plansApi, 'publish');
    const job = {
      id: 'job-1', patient_id: 'pat-sofia', job_type: 'menu_draft', status: 'succeeded',
      model: 'demo', prompt_version: 'menu_draft.v2', context_hash: 'x', attempt: 1,
      cost_tokens: null, error_code: null, warnings: [], created_at: '2026-10-26T12:00:00.000Z',
      started_at: null, finished_at: null, applied_at: null,
      request: { title_hint: null, period_start: '2026-10-26', period_end: '2026-11-01', slots: [] },
      artifact: {
        id: 'art-1', kind: 'menu_draft', created_at: '2026-10-26T12:00:00.000Z',
        payload: {
          id: PLAN_ID, period_start: '2026-10-26', period_end: '2026-10-26',
          timezone: 'America/Argentina/Buenos_Aires',
          items: [{ for_date: '2026-10-26', slot: 'Almuerzo', free_text: 'Pollo', public_note: '' }],
        },
      },
    } as AiJobView;
    const enqueue = vi.fn(async (input: AiJobEnqueueInput) => {
      expect(input.patient_id).toBe('pat-sofia');
      return { job, source: 'memory' };
    });
    const resultado = await pedirPropuesta({
      patientId: 'pat-sofia', desde: '2026-10-26', hasta: '2026-11-01', enqueue, esperar: async () => {},
    });
    expect(enqueue).toHaveBeenCalledTimes(1);
    const pedido = enqueue.mock.calls[0]?.[0];
    expect(pedido?.job_type).toBe('menu_draft');
    expect(pedido?.slots).toHaveLength(5);
    expect(pedido?.dietary_preferences).toBeUndefined();
    expect(publicar).not.toHaveBeenCalled();
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.aviso).toContain('Todavía no se publicó');
    publicar.mockRestore();
  });

  it('usar la propuesta como borrador no publica', async () => {
    const publicar = vi.spyOn(plansApi, 'publish');
    const apply = vi.fn(async () => ({ job: { id: 'job-1' } as AiJobView, source: 'memory' }));
    const leer = vi.fn(async () => ({ plan: plan('draft'), source: 'memory' }));
    const resultado = await guardarPropuestaComoBorrador({ jobId: 'job-1', patientId: 'pat-sofia', apply, leer });
    expect(apply).toHaveBeenCalledWith('job-1');
    expect(publicar).not.toHaveBeenCalled();
    expect(resultado.ok).toBe(true);
    if (resultado.ok) expect(resultado.aviso).toContain('borrador privado');
    publicar.mockRestore();
  });

  it('no aplica si el snapshot anterior no coincide con la base de la propuesta', async () => {
    const apply = vi.fn();
    const actual = plan('draft');
    const propuesta = { id: actual.id, expected_revision: '33333333-3333-4333-8333-333333333333', period_start: actual.current.period_start, period_end: actual.current.period_end, timezone: actual.timezone, items: [{ for_date: '2026-10-26', slot: 'Almuerzo', free_text: 'Pollo', public_note: '' }] } as import('../../types/plans').MealPlanDraftInput;
    const resultado = await guardarPropuestaComoBorrador({ jobId: 'job', patientId: actual.patient_id, anterior: actual, esperada: propuesta, apply });
    expect(resultado.ok).toBe(false);
    expect(apply).not.toHaveBeenCalled();
  });

  it('no habilita deshacer si otra sesión editó entre aplicar y releer', async () => {
    const actual = plan('draft');
    const propuesta = { id: actual.id, expected_revision: actual.current.revision, period_start: actual.current.period_start, period_end: actual.current.period_end, timezone: actual.timezone, items: [{ for_date: '2026-10-26', slot: 'Almuerzo', free_text: 'Pollo nuevo', public_note: '' }] } as import('../../types/plans').MealPlanDraftInput;
    const apply = vi.fn(async () => ({ job: { id: 'job' } as AiJobView, source: 'memory' }));
    const editado = plan('draft'); editado.current.items = [item('Edición de otra sesión')];
    const leer = vi.fn(async () => ({ plan: editado, source: 'memory' }));
    expect(await guardarPropuestaComoBorrador({ jobId: 'job', patientId: actual.patient_id, anterior: actual, esperada: propuesta, apply, leer })).toMatchObject({ ok: true, revisionSegura: false });
  });

  it('sin permiso no cambia el plan', async () => {
    const enqueue = vi.fn(async () => {
      throw new ApiError(403, 'Activá el permiso «Borradores de menú con IA» antes de continuar.');
    });
    const resultado = await pedirPropuesta({
      patientId: 'pat-sofia', desde: '2026-10-26', hasta: '2026-11-01', enqueue,
    });
    expect(resultado.ok).toBe(false);
    if (!resultado.ok) {
      expect(resultado.aviso).toContain('Borradores de menú con IA');
      expect(resultado.aviso).not.toContain('Plan publicado');
    }
  });

  it('manda el pedido recortado y no publica', async () => {
    const enqueue = vi.fn(async (_input: AiJobEnqueueInput) => {
      throw new Error('corte');
    });
    const publicar = vi.spyOn(plansApi, 'publish');
    const resultado = await pedirPropuesta({
      patientId: 'pat-sofia', desde: '2026-10-26', hasta: '2026-11-01',
      preferencias: ['Cenas livianas', ` ${'x'.repeat(100)}`],
      enqueue,
    });
    const pedido = enqueue.mock.calls[0]?.[0];
    expect(pedido?.dietary_preferences).toEqual(['Cenas livianas', 'x'.repeat(80)]);
    expect(publicar).not.toHaveBeenCalled();
    expect(resultado.ok).toBe(false);
    publicar.mockRestore();
  });

  it('un plan de cuatro semanas se pide de a una semana, dentro del tope', () => {
    const periodo = periodoAsistente('2026-10-26', '2026-11-22', 0);
    expect(periodo.desde).toBe('2026-10-26');
    expect(periodo.hasta).toBe('2026-11-01');
    expect(periodo.slots).toHaveLength(5);
    const dias = (Date.parse(periodo.hasta) - Date.parse(periodo.desde)) / 86_400_000;
    expect(dias).toBeLessThanOrEqual(7);
    expect((dias + 1) * periodo.slots.length).toBeLessThanOrEqual(42);
  });
});

describe('controles de la entrega', () => {
  it('bloquea comidas vacías, plan ausente y republicación', () => {
    expect(bloqueoAlPublicar({ hayPlan: false, esBorrador: false, cantidad: 0, vacias: 0, revisado: true })).toContain('guardá un borrador');
    expect(bloqueoAlPublicar({ hayPlan: true, esBorrador: true, cantidad: 1, vacias: 3, revisado: true })).toContain('sin alimentos');
    expect(bloqueoAlPublicar({ hayPlan: true, esBorrador: false, cantidad: 1, vacias: 0, revisado: true })).toContain('No hay cambios nuevos');
  });

  it('nota un borrador distinto del que está guardado', () => {
    expect(borradorDistinto(version('draft'), [item('Sopa')], {}, emptyGuidance())).toBe(true);
    expect(borradorDistinto(version('draft'), [item()], {}, emptyGuidance())).toBe(false);
  });

  it('la lista de compras se puede bajar como texto y programar sigue en próximamente', () => {
    const texto = textoListaCompras([{ nombre: 'Verduras', items: [{ nombre: 'Zapallo', cantidad: '150 g' }] }], 2, 'Sofía R.');
    expect(texto).toContain('Lista de compras · Sofía R. · semana 2');
    expect(texto).toContain('VERDURAS');
    expect(texto).toContain('Zapallo');
    expect(texto).toContain('150 g');
    expect(AVISO_PROGRAMAR).toContain('Próximamente');
  });
});
