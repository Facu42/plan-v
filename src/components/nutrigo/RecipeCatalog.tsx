import { useEffect, useState, type FormEvent } from 'react';
import { recipesApi } from '../../api/recipes';
import { resourcesApi } from '../../api/resources';
import { aiJobsApi } from '../../api/ai-jobs';
import { careErrorMessage } from '../../api/care';
import { RECIPE_UNITS, type ProfessionalRecipe, type RecipeUnit } from '../../types/recipes';
import { PLAN_SLOTS, type PlanSlot } from '../../types/plans';
import { recipeWizardSchema, unavailableCard, type RecipeWizardInput } from '../../types/recipe-plate';
import { RecipePlateCard } from './RecipePlate';
import './recipe-plate.css';
import { NvButton, NvState } from './primitives';
import './recipe-catalog.css';

function emptyDraft(id = crypto.randomUUID()): RecipeWizardInput {
  return {
    id, title: '', yield_portions: 1, steps: [''], nutrient_source: '', category: 'Almuerzo', prep_minutes: null,
    items: [{ name: '', quantity: 1, unit: 'g' }],
  };
}

function fromRecipe(recipe: ProfessionalRecipe): RecipeWizardInput {
  return {
    id: recipe.id,
    title: recipe.title,
    yield_portions: recipe.current.yield_portions,
    steps: recipe.current.steps.length ? recipe.current.steps : [''],
    nutrient_source: recipe.current.nutrient_source,
    category: (PLAN_SLOTS as readonly string[]).includes(recipe.current.card?.category ?? '') ? recipe.current.card!.category as PlanSlot : 'Almuerzo',
    prep_minutes: recipe.current.card?.prep_minutes ?? null,
    protein_g: recipe.current.card?.macros?.protein_g ?? null,
    carbs_g: recipe.current.card?.macros?.carbs_g ?? null,
    fat_g: recipe.current.card?.macros?.fat_g ?? null,
    items: recipe.current.ingredients.length
      ? recipe.current.ingredients.map((item) => ({ name: item.name, quantity: item.quantity, unit: item.unit }))
      : [{ name: '', quantity: 1, unit: 'g' }],
  };
}

export type RecipeCatalogState = ReturnType<typeof useRecipeCatalog>;

