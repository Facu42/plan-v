import { useState } from 'react';
import type { RecipeView } from '../../types/recipes';
import type { FigmaMenuEntry } from './FigmaHealthyMenu';

type Variant = 'desktop' | 'tablet' | 'mobile';
type RecipeData = { recipe: RecipeView | null; demo: boolean };
const asset = '/figma/screens/RecipeDetails/';
const icons = ['36850.svg', 'bb986.svg', 'a4b28.svg', '871ca.svg'];
const infoIcons = ['1f647.svg', '246bc.svg', '33cab.svg', 'a1d03.svg', '7a7e7.svg', '5a044.svg'];
const ids = {
  desktop: { left: '256:7534', image: '248:9520', info: '250:9614', reviews: '371:10026', main: '248:9522', title: '248:9523', about: '371:9991', tools: '371:10060', equipment: '256:7830', directions: '256:7741', right: '251:7273', servings: '256:7453', macro: '251:6471', nutrition: '251:6942' },
  tablet: { left: '453:12815', image: '453:12816', info: '453:12818', reviews: '453:12858', main: '536:20968', title: '453:12916', about: '453:12917', tools: '453:12921', equipment: '453:12922', directions: '453:12928', right: '457:13057', servings: '457:13058', macro: '457:13076', nutrition: '457:13081' },
  mobile: { left: '463:13917', image: '463:13918', info: '545:18905', reviews: '536:21087', main: '463:14016', title: '463:14017', about: '463:14018', tools: '463:14022', equipment: '463:14023', directions: '463:14035', right: '463:14016', servings: '536:20969', macro: '536:20987', nutrition: '536:21047' },
} as const;

function ReviewPanel({ variant, demo }: { variant: Variant; demo: boolean }) {
  return <section className="nv-recipe-reviews" data-node-id={ids[variant].reviews} data-name="Section Reviews">
    <header><div><h2>Reseñas</h2><small>{demo ? 'de 125 personas · ejemplo' : 'Todavía no hay reseñas'}</small></div><span className="nv-recipe-stars" aria-label={demo ? '4,8 de 5, dato de muestra' : 'Sin puntuación'}>{demo ? '★★★★★ 4,8/5' : '☆☆☆☆☆'}</span></header>
    <div className="nv-recipe-review-list">{demo ? <><article><p>“Fácil de preparar y con una combinación muy rica para el almuerzo.”</p><strong>Sofía Murad</strong><small>★★★★★</small></article><article><p>“La receta queda liviana y completa. Me gustó el toque de limón.”</p><strong>Lucas Paredes</strong><small>★★★★☆</small></article></> : <p>Las reseñas aparecerán cuando se publiquen.</p>}</div>
  </section>;
}

function InfoPanel({ variant, entry, data }: { variant: Variant; entry: FigmaMenuEntry; data: RecipeData }) {
  const values = data.demo ? ['12:30', '10 minutos', '15 minutos', 'Media', `${data.recipe?.steps.length ?? 0} pasos`, '9/10'] : ['—', '—', '—', '—', `${data.recipe?.steps.length ?? 0} pasos`, '—'];
  const labels = ['Hora', 'Preparación', 'Cocción', 'Dificultad', 'Pasos', 'Valoración'];
  return <div className="nv-recipe-info" data-node-id={ids[variant].info} data-name="Section Info"><div className="nv-recipe-info-list">{labels.map((label, index) => <div key={label} className="nv-recipe-info-item"><span><i><img src={`${asset}${infoIcons[index]}`} alt="" /></i><small>{label}</small></span><strong>{values[index]}</strong></div>)}</div>{entry.days.length > 0 && <small className="nv-recipe-plan-days">En tu plan: {entry.days.join(', ')}</small>}</div>;
}

