import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import type { Patient } from '../../types';
import { Icon } from '../shared/Icon';
import { availableSlotsForDay } from './menu-editor-utils';

const WEEK_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

type Props = { patient: Patient; initialDay?: string | null; initialSlot?: string | null };

function rowKey(day: string, slot: string) {
  return `${day}|${slot}`;
}

export function CrmMenuEditor({ patient, initialDay = null, initialSlot = null }: Props) {
  const refreshPatient = useAppStore((state) => state.refreshPatient);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [removingKey, setRemovingKey] = useState<string | null>(null);
  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [addSlot, setAddSlot] = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const next: Record<string, string> = {};
    for (const day of patient.weekPlan) {
      for (const meal of day.meals) next[rowKey(day.day, meal.slot)] = meal.title;
    }
    setDrafts(next);
    setError(null);
    setRemovingKey(null);
    setAddingDay(null);
  }, [patient.id, patient.weekPlan]);

  useEffect(() => {
    if (!initialDay || !WEEK_DAYS.includes(initialDay)) return;
    const entry = patient.weekPlan.find((day) => day.day === initialDay);
    const requestedMeal = initialSlot ? entry?.meals.find((meal) => meal.slot === initialSlot) : null;
    const firstMeal = requestedMeal ?? entry?.meals[0];
    window.setTimeout(() => {
      if (firstMeal) {
        const input = document.querySelector<HTMLInputElement>(`[data-menu-day="${initialDay}"] [data-menu-input="${firstMeal.slot}"]`);
        input?.focus();
        input?.select();
      } else {
        document.querySelector<HTMLElement>(`[data-menu-day="${initialDay}"]`)?.scrollIntoView({ block: 'nearest' });
      }
    }, 0);
  }, [initialDay, initialSlot, patient.id, patient.weekPlan]);

  const save = async (day: string, slot: string) => {
    const key = rowKey(day, slot);
    const title = (drafts[key] ?? '').trim();
    if (!title) {
      setError('El título no puede quedar vacío.');
      return;
    }
    setSavingKey(key);
    setError(null);
    try {
      await api.updateMenuSlot(patient.id, { day, slot, title });
      await refreshPatient(patient.id);
      setSavedKey(key);
      window.setTimeout(() => setSavedKey((current) => (current === key ? null : current)), 2000);
    } catch {
      setError('No pudimos guardar el cambio. Intentá nuevamente.');
    } finally {
      setSavingKey(null);
    }
  };

  const remove = async (day: string, slot: string) => {
    setBusy(true);
    setError(null);
    try {
      await api.removeMenuSlot(patient.id, day, slot);
      await refreshPatient(patient.id);
      setRemovingKey(null);
    } catch {
      setError('No pudimos quitar la comida. Intentá nuevamente.');
    } finally {
      setBusy(false);
    }
  };

  const add = async (day: string) => {
    const title = addTitle.trim();
    if (!addSlot || !title) {
      setError('Elegí el slot y escribí el título de la comida.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.updateMenuSlot(patient.id, { day, slot: addSlot, title });
      await refreshPatient(patient.id);
      setAddingDay(null);
      setAddSlot('');
      setAddTitle('');
    } catch {
      setError('No pudimos agregar la comida. Intentá nuevamente.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="menu-editor" aria-label="Editor del menú semanal">
      <div className="menu-editor-head">
        <h3>Menú semanal de {patient.name}</h3>
        <p>Los cambios se ven en “Mi plan” de la paciente apenas guardás.</p>
      </div>
      {error && <p className="review-error" role="alert">{error}</p>}
      <div className="menu-editor-days">
        {WEEK_DAYS.map((day) => {
          const entry = patient.weekPlan.find((d) => d.day === day);
          const meals = entry?.meals ?? [];
          const available = availableSlotsForDay(meals.map((meal) => meal.slot));
          return (
            <article className="menu-day" data-menu-day={day} key={day}>
              <h4>{day}</h4>
              {meals.length > 0 ? meals.map((meal) => {
                const key = rowKey(day, meal.slot);
                const draft = drafts[key] ?? meal.title;
                const dirty = draft.trim() !== meal.title;
                const confirmingRemove = removingKey === key;
                return (
                  <div className="menu-slot-row" key={key}>
                    <span>{meal.slot}</span>
                    <input
                      type="text"
                      value={draft}
                      maxLength={200}
                      data-menu-input={meal.slot}
                      aria-label={`${day} · ${meal.slot}`}
                      onChange={(event) => setDrafts((current) => ({ ...current, [key]: event.target.value }))}
                    />
                    <button
                      type="button"
                      disabled={!dirty || savingKey === key}
                      onClick={() => save(day, meal.slot)}
                    >
                      {savingKey === key
                        ? <Icon name="loader" size={13} className="spin" />
                        : savedKey === key
                          ? <><Icon name="check" size={13} />Listo</>
                          : 'Guardar'}
                    </button>
                    {confirmingRemove ? (
                      <span className="menu-slot-confirm">
                        <button type="button" className="menu-slot-danger" disabled={busy} onClick={() => remove(day, meal.slot)}>Sí</button>
                        <button type="button" className="menu-slot-cancel" disabled={busy} onClick={() => setRemovingKey(null)} aria-label="No quitar">×</button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="menu-slot-remove"
                        aria-label={`Quitar ${meal.slot} del ${day}`}
                        onClick={() => setRemovingKey(key)}
                      >×</button>
                    )}
                  </div>
                );
              }) : <p className="menu-day-empty">Sin comidas cargadas.</p>}
              {addingDay === day ? (
                <div className="menu-add-form">
                  <select
                    value={addSlot}
                    aria-label={`Slot a agregar el ${day}`}
                    onChange={(event) => setAddSlot(event.target.value)}
                  >
                    <option value="">Slot…</option>
                    {available.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                  <input
                    type="text"
                    value={addTitle}
                    maxLength={200}
                    placeholder="Título de la comida"
                    aria-label={`Título nuevo para ${day}`}
                    onChange={(event) => setAddTitle(event.target.value)}
                  />
                  <button type="button" disabled={busy} onClick={() => add(day)}>Agregar</button>
                  <button type="button" className="menu-slot-cancel" disabled={busy} onClick={() => setAddingDay(null)}>×</button>
                </div>
              ) : available.length > 0 ? (
                <button
                  type="button"
                  className="menu-add-toggle"
                  onClick={() => { setAddingDay(day); setAddSlot(''); setAddTitle(''); }}
                >
                  <Icon name="plus" size={12} /> Agregar comida
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
