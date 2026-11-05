import { describe, expect, it } from 'vitest';
import { mealPlanDraftSchema } from '../../types/plans';
import {
  AVISO_SIN_COMIDAS, MAX_TEXTO_COMIDA, borradorImportado, inicioDelPlan, leerPlanAnterior, planDesdeDocumento, resumenImportado,
} from './planes-importar';

const texto = (t: string) => ({ pages: [{ page: 1, text: t }], tables: [] });

describe('importar el plan anterior', () => {
  it('lee días y momentos de un plan escrito y descarta el encabezado con el nombre', () => {
    const plan = planDesdeDocumento(texto(`Plan alimentario de María Pérez
Lic. Verónica Trenti
LUNES
Desayuno (8 hs): infusión con leche descremada
- 2 tostadas integrales con queso untable
Almuerzo: pollo grillé con ensalada
Merienda - yogur con frutillas
Cena: tarta de verduras
Antes de dormir: 1 fruta
Martes:
Desayuno: avena cocida con banana
Media mañana: un puñado de almendras
Cena: merluza al horno con puré`));
    expect(plan.plantilla).toBe(false);
    expect(plan.dias.map(d => d.etiqueta)).toEqual(['lunes', 'martes']);
    expect(plan.dias[0].comidas.Desayuno).toBe('infusión con leche descremada · 2 tostadas integrales con queso untable');
    expect(plan.dias[0].comidas.Merienda).toBe('yogur con frutillas');
    expect(plan.dias[0].comidas.Cena).toBe('tarta de verduras · Antes de dormir: 1 fruta');
    expect(plan.dias[1].comidas['Colación']).toBe('un puñado de almendras');
    expect(plan.comidas).toBe(7);
    expect(JSON.stringify(plan)).not.toContain('María');
  });

  it('repite un plan tipo sin días durante una semana', () => {
    const plan = planDesdeDocumento(texto('Desayuno: mate con tostadas\nAlmuerzo: guiso de lentejas\nCena: sopa'));
    expect(plan.plantilla).toBe(true);
    expect(plan.dias).toHaveLength(7);
    expect(plan.comidas).toBe(21);
    expect(resumenImportado(plan)).toBe('Plan tipo repetido 7 días · 21 comidas');
  });

  it('no confunde el nombre de un plato con un momento del día', () => {
    const plan = planDesdeDocumento(texto('Almuerzo:\nDesayuno de campo con huevos\nCena: ensalada'));
    expect(plan.dias[0].comidas.Almuerzo).toBe('Desayuno de campo con huevos');
    expect(plan.dias[0].comidas.Desayuno).toBeUndefined();
  });

  it('lee una planilla con los días como columnas', () => {
    const plan = planDesdeDocumento({ pages: [], tables: [{ sheet: 'Semana', rows: [
      ['', 'Lunes', 'Martes', 'Miércoles'],
      ['Desayuno', 'Té con tostadas', 'Yogur con granola', ''],
      ['Almuerzo', 'Milanesa al horno', 'Fideos con verduras', 'Ensalada completa'],
      ['Notas', 'tomar agua', '', ''],
    ] }] });
    expect(plan.dias.map(d => d.etiqueta)).toEqual(['lunes', 'martes', 'miercoles']);
    expect(plan.dias[2].comidas).toEqual({ Almuerzo: 'Ensalada completa' });
    expect(plan.comidas).toBe(5);
  });

  it('lee una planilla con los momentos como columnas', () => {
    const plan = planDesdeDocumento({ pages: [], tables: [{ sheet: 'Plan', rows: [
      ['Día', 'Desayuno', 'Almuerzo', 'Cena'],
      ['Día 1', 'Café con leche', 'Arroz con pollo', 'Omelette'],
      ['Día 2', 'Licuado', '', 'Pescado'],
    ] }] });
    expect(plan.dias.map(d => d.etiqueta)).toEqual(['Día 1', 'Día 2']);
    expect(plan.dias[1].comidas).toEqual({ Desayuno: 'Licuado', Cena: 'Pescado' });
  });

  it('recorta textos largos y avisa cuántos', () => {
    const plan = planDesdeDocumento(texto(`Desayuno: ${'avena con frutas '.repeat(20)}`));
    expect(plan.dias[0].comidas.Desayuno!.length).toBeLessThanOrEqual(MAX_TEXTO_COMIDA);
    expect(plan.dias[0].comidas.Desayuno!.endsWith('…')).toBe(true);
    expect(plan.recortadas).toBe(7);
  });

  it('no pasa de 42 comidas ni 21 días', () => {
    const dias = Array.from({ length: 12 }, (_, i) => `Día ${i + 1}\nDesayuno: a\nAlmuerzo: b\nMerienda: c\nCena: d`).join('\n');
    const plan = planDesdeDocumento(texto(dias));
    expect(plan.comidas).toBe(40);
    expect(plan.descartadas).toBe(8);
    expect(resumenImportado(plan)).toContain('8 no entraron');
  });

  it('arranca el borrador en el próximo día que coincide y respeta el formato del servidor', () => {
    const plan = planDesdeDocumento(texto('Miércoles\nDesayuno: mate\nJueves\nCena: sopa\nLunes\nAlmuerzo: arroz'));
    // 2026-11-05 es jueves: el próximo miércoles es el 11/11.
    expect(inicioDelPlan(plan, '2026-11-05')).toBe('2026-11-11');
    const borrador = borradorImportado(plan, '2026-11-05', null);
    expect(mealPlanDraftSchema.safeParse(borrador).success).toBe(true);
    expect(borrador.items.map(i => [i.for_date, i.slot, i.free_text])).toEqual([
      ['2026-11-11', 'Desayuno', 'mate'],
      ['2026-11-12', 'Cena', 'sopa'],
      ['2026-11-16', 'Almuerzo', 'arroz'],
    ]);
    expect(borrador.period_end).toBe('2026-11-16');
  });

  it('reemplaza el borrador de la paciente con su revisión vigente', () => {
    const plan = planDesdeDocumento(texto('Cena: sopa'));
    const destino = { id: '7c9e6679-7425-40de-944b-e07fc1f90ae7', current: { revision: '0e4c8a3b-1f2d-4c5b-9a6e-7d8f9a0b1c2d' } } as never;
    const borrador = borradorImportado(plan, '2026-11-05', destino);
    expect(borrador.id).toBe('7c9e6679-7425-40de-944b-e07fc1f90ae7');
    expect(borrador.expected_revision).toBe('0e4c8a3b-1f2d-4c5b-9a6e-7d8f9a0b1c2d');
    expect(borrador.items).toHaveLength(7);
  });

  it('avisa cuando el archivo no tiene comidas', async () => {
    const plan = planDesdeDocumento(texto('Recomendaciones generales: tomar agua y caminar.'));
    expect(plan.comidas).toBe(0);
    expect(() => borradorImportado(plan, '2026-11-05', null)).toThrow(AVISO_SIN_COMIDAS);
    const leido = await leerPlanAnterior(new File(['Desayuno: té\nCena: sopa'], 'plan.txt', { type: 'text/plain' }));
    expect(leido.plan.comidas).toBe(14);
    await expect(leerPlanAnterior(new File(['   '], 'vacio.txt', { type: 'text/plain' }))).rejects.toThrow('No encontré texto');
  });
});
