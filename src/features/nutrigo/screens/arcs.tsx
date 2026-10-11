import type { CSSProperties } from 'react';
// SVG originales del archivo de Figma (nodos «Donut Base», «Donut Progress» y las líneas del «Mask group»).
import weightBase from '../assets/f641d.svg?no-inline';
import weightProgress from '../assets/16730.svg?no-inline';
import weightHatchLines from '../assets/weight-hatch.svg?no-inline';
import calorieProgress from '../assets/1af77.svg?no-inline';
import { CALORIE_ARC, WEIGHT_PIECES, calorieArcRotations } from './arc-geometry';

const ORANGE = '#ffa257';
const SAFFRON = '#ffcb65';
const clampPct = (pct: number | null) => (pct == null || !Number.isFinite(pct) ? 0 : Math.max(0, Math.min(100, pct)));
const fill: CSSProperties = { position: 'absolute', inset: 0 };

/**
 * «Weight Data»: la silueta del medio anillo son las dos piezas SVG originales (con sus extremos
 * redondeados) en su mismo lugar. El color se reparte según el avance: naranja hasta `pct` y, desde ahí,
 * amarillo con las líneas blancas del archivo.
 */
export function WeightArc({ pct }: { pct: number | null }) {
  const { base, progress, canvas } = WEIGHT_PIECES;
  const filled = (clampPct(pct) / 100) * 0.5;
  const silhouette = `url(${weightBase}), url(${weightProgress})`;
  const position = `${base.x}px ${base.y}px, ${progress.x}px ${progress.y}px`;
  const size = `${base.width}px ${base.height}px, ${progress.width}px ${progress.height}px`;
  const rest = `conic-gradient(from 270deg, transparent 0turn ${filled}turn, #000 ${filled}turn 0.5turn, transparent 0.5turn 1turn)`;
  return (
    <span aria-hidden="true" data-arc="weight" className="pointer-events-none absolute left-0 top-0 block" style={{
      width: canvas, height: canvas, WebkitMaskImage: silhouette, maskImage: silhouette, WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
      WebkitMaskPosition: position, maskPosition: position, WebkitMaskSize: size, maskSize: size,
    }}>
      <span style={{ ...fill, background: `conic-gradient(from 270deg, ${ORANGE} 0turn ${filled}turn, transparent ${filled}turn 1turn)` }} />
      <span style={{ ...fill, background: `url(${weightHatchLines}) center / 100% 100% no-repeat, ${SAFFRON}`, WebkitMask: rest, mask: rest }} />
    </span>
  );
}

/**
 * «Calories Intake»: el arco naranja es el SVG original; para llegar al porcentaje real se repite
 * girado alrededor del centro del anillo y se recorta en el ángulo exacto.
 */
export function CalorieArc({ pct }: { pct: number | null }) {
  const value = clampPct(pct);
  const rotations = calorieArcRotations(value);
  if (!rotations.length) return null;
  const centerX = CALORIE_ARC.left + CALORIE_ARC.originX;
  const centerY = CALORIE_ARC.top + CALORIE_ARC.originY;
  const clip = `conic-gradient(from 0deg at ${centerX}px ${centerY}px, #000 0turn ${value / 100}turn, transparent ${value / 100}turn 1turn)`;
  return (
    <span aria-hidden="true" data-arc="calories" className="pointer-events-none" style={{ ...fill, WebkitMask: clip, mask: clip }}>
      {rotations.map(degrees => (
        <img key={degrees} alt="" src={calorieProgress} style={{
          position: 'absolute', left: CALORIE_ARC.left, top: CALORIE_ARC.top, width: CALORIE_ARC.width, height: CALORIE_ARC.height, maxWidth: 'none',
          transformOrigin: `${CALORIE_ARC.originX}px ${CALORIE_ARC.originY}px`, transform: `rotate(${degrees}deg)`,
        }} />
      ))}
    </span>
  );
}
