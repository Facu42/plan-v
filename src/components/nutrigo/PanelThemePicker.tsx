import { Desktop, Moon, Sun } from '@phosphor-icons/react';
import type { PanelTheme } from './panel-preferences';

export function PanelThemePicker({ value, onChange, busy = false, status = '' }: { value: PanelTheme; onChange: (theme: PanelTheme) => void; busy?: boolean; status?: string }) {
  return <fieldset className="pn-theme-picker" disabled={busy}><legend>Apariencia del panel</legend>
    <div>{([{ id: 'light', label: 'Claro', Icon: Sun }, { id: 'dark', label: 'Oscuro', Icon: Moon }, { id: 'system', label: 'Como el sistema', Icon: Desktop }] as const).map(({ id, label, Icon }) => <label key={id}><input type="radio" name="panel-theme" value={id} checked={value === id} onChange={() => onChange(id)} /><Icon size={18} aria-hidden="true" /><span>{label}</span></label>)}</div>
    {status && <p role="status">{status}</p>}
  </fieldset>;
}
