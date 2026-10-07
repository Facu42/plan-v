import { useEffect, useRef, useState, type FormEvent } from 'react';
import { careErrorMessage, notifyCareChanged } from '../../api/care';
import { plansApi } from '../../api/plans';
import { recipesApi } from '../../api/recipes';
import { aiJobsApi } from '../../api/ai-jobs';
import type { AiJobView } from '../../types/ai-jobs';
import { menuPreferences } from '../../lib/menu-preferences';
import { PLAN_SLOTS, buildPublishedPlanDays, mealPlanDraftSchema, toPublishedPatientPlan, type MealPlanDraftInput, type PatientMealPlan, type PlanItemView, type PlanRecipeDetail, type PlanSlot, type ProfessionalMealPlan } from '../../types/plans';
import type { ProfessionalRecipe } from '../../types/recipes';
import { NvButton, NvState } from './primitives';
import './meal-plan-versions.css';
import { useUnsavedChanges, canLeaveWorkspace } from './unsaved-changes';
import { recipeNutritionLabel, type ProposedRecipe } from '../../types/ai-nutrition';
import { RECIPE_UNITS } from '../../types/recipes';
import { AiPlanNutritionSummary } from './AiPlanNutritionSummary';
import { PlanRecipePicker, PlanRecipePreview } from './PlanRecipePicker';
import { publishedRecipeDetail, resolvePlanRecipeSelection } from '../../types/plan-recipe-selection';

type DraftItem = { for_date: string; slot: PlanSlot; free_text: string; recipe_id: string; recipe_version?: number; portions: string; public_note: string; recipe_proposal?: ProposedRecipe; recipePreview?: PlanRecipeDetail };

function emptyItem(date: string): DraftItem {
  return { for_date: date, slot: 'Almuerzo', free_text: '', recipe_id: '', portions: '1', public_note: '' };
}

function itemsFrom(plan: ProfessionalMealPlan | null): DraftItem[] {
  const source = plan?.current.items ?? [];
  if (!source.length) return [emptyItem(plan?.current.period_start || new Date().toISOString().slice(0, 10))];
  return source.map((item) => ({
    for_date: item.for_date,
    slot: item.slot,
    free_text: item.free_text ?? '',
    recipe_id: item.recipe_id ?? '',
    recipe_version: item.recipe_version ?? undefined,
    ...(item.recipe ? { recipePreview: item.recipe } : {}),
    portions: item.portions != null ? String(item.portions) : '',
    public_note: item.public_note,
    ...(item.recipe_proposal ? { recipe_proposal: item.recipe_proposal } : {}),
  }));
}

function proposalFrom(job: AiJobView | null): MealPlanDraftInput | null {
  if (job?.status !== 'succeeded' || job.artifact?.kind !== 'menu_draft' || job.applied_at) return null;
  const parsed = mealPlanDraftSchema.safeParse(job.artifact.payload);
  return parsed.success ? parsed.data : null;
}

export function matchesMenuProposal(plan: ProfessionalMealPlan, proposal: MealPlanDraftInput): boolean {
  if (plan.current.published_at) return false;
  return matchesMenuForm(plan, proposal);
}

export function matchesMenuForm(plan: ProfessionalMealPlan, proposal: MealPlanDraftInput): boolean {
  if (plan.id !== proposal.id) return false;
  if (plan.current.period_start !== proposal.period_start || plan.current.period_end !== proposal.period_end) return false;
  if (JSON.stringify(plan.current.nutrition_target ?? null) !== JSON.stringify(proposal.nutrition_target ?? null)) return false;
  const key = (item: { for_date: string; slot: string; recipe_id?: string | null; recipe_version?: number | null; free_text?: string | null; portions?: number | null; public_note?: string | null; recipe_proposal?: ProposedRecipe }) =>
    JSON.stringify([item.for_date, item.slot, item.recipe_id ?? null, item.recipe_version ?? null, item.free_text ?? null, item.portions ?? null, item.public_note ?? '', item.recipe_proposal ?? null]);
  return JSON.stringify(plan.current.items.map(key).sort()) === JSON.stringify(proposal.items.map(key).sort());
}

