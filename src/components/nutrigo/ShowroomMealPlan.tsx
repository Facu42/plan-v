import { useEffect, useMemo, useRef, useState } from 'react';
import { plansApi } from '../../api/plans';
import { recipesApi } from '../../api/recipes';
import { aiJobsApi } from '../../api/ai-jobs';
import { careErrorMessage } from '../../api/care';
import type { Patient } from '../../types';
import { mondayOf, PLAN_DAYS, slotsFromWeekPlan, weekPlanFromSlots, type MealPlanView, type PlanSlot } from '../../types/plans';
import type { RecipeView } from '../../types/recipes';
import type { AiJobView } from '../../types/ai-jobs';
import { hasBlockingEvaluation } from '../../types/ai-eval';
import { availableSlotsForDay, MENU_SLOTS } from '../crm/menu-editor-utils';
import { Icon } from '../shared/Icon';
import { NvBadge, NvButton } from './primitives';
import './showroom-meal-plan.css';

export { PLAN_DAYS };
type PlanDay = { day: string; meals: Patient['weekPlan'][number]['meals'] };

function rowKey(day: string, slot: string): string {
  return `${day}|${slot}`;
}

function draftMap(slots: PlanSlot[]): Record<string, string> {
  return Object.fromEntries(slots.map((item) => [rowKey(item.day, item.slot), item.title]));
}

export function buildPlanDays(weekPlan: Patient['weekPlan']): PlanDay[] {
  return PLAN_DAYS.map((day) => {
    const meals = weekPlan
      .filter((entry) => entry.day === day)
      .flatMap((entry) => entry.meals)
      .slice()
      .sort((a, b) => MENU_SLOTS.indexOf(a.slot as typeof MENU_SLOTS[number]) - MENU_SLOTS.indexOf(b.slot as typeof MENU_SLOTS[number]));
    return { day, meals };
  });
}

