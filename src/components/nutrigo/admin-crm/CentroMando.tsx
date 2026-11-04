import { Campanias } from './Campanias';
import { campaignApi } from '../../../api/admin-campaigns';
import type { CampaignConfig } from '../../../types/admin-campaigns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../../../api/client';
import type { CentroSalud, CentroSeguridad, PlanesBoard } from '../../../types/centro';
import type { HubActivacion, HubBandeja, HubCobranza, HubConexiones, HubFacturacion, HubFicha, HubInicio, HubLead, HubLeadStage, HubNutri, HubRiesgo, HubRiesgoMotivo, HubSeguimiento } from '../../../types/hub';
import { CentroState, SaludView, SeguridadView } from './centro-views';
import { BandejaView, ConexionesView, FacturacionView, InicioView, NutrisHubView, PipelineView } from './hub-views';
import { ActivacionView, CobranzaView, RiesgoView } from './hub-ops-views';
import { useHubMotion } from './hub-motion';
import { PlanesPrecios } from './PlanesPrecios';
import { initials } from './centro-format';
import { NdIcon } from './nd-icon';
import './nd-styles.css';

export const CENTRO_VIEWS = ['inicio', 'nutris', 'riesgo', 'pipeline', 'facturacion', 'cobranza', 'bandeja', 'conexiones', 'activacion', 'campanias', 'planes', 'salud', 'seguridad'] as const;
export type CentroView = (typeof CENTRO_VIEWS)[number];

const ALIAS: Record<string, CentroView> = {
  resumen: 'inicio',
  pacientes: 'nutris',
  cobros: 'facturacion',
};

const NAV: { group: string; items: { id: CentroView; label: string; icon: string }[] }[] = [
  { group: 'Gestión', items: [
    { id: 'inicio', label: 'Inicio', icon: 'home' },
    { id: 'nutris', label: 'Nutris', icon: 'users' },
    { id: 'riesgo', label: 'Riesgo', icon: 'alert' },
    { id: 'pipeline', label: 'Pipeline', icon: 'pipeline' },
    { id: 'facturacion', label: 'Facturación', icon: 'peso' },
    { id: 'cobranza', label: 'Cobranza', icon: 'peso' },
    { id: 'bandeja', label: 'Bandeja', icon: 'inbox' },
    { id: 'conexiones', label: 'Conexiones', icon: 'plug' },
    { id: 'activacion', label: 'Activación', icon: 'check_circle' },
    { id: 'campanias', label: 'Campañas', icon: 'inbox' },
  ] },
  { group: 'Plataforma', items: [
    { id: 'planes', label: 'Planes y precios', icon: 'peso' },
  ] },
  { group: 'Sistema', items: [
    { id: 'salud', label: 'Salud', icon: 'bolt' },
    { id: 'seguridad', label: 'Seguridad', icon: 'check_circle' },
  ] },
];

const TITLES: Record<CentroView, [string, string]> = {
  inicio: ['Gestión', 'Inicio'],
  nutris: ['Cuentas', 'Nutris'],
  riesgo: ['Cuentas', 'Riesgo de baja'],
  pipeline: ['Comercial', 'Pipeline'],
  facturacion: ['Plataforma', 'Facturación'],
  cobranza: ['Plataforma', 'Cobranza'],
  bandeja: ['Mensajes', 'Bandeja'],
  conexiones: ['Mensajes', 'Conexiones'],
  activacion: ['Cuentas', 'Activación'],
  campanias: ['Comercial', 'Campañas'],
  planes: ['Plataforma', 'Planes y precios'],
  salud: ['Sistema', 'Salud'],
  seguridad: ['Sistema', 'Seguridad'],
};