export function MenuProposalReview({ proposal, warnings, busy, onApprove, onReject, onEdit, recipes = [] }: {
  proposal: MealPlanDraftInput;
  warnings: string[];
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onEdit?: () => void;
  recipes?: ProfessionalRecipe[];
}) {
  const estimated = proposal.items.some((item) => item.recipe_proposal?.nutrition?.origin === 'ai_estimate') || proposal.nutrition?.days.some((day) => day.estimated);
  const [reviewed, setReviewed] = useState(false);
  return <section className="meal-plan-proposal" aria-label="Revisar menú propuesto por IA">
    <span className="meal-plan-proposal-eyebrow">PROPUESTA IA · BORRADOR PRIVADO</span>
    <h3>Revisá el menú antes de publicarlo</h3>
    <p>Del {proposal.period_start} al {proposal.period_end}. El paciente todavía no ve esta propuesta. Aprobarla reemplaza el borrador actual y publica la versión revisada.</p>
    {warnings.map((warning) => <p className="meal-plan-proposal-warning" key={warning}>{warning}</p>)}
    <ul>{proposal.items.map((item, index) => <li key={`${item.for_date}-${item.slot}-${index}`}>
      <strong>{item.for_date} · {item.slot}</strong>
      <span>{item.free_text || recipes.find((recipe) => recipe.id === item.recipe_id)?.published?.title || 'Receta del catálogo'}</span>
      {item.portions != null && <small>{item.portions} porciones</small>}
      {item.public_note && <small>{item.public_note}</small>}
      {item.recipe_proposal && <details><summary>Ingredientes, pasos y nutrientes</summary>
        <p>Rinde {item.recipe_proposal.yield_portions} porciones · {recipeNutritionLabel(item.recipe_proposal.nutrition)}</p>
        <ul>{item.recipe_proposal.ingredients.map((ingredient, index) => <li key={index}>{ingredient.quantity} {ingredient.unit} {ingredient.name}</li>)}</ul>
        <ol>{item.recipe_proposal.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
      </details>}
    </li>)}</ul>
    <AiPlanNutritionSummary nutrition={proposal.nutrition} />
    {estimated && <label><input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} />Revisé ingredientes, cantidades y nutrientes estimados. La etiqueta de estimación se conserva al publicar.</label>}
    <div className="meal-plan-actions">
      <NvButton type="button" disabled={busy || (estimated && !reviewed)} onClick={onApprove}>Aprobar y publicar menú</NvButton>
      {onEdit && <NvButton type="button" className="nv-ghost" disabled={busy} onClick={onEdit}>Editar propuesta</NvButton>}
      <NvButton type="button" className="nv-ghost" disabled={busy} onClick={onReject}>Rechazar propuesta</NvButton>
    </div>
  </section>;
}

