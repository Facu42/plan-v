import { useState } from 'react';
import type { RecipeWizardInput } from '../../types/recipe-plate';
import { RECIPE_UNITS, type RecipeUnit } from '../../types/recipes';
import { NUTRIENTS, normalizeFoodSearch, type Food } from '../../types/foods';
import { calculateRecipeCatalog, type RecipeCatalogSnapshot } from '../../types/recipe-catalog-nutrition';

type Props = { draft: RecipeWizardInput; foods: readonly Food[]; prior?: RecipeCatalogSnapshot };

export function RecipeCatalogIngredients({ draft, foods, prior, onChange, loading, error, retry }: Props & {
  onChange: (draft: RecipeWizardInput) => void; loading?: boolean; error?: string; retry?: () => void;
}) {
  const [search, setSearch] = useState('');
  const composed = draft.items.some(item => item.catalog_ref) || Boolean(prior);
  const matches = foods.filter(food => normalizeFoodSearch(`${food.name} ${food.brand} ${food.category}`).includes(normalizeFoodSearch(search)));
  const update = (index: number, patch: Partial<RecipeWizardInput['items'][number]>) => onChange({ ...draft, items: draft.items.map((item, i) => i === index ? { ...item, ...patch } : item) });
  return <fieldset className="recipe-catalog-ingredients"><legend>Ingredientes y medidas</legend>
    <label>Buscar en Alimentos<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Nombre, marca o categoría" /></label>
    {loading && <p role="status">Cargando alimentos…</p>}
    {error && <div role="alert">{error} <button type="button" onClick={retry}>Reintentar</button></div>}
    {!loading && !error && !foods.length && <p>Tu catálogo está vacío. Podés cargar alimentos en Alimentos o escribir ingredientes sin composición.</p>}
    {draft.items.map((item, index) => {
      const frozen = prior?.lines.find(line => line.food?.id === item.catalog_ref?.id && line.food?.revision === item.catalog_ref?.revision)?.food;
      const food = frozen ?? foods.find(food => food.id === item.catalog_ref?.id && food.revision === item.catalog_ref?.revision);
      const current = foods.find(food => food.id === item.catalog_ref?.id);
      const options = food && !matches.some(candidate => candidate.id === food.id) ? [food, ...matches] : matches;
      return <div className="recipe-catalog-line" key={index}>
        <div className="recipe-form-row">
          <label>Alimento {index + 1}<select value={item.catalog_ref?.id ?? ''} onChange={event => {
            const selected = foods.find(food => food.id === event.target.value);
            if (!selected) { update(index, { catalog_ref: undefined, unit: 'g', line_kcal: undefined }); return; }
            let name = selected.name.slice(0, 75);
            const used = draft.items.filter((_, i) => i !== index).map(item => normalizeFoodSearch(item.name));
            if (used.includes(normalizeFoodSearch(name))) { let suffix = 2; while (used.includes(normalizeFoodSearch(`${name} ${suffix}`))) suffix++; name = `${name} ${suffix}`; }
            update(index, { name, unit: 'g', line_kcal: undefined, catalog_ref: { id: selected.id, revision: selected.revision, measure: null } });
          }}><option value="">Ingrediente escrito · sin composición</option>{options.map(food => <option key={food.id} value={food.id}>{food.name}{food.brand ? ` · ${food.brand}` : ''}</option>)}</select></label>
          <label>Nombre en la receta<input aria-label={`Ingrediente ${index + 1}`} value={item.name} maxLength={80} onChange={event => update(index, { name: event.target.value })} /></label>
        </div>
        <div className="recipe-line-amount">
          <label>Cantidad<input aria-label={`Cantidad ${index + 1}`} type="number" min="0.01" max="100000" step="0.01" value={item.quantity} onChange={event => update(index, { quantity: Number(event.target.value) })} /></label>
          <label>Medida<select aria-label={`Unidad ${index + 1}`} value={item.catalog_ref ? item.catalog_ref.measure ?? '' : item.unit} onChange={event => update(index, item.catalog_ref ? { catalog_ref: { ...item.catalog_ref, measure: event.target.value || null } } : { unit: event.target.value as RecipeUnit })}>
            {item.catalog_ref ? <><option value="">Gramos</option>{food?.portions.map(portion => <option key={portion.name} value={portion.name}>{portion.name} · {portion.grams} g</option>)}</> : RECIPE_UNITS.map(unit => <option key={unit}>{unit}</option>)}
          </select></label>
          {!composed && !draft.nutrition && <label>Kcal de línea<input aria-label={`Kcal de línea ${index + 1}`} type="number" min="0" max="20000" value={item.line_kcal ?? ''} onChange={event => update(index, { line_kcal: event.target.value === '' ? undefined : Number(event.target.value) })} /></label>}
          <button type="button" className="recipe-cancel" disabled={draft.items.length === 1} aria-label={`Quitar ingrediente ${index + 1}`} onClick={() => onChange({ ...draft, items: draft.items.filter((_, i) => i !== index) })}>Quitar</button>
        </div>
        {food && <p className="recipe-food-source">Fuente: {food.source}{food.reference ? ` · ${food.reference}` : ''} · versión {food.revision}</p>}
        {current && food && current.revision !== food.revision && <p>Este alimento tiene valores nuevos. La receta conserva los anteriores. <button type="button" onClick={() => update(index, { catalog_ref: { id: current.id, revision: current.revision, measure: null }, unit: 'g', quantity: (item.quantity * (food.portions.find(p => p.name === item.catalog_ref?.measure)?.grams ?? 1)) })}>Usar valores actuales en gramos</button></p>}
        {!item.catalog_ref && <p className="recipe-food-source">Sin composición vinculada. Sus nutrientes no se pueden sumar automáticamente.</p>}
      </div>;
    })}
    <button type="button" className="recipe-add" disabled={draft.items.length >= 20} onClick={() => onChange({ ...draft, items: [...draft.items, { name: '', quantity: 1, unit: 'g' }] })}>Agregar ingrediente</button>
  </fieldset>;
}

export function RecipeComposition({ draft, foods, prior }: Props) {
  const [basis, setBasis] = useState<'per_portion' | 'totals' | 'per_100g'>('per_portion');
  let analysis: RecipeCatalogSnapshot;
  try { analysis = calculateRecipeCatalog({ ...draft, items: draft.items.filter(item => item.name.trim()) }, foods, prior); }
  catch (error) { return <p role="alert">{error instanceof Error ? error.message : 'Revisá los ingredientes.'}</p>; }
  const values = analysis[basis];
  return <section className="recipe-composition" aria-label="Análisis nutricional del catálogo">
    <div className="recipe-form-row"><h3>Composición calculada</h3><label>Ver valores<select value={basis} onChange={event => setBasis(event.target.value as typeof basis)}><option value="per_portion">Por porción</option><option value="totals">Receta completa</option><option value="per_100g">Por 100 g preparados</option></select></label></div>
    {values ? <dl>{NUTRIENTS.map(([key, label, unit]) => <div key={key}><dt>{label}</dt><dd>{values[key] == null ? 'Sin dato' : `${values[key]!.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ${unit}`}</dd></div>)}</dl> : <p>Informá el peso final preparado para calcular por 100 g. El peso de los ingredientes no reemplaza el peso final.</p>}
    <p>Rinde: {draft.yield_portions} porciones. Peso de ingredientes: {analysis.ingredient_weight_g == null ? 'sin dato' : `${analysis.ingredient_weight_g.toLocaleString('es-AR')} g`}. Los datos faltantes no se cuentan como cero.</p>
  </section>;
}
