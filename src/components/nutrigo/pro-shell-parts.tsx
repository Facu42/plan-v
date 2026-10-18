import type { ReactNode } from 'react';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import type { Patient } from '../../types';
import type { ShowroomPage } from './ShowroomPanels';
import { Icon } from '../shared/Icon';
import { PRO_NAV_GROUPS, rememberPatient, type ProNavItem } from './pro-nav';

const NAV_EASE = [0.22, 1, 0.36, 1] as const;

function followLink(event: React.MouseEvent<HTMLAnchorElement>, href: string, onOpen: (href: string) => void) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  onOpen(href);
}

export function ProNav({ page, search, hash, patientId, messageUnread, onOpen }: {
  page: ShowroomPage;
  search: URLSearchParams;
  hash: string;
  patientId?: string | null;
  messageUnread: number;
  onOpen: (href: string) => void;
}) {
  return <LayoutGroup id="pv-nav"><nav className="pv-nav" aria-label="Secciones del consultorio">{PRO_NAV_GROUPS.map((group) => <div className="pv-nav-group" key={group.title}>
    <p>{group.title}</p>
    {group.items.map((item) => <ProNavLink key={item.id} item={item} href={rememberPatient(item.href, patientId)} current={item.current(page, search, hash)} unread={item.id === 'mensajes' ? messageUnread : 0} onOpen={onOpen} />)}
  </div>)}</nav></LayoutGroup>;
}

function ProNavLink({ item, href, current, unread, onOpen }: {
  item: ProNavItem; href: string; current: boolean; unread: number; onOpen: (href: string) => void;
}) {
  const reduce = useReducedMotion();
  return <a href={href} aria-current={current ? 'page' : undefined} onClick={(event) => followLink(event, href, onOpen)}>
    {current && <motion.span className="pv-nav-pill" layoutId="pv-nav-active" transition={{ duration: reduce ? 0.15 : 0.25, ease: NAV_EASE }} />}
    <Icon name={item.icon} size={20} />
    <span>{item.label}</span>
    {item.soon && <small>Próximamente</small>}
    {unread > 0 && <b className="pv-count">{unread > 9 ? '9+' : unread}</b>}
  </a>;
}

export function ProMobileMore({ page, search, hash, patientId, onOpen }: {
  page: ShowroomPage; search: URLSearchParams; hash: string; patientId?: string | null; onOpen: (href: string) => void;
}) {
  return <>{PRO_NAV_GROUPS.map((group) => <section key={group.title} className="pv-more-group">
    <h3>{group.title}</h3>
    <div className="nv-more-grid">{group.items.map((item) => {
      const href = rememberPatient(item.href, patientId);
      return <a key={item.id} href={href} aria-current={item.current(page, search, hash) ? 'page' : undefined} onClick={(event) => followLink(event, href, onOpen)}>
        <Icon name={item.icon} size={20} /><span>{item.label}</span>{item.soon && <small>Próximamente</small>}
      </a>;
    })}</div>
  </section>)}</>;
}

export function ProRail({ patient, patients, onSelect, onOpen }: {
  patient: Patient | null;
  patients: Patient[];
  onSelect: (id: string) => void;
  onOpen: (href: string) => void;
}) {
  const id = patient?.id;
  const link = (href: string, label: string) => <a href={href} onClick={(event) => followLink(event, href, onOpen)}>{label}</a>;
  return <aside className="pv-rail" aria-label="Paciente abierta">
    <label className="pv-rail-pick">Paciente
      <select aria-label="Paciente abierta" value={id ?? ''} disabled={!patients.length} onChange={(event) => onSelect(event.target.value)}>
        {!id && <option value="">{patients.length ? 'Elegí una paciente' : 'Todavía no hay pacientes'}</option>}
        {patients.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
      </select>
    </label>
    {patient ? <>
      <h2 title={patient.name}>{patient.name}</h2>
      <p>{patient.goal?.trim() || 'Sin objetivo'}</p>
      <nav aria-label={`Accesos de ${patient.name}`}>
        {link(`/crm/ficha?paciente=${encodeURIComponent(patient.id)}&seccion=resumen`, 'Ficha')}
        {link(`/crm/ficha?paciente=${encodeURIComponent(patient.id)}&seccion=alimentario`, 'Registro')}
        {link(`/crm/plan?paciente=${encodeURIComponent(patient.id)}`, 'Plan')}
        {link(`/crm/ficha?paciente=${encodeURIComponent(patient.id)}&seccion=consultas`, 'Consulta')}
      </nav>
    </> : <p>{patients.length ? 'Elegí una paciente para abrir la ficha, el registro, el plan o una consulta.' : 'Cuando cargues la primera paciente, desde acá vas a abrir su ficha, su registro, su plan y sus consultas.'}</p>}
    {link('/crm/desarrollo?modulo=asistente-ia', 'Asistente de la cartera')}
  </aside>;
}

export function ComingSoon({ title, children }: { title: string; children: ReactNode }) {
  return <section className="pv-soon" aria-label={title}>
    <h2>{title}</h2>
    <p><span className="pv-pill">Próximamente</span></p>
    <p>{children}</p>
  </section>;
}
