import { useState } from 'react';
import { FigmaRecordDialog } from './FigmaPatientFront';
import { planWeekdayLabel } from '../../types/plans';
import { NvButton } from './primitives';

export function PlanCopyDayDialog({ source, dates, occupied, descriptions, itemCount, onCopy, onClose }: {
  source: string; dates: string[]; occupied: string[]; descriptions: string[]; itemCount: number;
  onCopy: (dates: string[]) => void; onClose: () => void;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const exceeds = itemCount + descriptions.length * selected.length > 42;
  return <FigmaRecordDialog title="Copiar día" closeLabel="Cerrar copia de día" onClose={onClose} className="plan-copy-day">
    <p>Origen: {planWeekdayLabel(source)} {source}. Se copiarán las indicaciones del borrador, sus porciones, notas y versiones de recetas.</p>
    <ul>{descriptions.map((description, index) => <li key={index}>{description}</li>)}</ul>
    <fieldset><legend>Días de destino</legend>{dates.filter(date => date !== source).map(date => {
      const blocked = occupied.includes(date);
      return <label key={date}><input type="checkbox" disabled={blocked} checked={selected.includes(date)} onChange={event => setSelected(current => event.target.checked ? [...current, date] : current.filter(value => value !== date))} />{planWeekdayLabel(date)} {date}{blocked ? ' · Con contenido, protegido' : ' · Vacío'}</label>;
    })}</fieldset>
    <p>La copia agregará {descriptions.length * selected.length} {descriptions.length * selected.length === 1 ? 'indicación' : 'indicaciones'} en {selected.length} {selected.length === 1 ? 'día' : 'días'}. Los demás días conservarán su contenido. Después deberás guardar el borrador.</p>
    {exceeds && <p role="alert">Supera el límite de 42 indicaciones. Elegí menos días.</p>}
    <footer className="meal-plan-actions"><NvButton type="button" disabled={!selected.length || exceeds} onClick={() => onCopy(selected)}>Copiar al borrador</NvButton><NvButton type="button" className="nv-ghost" onClick={onClose}>Cancelar</NvButton></footer>
  </FigmaRecordDialog>;
}