function Left({ variant, entry, data }: { variant: Variant; entry: FigmaMenuEntry; data: RecipeData }) {
  return <aside className="nv-recipe-left" data-node-id={ids[variant].left} data-name="Left Side"><div className="nv-recipe-image" data-node-id={ids[variant].image} data-name="Image" role="img" aria-label="Imagen de la receta pendiente de publicación" /><InfoPanel variant={variant} entry={entry} data={data} />{variant === 'desktop' && <ReviewPanel variant={variant} demo={data.demo} />}</aside>;
}

function About({ variant, entry, recipe }: { variant: Variant; entry: FigmaMenuEntry; recipe: RecipeView | null }) {
  const category = entry.slots[0] ?? 'Comida';
  return <section className="nv-recipe-about" data-node-id={ids[variant].about} data-name="Section About"><span>{category}</span><p>{recipe?.explanation ?? 'Esta preparación forma parte de tu plan. Tu nutricionista todavía no publicó los ingredientes y los pasos.'}</p></section>;
}

function Macro({ variant, demo }: { variant: Variant; demo: boolean }) {
  const labels = ['Calorías', 'Carbos', 'Proteínas', 'Grasas'];
  const values = demo ? ['450', '40', '35', '12'] : ['—', '—', '—', '—'];
  const units = ['kcal', 'g', 'g', 'g'];
  return <div className="nv-recipe-macro" data-node-id={ids[variant].macro} data-name="Details">{labels.map((label, index) => <div key={label}><img src={`${asset}${icons[index]}`} alt="" /><small>{label}</small><strong>{values[index]}</strong><small>{demo ? units[index] : ''}</small></div>)}</div>;
}

function scaleIngredient(ingredient: string, servings: number, base: number) {
  if (servings === base) return ingredient;
  const match = ingredient.match(/^(\d+(?:[.,]\d+)?|\d+\/\d+)\s+(.+)$/);
  if (!match) return ingredient;
  const quantity = match[1].includes('/') ? Number(match[1].split('/')[0]) / Number(match[1].split('/')[1]) : Number(match[1].replace(',', '.'));
  if (!Number.isFinite(quantity)) return ingredient;
  const scaled = quantity * servings / base;
  return `${Number(scaled.toFixed(2)).toLocaleString('es-AR')} ${match[2]}`;
}

function Servings({ variant, recipe }: { variant: Variant; recipe: RecipeView | null }) {
  const [count, setCount] = useState(recipe?.servings ?? 2);
  const base = recipe?.servings ?? 2;
  return <section className="nv-recipe-servings" data-node-id={ids[variant].servings} data-name="Block Total Servings"><header><h2>Porciones</h2><div className="nv-recipe-servings-control"><button type="button" aria-label="Reducir porciones" disabled={count <= 1} onClick={() => setCount((value) => Math.max(1, value - 1))}><img src={`${asset}4425e.svg`} alt="" /></button><output aria-live="polite">{count}</output><button type="button" aria-label="Aumentar porciones" disabled={count >= 20} onClick={() => setCount((value) => Math.min(20, value + 1))}><img src={`${asset}2ac73.svg`} alt="" /></button></div></header><div className="nv-recipe-servings-divider" /><h3>Ingredientes</h3><ol>{(recipe?.ingredients ?? []).slice(0, 6).map((ingredient, index) => <li key={`${index}-${ingredient}`}><span>{index + 1}</span><p>{scaleIngredient(ingredient, count, base)}</p></li>)}{!recipe && <li><p>Ingredientes y cantidades pendientes de publicación.</p></li>}</ol></section>;
}

