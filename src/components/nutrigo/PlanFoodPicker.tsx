import { useEffect, useState } from 'react';
import { foodApi } from '../../api/foods';
import { careErrorMessage } from '../../api/care';
import { normalizeFoodSearch, NUTRIENTS, type Food } from '../../types/foods';
import { componentGrams, componentNutrients, type PlanComponentView } from '../../types/plan-components';
import { FigmaRecordDialog } from './FigmaPatientFront';
import { NvButton } from './primitives';

export function PlanFoodPicker({ onChoose, onRecipe, onClose }: { onChoose: (component: PlanComponentView) => void; onRecipe: () => void; onClose: () => void }) {
  const [foods, setFoods] = useState<Food[]>([]), [selected, setSelected] = useState<Food | null>(null);
  const [query, setQuery] = useState(''), [quantity, setQuantity] = useState('100'), [measure, setMeasure] = useState('');
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  async function load() { setLoading(true); setError(''); try { const result = await foodApi.list(); setFoods(result.foods); } catch (caught) { setError(careErrorMessage(caught)); } finally { setLoading(false); } }
  useEffect(() => { void load(); }, []);
  const component: PlanComponentView | null = selected ? { kind: 'food', id: '00000000-0000-4000-a000-000000000001', food_id: selected.id, food_revision: selected.revision, quantity: Number(quantity), measure: measure || null, public_note: '', food_snapshot: selected } : null;
  const grams = component && quantity.trim() ? componentGrams(component) : null;
  const nutrients = grams !== null && component ? componentNutrients(component) : null;
  return <FigmaRecordDialog title="Agregar a la comida" closeLabel="Cerrar selección de alimento" className="plan-recipe-picker" onClose={onClose}>
    <div className="plan-analysis-switch"><button type="button" aria-pressed="true">Alimentos</button><button type="button" onClick={onRecipe}>Recetas</button></div>
    <label>Buscar alimento<input type="search" value={query} placeholder="Nombre, marca o categoría" onChange={event => setQuery(event.target.value)} /></label>
    {loading && <p role="status">Cargando alimentos…</p>}{error && <p role="alert">{error} <button type="button" onClick={() => void load()}>Reintentar</button></p>}
    <div className="plan-recipe-picker-columns"><div className="plan-recipe-picker-results">{!loading && !error && foods.filter(food => normalizeFoodSearch(`${food.name} ${food.brand} ${food.category}`).includes(normalizeFoodSearch(query))).map(food => <button type="button" aria-pressed={selected?.id === food.id} key={food.id} onClick={() => { setSelected(food); setMeasure(''); setQuantity('100'); }}><strong>{food.name}</strong><small>{food.brand || food.category} · {food.source} · r{food.revision}</small></button>)}{!loading && !error && !foods.some(food => normalizeFoodSearch(`${food.name} ${food.brand} ${food.category}`).includes(normalizeFoodSearch(query))) && <p>No hay alimentos para esta búsqueda.</p>}</div>
    <div>{selected ? <><h3>{selected.name}</h3><p>{selected.source} · Revisión {selected.revision}</p><label>Cantidad<input type="number" min="0.0001" max="100000" step="0.0001" value={quantity} onChange={event => setQuantity(event.target.value)} /></label><label>Medida<select value={measure} onChange={event => { setMeasure(event.target.value); setQuantity(event.target.value ? '1' : '100'); }}><option value="">Gramos</option>{selected.portions.map(portion => <option key={portion.name} value={portion.name}>{portion.name} ({portion.grams} g)</option>)}</select></label>{grams !== null ? <p>{grams.toLocaleString('es-AR')} g en total</p> : <p role="status">Revisá cantidad y medida; hasta 100.000 g por componente.</p>}<dl className="plan-recipe-nutrients">{NUTRIENTS.map(([key, label, unit]) => <div key={key}><dt>{label}</dt><dd>{nutrients?.[key] == null ? 'Sin dato' : `${nutrients[key]!.toLocaleString('es-AR', { maximumFractionDigits: 2 })} ${unit}`}</dd></div>)}</dl></> : <p>Elegí un alimento para revisar cantidades y composición.</p>}</div></div>
    <footer className="plan-recipe-picker-actions"><NvButton type="button" disabled={!component || grams === null || loading || Boolean(error)} onClick={() => { if (component && grams !== null) onChoose({ ...component, id: crypto.randomUUID() }); }}>Agregar al borrador</NvButton><NvButton type="button" className="nv-ghost" onClick={onClose}>Cancelar</NvButton></footer>
  </FigmaRecordDialog>;
}
