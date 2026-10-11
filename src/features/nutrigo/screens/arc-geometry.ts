/**
 * Medidas de los medidores de Inicio, tomadas del código del archivo de Figma
 * (get_design_context, nodos 57:1509 «Widget Weight Data» y 62:1513 «Widget Calories Intake»).
 * El archivo dibuja cada arco para un solo valor; acá solo se reutilizan sus SVG originales en su
 * mismo lugar, recortados o repetidos según el dato real. No se redibuja ninguna forma.
 */
const px = (total: number, fraction: number) => total * fraction;

/** Weight Data: Chart de 204 × 127; las piezas viven en un lienzo de 204 × 204. */
const WEIGHT_CANVAS = 204;
export const WEIGHT_PIECES = {
  // Donut Base (f641d.svg): left 47,16 % · right 0,17 % · top 0 · bottom 50 %.
  base: {
    x: px(WEIGHT_CANVAS, 0.4716),
    y: 0,
    width: px(WEIGHT_CANVAS, 1 - 0.4716 - 0.0017),
    height: WEIGHT_CANVAS / 2,
  },
  // Donut Progress (16730.svg): left 0,17 % · right 55,14 % · top 1,01 % · bottom 50 %.
  progress: {
    x: px(WEIGHT_CANVAS, 0.0017),
    y: px(WEIGHT_CANVAS, 0.0101),
    width: px(WEIGHT_CANVAS, 1 - 0.0017 - 0.5514),
    height: WEIGHT_CANVAS / 2 - px(WEIGHT_CANVAS, 0.0101),
  },
  canvas: WEIGHT_CANVAS,
} as const;

/** Calories Intake: Chart de 228 × 228. El arco naranja (1af77.svg) ocupa la mitad derecha del anillo. */
const CALORIE_CHART = 228;
const wrapperLeft = px(CALORIE_CHART, 0.0509);
const wrapperTop = px(CALORIE_CHART, 0.0463);
const wrapperWidth = CALORIE_CHART * (1 - 0.0509 - 0.0417);
const wrapperHeight = CALORIE_CHART * (1 - 0.0463 - 0.0463);
export const CALORIE_ARC = {
  left: wrapperLeft + wrapperWidth / 2,
  top: wrapperTop,
  width: wrapperWidth / 2,
  height: wrapperHeight * (1 - 0.0894),
  /** Centro del anillo respecto de la esquina superior izquierda de la imagen: gira alrededor de este punto. */
  originX: 0,
  originY: wrapperHeight / 2,
} as const;

/** El SVG original recorre unos 140° desde las 12 hs; para valores mayores se repite girado, con un pequeño solape. */
export const CALORIE_ARC_STEP_DEG = 140;

/** Giros (en grados) de las copias del arco original que hacen falta para llegar a `pct` % del anillo. */
export function calorieArcRotations(pct: number): number[] {
  if (!Number.isFinite(pct) || pct <= 0) return [];
  const degrees = Math.min(100, pct) * 3.6;
  const copies = Math.min(3, Math.ceil(degrees / CALORIE_ARC_STEP_DEG));
  return Array.from({ length: copies }, (_, index) => index * CALORIE_ARC_STEP_DEG);
}
