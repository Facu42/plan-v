import type { PlanGuidance } from '../../types/plan-guidance';
export function PlanGuidanceView({ guidance }: { guidance?: PlanGuidance }) {
  if (!guidance) return null;
  return (
    <section aria-label="Indicaciones del plan">
      {(['recommendations', 'avoid'] as const).map((kind) =>
        guidance[kind].length ? (
          <section key={kind}>
            <h3>
              {kind === 'recommendations'
                ? 'Recomendaciones'
                : 'Alimentos a evitar'}
            </h3>
            <ul>
              {guidance[kind].map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
          </section>
        ) : null,
      )}
    </section>
  );
}
