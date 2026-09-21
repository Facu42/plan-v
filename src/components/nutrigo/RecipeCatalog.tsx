import { useEffect, useState, type FormEvent } from 'react';
import { recipesApi } from '../../api/recipes';
import { aiJobsApi } from '../../api/ai-jobs';
import { careErrorMessage } from '../../api/care';
import { RECIPE_UNITS, recipeDraftSchema, type ProfessionalRecipe, type RecipeDraftInput, type RecipeUnit } from '../../types/recipes';
import { NvButton, NvState } from './primitives';
import './recipe-catalog.css';

const STATUS: Record<ProfessionalRecipe['status'], string> = {
  draft: 'Borrador',
  published: 'Publicada',
  archived: 'Archivada',
};

function emptyDraft(id = crypto.randomUUID()): RecipeDraftInput {
  return { id, title: '', yield_portions: 1, steps: [''], nutrient_source: '', items: [{ name: '', quantity: 1, unit: 'g' }] };
}

function fromRecipe(recipe: ProfessionalRecipe): RecipeDraftInput {
  return {
    id: recipe.id,
    title: recipe.title,
    yield_portions: recipe.current.yield_portions,
    steps: recipe.current.steps.length ? recipe.current.steps : [''],
    nutrient_source: recipe.current.nutrient_source,
    items: recipe.current.ingredients.length
      ? recipe.current.ingredients.map((item) => ({ name: item.name, quantity: item.quantity, unit: item.unit }))
      : [{ name: '', quantity: 1, unit: 'g' }],
  };
}

