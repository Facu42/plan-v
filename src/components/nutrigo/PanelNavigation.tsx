import { useState } from 'react';
import { ArrowLeft, CaretDown } from '@phosphor-icons/react';
import type { Patient } from '../../types';
import { Icon, type IconName } from '../shared/Icon';

export type PanelNavItem = { label: string; icon: IconName; href: string; children?: { label: string; href: string; count?: number }[] };
export function panelNavGroups(patients: readonly Patient[], unread: number, admin: boolean): { title: string; items: PanelNavItem[] }[] {
  const active = patients.filter(p => !p.archived_at);
  return [
    { title: 'Gestión', items: [
      { label: 'Inicio', icon: 'home', href: '/crm/inicio' },
      { label: 'Pacientes', icon: 'users', href: '/crm/pacientes', children: [
        { label: 'Todas', href: '/crm/pacientes', count: active.length },
        { label: 'Necesitan atención', href: '/crm/pacientes?filtro=attention', count: active.every(p => p.weekly_registration) ? active.filter(p => (p.weekly_registration?.pending_review ?? 0) > 0).length : undefined },
        { label: 'Acceso pendiente', href: '/crm/pacientes?filtro=unlinked', count: active.filter(p => p.has_account === false).length },
        { label: 'Archivadas', href: '/crm/pacientes?filtro=archived', count: patients.length - active.length },
      ] },
      { label: 'Agenda', icon: 'calendar', href: '/crm/agenda', children: [
        { label: 'Semana', href: '/crm/agenda' },
        { label: 'Reservas por confirmar', href: '/crm/agenda?agenda=reservas' },
        { label: 'Horarios y precios', href: '/crm/agenda?agenda=horarios' },
      ] },
      { label: 'Cobranzas', icon: 'wallet', href: '/crm/cobranzas', children: [
        { label: 'Cuotas del mes', href: '/crm/cobranzas' },
        { label: 'Vencidas', href: '/crm/cobranzas?filtro=deben' },
        { label: 'Recordatorios', href: '/crm/cobranzas?filtro=deben&recordatorios=1' },
      ] },
      { label: 'Página pública', icon: 'contact', href: '/crm/agenda?agenda=publica' },
    ] },
    { title: 'Acompañamiento', items: [
      { label: 'Asistente IA', icon: 'sparkle', href: '/crm/desarrollo?modulo=asistente-ia' },
      { label: 'Seguimiento', icon: 'heart', href: '/crm/seguimiento' },
      { label: 'Mensajes', icon: 'message', href: '/crm/mensajes', children: [
        { label: 'Todas', href: '/crm/mensajes' }, { label: 'Sin leer', href: '/crm/mensajes?filtro=unread', count: unread },
      ] },
      { label: 'Progreso', icon: 'trend', href: '/crm/progreso-global' },
    ] },
    { title: 'Plan', items: [
      { label: 'Planes', icon: 'list', href: '/crm/plan', children: [
        { label: 'Todos los planes', href: '/crm/plan?planes=todos' },
        { label: 'Armar o editar', href: '/crm/plan' },
      ] },
      { label: 'Alimentos', icon: 'leaf', href: '/crm/alimentos' },
      { label: 'Recetas', icon: 'leaf', href: '/crm/biblioteca?biblioteca=recetas' },
      { label: 'Equivalencias', icon: 'list', href: '/crm/desarrollo?modulo=equivalencias' },
      { label: 'Modelos', icon: 'grid', href: '/crm/modelos' },
    ] },
    { title: 'Recursos', items: [
      { label: 'Biblioteca', icon: 'pin', href: '/crm/biblioteca?biblioteca=recursos' },
      { label: 'Centro de ayuda', icon: 'message', href: '/crm/desarrollo?modulo=ayuda' },
    ] },
    { title: 'Cuenta', items: [
      { label: 'Equipo', icon: 'users', href: '/crm/desarrollo?modulo=equipo' },
      { label: 'Configuración', icon: 'grid', href: '/crm/desarrollo?modulo=configuracion' },
      { label: 'Todas las funciones', icon: 'grid', href: '/crm/desarrollo' },
      ...(admin ? [{ label: 'Panel del servicio', icon: 'wallet' as const, href: '/crm/servicio' }] : []),
    ] },
  ];
}

/** Sólo las opciones del menú forman parte de su selección; paciente y otros parámetros se conservan en la ficha. */
export function panelNavCurrent(href: string, current: string) {
  const target = new URL(href, 'https://plan.v');
  const location = new URL(current, 'https://plan.v');
  if (target.pathname !== location.pathname) return false;
  return ['filtro', 'agenda', 'biblioteca', 'modulo', 'planes', 'recordatorios'].every(key => target.searchParams.get(key) === location.searchParams.get(key));
}

export function PanelNavigation({ patients, unread, admin, current, collapsed, onCollapse, onOpen }: {
  patients: readonly Patient[]; unread: number; admin: boolean; current: string; collapsed: boolean; onCollapse: () => void; onOpen: (href: string) => void;
}) {
  const [closed, setClosed] = useState<string | null>(null);
  const link = (href: string, label: string, icon?: IconName, count?: number, active = false) => <a href={href} title={collapsed ? label : undefined} aria-label={collapsed ? label : undefined} aria-current={active ? 'page' : undefined} onClick={event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onOpen(href);
  }}>{icon && <Icon name={icon} size={18} />}<span className="pn-nav-label">{label}</span>{count !== undefined && <b className="pn-nav-count">{count}</b>}</a>;
  return <>
    <button type="button" className="pn-collapse" aria-label={collapsed ? 'Desplegar el menú' : 'Plegar el menú'} aria-expanded={!collapsed} aria-controls="pn-panel-nav" onClick={onCollapse}><ArrowLeft size={16} aria-hidden="true" /></button>
    <nav className="pn-panel-nav" id="pn-panel-nav" aria-label="Menú del consultorio">{panelNavGroups(patients, unread, admin).map(group => <div className="pn-nav-group" key={group.title}><p className="pn-nav-heading">{group.title}</p>{group.items.map(item => {
      const childCurrent = item.children?.some(child => panelNavCurrent(child.href, current));
      const active = panelNavCurrent(item.href, current) || childCurrent || (item.label === 'Pacientes' && current.split('?')[0] === '/crm/ficha');
      const expanded = Boolean(item.children && active && closed !== current && !collapsed);
      const id = `pn-sub-${item.label.toLowerCase().replace(/\s/g, '-')}`;
      return <div className={`pn-nav-item${active ? ' pn-current' : ''}`} key={item.label}>
        <div className="pn-nav-row">{link(item.href, item.label, item.icon, item.label === 'Mensajes' && unread > 0 ? unread : undefined, Boolean(active))}
          {item.children && <button type="button" className="pn-nav-expander" aria-label={`${expanded ? 'Cerrar' : 'Abrir'} submenú de ${item.label}`} aria-expanded={expanded} aria-controls={id} onClick={() => {
            if (collapsed) onCollapse();
            if (!active) { setClosed(null); onOpen(item.href); } else setClosed(expanded ? current : null);
          }}><CaretDown size={14} aria-hidden="true" /></button>}
        </div>
        {item.children && <div id={id} className="pn-submenu" data-open={expanded} inert={!expanded}><div>{item.children.map(child => <div key={child.href}>{link(child.href, child.label, undefined, child.count, panelNavCurrent(child.href, current))}</div>)}</div></div>}
      </div>;
    })}</div>)}</nav>
  </>;
}
