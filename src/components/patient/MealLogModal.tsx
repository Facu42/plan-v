import { useRef, useState } from 'react';
import { api } from '../../api/client';
import { useAppStore } from '../../store/useAppStore';
import type { MealLog, Patient } from '../../types';
import { Icon, MacroBar } from '../shared/Icon';
import { careErrorMessage, notifyCareChanged } from '../../api/care';
import { useCare } from '../nutrigo/useCare';
import { CareConsent } from '../nutrigo/CarePanel';

type Props = {
  patient: Patient;
  defaultSlot?: string;
  close: () => void;
};

type Step = 'capture' | 'analyzing' | 'review' | 'success';

const SLOTS = ['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena', 'Extra'];

export function mealLogWasKept(log: Pick<MealLog, 'foods' | 'macros' | 'analysis_status'>) {
  return log.analysis_status === 'failed' || (log.foods.length === 0 && !log.macros);
}

export const MEAL_KEPT_COPY = 'No pudimos estimar alimentos ni macros. Verónica lo revisará. Tu registro no se perdió.';

export function MealLogModal({ patient, defaultSlot = 'Almuerzo', close }: Props) {
  const care=useCare(patient.id);
  const lock=useRef(false);
  const clientId = useRef(crypto.randomUUID());
  const refreshPatient = useAppStore((s) => s.refreshPatient);
  const [step, setStep] = useState<Step>('capture');
  const [mode, setMode] = useState<'photo' | 'text'>('photo');
  const [slot, setSlot] = useState(defaultSlot);
  const [description, setDescription] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | undefined>();
  const [result, setResult] = useState<MealLog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if(file.size>5*1024*1024 || !['image/jpeg','image/png','image/webp'].includes(file.type)){setError('Elegí una foto JPG, PNG o WebP de hasta 5 MB.');return;}
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhotoPreview(dataUrl);
      setImageBase64(dataUrl.split(',')[1]);
    };
    reader.readAsDataURL(file);
  };

  const analyze = async () => {
    if(lock.current)return;
    const text = description.trim();
    if (care.data && !care.data.consented.includes('ai_meal_analysis')) {
      setError('Activá el permiso de análisis con IA para continuar.');
      return;
    }
    if (mode === 'photo' && care.data && !care.data.consented.includes('meal_photo')) {
      setError('Activá el permiso de fotos de comidas para subir una imagen.');
      return;
    }
    if (mode === 'photo' && !imageBase64 && !text) {
      setError('Subí una foto o contanos qué comiste en texto.');
      return;
    }
    if (mode === 'text' && !text) {
      setError('Describí qué comiste.');
      return;
    }
    setError(null);
    lock.current=true;
    setStep('analyzing');
    try {
      const { log } = await api.analyzeMeal(patient.id, {
        description: text || undefined,
        imageBase64: mode === 'photo' && imageBase64 ? imageBase64 : undefined,
        slot,
        photoPreview: mode === 'photo' ? photoPreview ?? undefined : undefined,
        client_id: clientId.current,
      });
      setResult(log);
      try { await refreshPatient(patient.id); } catch { /* El registro ya fue confirmado; no reenviar por un fallo de lectura. */ }
      notifyCareChanged();
      setStep('review');
    } catch (e) {
      setError(careErrorMessage(e));
      setStep('capture');
    } finally { lock.current=false; }
  };

  const confirm = () => {
    setStep('success');
  };

  if (step === 'success' && result) {
    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true">
        <div className="photo-modal photo-success">
          <button className="modal-close" onClick={close} aria-label="Cerrar">×</button>
          <span><Icon name="check" size={30} /></span>
          <p className="eyebrow">Comida registrada</p>
          <h2>¡Listo, {patient.name.split(' ')[0]}!</h2>
          <p>Quedó como estimación. Verónica lo revisa cuando corresponda.</p>
          {result.macros && <MacroBar macros={result.macros} />}
          <button className="primary-button" onClick={close}>Volver a mi día</button>
        </div>
      </div>
    );
  }

  if (step === 'analyzing') {
    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true">
        <div className="photo-modal analyzing-modal">
          <Icon name="loader" size={32} className="spin" />
          <h2>Analizando tu comida…</h2>
          <p>La IA estima alimentos y macros. Verónica confirma antes de que cuente.</p>
        </div>
      </div>
    );
  }

  if (step === 'review' && result) {
    const estimationUnavailable = mealLogWasKept(result);
    return (
      <div className="modal-backdrop" role="dialog" aria-modal="true">
        <div className="photo-modal">
          <button className="modal-close" onClick={close} aria-label="Cerrar">×</button>
          {photoPreview ? (
            <div className="modal-camera preview"><img src={photoPreview} alt="Tu comida" /></div>
          ) : (
            <div className="modal-camera text-preview"><Icon name="edit" size={28} /><p>{description}</p></div>
          )}
          <p className="eyebrow">{estimationUnavailable ? 'Registro guardado' : 'Lectura asistida'} · {slot}</p>
          <h2>{estimationUnavailable ? 'Registramos tu comida' : 'Esto es lo que vemos'}</h2>
          {estimationUnavailable ? (
            <p className="modal-note">{MEAL_KEPT_COPY}</p>
          ) : (
            <>
              <div className="food-tags">
                {result.foods.map((f) => (
                  <span key={f.name}>{f.name}{f.portion_est ? ` · ~${f.portion_est}${f.portion_unit}` : ''}</span>
                ))}
              </div>
              {result.macros ? (
                <>
                  <MacroBar macros={result.macros} />
                  <p className={`confidence-badge ${result.confidence >= 0.75 ? 'high' : result.confidence >= 0.45 ? 'medium' : 'low'}`}>
                    Estimación · confianza {(result.confidence * 100).toFixed(0)}% · pendiente de Verónica
                  </p>
                </>
              ) : (
                <p className="modal-note">No pudimos estimar macros con confianza. Verónica lo revisará.</p>
              )}
            </>
          )}
          <p className="modal-note">No es una medida exacta. Verónica confirma antes de que cuente para tu seguimiento.</p>
          <button className="primary-button wide" onClick={confirm}><Icon name="check" size={17} />Guardar comida</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Registrar comida">
      <div className="photo-modal meal-capture-modal">
        <button className="modal-close" onClick={close} aria-label="Cerrar">×</button>
        <p className="eyebrow">Registrar comida</p>
        <h2>¿Qué comiste?</h2>
        {care.data && <CareConsent patientId={patient.id} snapshot={care.data} meals />}

        <div className="capture-tabs">
          <button className={mode === 'photo' ? 'active' : ''} onClick={() => setMode('photo')} type="button">
            <Icon name="camera" size={16} /> Foto
          </button>
          <button className={mode === 'text' ? 'active' : ''} onClick={() => setMode('text')} type="button">
            <Icon name="edit" size={16} /> Describir
          </button>
        </div>

        <label className="field-label">Comida</label>
        <div className="slot-pills">
          {SLOTS.map((s) => (
            <button key={s} type="button" className={slot === s ? 'active' : ''} onClick={() => setSlot(s)}>{s}</button>
          ))}
        </div>

        {mode === 'photo' ? (
          <>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <button type="button" className="upload-zone" disabled={Boolean(care.data) && !care.data?.consented.includes('meal_photo')} onClick={() => fileRef.current?.click()}>
              {photoPreview ? <img src={photoPreview} alt="Vista previa" /> : (
                <>
                  <Icon name="camera" size={28} />
                  <strong>Tocá para sacar o subir foto</strong>
                  <small>Una foto clara ayuda a estimar mejor</small>
                </>
              )}
            </button>
            <input
              className="text-input optional-desc"
              placeholder="Detalle opcional (ej: con aceite de oliva)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </>
        ) : (
          <textarea
            className="text-input meal-desc"
            placeholder="Ej: milanesa de pollo con ensalada mixta y un poco de arroz"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        )}

        {error && <p className="form-error">{error}</p>}
        <button className="primary-button wide" type="button" onClick={analyze} disabled={Boolean(care.data) && !care.data?.consented.includes('ai_meal_analysis')}>
          <Icon name="sparkle" size={17} />Analizar con IA
        </button>
      </div>
    </div>
  );
}
