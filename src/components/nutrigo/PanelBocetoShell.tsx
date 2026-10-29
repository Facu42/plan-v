import { createContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { PanelV29Icon } from './PanelV29Icon';
import { aplicarPrefsGuardadas } from './ajustes-prefs';
import type { PanelV29IconName } from './panel-v29-icons';
import '@fontsource/inter/latin-300.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import './panel-v29.css';
import './panel-boceto.css';
import './panel-boceto-app.css';
import './panel-v29-app.css';

export type PanelAccountOption = { label: string; detail?: string; glyph: PanelV29IconName; onSelect: () => void };
export type PanelTab = { label: string; glyph: PanelV29IconName; href?: string; on?: boolean; count?: number };
export type PanelHeader = { when?: string; title: string; titleSuffix?: string; search: string; wideSearch?: boolean; actions?: ReactNode; /** La pantalla dibuja su propio encabezado (la Ficha): sin título ni buscador arriba. */ bare?: boolean };

/** La campana de avisos, para las pantallas que la llevan dentro de su propio encabezado. Vacía en el celular, donde vive en la barra de arriba. */
export const PanelBellContext = createContext<ReactNode>(null);

/** Las pantallas que todavía no se pasaron leen `data-mock` en <html>. */
export function usePanelMock(dark: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.mock = dark ? 'dark' : 'light';
    return () => { delete root.dataset.mock; };
  }, [dark]);
}

/** El boceto enciende el celular real con el ancho interior menor a 760. */
function useNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 759px)');
    const update = () => setNarrow(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return narrow;
}

/** Armazón del boceto v29: menú `.side`, columna `.main` y, en el celular, barra de arriba y de abajo. */
export function PanelBocetoShell({ dark, collapsed, onCollapse, menuOpen, onMenu, nav, brand, name, initials, account, onSignOut, header, bell, onSearch, tabs, onOpen, onMore, mainKey, notice, children }: {
  dark: boolean; collapsed: boolean; onCollapse: () => void; menuOpen: boolean; onMenu: (open: boolean) => void; nav: ReactNode;
  brand: string; name: string; initials: string; account: PanelAccountOption[]; onSignOut?: () => void;
  header: PanelHeader; bell: ReactNode; onSearch: (query: string) => void;
  tabs: PanelTab[]; onOpen: (href: string) => void; onMore: () => void; mainKey: string; notice?: ReactNode; children: ReactNode;
}) {
  usePanelMock(dark);
  const narrow = useNarrow();
  const folded = collapsed && !narrow;
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const wantSearch = useRef(false);
  useEffect(() => { aplicarPrefsGuardadas(); }, []);
  useEffect(() => {
    const focus = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); input.current?.focus(); }
    };
    window.addEventListener('keydown', focus);
    return () => window.removeEventListener('keydown', focus);
  }, []);
  useEffect(() => {
    if (!accountOpen && !menuOpen) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setAccountOpen(false); onMenu(false); } };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [accountOpen, menuOpen, onMenu]);
  useEffect(() => {
    if (menuOpen && wantSearch.current) { wantSearch.current = false; input.current?.focus(); }
  }, [menuOpen]);
  const search = (event: FormEvent) => { event.preventDefault(); onSearch(query.trim()); };
  const openSearch = () => { wantSearch.current = true; onMenu(true); input.current?.focus(); };
  const appClass = `app${folded ? ' mcol' : ''}${narrow && menuOpen ? ' mdr' : ''}`;
  return <div id="pv-panel-v29" data-theme={dark ? 'dark' : 'light'} className={narrow ? 'mob mreal' : undefined}>
    <a className="pv-skip" href="#nv-main">Ir al contenido</a>
    <div className={appClass}>
      <header className="mhd">
        <button type="button" className="ibtn" aria-label="Abrir menú" aria-expanded={menuOpen} onClick={() => onMenu(!menuOpen)}><PanelV29Icon name="menu" /></button>
        <span className="mk">V</span><b>Plan V</b><span className="sp" />
        <button type="button" className="ibtn" aria-label="Buscar" onClick={openSearch}><PanelV29Icon name="search" /></button>
        {narrow ? bell : null}
        <button type="button" className="av" style={{ background: 'var(--azaf)' }} aria-label="Opciones de la cuenta" onClick={() => { onMenu(true); setAccountOpen(true); }}>{initials}</button>
      </header>
      <div className="mscrim" role="presentation" onClick={() => onMenu(false)} />
      <aside className="side" aria-label="Consultorio">
        <div className="logo"><span className="mk">V</span><div><b>Plan V</b><small>{brand}</small></div></div>
        <button type="button" className="fold" aria-label={folded ? 'Abrir menú' : 'Plegar menú'} aria-expanded={!folded} aria-controls="pv-panel-nav" onClick={onCollapse}><PanelV29Icon name="left" /></button>
        <form className="srch" role="search" onSubmit={search}>
          <PanelV29Icon name="search" />
          <input ref={input} type="search" aria-label={header.search} placeholder="Buscar…" value={query} onChange={event => setQuery(event.target.value)} />
          <kbd>⌘K</kbd>
        </form>
        {nav}
        <button type="button" className="acct" aria-label="Opciones de la cuenta" aria-expanded={accountOpen} aria-controls="pv-account" onClick={() => setAccountOpen(open => !open)}>
          <span className="av" style={{ background: 'var(--azaf)' }}>{initials}</span>
          <div><b>{name}</b><small>Nutricionista</small></div>
        </button>
        <div className="pv-acct" id="pv-account" hidden={!accountOpen} inert={!accountOpen}>
          {account.map(option => <button type="button" key={option.label} onClick={() => { setAccountOpen(false); option.onSelect(); }}><PanelV29Icon name={option.glyph} /><span><b>{option.label}</b>{option.detail && <small>{option.detail}</small>}</span></button>)}
          {onSignOut && <button type="button" aria-label="Cerrar sesión" onClick={() => { setAccountOpen(false); onSignOut(); }}><PanelV29Icon name="door" /><span><b>Cerrar sesión</b></span></button>}
        </div>
      </aside>
      <main className="main" id="nv-main" tabIndex={-1}>
        {header.bare ? null : <div className="top">
          <div><h1>{header.title}{header.titleSuffix ? <> <span>{header.titleSuffix}</span></> : null}</h1>{header.when && <div className="date">{header.when}</div>}</div>
          <div className="sp" />
          {header.actions}
          {!narrow && bell}
        </div>}
        <PanelBellContext.Provider value={narrow ? null : bell}><div id="pv-panel" className="m" key={mainKey}>{notice}{children}</div></PanelBellContext.Provider>
      </main>
      <nav className="mnav" aria-label="Accesos">{tabs.map(tab => <button type="button" key={tab.label} className={tab.on ? 'on' : undefined} onClick={() => { if (tab.href) onOpen(tab.href); else onMore(); }}>
        <PanelV29Icon name={tab.glyph} size={19} /><span>{tab.label}</span>{tab.count ? <b className="num">{tab.count}</b> : null}
      </button>)}</nav>
    </div>
  </div>;
}