export function ShowroomMealPlan({ patient, patients = [], query, onSelect, onChanged = () => undefined }: {
  patient: Patient;
  patients?: Patient[];
  query: string;
  onSelect: (id: string) => void;
  onChanged?: (patient: Patient) => void;
}) {
  const [slots, setSlots] = useState<PlanSlot[]>(() => slotsFromWeekPlan(patient.weekPlan));
  const [drafts, setDrafts] = useState<Record<string, string>>(() => draftMap(slotsFromWeekPlan(patient.weekPlan)));
  const [open, setOpen] = useState<MealPlanView | null>(null);
  const [published, setPublished] = useState<MealPlanView | null>(null);
  const [recipes, setRecipes] = useState<RecipeView[]>([]);
  const [periodStart, setPeriodStart] = useState(mondayOf());
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [addSlot, setAddSlot] = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [addRecipe, setAddRecipe] = useState('');
  const [busy, setBusy] = useState<false | 'publish' | 'propose' | 'apply' | 'edit'>(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [proposal, setProposal] = useState<AiJobView | null>(null);
  const lock = useRef(false);
  const weekPlan = useMemo(() => weekPlanFromSlots(slots), [slots]);
  const days = useMemo(() => buildPlanDays(weekPlan.length ? weekPlan : PLAN_DAYS.map((day) => ({ day, meals: [] }))), [weekPlan]);
  const term = query.trim().toLocaleLowerCase('es-AR');
  const publishedRecipes = recipes.filter((recipe) => recipe.published_at);
  const expectedVersion = open?.version ?? published?.version ?? 0;
  const planId = open?.id;

  useEffect(() => {
    const controller = new AbortController();
    setError(null); setStatus(''); setAddingDay(null); setRemovingKey(null);
    Promise.all([
      plansApi.board(patient.id, true, controller.signal),
      recipesApi.catalog(controller.signal).catch(() => ({ recipes: [] as RecipeView[] })),
    ]).then(([board, catalog]) => {
      setRecipes(catalog.recipes);
      setOpen(board.open);
      setPublished(board.published);
      const next = board.open?.slots ?? board.published?.slots ?? slotsFromWeekPlan(patient.weekPlan);
      setSlots(next);
      setDrafts(draftMap(next));
      setPeriodStart(board.open?.period_start ?? board.published?.period_start ?? mondayOf());
    }).catch((err) => {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(careErrorMessage(err));
    });
    return () => controller.abort();
  }, [patient.id]);

  const persist = async (nextSlots: PlanSlot[], key?: string) => {
    const id = planId ?? crypto.randomUUID();
    if (key) setSavingKey(key);
    setError(null);
    try {
      const result = await plansApi.save(patient.id, {
        id,
        period_start: mondayOf(periodStart),
        slots: nextSlots,
        expected_version: expectedVersion,
      });
      setOpen(result.plan);
      setSlots(result.plan.slots);
      setDrafts(draftMap(result.plan.slots));
      setPeriodStart(result.plan.period_start);
      if (key) {
        setSavedKey(key);
        window.setTimeout(() => setSavedKey((current) => current === key ? null : current), 2000);
      }
      setStatus('Copia inédita guardada. Todavía no la ve la paciente.');
      return result.plan;
    } catch (err) {
      setError(careErrorMessage(err));
      return null;
    } finally {
      setSavingKey(null);
    }
  };

  const currentSlots = () => slots.map((item) => {
    const title = (drafts[rowKey(item.day, item.slot)] ?? item.title).trim();
    return { ...item, title: title || item.title };
  });

  const save = async (day: string, slot: string) => {
    const key = rowKey(day, slot);
    const title = (drafts[key] ?? '').trim();
    if (!title) { setError('El título no puede quedar vacío.'); return; }
    await persist(currentSlots().map((item) => item.day === day && item.slot === slot ? { ...item, title } : item), key);
  };

  const remove = async (day: string, slot: string) => {
    setBusy('edit');
    const next = currentSlots().filter((item) => !(item.day === day && item.slot === slot));
    const saved = await persist(next);
    if (saved) setRemovingKey(null);
    setBusy(false);
  };

  const add = async (day: string) => {
    const recipe = publishedRecipes.find((item) => item.id === addRecipe);
    const title = (recipe?.title ?? addTitle).trim();
    if (!addSlot || title.length < 2) { setError('Elegí el momento y escribí el título o una receta publicada.'); return; }
    setBusy('edit');
    const next: PlanSlot[] = [...currentSlots(), {
      day: day as PlanSlot['day'],
      slot: addSlot as PlanSlot['slot'],
      title,
      recipe_id: recipe?.id ?? null,
      servings: recipe?.servings ?? null,
    }];
    const saved = await persist(next);
    if (saved) { setAddingDay(null); setAddSlot(''); setAddTitle(''); setAddRecipe(''); }
    setBusy(false);
  };

  const publish = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy('publish'); setError(null); setStatus('');
    try {
      const working = currentSlots();
      const saved = await persist(working) ?? open;
      if (!saved) return;
      const result = await plansApi.publish(patient.id, saved.id, saved.version);
      setOpen(null);
      setPublished(result.plan);
      setSlots(result.plan.slots);
      setDrafts(draftMap(result.plan.slots));
      setStatus(`Versión ${result.plan.version} publicada. La paciente ve esta copia.`);
      onChanged({ ...patient, weekPlan: weekPlanFromSlots(result.plan.slots) });
    } catch (err) {
      setError(careErrorMessage(err));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  return <section className="npm-plan" aria-label={`Plan semanal de ${patient.name}`}>
    <header className="npm-context">
      <div><span className={`nv-avatar person-${patient.tone}`}>{patient.initials}</span><div><strong>Plan semanal de {patient.name}</strong><small>{open ? `Copia inédita v${open.version}. La paciente ve ${published ? `la v${published.version} publicada` : 'la plantilla anterior'}.` : published ? `Versión ${published.version} publicada. Los cambios nuevos crean otra copia.` : 'Todavía no hay una versión publicada.'}</small></div></div>
      {patients.length > 0 && <label>Paciente
        <select aria-label="Paciente del plan" value={patient.id} onChange={(event) => onSelect(event.target.value)}>
          {patients.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
        </select>
      </label>}
    </header>
    <div className="npm-plan-note"><span className="nv-icon-tile"><Icon name="list" size={17} /></span><p><strong>Indicaciones semanales</strong><small>Se guardan títulos y recetas publicadas. Publicar deja una copia inmutable; editar después no cambia lo vigente.</small></p><NvBadge>7 días</NvBadge></div>
    <div className="npm-toolbar">
      <label>Semana desde el lunes
        <input type="date" aria-label="Lunes de la semana del plan" value={periodStart} onChange={(event) => setPeriodStart(mondayOf(event.target.value || mondayOf()))} />
      </label>
      <NvButton type="button" disabled={Boolean(busy)} onClick={() => void publish()}>{busy === 'publish' ? 'Publicando…' : 'Publicar para la paciente'}</NvButton>
      <NvButton type="button" disabled={Boolean(busy)} onClick={() => {
        if (lock.current) return;
        lock.current = true; setBusy('propose'); setError(null); setStatus('');
        void aiJobsApi.create(patient.id, { id: crypto.randomUUID(), job_type: 'menu' })
          .then((result) => {
            setProposal(result.job);
            setStatus(result.job.status === 'succeeded' ? 'Propuesta lista. Revisala y guardala como copia inédita.' : 'La propuesta no se pudo completar. La paciente no la ve.');
          })
          .catch((err) => setError(careErrorMessage(err)))
          .finally(() => { lock.current = false; setBusy(false); });
      }}>{busy === 'propose' ? 'Generando…' : 'Generar propuesta'}</NvButton>
    </div>
    {error && <p className="npm-error" role="alert">{error}</p>}
    {status && <p className="npm-status" role="status">{status}</p>}
    {proposal?.artifact?.kind === 'menu' && <article className="npm-proposal" aria-label="Propuesta de menú">
      <span className="nv-badge nv-gold">PROPUESTA · {proposal.prompt_version}</span>
      <ul>{proposal.artifact.payload.slots.map((item) => <li key={`${item.day}-${item.slot}`}>{item.day} · {item.slot}: {item.title}</li>)}</ul>
      {proposal.artifact.payload.warnings.map((warning) => <p key={warning}><small>{warning}</small></p>)}
      {(proposal.evaluation?.findings ?? []).length > 0 && <ul className="npm-eval">{proposal.evaluation?.findings.map((item) => <li key={`${item.code}-${item.path ?? ''}`} data-severity={item.severity}>{item.message}</li>)}</ul>}
      <NvButton type="button" disabled={Boolean(busy) || hasBlockingEvaluation(proposal.evaluation)} onClick={() => {
        if (lock.current) return;
        lock.current = true; setBusy('apply'); setError(null);
        void aiJobsApi.apply(patient.id, proposal.id).then(async (result) => {
          if (result.kind !== 'menu') return;
          setOpen(result.plan);
          setSlots(result.plan.slots);
          setDrafts(draftMap(result.plan.slots));
          setPeriodStart(result.plan.period_start);
          setStatus('Copia inédita armada con la propuesta. Todavía no la ve la paciente.');
        }).catch((err) => setError(careErrorMessage(err))).finally(() => { lock.current = false; setBusy(false); });
      }}>{busy === 'apply' ? 'Guardando…' : 'Guardar como copia inédita'}</NvButton>
    </article>}
    <section className="npm-table-card" aria-label="Editor del plan semanal">
      <div className="npm-table" role="table" aria-label="Plan semanal editable">
        <div className="npm-table-inner">
          <div className="npm-table-head" role="row"><span role="columnheader">Día</span><span role="columnheader">Comidas asignadas</span><span role="columnheader">Agregar</span></div>
          {days.map(({ day, meals }) => {
            const visibleMeals = meals.filter((meal) => `${meal.slot} ${meal.title}`.toLocaleLowerCase('es-AR').includes(term));
            const available = availableSlotsForDay(meals.map((meal) => meal.slot));
            return <article className="npm-day-row" role="row" data-plan-day={day} key={day}>
              <strong role="rowheader">{day}</strong>
              <div role="cell" className="npm-meals">
                {visibleMeals.map((meal) => {
                  const key = rowKey(day, meal.slot);
                  const current = slots.find((item) => item.day === day && item.slot === meal.slot);
                  const draft = drafts[key] ?? meal.title;
                  const dirty = draft.trim() !== meal.title;
                  return <div className="npm-meal-card" key={key}>
                    <div><NvBadge tone={meal.slot === 'Cena' ? 'gold' : 'green'}>{meal.slot}</NvBadge><span className="npm-card-actions">{removingKey === key ? <span className="npm-confirm"><button type="button" disabled={Boolean(busy)} onClick={() => void remove(day, meal.slot)}>Sí, quitar</button><button type="button" disabled={Boolean(busy)} onClick={() => setRemovingKey(null)}>No</button></span> : <><button type="button" className="npm-save" disabled={!dirty || savingKey === key} onClick={() => void save(day, meal.slot)}>{savingKey === key ? 'Guardando…' : savedKey === key ? 'Listo' : 'Guardar'}</button><button type="button" className="npm-remove" aria-label={`Quitar ${meal.slot} del ${day}`} onClick={() => setRemovingKey(key)}>×</button></>}</span></div>
                    <input type="text" maxLength={200} data-plan-input={meal.slot} aria-label={`${day} · ${meal.slot}`} value={draft} onChange={(event) => setDrafts((value) => ({ ...value, [key]: event.target.value }))} />
                    {publishedRecipes.length > 0 && <select aria-label={`Receta publicada para ${day} · ${meal.slot}`} value={current?.recipe_id ?? ''} onChange={(event) => {
                      const recipe = publishedRecipes.find((item) => item.id === event.target.value);
                      setSlots((value) => value.map((item) => item.day === day && item.slot === meal.slot ? { ...item, recipe_id: recipe?.id ?? null, servings: recipe?.servings ?? null, title: recipe?.title ?? item.title } : item));
                      if (recipe) setDrafts((value) => ({ ...value, [key]: recipe.title }));
                    }}><option value="">Título libre</option>{publishedRecipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.title}</option>)}</select>}
                    {current?.servings ? <small>{current.servings} {current.servings === 1 ? 'porción' : 'porciones'} de la receta</small> : null}
                  </div>;
                })}
                {!meals.length && <p className="npm-empty">Sin comidas asignadas</p>}
                {!!meals.length && !visibleMeals.length && <p className="npm-empty">Sin coincidencias</p>}
                {addingDay === day && <form className="npm-add-form" onSubmit={(event) => { event.preventDefault(); void add(day); }}>
                  <select aria-label={`Momento a agregar el ${day}`} value={addSlot} onChange={(event) => setAddSlot(event.target.value)}><option value="">Momento…</option>{available.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select>
                  <input autoFocus type="text" maxLength={200} aria-label={`Título nuevo para ${day}`} placeholder="Título de la comida" value={addTitle} onChange={(event) => setAddTitle(event.target.value)} />
                  {publishedRecipes.length > 0 && <select aria-label={`Receta publicada para ${day}`} value={addRecipe} onChange={(event) => {
                    const recipe = publishedRecipes.find((item) => item.id === event.target.value);
                    setAddRecipe(event.target.value);
                    if (recipe) setAddTitle(recipe.title);
                  }}><option value="">Título libre</option>{publishedRecipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.title}</option>)}</select>}
                  <NvButton type="submit" disabled={Boolean(busy)}>Agregar</NvButton><button type="button" className="npm-cancel" disabled={Boolean(busy)} onClick={() => setAddingDay(null)} aria-label={`Cancelar nueva comida del ${day}`}>×</button>
                </form>}
              </div>
              <span role="cell" className="npm-day-action">{available.length > 0 && addingDay !== day && <button type="button" aria-label={`Agregar comida al ${day}`} onClick={() => { setAddingDay(day); setAddSlot(''); setAddTitle(''); setAddRecipe(''); setError(null); }}><Icon name="plus" size={15} /></button>}</span>
            </article>;
          })}
        </div>
      </div>
    </section>
  </section>;
}