export function RecipeCatalog({ patientId }: { patientId: string }) {
  const [recipes, setRecipes] = useState<ProfessionalRecipe[] | null>(null);
  const [source, setSource] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<RecipeDraftInput | null>(null);

  async function reload() {
    setError('');
    try {
      const result = await recipesApi.list();
      setRecipes(result.recipes);
      setSource(result.source);
    } catch (caught) {
      setRecipes([]);
      setError(careErrorMessage(caught));
    }
  }

  useEffect(() => { void reload(); }, []);

  async function run(work: () => Promise<unknown>, success: string) {
    setBusy(true); setStatus(''); setError('');
    try {
      await work();
      setStatus(success);
      await reload();
    } catch (caught) {
      setError(careErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const parsed = recipeDraftSchema.safeParse({
      ...editing,
      steps: editing.steps.map((step) => step.trim()).filter(Boolean),
      items: editing.items.filter((item) => item.name.trim()),
    });
    if (!parsed.success) {
      setError('Revisá el título, las porciones, los pasos, los ingredientes y la fuente nutricional.');
      return;
    }
    void run(() => recipesApi.save(parsed.data), 'Borrador guardado en el catálogo.');
  }

  return <section className="recipe-catalog" aria-label="Catálogo profesional de recetas">
    <header>
      <div>
        <span>CATÁLOGO DEL CONSULTORIO</span>
        <h2>Recetas e ingredientes</h2>
        <p>Porciones, pasos y fuente nutricional declarada. Un borrador no cambia la revisión publicada. No se inventan calorías ni macros. La IA deja un borrador privado; vos publicás.</p>
      </div>
      <div className="recipe-header-actions">
        <NvButton className="nv-ghost" disabled={busy} onClick={() => { setEditing(emptyDraft()); setStatus(''); setError(''); }}>Nueva receta</NvButton>
        <NvButton disabled={busy} onClick={() => void run(async () => {
          const created = await aiJobsApi.enqueue({ patient_id: patientId, job_type: 'recipe_draft', title_hint: editing?.title || undefined });
          if (created.job.status !== 'succeeded' || !created.job.artifact) throw new Error(created.job.error_code === 'stale_context' ? 'El ingreso cambió. Regenerá la propuesta.' : 'No se pudo preparar el borrador de IA.');
          await aiJobsApi.apply(created.job.id);
        }, 'Borrador de IA listo para tu revisión. No se publicó.')}>Generar borrador con IA</NvButton>
      </div>
    </header>
    {source === 'memory' && <p className="recipe-demo">Vista demo · el catálogo se conserva mientras la API siga encendida.</p>}
    {error && <p className="recipe-error" role="alert">{error}</p>}
    {status && <p className="recipe-status" role="status">{status}</p>}
    {!recipes && !error && <p role="status">Cargando catálogo…</p>}
    {recipes && !recipes.length && !editing && <NvState title="Todavía no hay recetas en el catálogo" description="Creá un borrador con ingredientes, rinde y pasos. El paciente no lo ve hasta publicarlo y asignarlo." />}
    {editing && <form className="recipe-form" onSubmit={submit}>
      <label>Título<input value={editing.title} maxLength={150} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></label>
      <div className="recipe-form-row">
        <label>Rinde (porciones)<input type="number" min={1} max={50} step="0.5" value={editing.yield_portions} onChange={(event) => setEditing({ ...editing, yield_portions: Number(event.target.value) })} /></label>
        <label>Fuente nutricional<input value={editing.nutrient_source} maxLength={200} placeholder="Declarada; vacía si no hay base" onChange={(event) => setEditing({ ...editing, nutrient_source: event.target.value })} /></label>
      </div>
      <fieldset>
        <legend>Ingredientes</legend>
        {editing.items.map((item, index) => <div className="recipe-item-row" key={index}>
          <input aria-label={`Ingrediente ${index + 1}`} placeholder="Nombre" value={item.name} onChange={(event) => setEditing({
            ...editing,
            items: editing.items.map((current, currentIndex) => currentIndex === index ? { ...current, name: event.target.value } : current),
          })} />
          <input aria-label={`Cantidad ${index + 1}`} type="number" min={0.1} step="0.1" value={item.quantity} onChange={(event) => setEditing({
            ...editing,
            items: editing.items.map((current, currentIndex) => currentIndex === index ? { ...current, quantity: Number(event.target.value) } : current),
          })} />
          <select aria-label={`Unidad ${index + 1}`} value={item.unit} onChange={(event) => setEditing({
            ...editing,
            items: editing.items.map((current, currentIndex) => currentIndex === index ? { ...current, unit: event.target.value as RecipeUnit } : current),
          })}>
            {RECIPE_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
          </select>
        </div>)}
        <button type="button" className="recipe-add" onClick={() => setEditing({ ...editing, items: [...editing.items, { name: '', quantity: 1, unit: 'g' }] })}>Agregar ingrediente</button>
      </fieldset>
      <fieldset>
        <legend>Pasos</legend>
        <textarea aria-label="Pasos de la receta" value={editing.steps.join('\n')} onChange={(event) => setEditing({ ...editing, steps: event.target.value.split('\n') })} />
      </fieldset>
      <footer>
        <NvButton type="submit" disabled={busy}>Guardar borrador</NvButton>
        <button type="button" className="recipe-cancel" disabled={busy} onClick={() => setEditing(null)}>Cerrar</button>
      </footer>
    </form>}
    <div className="recipe-list">{recipes?.map((recipe) => <article key={recipe.id}>
      <header>
        <span className="recipe-eyebrow">{STATUS[recipe.status]} · v{recipe.current.version}{recipe.current.published_at ? '' : ' · en edición'}</span>
        <h3>{recipe.title}</h3>
        <p>Rinde {recipe.current.yield_portions} · {recipe.current.nutrient_source || 'Sin fuente nutricional declarada'}</p>
      </header>
      <ul>{recipe.current.ingredients.map((item) => <li key={item.id}>{item.quantity} {item.unit} {item.name}</li>)}</ul>
      <ol>{recipe.current.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      <div className="recipe-actions">
        <NvButton className="nv-ghost" disabled={busy} onClick={() => { setEditing(fromRecipe(recipe)); setStatus(''); setError(''); }}>Editar borrador</NvButton>
        {!recipe.current.published_at && <NvButton disabled={busy} onClick={() => void run(() => recipesApi.publish(recipe.id, recipe.current.version), 'Revisión publicada. El paciente la ve cuando la asignás.')}>Publicar revisión</NvButton>}
        {recipe.published && <NvButton disabled={busy} onClick={() => void run(() => recipesApi.assign(recipe.id, patientId, recipe.published!.version), 'Revisión publicada asignada a este paciente.')}>Asignar publicada</NvButton>}
      </div>
    </article>)}</div>
  </section>;
}

export function AssignedRecipesView({ recipes, query = '', error = '' }: {
  recipes: import('../../types/recipes').PatientRecipe[];
  query?: string;
  error?: string;
}) {
  const term = query.trim().toLocaleLowerCase('es-AR');
  const visible = recipes.filter((recipe) => !term || `${recipe.title} ${recipe.ingredients.map((item) => item.name).join(' ')}`.toLocaleLowerCase('es-AR').includes(term));
  return <section className="assigned-recipes" aria-label="Recetas publicadas asignadas">
    <header>
      <span>ASIGNADAS A VOS</span>
      <h2>Recetas publicadas</h2>
      <p>Sólo revisiones que tu nutricionista publicó y te asignó. Sin calorías inventadas.</p>
    </header>
    {error && <p className="recipe-error" role="alert">{error}</p>}
    {!recipes.length && <NvState title="Todavía no hay recetas publicadas para vos" description="Cuando tu nutricionista publique y asigne una revisión, vas a verla acá." />}
    {!!visible.length && <div className="recipe-list">{visible.map((recipe) => <article key={`${recipe.id}:${recipe.version}`}>
      <header>
        <span className="recipe-eyebrow">Revisión {recipe.version}</span>
        <h3>{recipe.title}</h3>
        <p>Rinde {recipe.yield_portions} · {recipe.nutrient_source || 'Sin fuente nutricional declarada'}</p>
      </header>
      <h4>Ingredientes</h4>
      <ul>{recipe.ingredients.map((item) => <li key={item.id}>{item.quantity} {item.unit} {item.name}</li>)}</ul>
      <h4>Pasos</h4>
      <ol>{recipe.steps.map((step) => <li key={step}>{step}</li>)}</ol>
    </article>)}</div>}
  </section>;
}

export function AssignedRecipes({ patientId, query = '' }: { patientId: string; query?: string }) {
  const [recipes, setRecipes] = useState<import('../../types/recipes').PatientRecipe[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    recipesApi.assigned(patientId, controller.signal)
      .then((result) => { setRecipes(result.recipes); setError(''); })
      .catch((caught) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return;
        setRecipes([]);
        setError(careErrorMessage(caught));
      });
    return () => controller.abort();
  }, [patientId]);
  return <AssignedRecipesView recipes={recipes} query={query} error={error} />;
}
