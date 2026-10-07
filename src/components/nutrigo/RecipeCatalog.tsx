import { useModalFocus } from './use-modal-focus';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Heart } from '@phosphor-icons/react';
import { recipesApi } from '../../api/recipes';
import { resourcesApi } from '../../api/resources';
import { aiJobsApi } from '../../api/ai-jobs';
import type { AiJobView } from '../../types/ai-jobs';
import { ApiError, isAbortError } from '../../api/client';
import { waitForRecipeProposal } from './recipe-ai-flow';
import { careErrorMessage } from '../../api/care';
import { type ProfessionalRecipe, type RecipeUnit } from '../../types/recipes';
import { PLAN_SLOTS, type PlanSlot } from '../../types/plans';
import { recipeWizardSchema, unavailableCard, type RecipeWizardInput } from '../../types/recipe-plate';
import { RecipePlateCard } from './RecipePlate';
import './recipe-plate.css';
import { NvButton, NvState } from './primitives';
import './recipe-catalog.css';
import { recipeNutritionLabel } from '../../types/ai-nutrition';
import { RecipeManualCoverAction } from './RecipeManualCoverAction';
import { dateId } from '../../features/nutrigo/screens/shared';
import { useUnsavedChanges, canLeaveWorkspace } from './unsaved-changes';
import { FigmaRecordDialog } from './FigmaPatientFront';
import { foodApi } from '../../api/foods';
import type { Food } from '../../types/foods';
import { RecipeCatalogIngredients, RecipeComposition } from './RecipeCatalogIngredients';
import { filterProfessionalRecipes, type RecipeCatalogQuery } from '../../types/recipe-catalog-query';
import { RecipeProfessionalDetail } from './RecipeProfessionalDetail';

function emptyDraft(id = crypto.randomUUID()): RecipeWizardInput {
  return {
    id, expected_revision: null, title: '', yield_portions: 1, steps: [''], nutrient_source: '', category: 'Almuerzo', prep_minutes: null,
    items: [{ name: '', quantity: 1, unit: 'g' }],
  };
}

export function recipeEditorFromStored(recipe: ProfessionalRecipe): RecipeWizardInput {
  return {
    id: recipe.id,
    expected_revision: recipe.current.revision ?? null,
    title: recipe.title,
    yield_portions: recipe.current.yield_portions,
    steps: recipe.current.steps.length ? recipe.current.steps : [''],
    nutrient_source: recipe.current.nutrient_source,
    ...(recipe.current.nutrition ? { nutrition: recipe.current.nutrition } : {}),
    category: (PLAN_SLOTS as readonly string[]).includes(recipe.current.card?.category ?? '') ? recipe.current.card!.category as PlanSlot : 'Almuerzo',
    prep_minutes: recipe.current.card?.prep_minutes ?? null,
    final_weight_g: recipe.current.final_weight_g ?? null,
    cooking_minutes: recipe.current.cooking_minutes ?? null,
    kcal: recipe.current.card?.macros?.kcal ?? null,
    protein_g: recipe.current.card?.macros?.protein_g ?? null,
    carbs_g: recipe.current.card?.macros?.carbs_g ?? null,
    fat_g: recipe.current.card?.macros?.fat_g ?? null,
    items: recipe.current.ingredients.length
      ? recipe.current.ingredients.map((item) => {
        const frozen = recipe.current.catalog_recipe?.lines.find(line => line.name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es') === item.name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es'));
        return frozen ? { name: frozen.name, quantity: frozen.quantity, unit: frozen.unit as RecipeUnit, ...(frozen.catalog_ref ? { catalog_ref: frozen.catalog_ref } : {}) } : { name: item.name, quantity: item.quantity, unit: item.unit };
      })
      : [{ name: '', quantity: 1, unit: 'g' }],
  };
}

type RecipePatientOption = { id: string; name: string };
export type RecipeCatalogState = ReturnType<typeof useRecipeCatalog> & {
  patientOptions?: readonly RecipePatientOption[];
  onSelectPatient?: (id: string) => void;
};

