import { Fragment, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import type { Patient } from '../../types';
import { PanelV29Icon } from './PanelV29Icon';
import type { PanelV29IconName } from './panel-v29-icons';

// Menú del boceto v29 con las rutas y los números que la app ya tiene.
// Los grupos quedan en el orden de la app: el boceto dibuja otros nombres y otro orden, y eso no se inventa acá.
export type PanelNavChild = { label: string; href: string; count?: number };
export type PanelNavItem = { label: string; glyph: PanelV29IconName; href: string; count?: number; hot?: boolean; children?: PanelNavChild[] };
export function panelNavGroups(patients: readonly Patient[], unread: number, admin: boolean): { title: string; items: PanelNavItem[] }[] {
  const active = patients.filter(p => !p.archived_at);
  const toReview = active.reduce((sum, p) => sum + (p.weekly_registration?.pending_review ?? 0), 0);
  return [
    { title: 'Gestión', items: [
      { label: 'Inicio', glyph: 'grid', href: '/crm/inicio' },
      { label: 'Pacientes', glyph: 'users', href: '/crm/pacientes', count: active.length, children: [
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
      { label: 'Seguimiento', glyph: 'heart', href: '/crm/seguimiento', count: toReview, hot: true },
      { label: 'Mensajes', glyph: 'chat', href: '/crm/mensajes', count: unread, children: [
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
      { label: 'Alimentos', glyph: 'fork', href: '/crm/alimentos' },
      { label: 'Recetas', glyph: 'fork', href: '/crm/biblioteca?biblioteca=recetas' },
      { label: 'Equivalencias', glyph: 'swap', href: '/crm/desarrollo?modulo=equivalencias' },
      { label: 'Modelos', glyph: 'copy', href: '/crm/modelos' },
    ] },
    { title: 'Recursos', items: [
      { label: 'Biblioteca', glyph: 'file', href: '/crm/biblioteca?biblioteca=recursos' },
      { label: 'Centro de ayuda', glyph: 'shield', href: '/crm/desarrollo?modulo=ayuda' },
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

function placePill(nav: HTMLElement) {
  const pill = nav.querySelector<HTMLElement>('.nvpill');
  const on = nav.querySelector<HTMLElement>('.nv.on');
  if (!pill) return;
  if (!on) { pill.style.opacity = '0'; return; }
  pill.style.opacity = '1';
  const navBox = nav.getBoundingClientRect();
  const onBox = on.getBoundingClientRect();
  const scale = navBox.height / nav.offsetHeight || 1;
  let y = (onBox.top - navBox.top) / scale;
  nav.querySelectorAll<HTMLElement>('.subw').forEach(wrap => {
    if (wrap.compareDocumentPosition(on) & Node.DOCUMENT_POSITION_FOLLOWING) {
      const open = wrap.classList.contains('open') && !nav.closest('.app')?.classList.contains('mcol');
      const end = open ? (wrap.firstElementChild as HTMLElement | null)?.scrollHeight ?? 0 : 0;
      y += end - wrap.getBoundingClientRect().height / scale;
    }
  });
  pill.style.transform = `translateY(${y + nav.scrollTop}px)`;
  pill.style.height = `${on.offsetHeight}px`;
}

/** Menú (`.navs` / `.nv`) del boceto v29. */
export function PanelNavigation({ patients, unread, admin, current, collapsed, onOpen }: {
  patients: readonly Patient[]; unread: number; admin: boolean; current: string; collapsed: boolean; onOpen: (href: string) => void;
}) {
  const groups = panelNavGroups(patients, unread, admin);
  const activeParent = groups.flatMap(g => g.items).find(item => item.children && panelNavActive(item, current))?.label ?? '';
  // Como `openSub` del boceto: al cambiar de pantalla queda abierto sólo el submenú de la sección activa.
  const [open, setOpen] = useState(() => ({ at: current, labels: new Set([activeParent]) }));
  const labels = open.at === current ? open.labels : new Set([activeParent]);
  const navRef = useRef<HTMLDivElement>(null);
  const openKey = [...labels].sort().join('|');
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const place = () => placePill(nav);
    place();
    nav.addEventListener('scroll', place, { passive: true });
    window.addEventListener('resize', place);
    return () => { nav.removeEventListener('scroll', place); window.removeEventListener('resize', place); };
  }, [current, collapsed, openKey, patients, unread, admin]);
  const go = (href: string) => (event: MouseEvent) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onOpen(href);
  };
  return <div className="navs" id="pv-panel-nav" ref={navRef}>
    <span className="nvpill" aria-hidden="true" />
    {groups.map(group => <nav className="grp" aria-label={group.title} key={group.title}>
      <h6>{group.title}</h6>
      {group.items.map(item => {
        const on = panelNavActive(item, current);
        const isOpen = labels.has(item.label);
        const count = item.count != null ? <span className={`ct num${item.hot ? ' hot' : ''}`}>{item.count}</span> : null;
        if (!item.children) return <a className={`nv${on ? ' on' : ''}`} key={item.label} href={item.href} title={item.label} aria-label={collapsed ? item.label : undefined} aria-current={on ? 'page' : undefined} onClick={go(item.href)}>
          <PanelV29Icon name={item.glyph} /><span className="lbl">{item.label}</span>{count}
        </a>;
        return <Fragment key={item.label}>
          <div className={`nv${on ? ' on' : ''}`} title={item.label} aria-expanded={isOpen}>
            <a href={item.href} aria-label={collapsed ? item.label : undefined} aria-current={on ? 'page' : undefined} onClick={go(item.href)}>
              <PanelV29Icon name={item.glyph} /><span className="lbl">{item.label}</span>{count}
            </a>
            <button type="button" aria-expanded={isOpen} aria-controls={`pv-sub-${item.glyph}`} aria-label={`${isOpen ? 'Cerrar' : 'Abrir'} ${item.label}`} onClick={event => {
              event.stopPropagation();
              const next = new Set(labels); if (next.has(item.label)) next.delete(item.label); else next.add(item.label);
              setOpen({ at: current, labels: next });
            }}><PanelV29Icon name="chev" className="i car" /></button>
          </div>
          <div className={`subw${isOpen ? ' open' : ''}`} id={`pv-sub-${item.glyph}`} inert={!isOpen || collapsed}><div className="subi">{item.children.map((child, index) => {
            const childOn = on && panelNavCurrent(child.href, current);
            return <a className={`si${childOn ? ' on' : ''}`} key={child.href} href={child.href} style={{ ['--i' as string]: index }} aria-current={childOn ? 'page' : undefined} onClick={go(child.href)}><span>{child.label}</span>{child.count ? <b>{child.count}</b> : null}</a>;
          })}</div></div>
        </Fragment>;
      })}
    </nav>)}
  </div>;
}
