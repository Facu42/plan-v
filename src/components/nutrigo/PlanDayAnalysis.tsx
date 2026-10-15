import { useState } from 'react';
import type { MenuNutritionTarget } from '../../types/ai-nutrition';
import { analyzePlanDay, analyzePlanWeek, macroEnergyShare, momentEnergy, type DayAnalysisLine } from '../../types/plan-day-analysis';
import type { NutritionSettings } from '../../types/nutrition-capabilities';

const MAIN_NUTRIENTS = new Set(['kcal', 'protein', 'carbs', 'fat', 'fiber']);
type Moment = { slot: string; lines: DayAnalysisLine[] };
const kcalText = (value: number) => `${Math.round(value).toLocaleString('es-AR')} kcal`;

export function PlanDayAnalysis({ date, lines, target, week = [], moments = [],references=[] }: { date: string; lines: DayAnalysisLine[]; target?: MenuNutritionTarget; week?: { date: string; lines: DayAnalysisLine[] }[]; moments?: Moment[];references?:NutritionSettings['micronutrients'] }) {
  const [view, setView] = useState<'day' | 'week'>('day');
  const weekly = analyzePlanWeek(week);
  const analysis = view === 'week' ? weekly : analyzePlanDay(lines);
  const entryLabel = (view === 'week' ? week.some(day => day.lines.some(line => line.component)) : lines.some(line => line.component)) ? 'componentes' : 'indicaciones';
  const byMoment = view === 'day' ? momentEnergy(moments) : [];
  const share = macroEnergyShare(analysis.nutrients);
  const goals = target ? { kcal: target.kcal, protein: target.protein_g, carbs: target.carbs_g, fat: target.fat_g } : {};
  const card = (nutrient: typeof analysis.nutrients[number]) => {
    const goal = goals[nutrient.key as keyof typeof goals];
    const reference=references.find(row=>row.key===nutrient.key);
    return <div key={nutrient.key}><dt>{nutrient.label}</dt><dd>{nutrient.total != null ? `${nutrient.total.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ${nutrient.unit}` : view === 'week' ? 'Sin promedio completo' : 'Sin total completo'}</dd>
      {nutrient.total == null && nutrient.subtotal != null && <small>{view === 'week' ? `Promedio parcial (${nutrient.known} de ${week.length} días): ` : 'Subtotal conocido: '}{nutrient.subtotal.toLocaleString('es-AR', { maximumFractionDigits: 2 })} {nutrient.unit}</small>}
      {nutrient.missing > 0 && <small>Faltan datos en {nutrient.missing} {view === 'week' ? 'días' : entryLabel}</small>}
      {goal != null && <small>Objetivo: {goal.toLocaleString('es-AR')} {nutrient.unit}{goal > 0 && nutrient.total != null ? ` · ${Math.round(nutrient.total / goal * 100)} %` : ''}</small>}
      {reference&&<small>Referencia revisada: {reference.value.toLocaleString('es-AR')} {nutrient.unit}{nutrient.total!==null?` · ${Math.round(nutrient.total/reference.value*100)} % de esa referencia`:''}. {reference.citation} · <a href={reference.url} target="_blank" rel="noreferrer">Fuente</a></small>}
    </div>;
  };
  return <aside className="plan-day-analysis" aria-label="Análisis nutricional del borrador">
    <div className="plan-analysis-switch"><button type="button" aria-pressed={view === 'day'} onClick={() => setView('day')}>Día</button><button type="button" aria-pressed={view === 'week'} onClick={() => setView('week')}>Promedio semanal</button></div><h3>{view === 'week' ? 'Promedio diario de la semana' : 'Análisis del día'}</h3><p>{view === 'week' ? `${week[0]?.date ?? 'Sin período válido'} – ${week[week.length - 1]?.date ?? ''} · ${week.length} días` : date} · {analysis.count} {entryLabel}</p>{view === 'week' && <p>{weekly.emptyDays} días sin indicaciones. Los promedios parciales usan sólo días con datos completos para cada nutriente.</p>}
    <p>Vista previa del borrador. Se actualiza al editar.</p>
    {analysis.estimated && <p className="plan-day-estimate">Incluye nutrientes estimados por IA.</p>}
    {!analysis.count && <p>Agregá indicaciones para calcular el análisis.</p>}
    <dl>{analysis.nutrients.filter(nutrient => MAIN_NUTRIENTS.has(nutrient.key)).map(card)}</dl>
    {byMoment.length > 0 && <section className="plan-analysis-distribution" aria-label="Energía por momento"><h4>Energía por momento</h4><ul>{byMoment.map(row => <li key={row.slot}><span>{row.slot}</span><strong>{row.kcal != null ? kcalText(row.kcal) : 'Sin energía completa'}{row.share != null ? ` · ${row.share} %` : ''}</strong>{row.share != null && <i style={{ width: `${row.share}%` }} aria-hidden="true" />}</li>)}</ul></section>}
    {share && <section className="plan-analysis-distribution" aria-label="Reparto de la energía"><h4>Reparto de la energía</h4><ul>{([['Proteínas', share.protein], ['Carbohidratos', share.carbs], ['Grasas', share.fat]] as const).map(([label, value]) => <li key={label}><span>{label}</span><strong>{value} %</strong><i style={{ width: `${value}%` }} aria-hidden="true" /></li>)}</ul><small>Calculado con 4 kcal por gramo de proteínas y carbohidratos y 9 de grasas.</small></section>}
    <h4 className="plan-analysis-subtitle">Micronutrientes</h4>
    <dl>{analysis.nutrients.filter(nutrient => !MAIN_NUTRIENTS.has(nutrient.key)).map(card)}</dl>
    {!target && <p>Sin objetivo nutricional guardado. No se calcula porcentaje de cumplimiento.</p>}
  </aside>;
}
