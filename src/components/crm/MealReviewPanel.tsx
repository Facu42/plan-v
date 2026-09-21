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
};

const MACRO_FIELDS: { key: keyof Macros; label: string; unit: string }[] = [
  { key: 'kcal', label: 'Energía', unit: 'kcal' },
  { key: 'protein_g', label: 'Proteínas', unit: 'g' },
  { key: 'carbs_g', label: 'Carbohidratos', unit: 'g' },
  { key: 'fat_g', label: 'Grasas', unit: 'g' },
];

export function MealReviewPanel({ patient, log, onClose }: Props) {
  const refreshPatient = useAppStore((state) => state.refreshPatient);
  const [draft, setDraft] = useState<MealReviewDraft>(() => {
    const next = createMealReviewDraft(log);
    if (log.analysis_status === 'failed' && next.foods.length === 0) {
      return {
        ...next,
        foods: [{ name: log.description?.trim().slice(0, 120) || 'Comida registrada', portion_est: null, portion_unit: 'g', confidence: 0.5 }],
      };
    }
    return next;
  });
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFood = (index: number, patch: Partial<FoodItem>) => {
    setDraft((current) => ({
      ...current,
      foods: current.foods.map((food, foodIndex) => foodIndex === index ? { ...food, ...patch } : food),
    }));
    setError(null);
  };

  const updateMacro = (key: keyof Macros, value: number) => {
    setDraft((current) => ({ ...current, macros: { ...current.macros, [key]: value } }));
    setError(null);
  };

  const submit = async (status: 'confirmed' | 'adjusted') => {
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

  return (
    <div
      className={`review-panel ${editing ? 'review-panel-editing' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="meal-review-title"
    >
      <div className="review-head">
        <h3 id="meal-review-title">Revisar comida · {log.slot}</h3>
        <button type="button" onClick={onClose} aria-label="Cerrar" disabled={busy}>×</button>
      </div>
      {log.photo_url && <img src={log.photo_url} alt="Comida de la paciente" className="review-photo" />}
      {log.description && !log.photo_url && <p className="review-desc">“{log.description}”</p>}
      {log.analysis_status === 'failed' && (
        <p className="review-note">El análisis automático no está disponible. La comida quedó registrada; confirmá o ajustá con lo que ves.</p>
      )}

      {editing ? (
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
      )}

      <p className="review-note"><strong>Nota IA (solo vos):</strong> {log.note_for_nutri}</p>
      <p className="review-confidence">Confianza: {(log.confidence * 100).toFixed(0)}% · {log.confidence < 0.45 ? 'No suma al gauge' : 'Estimación usable'}</p>
      {error && <p className="review-error" role="alert">{error}</p>}
      <div className="review-actions">
        <button type="button" className="primary-button" disabled={busy} onClick={() => submit('confirmed')}>
          <Icon name="check" size={16} />Confirmar sin cambios
        </button>
        <button
          type="button"
          className="soft-button"
          disabled={busy}
          onClick={() => editing ? submit('adjusted') : setEditing(true)}
        >
          <Icon name={editing ? 'check' : 'edit'} size={16} />{editing ? 'Guardar ajuste' : 'Ajustar'}
        </button>
      </div>
    </div>
  );
}
