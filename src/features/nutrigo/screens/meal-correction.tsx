import { useRef, useState } from 'react';
import { FigmaRecordDialog } from '../../../components/nutrigo/FigmaPatientFront';

const SLOTS = ['Desayuno', 'Colación', 'Almuerzo', 'Merienda', 'Cena', 'Extra'] as const;

export type MealCorrectionTarget = {
  id: string;
  slot: string;
  description: string | null;
  status: string;
  title: string;
};

/** El archivo no dibuja esta hoja. Se arma con el diálogo de registros que ya usa el diario. */
export function MealCorrectionDialog({ meal, busy, error, onClose, onCorrect, onDelete, onRequest }: {
  meal: MealCorrectionTarget;
  busy: boolean;
  error: string;
  onClose: () => void;
  onCorrect: (slot: string, description: string | null) => void;
  onDelete: () => void;
  onRequest: (note: string, clientId: string) => void;
}) {
  const pending = meal.status === 'pending_review';
  const [slot, setSlot] = useState(SLOTS.includes(meal.slot as typeof SLOTS[number]) ? meal.slot : 'Almuerzo');
  const [description, setDescription] = useState(meal.description ?? '');
  const [note, setNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const client = useRef({ note: '', id: '' });
  const clientId = (value: string) => {
    if (client.current.note !== value || !client.current.id) client.current = { note: value, id: crypto.randomUUID() };
    return client.current.id;
  };
  return <FigmaRecordDialog title={pending ? 'Corregir esta comida' : 'Pedir una corrección'} onClose={onClose} closeLabel="Cerrar corrección">
    <p className="mb-[12px] text-[14px] text-[#272932]">{meal.title}</p>
    {pending ? <form className="flex flex-col gap-[12px] text-[14px] text-[#272932]" onSubmit={event => { event.preventDefault(); onCorrect(slot, description.trim() ? description.trim() : null); }}>
      <label className="flex flex-col gap-[4px]">Momento del día
        <select value={slot} onChange={event => setSlot(event.target.value)} disabled={busy}>{SLOTS.map(item => <option key={item}>{item}</option>)}</select>
      </label>
      <label className="flex flex-col gap-[4px]">Qué comiste
        <textarea value={description} onChange={event => setDescription(event.target.value)} maxLength={1000} rows={3} disabled={busy} />
      </label>
      <p>Todavía no está revisada: el cambio queda para tu nutricionista. Los números siguen en revisión.</p>
      {error && <p role="alert">{error}</p>}
      <div className="flex flex-wrap gap-[8px]">
        <button type="submit" disabled={busy} className="rounded-[8px] bg-[#c2e66e] px-[16px] py-[10px] text-[#272932]">{busy ? 'Guardando…' : 'Guardar corrección'}</button>
        <button type="button" disabled={busy} onClick={() => setConfirmDelete(true)} className="rounded-[8px] border border-[#e1e1e2] px-[16px] py-[10px]">Borrar esta comida</button>
      </div>
      {confirmDelete && <div className="flex flex-col gap-[8px]">
        <p>Si la borrás, tu nutricionista ya no la va a ver.</p>
        <button type="button" disabled={busy} onClick={onDelete} className="rounded-[8px] border border-[#e1e1e2] px-[16px] py-[10px]">Sí, borrarla</button>
      </div>}
    </form> : <form className="flex flex-col gap-[12px] text-[14px] text-[#272932]" onSubmit={event => { event.preventDefault(); onRequest(note.trim(), clientId(note.trim())); }}>
      <p>Tu nutricionista ya la revisó. No se puede cambiar desde acá: pedile que la corrija.</p>
      <label className="flex flex-col gap-[4px]">Qué hay que corregir
        <textarea value={note} onChange={event => setNote(event.target.value)} maxLength={500} minLength={1} rows={3} required disabled={busy} />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={busy || note.trim().length < 1} className="rounded-[8px] bg-[#c2e66e] px-[16px] py-[10px] text-[#272932]">{busy ? 'Enviando…' : 'Pedir corrección'}</button>
    </form>}
  </FigmaRecordDialog>;
}
