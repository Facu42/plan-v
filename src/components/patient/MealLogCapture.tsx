import { useEffect, useRef, useState, type CSSProperties, type DragEvent, type ReactNode } from 'react';
import { BowlFood, Carrot, Coffee, Cookie, ForkKnife, Moon, type Icon as PhosphorIcon } from '@phosphor-icons/react';
import { Icon } from '../shared/Icon';
import { MEAL_SLOTS, remainingNotice, type CaptureMode } from './meal-log-helpers';

const SLOT_ICONS: Record<(typeof MEAL_SLOTS)[number], PhosphorIcon> = {
  Desayuno: Coffee, Colación: Carrot, Almuerzo: ForkKnife, Merienda: Cookie, Cena: Moon, Extra: BowlFood,
};
const SLOT_COLUMNS = 3;
const MAX_TEXT = 1000;

export type Draft = { mode: CaptureMode; slot: string; description: string; photoPreview: string | null };

export function SlotChips({ value, onChange }: { value: string; onChange: (slot: string) => void }) {
  const index = MEAL_SLOTS.findIndex((slot) => slot === value);
  const style = { '--mlm-col': Math.max(index, 0) % SLOT_COLUMNS, '--mlm-row': Math.floor(Math.max(index, 0) / SLOT_COLUMNS) } as CSSProperties;
  return (
    <fieldset className="mlm-fieldset">
      <legend>Momento de la comida</legend>
      <div className="mlm-slots" style={style}>
        {index >= 0 && <i className="mlm-slot-pill" aria-hidden />}
        {MEAL_SLOTS.map((slot) => {
          const SlotIcon = SLOT_ICONS[slot];
          return (
            <label key={slot} className="mlm-slot">
              <input type="radio" name="mlm-slot" value={slot} checked={slot === value} onChange={() => onChange(slot)} />
              <SlotIcon size={20} weight="duotone" aria-hidden />
              <span>{slot}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function ModeToggle({ value, onChange }: { value: CaptureMode; onChange: (mode: CaptureMode) => void }) {
  return (
    <fieldset className="mlm-fieldset">
      <legend className="mlm-sr">Cómo querés registrarla</legend>
      <div className="mlm-seg" data-mode={value}>
        <i className="mlm-seg-pill" aria-hidden />
        <label>
          <input type="radio" name="mlm-mode" value="photo" checked={value === 'photo'} onChange={() => onChange('photo')} />
          <Icon name="camera" size={17} /><span>Foto</span>
        </label>
        <label>
          <input type="radio" name="mlm-mode" value="text" checked={value === 'text'} onChange={() => onChange('text')} />
          <Icon name="edit" size={17} /><span>Describir</span>
        </label>
      </div>
    </fieldset>
  );
}

type PhotoDropProps = { preview: string | null; blocked: boolean; onFile: (file: File) => void; onClear: () => void };

export function PhotoDrop({ preview, blocked, onFile, onClear }: PhotoDropProps) {
  const gallery = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const pickButton = useRef<HTMLButtonElement>(null);
  const changeButton = useRef<HTMLButtonElement>(null);
  const focusAfter = useRef<'pick' | 'change' | null>(null);
  const [dragging, setDragging] = useState(false);
  // Al elegir o quitar la foto desaparece el botón que tenía el foco: se lo pasamos al que corresponde.
  useEffect(() => {
    const wanted = focusAfter.current;
    if (wanted === 'change' && preview) { changeButton.current?.focus(); focusAfter.current = null; }
    if (wanted === 'pick' && !preview) { pickButton.current?.focus(); focusAfter.current = null; }
  }, [preview]);
  const accept = (file: File) => { focusAfter.current = 'change'; onFile(file); };
  const pick = (event: { target: HTMLInputElement }) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) accept(file);
  };
  const stop = (event: DragEvent) => { event.preventDefault(); };
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file && !blocked) accept(file);
  };
  const onLeave = (event: DragEvent) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
  };
  const clear = () => { focusAfter.current = 'pick'; onClear(); };
  return (
    <div
      className="mlm-drop" data-dragging={dragging} data-filled={Boolean(preview)} data-blocked={blocked}
      onDragEnter={(event) => { stop(event); if (!blocked) setDragging(true); }} onDragOver={stop} onDragLeave={onLeave} onDrop={onDrop}
    >
      <input ref={gallery} type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={blocked} onChange={pick} />
      <input ref={camera} type="file" accept="image/*" capture="environment" hidden disabled={blocked} onChange={pick} />
      <svg className="mlm-drop-border" aria-hidden><rect x="1" y="1" rx="15" /></svg>
      {preview ? (
        <>
          <img key={preview} className="mlm-drop-photo" src={preview} alt="Vista previa de tu comida" />
          <div className="mlm-drop-actions">
            <button ref={changeButton} type="button" className="mlm-chip-btn" disabled={blocked} onClick={() => gallery.current?.click()}>
              <Icon name="camera" size={16} />Cambiar foto
            </button>
            <button type="button" className="mlm-chip-btn mlm-icon-only" aria-label="Quitar foto" onClick={clear}>×</button>
          </div>
        </>
      ) : (
        <div className="mlm-drop-empty">
          <span className="mlm-drop-icon" aria-hidden><Icon name="camera" size={26} /></span>
          <strong>{dragging ? 'Soltala acá' : 'Arrastrá una foto o tocá para subirla'}</strong>
          <small>{blocked ? 'Activá el permiso de fotos de comidas (arriba) para subir una imagen.' : 'JPG, PNG o WebP de hasta 5 MB. Una foto clara ayuda a estimar mejor.'}</small>
          <div className="mlm-drop-buttons">
            <button type="button" className="mlm-chip-btn" disabled={blocked} onClick={() => camera.current?.click()}><Icon name="camera" size={16} />Sacar foto</button>
            <button ref={pickButton} type="button" className="mlm-chip-btn" disabled={blocked} onClick={() => gallery.current?.click()}><Icon name="plus" size={16} />Elegir foto</button>
          </div>
        </div>
      )}
    </div>
  );
}

const FOCUS_RETRIES = 8;
const FOCUS_RETRY_MS = 120;

/** Permisos de la comida: abre al montar solo si falta algo y después manda la paciente. */
export function ConsentGroup({ blocked, children }: { blocked: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(blocked);
  const lastToggled = useRef<HTMLInputElement | null>(null);
  // Mientras se guarda un permiso el casillero queda deshabilitado y el navegador le quita el foco: se lo devolvemos al terminar.
  useEffect(() => {
    let timer = 0;
    const restore = (attempt: number) => {
      const box = lastToggled.current;
      if (!box?.isConnected || document.activeElement !== document.body) return;
      if (!box.disabled) { box.focus(); return; }
      if (attempt < FOCUS_RETRIES) timer = window.setTimeout(() => restore(attempt + 1), FOCUS_RETRY_MS);
    };
    const onChanged = () => { window.clearTimeout(timer); timer = window.setTimeout(() => restore(0), FOCUS_RETRY_MS); };
    window.addEventListener('plan-v:care-changed', onChanged);
    return () => { window.clearTimeout(timer); window.removeEventListener('plan-v:care-changed', onChanged); };
  }, []);
  return (
    <details
      className="mlm-consent" open={open} onToggle={(event) => setOpen(event.currentTarget.open)}
      onChange={(event) => { if (event.target instanceof HTMLInputElement) lastToggled.current = event.target; }}
    >
      <summary>{blocked ? 'Permisos de esta comida · falta activar' : 'Permisos de esta comida · listos'}</summary>
      {children}
    </details>
  );
}

type CaptureViewProps = {
  draft: Draft; error: string | null; photoBlocked: boolean; aiBlocked: boolean; consent: ReactNode;
  onChange: (patch: Partial<Draft>) => void; onFile: (file: File) => void; onAnalyze: () => void;
};

export function CaptureView({ draft, error, photoBlocked, aiBlocked, consent, onChange, onFile, onAnalyze }: CaptureViewProps) {
  const isPhoto = draft.mode === 'photo';
  const ready = isPhoto ? Boolean(draft.photoPreview || draft.description.trim()) : Boolean(draft.description.trim());
  return (
    <>
      <div className="mlm-scroll">
        <p className="mlm-eyebrow">Registrar comida</p>
        <h2 className="mlm-title" tabIndex={-1} data-mlm-heading>¿Qué comiste?</h2>
        {consent && <ConsentGroup blocked={aiBlocked || (isPhoto && photoBlocked)}>{consent}</ConsentGroup>}
        <ModeToggle value={draft.mode} onChange={(mode) => onChange({ mode })} />
        <SlotChips value={draft.slot} onChange={(slot) => onChange({ slot })} />
        <div className="mlm-panel" key={draft.mode}>
          {isPhoto ? (
            <>
              <PhotoDrop preview={draft.photoPreview} blocked={photoBlocked} onFile={onFile} onClear={() => onChange({ photoPreview: null })} />
              <input
                className="mlm-input" aria-label="Detalle opcional de la comida" placeholder="Detalle opcional (ej: con aceite de oliva)"
                maxLength={MAX_TEXT} value={draft.description} onChange={(e) => onChange({ description: e.target.value })}
              />
            </>
          ) : (
            <div className="mlm-textarea">
              <label>
                <span>Contanos qué comiste</span>
                <textarea
                  placeholder="Ej: milanesa de pollo con ensalada mixta y un poco de arroz" rows={4} maxLength={MAX_TEXT}
                  value={draft.description} onChange={(e) => onChange({ description: e.target.value })}
                />
              </label>
              {draft.description.length > MAX_TEXT * 0.8 && <small aria-hidden>{`${draft.description.length}/${MAX_TEXT}`}</small>}
              <span className="mlm-sr" aria-live="polite">{remainingNotice(draft.description.length, MAX_TEXT)}</span>
            </div>
          )}
        </div>
      </div>
      <footer className="mlm-foot">
        <div className="mlm-feedback">{error && <p className="mlm-error">{error}</p>}</div>
        {aiBlocked && <p className="mlm-hint" id="mlm-ai-hint">Activá el permiso de análisis con IA, arriba, para continuar.</p>}
        <button className="mlm-cta" type="button" data-ready={ready} onClick={onAnalyze} disabled={aiBlocked} aria-describedby={aiBlocked ? 'mlm-ai-hint' : undefined}>
          <Icon name="sparkle" size={18} />Analizar con IA
        </button>
      </footer>
    </>
  );
}
