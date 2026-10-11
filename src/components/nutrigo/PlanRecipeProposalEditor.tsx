import type { ProposedRecipe } from '../../types/ai-nutrition';
import { recipeNutritionLabel } from '../../types/ai-nutrition';
import { RECIPE_UNITS } from '../../types/recipes';

export function PlanRecipeProposalEditor({ proposal, index, onChange }: { proposal: ProposedRecipe; index: number; onChange: (proposal: ProposedRecipe) => void }) {
  return <fieldset><legend>Receta propuesta {index + 1} · {recipeNutritionLabel(proposal.nutrition)}</legend>
    <label>Rinde<input type="number" min={0.1} max={50} step="0.1" value={proposal.yield_portions} onChange={(event) => onChange({ ...proposal, yield_portions: Number(event.target.value) })} /></label>
    {proposal.ingredients.map((ingredient, ingredientIndex) => <div key={ingredientIndex}>
      <input aria-label={`Ingrediente ${index + 1}.${ingredientIndex + 1}`} value={ingredient.name} onChange={(event) => onChange({ ...proposal, ingredients: proposal.ingredients.map((entry, position) => position === ingredientIndex ? { ...entry, name: event.target.value } : entry) })} />
      <input aria-label={`Cantidad ${index + 1}.${ingredientIndex + 1}`} type="number" min={0.1} max={100000} step="0.1" value={ingredient.quantity} onChange={(event) => onChange({ ...proposal, ingredients: proposal.ingredients.map((entry, position) => position === ingredientIndex ? { ...entry, quantity: Number(event.target.value) } : entry) })} />
      <select aria-label={`Unidad ${index + 1}.${ingredientIndex + 1}`} value={ingredient.unit} onChange={(event) => onChange({ ...proposal, ingredients: proposal.ingredients.map((entry, position) => position === ingredientIndex ? { ...entry, unit: event.target.value as typeof entry.unit } : entry) })}>{RECIPE_UNITS.map((unit) => <option key={unit}>{unit}</option>)}</select>
      <button type="button" disabled={proposal.ingredients.length === 1} onClick={() => onChange({ ...proposal, ingredients: proposal.ingredients.filter((_, position) => position !== ingredientIndex) })}>Quitar ingrediente</button>
    </div>)}
    <button type="button" disabled={proposal.ingredients.length >= 20} onClick={() => onChange({ ...proposal, ingredients: [...proposal.ingredients, { name: '', quantity: 1, unit: 'g' }] })}>Agregar ingrediente</button>
    <label>Pasos<textarea value={proposal.steps.join('\n')} onChange={(event) => onChange({ ...proposal, steps: event.target.value.split('\n') })} /></label>
    {proposal.nutrition && <div>{(['kcal', 'protein_g', 'carbs_g', 'fat_g'] as const).map((key) => <label key={key}>{({ kcal: 'Calorías por porción', protein_g: 'Proteínas por porción', carbs_g: 'Hidratos por porción', fat_g: 'Grasas por porción' })[key]}
      <input type="number" min={key === 'kcal' ? 0.1 : 0} step="0.1" value={proposal.nutrition!.per_portion[key]} onChange={(event) => onChange({ ...proposal, nutrition: { ...proposal.nutrition!, per_portion: { ...proposal.nutrition!.per_portion, [key]: Number(event.target.value) } } })} />
    </label>)}</div>}
    <p>Guardar recalcula los totales. Revisá cómo cambiaron las calorías después de editar ingredientes, rinde o porciones.</p>
  </fieldset>;
}
