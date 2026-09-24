import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CaretDown, ClockCounterClockwise, Plus, User } from '@phosphor-icons/react';
import { api } from '../../api/client';
import { plansApi } from '../../api/plans';
import type { Patient } from '../../types';
import { toPublishedPatientPlan } from '../../types/plans';
import { availableSlotsForDay, MENU_SLOTS } from '../crm/menu-editor-utils';
import { MealPlanEditor } from './MealPlanVersions';
import {
  buildWeekTable, ColumnFilter, matchesPlanSearch, PlanCellDetail, PlanMealCell, PlanSheet, PlanToolbar, PlanWeekTable,
  usePublishedPlan, useWeekNav, WEEK_DAYS, weekdayPlural, type PlanCell, type PlanRow,
} from './ShowroomPatientPlan';
import { mealSlotTone, NvBadge, NvButton } from './primitives';
import './plan-fig.css';

export const PLAN_DAYS = WEEK_DAYS;
type PlanDay = { day: string; meals: Patient['weekPlan'][number]['meals'] };

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

type Editing =
  | { kind: 'edit'; row: PlanRow; cell: PlanCell }
  | { kind: 'dated'; row: PlanRow; cell: PlanCell }
  | { kind: 'add'; day: string; slot: string; locked: boolean };

const loadProfessionalPlan = async (patientId: string, signal: AbortSignal) => {
  const result = await plansApi.professional(patientId, signal);
  return result.plan ? toPublishedPatientPlan(result.plan) : null;
};

