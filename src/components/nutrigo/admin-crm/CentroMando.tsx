import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../../../api/client';
import type { CentroCobros, CentroNutri, CentroPacientes, CentroResumen, CentroSalud, CentroSeguridad } from '../../../types/centro';
import { CobrosView, CentroState, NutrisView, PacientesView, ResumenView, SaludView, SeguridadView } from './centro-views';
import { initials } from './centro-format';
import { NdIcon } from './nd-icon';
import './nd-styles.css';

export const CENTRO_VIEWS = ['resumen', 'nutris', 'pacientes', 'cobros', 'salud', 'seguridad'] as const;
export type CentroView = (typeof CENTRO_VIEWS)[number];

const NAV: { group: string; items: { id: CentroView; label: string; icon: string }[] }[] = [
  { group: 'Servicio', items: [
    { id: 'resumen', label: 'Resumen', icon: 'home' },
    { id: 'nutris', label: 'Nutris', icon: 'users' },
    { id: 'pacientes', label: 'Pacientes', icon: 'users' },
    { id: 'cobros', label: 'Cobros', icon: 'peso' },
  ] },
  { group: 'Sistema', items: [
    { id: 'salud', label: 'Salud', icon: 'bolt' },
    { id: 'seguridad', label: 'Seguridad', icon: 'plug' },
  ] },
];

const TITLES: Record<CentroView, [string, string]> = {
  resumen: ['Centro de mando', 'Resumen'],
  nutris: ['Cuentas', 'Nutris'],
  pacientes: ['Agregados', 'Pacientes'],
  cobros: ['Plataforma', 'Cobros'],
  salud: ['Operación', 'Salud'],
  seguridad: ['Acceso', 'Seguridad'],
};

