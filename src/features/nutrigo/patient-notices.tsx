import { createContext, useContext, useEffect, useMemo, useState, useRef, type ReactNode } from 'react';
import { plansApi } from '../../api/plans';
import { planHandoverNotice } from '../../types/plan-handover';
import { Icon, type IconName } from '../../components/shared/Icon';
import type { ShowroomPage } from '../../components/nutrigo/ShowroomPanels';
import type { ShowroomPatient } from '../../components/nutrigo/showroom-model';
import { unreadCount } from '../../components/nutrigo/message-receipts';
import { unreadBadge } from './patient-navigation';
import { useFeeNotice } from './fee-notice';
import './patient-menu-sheet.css';

export type PatientNotice = { id: string; icon: IconName; title: string; note: string; page: ShowroomPage };
export type PatientNotices = { items: PatientNotice[]; unreadMessages: number };

const EMPTY: PatientNotices = { items: [], unreadMessages: 0 };

/** Avisos reales de la paciente: mensajes sin leer, consulta por confirmar, cuota y plan nuevo. Nada inventado. */
export function buildNotices(
  patient: Pick<ShowroomPatient, 'messages' | 'appointment'>,
  feeNotice: string | null,
  now: Date = new Date(),
  planNotice: { title: string; note: string } | null = null,
): PatientNotices {
  const items: PatientNotice[] = [];
  const unread = unreadCount(patient.messages ?? [], 'patient');
  if (unread > 0) items.push({ id: 'messages', icon: 'message', title: unread === 1 ? 'Tenés 1 mensaje sin leer' : `Tenés ${unread} mensajes sin leer`, note: 'Tu nutricionista te escribió.', page: 'mensajes' });
  const appointment = patient.appointment;
  const startsAt = appointment?.starts_at ? Date.parse(appointment.starts_at) : NaN;
  if (appointment && !appointment.patient_reply && (Number.isNaN(startsAt) || startsAt > now.getTime())) {
    items.push({ id: 'appointment', icon: 'calendar', title: 'Confirmá tu próxima consulta', note: appointment.when, page: 'agenda' });
  }
  if (feeNotice) items.push({ id: 'fee', icon: 'wallet', title: 'Tenés una cuota para revisar', note: feeNotice, page: 'pagos' });
  if (planNotice) items.push({ id: 'plan', icon: 'list', title: planNotice.title, note: planNotice.note, page: 'plan' });
  return { items, unreadMessages: unread };
}

const NoticesContext = createContext<PatientNotices>(EMPTY);

export function PatientNoticesProvider({ patient, patientId, children }: { patient: Pick<ShowroomPatient, 'messages' | 'appointment'>; patientId?: string; children: ReactNode }) {
  const feeNotice = useFeeNotice();
  const [planNotice, setPlanNotice] = useState<{ title: string; note: string } | null>(null);
  useEffect(() => {
    if (!patientId) return undefined;
    let active = true;
    const load = () => {
      plansApi.published(patientId)
        .then(result => { if (active) setPlanNotice(planHandoverNotice(result.handover)); })
        .catch(() => undefined);
    };
    load();
    window.addEventListener('plan-v:plan-handover', load);
    return () => { active = false; window.removeEventListener('plan-v:plan-handover', load); };
  }, [patientId]);
  const value = useMemo(() => buildNotices(patient, feeNotice, new Date(), planNotice), [patient, feeNotice, planNotice]);
  return <NoticesContext.Provider value={value}>{children}</NoticesContext.Provider>;
}

export const usePatientNotices = (): PatientNotices => useContext(NoticesContext);

/** Cifra para el globo del ícono de avisos del archivo: nada si no hay avisos. */
export const noticesBadge = (count: number): string | null => unreadBadge(count);

/** Panel de avisos: misma hoja del menú, con las piezas del archivo (Poppins, crema y verde). */
export function NoticesSheet({ items, onNavigate, onClose }: { items: PatientNotice[]; onNavigate: (page: ShowroomPage) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    return () => { dialog?.close(); if (opener?.isConnected) opener.focus(); };
  }, []);
  return (
    <dialog ref={ref} className="pms" aria-label="Avisos" onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { if (event.target === ref.current) onClose(); }}>
      <div className="pms-sheet">
        <span className="pms-handle" aria-hidden="true" />
        <header className="pms-head">
          <span className="pms-who"><strong>Avisos</strong><small>{items.length ? 'Lo que necesita tu atención' : 'Estás al día'}</small></span>
          <button type="button" className="pms-close" onClick={onClose} aria-label="Cerrar avisos">×</button>
        </header>
        <nav aria-label="Avisos">
          {items.length === 0
            ? <p className="pms-empty">No tenés avisos nuevos.</p>
            : <ul className="pms-list">{items.map(item => (
              <li key={item.id}>
                <button type="button" className="pms-row" onClick={() => { onClose(); onNavigate(item.page); }}>
                  <span className="pms-icon" aria-hidden="true"><Icon name={item.icon} size={18} /></span>
                  <span className="pms-text"><span className="pms-label">{item.title}</span><small>{item.note}</small></span>
                  <span className="pms-chevron" aria-hidden="true"><Icon name="chevron" size={16} /></span>
                </button>
              </li>
            ))}</ul>}
        </nav>
      </div>
    </dialog>
  );
}
