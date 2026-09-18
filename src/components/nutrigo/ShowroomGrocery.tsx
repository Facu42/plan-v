import { useEffect, useMemo, useState } from 'react';
import { buildShoppingExport, buildShoppingList, shoppingChecklistKey, type ShoppingGroup, type ShoppingMeal } from '../patient/shopping-list';
import { Icon } from '../shared/Icon';
import type { ShowroomPatient } from './showroom-model';
import type { CareReplacement } from '../../types/care';
import { useCare } from './useCare';
import { NvBadge, NvButton, NvState } from './primitives';
import './showroom-grocery.css';

type GroceryFilter = 'all' | 'pending' | 'checked';

function readChecked(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []);
  } catch { return new Set(); }
}

function saveChecked(key: string, value: ReadonlySet<string>) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(key, JSON.stringify([...value])); } catch { /* El checklist sigue activo durante esta visita. */ }
}

export function publishedRecipeMeals(replacements: readonly Pick<CareReplacement, 'published_at' | 'recipe'>[]): ShoppingMeal[] {
  return replacements
    .filter((entry) => entry.published_at)
    .map((entry) => ({ title: entry.recipe.title, detail: entry.recipe.ingredients.join(' ') }));
}

export function buildGroceryView(
  patient: Pick<ShowroomPatient, 'weekPlan'>,
  extras: readonly ShoppingMeal[] = [],
): { groups: ShoppingGroup[]; totalMeals: number; fallbackItems: number } {
  const meals = [...patient.weekPlan.flatMap((day) => day.meals.map(({ title }) => ({ title }))), ...extras];
  const groups = buildShoppingList(meals);
  return { groups, totalMeals: meals.length, fallbackItems: groups.find((group) => group.category === 'Otros')?.items.length ?? 0 };
}

export function ShowroomGrocery({ patient }: { patient: ShowroomPatient }) {
  const care = useCare(patient.id);
  const extras = useMemo(() => publishedRecipeMeals(care.data?.replacements ?? []), [care.data]);
  const storageKey = shoppingChecklistKey(patient.id, 'current');
  const { groups, totalMeals, fallbackItems } = useMemo(() => buildGroceryView(patient, extras), [patient, extras]);
  const items = groups.flatMap((group) => group.items);
  const [checked, setChecked] = useState<Set<string>>(() => readChecked(storageKey));
  const [filter, setFilter] = useState<GroceryFilter>('all');
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState('');
  const checkedCount = items.filter((item) => checked.has(item.id)).length;

  useEffect(() => { setChecked(readChecked(storageKey)); setFilter('all'); setQuery(''); setFeedback(''); }, [storageKey]);

  const toggle = (itemId: string) => setChecked((previous) => {
    const next = new Set(previous);
    if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
    saveChecked(storageKey, next);
    return next;
  });

  const visibleGroups = groups.map((group) => ({ ...group, items: group.items.filter((item) => {
    const matchesQuery = item.label.toLocaleLowerCase('es-AR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(query.toLocaleLowerCase('es-AR').normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    const matchesState = filter === 'all' || (filter === 'checked' ? checked.has(item.id) : !checked.has(item.id));
    return matchesQuery && matchesState;
  }) })).filter((group) => group.items.length);

  const exportList = () => {
    const text = buildShoppingExport({ label: 'Plan semanal vigente', range: 'Derivada de las comidas actualmente publicadas', groups, checkedIds: checked });
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = 'lista-de-compras-plan-v.txt'; anchor.click(); URL.revokeObjectURL(url);
    setFeedback('Lista descargada.');
  };

  const clearChecked = () => { const next = new Set<string>(); setChecked(next); saveChecked(storageKey, next); setFeedback('Checklist reiniciado.'); };

  return <section className="nvgrocery" aria-label="Lista de compras">
    <header className="nvgrocery-header"><div><span className="nv-icon-tile"><Icon name="check" size={20} /></span><div><h2>Lista de compras</h2><p>{extras.length ? 'Derivada de tu plan semanal y de las alternativas que tu nutricionista ya compartió.' : 'Derivada de tu plan semanal publicado.'}</p></div></div>{items.length > 0 && <NvButton onClick={exportList}><Icon name="download" size={15} />Exportar .txt</NvButton>}</header>

    {items.length > 0 ? <>
      <section className="nvgrocery-stats" aria-label="Resumen de la lista"><article><small>Elementos</small><strong>{items.length}</strong></article><article><small>Listos</small><strong>{checkedCount}</strong></article><article><small>Pendientes</small><strong>{items.length - checkedCount}</strong></article><article><small>Comidas fuente</small><strong>{totalMeals}</strong></article></section>
      <div className="nvgrocery-progress"><div><strong>{checkedCount} de {items.length} listos</strong><small>El check se guarda sólo en este navegador y para este paciente.</small></div><span aria-hidden="true"><i style={{ width: `${items.length ? checkedCount / items.length * 100 : 0}%` }} /></span></div>
      <div className="nvgrocery-layout">
        <section className="nvgrocery-list-card">
          <header><div><h3>Compras de la semana</h3><p>No incluye cantidades ni porciones porque el plan actual no las guarda.</p></div><label className="nvgrocery-search"><Icon name="list" size={15} /><input type="search" aria-label="Buscar en la lista" placeholder="Buscar elemento…" value={query} onChange={(event) => setQuery(event.target.value)} /></label></header>
          <div className="nvgrocery-filters" aria-label="Filtrar lista">{([{ id: 'all', label: 'Todos' }, { id: 'pending', label: 'Pendientes' }, { id: 'checked', label: 'Listos' }] as const).map((option) => <button type="button" key={option.id} aria-pressed={filter === option.id} onClick={() => setFilter(option.id)}>{option.label}</button>)}</div>
          {visibleGroups.length ? <div className="nvgrocery-groups">{visibleGroups.map((group) => <section key={group.category}><header><h4>{group.category}</h4><NvBadge>{group.items.length}</NvBadge></header><ul>{group.items.map((item) => <li key={item.id}><button type="button" aria-pressed={checked.has(item.id)} className={checked.has(item.id) ? 'is-checked' : ''} onClick={() => toggle(item.id)}><span className="nvgrocery-check">{checked.has(item.id) && <Icon name="check" size={13} />}</span><span><strong>{item.label}</strong>{item.occurrences > 1 && <small>Aparece en {item.occurrences} comidas del plan</small>}</span></button></li>)}</ul></section>)}</div> : <NvState title="Sin coincidencias" description="Probá otro filtro o término de búsqueda." />}
        </section>
        <aside className="nvgrocery-info"><span className="nv-icon-tile"><Icon name="leaf" size={22} /></span><h3>Cómo se armó</h3><p>La lista reconoce ingredientes mencionados en los títulos de las comidas. Cuando no puede reconocerlos, conserva la preparación completa para que no se pierda.</p><dl><div><dt>Categorías</dt><dd>{groups.length}</dd></div><div><dt>Preparaciones por revisar</dt><dd>{fallbackItems}</dd></div></dl>{checkedCount > 0 && <button type="button" onClick={clearChecked}>Desmarcar todo</button>}<p className="nvgrocery-note">Revisá siempre las indicaciones de tu nutricionista. La lista no agrega alimentos ni cantidades que no estén expresados en el plan.</p>{feedback && <p role="status" className="nvgrocery-feedback">{feedback}</p>}</aside>
      </div>
    </> : <NvState title="Sin lista para generar" description="Cuando tu nutricionista publique comidas para la semana, vas a encontrar acá una lista derivada de esos títulos." />}
  </section>;
}
