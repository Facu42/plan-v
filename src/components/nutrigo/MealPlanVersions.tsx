import { PlanRecipeProposalEditor } from './PlanRecipeProposalEditor';
import { componentInput, componentTitle, type PlanComponentView } from '../../types/plan-components';
import { PlanFoodPicker } from './PlanFoodPicker';
import { PlanComponentRows } from './PlanComponentRows';
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
import { AiPlanNutritionSummary } from './AiPlanNutritionSummary';
import { PlanRecipePicker, PlanRecipePreview } from './PlanRecipePicker';
import { publishedRecipeDetail, resolvePlanRecipeSelection } from '../../types/plan-recipe-selection';
import { editorPlanDates, copyPlanDay, type DayAnalysisLine } from '../../types/plan-day-analysis';
import { planWeekdayLabel } from '../../types/plans';
import { PlanDayAnalysis } from './PlanDayAnalysis';
import { PlanCopyDayDialog } from './PlanCopyDayDialog';
import { PlanPrintDialog } from './PlanPrintDialog';

type DraftItem = { components?: PlanComponentView[]; for_date: string; slot: PlanSlot; free_text: string; recipe_id: string; recipe_version?: number; portions: string; public_note: string; recipe_proposal?: ProposedRecipe; recipePreview?: PlanRecipeDetail };

function emptyItem(date: string): DraftItem {
  return { for_date: date, slot: 'Almuerzo', free_text: '', recipe_id: '', portions: '1', public_note: '' };
}