function parseView(hash: string): CentroView {
  const raw = hash.replace(/^#\/?/, '').trim();
  return (CENTRO_VIEWS as readonly string[]).includes(raw) ? raw as CentroView : 'resumen';
}

type CentroData = {
  resumen?: CentroResumen;
  nutris?: CentroNutri[];
  pacientes?: CentroPacientes;
  cobros?: CentroCobros;
  salud?: CentroSalud;
  seguridad?: CentroSeguridad;
};

function loadView(view: CentroView) {
  if (view === 'resumen') return api.getCentroResumen().then((row) => ({ resumen: row.resumen }));
  if (view === 'nutris') return api.getCentroNutris().then((row) => ({ nutris: row.nutris }));
  if (view === 'pacientes') return api.getCentroPacientes().then((row) => ({ pacientes: row.pacientes }));
  if (view === 'cobros') return api.getCentroCobros().then((row) => ({ cobros: row.cobros }));
  if (view === 'salud') return api.getCentroSalud().then((row) => ({ salud: row.salud }));
  return api.getCentroSeguridad().then((row) => ({ seguridad: row.seguridad }));
}

export function CentroMando({ adminName }: { adminName?: string }) {
  const [view, setView] = useState<CentroView>(() => parseView(typeof window === 'undefined' ? '' : window.location.hash));
  const [data, setData] = useState<CentroData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'auth' | 'forbidden' | 'mfa' | 'other' | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const go = useCallback((next: CentroView) => {
    setView(next);
    setSidebarOpen(false);
    try {
      const hash = `#/${next}`;
      if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
    } catch { /* file:// */ }
  }, []);

  useEffect(() => {
    const onHash = () => setView(parseView(window.location.hash));
    window.addEventListener('hashchange', onHash);
    try {
      const hash = `#/${view}`;
      if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
    } catch { /* file:// */ }
    return () => window.removeEventListener('hashchange', onHash);
  }, [view]);

  const refresh = useCallback(async (next = view) => {
    setLoading(true);
    setError(null);
    try {
      const chunk = await loadView(next);
      setData((current) => ({ ...current, ...chunk }));
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) setError('auth');
      else if (cause instanceof ApiError && cause.status === 403 && /dos pasos/i.test(cause.message)) setError('mfa');
      else if (cause instanceof ApiError && cause.status === 403) setError('forbidden');
      else setError('other');
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => { void refresh(view); }, [refresh, view]);

  const who = useMemo(() => ({ name: adminName || 'Administración', role: 'Administración · Nutridash' }), [adminName]);
  const [kicker, title] = TITLES[view];

  let body = null;
  if (error === 'auth') body = <CentroState title="Entrá de nuevo" description="Se cortó la sesión. Volvé a entrar para ver el centro de mando." />;
  else if (error === 'forbidden') body = <CentroState title="No tenés permiso para ver esta pantalla" description="El centro de mando es solo para quien administra Nutridash." />;
  else if (error === 'mfa') body = <CentroState title="Falta la verificación en dos pasos" description="Para /admin hay que completar el segundo paso, aunque el interruptor general esté apagado." />;
  else if (error === 'other') body = <CentroState title="No se pudieron cargar los datos" description="Reintentá en un momento." action={<button type="button" className="nd-btn" onClick={() => void refresh()}>Reintentar</button>} />;
  else if (loading && !data[view === 'nutris' ? 'nutris' : view]) body = <CentroState title="Cargando…" description="Estamos trayendo los datos reales del servicio." />;
  else if (view === 'resumen' && data.resumen) body = <ResumenView data={data.resumen} adminName={adminName} />;
  else if (view === 'nutris' && data.nutris) body = <NutrisView data={data.nutris} />;
  else if (view === 'pacientes' && data.pacientes) body = <PacientesView data={data.pacientes} />;
  else if (view === 'cobros' && data.cobros) body = <CobrosView data={data.cobros} />;
  else if (view === 'salud' && data.salud) body = <SaludView data={data.salud} />;
  else if (view === 'seguridad' && data.seguridad) body = <SeguridadView data={data.seguridad} />;
  else body = <CentroState title="Cargando…" description="Estamos trayendo los datos reales del servicio." />;

  return (
    <div className="nd-admin-crm">
      <div className="nd-app" id="app">
        <aside className={`nd-sidebar${sidebarOpen ? ' is-open' : ''}`} id="sidebar" aria-label="Navegación principal">
          <div className="nd-brand">
            <img className="nd-brand-logo" src="/nutridash-logo.png" alt="Logo Nutridash" width={42} height={42} />
            <div className="nd-brand-text">
              <div className="nd-brand-name">Nutri<em>dash</em></div>
              <div className="nd-brand-sub">Plan V · Centro de mando</div>
            </div>
          </div>
          <nav className="nd-nav">
            {NAV.map((group) => (
              <div key={group.group}>
                <div className="nd-nav-label">{group.group}</div>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`nd-nav-item${view === item.id ? ' is-active' : ''}`}
                    aria-current={view === item.id ? 'page' : undefined}
                    onClick={() => go(item.id)}
                  >
                    <NdIcon name={item.icon} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
          <div className="nd-side-foot">
            <div className="nd-user">
              <span className="nd-avatar" aria-hidden="true">{initials(who.name)}</span>
              <div className="nd-grow">
                <div className="nd-user-name">{who.name}</div>
                <div className="nd-user-role">{who.role}</div>
              </div>
            </div>
          </div>
        </aside>
        <div className="nd-shell">
          <header className="nd-topbar" id="topbar">
            <button type="button" className="nd-icon-btn nd-menu-btn" aria-label="Abrir menú" onClick={() => setSidebarOpen((open) => !open)}>
              <NdIcon name="menu" />
            </button>
            <div className="nd-crumb">
              <span className="nd-crumb-kicker">{kicker}</span>
              <span className="nd-crumb-title">{title}</span>
              <span className="nd-badge" title="Datos reales del servicio">Datos reales</span>
            </div>
            <div className="nd-top-actions">
              <button type="button" className="nd-btn" onClick={() => void refresh()} aria-label="Actualizar">
                <NdIcon name="refresh" />Actualizar
              </button>
            </div>
          </header>
          <main className="nd-view" id="view" tabIndex={-1}>{body}</main>
        </div>
      </div>
    </div>
  );
}
