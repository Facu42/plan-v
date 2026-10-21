import { PANEL_BOCETO_ICONS, type PanelBocetoIconName } from './panel-boceto-icons';

/** `ic(n, s)` del boceto: mismos atributos y trazos. Los trazos son constantes generadas del boceto, nunca datos de usuarios. */
export function PanelBocetoIcon({ name, size }: { name: PanelBocetoIconName; size?: number }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={size ? { width: size, height: size } : undefined} aria-hidden="true" dangerouslySetInnerHTML={{ __html: PANEL_BOCETO_ICONS[name] }} />;
}
