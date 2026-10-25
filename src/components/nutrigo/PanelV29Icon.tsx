import { PANEL_V29_ICONS, type PanelV29IconName } from './panel-v29-icons';

/** `svg()` del boceto v29: el trazo lo pinta la hoja, no un atributo propio. */
export function PanelV29Icon({ name, className = 'i', size }: { name: PanelV29IconName; className?: string; size?: number }) {
  return <svg viewBox="0 0 24 24" className={className} style={size ? { width: size, height: size } : undefined} aria-hidden="true" dangerouslySetInnerHTML={{ __html: PANEL_V29_ICONS[name] }} />;
}
