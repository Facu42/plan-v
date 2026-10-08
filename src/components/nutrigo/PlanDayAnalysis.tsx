import { useState } from 'react';
import type { MenuNutritionTarget } from '../../types/ai-nutrition';
import { analyzePlanDay, analyzePlanWeek, type DayAnalysisLine } from '../../types/plan-day-analysis';

export function PlanDayAnalysis({ date, lines, target, week = [] }: { date: string; lines: DayAnalysisLine[]; target?: MenuNutritionTarget; week?: { date: string; lines: DayAnalysisLine[] }[] }) {
  const [view, setView] = useState<'day' | 'week'>('day');
  const weekly = analyzePlanWeek(week);
  const analysis = view === 'week' ? weekly : analyzePlanDay(lines);
  const entryLabel = (view === 'week' ? week.some(day => day.lines.some(line => line.component)) : lines.some(line => line.component)) ? 'componentes' : 'indicaciones';
  const goals = target ? { kcal: target.kcal, protein: target.protein_g, carbs: target.carbs_g, fat: target.fat_g } : {};
  return <aside className="plan-day-analysis" aria-label="Análisis nutricional del borrador">
    <div className="plan-analysis-switch"><button type="button" aria-pressed={view === 'day'} onClick={() => setView('day')}>Día</button><button type="button" aria-pressed={view === 'week'} onClick={() => setView('week')}>Promedio semanal</button></div><h3>{view === 'week' ? 'Promedio diario de la semana' : 'Análisis del día'}</h3><p>{view === 'week' ? `${week[0]?.date ?? 'Sin período válido'} – ${week[week.length - 1]?.date ?? ''} · ${week.length} días` : date} · {analysis.count} {entryLabel}</p>{view === 'week' && <p>{weekly.emptyDays} días sin indicaciones. Los promedios parciales usan sólo días con datos completos para cada nutriente.</p>}
    <p>Vista previa del borrador. Se actualiza al editar.</p>
    {analysis.estimated && <p className="plan-day-estimate">Incluye nutrientes estimados por IA.</p>}
    {!analysis.count && <p>Agregá indicaciones para calcular el análisis.</p>}
    <dl>{analysis.nutrients.map(nutrient => {
      const goal = goals[nutrient.key as keyof typeof goals];
      return <div key={nutrient.key}><dt>{nutrient.label}</dt><dd>{nutrient.total != null ? `${nutrient.total.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ${nutrient.unit}` : view === 'week' ? 'Sin promedio completo' : 'Sin total completo'}</dd>
        {nutrient.total == null && nutrient.subtotal != null && <small>{view === 'week' ? `Promedio parcial (${nutrient.known} de ${week.length} días): ` : 'Subtotal conocido: '}{nutrient.subtotal.toLocaleString('es-AR', { maximumFractionDigits: 2 })} {nutrient.unit}</small>}
        {nutrient.missing > 0 && <small>Faltan datos en {nutrient.missing} {view === 'week' ? 'días' : entryLabel}</small>}
        {goal != null && <small>Objetivo: {goal.toLocaleString('es-AR')} {nutrient.unit}{goal > 0 && nutrient.total != null ? ` · ${Math.round(nutrient.total / goal * 100)} %` : ''}</small>}
      </div>;
    })}</dl>
    {!target && <p>Sin objetivo nutricional guardado. No se calcula porcentaje de cumplimiento.</p>}
  </aside>;
}
