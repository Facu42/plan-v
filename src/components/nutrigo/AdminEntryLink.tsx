import { PanelV29Icon } from './PanelV29Icon';

/** Acceso visible al centro de mando. Misma pieza del menú, solo para quien también administra. */
export function AdminEntryLink() {
  return (
    <a className="nv pv-admin-entry" href="/admin" title="Admin">
      <PanelV29Icon name="gear" />
      <span className="lbl">Admin</span>
    </a>
  );
}
