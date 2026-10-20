import { useState, type MouseEvent } from 'react';
import type { Patient } from '../../types';
import { PanelBocetoIcon } from './PanelBocetoIcon';
import type { PanelBocetoIconName } from './panel-boceto-icons';

// Menú del boceto (`NAV` y `SUBS` de design/panel-nutri/bocetos.html) con las rutas y los números reales.
export type PanelNavChild = { label: string; href: string; count?: number };
export type PanelNavItem = { label: string; glyph: PanelBocetoIconName; href: string; count?: number; children?: PanelNavChild[] };
export function panelNavGroups(patients: readonly Patient[], unread: number, admin: boolean): { title: string; items: PanelNavItem[] }[] {
  const active = patients.filter(p => !p.archived_at);
  const toReview = active.reduce((sum, p) => sum + (p.weekly_registration?.pending_review ?? 0), 0);
  return [
    { title: 'Gestión', items: [
      { label: 'Inicio', glyph: 'grid', href: '/crm/inicio' },
      { label: 'Pacientes', glyph: 'users', href: '/crm/pacientes', children: [
        { label: 'Todas', href: '/crm/pacientes', count: active.length },
        { label: 'Necesitan atención', href: '/crm/pacientes?filtro=attention', count: active.every(p => p.weekly_registration) ? active.filter(p => (p.weekly_registration?.pending_review ?? 0) > 0).length : undefined },
        { label: 'Acceso pendiente', href: '/crm/pacientes?filtro=unlinked', count: active.filter(p => p.has_account === false).length },
        { label: 'Archivadas', href: '/crm/pacientes?filtro=archived', count: patients.length - active.length },
      ] },
      { label: 'Agenda', glyph: 'cal', href: '/crm/agenda', children: [
        { label: 'Semana', href: '/crm/agenda' },
        { label: 'Reservas por confirmar', href: '/crm/agenda?agenda=reservas' },
        { label: 'Horarios y precios', href: '/crm/agenda?agenda=horarios' },
      ] },
      { label: 'Cobranzas', glyph: 'coin', href: '/crm/cobranzas', children: [
        { label: 'Cuotas del mes', href: '/crm/cobranzas' },
        { label: 'Vencidas', href: '/crm/cobranzas?filtro=deben' },
        { label: 'Recordatorios', href: '/crm/cobranzas?filtro=deben&recordatorios=1' },
      ] },
      { label: 'Página pública', glyph: 'globe', href: '/crm/agenda?agenda=publica' },
    ] },
    { title: 'Acompañamiento', items: [
      { label: 'Asistente IA', glyph: 'spark', href: '/crm/desarrollo?modulo=asistente-ia' },
      { label: 'Seguimiento', glyph: 'pulse', href: '/crm/seguimiento', count: toReview || undefined },
      { label: 'Mensajes', glyph: 'chat', href: '/crm/mensajes', count: unread || undefined, children: [
        { label: 'Todas', href: '/crm/mensajes' },
        { label: 'Sin leer', href: '/crm/mensajes?filtro=unread', count: unread },
        // Respuestas guardadas: la pantalla llega con la fase F; mientras tanto abre Mensajes.
        { label: 'Respuestas guardadas', href: '/crm/mensajes?vista=respuestas' },
      ] },
      { label: 'Progreso', glyph: 'trend', href: '/crm/progreso-global' },
    ] },
    { title: 'Plan', items: [
      { label: 'Planes', glyph: 'clip', href: '/crm/plan', children: [
        { label: 'Todos los planes', href: '/crm/plan?planes=todos' },
        { label: 'Armar o editar', href: '/crm/plan' },
        // Pedidos de cambio: la pantalla llega con la fase G; mientras tanto abre el plan.
        { label: 'Pedidos de cambio', href: '/crm/plan?planes=pedidos' },
      ] },
      { label: 'Alimentos', glyph: 'apple', href: '/crm/alimentos' },
      { label: 'Recetas', glyph: 'fork', href: '/crm/biblioteca?biblioteca=recetas' },
      { label: 'Equivalencias', glyph: 'swap', href: '/crm/desarrollo?modulo=equivalencias' },
      { label: 'Modelos', glyph: 'layers', href: '/crm/modelos' },
    ] },
    { title: 'Recursos', items: [
      { label: 'Biblioteca', glyph: 'mark', href: '/crm/biblioteca?biblioteca=recursos' },
      { label: 'Centro de ayuda', glyph: 'help', href: '/crm/desarrollo?modulo=ayuda' },
    ] },
    { title: 'Cuenta', items: [
      { label: 'Equipo', glyph: 'team', href: '/crm/desarrollo?modulo=equipo' },
      { label: 'Configuración', glyph: 'gear', href: '/crm/desarrollo?modulo=configuracion' },
      ...(admin ? [{ label: 'Panel del servicio', glyph: 'shield' as const, href: '/crm/servicio' }] : []),
    ] },
  ];
}

