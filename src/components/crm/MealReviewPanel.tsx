import { useUnsavedChanges, canLeaveWorkspace } from '../nutrigo/unsaved-changes';
import { useState } from 'react';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import type { FoodItem, Macros, MealLog, Patient } from '../../types';
import { Icon, MacroBar } from '../shared/Icon';
import { buildAdjustedMealPatch, createMealReviewDraft, type MealReviewDraft } from './meal-review-draft';

type Props = {
  patient: Patient;
  log: MealLog;
  onClose: () => void;
  /** `card` vive dentro de Seguimiento. `dialog` es el cajón de la ficha. */
  layout?: 'dialog' | 'card';
};

const MACRO_FIELDS: { key: keyof Macros; label: string; unit: string }[] = [
  { key: 'kcal', label: 'Energía', unit: 'kcal' },
  { key: 'protein_g', label: 'Proteínas', unit: 'g' },
  { key: 'carbs_g', label: 'Carbohidratos', unit: 'g' },
  { key: 'fat_g', label: 'Grasas', unit: 'g' },
];

export function MealReviewPanel({ patient, log, onClose, layout = 'dialog' }: Props) {
  const refreshPatient = useAppStore((state) => state.refreshPatient);
  const [draft, setDraft] = useState<MealReviewDraft>(() => createMealReviewDraft(log));
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useUnsavedChanges(JSON.stringify(draft) !== JSON.stringify(createMealReviewDraft(log)), busy);

  const updateFood = (index: number, patch: Partial<FoodItem>) => {
    setDraft((current) => ({
      ...current,
      foods: current.foods.map((food, foodIndex) => foodIndex === index ? { ...food, ...patch } : food),
    }));
    setError(null);
  };

  const addFood = () => {
    setDraft((current) => (
      current.foods.length >= 8
        ? current
        : { ...current, foods: [...current.foods, { name: '', portion_est: null, portion_unit: 'g', confidence: 0 }] }
    ));
    setError(null);
  };

  const updateMacro = (key: keyof Macros, value: number) => {
    setDraft((current) => ({ ...current, macros: { ...current.macros, [key]: value } }));
    setError(null);
  };

  const submit = async (status: 'confirmed' | 'adjusted') => {
    if (busy) return;
    const payload = status === 'confirmed' ? { status } : buildAdjustedMealPatch(draft);
    if (!payload) {
      setError('Revisá que los alimentos y macros tengan valores válidos.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await api.updateMeal(patient.id, log.id, payload);
      await refreshPatient(patient.id);
      onClose();
    } catch {
      setError('No pudimos guardar la revisión. Intentá nuevamente.');
    } finally {
      setBusy(false);
    }
  };

  const foto = log.photo_url
    ? <img src={log.photo_url} alt={`Foto de ${log.slot} de ${patient.name}`} className={layout === 'card' ? 'nz-foto' : 'review-photo'} />
    : layout === 'card'
      ? <span className="nz-foto nz-foto-vacia">Sin foto</span>
      : null;
  const cuerpo = editing ? (
    <div className="review-editor">
      <fieldset>
        <legend>Alimentos estimados</legend>
        {draft.foods.map((food, index) => (
          <div className="review-food-row" key={`${log.id}-${index}`}>
            <label>
              <span>Alimento {index + 1}</span>
              <input
                autoFocus={index === 0}
                type="text"
                value={food.name}
                maxLength={120}
                onChange={(event) => updateFood(index, { name: event.target.value })}
              />
            </label>
            <label>
              <span>Porción</span>
              <input
                type="number"
                min="0"
                max="10000"
                step="0.1"
                value={Number.isNaN(food.portion_est) ? '' : food.portion_est ?? ''}
                onChange={(event) => updateFood(index, {
                  portion_est: event.target.value === '' ? null : event.target.valueAsNumber,
                })}
              />
            </label>
            <label>
              <span>Unidad</span>
              <select
                value={food.portion_unit}
                onChange={(event) => updateFood(index, { portion_unit: event.target.value as FoodItem['portion_unit'] })}
              >
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="u">u</option>
              </select>
            </label>
          </div>
        ))}
        {draft.foods.length < 8 && (
          <button type="button" className={layout === 'card' ? 'nz-glass' : 'soft-button'} onClick={addFood}>Agregar alimento</button>
        )}
      </fieldset>
      <fieldset>
        <legend>Macros estimadas</legend>
        <div className="review-macro-grid">
          {MACRO_FIELDS.map((field) => (
            <label key={field.key}>
              <span>{field.label}</span>
              <span className="review-number-input">
                <input
                  type="number"
                  min="0"
                  max={field.key === 'kcal' ? '10000' : '1000'}
                  step="1"
                  value={Number.isNaN(draft.macros[field.key]) ? '' : draft.macros[field.key]}
                  onChange={(event) => updateMacro(field.key, event.target.valueAsNumber)}
                />
                <small>{field.unit}</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  ) : (
    <>
      <div className="food-tags">{log.foods.map((food) => <span key={food.name}>{food.name}</span>)}</div>
      {log.macros && <MacroBar macros={log.macros} />}
    </>
  );
  const nota = log.note_for_nutri.trim()
    ? <p className={layout === 'card' ? 'nz-nota' : 'review-note'}><strong>Nota interna:</strong> {log.note_for_nutri}</p>
    : null;
  const confianza = <p className="review-confidence">Confianza: {(log.confidence * 100).toFixed(0)}% · {log.confidence < 0.45 ? 'No suma al indicador' : 'Estimación usable'}</p>;
  const acciones = (
    <div className="review-actions">
      <button type="button" className={layout === 'card' ? 'nz-lima' : 'primary-button'} disabled={busy} onClick={() => submit('confirmed')}>
        {layout === 'dialog' && <Icon name="check" size={16} />}Confirmar sin cambios
      </button>
      <button
        type="button"
        className={layout === 'card' ? (editing ? 'nz-lima' : 'nz-glass') : 'soft-button'}
        disabled={busy}
        onClick={() => editing ? submit('adjusted') : setEditing(true)}
      >
        {layout === 'dialog' && <Icon name={editing ? 'check' : 'edit'} size={16} />}{editing ? 'Guardar ajuste' : 'Ajustar'}
      </button>
    </div>
  );
  const cerrar = () => { if (canLeaveWorkspace()) onClose(); };
  const aviso = !log.foods.length
    ? <p className={layout === 'card' ? 'nz-nota' : 'review-note'}>Sin estimación automática. Confirmá el registro o completá los alimentos para ajustarlo.</p>
    : null;

  if (layout === 'card') {
    return (
      <section className="fxp nz-editor" aria-labelledby="meal-review-title">
        <header>
          <h3 id="meal-review-title">Ajustar · {log.slot}</h3>
          <span className="m">{patient.name}</span>
          <span className="sp" />
          <button type="button" className="nz-glass" onClick={cerrar} aria-label="Cerrar" disabled={busy}>Cerrar</button>
        </header>
        <div className="nz-split">
          <div className="nz-foto-col">
            {foto}
            {log.description ? <p className="nz-nota">“{log.description}”</p> : null}
          </div>
          <div className="nz-ctrl">
            {aviso}
            {cuerpo}
            {nota}
            {confianza}
            {error && <p className="review-error" role="alert">{error}</p>}
            {acciones}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div
      className={`review-panel ${editing ? 'review-panel-editing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="meal-review-title"
    >
      <div className="review-head">
        <h3 id="meal-review-title">Revisar comida · {log.slot}</h3>
        <button type="button" onClick={cerrar} aria-label="Cerrar" disabled={busy}>×</button>
      </div>
      {foto}
      {log.description && !log.photo_url && <p className="review-desc">“{log.description}”</p>}
      {aviso}
      {cuerpo}
      {nota}
      {confianza}
      {error && <p className="review-error" role="alert">{error}</p>}
      {acciones}
    </div>
  );
}
