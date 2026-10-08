import { describe, expect, it } from 'vitest';
import { CALORIE_ARC, WEIGHT_PIECES, calorieArcRotations } from './arc-geometry';

// Medidas tomadas del código del archivo (get_design_context, nodos 57:1509 y 62:1513).
describe('medidas del medidor de peso (Chart de 204 × 127)', () => {
  it('la pieza amarilla y la naranja se ubican como en el archivo', () => {
    // Donut Base: left 47,16 % / right 0,17 % / top 0 / bottom 50 % de un lienzo de 204.
    expect(WEIGHT_PIECES.base.x).toBeCloseTo(96.2, 1);
    expect(WEIGHT_PIECES.base.width).toBeCloseTo(107.45, 1);
    expect(WEIGHT_PIECES.base.height).toBeCloseTo(101.98, 1);
    // Donut Progress: left 0,17 % / right 55,14 % / top 1,01 % / bottom 50 %.
    expect(WEIGHT_PIECES.progress.x).toBeCloseTo(0.35, 1);
    expect(WEIGHT_PIECES.progress.y).toBeCloseTo(2.06, 1);
    expect(WEIGHT_PIECES.progress.width).toBeCloseTo(91.16, 1);
    expect(WEIGHT_PIECES.progress.height).toBeCloseTo(99.95, 1);
  });
});

describe('arco de calorías hecho con el SVG original (Chart de 228)', () => {
  it('conserva la caja y el centro de giro del archivo', () => {
    // Donut Progress: wrapper inset 4,63 % / 4,17 % / 4,63 % / 5,09 %; imagen en la mitad derecha.
    expect(CALORIE_ARC.left).toBeCloseTo(114.8, 0);
    expect(CALORIE_ARC.top).toBeCloseTo(10.56, 1);
    expect(CALORIE_ARC.width).toBeCloseTo(103.44, 1);
    expect(CALORIE_ARC.originY).toBeCloseTo(103.44, 1);
  });

  it('repite el arco girado solo las veces que hacen falta', () => {
    expect(calorieArcRotations(0)).toEqual([]);
    expect(calorieArcRotations(20)).toEqual([0]);
    expect(calorieArcRotations(50)).toEqual([0, 140]);
    expect(calorieArcRotations(90)).toEqual([0, 140, 280]);
    expect(calorieArcRotations(100)).toEqual([0, 140, 280]);
  });

  it('un valor inválido o fuera de rango no rompe el dibujo', () => {
    expect(calorieArcRotations(Number.NaN)).toEqual([]);
    expect(calorieArcRotations(-5)).toEqual([]);
    expect(calorieArcRotations(250)).toEqual([0, 140, 280]);
  });
});
