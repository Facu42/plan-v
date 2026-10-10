import { useEffect, useRef } from 'react';
import { Icon, type IconName } from '../../components/shared/Icon';
import type { ShowroomPage } from '../../components/nutrigo/ShowroomPanels';
import { patientNavBinding, patientNavigation } from './patient-navigation';
import { SourceView, type SourceNode } from './SourceView';
import { translateSource } from './translation';
import type { InstallOffer } from '../../pwa/install-offer';
import './patient-menu-sheet.css';

const ICONS: Partial<Record<ShowroomPage, IconName>> = {
  inicio: 'grid', agenda: 'calendar', mensajes: 'message', recetas: 'leaf', plan: 'list',
  compras: 'check', diario: 'edit', progreso: 'trend', ejercicio: 'heart', recursos: 'sparkle',
  pagos: 'wallet', ficha: 'contact',
};

const MAIN_PAGES = Object.entries(patientNavigation).map(([label, page]) => ({ page, label: translateSource(label) }));

/** Página abierta según la dirección (/app/<página>), para resaltar su fila. */
const currentPage = (): string => (typeof window === 'undefined' ? '' : window.location.pathname.split('/')[2] ?? '');

type Props = {
  patientName: string;
  unread?: number;
  feeNotice?: string | null;
  /** En el celular la tarjeta amarilla no está a la vista: la invitación a instalar va como fila de «Mi cuenta». */
  installOffer?: Pick<InstallOffer, 'title' | 'card'> | null;
  onInstall?: () => void;
  /** En el celular no hay campana en el marco: los avisos van como fila de «Mi cuenta». */
  noticeCount?: number;
  onOpenNotices?: () => void;
  /** «Menu Nav» original del marco de escritorio del archivo; sin él se usa una lista armada con sus tokens. */
  menuNav?: SourceNode | null;
  onNavigate: (page: ShowroomPage) => void;
  onSignOut?: () => void;
  onClose: () => void;
};

/**
 * Menú de la paciente como hoja inferior (celular) o tarjeta centrada (escritorio).
 * Figma no dibuja este menú: se arma con las piezas del archivo (Poppins, Cream/Green, radio 16/12).
 */
export function PatientMenuSheet({ patientName, unread = 0, feeNotice = null, installOffer = null, onInstall, noticeCount = 0, onOpenNotices, menuNav = null, onNavigate, onSignOut, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const active = currentPage();
  const initial = (patientName.trim()[0] ?? 'P').toUpperCase();

  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    return () => { dialog?.close(); if (opener?.isConnected) opener.focus(); };
  }, []);

  const go = (page: ShowroomPage) => { onClose(); onNavigate(page); };
  const row = (page: ShowroomPage, label: string, note?: string | null, badge?: number) => (
    <li key={page}>
      <button type="button" className="pms-row" aria-current={active === page ? 'page' : undefined} onClick={() => go(page)}>
        <span className="pms-icon" aria-hidden="true"><Icon name={ICONS[page] ?? 'grid'} size={18} /></span>
        <span className="pms-text"><span className="pms-label">{label}</span>{note && <small>{note}</small>}</span>
        {badge ? <span className="pms-badge" aria-label={`${badge} sin leer`}>{badge}</span> : null}
        <span className="pms-chevron" aria-hidden="true"><Icon name="chevron" size={16} /></span>
      </button>
    </li>
  );

  return (
    <dialog ref={ref} className="pms" aria-label="Menú" onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === ref.current) onClose(); }}>
      <div className="pms-sheet">
        <span className="pms-handle" aria-hidden="true" />
        <header className="pms-head">
          <span className="pms-avatar" aria-hidden="true">{initial}</span>
          <span className="pms-who"><strong>{patientName}</strong><small>Paciente</small></span>
          <button type="button" className="pms-close" onClick={onClose} aria-label="Cerrar menú">×</button>
        </header>
        <nav aria-label="Navegación">
          {menuNav
            ? <div className="mcp-nutrigo pms-figma"><SourceView source={menuNav} resolve={node => patientNavBinding(node, go, unread)} translate={translateSource} /></div>
            : <ul className="pms-list">{MAIN_PAGES.map(({ page, label }) => row(page, label, null, page === 'mensajes' ? unread : 0))}</ul>}
          <p className="pms-group">Mi cuenta</p>
          <ul className="pms-list">
            {onOpenNotices && (
              <li>
                <button type="button" className="pms-row" onClick={() => { onClose(); onOpenNotices(); }}>
                  <span className="pms-icon" aria-hidden="true"><Icon name="bell" size={18} /></span>
                  <span className="pms-text"><span className="pms-label">Avisos</span><small>{noticeCount ? `${noticeCount} para revisar` : 'Estás al día'}</small></span>
                  {noticeCount ? <span className="pms-badge" aria-label={`${noticeCount} avisos`}>{noticeCount}</span> : null}
                  <span className="pms-chevron" aria-hidden="true"><Icon name="chevron" size={16} /></span>
                </button>
              </li>
            )}
            {row('pagos', 'Pagos', feeNotice)}
            {row('ficha', 'Mi ficha y permisos')}
            {installOffer && onInstall && (
              <li>
                <button type="button" className="pms-row" onClick={() => { onClose(); onInstall(); }}>
                  <span className="pms-icon" aria-hidden="true"><Icon name="sparkle" size={18} /></span>
                  <span className="pms-text"><span className="pms-label">{installOffer.title}</span><small>{installOffer.card}</small></span>
                  <span className="pms-chevron" aria-hidden="true"><Icon name="chevron" size={16} /></span>
                </button>
              </li>
            )}
          </ul>
        </nav>
        {onSignOut && <button type="button" className="pms-signout" onClick={() => { onClose(); onSignOut(); }}>Cerrar sesión</button>}
      </div>
    </dialog>
  );
}
