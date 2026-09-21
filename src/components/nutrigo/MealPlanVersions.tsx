import { useEffect, useState, type FormEvent } from 'react';
import { careErrorMessage } from '../../api/care';
import { plansApi } from '../../api/plans';
import { recipesApi } from '../../api/recipes';
import { PLAN_SLOTS, mealPlanDraftSchema, type PatientMealPlan, type PlanItemView, type PlanSlot, type ProfessionalMealPlan } from '../../types/plans';
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

export function MealPlanEditor({ patientId }: { patientId: string }) {
  const [plan, setPlan] = useState<ProfessionalMealPlan | null>(null);
  const [recipes, setRecipes] = useState<ProfessionalRecipe[]>([]);
  const [source, setSource] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [draftItems, setDraftItems] = useState<DraftItem[]>([emptyItem(new Date().toISOString().slice(0, 10))]);
  const planId = plan?.id ?? crypto.randomUUID();

  async function reload() {
    try {
      const [plans, catalog] = await Promise.all([plansApi.professional(patientId), recipesApi.list()]);
      setPlan(plans.plan);
      setSource(plans.source);
      setRecipes(catalog.recipes.filter((recipe) => recipe.published));
      if (plans.plan) {
        setPeriodStart(plans.plan.current.period_start);
        setPeriodEnd(plans.plan.current.period_end);
        setDraftItems(itemsFrom(plans.plan));
      }
    } catch (caught) {
      setError(careErrorMessage(caught));
    }
  }

  useEffect(() => { setError(''); setStatus(''); void reload(); }, [patientId]);

  async function run(work: () => Promise<unknown>, success: string) {
    setBusy(true); setError(''); setStatus('');
    try { await work(); setStatus(success); await reload(); }
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

  return <section className="meal-plan-versions" aria-label="Plan fechado versionado">
    <header>
      <div>
        <span>PLAN FECHADO</span>
        <h2>Versiones del plan</h2>
        <p>El borrador se edita aparte. Publicar usa la versión esperada y deja una copia inmutable. El paciente sólo ve la publicada.</p>
      </div>
    </header>
    {source === 'memory' && <p className="meal-plan-demo">Vista demo · el plan fechado se conserva mientras la API siga encendida.</p>}
    {error && <p className="meal-plan-error" role="alert">{error}</p>}
    {status && <p className="meal-plan-status" role="status">{status}</p>}
    {plan?.published && <aside className="meal-plan-published" aria-label="Copia publicada">
      <span>PUBLICADA · v{plan.published.version}</span>
      <p>{plan.published.period_start} a {plan.published.period_end} · no cambia al editar el borrador</p>
      <ul>{plan.published.items.map((item) => <li key={item.id}>{item.for_date} · {item.slot} · {item.recipe_title || item.free_text}{item.portions ? ` · ${item.portions}` : ''}</li>)}</ul>
    </aside>}
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
        <NvButton type="submit" disabled={busy}>Guardar borrador</NvButton>
        {plan && !plan.current.published_at && <NvButton disabled={busy} onClick={() => void run(() => plansApi.publish(plan.id, plan.current.version), 'Plan publicado. El borrador nuevo ya no cambia esta copia.')}>Publicar v{plan.current.version}</NvButton>}
      </div>
    </form>
  </section>;
}

export function PublishedDatedPlanView({ plan, error = '' }: { plan: PatientMealPlan | null; error?: string }) {
  return <section className="published-dated-plan" aria-label="Plan fechado publicado">
    <header>
      <span>PLAN FECHADO</span>
      <h2>Plan publicado</h2>
      <p>Sólo la versión que tu nutricionista publicó. Un borrador posterior no cambia lo que ves.</p>
    </header>
    {error && <p className="meal-plan-error" role="alert">{error}</p>}
    {!plan && <NvState title="Todavía no hay un plan fechado publicado" description="Cuando tu nutricionista publique un período con comidas, vas a verlo acá. Los días sin indicación quedan vacíos." />}
    {plan && <div>
      <p>Del {plan.period_start} al {plan.period_end} · revisión {plan.version}</p>
      <ul>{plan.items.map((item: PlanItemView) => <li key={item.id}>
        <strong>{item.for_date} · {item.slot}</strong>
        <span>{item.recipe_title || item.free_text}</span>
        {item.portions != null && <small>Rinde {item.portions}</small>}
        {item.public_note && <small>{item.public_note}</small>}
      </li>)}</ul>
    </div>}
  </section>;
}

export function PublishedDatedPlan({ patientId }: { patientId: string }) {
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
  return <PublishedDatedPlanView plan={plan} error={error} />;
}