export function MealPlanEditor({ patientId, onChanged }: { patientId: string; onChanged?: () => void }) {
  const [plan, setPlan] = useState<ProfessionalMealPlan | null>(null);
  const [recipes, setRecipes] = useState<ProfessionalRecipe[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [source, setSource] = useState('');
  const [imageGeneration, setImageGeneration] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [proposal, setProposal] = useState<AiJobView | null>(null);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [draftItems, setDraftItems] = useState<DraftItem[]>([emptyItem(new Date().toISOString().slice(0, 10))]);
  const [selectedSlots, setSelectedSlots] = useState<PlanSlot[]>(['Desayuno', 'Almuerzo', 'Merienda', 'Cena']);
  const [dietaryPreferences, setDietaryPreferences] = useState('');
  const [newPlanId] = useState(() => crypto.randomUUID());
  const planId = plan?.id ?? newPlanId;
  const lock = useRef(false);

  async function reloadCatalog() {
    setCatalogLoading(true); setCatalogError('');
    try { const catalog = await recipesApi.list(); setRecipes(catalog.recipes.filter(recipe => recipe.published)); }
    catch (caught) { setCatalogError(careErrorMessage(caught)); }
    finally { setCatalogLoading(false); }
  }

  async function reload() {
    try {
      const [plans, , aiJobs] = await Promise.all([plansApi.professional(patientId), reloadCatalog(), aiJobsApi.list(patientId)]);
      setPlan(plans.plan);
      setSource(plans.source);
      setImageGeneration(plans.image_generation === true);
      const requested = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('propuesta');
      const nextProposal = aiJobs.jobs.find((job) => job.job_type === 'menu_draft' && (requested ? job.id === requested : Boolean(proposalFrom(job)))) ?? null;
      setProposal(nextProposal && proposalFrom(nextProposal) ? nextProposal : null);
      if (requested && !proposalFrom(nextProposal)) setError('Esta propuesta ya no está lista para aprobar. Revisá el plan guardado o generá una propuesta nueva.');
      if (plans.plan) {
        setPeriodStart(plans.plan.current.period_start);
        setPeriodEnd(plans.plan.current.period_end);
        setDraftItems(itemsFrom(plans.plan));
      }
    } catch (caught) {
      setError(careErrorMessage(caught));
    }
  }

  useEffect(() => { setError(''); setStatus(''); setProposal(null); void reload(); }, [patientId]);

  async function run(work: () => Promise<unknown>, success: string) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setStatus('');
    try { await work(); setStatus(success); await reload(); onChanged?.(); notifyCareChanged(); }
    catch (caught) { setError(careErrorMessage(caught)); }
    finally { lock.current = false; setBusy(false); }
  }

  function formInput() {
    return { id: planId, expected_revision: plan?.current.revision ?? null, period_start: periodStart, period_end: periodEnd,
      timezone: 'America/Argentina/Buenos_Aires' as const,
      ...(plan?.current.nutrition_target ? { nutrition_target: plan.current.nutrition_target } : {}),
      items: draftItems.map(item => ({ for_date: item.for_date, slot: item.slot, recipe_id: item.recipe_id || undefined,
        recipe_version: item.recipe_id ? item.recipe_version : undefined, free_text: item.free_text.trim() || undefined,
        portions: item.portions ? Number(item.portions) : undefined, public_note: item.public_note,
        ...(item.recipe_proposal ? { recipe_proposal: item.recipe_proposal } : {}) })),
    };
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = mealPlanDraftSchema.safeParse({
      id: planId,
      expected_revision: plan?.current.revision ?? null,
      period_start: periodStart,
      period_end: periodEnd,
      timezone: 'America/Argentina/Buenos_Aires',
      ...(plan?.current.nutrition_target ? { nutrition_target: plan.current.nutrition_target } : {}),
      items: draftItems.map((item) => ({
        for_date: item.for_date,
        slot: item.slot,
        recipe_id: item.recipe_id || undefined,
        recipe_version: item.recipe_id ? item.recipe_version : undefined,
        free_text: item.free_text.trim() || undefined,
        portions: item.portions ? Number(item.portions) : undefined,
        public_note: item.public_note,
        ...(item.recipe_proposal ? { recipe_proposal: item.recipe_proposal } : {}),
      })),
    });
    if (!parsed.success) {
      setError('Revisá las fechas, los momentos y las recetas o textos del plan.');
      return;
    }
    void run(() => plansApi.save(patientId, parsed.data), 'Borrador guardado. El plan publicado no cambió.');
  }

  async function generateProposal() {
    if (lock.current) return;
    const preferences = menuPreferences(dietaryPreferences);
    if (preferences.error) { setError(preferences.error); return; }
    lock.current = true;
    setBusy(true); setError(''); setStatus(''); setProposal(null);
    try {
      const created = await aiJobsApi.enqueue({
        patient_id: patientId,
        job_type: 'menu_draft',
        period_start: periodStart,
        period_end: periodEnd,
        slots: selectedSlots,
        dietary_preferences: preferences.values,
      });
      if (!proposalFrom(created.job)) {
        throw new Error(created.job.error_code === 'stale_context'
          ? 'El ingreso cambió. Regenerá la propuesta.'
          : 'La IA no pudo preparar un menú para revisar. No se publicó nada.');
      }
      setProposal(created.job);
      notifyCareChanged();
      setStatus('Propuesta lista para revisar. El paciente todavía no la ve.');
    } catch (caught) {
      setError(careErrorMessage(caught));
    } finally {
      lock.current = false; setBusy(false);
    }
  }

  async function rejectProposal() {
    if (!proposal || lock.current) return;
    lock.current = true;
    setBusy(true); setError(''); setStatus('');
    try {
      await aiJobsApi.reject(proposal.id);
      setProposal(null);
      setStatus('Propuesta rechazada. El plan publicado no cambió.');
      notifyCareChanged();
    } catch (caught) {
      setError(careErrorMessage(caught));
    } finally {
      lock.current = false; setBusy(false);
    }
  }

  async function approveProposal() {
    const candidate = proposalFrom(proposal);
    if (!proposal || !candidate || lock.current || !canLeaveWorkspace()) return;
    lock.current = true;
    setBusy(true); setError(''); setStatus('');
    let applied = false;
    try {
      await aiJobsApi.apply(proposal.id);
      applied = true;
      const current = (await plansApi.professional(patientId)).plan;
      if (!current || !matchesMenuProposal(current, candidate)) {
        throw new Error('El borrador cambió. Revisá la versión actual antes de publicar.');
      }
      await plansApi.publish(current.id, current.current.version, current.current);
      setProposal(null);
      setStatus('Menú aprobado y publicado. El paciente ya puede ver el plan fechado.');
      await reload();
      onChanged?.();
    } catch (caught) {
      setError(applied
        ? `La propuesta quedó como borrador privado, pero no se publicó. ${careErrorMessage(caught)}`
        : careErrorMessage(caught));
      if (applied) await reload();
    } finally {
      if (applied) notifyCareChanged();
      lock.current = false; setBusy(false);
    }
  }

  async function editProposal() {
    if (!proposal || !canLeaveWorkspace()) return;
    await run(async () => { await aiJobsApi.apply(proposal.id); setProposal(null); }, 'Propuesta guardada como borrador privado. Editala y revisala antes de publicar.');
  }

  const proposedPlan = proposalFrom(proposal);
  const dirty = !plan || !matchesMenuForm(plan, formInput());
  useUnsavedChanges(plan ? dirty : Boolean(periodStart || periodEnd || dietaryPreferences || draftItems.some((item) => item.free_text.trim() || item.recipe_id || item.public_note || item.recipe_proposal)), busy);
  function publishVisible() {
    if (!plan || dirty) { setError('Guardá y revisá los cambios antes de publicar.'); return; }
    void run(() => plansApi.publish(plan.id, plan.current.version, plan.current), 'Plan publicado. La paciente ve la versión revisada.');
  }

  return <section className="meal-plan-versions" aria-label="Plan fechado versionado">
    <header>
      <div>
        <span>PLAN FECHADO</span>
        <h2>Versiones del plan</h2>
        <p>El paciente sólo ve la versión publicada. Publicar revalida alergias, unidades y la versión esperada. La IA propone un borrador; no publica sola.</p>
      </div>
    </header>
    {source === 'memory' && <p className="meal-plan-demo">Vista demo · plan ficticio para probar edición y publicación.</p>}
    {error && <p className="meal-plan-error" role="alert">{error}</p>}
    {status && <p className="meal-plan-status" role="status">{status}</p>}
    {proposal && !proposedPlan && <p className="meal-plan-error" role="alert">La propuesta no tiene un menú válido. Regenerala antes de aprobar.</p>}
    {proposedPlan && <MenuProposalReview key={proposal!.id} proposal={proposedPlan} warnings={proposal?.warnings ?? []} busy={busy} recipes={recipes} onEdit={() => void editProposal()} onApprove={() => void approveProposal()} onReject={() => void rejectProposal()} />}
    <AiPlanNutritionSummary nutrition={plan?.current.nutrition} />
    {plan?.published&&<section aria-label="Fotos del menú publicado" className="meal-plan-actions">
      <p>Las fotos se preparan después de aprobar el menú. Se reutilizan para los platos repetidos.</p>
      <NvButton type="button" className="nv-ghost" disabled={busy||dirty||!imageGeneration} onClick={()=>void run(()=>plansApi.covers(plan.id,plan.published!.version),'Fotos pendientes enviadas a preparar. El menú conserva su contenido.')}>Preparar fotos pendientes</NvButton>
      <NvButton type="button" className="nv-ghost" disabled={busy||dirty} onClick={()=>void reload()}>Actualizar fotos</NvButton>
      {!imageGeneration&&<small>La generación de fotos todavía no está habilitada.</small>}
    </section>}
    <form className="meal-plan-form" onSubmit={submit}><fieldset disabled={busy} className="meal-plan-edit-fields">
      <div className="meal-plan-form-row">
        <label>Desde<input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} /></label>
        <label>Hasta<input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} /></label>
      </div>
      <fieldset><legend>Momentos para la propuesta</legend>{PLAN_SLOTS.map((slot) => <label key={slot}><input type="checkbox" checked={selectedSlots.includes(slot)} onChange={(event) => setSelectedSlots(event.target.checked ? [...selectedSlots, slot] : selectedSlots.filter((entry) => entry !== slot))} />{slot}</label>)}</fieldset>
      <label>Preferencias alimentarias<textarea aria-describedby="menu-preferences-help" maxLength={809} placeholder="Una preferencia por línea, hasta 10 de 80 caracteres. Ejemplo: platos con legumbres." value={dietaryPreferences} onChange={(event) => setDietaryPreferences(event.target.value)} /></label>
      <small id="menu-preferences-help">Hasta 10 preferencias de 80 caracteres cada una. Separalas con un salto de línea.</small>
      {draftItems.map((item, index) => <div className="meal-plan-item-row" key={index}>
        <input aria-label={`Fecha ${index + 1}`} type="date" value={item.for_date} onChange={(event) => setDraftItems(draftItems.map((current, currentIndex) => currentIndex === index ? { ...current, for_date: event.target.value } : current))} />
        <select aria-label={`Momento ${index + 1}`} value={item.slot} onChange={(event) => setDraftItems(draftItems.map((current, currentIndex) => currentIndex === index ? { ...current, slot: event.target.value as PlanSlot } : current))}>
          {PLAN_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
        </select>
        <div className="meal-plan-recipe-choice"><button type="button" aria-label={`Elegir receta para indicación ${index + 1}`} onClick={() => setPickerIndex(index)}>{item.recipe_id ? `${resolvePlanRecipeSelection(item, recipes, plan?.current.items ?? [])?.title ?? 'Receta seleccionada'} · v${item.recipe_version} · Cambiar` : 'Elegir receta publicada'}</button>{item.recipe_id && <button type="button" onClick={() => setDraftItems(draftItems.map((current, currentIndex) => currentIndex === index ? { ...current, recipe_id: '', recipe_version: undefined, recipePreview: undefined, recipe_proposal: undefined } : current))}>Usar texto libre</button>}</div>
        <input aria-label={`Texto ${index + 1}`} placeholder="Indicación" value={item.free_text} disabled={Boolean(item.recipe_id)} onChange={(event) => setDraftItems(draftItems.map((current, currentIndex) => currentIndex === index ? { ...current, free_text: event.target.value, ...(current.recipe_proposal ? { recipe_proposal: { ...current.recipe_proposal, title: event.target.value } } : {}) } : current))} />
        <input aria-label={`Porciones ${index + 1}`} type="number" min={0.0001} max={50} step="0.0001" placeholder="Rinde" value={item.portions} onChange={(event) => setDraftItems(draftItems.map((current, currentIndex) => currentIndex === index ? { ...current, portions: event.target.value } : current))} />
        {item.recipe_id && <details className="meal-plan-recipe-inline"><summary>Revisar receta v{item.recipe_version} y nutrientes para esta indicación</summary>{(() => { const detail = resolvePlanRecipeSelection(item, recipes, plan?.current.items ?? []); return detail ? <PlanRecipePreview recipe={detail} portions={item.portions.trim() ? Number(item.portions) : NaN} /> : <p role="alert">No pudimos cargar el detalle de esta versión. No se reemplazará por otra receta al guardar.</p>; })()}</details>}
        {item.recipe_proposal && <PlanRecipeProposalEditor proposal={item.recipe_proposal} index={index} onChange={(recipe_proposal) => setDraftItems(draftItems.map((current, currentIndex) => currentIndex === index ? { ...current, recipe_proposal } : current))} />}
        <label>Nota para la paciente<input maxLength={200} aria-label={`Nota ${index + 1}`} value={item.public_note} onChange={event => setDraftItems(draftItems.map((current, currentIndex) => currentIndex === index ? { ...current, public_note: event.target.value } : current))} /></label>
        <button type="button" disabled={busy} onClick={() => setDraftItems(draftItems.filter((_, currentIndex) => currentIndex !== index))}>Quitar indicación {index + 1}</button>
      </div>)}
      </fieldset>{plan && !plan.current.published_at && dirty && <p role="status">Tenés cambios sin guardar. Guardalos y revisalos antes de publicar.</p>}
      {error && <button type="button" disabled={busy} onClick={() => void reload()}>Recuperar la versión guardada y reemplazar este formulario</button>}
      <div className="meal-plan-actions">
        <button type="button" className="meal-plan-add" onClick={() => setDraftItems([...draftItems, emptyItem(periodStart || draftItems[0]?.for_date || '')])} disabled={busy}>Agregar indicación</button>
        <NvButton type="button" className="nv-ghost" disabled={busy || !periodStart || !periodEnd || !selectedSlots.length || Boolean(proposal)} onClick={() => void generateProposal()}>Generar propuesta de menú</NvButton>
        <NvButton type="submit" disabled={busy}>Guardar borrador</NvButton>
        {plan && !plan.current.published_at && <NvButton type="button" disabled={busy || dirty} onClick={publishVisible}>Publicar v{plan.current.version}</NvButton>}
      </div>
    </form>
    {plan?.published && <details className="meal-plan-published-copy"><summary>Ver copia publicada · v{plan.published.version}</summary><PublishedDatedPlanView plan={toPublishedPatientPlan(plan)} audience="pro" /></details>}
    {pickerIndex !== null && draftItems[pickerIndex] && <PlanRecipePicker recipes={recipes} loading={catalogLoading} error={catalogError} onRetry={() => void reloadCatalog()} initialPortions={draftItems[pickerIndex].portions} onClose={() => setPickerIndex(null)} onChoose={(recipe, portions) => { const version = recipe.published; if (!version) return; setDraftItems(current => current.map((item, index) => index === pickerIndex ? { ...item, recipe_id: recipe.id, recipe_version: version.version, recipePreview: publishedRecipeDetail(recipe) ?? undefined, portions: String(portions), free_text: '', recipe_proposal: undefined } : item)); setPickerIndex(null); }} />}
  </section>;
}