/** Sólo las opciones del menú forman parte de su selección; paciente y otros parámetros se conservan en la ficha. */
export function panelNavCurrent(href: string, current: string) {
  const target = new URL(href, 'https://plan.v');
  const location = new URL(current, 'https://plan.v');
  if (target.pathname !== location.pathname) return false;
  return ['filtro', 'agenda', 'biblioteca', 'modulo', 'planes', 'recordatorios', 'vista'].every(key => target.searchParams.get(key) === location.searchParams.get(key));
}

export function panelNavActive(item: PanelNavItem, current: string) {
  return panelNavCurrent(item.href, current) || Boolean(item.children?.some(child => panelNavCurrent(child.href, current))) || (item.label === 'Pacientes' && current.split('?')[0] === '/crm/ficha');
}

/** Menú (`nav.nvs`) de `shell()` en el boceto. */
export function PanelNavigation({ patients, unread, admin, current, collapsed, onOpen }: {
  patients: readonly Patient[]; unread: number; admin: boolean; current: string; collapsed: boolean; onOpen: (href: string) => void;
}) {
  const groups = panelNavGroups(patients, unread, admin);
  const activeParent = groups.flatMap(g => g.items).find(item => item.children && panelNavActive(item, current))?.label ?? '';
  // Como `openSub` del boceto: al cambiar de pantalla queda abierto sólo el submenú de la sección activa.
  const [open, setOpen] = useState(() => ({ at: current, labels: new Set([activeParent]) }));
  const labels = open.at === current ? open.labels : new Set([activeParent]);
  const go = (href: string) => (event: MouseEvent) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onOpen(href);
  };
  return <nav className="nvs" id="pv-panel-nav" aria-label="Menú">{groups.map(group => [
      <div className="gl" key={group.title}><span className="lbl">{group.title}</span></div>,
      ...group.items.map(item => {
        const on = panelNavActive(item, current);
        const isOpen = labels.has(item.label);
        // El boceto usa `div.ni`; el enlace real va adentro con `display:contents` para no cambiar su armado.
        const row = <div className={`ni${on ? ' on' : ''}`} key={item.children ? undefined : item.label} title={item.label} onClick={go(item.href)}>
          <a href={item.href} aria-label={collapsed ? item.label : undefined} aria-current={on ? 'page' : undefined}><PanelBocetoIcon name={item.glyph} /><span className="lbl">{item.label}</span>{item.count ? <span className="n">{item.count}</span> : null}</a>
          {item.children && <button type="button" className="nx" aria-expanded={isOpen} aria-controls={`pv-sub-${item.glyph}`} aria-label={`${isOpen ? 'Cerrar' : 'Abrir'} ${item.label}`} onClick={event => {
            event.stopPropagation();
            const next = new Set(labels); if (next.has(item.label)) next.delete(item.label); else next.add(item.label);
            setOpen({ at: current, labels: next });
          }}><PanelBocetoIcon name="chev" size={16} /></button>}
        </div>;
        if (!item.children) return row;
        return <div className={`ng${isOpen ? ' open' : ''}`} key={item.label}>{row}
          <div className="subw" id={`pv-sub-${item.glyph}`} inert={!isOpen || collapsed}><div className="subi">{item.children.map(child => {
            const childOn = on && panelNavCurrent(child.href, current);
            return <div className={`si${childOn ? ' on' : ''}`} key={child.href} onClick={go(child.href)}><a href={child.href} aria-current={childOn ? 'page' : undefined}><span>{child.label}</span>{child.count ? <b>{child.count}</b> : null}</a></div>;
          })}</div></div>
        </div>;
      }),
    ])}</nav>;
}
