import type { MenuNutritionTarget } from '../../types/ai-nutrition';
import { analyzePlanDay, type DayAnalysisLine } from '../../types/plan-day-analysis';

export function PlanDayAnalysis({ date, lines, target }: { date: string; lines: DayAnalysisLine[]; target?: MenuNutritionTarget }) {
  const analysis = analyzePlanDay(lines);
  const goals = target ? { kcal: target.kcal, protein: target.protein_g, carbs: target.carbs_g, fat: target.fat_g } : {};
  return <aside className="plan-day-analysis" aria-label="Análisis del día seleccionado">
    <h3>Análisis del día</h3><p>{date} · {analysis.count} indicaciones</p>
    <p>Vista previa del borrador. Se actualiza al editar.</p>
    {analysis.estimated && <p className="plan-day-estimate">Incluye nutrientes estimados por IA.</p>}
    {!analysis.count && <p>Agregá una indicación para calcular este día.</p>}
    <dl>{analysis.nutrients.map(nutrient => {
      const goal = goals[nutrient.key as keyof typeof goals];
      return <div key={nutrient.key}><dt>{nutrient.label}</dt><dd>{nutrient.total != null ? `${nutrient.total.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ${nutrient.unit}` : 'Sin total completo'}</dd>
        {nutrient.total == null && nutrient.subtotal != null && <small>Subtotal conocido: {nutrient.subtotal.toLocaleString('es-AR', { maximumFractionDigits: 2 })} {nutrient.unit}</small>}
        {nutrient.missing > 0 && <small>Faltan datos en {nutrient.missing} indicaciones</small>}
        {goal != null && <small>Objetivo: {goal.toLocaleString('es-AR')} {nutrient.unit}{goal > 0 && nutrient.total != null ? ` · ${Math.round(nutrient.total / goal * 100)} %` : ''}</small>}
      </div>;
    })}</dl>
    {!target && <p>Sin objetivo nutricional guardado. No se calcula porcentaje de cumplimiento.</p>}
  </aside>;
}