function PlanRecipeProposalEditor({ proposal, index, onChange }: { proposal: ProposedRecipe; index: number; onChange: (proposal: ProposedRecipe) => void }) {
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

export function PlanPublishedItem({ item }: { item: PlanItemView }) {
  const recipe = item.recipe;
  return <article className="published-plan-item">
    <header>
      <strong>{item.slot}</strong>
      {item.portions != null && <small>Porciones {item.portions}</small>}
    </header>
    {recipe ? <>
      <h3>{recipe.title}</h3>
      <p>Revisión {recipe.version} · Rinde {recipe.yield_portions} · {recipe.nutrient_source || 'Sin fuente nutricional declarada'}</p>
      <h4>Ingredientes</h4>
      <ul>{recipe.ingredients.map((line) => <li key={line.id}>{line.quantity} {line.unit} {line.name}</li>)}</ul>
      <h4>Pasos</h4>
      <ol>{recipe.steps.map((step) => <li key={step}>{step}</li>)}</ol>
    </> : item.recipe_proposal ? <>
      <h3>{item.recipe_proposal.title}</h3>
      <p>Rinde {item.recipe_proposal.yield_portions} · {recipeNutritionLabel(item.recipe_proposal.nutrition)}</p>
      <h4>Ingredientes para la cantidad de porciones indicada</h4>
      <ul>{item.recipe_proposal.ingredients.map((ingredient, index) => <li key={index}>{Math.round(ingredient.quantity * (item.portions ?? 1) / item.recipe_proposal!.yield_portions * 10) / 10} {ingredient.unit} {ingredient.name}</li>)}</ul>
      <h4>Pasos</h4><ol>{item.recipe_proposal.steps.map((step, index) => <li key={index}>{step}</li>)}</ol>
    </> : <p>{item.free_text}</p>}
    {item.public_note && <small>{item.public_note}</small>}
  </article>;
}

export function PublishedDatedPlanView({
  plan,
  error = '',
  audience = 'patient',
  query = '',
}: {
  plan: PatientMealPlan | null;
  error?: string;
  audience?: 'patient' | 'pro';
  query?: string;
}) {
  const term = query.trim().toLocaleLowerCase('es-AR');
  const days = plan ? buildPublishedPlanDays(plan).map((day) => ({
    ...day,
    items: term
      ? day.items.filter((item) => `${item.slot} ${item.recipe?.title ?? ''} ${item.free_text ?? ''} ${item.public_note}`.toLocaleLowerCase('es-AR').includes(term))
      : day.items,
  })).filter((day) => !term || day.items.length > 0) : [];
  return <section className="published-dated-plan" aria-label={audience === 'pro' ? 'Copia publicada que ve el paciente' : 'Plan fechado publicado'}>
    <header>
      <span>PLAN FECHADO</span>
      <h2>{audience === 'pro' ? 'Lo que ve el paciente' : 'Plan publicado'}</h2>
      <p>{audience === 'pro'
        ? 'Misma copia publicada que el paciente. Un borrador posterior no la cambia.'
        : 'Sólo la versión que tu nutricionista publicó. Un borrador posterior no cambia lo que ves. Los días sin indicación quedan vacíos.'}</p>
    </header>
    {error && <p className="meal-plan-error" role="alert">{error}</p>}
    {!plan && <NvState title="Todavía no hay un plan fechado publicado" description="Cuando tu nutricionista publique un período con comidas, vas a verlo acá. Los días sin indicación quedan vacíos." />}
    {plan && <div>
      <p>Del {plan.period_start} al {plan.period_end} · revisión {plan.version}</p>
      <AiPlanNutritionSummary nutrition={plan.nutrition} />
      {days.map((day) => <section className="published-plan-day" key={day.isoDate} data-plan-date={day.isoDate}>
        <h3>{day.weekday} {day.isoDate}</h3>
        {day.items.length
          ? day.items.map((item) => <PlanPublishedItem key={item.id} item={item} />)
          : <p className="published-plan-empty-day">Sin indicaciones este día</p>}
      </section>)}
    </div>}
  </section>;
}

export function PublishedDatedPlan({ patientId, query = '' }: { patientId: string; query?: string }) {
  const [plan, setPlan] = useState<PatientMealPlan | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    plansApi.published(patientId, controller.signal)
      .then((result) => { setPlan(result.plan); setError(''); })
      .catch((caught) => {
        if (caught instanceof DOMException && caught.name === 'AbortError') return;
        setPlan(null);
        setError(careErrorMessage(caught));
      });
    return () => controller.abort();
  }, [patientId]);
  return <PublishedDatedPlanView plan={plan} error={error} query={query} />;
}