export function ShowroomMealPlan({ patient, patients = [], query, onSelect, onChanged = () => undefined, now = new Date() }: {
  patient: Patient;
  patients?: Patient[];
  query: string;
  onSelect: (id: string) => void;
  onChanged?: (patient: Patient) => void;
  now?: Date;
}) {
  const [today] = useState(now);
  const nav = useWeekNav(today);
  const [refresh, setRefresh] = useState(0);
  const { plan: published, error: planError } = usePublishedPlan(patient.id, loadProfessionalPlan, refresh);
  const [search, setSearch] = useState(query);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Editing | null>(null);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [addDay, setAddDay] = useState<string>(PLAN_DAYS[0]);
  const [addSlot, setAddSlot] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const table = useMemo(() => buildWeekTable(patient.weekPlan, published, nav.week), [patient.weekPlan, published, nav.week]);
  const columns = table.columns.filter((column) => !hidden.has(column.slot));
  const days = useMemo(() => buildPlanDays(patient.weekPlan), [patient.weekPlan]);

  useEffect(() => setSearch(query), [query]);
  useEffect(() => { setEditing(null); setVersionsOpen(false); setError(null); }, [patient.id]);

  const open = (next: Editing) => {
    setEditing(next);
    setError(null);
    setConfirmRemove(false);
    if (next.kind === 'edit') setDraft(next.cell.title);
    if (next.kind === 'add') { setDraft(''); setAddDay(next.day); setAddSlot(next.slot); }
  };

  const run = async (work: () => Promise<{ patient: Patient }>, failure: string) => {
    setBusy(true); setError(null);
    try {
      const result = await work();
      onChanged(result.patient);
      setEditing(null);
    } catch {
      setError(failure);
    } finally { setBusy(false); }
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (editing?.kind !== 'edit') return;
    const title = draft.trim();
    if (!title) { setError('El título no puede quedar vacío.'); return; }
    void run(() => api.updateMenuSlot(patient.id, { day: editing.row.day, slot: editing.cell.slot, title }), 'No pudimos guardar el cambio. Intentá nuevamente.');
  };

  const add = (event: FormEvent) => {
    event.preventDefault();
    const title = draft.trim();
    if (!addSlot || !title) { setError('Elegí el momento y escribí el título de la comida.'); return; }
    void run(() => api.updateMenuSlot(patient.id, { day: addDay, slot: addSlot, title }), 'No pudimos agregar la comida. Intentá nuevamente.');
  };

  const freeSlots = availableSlotsForDay(days.find((day) => day.day === addDay)?.meals.map((meal) => meal.slot) ?? []);

  return <section className="pf-plan pf-plan-pro" aria-label={`Plan semanal de ${patient.name}`}>
    <PlanToolbar
      nav={nav}
      label="Herramientas del plan"
      search={search}
      onSearch={setSearch}
      filter={<ColumnFilter columns={table.columns} hidden={hidden} onToggle={(slot) => setHidden((current) => { const next = new Set(current); if (next.has(slot)) next.delete(slot); else next.add(slot); return next; })} />}
      extra={<>
        {patients.length > 0 && <label className="pf-picker pf-patient-picker">
          <span className="pf-picker-icon"><User size={14} /></span>
          <select aria-label="Paciente del plan" value={patient.id} onChange={(event) => onSelect(event.target.value)}>
            {patients.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          </select>
          <span className="pf-picker-caret"><CaretDown size={14} /></span>
        </label>}
        <button type="button" className="pf-picker pf-collapse" aria-label="Versiones del plan fechado" onClick={() => setVersionsOpen(true)}><span className="pf-picker-icon"><ClockCounterClockwise size={14} /></span><span className="pf-picker-text">Versiones</span></button>
      </>}
      cta={<button type="button" className="pf-cta pf-collapse" aria-label="Agregar comida" onClick={() => open({ kind: 'add', day: PLAN_DAYS[0], slot: '', locked: false })}><span className="pf-cta-icon"><Plus size={18} /></span><span className="pf-cta-text">Agregar comida</span></button>}
    />
    {(error && !editing) && <p className="pf-error" role="alert">{error}</p>}
    {planError && <p className="pf-error" role="alert">{planError}</p>}
    <PlanWeekTable rows={table.rows} columns={columns} nav={nav} label="Plan semanal editable" renderCell={(row, column) => {
      const cell = row.cells[column.slot];
      if (cell) return <PlanMealCell row={row} column={column} cell={cell} dim={!matchesPlanSearch(cell, search)} onOpen={() => open(cell.source === 'dated' ? { kind: 'dated', row, cell } : { kind: 'edit', row, cell })} />;
      if (row.dated) return <div className="pf-cell pf-cell-empty" data-tone={column.tone}><span className="pf-cell-image" aria-hidden="true" /><span className="pf-cell-text"><span>Sin indicación</span></span></div>;
      return <button type="button" className="pf-cell pf-cell-empty pf-cell-add" data-tone={column.tone} aria-label={`Agregar ${column.slot} el ${row.day}`} onClick={() => open({ kind: 'add', day: row.day, slot: column.slot, locked: true })}>
        <span className="pf-cell-image" aria-hidden="true"><Plus size={18} /></span><span className="pf-cell-text"><span>Agregar</span></span>
      </button>;
    }} />

    {editing?.kind === 'edit' && <PlanSheet title={`${editing.row.day} · ${editing.cell.slot}`} onClose={() => setEditing(null)}>
      <form className="pf-form" onSubmit={save}>
        <div className="pf-detail-meta"><NvBadge tone={mealSlotTone(editing.cell.slot)}>{editing.cell.slot}</NvBadge><span>Plan semanal · todos los {weekdayPlural(editing.row.day)}</span></div>
        <label>Comida<input type="text" autoFocus maxLength={200} data-plan-input={editing.cell.slot} aria-label={`${editing.row.day} · ${editing.cell.slot}`} value={draft} onChange={(event) => setDraft(event.target.value)} /></label>
        {error && <p className="pf-error" role="alert">{error}</p>}
        <div className="pf-form-actions">
          {confirmRemove
            ? <span className="pf-confirm">¿Quitar esta comida? <button type="button" className="pf-link-danger" disabled={busy} onClick={() => void run(() => api.removeMenuSlot(patient.id, editing.row.day, editing.cell.slot), 'No pudimos quitar la comida. Intentá nuevamente.')}>Sí, quitar</button><button type="button" className="pf-link" disabled={busy} onClick={() => setConfirmRemove(false)}>No</button></span>
            : <button type="button" className="pf-link-danger" aria-label={`Quitar ${editing.cell.slot} del ${editing.row.day}`} onClick={() => setConfirmRemove(true)}>Quitar</button>}
          <NvButton type="submit" disabled={busy || !draft.trim() || draft.trim() === editing.cell.title}>{busy ? 'Guardando…' : 'Guardar'}</NvButton>
        </div>
      </form>
    </PlanSheet>}

    {editing?.kind === 'add' && <PlanSheet title="Agregar comida" onClose={() => setEditing(null)}>
      <form className="pf-form" onSubmit={add}>
        <div className="pf-form-row">
          <label>Día<select aria-label="Día de la comida" value={addDay} disabled={editing.locked} onChange={(event) => { setAddDay(event.target.value); setAddSlot(''); }}>{PLAN_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}</select></label>
          <label>Momento<select aria-label={`Momento a agregar el ${addDay}`} value={addSlot} disabled={editing.locked} onChange={(event) => setAddSlot(event.target.value)}><option value="">Momento…</option>{(editing.locked ? [addSlot] : freeSlots).map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select></label>
        </div>
        <label>Comida<input autoFocus type="text" maxLength={200} aria-label={`Título nuevo para ${addDay}`} placeholder="Título de la comida" value={draft} onChange={(event) => setDraft(event.target.value)} /></label>
        {!editing.locked && !freeSlots.length && <p className="pf-detail-note">Este día ya tiene todos los momentos asignados.</p>}
        {error && <p className="pf-error" role="alert">{error}</p>}
        <div className="pf-form-actions"><NvButton type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Agregar'}</NvButton></div>
      </form>
    </PlanSheet>}

    {editing?.kind === 'dated' && <PlanSheet title={`${editing.cell.slot} · ${editing.row.day}`} onClose={() => setEditing(null)}>
      <PlanCellDetail row={editing.row} cell={editing.cell} plan={published} />
      <div className="pf-form-actions"><NvButton onClick={() => { setEditing(null); setVersionsOpen(true); }}>Editar en versiones</NvButton></div>
    </PlanSheet>}

    {versionsOpen && <PlanSheet title="Versiones del plan" wide hideTitle onClose={() => setVersionsOpen(false)}>
      <MealPlanEditor patientId={patient.id} onChanged={() => setRefresh((value) => value + 1)} />
    </PlanSheet>}
  </section>;
}
