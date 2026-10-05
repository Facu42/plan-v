import type { MenuNutritionSummary } from '../../types/ai-nutrition';

const STATUS = {
  adjusted: 'Porciones ajustadas a la meta calórica', missing_nutrients: 'Faltan nutrientes: sin ajuste confirmado',
  no_target: 'Sin meta confirmada: sin ajuste', portion_limit: 'El ajuste supera el límite de porciones', outside_target: 'Revisar diferencia con la meta',
};
const number = (value: number) => value.toLocaleString('es-AR', { maximumFractionDigits: 1 });

export function AiPlanNutritionSummary({ nutrition }: { nutrition?: MenuNutritionSummary }) {
  if (!nutrition) return null;
  return <section aria-label="Totales y procedencia de los nutrientes">
    <h4>Totales del menú</h4>
    {nutrition.target && <p>Meta confirmada usada: {number(nutrition.target.kcal)} kcal por día.</p>}
    {nutrition.days.map((day) => <article key={day.for_date}>
      <strong>{day.for_date}</strong>
      <p>{STATUS[day.status]}{day.estimated ? ' · Nutrientes estimados por IA' : ''}</p>
      {day.totals && <p>{number(day.totals.kcal)} kcal · Proteínas {number(day.totals.protein_g)} g · Hidratos {number(day.totals.carbs_g)} g · Grasas {number(day.totals.fat_g)} g</p>}
      {day.difference && <small>Diferencias respecto de la meta: {number(day.difference.kcal)} kcal · Proteínas {number(day.difference.protein_g)} g · Hidratos {number(day.difference.carbs_g)} g · Grasas {number(day.difference.fat_g)} g</small>}
    </article>)}
  </section>;
}