function itemsFrom(plan: ProfessionalMealPlan | null): DraftItem[] {
  const source = plan?.current.items ?? [];
  if (!source.length) return [emptyItem(plan?.current.period_start || new Date().toISOString().slice(0, 10))];
  return source.map((item) => ({
    for_date: item.for_date,
    slot: item.slot,
    free_text: item.components ? '' : item.free_text ?? '',
    recipe_id: item.recipe_id ?? '',
    recipe_version: item.recipe_version ?? undefined,
    ...(item.recipe ? { recipePreview: item.recipe } : {}),
    portions: item.components ? '' : item.portions != null ? String(item.portions) : '',
    ...(item.components ? { components: item.components } : {}),
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
  const key = (item: { for_date: string; slot: string; recipe_id?: string | null; recipe_version?: number | null; free_text?: string | null; portions?: number | null; public_note?: string | null; recipe_proposal?: ProposedRecipe; components?: PlanComponentView[] }) =>
    JSON.stringify([item.for_date, item.slot, item.recipe_id ?? null, item.recipe_version ?? null, item.components ? null : item.free_text ?? null, item.components ? null : item.portions ?? null, item.public_note ?? '', item.recipe_proposal ?? null, item.components?.map(componentInput) ?? null]);
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

export function MealPlanEditor({ patientId, patientName = '', professionalName, onChanged }: { patientId: string; patientName?: string; professionalName?: string; onChanged?: () => void }) {
  const [plan, setPlan] = useState<ProfessionalMealPlan | null>(null);
  const [printCopy, setPrintCopy] = useState<{ plan: ProfessionalMealPlan; patientName: string; professionalName?: string; currentAllowed: boolean; demo: boolean } | null>(null);
  const printRequest = useRef(0);
  useEffect(() => { setPrintCopy(null); return () => { printRequest.current += 1; }; }, [patientId]);
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
  const [activeDate, setActiveDate] = useState('');
  const [componentTarget, setComponentTarget] = useState<{ index: number; slot: PlanSlot } | null>(null);
  const [componentTab, setComponentTab] = useState<'food' | 'recipe'>('food');
  const [copySource, setCopySource] = useState<string | null>(null);
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
      items: draftItems.map(item => ({ ...(item.components ? { components: item.components.map(componentInput) } : {}), for_date: item.for_date, slot: item.slot, recipe_id: item.recipe_id || undefined,
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
        ...(item.components ? { components: item.components.map(componentInput) } : {}),
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
  const editorDates = editorPlanDates(periodStart, periodEnd, draftItems.map(item => item.for_date));
  const selectedDate = editorDates.includes(activeDate) ? activeDate : editorDates[0] ?? '';
  const periodDates = editorPlanDates(periodStart, periodEnd, []);
  const periodIndex = periodDates.indexOf(selectedDate);
  const weekDates = periodIndex < 0 ? [] : periodDates.slice(Math.floor(periodIndex / 7) * 7, Math.floor(periodIndex / 7) * 7 + 7);
  const dayItems = draftItems.filter(item => item.for_date === selectedDate || !editorDates.includes(item.for_date));
  const availableSlot = PLAN_SLOTS.find(slot => !dayItems.some(item => item.slot === slot));
  const weekOffset = Math.max(0, Math.floor(editorDates.indexOf(selectedDate) / 7) * 7);
  function analysisLines(items: DraftItem[]): DayAnalysisLine[] { return items.flatMap<DayAnalysisLine>(item => item.components ? item.components.map(component => ({ portions: '', component })) : [{ portions: item.portions, recipe: resolvePlanRecipeSelection(item, recipes, plan?.current.items ?? []), proposal: item.recipe_proposal }]); }
  function addComponent(component: PlanComponentView) {
    if (!componentTarget) return;
    const { index, slot } = componentTarget;
    setDraftItems(current => {
      const item = current[index];
      if (!item) return [...current, { ...emptyItem(selectedDate), slot, portions: '', components: [component] }];
      const previous: PlanComponentView[] = item.components ?? (item.recipe_id ? [{ kind: 'recipe', id: crypto.randomUUID(), recipe_id: item.recipe_id, recipe_version: item.recipe_version!, portions: Number(item.portions), public_note: '', recipe_snapshot: resolvePlanRecipeSelection(item, recipes, plan?.current.items ?? []) ?? undefined }] : item.free_text.trim() ? [{ kind: 'text', id: crypto.randomUUID(), free_text: item.free_text, public_note: '', ...(item.recipe_proposal ? { recipe_proposal: item.recipe_proposal, portions: Number(item.portions) } : {}) }] : []);
      return current.map((row, position) => position === index ? { ...row, components: [...previous, component], free_text: '', recipe_id: '', recipe_version: undefined, recipePreview: undefined, recipe_proposal: undefined, portions: '' } : row);
    });
    setComponentTarget(null);
  }
  const dirty = !plan || !matchesMenuForm(plan, formInput());
  useUnsavedChanges(plan ? dirty : Boolean(periodStart || periodEnd || dietaryPreferences || draftItems.some((item) => item.free_text.trim() || item.recipe_id || item.public_note || item.recipe_proposal || item.components?.length)), busy);
  function publishVisible() {
    if (!plan || dirty) { setError('Guardá y revisá los cambios antes de publicar.'); return; }
    void run(() => plansApi.publish(plan.id, plan.current.version, plan.current), 'Plan publicado. La paciente ve la versión revisada.');
  }

  async function openPrint() {
    if (!plan || lock.current) return;
    const request = ++printRequest.current;
    lock.current = true; setBusy(true); setError('');
    try {
      const saved = await plansApi.professional(patientId);
      if (request !== printRequest.current) return;
      if (!saved.plan || saved.plan.id !== plan.id) throw new Error('El plan guardado cambió. Volvé a abrirlo antes de imprimir.');
      const currentAllowed = !dirty && saved.plan.current.revision === plan.current.revision && saved.plan.current.version === plan.current.version;
      if (!currentAllowed && !saved.plan.published) throw new Error('Guardá los cambios o recuperá la versión guardada antes de imprimir.');
      setPrintCopy({ plan: structuredClone(saved.plan), patientName, professionalName, currentAllowed, demo: saved.source === 'memory' });
    } catch (caught) { if (request === printRequest.current) setError(careErrorMessage(caught)); }
    finally { if (request === printRequest.current) { lock.current = false; setBusy(false); } }
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
    <div className="meal-plan-actions"><NvButton type="button" className="nv-ghost" disabled={busy || !plan || (dirty && !plan.published)} onClick={() => void openPrint()}>Imprimir / guardar PDF</NvButton>{(!plan || dirty) && <small>Guardá el borrador para imprimirlo. Los cambios sin guardar no forman parte del documento.</small>}</div>
    {printCopy && <PlanPrintDialog plan={printCopy.plan} patientName={printCopy.patientName} professionalName={printCopy.professionalName} currentAllowed={printCopy.currentAllowed} demo={printCopy.demo} onClose={() => setPrintCopy(null)} />}
    {error && <p className="meal-plan-error" role="alert">{error}</p>}
    {status && <p className="meal-plan-status" role="status">{status}</p>}
    {proposal && !proposedPlan && <p className="meal-plan-error" role="alert">La propuesta no tiene un menú válido. Regenerala antes de aprobar.</p>}
    {proposedPlan && <MenuProposalReview key={proposal!.id} proposal={proposedPlan} warnings={proposal?.warnings ?? []} busy={busy} recipes={recipes} onEdit={() => void editProposal()} onApprove={() => void approveProposal()} onReject={() => void rejectProposal()} />}

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
      <details className="plan-ai-preferences"><summary>Preferencias para generar un menú con IA</summary><fieldset><legend>Momentos para la propuesta</legend>{PLAN_SLOTS.map((slot) => <label key={slot}><input type="checkbox" checked={selectedSlots.includes(slot)} onChange={(event) => setSelectedSlots(event.target.checked ? [...selectedSlots, slot] : selectedSlots.filter((entry) => entry !== slot))} />{slot}</label>)}</fieldset>
      <label>Preferencias alimentarias<textarea aria-describedby="menu-preferences-help" maxLength={809} placeholder="Una preferencia por línea, hasta 10 de 80 caracteres. Ejemplo: platos con legumbres." value={dietaryPreferences} onChange={(event) => setDietaryPreferences(event.target.value)} /></label>
      <small id="menu-preferences-help">Hasta 10 preferencias de 80 caracteres cada una. Separalas con un salto de línea.</small></details>
      <nav className="plan-editor-days" aria-label="Días del plan">
        <button type="button" disabled={weekOffset === 0} onClick={() => setActiveDate(editorDates[Math.max(0, weekOffset - 7)])}>Semana anterior</button>
        {editorDates.slice(weekOffset, weekOffset + 7).map(date => <button type="button" key={date} aria-pressed={selectedDate === date} onClick={() => setActiveDate(date)}><strong>{planWeekdayLabel(date)}</strong><span>{date.slice(8)}/{date.slice(5, 7)}</span><small>{draftItems.filter(item => item.for_date === date).length} indicaciones</small></button>)}
        <button type="button" disabled={weekOffset + 7 >= editorDates.length} onClick={() => setActiveDate(editorDates[weekOffset + 7])}>Semana siguiente</button>
      </nav>
<button type="button" className="meal-plan-add" disabled={busy || !periodDates.includes(selectedDate) || !draftItems.some(item => item.for_date === selectedDate) || periodDates.length < 2} onClick={() => setCopySource(selectedDate)}>Copiar día seleccionado</button>
      {editorDates.some(date => date < periodStart || date > periodEnd) && <p role="alert">Hay indicaciones fuera del período. Sus días siguen disponibles arriba; corregí las fechas antes de guardar.</p>}
      <div className="plan-editor-day-layout"><div className="plan-editor-meals">
      {PLAN_SLOTS.map(slot => <section className="plan-editor-meal" key={slot} aria-label={`${slot} del día seleccionado`}><header><h3>{slot}</h3><button type="button" disabled={!selectedDate || draftItems.length >= 42 || dayItems.some(item => item.slot === slot)} onClick={() => setDraftItems([...draftItems, { ...emptyItem(selectedDate), slot }])}>Agregar a {slot.toLocaleLowerCase('es-AR')}</button></header>
      {!dayItems.some(item => item.slot === slot) && <p>Sin indicaciones para este momento.</p>}
      <button type="button" className="meal-plan-add" aria-label={`Agregar alimento o receta a ${slot.toLocaleLowerCase('es-AR')}`} disabled={!selectedDate || ((dayItems.find(item => item.slot === slot)?.components?.length ?? 0) >= 12) || (!dayItems.some(item => item.slot === slot) && draftItems.length >= 42)} onClick={() => { setComponentTab('food'); setComponentTarget({ index: draftItems.findIndex(item => item.for_date === selectedDate && item.slot === slot), slot }); }}>Agregar alimento o receta</button>
      {draftItems.map((item, index) => item.slot === slot && (item.for_date === selectedDate || !editorDates.includes(item.for_date)) ? <div className="meal-plan-item-row" key={index}>
        <label>Fecha<input aria-label={`Fecha ${index + 1}`} type="date" value={item.for_date} onChange={(event) => setDraftItems(draftItems.map((current, currentIndex) => currentIndex === index ? { ...current, for_date: event.target.value } : current))} /></label>
        <label>Momento<select aria-label={`Momento ${index + 1}`} value={item.slot} onChange={(event) => setDraftItems(draftItems.map((current, currentIndex) => currentIndex === index ? { ...current, slot: event.target.value as PlanSlot } : current))}>
          {PLAN_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
        </select></label>
        {item.components ? <PlanComponentRows components={item.components} onChange={components => setDraftItems(current => current.map((row, position) => position === index ? { ...row, components: components.length ? components : undefined, portions: components.length ? '' : '1' } : row))} /> : <>
        <div className="meal-plan-recipe-choice"><button type="button" aria-label={`Elegir receta para indicación ${index + 1}`} onClick={() => setPickerIndex(index)}>{item.recipe_id ? `${resolvePlanRecipeSelection(item, recipes, plan?.current.items ?? [])?.title ?? 'Receta seleccionada'} · v${item.recipe_version} · Cambiar` : 'Elegir receta publicada'}</button>{item.recipe_id && <button type="button" onClick={() => setDraftItems(draftItems.map((current, currentIndex) => currentIndex === index ? { ...current, recipe_id: '', recipe_version: undefined, recipePreview: undefined, recipe_proposal: undefined } : current))}>Usar texto libre</button>}</div>
        <label>Indicación<input aria-label={`Texto ${index + 1}`} placeholder="Indicación" value={item.free_text} disabled={Boolean(item.recipe_id)} onChange={(event) => setDraftItems(draftItems.map((current, currentIndex) => currentIndex === index ? { ...current, free_text: event.target.value, ...(current.recipe_proposal ? { recipe_proposal: { ...current.recipe_proposal, title: event.target.value } } : {}) } : current))} /></label>
        <label>Porciones<input aria-label={`Porciones ${index + 1}`} type="number" min={0.0001} max={50} step="0.0001" placeholder="Rinde" value={item.portions} onChange={(event) => setDraftItems(draftItems.map((current, currentIndex) => currentIndex === index ? { ...current, portions: event.target.value } : current))} /></label>
        {item.recipe_id && <details className="meal-plan-recipe-inline"><summary>Revisar receta v{item.recipe_version} y nutrientes para esta indicación</summary>{(() => { const detail = resolvePlanRecipeSelection(item, recipes, plan?.current.items ?? []); return detail ? <PlanRecipePreview recipe={detail} portions={item.portions.trim() ? Number(item.portions) : NaN} /> : <p role="alert">No pudimos cargar el detalle de esta versión. No se reemplazará por otra receta al guardar.</p>; })()}</details>}
        {item.recipe_proposal && <PlanRecipeProposalEditor proposal={item.recipe_proposal} index={index} onChange={(recipe_proposal) => setDraftItems(draftItems.map((current, currentIndex) => currentIndex === index ? { ...current, recipe_proposal } : current))} />}
        </>}<label>Nota para la paciente<input maxLength={200} aria-label={`Nota ${index + 1}`} value={item.public_note} onChange={event => setDraftItems(draftItems.map((current, currentIndex) => currentIndex === index ? { ...current, public_note: event.target.value } : current))} /></label>
        <button type="button" disabled={busy} onClick={() => setDraftItems(draftItems.filter((_, currentIndex) => currentIndex !== index))}>Quitar indicación {index + 1}</button>
      </div> : null)}
      </section>)}
      </div><PlanDayAnalysis date={selectedDate} lines={analysisLines(draftItems.filter(item => item.for_date === selectedDate))} target={plan?.current.nutrition_target} week={weekDates.map(date => ({ date, lines: analysisLines(draftItems.filter(item => item.for_date === date)) }))} /></div>
      </fieldset>{plan && !plan.current.published_at && dirty && <p role="status">Tenés cambios sin guardar. Guardalos y revisalos antes de publicar.</p>}
      {error && <button type="button" disabled={busy} onClick={() => void reload()}>Recuperar la versión guardada y reemplazar este formulario</button>}
      <div className="meal-plan-actions">
        <button type="button" className="meal-plan-add" onClick={() => setDraftItems([...draftItems, { ...emptyItem(selectedDate), slot: availableSlot ?? 'Almuerzo' }])} disabled={busy || draftItems.length >= 42 || !selectedDate || !availableSlot}>Agregar indicación</button>
        <NvButton type="button" className="nv-ghost" disabled={busy || !periodStart || !periodEnd || !selectedSlots.length || Boolean(proposal)} onClick={() => void generateProposal()}>Generar propuesta de menú</NvButton>
        <NvButton type="submit" disabled={busy}>Guardar borrador</NvButton>
        {plan && !plan.current.published_at && <NvButton type="button" disabled={busy || dirty} onClick={publishVisible}>Publicar v{plan.current.version}</NvButton>}
      </div>
    </form>
    {plan?.current.nutrition && <details><summary>Ver análisis de la versión guardada</summary><AiPlanNutritionSummary nutrition={plan.current.nutrition} /></details>}
    {plan?.published && <details className="meal-plan-published-copy"><summary>Ver copia publicada · v{plan.published.version}</summary><PublishedDatedPlanView plan={toPublishedPatientPlan(plan)} audience="pro" /></details>}
    {componentTarget && (componentTab === 'food' ? <PlanFoodPicker onClose={() => setComponentTarget(null)} onRecipe={() => setComponentTab('recipe')} onChoose={addComponent} /> : <PlanRecipePicker onFood={() => setComponentTab('food')} recipes={recipes} loading={catalogLoading} error={catalogError} onRetry={() => void reloadCatalog()} initialPortions="1" onClose={() => setComponentTarget(null)} onChoose={(recipe, portions) => addComponent({ kind: 'recipe', id: crypto.randomUUID(), recipe_id: recipe.id, recipe_version: recipe.published!.version, portions, public_note: '', recipe_snapshot: publishedRecipeDetail(recipe) ?? undefined })} />)}
    {copySource && <PlanCopyDayDialog source={copySource} dates={periodDates} occupied={draftItems.map(item => item.for_date)} itemCount={draftItems.length} descriptions={draftItems.filter(item => item.for_date === copySource).map(item => item.components ? `${item.slot}: ${item.components.map(component => `${componentTitle(component)} · ${component.kind === 'food' ? `${component.quantity} ${component.measure ?? 'g'}` : component.kind === 'recipe' ? `${component.portions} porciones · v${component.recipe_version}` : 'Indicación'}${component.public_note ? ` · Nota: ${component.public_note}` : ''}`).join(' / ')}${item.public_note ? ` \u00b7 Nota de la comida: ${item.public_note}` : ''}` : `${item.slot}: ${resolvePlanRecipeSelection(item, recipes, plan?.current.items ?? [])?.title ?? item.free_text ?? 'Indicación'}${item.recipe_id ? ` · v${item.recipe_version}` : ''} · ${item.portions || 'sin cantidad'} porciones${item.public_note ? ` · Nota: ${item.public_note}` : ''}`)} onClose={() => setCopySource(null)} onCopy={destinations => { try { setDraftItems(copyPlanDay(draftItems, copySource, destinations, periodDates)); setStatus('Día copiado al borrador. Revisá los destinos y guardá los cambios.'); setError(''); setCopySource(null); } catch (caught) { setError(careErrorMessage(caught)); } }} />}
    {pickerIndex !== null && draftItems[pickerIndex] && <PlanRecipePicker recipes={recipes} loading={catalogLoading} error={catalogError} onRetry={() => void reloadCatalog()} initialPortions={draftItems[pickerIndex].portions} onClose={() => setPickerIndex(null)} onChoose={(recipe, portions) => { const version = recipe.published; if (!version) return; setDraftItems(current => current.map((item, index) => index === pickerIndex ? { ...item, recipe_id: recipe.id, recipe_version: version.version, recipePreview: publishedRecipeDetail(recipe) ?? undefined, portions: String(portions), free_text: '', recipe_proposal: undefined } : item)); setPickerIndex(null); }} />}
  </section>;
}


export function PlanPublishedItem({ item }: { item: PlanItemView }) {
  const recipe = item.recipe;
  if (item.components) return <article className="published-plan-item"><strong>{item.slot}</strong>{item.components.map(component => <section key={component.id}><h3>{componentTitle(component)}</h3><p>{component.kind === 'food' ? `${component.quantity} ${component.measure ?? 'g'} · Fuente: ${component.food_snapshot?.source} · r${component.food_revision}` : component.kind === 'recipe' ? `${component.portions} porciones · v${component.recipe_version}` : component.free_text}</p>{component.kind === 'text' && component.recipe_proposal && <><p>{component.portions} porciones · {recipeNutritionLabel(component.recipe_proposal.nutrition)}</p><ul>{component.recipe_proposal.ingredients.map((line, position) => <li key={position}>{line.quantity * (component.portions ?? 1) / component.recipe_proposal!.yield_portions} {line.unit} {line.name}</li>)}</ul><ol>{component.recipe_proposal.steps.map((step, position) => <li key={position}>{step}</li>)}</ol></>}{component.recipe_snapshot && <><ul>{component.recipe_snapshot.ingredients.map(line => <li key={line.id}>{line.name}: {line.quantity * (component.kind === 'recipe' ? component.portions : 1) / component.recipe_snapshot!.yield_portions} {line.unit}</li>)}</ul><ol>{component.recipe_snapshot.steps.map((step, position) => <li key={position}>{step}</li>)}</ol></>}{component.public_note && <p>{component.public_note}</p>}</section>)}{item.public_note && <p>{item.public_note}</p>}</article>;
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
      ? day.items.filter((item) => `${item.slot} ${item.components?.map(component => `${componentTitle(component)} ${component.public_note}`).join(' ') ?? ''} ${item.recipe?.title ?? ''} ${item.free_text ?? ''} ${item.public_note}`.toLocaleLowerCase('es-AR').includes(term))
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
