import { describe, expect, it, vi } from 'vitest';
import { alcanceDelPedido, deshacerAplicacion } from './planes-scope';
import type { ProfessionalMealPlan } from '../../types/plans';
import { ApiError } from '../../api/error';

const actual: ProfessionalMealPlan = {
  id: '11111111-1111-4111-8111-111111111111', patient_id: 'pat-sofia',
  timezone: 'America/Argentina/Buenos_Aires', created_at: '', published: null,
  current: { id: 'version', version: 2, revision: '22222222-2222-4222-8222-222222222222', status: 'draft',
    period_start: '2026-10-26', period_end: '2026-11-01', published_at: null,
    guidance: { recommendations: ['Agua'], avoid: ['Maní'] }, meal_times: { Cena: '21:00' }, meal_labels: { Cena: 'Cena temprana' },
    items: [{ id: 'i', for_date: '2026-10-26', slot: 'Cena', free_text: 'Sopa', portions: null, public_note: 'Tibia', recipe: null, recipe_id: null, recipe_title: null, recipe_version: null }],
  },
};

describe('alcance real y deshacer del asistente', () => {
  it('día y comida usan la fecha visible, todo usa el período entero', () => {
    expect(alcanceDelPedido(0, '2026-10-28', 'Cena', '2026-10-26', '2026-11-01')).toMatchObject({ desde: '2026-10-28', hasta: '2026-10-28', slots: ['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena'] });
    expect(alcanceDelPedido(1, '2026-10-28', 'Cena', '2026-10-26', '2026-11-01')).toMatchObject({ desde: '2026-10-28', hasta: '2026-10-28', slots: ['Cena'] });
    expect(alcanceDelPedido(2, '2026-10-28', 'Cena', '2026-10-26', '2026-11-01')).toMatchObject({ desde: '2026-10-26', hasta: '2026-11-01' });
  });
  it('todo el plan no se recorta en silencio cuando supera 42 comidas', () => {
    expect(() => alcanceDelPedido(2, '2026-10-28', 'Cena', '2026-10-26', '2026-11-15')).toThrow('42 comidas');
  });
  it('restaura ítems y metadatos con la revisión posterior a aplicar', async () => {
    const save = vi.fn(async () => ({ plan: actual, source: 'memory' }));
    const resultado = await deshacerAplicacion(actual, { anterior: actual, revisionAplicada: actual.current.revision! }, save);
    expect(resultado.ok).toBe(true);
    expect(save).toHaveBeenCalledWith('pat-sofia', expect.objectContaining({ expected_revision: actual.current.revision, guidance: actual.current.guidance, meal_times: actual.current.meal_times, meal_labels: actual.current.meal_labels, items: [{ for_date: '2026-10-26', slot: 'Cena', free_text: 'Sopa', public_note: 'Tibia' }] }));
  });
  it('si hubo una edición posterior o publicación no pisa el trabajo', async () => {
    const save = vi.fn();
    expect((await deshacerAplicacion(actual, { anterior: actual, revisionAplicada: 'otra' }, save)).ok).toBe(false);
    expect((await deshacerAplicacion({ ...actual, current: { ...actual.current, status: 'published' } }, { anterior: actual, revisionAplicada: actual.current.revision! }, save)).ok).toBe(false);
    expect((await deshacerAplicacion({ ...actual, patient_id: 'otra-paciente' }, { anterior: actual, revisionAplicada: actual.current.revision! }, save)).ok).toBe(false);
    expect(save).not.toHaveBeenCalled();
  });
  it('un 409 mantiene el snapshot disponible y no declara éxito', async () => {
    const save = vi.fn(async () => { throw new ApiError(409, 'El borrador cambió.'); });
    const snapshot = { anterior: actual, revisionAplicada: actual.current.revision! };
    expect(await deshacerAplicacion(actual, snapshot, save)).toMatchObject({ ok: false, aviso: expect.stringContaining('cambió') });
    expect(snapshot.anterior).toEqual(actual);
  });
});