export function recipeEditorFromAi(payload: Record<string, unknown>): RecipeWizardInput {
  return recipeWizardSchema.parse({ ...payload, category: 'Almuerzo', cover_status: 'none' });
}

/** Estado y acciones reales del catálogo profesional (crear, IA, editar, publicar, asignar al día). */
export function useRecipeCatalog(patientId: string) {
  const [favoriteIds, setFavoriteIds] = useState<string[] | null>(null);
  const [favoriteError, setFavoriteError] = useState('');
  const [favoriteAttempt, setFavoriteAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setFavoriteIds(null); setFavoriteError('');
    void recipesApi.favorites(controller.signal).then(result => setFavoriteIds(result.favorite_ids)).catch(error => { if (!isAbortError(error)) setFavoriteError(careErrorMessage(error)); });
    return () => controller.abort();
  }, [favoriteAttempt]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [foodsError, setFoodsError] = useState('');
  const [foodsLoading, setFoodsLoading] = useState(true);
  const [foodsAttempt, setFoodsAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setFoodsLoading(true); setFoodsError('');
    void foodApi.list(controller.signal).then(result => setFoods(result.foods)).catch(error => { if (!isAbortError(error)) setFoodsError(careErrorMessage(error)); }).finally(() => { if (!controller.signal.aborted) setFoodsLoading(false); });
    return () => controller.abort();
  }, [foodsAttempt]);
  const [recipes, setRecipes] = useState<ProfessionalRecipe[] | null>(null);
  const [source, setSource] = useState('');
  const [imageGeneration, setImageGeneration] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<RecipeWizardInput | null>(null);
  const [path, setPath] = useState<'choose' | 'manual' | 'ai' | null>(null);
  const [description, setDescription] = useState('');
  const [pendingAiJob, setPendingAiJob] = useState<AiJobView | null>(null);
  const [aiProgress, setAiProgress] = useState('');
  const [aiWarnings, setAiWarnings] = useState<string[]>([]);
  const aiController = useRef<AbortController | null>(null);
  useEffect(() => () => aiController.current?.abort(), []);
  const [assigning, setAssigning] = useState<ProfessionalRecipe | null>(null);
  const [day, setDay] = useState(() => dateId(new Date()));
  const lock = useRef(false);
  const [slot, setSlot] = useState<PlanSlot>('Almuerzo');
  const [editorBaseline, setEditorBaseline] = useState('');
  useUnsavedChanges(Boolean(editing && JSON.stringify(editing) !== editorBaseline) || (path === 'ai' && Boolean(description.trim())), busy);
  const openStored = (recipe: ProfessionalRecipe) => { const draft = recipeEditorFromStored(recipe); setEditing(draft); setEditorBaseline(JSON.stringify(draft)); };

  async function reload() {
    setError('');
    try {
      const result = await recipesApi.list();
      setRecipes(result.recipes);
      setSource(result.source);
      setImageGeneration(result.image_generation === true);
    } catch (caught) {
      setRecipes([]);
      if (!isAbortError(caught)) setError(careErrorMessage(caught));
    }
  }

  useEffect(() => { void reload(); }, []);

  async function run(work: () => Promise<unknown>, success: string) {
    if (lock.current) return; lock.current = true;
    setBusy(true); setStatus(''); setError('');
    try {
      await work();
      setStatus(success);
      await reload();
    } catch (caught) {
      if (!isAbortError(caught)) setError(careErrorMessage(caught));
    } finally {
      lock.current = false; setBusy(false);
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
    void run(async () => { const saved = await recipesApi.save(parsed.data); openStored(saved.recipe); }, 'Borrador guardado en el catálogo.');
  }

  function generateAiProposal(titleHint?: string) {
    if (!patientId) { setError('Elegí el paciente para adaptar la propuesta a sus alergias y restricciones.'); return; }
    void run(async () => {
      const controller = new AbortController(); aiController.current = controller;
      setAiWarnings([]);
      setAiProgress(pendingAiJob ? 'Consultando la propuesta existente…' : 'Preparando una propuesta para revisar…');
      try {
        const initial = pendingAiJob ?? (await aiJobsApi.enqueue({ patient_id: patientId, job_type: 'recipe_draft', title_hint: titleHint }, controller.signal)).job;
        setPendingAiJob(initial);
        const completed = await waitForRecipeProposal(initial, {
          get: aiJobsApi.get, signal: controller.signal,
          onProgress: (job) => {
            setPendingAiJob(['failed', 'cancelled', 'stale'].includes(job.status) ? null : job);
            setAiProgress(job.status === 'queued' ? 'Propuesta en espera…' : job.status === 'running' ? 'La IA está preparando la receta…' : 'Abriendo el borrador para tu revisión…');
          },
        });
        await aiJobsApi.apply(completed.id, controller.signal);
        const saved = (await recipesApi.list(controller.signal)).recipes.find(recipe => recipe.id === completed.artifact!.payload.id);
        if (!saved) throw new Error('El borrador quedó guardado, pero falta confirmar su lectura. Usá «Consultar propuesta» para recuperarlo.');
        openStored(saved);
        setAiWarnings(completed.warnings);
        setPendingAiJob(null);
        setPath('manual');
      } catch (caught) {
        // Un conflicto de contexto exige otra propuesta; una caída de red permite consultar la misma.
        if (caught instanceof ApiError && caught.status === 409) setPendingAiJob(null);
        throw caught;
      } finally {
        setAiProgress(''); aiController.current = null;
      }
    }, 'Propuesta lista para revisar. Los nutrientes son estimaciones de IA; la foto puede subirse manualmente.');
  }

  function quickAiDraft() { if (!canLeaveWorkspace()) return; setPath('ai'); setEditing(null); setError(''); setStatus(''); }
  function submitAi(event: FormEvent) { event.preventDefault(); generateAiProposal(description.trim()); }

  return {
    patientId, recipes, source, imageGeneration, error, status, busy, editing, path, description, assigning, day, slot, aiProgress, pendingAiJob, aiWarnings, foods, foodsError, foodsLoading,
    reloadFoods: () => setFoodsAttempt(value => value + 1),
    favoriteIds, favoriteError, reloadFavorites: () => setFavoriteAttempt(value => value + 1),
    setFavorite: (recipeId: string, favorite: boolean) => void run(async () => {
      const result = await recipesApi.setFavorite(recipeId, favorite);
      setFavoriteIds(current => result.favorite ? [...new Set([...(current ?? []), result.recipe_id])] : (current ?? []).filter(id => id !== result.recipe_id));
    }, favorite ? 'Receta guardada en tus favoritos.' : 'Receta quitada de tus favoritos.'),
    resumeAi: () => { if (canLeaveWorkspace()) generateAiProposal(); },
    setEditing, setPath, setDescription, setDay, setSlot, reload, run, submit, submitAi, quickAiDraft,
    recoverEditing: () => void run(async () => { const saved = (await recipesApi.list()).recipes.find(recipe => recipe.id === editing?.id); if (saved) openStored(saved); }, 'Versión guardada recuperada. Revisala antes de continuar.'),
    startNew: () => { if (!canLeaveWorkspace()) return; setPath('choose'); setEditing(null); setAiWarnings([]); setStatus(''); setError(''); },
    chooseManual: () => { if (!canLeaveWorkspace()) return; const draft = emptyDraft(); setPath('manual'); setEditing(draft); setAiWarnings([]); setEditorBaseline(JSON.stringify(draft)); },
    chooseAi: () => { if (!canLeaveWorkspace()) return; setPath('ai'); setEditing(null); },
    closeEditor: () => { if (!canLeaveWorkspace()) return; setEditing(null); setPath(null); if (!pendingAiJob) setDescription(''); },
    startEdit: (recipe: ProfessionalRecipe) => { if (!canLeaveWorkspace()) return; openStored(recipe); setAiWarnings([]); setPath('manual'); setStatus(''); setError(''); },
    publish: (recipe: ProfessionalRecipe) => {
      if (editing?.id === recipe.id && JSON.stringify(editing) !== editorBaseline) { setError('Guardá y revisá los cambios de esta receta antes de publicar.'); return; }
      void run(() => recipesApi.publish(recipe.id, recipe.current.version, recipe.current.revision), 'Revisión publicada. El paciente la ve cuando la asignás.');
    },
    retryCover: (recipe: ProfessionalRecipe) => void run(async () => {
      if (!recipe.published) return;
      const saved = await recipesApi.cover(recipe.id, recipe.published.version);
      if (saved.recipe.published?.card?.cover_status !== 'ready' && !['queued','leased'].includes(saved.recipe.published?.card?.cover_generation??'')) {
        throw new Error('La receta sigue publicada. No se pudo preparar la foto; podés reintentar más tarde.');
      }
    }, 'Solicitud de foto confirmada. Actualizá para ver el resultado; la receta conserva su contenido.'),
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

export function RecipeCoverAction({ catalog, recipe, className = '' }: { catalog: RecipeCatalogState; recipe: ProfessionalRecipe; className?: string }) {
  if (!recipe.published || recipe.published.card?.cover_status === 'ready') return null;
  if (['queued','leased'].includes(recipe.published.card?.cover_generation??'')) return <small>Foto pendiente</small>;
  return <button type="button" className={className} disabled={catalog.busy || !catalog.imageGeneration}
    title={catalog.imageGeneration ? 'Preparar la foto de la revisión publicada' : 'La generación de fotos todavía no está habilitada.'}
    onClick={() => catalog.retryCover(recipe)}>
    {recipe.published.card?.cover_status === 'failed' ? 'Reintentar foto' : 'Generar foto'}
  </button>;
}

/** Paso 1: carga manual o asistente IA. */
export function RecipeChoice({ catalog }: { catalog: RecipeCatalogState }) {
  return <div className="recipe-choice" aria-label="Paso 1 de 2">
    <button type="button" disabled={catalog.busy} onClick={catalog.chooseManual}>
      <strong>Carga manual</strong>
      <span>Elegí alimentos del catálogo o cargá ingredientes y valores declarados.</span>
    </button>
    <button type="button" disabled={catalog.busy || (!catalog.patientId && !catalog.patientOptions?.length)} onClick={catalog.chooseAi}>
      <strong>Asistente IA</strong>
      <span>Describí el plato. La propuesta queda para revisar antes de asignar.</span>
    </button>
  </div>;
}

export function RecipeAiForm({ catalog }: { catalog: RecipeCatalogState }) {
  const { busy, description, setDescription, closeEditor, submitAi, pendingAiJob, aiProgress } = catalog;
  return <form className="recipe-form" onSubmit={submitAi} aria-busy={busy}>
    <p className="recipe-wizard-note">Paso 1 de 2 · describí el plato. No se publica sola.</p>
    <p>La propuesta usa las alergias y restricciones del paciente seleccionado. Queda como borrador privado para revisar.</p>
    <RecipePatientPicker catalog={catalog} purpose="Propuesta para" />
    <label>Describí el plato<textarea disabled={busy || Boolean(pendingAiJob)} value={description} maxLength={150} placeholder="Por ejemplo: tortilla de verduras para dos porciones" onChange={(event) => setDescription(event.target.value)} /></label>
    {aiProgress && <p role="status">{aiProgress}</p>}
    <footer>
      <NvButton type="submit" disabled={busy || !catalog.patientId || (!pendingAiJob && description.trim().length < 2)}>{busy ? 'Preparando propuesta…' : pendingAiJob ? 'Consultar propuesta' : 'Completar con IA'}</NvButton>
      <button type="button" className="recipe-cancel" disabled={busy} onClick={closeEditor}>Cerrar</button>
    </footer>
  </form>;
}

function RecipePatientPicker({ catalog, purpose }: { catalog: RecipeCatalogState; purpose: string }) {
  if (!catalog.patientOptions || !catalog.onSelectPatient) return null;
  const proposal = purpose === 'Propuesta para';
  return <label>{purpose}<select value={proposal ? catalog.pendingAiJob?.patient_id ?? catalog.patientId : catalog.patientId} disabled={catalog.busy || (proposal && Boolean(catalog.pendingAiJob))} onChange={event => catalog.onSelectPatient?.(event.target.value)}>
    <option value="" disabled>Elegí un paciente</option>
    {catalog.patientOptions.map(patient => <option key={patient.id} value={patient.id}>{patient.name}</option>)}
  </select></label>;
}

export function RecipeAiNotices({ catalog }: { catalog: RecipeCatalogState }) {
  return <>
    {catalog.aiWarnings.length > 0 && <div className="recipe-ai-warnings" role="status"><strong>Antes de usar esta propuesta</strong><ul>{catalog.aiWarnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></div>}
    {catalog.aiProgress && catalog.path !== 'ai' && <p role="status">{catalog.aiProgress}</p>}
    {catalog.pendingAiJob && !catalog.busy && catalog.path !== 'ai' && <NvButton onClick={catalog.resumeAi}>Consultar propuesta</NvButton>}
  </>;
}

export function RecipeEditorForm({ catalog }: { catalog: RecipeCatalogState }) {
  const { editing, setEditing, busy, submit, closeEditor } = catalog;
  if (!editing) return null;
  const prior = catalog.recipes?.find(recipe => recipe.id === editing.id)?.current.catalog_recipe;
  const linked = editing.items.some(item => item.catalog_ref) || Boolean(prior);
  return <form className="recipe-form" onSubmit={submit}><fieldset disabled={busy} className="recipe-edit-fields">
    <p className="recipe-wizard-note">Paso 2 de 2 · revisá ingredientes, macros y foto antes de asignar.</p>
    {(editing.nutrition || prior?.estimate_origin) && <p>{prior?.estimate_origin ? 'Nutrientes estimados por IA' : recipeNutritionLabel(editing.nutrition)}{editing.nutrition?.origin === 'ai_estimate' || prior?.estimate_origin ? ' · revisar no convierte la estimación en un valor medido.' : ''}</p>}
    <label>Título<input value={editing.title} maxLength={150} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></label>
    {editing.nutrition && !linked && <fieldset><legend>Nutrientes por porción · estimación para revisar</legend>
      {(['kcal', 'protein_g', 'carbs_g', 'fat_g'] as const).map((key) => <label key={key}>{({ kcal: 'Calorías (kcal)', protein_g: 'Proteínas (g)', carbs_g: 'Hidratos (g)', fat_g: 'Grasas (g)' })[key]}
        <input type="number" min={key === 'kcal' ? 0.1 : 0} step="0.1" value={editing.nutrition!.per_portion[key]} onChange={(event) => setEditing({ ...editing, nutrition: { ...editing.nutrition!, per_portion: { ...editing.nutrition!.per_portion, [key]: Number(event.target.value) } } })} />
      </label>)}
    </fieldset>}
    <div className="recipe-form-row">
      <label>Rinde (porciones)<input type="number" min={1} max={50} step="0.5" value={editing.yield_portions} onChange={(event) => setEditing({ ...editing, yield_portions: Number(event.target.value) })} /></label>
      {!linked && <label>Fuente nutricional<input value={editing.nutrient_source} maxLength={200} placeholder="Declarada; vacía si no hay base" onChange={(event) => setEditing({ ...editing, nutrient_source: event.target.value })} /></label>}
      <label>Peso final preparado (g)<input type="number" min="0.1" max="100000" step="0.1" placeholder="Opcional" value={editing.final_weight_g ?? ''} onChange={event => setEditing({ ...editing, final_weight_g: event.target.value === '' ? null : Number(event.target.value) })} /></label>
      <label>Preparación (min)<input type="number" min="1" max="240" value={editing.prep_minutes ?? ''} onChange={event => setEditing({ ...editing, prep_minutes: event.target.value === '' ? null : Number(event.target.value) })} /></label>
      <label>Cocción (min)<input type="number" min="0" max="1440" value={editing.cooking_minutes ?? ''} onChange={event => setEditing({ ...editing, cooking_minutes: event.target.value === '' ? null : Number(event.target.value) })} /></label>
    </div>
    <label>Momento<select value={editing.category} onChange={event => setEditing({ ...editing, category: event.target.value as PlanSlot })}>{PLAN_SLOTS.map(slot => <option key={slot}>{slot}</option>)}</select></label>
    <RecipeCatalogIngredients draft={editing} onChange={setEditing} foods={catalog.foods ?? []} prior={prior} loading={catalog.foodsLoading} error={catalog.foodsError} retry={catalog.reloadFoods} />
    {linked && <RecipeComposition draft={editing} foods={catalog.foods ?? []} prior={prior} />}
    {!linked && <>
    {!editing.nutrition && <div className="recipe-form-row">
      <p>Valores por porción. Si cambiás ingredientes, cantidades o rinde, revisá y corregí estos nutrientes antes de guardar.</p>
      <label>KCAL<input type="number" min={0} max={20000} step="0.1" value={editing.kcal ?? ''} onChange={(event) => setEditing({ ...editing, kcal: event.target.value === '' ? null : Number(event.target.value) })} /></label>
      <label>PROT g<input type="number" min={0} step="0.1" value={editing.protein_g ?? ''} onChange={(event) => setEditing({ ...editing, protein_g: event.target.value === '' ? null : Number(event.target.value) })} /></label>
      <label>CARBS g<input type="number" min={0} step="0.1" value={editing.carbs_g ?? ''} onChange={(event) => setEditing({ ...editing, carbs_g: event.target.value === '' ? null : Number(event.target.value) })} /></label>
      <label>GRASAS g<input type="number" min={0} step="0.1" value={editing.fat_g ?? ''} onChange={(event) => setEditing({ ...editing, fat_g: event.target.value === '' ? null : Number(event.target.value) })} /></label>
    </div>}
    </>}
    <fieldset>
      <legend>Pasos</legend>
      <textarea aria-label="Pasos de la receta" value={editing.steps.join('\n')} onChange={(event) => setEditing({ ...editing, steps: event.target.value.split('\n') })} />
    </fieldset>
    </fieldset>{catalog.error && <button type="button" disabled={busy} onClick={catalog.recoverEditing}>Recuperar la versión guardada y reemplazar el formulario</button>}<footer>
      <NvButton type="submit" disabled={busy}>Guardar borrador</NvButton>
      <button type="button" className="recipe-cancel" disabled={busy} onClick={closeEditor}>Cerrar</button>
    </footer>
  </form>;
}

/** Vista previa de lo que ve el paciente + día y momento; confirma la asignación al día. */
export function RecipeAssignDialog({ catalog }: { catalog: RecipeCatalogState }) {
  const { assigning, day, setDay, slot, setSlot, busy, confirmAssign, closeAssign } = catalog;
  const dialog = useModalFocus(Boolean(assigning?.published), () => { if (!busy) closeAssign(); });
  if (!assigning?.published) return null;
  return <div className="recipe-overlay" ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Así lo ve tu asesorado">
    <div className="recipe-overlay-card">
      <h2>Así lo ve tu asesorado</h2>
      <RecipePatientPicker catalog={catalog} purpose="Asignar a" />
      <label>Día<input type="date" value={day} onChange={(event) => setDay(event.target.value)} /></label>
      <label>Momento<select value={slot} onChange={(event) => setSlot(event.target.value as PlanSlot)}>{PLAN_SLOTS.map((item) => <option key={item}>{item}</option>)}</select></label>
      <RecipePlateCard
        title={assigning.published.title ?? assigning.title}
        portions={assigning.published.yield_portions}
        card={assigning.published.card ?? unavailableCard(assigning.title)}
        ingredients={assigning.published.ingredients}
      />
      <footer className="recipe-actions">
        <NvButton disabled={busy || !catalog.patientId} onClick={confirmAssign}>Confirmar asignación</NvButton>
        <button type="button" className="recipe-cancel" onClick={closeAssign}>Cerrar</button>
      </footer>
    </div>
  </div>;
}

export function RecipeCatalog({ patientId, patients }: { patientId: string; patients?: readonly RecipePatientOption[] }) {
  const [filters, setFilters] = useState<RecipeCatalogQuery>({ query: '', category: '', state: 'all', favoritesOnly: false });
  const [detailId, setDetailId] = useState<string | null>(null);
  const returnFocus = useRef<string | null>(null);
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const [recipePatientId, setRecipePatientId] = useState(patientId);
  const hook = useRecipeCatalog(recipePatientId);
  const catalog: RecipeCatalogState = { ...hook, patientOptions: patients, onSelectPatient: setRecipePatientId };
  const { recipes, source, error, status, busy, editing, path } = catalog;
  const editorOpen = path === 'choose' || path === 'ai' || Boolean(editing);
  const detailRecipe = recipes?.find(recipe => recipe.id === detailId);
  const visible = filterProfessionalRecipes(recipes ?? [], filters, catalog.favoriteIds ?? []);
  const favoritesReady = !filters.favoritesOnly || catalog.favoriteIds !== null;
  useEffect(() => {
    if (detailId) detailHeading.current?.focus();
    else if (returnFocus.current) { document.getElementById(returnFocus.current)?.focus(); returnFocus.current = null; }
  }, [detailId]);
  const favoriteButton = (recipe: ProfessionalRecipe) => <button type="button" className="recipe-favorite" aria-label={`${catalog.favoriteIds?.includes(recipe.id) ? 'Quitar de' : 'Guardar en'} favoritos ${recipe.title}`} aria-pressed={catalog.favoriteIds?.includes(recipe.id) ?? false} disabled={busy || catalog.favoriteIds === null} onClick={() => catalog.setFavorite(recipe.id, !catalog.favoriteIds?.includes(recipe.id))}><Heart size={20} weight={catalog.favoriteIds?.includes(recipe.id) ? 'fill' : 'regular'} /><span>{catalog.favoriteIds?.includes(recipe.id) ? 'Favorita' : 'Guardar'}</span></button>;
  return <section className="recipe-catalog" aria-label="Catálogo profesional de recetas">
    <header>
      <div>

        <h2 className="recipe-catalog-title">Recetas</h2>
        <p>Preparaciones, ingredientes y composición de tu consultorio.</p>
      </div>
      <div className="recipe-header-actions">
        <NvButton className="nv-ghost" disabled={busy} onClick={catalog.startNew}>Nueva receta</NvButton>
        <NvButton disabled={busy || (!recipePatientId && !patients?.length)} onClick={catalog.quickAiDraft}>Generar borrador con IA</NvButton>
      </div>
    </header>
    {source === 'memory' && <p className="recipe-demo">Vista demo · recetas ficticias para probar el catálogo.</p>}
    {error && <p className="recipe-error" role="alert">{error}</p>}
    {status && <p className="recipe-status" role="status">{status}</p>}
    {catalog.favoriteError && <p className="recipe-error" role="alert">{catalog.favoriteError} <button type="button" onClick={catalog.reloadFavorites}>Reintentar favoritos</button></p>}
    {!editorOpen && <RecipeAiNotices catalog={catalog} />}
    {!recipes && !error && <p role="status">Cargando catálogo…</p>}
    {recipes && !recipes.length && !editing && <NvState title="Todavía no hay recetas en el catálogo" description="Creá un borrador con ingredientes, rinde y pasos. El paciente no lo ve hasta publicarlo y asignarlo." />}
    {editorOpen && <FigmaRecordDialog title={editing ? editing.title || 'Nueva receta' : path === 'ai' ? 'Crear receta con IA' : 'Nueva receta'} className="recipe-editor-dialog" closeLabel="Cerrar creación de receta" onClose={catalog.closeEditor}>
      {error && <p className="recipe-error" role="alert">{error}</p>}
      {status && <p className="recipe-status" role="status">{status}</p>}
      {path === 'choose' && !editing && <RecipeChoice catalog={catalog} />}
      {path === 'ai' && <RecipeAiForm catalog={catalog} />}
      <RecipeAiNotices catalog={catalog} />
      <RecipeEditorForm catalog={catalog} />
    </FigmaRecordDialog>}
    {detailRecipe ? <RecipeProfessionalDetail key={detailRecipe.id} recipe={detailRecipe} headingRef={detailHeading} onBack={() => setDetailId(null)} renderComposition={version => <RecipeComposition draft={recipeEditorFromStored({ ...detailRecipe, title: version.title ?? detailRecipe.title, current: version })} foods={[]} prior={version.catalog_recipe} />} favorite={favoriteButton(detailRecipe)} actions={<>
        <NvButton className="nv-ghost" disabled={busy} onClick={() => catalog.startEdit(detailRecipe)}>{detailRecipe.current.published_at ? 'Crear nueva versión' : 'Editar borrador'}</NvButton>
        {!detailRecipe.current.published_at && <NvButton disabled={busy} onClick={() => catalog.publish(detailRecipe)}>Publicar borrador</NvButton>}
        {detailRecipe.published && <NvButton disabled={busy || (!recipePatientId && !patients?.length)} onClick={() => catalog.startAssign(detailRecipe)}>Asignar versión publicada</NvButton>}
        <RecipeCoverAction catalog={catalog} recipe={detailRecipe} className="nv-button nv-ghost" />
        <RecipeManualCoverAction recipe={detailRecipe} disabled={busy} onSaved={catalog.reload} />
      </>} /> : <>
      <div className="recipe-catalog-filters">
        <label>Buscar recetas<input type="search" value={filters.query} placeholder="Nombre o ingrediente" onChange={event => setFilters({ ...filters, query: event.target.value })} /></label>
        <label>Momento<select value={filters.category} onChange={event => setFilters({ ...filters, category: event.target.value })}><option value="">Todos los momentos</option>{PLAN_SLOTS.map(slot => <option key={slot}>{slot}</option>)}</select></label>
        <label>Estado<select value={filters.state} onChange={event => setFilters({ ...filters, state: event.target.value as RecipeCatalogQuery['state'] })}><option value="all">Todas</option><option value="draft">Con borrador</option><option value="published">Con versión publicada</option></select></label>
        <label className="recipe-filter-check"><input type="checkbox" checked={filters.favoritesOnly} disabled={catalog.favoriteIds === null} onChange={event => setFilters({ ...filters, favoritesOnly: event.target.checked })} />Solo favoritas</label>
        <button type="button" className="recipe-cancel" onClick={() => setFilters({ query: '', category: '', state: 'all', favoritesOnly: false })}>Limpiar filtros</button>
      </div>
      {recipes && <p role="status">{source === 'memory' && 'Demo · '}{favoritesReady ? `${visible.length} de ${recipes.length} recetas` : 'Cargando favoritos…'}</p>}
      {recipes && recipes.length > 0 && favoritesReady && visible.length === 0 && <NvState title="No hay recetas con estos filtros" description="Probá otro nombre, ingrediente o momento, o limpiá los filtros." />}
      <div className="recipe-grid">{favoritesReady && visible.map((recipe) => {
      const storedCard = recipe.current.card ?? unavailableCard(recipe.title);
      const per100 = recipe.current.catalog_recipe?.per_100g;
      const card = per100 ? { ...storedCard, macros: { kcal: per100.kcal, protein_g: per100.protein, carbs_g: per100.carbs, fat_g: per100.fat } } : storedCard;
      return <div key={recipe.id} className="recipe-catalog-card"><div className="recipe-card-origin"><span>Consultorio · {recipe.current.published_at ? 'Publicada' : 'Borrador'}</span>{favoriteButton(recipe)}</div><RecipePlateCard title={recipe.title} portions={recipe.current.yield_portions} card={card} nutritionBasis={per100 ? 'Valores por 100 g preparados' : 'Valores por porción'} actions={<>
        <NvButton id={`recipe-open-${recipe.id}`} aria-label={`Ver receta ${recipe.title}`} disabled={busy} onClick={() => { returnFocus.current = `recipe-open-${recipe.id}`; setDetailId(recipe.id); }}>Ver receta</NvButton>
        <NvButton className="nv-ghost" aria-label={`Editar ${recipe.title}`} disabled={busy} onClick={() => catalog.startEdit(recipe)}>Editar</NvButton>
      </>} /></div>;
    })}</div></>}
    <RecipeAssignDialog catalog={catalog} />
  <details className="recipe-catalog-guidance"><summary>Publicación y estimaciones de IA</summary><p>Un borrador privado no cambia la revisión publicada. La IA propone nutrientes estimados que requieren revisión; la etiqueta de estimación se conserva al publicar. Publicar revalida alergias y la versión.</p></details></section>;
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
