import type { TargetResult } from '../../lib/nutrition-target';
import { compareNutritionTargets } from '../../lib/nutrition-target-comparison';

export function NutritionTargetComparison({ proposed, confirmed }: { proposed: TargetResult; confirmed: TargetResult | null }) {
  const rows = compareNutritionTargets(proposed, confirmed);
  return <section className="nvt-comparison" aria-label="Comparación con la meta confirmada">
    <h3>Antes de confirmar</h3>
    <p>{confirmed ? 'Compará la propuesta con la meta que ve la paciente.' : 'Todavía no hay una meta confirmada para comparar.'}</p>
    <table><caption>Valores diarios · propuesta y meta confirmada</caption><thead><tr><th scope="col">Medida</th><th scope="col">Vigente</th><th scope="col">Propuesta</th><th scope="col">Cambio</th></tr></thead><tbody>{rows.map(row => <tr key={row.key}><th scope="row">{row.label}<small>{row.unit}</small></th><td>{row.confirmed === null ? '—' : row.confirmed.toLocaleString('es-AR')}</td><td>{row.proposed.toLocaleString('es-AR')}</td><td>{row.change === null ? '—' : row.change === 0 ? 'Sin cambio' : `${row.change > 0 ? '+' : '−'}${Math.abs(row.change).toLocaleString('es-AR')}`}</td></tr>)}</tbody></table>
    <small className="nvt-note">Confirmar comparte la nueva meta y actualiza el borrador del plan. El plan publicado se conserva hasta publicar sus cambios.</small>
  </section>;
}
