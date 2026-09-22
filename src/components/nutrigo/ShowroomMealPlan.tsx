import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import type { Patient } from '../../types';
import { availableSlotsForDay, MENU_SLOTS } from '../crm/menu-editor-utils';
import { Icon } from '../shared/Icon';
import { mealSlotTone, NvBadge, NvButton } from './primitives';
import './showroom-meal-plan.css';

export const PLAN_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'] as const;
type PlanDay = { day: string; meals: Patient['weekPlan'][number]['meals'] };

function rowKey(day: string, slot: string): string {
  return `${day}|${slot}`;
}

function draftMap(weekPlan: Patient['weekPlan']): Record<string, string> {
  return Object.fromEntries(weekPlan.flatMap((day) => day.meals.map((meal) => [rowKey(day.day, meal.slot), meal.title])));
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
  const [drafts, setDrafts] = useState<Record<string, string>>(() => draftMap(patient.weekPlan));
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [addSlot, setAddSlot] = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const days = useMemo(() => buildPlanDays(patient.weekPlan), [patient.weekPlan]);
  const term = query.trim().toLocaleLowerCase('es-AR');

  useEffect(() => {
    setDrafts(draftMap(patient.weekPlan));
    setAddingDay(null);
    setRemovingKey(null);
    setError(null);
  }, [patient.id, patient.weekPlan]);

  const save = async (day: string, slot: string) => {
    const key = rowKey(day, slot);
    const title = (drafts[key] ?? '').trim();
    if (!title) { setError('El título no puede quedar vacío.'); return; }
    setSavingKey(key); setError(null);
    try {
      const result = await api.updateMenuSlot(patient.id, { day, slot, title });
      onChanged(result.patient);
      setSavedKey(key);
      window.setTimeout(() => setSavedKey((current) => current === key ? null : current), 2000);
    } catch {
      setError('No pudimos guardar el cambio. Intentá nuevamente.');
    } finally { setSavingKey(null); }
  };

  const remove = async (day: string, slot: string) => {
    setBusy(true); setError(null);
    try {
      const result = await api.removeMenuSlot(patient.id, day, slot);
      onChanged(result.patient);
      setRemovingKey(null);
    } catch {
      setError('No pudimos quitar la comida. Intentá nuevamente.');
    } finally { setBusy(false); }
  };

  const add = async (day: string) => {
    const title = addTitle.trim();
    if (!addSlot || !title) { setError('Elegí el momento y escribí el título de la comida.'); return; }
    setBusy(true); setError(null);
    try {
      const result = await api.updateMenuSlot(patient.id, { day, slot: addSlot, title });
      onChanged(result.patient);
      setAddingDay(null); setAddSlot(''); setAddTitle('');
    } catch {
      setError('No pudimos agregar la comida. Intentá nuevamente.');
    } finally { setBusy(false); }
  };

  return <section className="npm-plan" aria-label={`Plan semanal de ${patient.name}`}>
    <header className="npm-context">
      <div><span className={`nv-avatar person-${patient.tone}`}>{patient.initials}</span><div><strong>Plan semanal de {patient.name}</strong><small>Los cambios guardados se publican en “Mi plan” de la paciente.</small></div></div>
      {patients.length > 0 && <label>Paciente
        <select aria-label="Paciente del plan" value={patient.id} onChange={(event) => onSelect(event.target.value)}>
          {patients.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
        </select>
      </label>}
    </header>
    <div className="npm-plan-note"><span className="nv-icon-tile"><Icon name="list" size={17} /></span><p><strong>Indicaciones semanales</strong><small>Se muestran títulos guardados. No se infieren porciones, macros ni cantidades.</small></p><NvBadge>7 días</NvBadge></div>
    {error && <p className="npm-error" role="alert">{error}</p>}
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
                  const draft = drafts[key] ?? meal.title;
                  const dirty = draft.trim() !== meal.title;
                  return <div className="npm-meal-card" key={key}>
                    <div><NvBadge tone={mealSlotTone(meal.slot)}>{meal.slot}</NvBadge><span className="npm-card-actions">{removingKey === key ? <span className="npm-confirm"><button type="button" disabled={busy} onClick={() => remove(day, meal.slot)}>Sí, quitar</button><button type="button" disabled={busy} onClick={() => setRemovingKey(null)}>No</button></span> : <><button type="button" className="npm-save" disabled={!dirty || savingKey === key} onClick={() => save(day, meal.slot)}>{savingKey === key ? 'Guardando…' : savedKey === key ? 'Listo' : 'Guardar'}</button><button type="button" className="npm-remove" aria-label={`Quitar ${meal.slot} del ${day}`} onClick={() => setRemovingKey(key)}>×</button></>}</span></div>
                    <input type="text" maxLength={200} data-plan-input={meal.slot} aria-label={`${day} · ${meal.slot}`} value={draft} onChange={(event) => setDrafts((current) => ({ ...current, [key]: event.target.value }))} />
                  </div>;
                })}
                {!meals.length && <p className="npm-empty">Sin comidas asignadas</p>}
                {!!meals.length && !visibleMeals.length && <p className="npm-empty">Sin coincidencias</p>}
                {addingDay === day && <form className="npm-add-form" onSubmit={(event) => { event.preventDefault(); add(day); }}>
                  <select aria-label={`Momento a agregar el ${day}`} value={addSlot} onChange={(event) => setAddSlot(event.target.value)}><option value="">Momento…</option>{available.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select>
                  <input autoFocus type="text" maxLength={200} aria-label={`Título nuevo para ${day}`} placeholder="Título de la comida" value={addTitle} onChange={(event) => setAddTitle(event.target.value)} />
                  <NvButton type="submit" disabled={busy}>Agregar</NvButton><button type="button" className="npm-cancel" disabled={busy} onClick={() => setAddingDay(null)} aria-label={`Cancelar nueva comida del ${day}`}>×</button>
                </form>}
              </div>
              <span role="cell" className="npm-day-action">{available.length > 0 && addingDay !== day && <button type="button" aria-label={`Agregar comida al ${day}`} onClick={() => { setAddingDay(day); setAddSlot(''); setAddTitle(''); setError(null); }}><Icon name="plus" size={15} /></button>}</span>
            </article>;
          })}
        </div>
      </div>
    </section>
  </section>;
}
