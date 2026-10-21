import { useEffect, useRef, useState, type ReactNode } from 'react';
import { PanelBocetoIcon } from './PanelBocetoIcon';
import type { PanelBocetoIconName } from './panel-boceto-icons';
import './panel-boceto.css';
import './panel-boceto-app.css';

export type PanelAccountOption = { label: string; detail?: string; glyph: PanelBocetoIconName; onSelect: () => void };
export type PanelTab = { label: string; glyph: PanelBocetoIconName; href?: string; on?: boolean };
export type PanelHeader = { when?: string; title: string; search: string; wideSearch?: boolean; actions?: ReactNode };

/** Tema del boceto: `data-mock` en <html>, como hace `setTheme()` en bocetos.html. */
export function usePanelMock(dark: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.mock = dark ? 'dark' : 'light';
    return () => { delete root.dataset.mock; };
  }, [dark]);
}

/** `hdr()` e `inicio()` del boceto: título, buscador con Ctrl K, campana y acciones. */
function PanelHeaderBar({ header, bell, onSearch }: { header: PanelHeader; bell: ReactNode; onSearch: (query: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  useEffect(() => {
    const focus = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); input.current?.focus(); } };
    window.addEventListener('keydown', focus); return () => window.removeEventListener('keydown', focus);
  }, []);
  // Inicio en el celular (`phoneInicio()`): logo a la izquierda del saludo y sin el botón principal.
  return <div className={`hdr${header.when ? ' pv-home' : ''}`}>{header.when && <img className="pv-hdr-logo" src="/panel-boceto/logo.png" alt="" />}<div>{header.when && <div className="when">{header.when}</div>}<h1>{header.title}</h1></div>
    <form className="search" role="search" style={header.wideSearch ? undefined : { width: 280 }} onSubmit={event => { event.preventDefault(); onSearch(query.trim()); }}>
      <PanelBocetoIcon name="search" /><input ref={input} type="search" aria-label={header.search} placeholder={header.search} value={query} onChange={event => setQuery(event.target.value)} /><span className="kbd">Ctrl K</span>
    </form>
    {bell}{header.actions}</div>;
}

/** `shell()` del boceto: barra lateral (logo, menú, cuenta) y columna principal. En el celular suma la barra de abajo (`bnav()`). */
export function PanelBocetoShell({ dark, collapsed, onCollapse, menuOpen, onMenu, nav, brand, name, initials, account, onSignOut, header, bell, onSearch, tabs, onOpen, onMore, mainKey, notice, children }: {
  dark: boolean; collapsed: boolean; onCollapse: () => void; menuOpen: boolean; onMenu: (open: boolean) => void; nav: ReactNode;
  brand: string; name: string; initials: string; account: PanelAccountOption[]; onSignOut?: () => void;
  header: PanelHeader; bell: ReactNode; onSearch: (query: string) => void;
  tabs: PanelTab[]; onOpen: (href: string) => void; onMore: () => void; mainKey: string; notice?: ReactNode; children: ReactNode;
}) {
  usePanelMock(dark);
  const [accountOpen, setAccountOpen] = useState(false);
  useEffect(() => {
    if (!accountOpen && !menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setAccountOpen(false); onMenu(false); } };
    window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close);
  }, [accountOpen, menuOpen, onMenu]);
  return <div className={`m desk${collapsed ? ' col' : ''}${menuOpen ? ' pv-menu' : ''}`} id="pv-panel">
    <a className="pv-skip" href="#nv-main">Ir al contenido</a>
    <aside className="sb" aria-label="Consultorio">
      <button type="button" className="sbt" aria-label={collapsed ? 'Desplegar el menú' : 'Plegar el menú'} aria-expanded={!collapsed} aria-controls="pv-panel-nav" onClick={onCollapse}><PanelBocetoIcon name="back" /></button>
      <div className="sbin"><div className="brand"><img src="/panel-boceto/logo.png" alt="Logo de Plan V" /><div className="lbl"><b>Plan V</b><span>{brand}</span></div></div>{nav}
        <div className="me">
          <button type="button" className="pv-me" aria-label="Opciones de la cuenta" aria-expanded={accountOpen} aria-controls="pv-account" onClick={() => setAccountOpen(open => !open)}><span className="av">{initials}</span><div className="lbl"><b>{name}</b><span>Nutricionista</span></div></button>
          {onSignOut && <span className="lbl" style={{ marginLeft: 'auto', color: 'var(--mut)' }}><button type="button" className="pv-out" aria-label="Cerrar sesión" title="Cerrar sesión" onClick={onSignOut}><PanelBocetoIcon name="out" size={18} /></button></span>}
        </div>
        <div className={`pmenu${accountOpen ? ' open' : ''}`} id="pv-account" inert={!accountOpen}>{account.map(option => <button type="button" className="po" key={option.label} onClick={() => { setAccountOpen(false); option.onSelect(); }}><PanelBocetoIcon name={option.glyph} size={18} /><div><b>{option.label}</b>{option.detail && <small>{option.detail}</small>}</div></button>)}</div>
      </div>
    </aside>
    <div className="scrim" role="presentation" onClick={() => onMenu(false)} />
    <main className="main" id="nv-main" tabIndex={-1} key={mainKey}>
      <PanelHeaderBar header={header} bell={bell} onSearch={onSearch} />
      {notice}
      {children}
    </main>
    <nav className="bn" aria-label="Secciones principales">{tabs.map(tab => <a key={tab.label} href={tab.href ?? '#pv-panel-nav'} aria-current={tab.on ? 'page' : undefined} onClick={event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); if (tab.href) onOpen(tab.href); else onMore();
    }}><span className={tab.on ? 'on' : undefined}><PanelBocetoIcon name={tab.glyph} />{tab.label}</span></a>)}</nav>
  </div>;
}