/** Estado y acciones reales del catálogo profesional (crear, IA, editar, publicar, asignar al día). */
export function useRecipeCatalog(patientId: string) {
  const [recipes, setRecipes] = useState<ProfessionalRecipe[] | null>(null);
  const [source, setSource] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<RecipeWizardInput | null>(null);
  const [path, setPath] = useState<'choose' | 'manual' | 'ai' | null>(null);
  const [description, setDescription] = useState('');
  const [assigning, setAssigning] = useState<ProfessionalRecipe | null>(null);
  const [day, setDay] = useState('2026-09-22');
  const [slot, setSlot] = useState<PlanSlot>('Almuerzo');

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
    const parsed = recipeWizardSchema.safeParse({
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

  function quickAiDraft() {
    void run(async () => {
      const created = await aiJobsApi.enqueue({ patient_id: patientId, job_type: 'recipe_draft', title_hint: editing?.title || undefined });
      if (created.job.status !== 'succeeded' || !created.job.artifact) throw new Error(created.job.error_code === 'stale_context' ? 'El ingreso cambió. Regenerá la propuesta.' : 'No se pudo preparar el borrador de IA.');
      await aiJobsApi.apply(created.job.id);
    }, 'Borrador de IA listo para tu revisión. No se publicó.');
  }

  function submitAi(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      const created = await aiJobsApi.enqueue({ patient_id: patientId, job_type: 'recipe_draft', title_hint: description.trim() });
      if (created.job.status === 'failed' || created.job.status !== 'succeeded' || !created.job.artifact) {
        throw new Error('La IA no pudo armar la receta. Quedó en failed, sin macros ni foto inventados.');
      }
      await aiJobsApi.apply(created.job.id);
      const payload = created.job.artifact.payload as { title?: string; yield_portions?: number; steps?: string[]; items?: RecipeWizardInput['items'] };
      setEditing({
        ...emptyDraft(),
        title: payload.title || description.trim(),
        yield_portions: payload.yield_portions || 1,
        steps: payload.steps?.length ? payload.steps : [''],
        nutrient_source: '',
        cover_status: 'failed',
        items: payload.items?.length ? payload.items.map((item) => ({ name: item.name, quantity: item.quantity, unit: item.unit })) : [{ name: '', quantity: 1, unit: 'g' }],
      });
      setPath('manual');
    }, 'Propuesta lista para revisar. Sin macros ni foto si la IA no los devolvió.');
  }

  return {
    patientId, recipes, source, error, status, busy, editing, path, description, assigning, day, slot,
    setEditing, setPath, setDescription, setDay, setSlot, run, submit, submitAi, quickAiDraft,
    startNew: () => { setPath('choose'); setEditing(null); setStatus(''); setError(''); },
    chooseManual: () => { setPath('manual'); setEditing(emptyDraft()); },
    chooseAi: () => { setPath('ai'); setEditing(null); },
    closeEditor: () => { setEditing(null); setPath(null); },
    startEdit: (recipe: ProfessionalRecipe) => { setEditing(fromRecipe(recipe)); setPath('manual'); setStatus(''); setError(''); },
    publish: (recipe: ProfessionalRecipe) => void run(() => recipesApi.publish(recipe.id, recipe.current.version), 'Revisión publicada. El paciente la ve cuando la asignás.'),
    startAssign: (recipe: ProfessionalRecipe) => { setAssigning(recipe); setStatus(''); setError(''); },
    closeAssign: () => setAssigning(null),
    confirmAssign: () => {
      const target = assigning;
      if (!target?.published) return;
      void run(async () => {
        await recipesApi.assignDay(target.id, { patient_id: patientId, expected_version: target.published!.version, for_date: day, slot });
        setAssigning(null);
      }, 'Asignada al día. El paciente puede registrarla.');
    },
  };
}

/** Paso 1: carga manual o asistente IA. */
export function RecipeChoice({ catalog }: { catalog: RecipeCatalogState }) {
  return <div className="recipe-choice" aria-label="Paso 1 de 2">
    <button type="button" onClick={catalog.chooseManual}>
      <strong>Carga manual</strong>
      <span>Ingredientes, cantidades y macros que declares. Nada se completa solo.</span>
    </button>
    <button type="button" onClick={catalog.chooseAi}>
      <strong>Asistente IA</strong>
      <span>Describí el plato. La propuesta queda para revisar antes de asignar.</span>
    </button>
  </div>;
}

export function RecipeAiForm({ catalog }: { catalog: RecipeCatalogState }) {
  const { busy, description, setDescription, setPath, submitAi } = catalog;
  return <form className="recipe-form" onSubmit={submitAi}>
    <p className="recipe-wizard-note">Paso 1 de 2 · describí el plato. No se publica sola.</p>
    <label>Describí el plato<textarea value={description} maxLength={150} onChange={(event) => setDescription(event.target.value)} /></label>
    <footer>
      <NvButton type="submit" disabled={busy || description.trim().length < 2}>Completar con IA</NvButton>
      <button type="button" className="recipe-cancel" onClick={() => setPath(null)}>Cerrar</button>
    </footer>
  </form>;
}

