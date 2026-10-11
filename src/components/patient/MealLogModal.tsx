import { useEffect, useMemo, useRef, useState } from 'react';
import { useModalFocus } from '../nutrigo/use-modal-focus';
import { useUnsavedChanges, canLeaveWorkspace } from '../nutrigo/unsaved-changes';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import type { MealLog, Patient } from '../../types';
import { careErrorMessage, notifyCareChanged } from '../../api/care';
import { useCare } from '../nutrigo/useCare';
import { CareConsent } from '../nutrigo/CarePanel';
import { CaptureView, type Draft } from './MealLogCapture';
import { AnalyzingView, ReviewView, SuccessView } from './MealLogResult';
import { StepIndicator } from './MealLogStepper';
import { base64Payload, captureProblem, photoProblem, resolveInitialSlot, type Step } from './meal-log-helpers';
import './meal-log-modal.css';

export { MEAL_KEPT_COPY, mealLogWasKept } from './meal-log-helpers';

type Props = {
  patient: Patient;
  defaultSlot?: string;
  close: () => void;
};

const READ_ERROR = 'No pudimos leer esa foto. Probá con otra.';

export function MealLogModal({ patient, defaultSlot, close }: Props) {
  const care = useCare(patient.id);
  const lock = useRef(false);
  const clientId = useRef(crypto.randomUUID());
  const refreshPatient = useAppStore((s) => s.refreshPatient);
  const [step, setStep] = useState<Step>('capture');
  const [draft, setDraft] = useState<Draft>(() => ({
    mode: 'photo', slot: resolveInitialSlot(defaultSlot, new Date().getHours()), description: '', photoPreview: null,
  }));
  const [result, setResult] = useState<MealLog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const imageBase64 = useMemo(() => base64Payload(draft.photoPreview), [draft.photoPreview]);
  const consented = care.data?.consented ?? null;
  useUnsavedChanges(step === 'capture' && Boolean(draft.description.trim() || imageBase64), step === 'analyzing');
  const closeSafely = () => { if (canLeaveWorkspace()) close(); };
  const dialog = useModalFocus(true, closeSafely);

  const lastStep = useRef(step);
  useEffect(() => {
    if (lastStep.current === step) return;
    lastStep.current = step;
    dialog.current?.querySelector<HTMLElement>('[data-mlm-heading]')?.focus({ preventScroll: true });
  }, [step, dialog]);

  const patchDraft = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  // Una sola lectura de foto a la vez: si empieza otra o se cierra el diálogo, la vieja se descarta.
  const reading = useRef<FileReader | null>(null);
  useEffect(() => () => reading.current?.abort(), []);

  const handleFile = (file: File) => {
    const problem = photoProblem(file);
    if (problem) { setError(problem); return; }
    reading.current?.abort();
    const reader = new FileReader();
    reading.current = reader;
    reader.onload = () => {
      if (reading.current !== reader) return;
      patchDraft({ photoPreview: reader.result as string });
      setError(null);
    };
    reader.onerror = () => { if (reading.current === reader) setError(READ_ERROR); };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if (lock.current) return;
    const text = draft.description.trim();
    const problem = captureProblem({ mode: draft.mode, text, hasImage: Boolean(imageBase64), consented });
    if (problem) { setError(problem); return; }
    setError(null);
    lock.current = true;
    setStep('analyzing');
    try {
      const withPhoto = draft.mode === 'photo' && imageBase64;
      const { log } = await api.analyzeMeal(patient.id, {
        description: text || undefined,
        imageBase64: withPhoto ? imageBase64 : undefined,
        slot: draft.slot,
        photoPreview: draft.mode === 'photo' ? draft.photoPreview ?? undefined : undefined,
        client_id: clientId.current,
      });
      setResult(log);
      try { await refreshPatient(patient.id); } catch { /* El registro ya fue confirmado; no reenviar por un fallo de lectura. */ }
      notifyCareChanged();
      setStep('review');
    } catch (e) {
      setError(careErrorMessage(e));
      setStep('capture');
    } finally { lock.current = false; }
  };

  const preview = draft.mode === 'photo' ? draft.photoPreview : null;
  const showCapture = step === 'capture' || (!result && step !== 'analyzing');
  return (
    <div className="mlm-backdrop" ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Registrar comida"
      onMouseDown={(event) => { if (event.target === event.currentTarget) closeSafely(); }}
      onDragOver={(event) => event.preventDefault()} onDrop={(event) => event.preventDefault()}>
      <p className="mlm-sr" aria-live="assertive" aria-atomic="true">{error}</p>
      <div className="mlm-sheet" data-step={step}>
        <header className="mlm-head">
          <span className="mlm-grab" aria-hidden />
          <StepIndicator step={step} />
          <button className="mlm-close" type="button" onClick={closeSafely} disabled={step === 'analyzing'} aria-label="Cerrar">×</button>
        </header>
        <div className="mlm-stage" key={step}>
          {step === 'analyzing' && <AnalyzingView mode={draft.mode} preview={preview} description={draft.description} />}
          {step === 'review' && result && (
            <ReviewView result={result} slot={draft.slot} preview={preview} description={draft.description} onConfirm={() => setStep('success')} />
          )}
          {step === 'success' && result && <SuccessView name={patient.name} macros={result.macros} onClose={closeSafely} />}
          {showCapture && (
            <CaptureView
              draft={draft} error={error} onChange={patchDraft} onFile={handleFile} onAnalyze={() => void analyze()}
              photoBlocked={Boolean(consented) && !consented?.includes('meal_photo')}
              aiBlocked={Boolean(consented) && !consented?.includes('ai_meal_analysis')}
              consent={care.data && <CareConsent patientId={patient.id} snapshot={care.data} meals />}
            />
          )}
        </div>
      </div>
    </div>
  );
}
