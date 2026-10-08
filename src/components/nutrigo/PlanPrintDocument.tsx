import { renderToStaticMarkup } from 'react-dom/server';
import type { PlanComponentView } from '../../types/plan-components';
import { componentGrams, componentTitle } from '../../types/plan-components';
import type { PlanItemView, PlanRecipeDetail, PlanVersionView } from '../../types/plans';
import { eachIsoDate, PLAN_SLOTS, planWeekdayLabel } from '../../types/plans';
import { recipeNutritionLabel, type ProposedRecipe } from '../../types/ai-nutrition';
import logo from '../../assets/plan-v-logo-256.png';

export type PlanPrintCopy = { version: PlanVersionView; patientName: string; professionalName: string; demo: boolean };
const amount = (value: number) => Number.isFinite(value) ? value.toLocaleString('es-AR', value !== 0 && Math.abs(value) < 0.0001 ? { maximumSignificantDigits: 4 } : { maximumFractionDigits: 4 }) : 'Cantidad sin confirmar';
const declaredAmount = (value: number) => Number.isFinite(value) ? value.toLocaleString('es-AR', { maximumSignificantDigits: 15 }) : 'Cantidad sin confirmar';
const dateLabel = (date: string) => date.split('-').reverse().join('/');
function RecipeInstructions({ recipe, portions }: { recipe: PlanRecipeDetail | ProposedRecipe; portions: number }) {
  const valid = Number.isFinite(portions) && portions > 0 && recipe.yield_portions > 0;
  return <><p>{Number.isFinite(portions) && portions > 0 ? `${declaredAmount(portions)} ${portions === 1 ? 'porción' : 'porciones'}` : 'Porciones sin confirmar'} · {recipeNutritionLabel(recipe.nutrition, 'nutrient_source' in recipe ? recipe.nutrient_source : '', 'card' in recipe ? recipe.card?.macros : undefined)}{'catalog_recipe' in recipe && recipe.catalog_recipe?.estimate_origin ? ' · Procedencia de IA conservada' : ''}</p>
    <ul>{recipe.ingredients.map((ingredient, index) => <li key={index}>{ingredient.name}: {valid ? `${amount(ingredient.quantity * portions / recipe.yield_portions)} ${ingredient.unit}` : 'Cantidad sin confirmar'}</li>)}</ul>
    <ol>{recipe.steps.map((step, index) => <li key={index}>{step}</li>)}</ol></>;
}
function Component({ component }: { component: PlanComponentView }) {
  const grams = componentGrams(component);
  return <section className="pv-component"><h4>{componentTitle(component)}</h4>
    {component.kind === 'food' && <><p>{declaredAmount(component.quantity)} {component.measure ?? 'g'}{component.measure && grams != null ? ` (${amount(grams)} g)` : ''}</p><small>Fuente: {component.food_snapshot?.source || 'Sin fuente declarada'} · revisión {component.food_revision}</small></>}
    {component.kind === 'recipe' && <><small>Receta publicada · versión {component.recipe_version}</small>{component.recipe_snapshot ? <RecipeInstructions recipe={component.recipe_snapshot} portions={component.portions} /> : <p>El detalle de esta receta no está disponible.</p>}</>}
    {component.kind === 'text' && component.recipe_proposal && <RecipeInstructions recipe={component.recipe_proposal} portions={component.portions ?? NaN} />}
    {component.public_note && <p className="pv-note">{component.public_note}</p>}
  </section>;
}
function Meal({ item }: { item: PlanItemView }) {
  return <article className="pv-meal"><h3>{item.slot}</h3>{item.components ? item.components.map(component => <Component key={component.id} component={component} />) : <section className="pv-component"><h4>{item.recipe?.title ?? item.recipe_proposal?.title ?? item.free_text ?? item.recipe_title}</h4>{item.recipe ? <><small>Receta publicada · versión {item.recipe_version}</small><RecipeInstructions recipe={item.recipe} portions={item.portions ?? NaN} /></> : item.recipe_proposal ? <RecipeInstructions recipe={item.recipe_proposal} portions={item.portions ?? NaN} /> : item.portions != null ? <p>{declaredAmount(item.portions)} {item.portions === 1 ? 'porción' : 'porciones'}</p> : null}</section>}{item.public_note && <p className="pv-note">Nota de la comida: {item.public_note}</p>}</article>;
}
export function PlanPrintDocument({ version, patientName, professionalName, demo }: PlanPrintCopy) {
  const published = Boolean(version.published_at);
  return <main className="pv-paper"><header className="pv-head"><div><img src={logo} alt="Plan V" /><span>Plan V · Nutrición</span></div><p className={published ? 'pv-state' : 'pv-state pv-draft'}>{published ? 'PLAN PUBLICADO' : 'BORRADOR GUARDADO · NO PUBLICADO'} · v{version.version}</p></header>
    <h1>Plan de alimentación</h1><p className="pv-patient">{patientName || 'Paciente seleccionado'}</p>{professionalName.trim() && <p>Profesional: {professionalName.trim()}</p>}
    <p>Del {dateLabel(version.period_start)} al {dateLabel(version.period_end)} · Argentina</p>
    {!published && <p className="pv-draft">Copia para revisión profesional. Este borrador todavía no fue publicado para la paciente.</p>}
    {demo && <p className="pv-draft">DEMOSTRACIÓN · Datos ficticios para pruebas.</p>}
    {eachIsoDate(version.period_start, version.period_end).map(date => { const items = version.items.filter(item => item.for_date === date).sort((a,b) => PLAN_SLOTS.indexOf(a.slot) - PLAN_SLOTS.indexOf(b.slot)); return <section key={date} className="pv-day"><h2>{planWeekdayLabel(date)} · {dateLabel(date)}</h2>{items.length ? items.map(item => <Meal key={item.id} item={item} />) : <p>Sin indicaciones para este día.</p>}</section>; })}
    <footer>Versión {version.version} · {published ? `Publicada el ${new Date(version.published_at!).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}` : 'Borrador guardado, sin publicación'}. Las cantidades y fuentes corresponden a esta copia.</footer>
  </main>;
}
export const PLAN_PRINT_CSS = `@page{size:A4;margin:16mm}*{box-sizing:border-box}body{overflow-wrap:anywhere;margin:0;color:#253129;background:#fff;font:14px/1.5 Arial,sans-serif}.pv-paper{max-width:780px;margin:0 auto;padding:32px}.pv-head{display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:2px solid #91ad45;padding-bottom:14px}.pv-head>div{display:flex;align-items:center;gap:10px;font-weight:bold}.pv-head img{width:36px;height:36px;object-fit:contain}.pv-state{font-size:11px;letter-spacing:.04em}.pv-draft{color:#705219;border:1px solid #c6aa72;padding:10px;background:#fff9ea}.pv-patient{font-size:20px;font-weight:bold}h1{font-size:26px;margin-bottom:6px}h2{font-size:19px;margin-top:26px;border-bottom:1px solid #cdd5c9;padding-bottom:8px}h3{font-size:16px}h4{font-size:14px;margin:12px 0 4px}p{margin:6px 0}small{font-size:11px;color:#586457}.pv-meal{margin-bottom:16px;padding-left:12px;border-left:3px solid #b3ce70}.pv-component{margin-bottom:12px}.pv-meal,.pv-component{break-inside:avoid}.pv-note{white-space:pre-wrap;font-style:italic}li{margin-bottom:4px}footer{border-top:1px solid #cdd5c9;margin-top:28px;padding-top:12px;font-size:11px;color:#586457}h2,h3,h4{break-after:avoid}li,.pv-note{break-inside:avoid}p,li{orphans:3;widows:3}@media print{.pv-paper{max-width:none;padding:0}.pv-draft{background:#fff}body{print-color-adjust:exact}}`;
export function planPrintHtml(copy: PlanPrintCopy) {
  const body = renderToStaticMarkup(<PlanPrintDocument {...copy} />);
  // React escapes every patient/professional/content string. No patient data in scripts or URLs.
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Plan de alimentación · v${copy.version.version}</title><style>${PLAN_PRINT_CSS}</style></head><body>${body}</body></html>`;
}
