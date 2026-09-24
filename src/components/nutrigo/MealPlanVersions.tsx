import { useEffect, useState, type FormEvent } from 'react';
import { careErrorMessage } from '../../api/care';
import { plansApi } from '../../api/plans';
import { recipesApi } from '../../api/recipes';
import { aiJobsApi } from '../../api/ai-jobs';
import type { AiJobView } from '../../types/ai-jobs';
import { PLAN_SLOTS, buildPublishedPlanDays, mealPlanDraftSchema, toPublishedPatientPlan, type MealPlanDraftInput, type PatientMealPlan, type PlanItemView, type PlanSlot, type ProfessionalMealPlan } from '../../types/plans';
import type { ProfessionalRecipe } from '../../types/recipes';
import { NvButton, NvState } from './primitives';
import './meal-plan-versions.css';

type DraftItem = { for_date: string; slot: PlanSlot; free_text: string; recipe_id: string; portions: string; public_note: string };

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
    portions: item.portions != null ? String(item.portions) : '',
    public_note: item.public_note,
  }));
}

function proposalFrom(job: AiJobView | null): MealPlanDraftInput | null {
  if (job?.status !== 'succeeded' || job.artifact?.kind !== 'menu_draft' || job.applied_at) return null;
  const parsed = mealPlanDraftSchema.safeParse(job.artifact.payload);
  return parsed.success ? parsed.data : null;
}

export function matchesMenuProposal(plan: ProfessionalMealPlan, proposal: MealPlanDraftInput): boolean {
  if (plan.id !== proposal.id || plan.current.published_at) return false;
  if (plan.current.period_start !== proposal.period_start || plan.current.period_end !== proposal.period_end) return false;
  const key = (item: { for_date: string; slot: string; recipe_id?: string | null; free_text?: string | null; portions?: number | null; public_note?: string | null }) =>
    JSON.stringify([item.for_date, item.slot, item.recipe_id ?? null, item.free_text ?? null, item.portions ?? null, item.public_note ?? '']);
  return JSON.stringify(plan.current.items.map(key).sort()) === JSON.stringify(proposal.items.map(key).sort());
}

