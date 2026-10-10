import { compareEquations, type EquationInput } from '../../lib/energy-equations';
import { NvBadge } from './primitives';

type Dated = { value: number; date: string } | null;
const day = (iso: string) => iso.split('-').reverse().join('/');

/** Compara la fórmula de la meta con otras de uso clínico, con el mismo factor de actividad. Solo informa. */
export function EnergyEquationComparison({ input, bodyFat, scaleBmr }: { input: EquationInput; bodyFat: Dated; scaleBmr: Dated }) {
  const rows = compareEquations(input, { bodyFatPct: bodyFat?.value ?? null, scaleBmr: scaleBmr?.value ?? null });
  const sources = [bodyFat && `Grasa corporal ${bodyFat.value.toLocaleString('es-AR')} % del ${day(bodyFat.date)}`, scaleBmr && `Basal de la balanza del ${day(scaleBmr.date)}`].filter(Boolean).join(' · ');
  return <details className="nvt-body-reference nvt-equations">
    <summary><div><p className="nv-eyebrow">Metabolismo basal</p><h3>Comparar fórmulas</h3></div><span className="nvt-reference-preview">Con el mismo nivel de actividad</span><NvBadge tone="gold">Ver fórmulas</NvBadge></summary>
    <table><caption>Metabolismo basal y gasto diario según cada fórmula</caption><thead><tr><th scope="col">Fórmula</th><th scope="col">Basal</th><th scope="col">Gasto diario</th></tr></thead><tbody>
      {rows.map((r) => <tr key={r.id}><th scope="row">{r.label}{r.used && <> <NvBadge tone="green">Usa la meta</NvBadge></>}</th>
        {r.bmr === null ? <td colSpan={2}>{r.missing}</td> : <><td>{r.bmr} kcal</td><td>{r.tdee} kcal</td></>}</tr>)}
    </tbody></table>
    <p className="nvt-note">La meta se calcula con Mifflin-St Jeor. Las demás sirven para comparar: si preferís otra, ajustá el porcentaje calórico.{sources && ` ${sources}.`}</p>
  </details>;
}
