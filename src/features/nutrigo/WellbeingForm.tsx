import { useRef, useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import type { ShowroomPatient } from '../../components/nutrigo/showroom-model';
import { FigmaRecordDialog } from '../../components/nutrigo/FigmaPatientFront';
import { canLeaveWorkspace, useUnsavedChanges } from '../../components/nutrigo/unsaved-changes';
import { notifyCareChanged } from '../../api/care';
import { ENERGY_LEVELS, SYMPTOMS, normalizeSymptoms } from '../../types/symptoms';
import { errorText } from './screens/shared';

const CHOSEN = 'rounded-[8px] bg-[#c2e66e] px-[16px] py-[10px] text-[#272932]';
const IDLE = 'rounded-[8px] border border-[#e1e1e2] px-[16px] py-[10px]';
const sameList = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((item, index) => item === b[index]);

/**
 * «Cómo me siento hoy»: ánimo (energía) y síntomas del día. El archivo de Nutrigo no dibuja esta pantalla:
 * se arma con su diálogo de registro y los mismos botones lima y de borde que el diálogo «Registrar» del diario.
 */
export function WellbeingForm({ patient, onClose }: { patient: ShowroomPatient; onClose: () => void }) {
  const today = patient.journey.days[patient.journey.days.length - 1];
  const initialEnergy = ENERGY_LEVELS.some(level => level.value === today?.energy) ? today!.energy : null;
  const initialSymptoms = normalizeSymptoms(today?.symptoms);
  const [energy, setEnergy] = useState<string | null>(initialEnergy);
  const [symptoms, setSymptoms] = useState<string[]>(initialSymptoms);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  const lock = useRef(false);
  const add = useAppStore(state => state.addPatient);
  const changed = energy !== initialEnergy || !sameList(symptoms, initialSymptoms);
  useUnsavedChanges(changed, busy);
  const toggle = (key: string) => setSymptoms(list => normalizeSymptoms(list.includes(key) ? list.filter(item => item !== key) : [...list, key]));
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (lock.current) return;
    if (!changed) { onClose(); return; }
    lock.current = true; setBusy(true); setError('');
    try {
      const response = await api.updateHabits(patient.id, { energy, symptoms });
      add(response.patient);
      notifyCareChanged();
      onClose();
    } catch (caught) { setError(errorText(caught)); }
    finally { lock.current = false; setBusy(false); }
  };
  return <FigmaRecordDialog title="Cómo me siento hoy" onClose={() => { if (canLeaveWorkspace()) onClose(); }}>
    <form onSubmit={submit} aria-busy={busy}>
      <fieldset disabled={busy} className="mb-[16px] flex flex-col gap-[8px] text-[#272932]">
        <legend className="mb-[8px] text-[14px]">¿Cómo está tu energía hoy?</legend>
        <div className="flex flex-wrap gap-[8px]" role="group" aria-label="Energía de hoy">
          {ENERGY_LEVELS.map(level => <button key={level.value} type="button" aria-pressed={energy === level.value} onClick={() => setEnergy(value => value === level.value ? null : level.value)} className={energy === level.value ? CHOSEN : IDLE}>{level.label}</button>)}
        </div>
      </fieldset>
      <fieldset disabled={busy} className="mb-[16px] flex flex-col gap-[8px] text-[#272932]">
        <legend className="mb-[8px] text-[14px]">¿Tuviste alguno de estos síntomas?</legend>
        <div className="flex flex-wrap gap-[8px]" role="group" aria-label="Síntomas de hoy">
          {SYMPTOMS.map(symptom => <button key={symptom.key} type="button" aria-pressed={symptoms.includes(symptom.key)} onClick={() => toggle(symptom.key)} className={symptoms.includes(symptom.key) ? CHOSEN : IDLE}>{symptom.label}</button>)}
        </div>
        <p className="text-[14px]">Tu nutricionista lo ve en tu ficha. Si un síntoma es fuerte o no se va, consultá a un médico.</p>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      <button type="submit" className="mcp-action" disabled={busy}>{busy ? 'Guardando…' : 'Guardar registro'}</button>
    </form>
  </FigmaRecordDialog>;
}