export function MenuProposalReview({ proposal, warnings, busy, onApprove, onReject }: {
  proposal: MealPlanDraftInput;
  warnings: string[];
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return <section className="meal-plan-proposal" aria-label="Revisar menú propuesto por IA">
    <span className="meal-plan-proposal-eyebrow">PROPUESTA IA · BORRADOR PRIVADO</span>
    <h3>Revisá el menú antes de publicarlo</h3>
    <p>Del {proposal.period_start} al {proposal.period_end}. El paciente todavía no ve esta propuesta. Aprobarla reemplaza el borrador actual y publica la versión revisada.</p>
    {warnings.map((warning) => <p className="meal-plan-proposal-warning" key={warning}>{warning}</p>)}
    <ul>{proposal.items.map((item, index) => <li key={`${item.for_date}-${item.slot}-${index}`}>
      <strong>{item.for_date} · {item.slot}</strong>
      <span>{item.free_text || 'Indicación sin texto'}</span>
      {item.portions != null && <small>{item.portions} porciones</small>}
      {item.public_note && <small>{item.public_note}</small>}
    </li>)}</ul>
    <div className="meal-plan-actions">
      <NvButton type="button" disabled={busy} onClick={onApprove}>Aprobar y publicar menú</NvButton>
      <NvButton type="button" className="nv-ghost" disabled={busy} onClick={onReject}>Rechazar propuesta</NvButton>
    </div>
  </section>;
}

export function MealPlanEditor({ patientId, onChanged }: { patientId: string; onChanged?: () => void }) {
  const [plan, setPlan] = useState<ProfessionalMealPlan | null>(null);
  const [recipes, setRecipes] = useState<ProfessionalRecipe[]>([]);
  const [source, setSource] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [proposal, setProposal] = useState<AiJobView | null>(null);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [draftItems, setDraftItems] = useState<DraftItem[]>([emptyItem(new Date().toISOString().slice(0, 10))]);
  const planId = plan?.id ?? crypto.randomUUID();

  async function reload() {
    try {
      const [plans, catalog, aiJobs] = await Promise.all([plansApi.professional(patientId), recipesApi.list(), aiJobsApi.list(patientId)]);
      setPlan(plans.plan);
      setSource(plans.source);
      setRecipes(catalog.recipes.filter((recipe) => recipe.published));
      setProposal(aiJobs.jobs.find((job) => job.job_type === 'menu_draft' && proposalFrom(job)) ?? null);
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
    setBusy(true); setError(''); setStatus('');
    try { await work(); setStatus(success); await reload(); onChanged?.(); }
    catch (caught) { setError(careErrorMessage(caught)); }
    finally { setBusy(false); }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = mealPlanDraftSchema.safeParse({
      id: plan?.id ?? planId,
      period_start: periodStart,
      period_end: periodEnd,
      timezone: 'America/Argentina/Buenos_Aires',
      items: draftItems.map((item) => ({
        for_date: item.for_date,
        slot: item.slot,
        recipe_id: item.recipe_id || undefined,
        free_text: item.free_text.trim() || undefined,
        portions: item.portions ? Number(item.portions) : undefined,
        public_note: item.public_note,
      })),
    });
    if (!parsed.success) {
      setError('Revisá las fechas, los momentos y las recetas o textos del plan.');
      return;
    }
    void run(() => plansApi.save(patientId, parsed.data), 'Borrador guardado. El plan publicado no cambió.');
  }

  async function generateProposal() {
    setBusy(true); setError(''); setStatus(''); setProposal(null);
    try {
      const created = await aiJobsApi.enqueue({
        patient_id: patientId,
        job_type: 'menu_draft',
        period_start: periodStart,
        period_end: periodEnd,
        slots: ['Almuerzo', 'Cena'],
      });
      if (!proposalFrom(created.job)) {
        throw new Error(created.job.error_code === 'stale_context'
          ? 'El ingreso cambió. Regenerá la propuesta.'
          : 'La IA no pudo preparar un menú para revisar. No se publicó nada.');
      }
      setProposal(created.job);
      setStatus('Propuesta lista para revisar. El paciente todavía no la ve.');
    } catch (caught) {
      setError(careErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function rejectProposal() {
    if (!proposal) return;
    setBusy(true); setError(''); setStatus('');
    try {
      await aiJobsApi.reject(proposal.id);
      setProposal(null);
      setStatus('Propuesta rechazada. El plan publicado no cambió.');
    } catch (caught) {
      setError(careErrorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function approveProposal() {
    const candidate = proposalFrom(proposal);
    if (!proposal || !candidate) return;
    setBusy(true); setError(''); setStatus('');
    let applied = false;
    try {
      await aiJobsApi.apply(proposal.id);
      applied = true;
      const current = (await plansApi.professional(patientId)).plan;
      if (!current || !matchesMenuProposal(current, candidate)) {
        throw new Error('El borrador cambió. Revisá la versión actual antes de publicar.');
      }
      await plansApi.publish(current.id, current.current.version);
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
      setBusy(false);
    }
  }

  const proposedPlan = proposalFrom(proposal);

  return <section className="meal-plan-versions" aria-label="Plan fechado versionado">
    <header>
      <div>
        <span>PLAN FECHADO</span>
        <h2>Versiones del plan</h2>
        <p>El paciente sólo ve la versión publicada. Publicar revalida alergias, unidades y la versión esperada. La IA propone un borrador; no publica sola.</p>
      </div>
    </header>
    {source === 'memory' && <p className="meal-plan-demo">Vista demo · el plan fechado se conserva mientras la API siga encendida.</p>}
    {error && <p className="meal-plan-error" role="alert">{error}</p>}
    {status && <p className="meal-plan-status" role="status">{status}</p>}
    {plan?.published && <PublishedDatedPlanView plan={toPublishedPatientPlan(plan)} audience="pro" />}
    {proposal && !proposedPlan && <p className="meal-plan-error" role="alert">La propuesta no tiene un menú válido. Regenerala antes de aprobar.</p>}
    {proposedPlan && <MenuProposalReview proposal={proposedPlan} warnings={proposal?.warnings ?? []} busy={busy} onApprove={() => void approveProposal()} onReject={() => void rejectProposal()} />}
    <form className="meal-plan-form" onSubmit={submit}>
      <div className="meal-plan-form-row">
        <label>Desde<input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} /></label>
        <label>Hasta<input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} /></label>
      </div>
      {draftItems.map((item, index) => <div className="meal-plan-item-row" key={index}>
        <input aria-label={`Fecha ${index + 1}`} type="date" value={item.for_date} onChange={(event) => setDraftItems(draftItems.map((current, currentIndex) => currentIndex === index ? { ...current, for_date: event.target.value } : current))} />
        <select aria-label={`Momento ${index + 1}`} value={item.slot} onChange={(event) => setDraftItems(draftItems.map((current, currentIndex) => currentIndex === index ? { ...current, slot: event.target.value as PlanSlot } : current))}>
          {PLAN_SLOTS.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
        </select>
        <select aria-label={`Receta ${index + 1}`} value={item.recipe_id} onChange={(event) => setDraftItems(draftItems.map((current, currentIndex) => currentIndex === index ? { ...current, recipe_id: event.target.value, free_text: event.target.value ? '' : current.free_text } : current))}>
          <option value="">Texto libre</option>
          {recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.title} · v{recipe.published?.version}</option>)}
        </select>
        <input aria-label={`Texto ${index + 1}`} placeholder="Indicación" value={item.free_text} disabled={Boolean(item.recipe_id)} onChange={(event) => setDraftItems(draftItems.map((current, currentIndex) => currentIndex === index ? { ...current, free_text: event.target.value } : current))} />
        <input aria-label={`Porciones ${index + 1}`} type="number" min={0.5} step="0.5" placeholder="Rinde" value={item.portions} onChange={(event) => setDraftItems(draftItems.map((current, currentIndex) => currentIndex === index ? { ...current, portions: event.target.value } : current))} />
      </div>)}
      <div className="meal-plan-actions">
        <button type="button" className="meal-plan-add" onClick={() => setDraftItems([...draftItems, emptyItem(periodStart || draftItems[0]?.for_date || '')])}>Agregar indicación</button>
        <NvButton type="button" className="nv-ghost" disabled={busy || !periodStart || !periodEnd || Boolean(proposal)} onClick={() => void generateProposal()}>Generar propuesta de menú</NvButton>
        <NvButton type="submit" disabled={busy}>Guardar borrador</NvButton>
        {plan && !plan.current.published_at && <NvButton disabled={busy} onClick={() => void run(() => plansApi.publish(plan.id, plan.current.version), 'Plan publicado. El borrador nuevo ya no cambia esta copia.')}>Publicar v{plan.current.version}</NvButton>}
      </div>
    </form>
  </section>;
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