function parseHash(hash: string): { view: CentroView; id: string } {
  const [rawView, id] = hash.replace(/^#\/?/, '').trim().split('/');
  const aliased = ALIAS[rawView] ?? rawView;
  const view = (CENTRO_VIEWS as readonly string[]).includes(aliased) ? aliased as CentroView : 'inicio';
  return { view, id: id ?? '' };
}

type CentroData = {
  campaigns?: CampaignConfig;
  inicio?: HubInicio;
  nutris?: HubNutri[];
  ficha?: HubFicha | null;
  leads?: HubLead[];
  seguimientos?: HubSeguimiento[];
  leadsNota?: string;
  leadsOk?: boolean;
  riesgos?: HubRiesgo[];
  riesgoDias?: number;
  riesgoNota?: string;
  cobranza?: HubCobranza;
  activacion?: HubActivacion;
  facturacion?: HubFacturacion;
  bandeja?: HubBandeja;
  conexiones?: HubConexiones;
  planes?: PlanesBoard;
  salud?: CentroSalud;
  seguridad?: CentroSeguridad;
};

function mensaje(error: unknown): string {
  if (!(error instanceof ApiError)) return 'No se pudo guardar.';
  try {
    const body = JSON.parse(error.message) as { error?: string };
    if (body.error) return body.error;
  } catch { /* el texto ya es el mensaje */ }
  return error.message;
}

export function CentroMando({ adminName }: { adminName?: string }) {
  const initial = parseHash(typeof window === 'undefined' ? '' : window.location.hash);
  const [view, setView] = useState<CentroView>(initial.view);
  const [nutriId, setNutriId] = useState(initial.id);
  const [data, setData] = useState<CentroData>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [error, setError] = useState<'auth' | 'forbidden' | 'mfa' | 'other' | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const motionRef = useHubMotion(`${view}:${loading ? 'load' : 'ready'}:${nutriId}`);

  const go = useCallback((next: CentroView, id = '') => {
    setView(next);
    setNutriId(id);
    setSidebarOpen(false);
    setFormError('');
    try {
      const hash = id ? `#/${next}/${id}` : `#/${next}`;
      if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
    } catch { /* file:// */ }
  }, []);

  useEffect(() => {
    const onHash = () => {
      const parsed = parseHash(window.location.hash);
      setView(parsed.view);
      setNutriId(parsed.id);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const refresh = useCallback(async (next = view, id = nutriId) => {
    setLoading(true);
    setError(null);
    try {
      if (next === 'inicio') {
        const inicio = (await api.getHubInicio()).inicio;
        setData((current) => ({ ...current, inicio }));
      }
      else if (next === 'nutris') {
        const nutris = (await api.getHubNutris()).nutris;
        const ficha = id ? (await api.getHubFicha(id)).ficha : null;
        setData((current) => ({ ...current, nutris, ficha }));
      } else if (next === 'riesgo') {
        const riesgo = await api.getHubRiesgo();
        setData((current) => ({ ...current, riesgos: riesgo.items, riesgoDias: riesgo.dias, riesgoNota: riesgo.nota }));
      } else if (next === 'pipeline') {
        const leads = await api.getHubLeads();
        setData((current) => ({ ...current, leads: leads.leads, seguimientos: leads.seguimientos, leadsNota: leads.nota, leadsOk: leads.disponible }));
      } else if (next === 'cobranza') {
        const cobranza = (await api.getHubCobranza()).cobranza;
        setData((current) => ({ ...current, cobranza }));
      } else if (next === 'activacion') {
        const activacion = (await api.getHubActivacion()).activacion;
        setData((current) => ({ ...current, activacion }));
      } else if (next === 'facturacion') {
        const facturacion = (await api.getHubFacturacion()).facturacion;
        setData((current) => ({ ...current, facturacion }));
      } else if (next === 'bandeja') {
        const bandeja = (await api.getHubBandeja()).bandeja;
        setData((current) => ({ ...current, bandeja }));
      } else if (next === 'conexiones') {
        const conexiones = (await api.getHubConexiones()).conexiones;
        setData((current) => ({ ...current, conexiones }));
      } else if (next === 'campanias') {
        const campaigns = await campaignApi.config();
        setData((current) => ({ ...current, campaigns }));
      } else if (next === 'planes') {
        const row = await api.getPlanes();
        setData((current) => ({ ...current, planes: { plans: row.plans, changes: row.changes, testers: row.testers, editable: row.editable } }));
      } else if (next === 'salud') {
        const salud = (await api.getCentroSalud()).salud;
        setData((current) => ({ ...current, salud }));
      } else {
        const seguridad = (await api.getCentroSeguridad()).seguridad;
        setData((current) => ({ ...current, seguridad }));
      }
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) setError('auth');
      else if (cause instanceof ApiError && cause.status === 403 && /dos pasos/i.test(cause.message)) setError('mfa');
      else if (cause instanceof ApiError && cause.status === 403) setError('forbidden');
      else setError('other');
    } finally {
      setLoading(false);
    }
  }, [nutriId, view]);

  useEffect(() => { void refresh(view, nutriId); }, [refresh, view, nutriId]);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setFormError('');
    try { await work(); } catch (cause) { setFormError(mensaje(cause)); } finally { setBusy(false); }
  };

  const who = useMemo(() => ({ name: adminName || 'Administración', role: 'Administración · Nutridash' }), [adminName]);
  const [kicker, title] = TITLES[view];
  const listo = !loading && !error;

  let body = null;
  if (error === 'auth') body = <CentroState title="Entrá de nuevo" description="Se cortó la sesión. Volvé a entrar para ver el centro de mando." />;
  else if (error === 'forbidden') body = <CentroState title="No tenés permiso para ver esta pantalla" description="El centro de mando es solo para quien administra Nutridash." />;
  else if (error === 'mfa') body = <CentroState title="Falta la verificación en dos pasos" description="Para /admin hay que completar el segundo paso, aunque el interruptor general esté apagado." />;
  else if (error === 'other') body = <CentroState title="No se pudieron cargar los datos" description="Reintentá en un momento." action={<button type="button" className="nd-btn is-action" onClick={() => void refresh()}>Reintentar</button>} />;
  else if (!listo) body = <CentroState title="Cargando…" description="Estamos trayendo los datos reales del servicio." />;
  else if (view === 'inicio' && data.inicio) body = <InicioView data={data.inicio} />;
  else if (view === 'nutris' && data.nutris) body = (
    <NutrisHubView
      rows={data.nutris}
      ficha={data.ficha ?? null}
      busy={busy}
      error={formError}
      onOpen={(id) => go('nutris', id)}
      onNota={(id, text) => void run(async () => {
        const ficha = (await api.addHubNota(id, text)).ficha;
        setData((current) => ({ ...current, ficha }));
      })}
      onTarea={(id, text) => void run(async () => {
        const ficha = (await api.addHubTarea(id, text)).ficha;
        setData((current) => ({ ...current, ficha }));
      })}
      onToggle={(id, done) => void run(async () => {
        await api.toggleHubTarea(id, done);
        if (!nutriId) return;
        const ficha = (await api.getHubFicha(nutriId)).ficha;
        setData((current) => ({ ...current, ficha }));
      })}
    />
  );
  else if (view === 'pipeline' && data.leads) body = (
    <PipelineView
      leads={data.leads}
      disponible={data.leadsOk !== false}
      nota={data.leadsNota ?? ''}
      busy={busy}
      error={formError}
      seguimientos={data.seguimientos ?? []}
      onCreate={(input) => void run(async () => {
        await api.createHubLead(input);
        const leads = await api.getHubLeads();
        setData((current) => ({ ...current, leads: leads.leads, seguimientos: leads.seguimientos, leadsNota: leads.nota, leadsOk: leads.disponible }));
      })}
      onStage={(id, stage: HubLeadStage) => void run(async () => {
        await api.patchHubLead(id, { stage });
        const leads = await api.getHubLeads();
        setData((current) => ({ ...current, leads: leads.leads, seguimientos: leads.seguimientos }));
      })}
    />
  );
  else if (view === 'riesgo' && data.riesgos) body = (
    <RiesgoView items={data.riesgos} dias={data.riesgoDias ?? 14} nota={data.riesgoNota ?? ''} onFiltrar={(motivo: HubRiesgoMotivo | '') => void run(async () => {
      const riesgo = await api.getHubRiesgo(motivo || undefined);
      setData((current) => ({ ...current, riesgos: riesgo.items }));
    })} />
  );
  else if (view === 'cobranza' && data.cobranza) body = (
    <CobranzaView
      data={data.cobranza}
      busy={busy}
      error={formError}
      onAviso={(id) => void run(async () => {
        const cobranza = (await api.cobranzaHub(id, 'aviso')).cobranza;
        setData((current) => ({ ...current, cobranza }));
      })}
      onReleer={(id) => void run(async () => {
        const cobranza = (await api.cobranzaHub(id, 'releer')).cobranza;
        setData((current) => ({ ...current, cobranza }));
      })}
    />
  );
  else if (view === 'activacion' && data.activacion) body = <ActivacionView data={data.activacion} />;
  else if (view === 'facturacion' && data.facturacion) body = <FacturacionView data={data.facturacion} />;
  else if (view === 'bandeja' && data.bandeja) body = (
    <BandejaView
      data={data.bandeja}
      busy={busy}
      error={formError}
      onAnotar={(input) => void run(async () => {
        const bandeja = (await api.anotarHubMensaje(input)).bandeja;
        setData((current) => ({ ...current, bandeja }));
      })}
      onLead={(id) => void run(async () => {
        const bandeja = (await api.crearLeadDesdeMensaje(id)).bandeja;
        setData((current) => ({ ...current, bandeja }));
      })}
      onSugerir={(id) => void run(async () => {
        const bandeja = (await api.sugerirHubRespuesta(id)).bandeja;
        setData((current) => ({ ...current, bandeja }));
      })}
      onEnviar={(id, texto) => void run(async () => {
        const bandeja = (await api.enviarHubRespuesta(id, texto)).bandeja;
        setData((current) => ({ ...current, bandeja }));
      })}
    />
  );
  else if (view === 'conexiones' && data.conexiones) body = <ConexionesView data={data.conexiones} />;
  else if (view === 'campanias' && data.campaigns) body = <Campanias config={data.campaigns} />;
  else if (view === 'planes' && data.planes) body = <PlanesPrecios data={data.planes} onSaved={(planes) => setData((current) => ({ ...current, planes }))} />;
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
        <div className={`nd-shell${view === 'planes' ? ' is-planes' : ''}`}>
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
              <button type="button" className="nd-btn is-action" onClick={() => void refresh()} aria-label="Actualizar">
                <NdIcon name="refresh" />Actualizar
              </button>
            </div>
          </header>
          <main className="nd-view" id="view" ref={motionRef} tabIndex={-1}>{body}</main>
        </div>
      </div>
    </div>
  );
}