function Nutrition({ variant, demo }: { variant: Variant; demo: boolean }) {
  const rows: [string, string][] = demo ? [['Carbohidratos', '40 g'], ['Proteínas', '35 g'], ['Grasas totales', '12 g'], ['Fibra', '7 g'], ['Sodio', '420 mg'], ['Colesterol', '76 mg'], ['Azúcares', '4 g'], ['Vitamina C', '20 % VD']] : [['Carbohidratos', '—'], ['Proteínas', '—'], ['Grasas totales', '—'], ['Fibra', '—'], ['Sodio', '—'], ['Colesterol', '—'], ['Azúcares', '—'], ['Vitamina C', '—']];
  return <section className="nv-recipe-nutrition" data-node-id={ids[variant].nutrition} data-name="Widget Nutrition Facts"><header><h2>Información nutricional</h2><span aria-hidden="true">···</span></header><div className="nv-recipe-nutrition-list"><div className="nv-recipe-nutrition-cal"><strong>Calorías</strong><span><small>Por porción</small><strong>{demo ? '450 kcal' : '—'}</strong></span></div>{rows.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><p className="nv-recipe-sample-label">{demo ? 'Valores de muestra' : 'No hay valores nutricionales publicados'}</p></section>;
}

function Tools({ variant, recipe, demo }: { variant: Variant; recipe: RecipeView | null; demo: boolean }) {
  const equipment = demo ? ['Sartén grill', 'Olla mediana para vapor', 'Olla para el arroz', 'Pinzas de cocina', 'Tabla de cortar', 'Cuchillo'] : ['Utensilios no publicados'];
  const titles = demo ? ['Preparar el pavo', 'Cocinar el arroz', 'Cocinar el pavo', 'Cocinar los espárragos', 'Servir y decorar'] : (recipe?.steps ?? []).map((_, index) => `Paso ${index + 1}`);
  return <div className="nv-recipe-tools" data-node-id={ids[variant].tools} data-name="Tools & Direction"><section className="nv-recipe-equipment" data-node-id={ids[variant].equipment} data-name="Section Tools"><h2>Utensilios</h2><ol>{equipment.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol></section><section className="nv-recipe-directions" data-node-id={ids[variant].directions} data-name="Section Directions"><h2>Preparación</h2><ol>{(recipe?.steps ?? []).map((step, index) => <li key={`${index}-${step}`}><span>{index + 1}</span><div><strong>{titles[index]}</strong><p>{step}</p></div></li>)}{!recipe && <li><div>Los pasos todavía no se publicaron.</div></li>}</ol></section><section className="nv-recipe-notes"><h2>Notas</h2><ul><li>Podés ajustar el condimento a tu gusto.</li><li>{recipe ? `Fuente de la receta: ${recipe.nutrient_source}.` : 'Consultá con tu nutricionista si necesitás una alternativa.'}</li></ul></section></div>;
}

export function FigmaRecipeDetailLayout({ variant, entry, demo }: { variant: Variant; entry: FigmaMenuEntry; demo: boolean }) {
  const data = { recipe: entry.recipe, demo };
  const { recipe } = data;
  const right = <div className="nv-recipe-right" data-node-id={ids[variant].right} data-name="Right Side"><Servings key={entry.key} variant={variant} recipe={recipe} /><Macro variant={variant} demo={demo} /><Nutrition variant={variant} demo={demo} /></div>;
  const main = <main className="nv-recipe-main" data-node-id={ids[variant].main} data-name="Content"><h1 data-node-id={ids[variant].title}>{entry.title}</h1><About variant={variant} entry={entry} recipe={recipe} />{variant === 'mobile' && <Macro variant={variant} demo={demo} />}{variant === 'mobile' && <Servings key={entry.key} variant={variant} recipe={recipe} />}{variant === 'tablet' && right}<Tools variant={variant} recipe={recipe} demo={demo} />{variant === 'mobile' && <Nutrition variant={variant} demo={demo} />}{variant === 'mobile' && <ReviewPanel variant={variant} demo={demo} />}</main>;
  return <div className={`nv-recipe-detail nv-recipe-detail-${variant}`}>
    {variant === 'tablet' ? <><div className="nv-recipe-tablet-header" data-node-id="457:13013" data-name="Header"><Left variant={variant} entry={entry} data={data} /><ReviewPanel variant={variant} demo={demo} /></div>{main}</> : <><Left variant={variant} entry={entry} data={data} />{main}{variant === 'desktop' && right}</>}
  </div>;
}
