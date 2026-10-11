import type { CSSProperties } from 'react';
import { STEP_LABELS, STEP_ORDER, stepProgress, type Step } from './meal-log-helpers';

/** Barra que se llena y puntos por paso: «Paso 2 de 4 · Análisis». */
export function StepIndicator({ step }: { step: Step }) {
  const { index, total, percent, label } = stepProgress(step);
  return (
    <div className="mlm-stepper" style={{ '--mlm-progress': `${percent}%` } as CSSProperties}>
      <div className="mlm-stepper-track" aria-hidden><i /></div>
      <ol className="mlm-stepper-dots" aria-label="Progreso del registro">
        {STEP_ORDER.map((name, i) => (
          <li key={name} data-state={i < index ? 'done' : i === index ? 'current' : 'todo'} aria-current={i === index ? 'step' : undefined}>
            <span className="mlm-stepper-dot" aria-hidden />
            <span className="mlm-stepper-label">{STEP_LABELS[name]}</span>
            {i < index && <span className="mlm-sr"> completado</span>}
          </li>
        ))}
      </ol>
      <p className="mlm-stepper-now">{`Paso ${index + 1} de ${total} · ${label}`}</p>
    </div>
  );
}