export function RecipeEditorForm({ catalog }: { catalog: RecipeCatalogState }) {
  const { editing, setEditing, busy, submit, closeEditor } = catalog;
  if (!editing) return null;
  return <form className="recipe-form" onSubmit={submit}>
    <p className="recipe-wizard-note">Paso 2 de 2 · revisá ingredientes, macros y foto antes de asignar.</p>
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
        <input aria-label={`Kcal de línea ${index + 1}`} type="number" min={0} step="1" placeholder="kcal" value={item.line_kcal ?? ''} onChange={(event) => setEditing({
          ...editing,
          items: editing.items.map((current, currentIndex) => currentIndex === index ? { ...current, line_kcal: event.target.value === '' ? undefined : Number(event.target.value) } : current),
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
    <div className="recipe-form-row">
      <label>PROT g<input type="number" min={0} step="0.1" value={editing.protein_g ?? ''} onChange={(event) => setEditing({ ...editing, protein_g: event.target.value === '' ? null : Number(event.target.value) })} /></label>
      <label>CARBS g<input type="number" min={0} step="0.1" value={editing.carbs_g ?? ''} onChange={(event) => setEditing({ ...editing, carbs_g: event.target.value === '' ? null : Number(event.target.value) })} /></label>
      <label>GRASAS g<input type="number" min={0} step="0.1" value={editing.fat_g ?? ''} onChange={(event) => setEditing({ ...editing, fat_g: event.target.value === '' ? null : Number(event.target.value) })} /></label>
    </div>
    <fieldset>
      <legend>Pasos</legend>
      <textarea aria-label="Pasos de la receta" value={editing.steps.join('\n')} onChange={(event) => setEditing({ ...editing, steps: event.target.value.split('\n') })} />
    </fieldset>
    <footer>
      <NvButton type="submit" disabled={busy}>Guardar borrador</NvButton>
      <button type="button" className="recipe-cancel" disabled={busy} onClick={closeEditor}>Cerrar</button>
    </footer>
  </form>;
}

/** Vista previa de lo que ve el paciente + día y momento; confirma la asignación al día. */
export function RecipeAssignDialog({ catalog }: { catalog: RecipeCatalogState }) {
  const { assigning, day, setDay, slot, setSlot, busy, confirmAssign, closeAssign } = catalog;
  if (!assigning?.published) return null;
  return <div className="recipe-overlay" role="dialog" aria-label="Así lo ve tu asesorado">
    <div className="recipe-overlay-card">
      <h2>Así lo ve tu asesorado</h2>
      <label>Día<input type="date" value={day} onChange={(event) => setDay(event.target.value)} /></label>
      <label>Momento<select value={slot} onChange={(event) => setSlot(event.target.value as PlanSlot)}>{PLAN_SLOTS.map((item) => <option key={item}>{item}</option>)}</select></label>
      <RecipePlateCard
        title={assigning.title}
        portions={assigning.published.yield_portions}
        card={assigning.published.card ?? unavailableCard(assigning.title)}
        ingredients={assigning.published.ingredients}
      />
      <footer className="recipe-actions">
        <NvButton disabled={busy} onClick={confirmAssign}>Confirmar asignación</NvButton>
        <button type="button" className="recipe-cancel" onClick={closeAssign}>Cerrar</button>
      </footer>
    </div>
  </div>;
}

export function RecipeCatalog({ patientId }: { patientId: string }) {
  const catalog = useRecipeCatalog(patientId);
  const { recipes, source, error, status, busy, editing, path } = catalog;
  return <section className="recipe-catalog" aria-label="Catálogo profesional de recetas">
    <header>
      <div>
        <span>CATÁLOGO DEL CONSULTORIO</span>
        <h2>Recetas e ingredientes</h2>
        <p>Porciones, pasos y fuente nutricional declarada. Un borrador no cambia la revisión publicada. No se inventan calorías ni macros. La IA deja un borrador privado; publicar revalida alergias y la versión. Vos publicás.</p>
      </div>
      <div className="recipe-header-actions">
        <NvButton className="nv-ghost" disabled={busy} onClick={catalog.startNew}>Nueva receta</NvButton>
        <NvButton disabled={busy} onClick={catalog.quickAiDraft}>Generar borrador con IA</NvButton>
      </div>
    </header>
    {source === 'memory' && <p className="recipe-demo">Vista demo · el catálogo se conserva mientras la API siga encendida.</p>}
    {error && <p className="recipe-error" role="alert">{error}</p>}
    {status && <p className="recipe-status" role="status">{status}</p>}
    {!recipes && !error && <p role="status">Cargando catálogo…</p>}
    {recipes && !recipes.length && !editing && <NvState title="Todavía no hay recetas en el catálogo" description="Creá un borrador con ingredientes, rinde y pasos. El paciente no lo ve hasta publicarlo y asignarlo." />}
    {(path === 'choose' || path === null) && <RecipeChoice catalog={catalog} />}
    {path === 'ai' && <RecipeAiForm catalog={catalog} />}
    <RecipeEditorForm catalog={catalog} />
    <div className="recipe-grid">{recipes?.map((recipe) => {
      const card = recipe.current.card ?? unavailableCard(recipe.title);
      return <RecipePlateCard key={recipe.id} title={recipe.title} portions={recipe.current.yield_portions} card={card} actions={<>
        <NvButton className="nv-ghost" disabled={busy} onClick={() => catalog.startEdit(recipe)}>Editar</NvButton>
        {!recipe.current.published_at && <NvButton disabled={busy} onClick={() => catalog.publish(recipe)}>Publicar</NvButton>}
        {recipe.published && <NvButton disabled={busy} onClick={() => catalog.startAssign(recipe)}>Asignar</NvButton>}
      </>} />;
    })}</div>
    <RecipeAssignDialog catalog={catalog} />
  </section>;
}

export function AssignedRecipesView({ recipes, query = '', error = '', patientId, savedIds = [], onToggleFavorite }: {
  recipes: import('../../types/recipes').PatientRecipe[];
  query?: string;
  error?: string;
  patientId?: string;
  savedIds?: string[];
  onToggleFavorite?: (recipeId: string) => void;
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
        {patientId && onToggleFavorite && <button type="button" aria-pressed={savedIds.includes(recipe.id)} onClick={() => onToggleFavorite(recipe.id)}>{savedIds.includes(recipe.id) ? 'Guardada' : 'Guardar en favoritos'}</button>}
      </header>
      <h4>Ingredientes</h4>
      <ul>{recipe.ingredients.map((item) => <li key={item.id}>{item.quantity} {item.unit} {item.name}</li>)}</ul>
      <h4>Pasos</h4>
      <ol>{recipe.steps.map((step) => <li key={step}>{step}</li>)}</ol>
    </article>)}</div>}
  </section>;
}

/** Revisiones publicadas y asignadas al paciente, con sus favoritos (sólo el paciente guarda). */
export function useAssignedRecipes(patientId: string, withFavorites = true) {
  const [recipes, setRecipes] = useState<import('../../types/recipes').PatientRecipe[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoaded(false);
    recipesApi.assigned(patientId, controller.signal)
      .then((result) => { setRecipes(result.recipes); setError(''); setLoaded(true); })
      .catch((caught) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return;
        setRecipes([]);
        setLoaded(true);
        setError(careErrorMessage(caught));
      });
    if (withFavorites) resourcesApi.library(patientId, '', false, controller.signal)
      .then((result) => setSavedIds(result.library.favorites.filter((row) => row.item_kind === 'recipe').map((row) => row.item_id)))
      .catch((caught) => { if (caught instanceof DOMException && caught.name === 'AbortError') return; });
    return () => controller.abort();
  }, [patientId, withFavorites]);
  async function toggleFavorite(recipeId: string) {
    try {
      const result = await resourcesApi.favorite(patientId, 'recipe', recipeId);
      setSavedIds(result.library.favorites.filter((row) => row.item_kind === 'recipe').map((row) => row.item_id));
    } catch (caught) {
      setError(careErrorMessage(caught));
    }
  }
  return { recipes, loaded, savedIds, error, toggleFavorite };
}

export function AssignedRecipes({ patientId, query = '' }: { patientId: string; query?: string }) {
  const { recipes, savedIds, error, toggleFavorite } = useAssignedRecipes(patientId);
  return <AssignedRecipesView recipes={recipes} query={query} error={error} patientId={patientId} savedIds={savedIds} onToggleFavorite={(id) => void toggleFavorite(id)} />;
}
